/**
 * @NApiVersion 2.0
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 * 
 * SADS Facturama - Orquestador Principal
 */
define([
    'N/search',
    'N/record',
    'N/https',
    './lib/sads_fama_logger',
    './lib/sads_fama_config',
    './lib/sads_fama_api',
    './lib/sads_fama_files',
    './lib/sads_fama_cfdi',
    './lib/sads_fama_response_handler'
], function (search, record, https, logger, configModule, apiModule, filesModule, cfdiModule, responseHandler) {
    'use strict';

    function send(plugInContext) {
        var txnId = plugInContext.transaction ? plugInContext.transaction.id : '';
        logger.write('1. INICIO', 'Plug-in invocado para transacción ID: ' + txnId);

        try {
            var objReturn = {};
            var txnType = plugInContext.transaction.tranType || plugInContext.transaction.type;
            var rawPayload = plugInContext.eInvoiceContent;

            if (!rawPayload) throw new Error('eInvoiceContent vacío.');
            var originalPayload = apiModule.safeParse(rawPayload);

            var txnLookup = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: txnId,
                columns: ['subsidiary', 'tranid']
            });

            var configData = configModule.get(txnLookup.subsidiary[0].value);
            var headers = configModule.getAuthHeaders(configData.user, configData.pass);
            // Envio de Payload al PAC (Facturama)
            var postResp = https.post({ url: configData.apiPostUrl, headers: headers, body: rawPayload });
            var parsedBody = apiModule.safeParse(postResp.body);

            var statusAnalysis = responseHandler.analyzeResponse(postResp.code, parsedBody);

            if (!statusAnalysis.success) {
                logger.write('Fallo en PAC', statusAnalysis.details);
                objReturn = _buildFrameworkReturn(plugInContext, statusAnalysis.eDocStatus, statusAnalysis.details, false, {});
                return objReturn;
            }

            var facturamaData = parsedBody;
            var cfdiId = facturamaData.Id;
            var uuid = facturamaData.Complement ? facturamaData.Complement.TaxStamp.Uuid : 'UUID_N/A';

            var xmlData = apiModule.getXml(configData.apiGetUrl, headers, cfdiId);
            var xmlContent = xmlData.Content || 'XML_VACIO';
            var xmlFileId = filesModule.saveXml('CFDI_' + txnLookup.tranid + '_' + uuid + '.xml', xmlContent);

            var extraFields = cfdiModule.buildExtraFields(originalPayload, facturamaData, xmlFileId, cfdiId, xmlContent);

            var txnRecordFull = record.load({ type: txnType, id: txnId });
            var customerRecordFull = plugInContext.customer ? record.load({ type: 'customer', id: plugInContext.customer.id }) : null;

            var pdfTemplateId = configData.templates[txnType];
            if (!pdfTemplateId) {
                throw new Error('No hay plantilla PDF configurada para el tipo de transacción: ' + txnType);
            }

            var pdfFileId = filesModule.generateCertifiedPdf(txnRecordFull, customerRecordFull, pdfTemplateId, extraFields, txnLookup.tranid + '_' + uuid + '.pdf');

            extraFields['custbody_edoc_generated_pdf'] = pdfFileId;

            objReturn = _buildFrameworkReturn(plugInContext, statusAnalysis.eDocStatus, statusAnalysis.details, true, extraFields);
            logger.write('FIN EXITOSO', objReturn);
            return objReturn;

        } catch (ex) {
            objReturn = {
                name: ex.name || 'Error desconocido',
                message: ex.message || 'No se proporcionó mensaje de error.',
                stack: ex.stack || 'No hay stack trace disponible.',
                send: _buildFrameworkReturn(plugInContext, '4', 'Excepción interna: ' + ex.message, false, {}),
            }

            logger.write('ERROR IN MAIN TRYCATCH: ',objReturn);
            return objReturn.send;
        }
    }

    function _buildFrameworkReturn(plugInContext, eDocStatus, detailsMsg, isSuccess, extraFields) {
        try {
            var finalResult = {
                transactionId: plugInContext.transaction ? plugInContext.transaction.id : '',
                transactionType: plugInContext.transaction ? (plugInContext.transaction.tranType || plugInContext.transaction.type) : '',
                entity: plugInContext.customer ? plugInContext.customer.id : undefined,
                eDocStatus: eDocStatus,
                eventType: eDocStatus,
                details: detailsMsg,
                owner: plugInContext.userId,
                isUpdateFields: isSuccess,
                extraFieldsForUpdate: extraFields,
                bundleId: '436209',
                bundleName: 'Mexico Compliance'
            };
    
            return {
                eiStatus: finalResult,
                message: '',
                success: isSuccess
            };
        } catch (error) {
            var objRet = {
                name: error.name || 'Error desconocido',
                message: error.message || 'No se proporcionó mensaje de error.',
                stack: error.stack || 'No hay stack trace disponible.',
                finalResult: {
                    transactionId: plugInContext.transaction ? plugInContext.transaction.id : '',
                    transactionType: plugInContext.transaction ? (plugInContext.transaction.tranType || plugInContext.transaction.type) : '',
                    entity: plugInContext.customer ? plugInContext.customer.id : undefined,
                    eDocStatus: '4',
                    eventType: '4',
                    details: 'Error al construir el retorno del framework: ' + error.message,
                    owner: plugInContext.userId,
                    isUpdateFields: false,
                    extraFieldsForUpdate: {},
                    bundleId: '436209',
                    bundleName: 'Mexico Compliance'
                }
            };
            logger.write('ERROR al construir el retorno del framework', objRet);
            return {
                eiStatus: objRet.finalResult,
                message: 'Error al construir el retorno del framework: ' + error.message,
                success: false
            };
            
        }
    }

    function getStatus(scriptContext) { return { success: true, message: 'Procesamiento síncrono.' }; }
    function setSATCodesInstance(fakeSatCodesInstance) { }

    return { send: send, getStatus: getStatus, setSATCodesInstance: setSATCodesInstance };
});
