/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * 
 * SADS Facturama - Orquestador Map/Reduce para Factura Global
 * 
 * Arquitectura: Hexagonal (Ports and Adapters) & Mediator Pattern
 * Descripción: Coordina la extracción masiva de tickets (Cash Sales), la transformación
 * de datos a través de la capa de Dominio, la comunicación con el PAC vía Adaptadores HTTP, 
 * la generación de archivos físicos y la actualización transaccional usando límites elásticos.
 */
define([
    'N/search',
    'N/record',
    'N/runtime',
    'N/email',
    'N/file',
    './lib/sads_fama_logger',
    './lib/sads_fama_config',
    './lib/sads_fama_global_mapper',
    './lib/sads_fama_api',
    './lib/sads_fama_files'
], function (search, record, runtime, email, file, logger, configModule, mapper, api, filesAdapter) {
    'use strict';

    // ==========================================
    // 1. CONSTANTES DEL SISTEMA (No Magic Strings)
    // ==========================================
    var CONSTANTS = {
        PARAM_REG_ID: 'custscript_sads_fama_reg_fact_id', // ID del Custom Record generado por la UI
        PARAM_TEMPLATE_ID: 'custscript_sads_fama_pdf_template', // ID de la Plantilla PDF (Advanced PDF/HTML)
        AUTHOR_ID: -5, // ID interno del empleado/sistema que envía el correo
        STATUS_SUCCESS: 'SUCCESS',
        STATUS_ERROR: 'ERROR',
        FOLDERS: {
            ROOT: '412704', // Carpeta padre por defecto (Fail-Safe)
            SUBSIDIARIES: {
                '2': '412710', // NH ACEROS
                '3': '412712', // ACEROS DE GUASAVE
                '4': '412708'  // PROVEEDORA DE FIERRO Y PERFILES
            }
        }
    };

    // ==========================================
    // 2. GET INPUT DATA (El Recolector)
    // ==========================================

    /**
     * Define la entrada de datos para la fase Map.
     * Patrón Fail-Safe: Falla rápido si no se provee el contexto inicial.
     * 
     * @param {Object} inputContext - Objeto inyectado por el framework de NetSuite.
     * @returns {Array} Un arreglo con un único objeto para forzar una sola ejecución de la etapa Map.
     * @throws {Error} Si el parámetro de ID de registro no está configurado.
     */
    function getInputData(inputContext) {
        try {
            var currentScript = runtime.getCurrentScript();
            var customRecordId = currentScript.getParameter({ name: CONSTANTS.PARAM_REG_ID });

            if (!customRecordId) {
                throw new Error('Falta el parámetro crítico: ID de Registro de Facturación Intercompañía.');
            }

            logger.write('1. INICIO MAP/REDUCE: Factura Global', { customRecordId: customRecordId });

            return [{ regId: customRecordId }];

        } catch (e) {
            logError('Fallo fatal en getInputData', e);
            throw e; // Interrumpe la ejecución del Map/Reduce completamente
        }
    }

    // ==========================================
    // 3. MAP (El Director de Orquesta - Fase 1)
    // ==========================================

    /**
     * Orquesta el flujo de negocio: Extracción, Mapeo, Timbrado y Generación de Archivos.
     * 
     * @param {Object} mapContext - Contexto de la fase Map, provee el método write() para pasar datos al Reduce.
     */
    function map(mapContext) {
        try {
            var data = JSON.parse(mapContext.value);
            var regId = data.regId;
            var currentScript = runtime.getCurrentScript();

            // 1. Extracción de Configuración de la UI (Costo: 1 Unidad)
            var lookupData = search.lookupFields({
                type: 'customrecord_drt_reg_facturacion_interco',
                id: regId,
                columns: [
                    'custrecord_drt_facturas',
                    'custrecord_drt_periodicidad',
                    'custrecord_drt_meses',
                    'custrecord_drt_anio',
                    'custrecord_drt_subsidiary',
                    'custrecord_drt_sat_payment_term', // Forma de Pago
                    'custrecord_drt_sat_payment_method' // Método de Pago
                ]
            });

            var cashSalesIds = _extractMultiSelectIds(lookupData.custrecord_drt_facturas);
            if (cashSalesIds.length === 0) {
                throw new Error('El registro no contiene transacciones (Cash Sales) seleccionadas.');
            }

            // 2. Adaptador de Datos: Búsqueda de tickets (Costo: 10 Unidades)
            var rawItems = _fetchCashSalesData(cashSalesIds);

            // 3. Preparar Contexto de Dominio (Configuraciones de Emisor)
            var subsidiaryId = lookupData.custrecord_drt_subsidiary.length > 0 ? lookupData.custrecord_drt_subsidiary[0].value : null;
            var issuerData = _getIssuerData(subsidiaryId);

            var contextData = {
                periodicidad: lookupData.custrecord_drt_periodicidad.length > 0 ? lookupData.custrecord_drt_periodicidad[0].text.split(' ')[0] : '01',
                meses: lookupData.custrecord_drt_meses.length > 0 ? lookupData.custrecord_drt_meses[0].text.split(' ')[0] : '01',
                anio: lookupData.custrecord_drt_anio || new Date().getFullYear().toString(),
                formaPago: lookupData.custrecord_drt_sat_payment_term.length > 0 ? lookupData.custrecord_drt_sat_payment_term[0].text.split(' ')[0] : '01',
                metodoPago: lookupData.custrecord_drt_sat_payment_method.length > 0 ? lookupData.custrecord_drt_sat_payment_method[0].text.split(' ')[0] : 'PUE',
                fechaEmision: _getIsoDateString(),
                folioSolicitado: 'GLOBAL-' + regId,
                issuerRfc: issuerData.rfc,
                issuerName: issuerData.name,
                issuerZipCode: issuerData.zip,
                issuerRegime: issuerData.regime
            };

            // 4. Transformación a Payload Facturama (Dominio Puro)
            var payload = mapper.buildFacturamaPayload(contextData, rawItems);

            // 5. Timbrado mediante Adaptador HTTP (Costo: 10 Unidades)
            var configData = configModule.get(subsidiaryId);
            var headers = configModule.getAuthHeaders(configData.user, configData.pass);
            var apiResponse = api.postTimbrado(configData.apiPostUrl, headers, JSON.stringify(payload));

            if (!apiResponse || apiResponse.error_interno) {
                throw new Error('Fallo en la comunicación con el PAC: ' + (apiResponse ? apiResponse.detalle : 'Timeout'));
            }

            var cfdiId = apiResponse.Id;
            var uuid = apiResponse.Complement.TaxStamp.Uuid;

            // 6. Descarga y Generación de Archivos Físicos
            var xmlData = api.getXml(configData.apiGetUrl, headers, cfdiId);
            var fileNamePrefix = 'FacturaGlobal_' + uuid;

            // Resolvemos la carpeta dinámicamente
            var targetFolderId = _getDestinationFolderId(subsidiaryId);

            var xmlId = filesAdapter.saveXml(fileNamePrefix + '.xml', xmlData.Content, targetFolderId);
            var templateId = currentScript.getParameter({ name: CONSTANTS.PARAM_TEMPLATE_ID });

            var templateId = currentScript.getParameter({ name: CONSTANTS.PARAM_TEMPLATE_ID });
            if (!templateId) {
                throw new Error('No se ha configurado el parámetro de Plantilla PDF en el despliegue del script.');
            }

            var dummyRecord = record.load({ type: 'customrecord_drt_reg_facturacion_interco', id: regId });
            var pdfId = filesAdapter.generateCertifiedPdf(dummyRecord, null, templateId, { custbody_mx_cfdi_uuid: uuid }, fileNamePrefix + '.pdf', targetFolderId);

            // 7. El Puente (Mediator): Despachar tareas atómicas a la fase Reduce
            var successData = {
                uuid: uuid,
                xmlId: xmlId,
                pdfId: pdfId,
                regId: regId
            };

            for (var i = 0; i < cashSalesIds.length; i++) {
                mapContext.write({
                    key: cashSalesIds[i],
                    value: successData
                });
            }

            logger.write('2. TIMBRADO GLOBAL EXITOSO', { uuid: uuid, cantidadTickets: cashSalesIds.length });

        } catch (e) {
            logError('Fallo en la etapa MAP (Construcción o Timbrado)', e, { rawMapValue: mapContext.value });
            throw e; // Protege el estado: Si falla aquí, la etapa Reduce no mutará la base de datos.
        }
    }

    // ==========================================
    // 4. REDUCE (El Mutador Elástico - Fase 2)
    // ==========================================

    /**
     * Actualiza cada Cash Sale con el UUID y los archivos generados.
     * Se ejecuta de forma paralela y distribuida protegiendo los límites de Gobernanza.
     * 
     * @param {Object} reduceContext - Provee el ID del ticket (key) y los datos de éxito (values).
     */
    function reduce(reduceContext) {
        var cashSaleId = reduceContext.key;

        try {
            var successData = JSON.parse(reduceContext.values[0]);

            // Actualización atómica de la transacción (Costo: 10 Unidades por ticket)
            record.submitFields({
                type: record.Type.CASH_SALE,
                id: cashSaleId,
                values: {
                    'custbody_mx_cfdi_uuid': successData.uuid,
                    'custbody_psg_ei_certified_edoc': successData.xmlId,
                    'custbody_edoc_generated_pdf': successData.pdfId
                },
                options: { ignoreMandatoryFields: true }
            });

            // Reenviamos metadatos agrupados al Summarize para la notificación
            reduceContext.write({
                key: successData.regId,
                value: { xmlId: successData.xmlId, pdfId: successData.pdfId, uuid: successData.uuid }
            });

        } catch (e) {
            logError('Fallo aisaldo al actualizar Cash Sale ID: ' + cashSaleId, e);
        }
    }

    // ==========================================
    // 5. SUMMARIZE (El Observador / Cierre)
    // ==========================================

    /**
     * Evalúa el resultado final del proceso distribuido y notifica a los usuarios.
     * Implementa el Patrón Observer mediante el envío de correos con adjuntos.
     * 
     * @param {Object} summaryContext - Contiene las estadísticas, errores y salidas del Map/Reduce.
     */
    function summarize(summaryContext) {
        var totalErrors = 0;

        summaryContext.mapSummary.errors.iterator().each(function (key, error) {
            logError('Excepción capturada en MapSummary', error);
            totalErrors++;
            return true;
        });

        summaryContext.reduceSummary.errors.iterator().each(function (key, error) {
            logError('Excepción capturada en ReduceSummary', error);
            totalErrors++;
            return true;
        });

        var fileData = null;
        var regId = null;

        summaryContext.output.iterator().each(function (key, value) {
            regId = key;
            fileData = JSON.parse(value);
            return false; // Solo necesitamos la metadata de un nodo, todos tienen la misma.
        });

        try {
            if (totalErrors === 0 && fileData && regId) {
                _sendSuccessEmail(regId, fileData.xmlId, fileData.pdfId, fileData.uuid);
                _updateCustomRecordStatus(regId, CONSTANTS.STATUS_SUCCESS, 'Factura Global Generada Correctamente.');
                logger.write('3. ORQUESTACIÓN FINALIZADA', { regId: regId, status: 'ÉXITO TOTAL' });
            } else if (regId) {
                _updateCustomRecordStatus(regId, CONSTANTS.STATUS_ERROR, 'Proceso finalizado con errores parciales o totales. Revisa el Logger.');
                logger.write('3. ORQUESTACIÓN FINALIZADA CON ERRORES', { regId: regId, erroresDetectados: totalErrors });
            }
        } catch (e) {
            logError('Fallo crítico en fase Summarize (Envío de correo/Actualización)', e);
        }
    }

    // ==========================================
    // 6. FUNCIONES PRIVADAS (Adaptadores y Helper)
    // ==========================================

    /**
     * Recupera y formatea de forma segura los datos de la subsidiaria emisora.
     * @private
     */
    function _getIssuerData(subsidiaryId) {
        if (!subsidiaryId) throw new Error('Se requiere una subsidiaria para obtener los datos del Emisor.');

        var fields = search.lookupFields({
            type: search.Type.SUBSIDIARY,
            id: subsidiaryId,
            columns: ['federalidnumber', 'name', 'zip', 'custrecord_mx_sat_industry_type']
        });

        return {
            rfc: fields.federalidnumber,
            name: fields.name,
            zip: fields.zip,
            regime: fields.custrecord_mx_sat_industry_type[0] ? fields.custrecord_mx_sat_industry_type[0].text.split('-')[0] : '601'
        };
    }

    /**
     * Sanitiza el valor crudo del Multi-Select Field de NetSuite a un Arreglo JS estándar.
     * Programación Defensiva (Fail-Safe Defaults).
     * @private
     */
    function _extractMultiSelectIds(rawFieldValue) {
        if (!rawFieldValue) return [];
        if (Array.isArray(rawFieldValue) && rawFieldValue.length > 0 && typeof rawFieldValue[0] === 'object') {
            return rawFieldValue.map(function (obj) { return obj.value; });
        }
        if (Array.isArray(rawFieldValue)) return rawFieldValue;
        if (typeof rawFieldValue === 'string') return rawFieldValue.split(',');
        return [];
    }

    /**
     * Repositorio: Realiza la búsqueda de los Cash Sales extraídos de la UI y suma los totales de línea.
     * @private
     */
    function _fetchCashSalesData(cashSalesIds) {
        if (!cashSalesIds || cashSalesIds.length === 0) return [];
        var rawItems = [];

        var salesSearch = search.create({
            type: search.Type.CASH_SALE,
            filters: [
                ['internalid', 'anyof', cashSalesIds], 'AND',
                ['mainline', 'is', 'F'], 'AND',
                ['taxline', 'is', 'F'], 'AND',
                ['shipping', 'is', 'F']
            ],
            columns: [
                'tranid', 'quantity', 'amount', 'taxamount', 'taxrate', 'discountamount',
                search.createColumn({ name: 'custcol_mx_txn_line_sat_item_code' })
            ]
        });

        salesSearch.run().each(function (result) {
            rawItems.push({
                ticketNumber: result.getValue('tranid'),
                quantity: result.getValue('quantity'),
                amount: result.getValue('amount'),
                taxamt: result.getValue('taxamount'),
                taxrate: result.getValue('taxrate'),
                discount: result.getValue('discountamount'),
                satCode: result.getText({ name: 'custcol_mx_txn_line_sat_item_code' })
            });
            return true;
        });

        return rawItems;
    }

    /**
     * Obtiene la fecha actual en formato ISO 8601 estricto para Facturama.
     * @private
     */
    function _getIsoDateString() {
        var d = new Date();
        return d.toISOString().split('.')[0]; // Ej. "2026-08-21T12:40:23"
    }

    /**
     * Adjunta los archivos del File Cabinet y envía el correo de éxito.
     * @private
     */
    function _sendSuccessEmail(regId, xmlId, pdfId, uuid) {
        var customRecord = record.load({ type: 'customrecord_drt_reg_facturacion_interco', id: regId });
        // En un entorno real, extraerías el correo del usuario que creó el registro o de una configuración
        var recipients = ['facturacion@zapateriascandy.com.mx', 'iztac.amaya@disruptt.mx'];

        var xmlAttachment = file.load({ id: xmlId });
        var pdfAttachment = file.load({ id: pdfId });

        email.send({
            author: CONSTANTS.AUTHOR_ID,
            recipients: recipients,
            subject: 'Notificación de Sistema: Factura Global Generada Exitosamente',
            body: 'Se ha completado la generación masiva de la Factura Global.\n\nUUID Fiscal: ' + uuid + '\n\nSe adjuntan los comprobantes XML y PDF generados desde el PAC.',
            attachments: [xmlAttachment, pdfAttachment]
        });
    }

    /**
     * Actualiza el registro personalizado para informar a la UI (Suitelet) del resultado final.
     * @private
     */
    function _updateCustomRecordStatus(regId, status, message) {
        record.submitFields({
            type: 'customrecord_drt_reg_facturacion_interco',
            id: regId,
            values: {
                'custrecord_drt_status': status
            },
            options: { ignoreMandatoryFields: true }
        });
    }

    /**
     * Delegador de errores estándar (Compromise Recording).
     * @private
     */
    function logError(customMessage, e, contextData) {
        var errorDetails = {
            name: e.name || 'MAP_REDUCE_ERROR',
            message: e.message || e.toString(),
            stack: e.stack || (typeof e.getStackTrace === 'function' ? e.getStackTrace().join('\n') : 'No stack trace'),
            context: contextData || {}
        };
        logger.write('ERROR ORQUESTADOR GLOBAL: ' + customMessage, errorDetails);
    }

    /**
     * Resuelve el ID de la carpeta de destino basada en la subsidiaria.
     * Principio Fail-Safe: Retorna la carpeta ROOT si la subsidiaria no está mapeada.
     * @private
     */
    function _getDestinationFolderId(subsidiaryId) {
        if (!subsidiaryId) return CONSTANTS.FOLDERS.ROOT;

        var folderId = CONSTANTS.FOLDERS.SUBSIDIARIES[String(subsidiaryId)];
        return folderId || CONSTANTS.FOLDERS.ROOT;
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
/**
 * feat(global-invoice): implementar orquestador map/reduce completo con inyección de PDF y validaciones
 * Descripción (Body):
 * Se consolidó la arquitectura definitiva del Orquestador Map/Reduce para Facturación Global sustituyendo la topología monolítica anterior:
 * * 🔌 Parametrización Abierta (Open/Closed): Se inyectó el parámetro dinámico `PARAM_TEMPLATE_ID` (`custscript_sads_fama_pdf_template`), permitiendo a los administradores del sistema intercambiar la plantilla FreeMarker (PDF) de las facturas globales desde la UI sin modificar el código fuente.
 * * 🛡️ Adaptadores Seguros (Fail-Safe Defaults): Se integraron los adaptadores privados `_fetchCashSalesData` y `_extractMultiSelectIds` que garantizan la sanitización de los objetos extraídos del framework y una consulta optimizada y segura a la base de datos (Search) aislando la memoria.
 * * 📥 Manejo del Contexto Emisor: Se construyó la función `_getIssuerData` la cual realiza un *lookup* eficiente (1 Unidad) a la subsidiaria operativa para construir el nodo SAT Emisor de forma dinámica y precisa.
 * * 📬 Notificación Nativa (Observer Pattern): Se completó el motor de `_sendSuccessEmail`, cargando dinámicamente los registros *XML* y *PDF* creados por el módulo de archivos, transmitiéndolos eficientemente al usuario a través del cliente de correo interno de NetSuite.
 */