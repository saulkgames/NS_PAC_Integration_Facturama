/**
 * @NApiVersion 2.0
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 * * SADS Facturama - Orquestador Principal (Mediator Pattern)
 */
define([
    'N/search',
    'N/record',
    'N/https', // TODO (Arquitectura): Debería removerse a futuro y delegar 100% en apiModule
    './lib/sads_fama_logger',
    './lib/sads_fama_config',
    './lib/sads_fama_api',
    './lib/sads_fama_files',
    './lib/sads_fama_cfdi',
    './lib/sads_fama_response_handler'
], function (search, record, https, logger, configModule, apiModule, filesModule, cfdiModule, responseHandler) {
    'use strict';

    // ==========================================
    // 1. CONSTANTES (Clean Code: No Magic Strings)
    // ==========================================
    var CONSTANTS = {
        BUNDLE_ID: '436209',
        BUNDLE_NAME: 'Mexico Compliance',
        STATUS_ERROR: '4'
    };

    // ==========================================
    // 2. CASO DE USO PRINCIPAL (Clean Architecture)
    // ==========================================
    
    /**
     * Punto de entrada principal del Plug-in de Facturación Electrónica de NetSuite.
     * Orquesta el flujo completo: validación, obtención de configuración, timbrado en PAC, 
     * análisis de respuesta, y generación de XML/PDF.
     * * @param {Object} plugInContext - El contexto inyectado por el framework de NetSuite.
     * @param {Object} plugInContext.transaction - Información básica de la transacción (id, type, tranType).
     * @param {Object} [plugInContext.customer] - Información del cliente asociado (id).
     * @param {string} plugInContext.eInvoiceContent - El payload JSON/XML generado por el estándar de NetSuite.
     * @param {number|string} plugInContext.userId - El ID del usuario ejecutando la acción.
     * @returns {Object} Objeto de respuesta estandarizado requerido por el EI Framework (eiStatus, message, success).
     */
    function send(plugInContext) {
        var txnId = (plugInContext.transaction && plugInContext.transaction.id) ? plugInContext.transaction.id : 'DESCONOCIDO';
        logger.write('1. INICIO FLUJO ORQUESTADOR', 'Plug-in invocado para transacción ID: ' + txnId);

        try {
            // -- Paso 1: Validación de Entrada (Guard Clauses) --
            var rawPayload = plugInContext.eInvoiceContent;
            if (!rawPayload) throw new Error('eInvoiceContent vacío provisto por el framework.');
            
            var originalPayload = apiModule.safeParse(rawPayload);
            var txnType = plugInContext.transaction.tranType || plugInContext.transaction.type;

            // -- Paso 2: Obtención de Configuración --
            var txnLookup = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: txnId,
                columns: ['subsidiary', 'tranid']
            });

            // Fail-Safe: Validar que existe la subsidiaria antes de leer la posición [0]
            if (!txnLookup.subsidiary || txnLookup.subsidiary.length === 0) {
                throw new Error('La transacción no tiene una subsidiaria asignada.');
            }

            var configData = configModule.get(txnLookup.subsidiary[0].value);
            var headers = configModule.getAuthHeaders(configData.user, configData.pass);

            // -- Paso 3: Comunicación con el PAC (Fuga de abstracción mantenida por compatibilidad) --
            var postResp = https.post({ url: configData.apiPostUrl, headers: headers, body: rawPayload });
            var parsedBody = apiModule.safeParse(postResp.body);

            // -- Paso 4: Análisis de Respuesta --
            var statusAnalysis = responseHandler.analyzeResponse(postResp.code, parsedBody);

            if (!statusAnalysis.success) {
                logger.write('FALLO EN TIMBRADO (PAC)', statusAnalysis.details);
                return _buildFrameworkReturn(plugInContext, statusAnalysis.eDocStatus, statusAnalysis.details, false, {});
            }

            // -- Paso 5: Construcción y Guardado de Archivos (XML y PDF) --
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

            // -- Paso 6: Retorno Exitoso --
            var finalReturn = _buildFrameworkReturn(plugInContext, statusAnalysis.eDocStatus, statusAnalysis.details, true, extraFields);
            logger.write('FIN EXITOSO'+ JSON.stringify({ transactionId: txnId, uuid: uuid }), finalReturn);
            
            return finalReturn;

        } catch (ex) {
            logError('ERROR FATAL EN ORQUESTADOR', ex, { transactionId: txnId });
            
            // Retorno degradado de forma elegante hacia el framework
            var errorMsg = 'Excepción interna: ' + (ex.message || 'Error desconocido');
            return _buildFrameworkReturn(plugInContext, CONSTANTS.STATUS_ERROR, errorMsg, false, {});
        }
    }

    // ==========================================
    // 3. FUNCIONES DE SOPORTE (Privadas)
    // ==========================================

    /**
     * Construye el objeto estandarizado que requiere el framework de NetSuite para actualizar 
     * los registros tras un intento de envío.
     * Refactorizado: Se eliminó el try/catch redundante usando inicialización segura (Fail-Safe Defaults).
     * * @private
     * @param {Object} plugInContext - Contexto original inyectado por NetSuite.
     * @param {string} eDocStatus - Estado final del documento (ej. '3' certificado, '4' error).
     * @param {string} detailsMsg - Mensaje descriptivo del resultado de la operación.
     * @param {boolean} isSuccess - Determina si la transacción fue exitosa para permitir la actualización de campos.
     * @param {Object} extraFields - Diccionario de IDs de campos custom a actualizar en la transacción.
     * @returns {Object} La estructura exacta requerida por `app_einvoice_sending_manager.js`.
     */
    function _buildFrameworkReturn(plugInContext, eDocStatus, detailsMsg, isSuccess, extraFields) {
        // Uso de operadores OR lógicos para evitar accesos a propiedades indefinidas
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
            message: isSuccess ? '' : detailsMsg, // El framework usa message para los errores
            success: isSuccess
        };
    }

    /**
     * Fábrica de errores estandarizada (Compromise Recording).
     * * @private
     * @param {string} customMessage - Mensaje de contexto sobre dónde ocurrió el fallo general.
     * @param {Error|Object} e - Excepción capturada.
     * @param {Object} contextData - Variables de estado para recrear el escenario del error.
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
     * Devuelve el estado y las capacidades actuales del plugin al framework de EI.
     * * @param {Object} scriptContext - Contexto base de ejecución.
     * @returns {Object} Objeto de estado indicando soporte de procesamiento síncrono.
     */
    function getStatus(scriptContext) { 
        return { success: true, message: 'Procesamiento síncrono.' }; 
    }

    /**
     * Método requerido por la interfaz del plug-in (No implementado/delegado).
     * * @param {Object} fakeSatCodesInstance - Instancia ficticia o base enviada por NetSuite.
     * @returns {void}
     */
    function setSATCodesInstance(fakeSatCodesInstance) { }

    return { 
        send: send, 
        getStatus: getStatus, 
        setSATCodesInstance: setSATCodesInstance 
    };
});
/**
 * refactor(orchestrator): aplicar clean architecture, mediator pattern y documentacion JSDoc
 * Descripción (Body):
 * Se refactorizó el orquestador principal (pi_sads_fama_connector.js) que actúa como el Mediator central del framework de facturación electrónica de NetSuite:
 * * 🏗️ Clean Architecture (Mediator Pattern): Se aisló la lógica de negocio delegando las responsabilidades de infraestructura a adaptadores específicos (apiModule, filesModule, configModule, cfdiModule). El orquestador ahora se lee como una secuencia lineal de alto nivel (Casos de Uso) sin preocuparse por los detalles de implementación de bajo nivel.
 * * 🛡️ Fail-Safe Defaults & Guard Clauses: Se implementó la validación temprana (Fail Fast) para el payload y la subsidiaria. Se eliminó el riesgo de excepciones no controladas causadas por el acceso a propiedades indefinidas mediante el uso de operadores OR lógicos (`||`) al construir la respuesta (`_buildFrameworkReturn`).
 * * 🧹 Clean Code (DRY Principle): Se eliminó el bloque `try/catch` anidado y redundante en la función de construcción del retorno. Las constantes críticas como el BUNDLE_ID y el STATUS_ERROR se extrajeron a un diccionario central para evitar el uso de Magic Strings.
 * * 🩺 Compromise Recording (Degradación Elegante): Si ocurre un fallo catastrófico no controlado en cualquier punto del flujo, el bloque `catch` principal captura el *stack trace*, lo registra a través del logger centralizado, y devuelve una estructura de fallo estandarizada ("4") para evitar que la aplicación NetSuite colapse abruptamente.
 * * 📚 Documentación (JSDoc): Se documentaron todas las funciones públicas y privadas, especificando el contrato estricto del framework `plugInContext` para facilitar el mantenimiento y la comprensión de la arquitectura de inyección de dependencias a futuros desarrolladores.
 */