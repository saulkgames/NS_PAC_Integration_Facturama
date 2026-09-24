/**
 * @NApiVersion 2.0
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 *
 * SADS Facturama - Plug-in de timbrado individual (Sending Method).
 */
define([
    'N/search',
    'N/record',
    'N/https', // TODO (Arquitectura): remover a futuro y delegar 100% en apiModule
    './lib/sads_fama_logger',
    './lib/sads_fama_config',
    './lib/sads_fama_api',
    './lib/sads_fama_files',
    './lib/sads_fama_cfdi',
    './lib/sads_fama_response_handler'
], function (search, record, https, logger, configModule, apiModule, filesModule, cfdiModule, responseHandler) {
    'use strict';

    var CONSTANTS = {
        BUNDLE_ID: '436209',
        BUNDLE_NAME: 'Mexico Compliance',
        STATUS_ERROR: '4'
    };

    /**
     * Punto de entrada del plug-in. Orquesta el flujo completo: validación, configuración,
     * timbrado en el PAC, análisis de respuesta y generación de XML/PDF.
     * @param {Object} plugInContext - Contexto inyectado por el framework de NetSuite.
     * @param {Object} plugInContext.transaction - Datos básicos de la transacción (id, type, tranType).
     * @param {Object} [plugInContext.customer] - Cliente asociado (id).
     * @param {string} plugInContext.eInvoiceContent - Payload JSON/XML generado por el estándar de NetSuite.
     * @param {number|string} plugInContext.userId - ID del usuario que ejecuta la acción.
     * @returns {Object} Respuesta estandarizada requerida por el EI Framework (eiStatus, message, success).
     */
    function send(plugInContext) {
        var txnId = (plugInContext.transaction && plugInContext.transaction.id) ? plugInContext.transaction.id : 'DESCONOCIDO';
        logger.write('1. INICIO FLUJO ORQUESTADOR', 'Plug-in invocado para transacción ID: ' + txnId);

        try {
            // Paso 1: Validación de entrada
            var rawPayload = plugInContext.eInvoiceContent;
            if (!rawPayload) throw new Error('eInvoiceContent vacío provisto por el framework.');
            
            var originalPayload = apiModule.safeParse(rawPayload);
            var txnType = plugInContext.transaction.tranType || plugInContext.transaction.type;

            // Paso 2: Obtención de configuración
            var txnLookup = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: txnId,
                columns: ['subsidiary', 'tranid']
            });

            // Validar la subsidiaria antes de leer la posición [0]
            if (!txnLookup.subsidiary || txnLookup.subsidiary.length === 0) {
                throw new Error('La transacción no tiene una subsidiaria asignada.');
            }

            var configData = configModule.get(txnLookup.subsidiary[0].value);
            var headers = configModule.getAuthHeaders(configData.user, configData.pass);

            // Paso 3: Comunicación con el PAC (fuga de abstracción mantenida por compatibilidad)
            var postResp = https.post({ url: configData.apiPostUrl, headers: headers, body: rawPayload });
            var parsedBody = apiModule.safeParse(postResp.body);

            // Paso 4: Análisis de respuesta
            var statusAnalysis = responseHandler.analyzeResponse(postResp.code, parsedBody);

            if (!statusAnalysis.success) {
                logger.write('FALLO EN TIMBRADO (PAC)', statusAnalysis.details);
                return _buildFrameworkReturn(plugInContext, statusAnalysis.eDocStatus, statusAnalysis.details, false, {});
            }

            // Paso 5: Construcción y guardado de archivos (XML y PDF)
            var facturamaData = parsedBody;
            var cfdiId = facturamaData.Id;
            var uuid = facturamaData.Complement && facturamaData.Complement.TaxStamp ? facturamaData.Complement.TaxStamp.Uuid : 'UUID_N/A';
            var filePrefix = txnLookup.tranid + '_' + uuid;

            var xmlData = apiModule.getFile(configData.apiGetUrl, headers, cfdiId, 'xml');
            var xmlContent = (xmlData && xmlData.Content) ? xmlData.Content : 'XML_VACIO';
            var xmlFileId = filesModule.saveFile('CFDI_' + filePrefix + '.xml', xmlContent);

            var extraFields = cfdiModule.buildExtraFields(originalPayload, facturamaData, xmlFileId, cfdiId, xmlContent);

            var txnRecordFull = record.load({ type: txnType, id: txnId });
            var customerRecordFull = plugInContext.customer ? record.load({ type: 'customer', id: plugInContext.customer.id }) : null;

            if (!configData.templates[txnType]) {
                throw new Error('No hay plantilla PDF configurada para el tipo de transacción: ' + txnType);
            }

            var pdfFileId = filesModule.generateCertifiedPdf(txnRecordFull, customerRecordFull, configData.templates[txnType], extraFields, filePrefix + '.pdf');
            extraFields['custbody_edoc_generated_pdf'] = pdfFileId;
            extraFields['custbody_sads_fama_cfdi_resp_id'] = cfdiId;

            // Paso 6: Retorno exitoso
            var finalReturn = _buildFrameworkReturn(plugInContext, statusAnalysis.eDocStatus, statusAnalysis.details, true, extraFields);
            logger.write('FIN EXITOSO'+ JSON.stringify({ transactionId: txnId, uuid: uuid }), finalReturn);
            
            return finalReturn;

        } catch (ex) {
            logError('ERROR FATAL EN ORQUESTADOR', ex, { transactionId: txnId });
            
            var errorMsg = 'Excepción interna: ' + (ex.message || 'Error desconocido');
            return _buildFrameworkReturn(plugInContext, CONSTANTS.STATUS_ERROR, errorMsg, false, {});
        }
    }

    /**
     * Construye el objeto estandarizado que requiere el framework de NetSuite para actualizar
     * los registros tras un intento de envío.
     * @private
     * @param {Object} plugInContext - Contexto original inyectado por NetSuite.
     * @param {string} eDocStatus - Estado final del documento (ej. '3' certificado, '4' error).
     * @param {string} detailsMsg - Mensaje descriptivo del resultado.
     * @param {boolean} isSuccess - Indica si la operación fue exitosa y permite actualizar campos.
     * @param {Object} extraFields - IDs de campos custom a actualizar en la transacción.
     * @returns {Object} Estructura requerida por `app_einvoice_sending_manager.js`.
     */
    function _buildFrameworkReturn(plugInContext, eDocStatus, detailsMsg, isSuccess, extraFields) {
        var txn = plugInContext.transaction || {};
        var cust = plugInContext.customer || {};

        var finalResult = {
            transactionId: txn.id || '',
            transactionType: txn.tranType || txn.type || '',
            entity: cust.id || undefined,
            eDocStatus: eDocStatus,
            eventType: eDocStatus,
            details: detailsMsg,
            owner: plugInContext.userId || undefined,
            isUpdateFields: isSuccess,
            extraFieldsForUpdate: extraFields || {},
            bundleId: CONSTANTS.BUNDLE_ID,
            bundleName: CONSTANTS.BUNDLE_NAME
        };

        logger.write('Funcion _buildFrameworkReturn ejecutada, resultado construido para el framework', finalResult);

        return {
            eiStatus: finalResult,
            message: isSuccess ? '' : detailsMsg, // El framework usa `message` solo para los errores
            success: isSuccess
        };
    }

    /**
     * Registra un error de forma estandarizada a través del logger central.
     * @private
     * @param {string} customMessage - Contexto de dónde ocurrió el fallo.
     * @param {Error|Object} e - Excepción capturada.
     * @param {Object} contextData - Estado relevante para reproducir el error.
     * @returns {void}
     */
    function logError(customMessage, e, contextData) {
        var errorDetails = {
            name: e.name || 'ORCHESTRATOR_ERROR',
            message: e.message || e.toString(),
            stack: e.stack || (typeof e.getStackTrace === 'function' ? e.getStackTrace().join('\n') : 'No stack trace'),
            context: contextData || {}
        };
        logger.write(customMessage, errorDetails);
    }

    /**
     * Devuelve el estado y las capacidades actuales del plug-in al framework de EI.
     * @param {Object} scriptContext - Contexto base de ejecución.
     * @returns {Object} Estado indicando soporte de procesamiento síncrono.
     */
    function getStatus(scriptContext) { 
        return { success: true, message: 'Procesamiento síncrono.' }; 
    }

    /**
     * Método requerido por la interfaz del plug-in (no implementado/delegado).
     * @param {Object} fakeSatCodesInstance - Instancia ficticia o base enviada por NetSuite.
     * @returns {void}
     */
    function setSATCodesInstance(fakeSatCodesInstance) { }

    return { 
        send: send, 
        getStatus: getStatus, 
        setSATCodesInstance: setSATCodesInstance 
    };
});
