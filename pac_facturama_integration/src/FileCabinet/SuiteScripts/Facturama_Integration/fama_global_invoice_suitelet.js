/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 * 
 * SADS Facturama - Adaptador de Entrada (Driving Adapter / UI)
 * 
 * Arquitectura: Hexagonal (Ports and Adapters)
 * Descripción: Interfaz de usuario para la Facturación Global. Recolecta la intención 
 * del usuario, persiste los datos en un DTO (Custom Record) y delega la ejecución 
 * asíncrona al Orquestador (Map/Reduce) cumpliendo el Principio de Responsabilidad Única.
 */
define([
    'N/ui/serverWidget', 
    'N/runtime', 
    'N/error', 
    'N/task', 
    'N/redirect', 
    'N/ui/message', 
    'N/record', 
    'N/search',
    './fama_global_invoice_library'
], function (ui, runtime, error, task, redirect, message, record, search, lib) {
    'use strict';

    // ==========================================
    // 1. CONSTANTES DEL SISTEMA (Clean Code)
    // ==========================================
    var CONSTANTS = {
        RECORDS: {
            CFDI_USAGE: 'customrecord_mx_sat_cfdi_usage',
            PAYMENT_METHOD: 'customrecord_mx_mapper_values',
            PAYMENT_TERM: 'customrecord_mx_sat_payment_term',
            PERIODICITY: 'customrecord_mcf_sat_recurrence',
            MONTHS: 'customrecord_mcf_sat_months',
            INTERCO_INVOICE: 'customrecord_drt_reg_facturacion_interco'
        },
        ORCHESTRATOR: {
            SCRIPT_ID: 'customscript_sads_fama_mr_global_orch',
            DEPLOY_ID: 'customdeploy_sads_fama_mr_global_orch'
        }
    };

    // ==========================================
    // 2. MÉTODOS DE LA INTERFAZ DE USUARIO
    // ==========================================

    /**
     * Construye y renderiza el formulario visual para el usuario (Fase GET).
     * @param {Object} context - El contexto inyectado por el framework de NetSuite.
     */
    function createForm(context) {
        var oScript = context.request.parameters;
        var idRegistroFacturacion = oScript.registroFacturacion;
        var oLabels = lib.getTranslate();
        
        var form = ui.createForm({
            title: oLabels.form
        });

        // 1. Manejo de Mensajes de Estado (UX)
        if (oScript.custparam_message === 'processed') {
            form.addPageInitMessage({
                type: message.Type.INFORMATION,
                message: oLabels.message1 + (idRegistroFacturacion || ''),
                duration: 10000
            });
        } else if (oScript.custparam_message === 'error') {
            form.addPageInitMessage({
                type: message.Type.WARNING,
                message: oLabels.message2,
                duration: 5000
            });
        }

        // 2. Enlace al Script de Cliente (Client Script)
        var scriptId = lib.getFilebyName('fama_global_invoice_client.js');
        if (scriptId) {
            form.clientScriptFileId = scriptId;
        }

        // 3. Construcción de Campos del Formulario
        _buildFormFields(form, oScript, oLabels);

        // 4. Construcción y Llenado de la Sublista de Transacciones
        var sublist = _buildSublist(form, oLabels);
        _populateSublist(sublist, oScript);

        // 5. Botones de Acción
        var strFuncName = 'reloadForm("' + (oScript.script || '') + '","' + (oScript.deploy || '') + '")';
        form.addButton({
            id: 'custpage_search',
            label: oLabels.button1,
            functionName: strFuncName
        });

        form.addSubmitButton({
            label: oLabels.button4
        });

        context.response.writePage(form);
    }

    // ==========================================
    // 3. CONTROLADOR DE PETICIONES (API Entry Point)
    // ==========================================

    /**
     * Punto de entrada principal del Suitelet. Enruta la petición según el verbo HTTP.
     * @param {Object} context - Objeto de contexto de la petición y respuesta.
     */
    function onRequest(context) {
        if (context.request.method === 'GET') {
            createForm(context);
        } else if (context.request.method === 'POST') {
            _handlePostRequest(context.request.parameters);
        }
    }

    // ==========================================
    // 4. FUNCIONES PRIVADAS (Responsabilidad Única - SRP)
    // ==========================================

    /**
     * Procesa el envío del formulario, guarda el estado y dispara el Orquestador.
     * @private
     * @param {Object} obj - Los parámetros capturados desde la petición POST.
     */
    function _handlePostRequest(obj) {
        var recIdFacturacion = null;

        try {
            // 1. Validar y Persistir la intención del usuario (Crear el Custom Record)
            if (obj.custpage_arreglo) {
                var customRecFacturacion = record.create({
                    type: CONSTANTS.RECORDS.INTERCO_INVOICE,
                    isDynamic: true
                });
                
                customRecFacturacion.setValue("custrecord_drt_start_date", obj.custpage_dateini);
                customRecFacturacion.setValue("custrecord_drt_end_date", obj.custpage_dateinie);
                customRecFacturacion.setText("custrecord_drt_xml_issue_date", obj.custpage_createdate);
                customRecFacturacion.setValue("custrecord_drt_subsidiary", obj.custpage_subsidiary);
                customRecFacturacion.setValue("custrecord_drt_customer", obj.custpage_customer);
                customRecFacturacion.setValue("custrecord_drt_cfdi_usage", obj.custpage_usecfdi);
                customRecFacturacion.setValue("custrecord_drt_sat_payment_method", obj.custpage_paymhetod);
                customRecFacturacion.setValue("custrecord_drt_sat_payment_term", obj.custpage_payform);
                var facturasArray = obj.custpage_arreglo.split(',');
                customRecFacturacion.setValue("custrecord_drt_facturas", facturasArray);
                customRecFacturacion.setValue("custrecord_drt_periodicidad", obj.custpage_periodicidad);
                customRecFacturacion.setValue("custrecord_drt_meses", obj.custpage_meses);
                customRecFacturacion.setValue("custrecord_drt_anio", obj.custpage_anio);
                customRecFacturacion.setValue("custrecord_drt_status", "PROCESANDO");

                recIdFacturacion = customRecFacturacion.save();
                log.audit("Registro Pivote Creado", "ID: " + recIdFacturacion);
            }

            // 2. Invocar el Orquestador (Mediator) mediante Arquitectura Desacoplada (KISS)
            var scriptTask = task.create({
                taskType: task.TaskType.MAP_REDUCE
            });

            scriptTask.scriptId = CONSTANTS.ORCHESTRATOR.SCRIPT_ID;
            scriptTask.deploymentId = CONSTANTS.ORCHESTRATOR.DEPLOY_ID;
            
            // Inyección exclusiva de la "Llave Maestra" al Orquestador
            scriptTask.params = {
                'custscript_sads_fama_reg_fact_id': recIdFacturacion
            };

            var scriptTaskId = scriptTask.submit();
            log.audit("Orquestador Invocado Exitosamente", "Task ID: " + scriptTaskId);

            // 3. Redirección y Notificación al Usuario
            if (recIdFacturacion) {
                redirect.toSuitelet({
                    scriptId: 'customscript_fama_global_invoice_sl',
                    deploymentId: 'customdeploy_fama_global_invoice_sl',
                    parameters: {
                        'custparam_message': 'processed',
                        'registroFacturacion': recIdFacturacion
                    }
                });
            } else {
                redirect.toSuitelet({
                    scriptId: 'customscript_fama_global_invoice_sl',
                    deploymentId: 'customdeploy_fama_global_invoice_sl',
                    parameters: { 'custparam_message': 'error' }
                });
            }

        } catch (err) {
            // 🛡️ Compromise Recording: Extracción segura de errores y prevención de objetos vacíos
            var errorDetails = err.stack ? err.stack : (err.message || err.toString());
            log.error({ title: 'Fallo al invocar Map/Reduce', details: errorDetails });
            throw error.create({ 
                name: err.name || 'TASK_SUBMISSION_ERROR', 
                message: err.message || 'Error desconocido al invocar el proceso en segundo plano.' 
            });
        }
    }

    /**
     * Construye dinámicamente los campos del formulario.
     * @private
     */
    function _buildFormFields(form, params, oLabels) {
        form.addField({ id: 'custpage_dateini', type: ui.FieldType.DATE, label: oLabels.label5 })
            .updateDisplayType({ displayType: ui.FieldDisplayType.NORMAL })
            .defaultValue = params.pds || '';

        form.addField({ id: 'custpage_dateinie', type: ui.FieldType.DATE, label: oLabels.labe18 })
            .defaultValue = params.pde || '';

        form.addField({ id: 'custpage_createdate', type: ui.FieldType.DATETIMETZ, label: oLabels.label1 })
            .defaultValue = params.pdc || '';

        form.addField({ id: 'custpage_subsidiary', type: ui.FieldType.SELECT, label: oLabels.label7, source: 'subsidiary' })
            .updateBreakType({ breakType: ui.FieldBreakType.STARTCOL })
            .defaultValue = params.subsidiary || '';

        form.addField({ id: 'custpage_customer', type: ui.FieldType.SELECT, label: oLabels.label8, source: 'customer' })
            .defaultValue = params.cus || '';

        form.addField({ id: 'custpage_importe', type: ui.FieldType.CURRENCY, label: oLabels.label9 })
            .updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });

        form.addField({ id: 'custpage_arreglo', type: ui.FieldType.TEXT, label: oLabels.label10 })
            .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

        form.addField({ id: 'custpage_usecfdi', type: ui.FieldType.SELECT, label: oLabels.label2, source: CONSTANTS.RECORDS.CFDI_USAGE })
            .updateBreakType({ breakType: ui.FieldBreakType.STARTCOL })
            .defaultValue = params.ucfdi || 1;

        form.addField({ id: 'custpage_paymhetod', type: ui.FieldType.SELECT, label: oLabels.label3, source: CONSTANTS.RECORDS.PAYMENT_METHOD })
            .defaultValue = params.pm || 1;

        form.addField({ id: 'custpage_payform', type: ui.FieldType.SELECT, label: oLabels.label4, source: CONSTANTS.RECORDS.PAYMENT_TERM })
            .defaultValue = params.pf || 3;

        form.addField({ id: 'custpage_periodicidad', type: ui.FieldType.SELECT, label: oLabels.label11, source: CONSTANTS.RECORDS.PERIODICITY })
            .updateBreakType({ breakType: ui.FieldBreakType.STARTCOL })
            .defaultValue = params.per || 1;

        form.addField({ id: 'custpage_meses', type: ui.FieldType.SELECT, label: oLabels.label12, source: CONSTANTS.RECORDS.MONTHS })
            .defaultValue = params.mes || 1;

        form.addField({ id: 'custpage_anio', type: ui.FieldType.TEXT, label: oLabels.label13 })
            .defaultValue = params.ani || '';

        var fieldRows = form.addField({ id: 'custpage_rows', type: ui.FieldType.INTEGER, label: oLabels.label6 });
        fieldRows.updateDisplayType({ displayType: ui.FieldDisplayType.INLINE });
        fieldRows.updateBreakType({ breakType: ui.FieldBreakType.STARTCOL });
    }

    /**
     * Define la estructura de columnas de la sublista.
     * @private
     */
    function _buildSublist(form, oLabels) {
        var sublist = form.addSublist({
            id: 'custpage_transactions',
            type: ui.SublistType.LIST,
            label: oLabels.sublist
        });

        sublist.addMarkAllButtons();
        sublist.addField({ id: 'custpage_tranid', type: ui.FieldType.TEXT, label: oLabels.column2 });
        sublist.addField({ id: 'custpage_validar', type: ui.FieldType.CHECKBOX, label: oLabels.column6 });
        sublist.addField({ id: 'custpage_trandate', type: ui.FieldType.TEXT, label: oLabels.column3 });
        sublist.addField({ id: 'custpage_name', type: ui.FieldType.TEXT, label: oLabels.column4 });
        sublist.addField({ id: 'custpage_fxamount', type: ui.FieldType.CURRENCY, label: oLabels.column5 });
        sublist.addField({ id: 'custpage_createdby', type: ui.FieldType.TEXT, label: oLabels.column7 });
        
        sublist.addField({ id: 'custpage_internalid', type: ui.FieldType.TEXT, label: 'Internalid' })
               .updateDisplayType({ displayType: ui.FieldDisplayType.HIDDEN });

        return sublist;
    }

    /**
     * Extrae los datos desde la librería y los inyecta en la sublista.
     * @private
     */
    function _populateSublist(sublist, params) {
        try {
            var libParams = {
                subsidiary: params.subsidiary,
                datesearch: params.pds,
                datesearche: params.pde,
                customer: params.cus,
                paymentm: params.pm
            };

            var getTransaction = lib.getAllTransaction(libParams);
            
            if (getTransaction && getTransaction.length > 0) {
                for (var i = 0; i < getTransaction.length; i++) {
                    var recordLine = getTransaction[i];
                    sublist.setSublistValue({ id: 'custpage_trandate', line: i, value: recordLine.trandate });
                    sublist.setSublistValue({ id: 'custpage_tranid', line: i, value: recordLine.tranid });
                    sublist.setSublistValue({ id: 'custpage_name', line: i, value: recordLine.name });
                    sublist.setSublistValue({ id: 'custpage_fxamount', line: i, value: recordLine.fxamount });
                    sublist.setSublistValue({ id: 'custpage_createdby', line: i, value: recordLine.createdby });
                    sublist.setSublistValue({ id: 'custpage_internalid', line: i, value: recordLine.id });
                }
            }
        } catch (err) {
            log.error({ title: 'Error al llenar sublista', details: JSON.stringify(err) });
        }
    }

    return {
        onRequest: onRequest
    };
});
/**
 * refactor(ui-adapter): optimizar legibilidad, erradicar código muerto e integrar orquestador map/reduce
 * Descripción (Body):
 * Se reestructuró el adaptador de entrada (Suitelet) aplicando principios de Clean Code y Hexagonal Architecture:
 * * 🧹 Erradicación de Deuda Técnica: Se eliminaron extensos bloques de código comentado y constantes huérfanas de despliegues obsoletos (DRY y KISS), mejorando drásticamente la legibilidad del archivo.
 * * 🏗️ Modularización SRP: Se descompuso la función monolítica `createForm` en submétodos semánticos privados (`_buildFormFields`, `_buildSublist`, `_populateSublist`), delegando las responsabilidades de construcción visual y extracción de datos.
 * * 🛡️ Inversión de Control (IoC): Se sustituyó el obsoleto enrutamiento al `Scheduled Script` por la instanciación de la nueva topología `Map/Reduce`, reduciendo el acoplamiento al transmitir una única llave pivote (`custscript_sads_fama_reg_fact_id`).
 * * 🩺 Fail-Safe Logging: Se blindó la captura de excepciones en el bloque POST, garantizando la extracción del `stack trace` nativo del entorno para prevenir silenciamientos por fallos de serialización de objetos de error vacíos.
 */