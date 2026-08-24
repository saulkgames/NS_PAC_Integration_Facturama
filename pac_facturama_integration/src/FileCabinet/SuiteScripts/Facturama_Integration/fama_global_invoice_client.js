/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 * 
 * SADS Facturama - Adaptador de Entrada (Frontend / UI)
 * 
 * Arquitectura: Hexagonal (Ports and Adapters)
 * Descripción: Controla la interactividad en el navegador del usuario. Valida las 
 * reglas de negocio antes de permitir el envío al servidor (Fail-Safe) y manipula 
 * el DOM dinámicamente para recalcular totales (Observer Pattern).
 */
define(['N/currentRecord', 'N/url', 'N/format', 'N/ui/message', 'N/log'],

    function (currentRecord, url, format, message, log) {
        'use strict';

        /**
         * Evento de inicialización de la página.
         * @param {Object} context - Contexto de ejecución proveído por NetSuite.
         */
        function pageInit(context) {
            // Inicialización vacía por diseño. Se deja el hook preparado (Open/Closed Principle).
        }

        /**
         * Actúa como Guardián de Frontera (Gatekeeper) validando los datos antes de hacer el POST.
         * Aplica el principio Fail-Safe Defaults de Saltzer & Schroeder.
         * 
         * @param {Object} context - Contexto del evento de guardado.
         * @returns {boolean} Retorna true si los datos son válidos; false para bloquear el envío.
         */
        function saveRecord(context) {
            var rec = currentRecord.get();

            // 1. Validaciones de Campos Obligatorios (Reglas de Negocio SAT)
            if (!rec.getValue('custpage_usecfdi')) {
                showMessage('Capture el valor para el campo Uso de CFDI.');
                return false;
            }

            if (!rec.getValue('custpage_paymhetod')) {
                showMessage('Capture el valor para el campo Método de pago.');
                return false;
            }

            if (!rec.getValue('custpage_payform')) {
                showMessage('Capture el valor para el campo Forma de Pago.');
                return false;
            }

            if (!rec.getValue('custpage_dateini')) {
                showMessage('Capture el valor para el campo Fecha de Inicio.');
                return false;
            }

            if (!rec.getValue('custpage_dateinie')) {
                showMessage('Capture el valor para el campo Fecha de Fin.');
                return false;
            }

            // 2. Validación de UI: Existencia de líneas
            var sublistName = 'custpage_transactions';
            var rows = rec.getLineCount({ sublistId: sublistName });

            if (rows === 0) {
                showMessage('No hay registros a Procesar en la tabla.');
                return false;
            }

            // 3. 🛡️ BUGFIX (Defensa en Profundidad): Validación de Selección Real
            // Evita que se cree un registro pivote fantasma si el usuario no seleccionó ninguna casilla
            var arregloFacturas = rec.getValue('custpage_arreglo');
            if (!arregloFacturas || arregloFacturas.length === 0) {
                showMessage('Por favor, seleccione al menos una transacción marcando la casilla de verificación.');
                return false;
            }

            return true;
        }

        /**
         * Captura los filtros de la pantalla y recarga el Suitelet realizando una petición GET.
         * 
         * @param {string} scId - El Script ID del Suitelet.
         * @param {string} dpId - El Deployment ID del Suitelet.
         */
        function reloadForm(scId, dpId) {
            var rec = currentRecord.get();
            var trandate = '';
            var endDate = '';
            var created = '';

            // Formateo seguro de fechas
            if (rec.getValue('custpage_dateini')) {
                trandate = format.format({
                    value: rec.getValue('custpage_dateini'),
                    type: format.Type.DATE
                });
            }
            if (rec.getValue('custpage_dateinie')) {
                endDate = format.format({
                    value: rec.getValue('custpage_dateinie'),
                    type: format.Type.DATE
                });
            }
            if (rec.getValue('custpage_createdate')) {
                created = rec.getText('custpage_createdate');
            }

            var subsidiary = rec.getValue('custpage_subsidiary') || null;
            var ucfdi = rec.getValue('custpage_usecfdi') || null;
            var paymethod = rec.getValue('custpage_paymhetod') || null;
            var payformat = rec.getValue('custpage_payform') || null;
            var customer = rec.getValue('custpage_customer') || null;
            var periodicidad = rec.getValue('custpage_periodicidad') || null;
            var meses = rec.getValue('custpage_meses') || null;
            var anio = rec.getValue('custpage_anio');

            // Construcción dinámica de la URL (Aísla la lógica de enrutamiento)
            var scriptUrl = url.resolveScript({
                scriptId: scId,
                deploymentId: dpId,
                returnExternalUrl: false,
                params: {
                    subsidiary: subsidiary,
                    pde: endDate,
                    pds: trandate,
                    pdc: created,
                    ucfdi: ucfdi,
                    pm: paymethod,
                    pf: payformat,
                    cus: customer,
                    per: periodicidad,
                    mes: meses,
                    ani: anio,
                }
            });

            // Evitamos que el navegador pregunte si el usuario quiere abandonar la página
            window.onbeforeunload = null; 
            window.location.href = scriptUrl;
        }

        /**
         * Muestra notificaciones visuales nativas de NetSuite al usuario (UX).
         * 
         * @param {string} msg - El texto a mostrar en la advertencia.
         * @param {number} [time=3000] - Tiempo en milisegundos que el mensaje permanecerá visible.
         */
        function showMessage(msg, time) {
            if (!msg) return;
            
            var duration = time || 3000;
            
            var myMessage = message.create({
                title: 'ADVERTENCIA',
                message: msg,
                type: message.Type.WARNING
            });
            
            myMessage.show({
                duration: duration
            });
        }

        /**
         * Implementa el Patrón Observer (GoF). Escucha los cambios en la sublista 
         * para recalcular en tiempo real el importe total y actualizar el arreglo de IDs.
         * 
         * @param {Object} context - Objeto de contexto inyectado por NetSuite.
         * @param {Record} context.currentRecord - Referencia al registro actual en memoria.
         * @param {string} context.sublistId - ID de la sublista modificada.
         * @param {string} context.fieldId - ID del campo modificado.
         */
        function fieldChanged(context) {
            var currentRecord = context.currentRecord;
            var sublistName = context.sublistId;
            var sublistFieldName = context.fieldId;
            var totalSuma = 0;
            var counter = 0;
            var idInternoFacturas = [];

            // Solo recalculamos si el usuario hace clic en el checkbox 'custpage_validar'
            if (sublistName === 'custpage_transactions' && sublistFieldName === 'custpage_validar') {
                var lineasTotal = currentRecord.getLineCount({ sublistId: "custpage_transactions" });

                for (var i = 0; i < lineasTotal; i++) {
                    var isChecked = currentRecord.getSublistValue({
                        sublistId: 'custpage_transactions', 
                        fieldId: 'custpage_validar', 
                        line: i 
                    });

                    if (isChecked === true) {
                        var total = currentRecord.getSublistValue({
                            sublistId: 'custpage_transactions', 
                            fieldId: 'custpage_fxamount', 
                            line: i 
                        });

                        var idFactura = currentRecord.getSublistValue({
                            sublistId: 'custpage_transactions', 
                            fieldId: 'custpage_internalid', 
                            line: i 
                        });

                        totalSuma += total;
                        idInternoFacturas.push(idFactura);
                        counter++;
                    }
                }

                // Actualizamos los campos de cabecera con los resultados consolidados
                if (counter > 0) {
                    currentRecord.setValue({
                        fieldId: 'custpage_importe',
                        value: totalSuma.toFixed(2)
                    });

                    currentRecord.setValue({
                        fieldId: 'custpage_arreglo',
                        value: idInternoFacturas.join(',') // Garantizamos serialización consistente
                    });
                } else {
                    // Si desmarcó todo, reseteamos a cero
                    currentRecord.setValue({
                        fieldId: 'custpage_importe',
                        value: 0
                    });

                    currentRecord.setValue({
                        fieldId: 'custpage_arreglo',
                        value: ""
                    });
                }
            }
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            fieldChanged: fieldChanged,
            // Funciones personalizadas que son llamadas desde botones en la UI
            reloadForm: reloadForm 
        };
    });