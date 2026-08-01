/**
 * @NApiVersion 2.0
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 *
 * SADS Facturama - E-Document Sending Method Plug-in
 * Orquestador Principal (SuiteScript 2.0).
 */
define([
    'N/record', 
    'N/log',
    './lib/sads_fama_config',
    './lib/sads_fama_api',
    './lib/sads_fama_files',
    './lib/sads_fama_cfdi'
], function (record, log, configModule, apiModule, filesModule, cfdiModule) {
    'use strict';
    /**
* send - This function is the entry point of our plugin script
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
    function send(pluginContext) {
        try {
            var txnId = pluginContext.transaction.id;
            var txnType = pluginContext.transaction.tranType;
            
            log.debug('SADS Facturama', 'Iniciando para Transacción: ' + txnId);

            // 1. Obtener JSON generado por FreeMarker
            var payload = JSON.parse(pluginContext.eInvoiceContent);
            
            // 2. Obtener Configuración y Auth Headers (Módulo 1)
            var txnRecord = record.load({ type: txnType, id: txnId, isDynamic: false });
            var config = configModule.get(txnRecord.getValue('subsidiary'));
            var headers = configModule.getAuthHeaders(config.user, config.pass);

            // 3. Timbrado en Facturama (Módulo 3)
            var fResponse = apiModule.postTimbrado(config.apiPostUrl, headers, payload);
            if (!fResponse.success) {
                return { success: false, message: fResponse.message };
            }
            var cfdiId = fResponse.data.Id;

            // 4. Descargar XML (Módulo 5)
            var xmlFileId = filesModule.downloadXml(cfdiId, config.apiGetUrl, headers, txnRecord);

            // 5. Actualizar campos nativos del CFDI (Módulo 2)
            cfdiModule.updateTransaction(txnId, txnType, payload, fResponse.data, xmlFileId, cfdiId);

            // 6. Generar PDF Nativo (Módulo 4)
            filesModule.generatePdf(txnId, txnType, xmlFileId);

            return {
                success: true,
                message: 'CFDI Timbrado Exitosamente. UUID: ' + fResponse.data.Complement.TaxStamp.Uuid
            };

        } catch (e) {
            log.error('SADS Facturama - Excepción Crítica', e.stack || e.message);
            return { success: false, message: 'Error en Proceso: ' + e.message };
        }
    }

    function getStatus(pluginContext) {
        log.debug('SADS Facturama getStatus', 'Consulta de estado ejecutada para: ' + pluginContext.transaction.id);
        
        return {
            success: true,
            message: 'Integración Síncrona: El documento fue procesado exitosamente durante el envío.'
        };
    }

    return { 
        send: send,
        getStatus: getStatus
    };
});