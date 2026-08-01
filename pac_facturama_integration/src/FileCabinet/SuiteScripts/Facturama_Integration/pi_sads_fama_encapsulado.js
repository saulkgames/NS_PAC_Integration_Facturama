/**
 * @NApiVersion 2.0
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 * 
 * SADS Facturama - Fase 1 (Monolítico con Custom Logger)
 */
define(['N/record', 'N/search', 'N/https', 'N/encode', 'N/file'], 
function (record, search, https, encode, file) {
    'use strict';

    /**
     * Función utilitaria para registrar TODOS los eventos en el Custom Record.
     */
    function writeLog(title, messageData) {
        try {
            var logRecord = record.create({ type: 'customrecord_sads_fama_logger' });
            var safeTitle = (title || 'Log sin título').substring(0, 300);
            var parsedMessage = typeof messageData === 'object' ? JSON.stringify(messageData) : (messageData || '');
            var safeMessage = parsedMessage.substring(0, 3900);

            logRecord.setValue({ fieldId: 'custrecord_sads_fama_log_title', value: safeTitle });
            logRecord.setValue({ fieldId: 'custrecord_sads_fama_log_message', value: safeMessage });
            
            logRecord.save({ ignoreMandatoryFields: true });
        } catch (e) {
            log.error('Fallo Crítico en Custom Logger', e.toString());
        }
    }

    /**
     * send - This function is the entry point of our plugin script
     * 
     * @param {Object} plugInContext
     * @param {String} plugInContext.scriptId
     * @param {String} plugInContext.sendMethodId
     * @param {String} plugInContext.eInvoiceContent
     * @param {Array}  plugInContext.attachmentFileIds
     * @param {String} plugInContext.customPluginImpId
     * @param {Number} plugInContext.batchOwner
     * @param {Object} plugInContext.customer
     * @param {String} plugInContext.customer.id
     * @param {Array}  plugInContext.customer.recipients
     * @param {Object} plugInContext.transaction
     * @param {String} plugInContext.transaction.number
     * @param {String} plugInContext.transaction.id
     * @param {String} plugInContext.transaction.poNum
     * @param {String} plugInContext.transaction.tranType
     * @param {Number} plugInContext.transaction.subsidiary
     * @param {Object} plugInContext.sender
     * @param {String} plugInContext.sender.id
     * @param {String} plugInContext.sender.name
     * @param {String} plugInContext.sender.email
     * @param {Number} plugInContext.userId
     *
     * @returns {Object}  result
     * @returns {Boolean} result.success
     * @returns {String}  result.message
     */
    function send(plugInContext) {
        writeLog('1. INICIO DE EJECUCIÓN', 'Plugin invocado para transacción ID: ' + (plugInContext.transaction ? plugInContext.transaction.id : 'Indefinido'));
        
        try {
            var txnId = plugInContext.transaction.id;
            var txnType = plugInContext.transaction.tranType || plugInContext.transaction.type;
            var rawPayload = plugInContext.eInvoiceContent;
            
            if (!rawPayload) {
                throw new Error('El E-Document framework no entregó el JSON (eInvoiceContent vacío).');
            }
            writeLog('2. PAYLOAD RECIBIDO', rawPayload);

            var txnLookup = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: txnId,
                columns: ['subsidiary', 'tranid']
            });
            var subsidiaryId = txnLookup.subsidiary[0].value;
            var tranIdText = txnLookup.tranid;
            writeLog('3. DATOS DE TRANSACCIÓN', 'Subsidiaria: ' + subsidiaryId + ' | TranID: ' + tranIdText);

            var configSearch = search.create({
                type: 'customrecord_sads_fama_config',
                filters: [
                    ['isinactive', 'is', 'F'], 'AND',
                    ['custrecord_sads_fama_sub', 'anyof', subsidiaryId]
                ],
                columns: [
                    'custrecord_sads_fama_user', 'custrecord_sads_fama_pass', 
                    'custrecord_sads_fama_url_api', 'custrecord_sads_fama_url_api_getxml'
                ]
            });
            
            var configResults = configSearch.run().getRange({ start: 0, end: 1 });
            if (configResults.length === 0) {
                throw new Error('No se encontró configuración de Facturama para subsidiaria: ' + subsidiaryId);
            }

            var apiUser = configResults[0].getValue('custrecord_sads_fama_user');
            var apiPass = configResults[0].getValue('custrecord_sads_fama_pass');
            var urlPost = configResults[0].getValue('custrecord_sads_fama_url_api');
            var urlGet = configResults[0].getValue('custrecord_sads_fama_url_api_getxml');

            var base64Encoded = encode.convert({
                string: apiUser + ':' + apiPass,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });
            var headers = {
                'Authorization': 'Basic ' + base64Encoded,
                'Content-Type': 'application/json'
            };

            writeLog('4. EJECUTANDO POST', 'URL: ' + urlPost);
            var postResp = https.post({ url: urlPost, headers: headers, body: rawPayload });
            writeLog('5. RESPUESTA POST', 'Código: ' + postResp.code + ' | Body: ' + postResp.body);

            if (postResp.code !== 200 && postResp.code !== 201) {
                throw new Error('Fallo de Timbrado (HTTP ' + postResp.code + '): ' + postResp.body);
            }
            
            var facturamaData = JSON.parse(postResp.body);
            var cfdiId = facturamaData.Id;
            var uuid = facturamaData.Complement ? facturamaData.Complement.TaxStamp.Uuid : 'UUID_NO_ENCONTRADO';

            var finalGetUrl = urlGet.replace('{id}', cfdiId);
            writeLog('6. EJECUTANDO GET XML', 'URL: ' + finalGetUrl);
            var getResp = https.get({ url: finalGetUrl, headers: { 'Authorization': 'Basic ' + base64Encoded } });

            if (getResp.code !== 200) {
                throw new Error('Timbrado exitoso (' + uuid + ') pero falló descarga de XML: ' + getResp.body);
            }
            
            var xmlData = JSON.parse(getResp.body);

            var xmlFile = file.create({
                name: 'CFDI_' + tranIdText + '_' + uuid + '.xml',
                fileType: file.Type.XMLDOC,
                contents: xmlData.Content || getResp.body, 
                folder: -15 
            });
            var xmlFileId = xmlFile.save();
            writeLog('8. ARCHIVO GUARDADO', 'Internal ID del Archivo: ' + xmlFileId);

            var fieldsToUpdate = {
                'custbody_sads_fama_cfdi_resp_id': cfdiId,
                'custbody_psg_ei_certified_edoc': xmlFileId
            };

            if (facturamaData.Complement && facturamaData.Complement.TaxStamp) {
                fieldsToUpdate['custbody_mx_cfdi_uuid'] = facturamaData.Complement.TaxStamp.Uuid;
                fieldsToUpdate['custbody_mx_cfdi_certify_timestamp'] = facturamaData.Complement.TaxStamp.Date;
                fieldsToUpdate['custbody_mx_cfdi_sat_serial'] = facturamaData.Complement.TaxStamp.SatCertNumber;
                fieldsToUpdate['custbody_mx_cfdi_sat_signature'] = facturamaData.Complement.TaxStamp.SatSign;
                fieldsToUpdate['custbody_mx_cfdi_issuer_signature'] = facturamaData.Complement.TaxStamp.CfdiSign;
            }

            record.submitFields({
                type: txnType,
                id: txnId,
                values: fieldsToUpdate,
                options: { ignoreMandatoryFields: true }
            });

            writeLog('9. FIN EXITOSO', 'UUID: ' + uuid);

            return {
                success: true,
                message: 'CFDI Timbrado exitosamente. UUID: ' + uuid,
                eiStatus: 3 
            };

        } catch (ex) {
            writeLog('ERROR CRÍTICO (CATCH)', ex.message + '\n' + ex.stack);
            return {
                success: false,
                message: 'Excepción: ' + ex.message,
                eiStatus: 4 
            };
        }
    }

    /**
     * getStatus - Executed to get the network status updates.
     * 
     * @param {Object} scriptContext
     * @returns {Object} result
     */
    function getStatus(scriptContext) {
        writeLog('GET STATUS INVOCADO', 'Validación de estatus de red solicitada.');
        return {
            success: true,
            message: 'Procesamiento de Facturama es síncrono.'
        };
    }

    /**
     * Dummy function para Unit Tests de SuiteApp de México.
     */
    function setSATCodesInstance(fakeSatCodesInstance) {}

    return {
        send: send,
        getStatus: getStatus,
        setSATCodesInstance: setSATCodesInstance
    };
});