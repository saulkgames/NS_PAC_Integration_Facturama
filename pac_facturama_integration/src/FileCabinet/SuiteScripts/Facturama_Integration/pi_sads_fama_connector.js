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
    './lib/sads_fama_logger',
    './lib/sads_fama_config',
    './lib/sads_fama_api',
    './lib/sads_fama_files',
    './lib/sads_fama_cfdi'
], function (search, record, logger, configModule, apiModule, filesModule, cfdiModule) {
    'use strict';

    /**
     * Escribe directamente en el Historial de Auditoría Nativo de NetSuite
     */
    function writeNativeAuditTrail(txnId, customerId, userId, message, isError) {
        try {
            var auditRec = record.create({ type: 'customrecord_psg_ei_audit_trail' });
            auditRec.setValue({ fieldId: 'custrecord_psg_ei_audit_transaction', value: txnId });
            if (customerId) {
                auditRec.setValue({ fieldId: 'custrecord_psg_ei_audit_entity', value: customerId });
            }
            // Tipo de Evento: 3 = Certificación de salida
            auditRec.setValue({ fieldId: 'custrecord_psg_ei_audit_event', value: '3' });
            auditRec.setValue({ fieldId: 'custrecord_psg_ei_audit_owner', value: userId });
            auditRec.setValue({ fieldId: 'custrecord_psg_ei_audit_details', value: (isError ? '[ERROR] ' : '[ÉXITO] ') + message });
            auditRec.save({ ignoreMandatoryFields: true });
        } catch (e) {
            logger.write('Error al crear Audit Trail Nativo', e.message);
        }
    }

    function send(plugInContext) {
        logger.write('1. INICIO', 'Plug-in invocado para transacción ID: ' + (plugInContext.transaction ? plugInContext.transaction.id : 'N/A'));
        var txnId = plugInContext.transaction ? plugInContext.transaction.id : '';
        var customerId = plugInContext.customer ? plugInContext.customer.id : '';
        var userId = plugInContext.userId;

        try {
            var txnType = plugInContext.transaction.tranType || plugInContext.transaction.type;
            var rawPayload = plugInContext.eInvoiceContent;
            
            if (!rawPayload) throw new Error('eInvoiceContent vacío.');
            var originalPayload = apiModule.safeParse(rawPayload);

            var txnLookup = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: txnId,
                columns: ['subsidiary', 'tranid']
            });
            var subsidiaryId = txnLookup.subsidiary[0].value;
            var tranIdText = txnLookup.tranid;

            var configData = configModule.get(subsidiaryId);
            var headers = configModule.getAuthHeaders(configData.user, configData.pass);

            // POST Timbrado
            var facturamaData = apiModule.postTimbrado(configData.apiPostUrl, headers, rawPayload);
            var cfdiId = facturamaData.Id;
            var uuid = facturamaData.Complement ? facturamaData.Complement.TaxStamp.Uuid : 'UUID_N/A';

            // GET XML
            var xmlData = apiModule.getXml(configData.apiGetUrl, headers, cfdiId);

            // Guardar Archivo Físico
            var xmlContent = xmlData.Content || 'XML_VACIO';
            var xmlFileId = filesModule.saveXml('CFDI_' + tranIdText + '_' + uuid + '.xml', xmlContent);
            logger.write('5. ARCHIVO GUARDADO', 'Internal ID: ' + xmlFileId);

            // Obtenemos el objeto con todos los campos fiscales
            var extraFields = cfdiModule.getFieldsToUpdate(originalPayload, facturamaData, xmlFileId, cfdiId, xmlContent);
            
            var successMessage = 'PAC - CFDI Timbrado exitosamente con Facturama (UUID: ' + uuid + ')';

            // 1. Forzamos la creación del Log en la tabla de Auditoría Nativa
            writeNativeAuditTrail(txnId, customerId, userId, successMessage, false);

            // 2. Retornamos el objeto para que NetSuite guarde los campos y regenere el PDF
            var finalResult = {
                transactionId: txnId,
                transactionType: txnType,
                entity: customerId || undefined,
                eDocStatus: '1', // 1 = Para generación (Permite que se auto-genere el PDF)
                eventType: '1',
                details: successMessage,
                owner: userId,
                isUpdateFields: true, 
                extraFieldsForUpdate: extraFields, 
                bundleId: '',
                bundleName: 'SADS Facturama Integration'
            };

            logger.write('6. FIN EXITOSO', 'Enviando finalResult al Framework Core.');

            return {
                success: true,
                message: successMessage,
                eiStatus: finalResult 
            };

        } catch (ex) {
            logger.write('ERROR CRÍTICO', ex.message + '\n' + (ex.stack || ''));
            
            // Forzamos el Log de Error en la tabla de Auditoría Nativa
            writeNativeAuditTrail(txnId, customerId, userId, ex.message, true);

            var errorResult = {
                transactionId: txnId,
                transactionType: plugInContext.transaction ? (plugInContext.transaction.tranType || plugInContext.transaction.type) : '',
                eDocStatus: '4', // 4 = Error
                eventType: '4',
                details: 'Fallo al timbrar con Facturama: ' + ex.message,
                owner: userId,
                isUpdateFields: false,
                extraFieldsForUpdate: {}
            };

            return {
                success: false,
                message: 'Excepción: ' + ex.message,
                eiStatus: errorResult
            };
        }
    }

    function getStatus(scriptContext) { return { success: true, message: 'Procesamiento síncrono.' }; }
    function setSATCodesInstance(fakeSatCodesInstance) {}

    return { send: send, getStatus: getStatus, setSATCodesInstance: setSATCodesInstance };
});