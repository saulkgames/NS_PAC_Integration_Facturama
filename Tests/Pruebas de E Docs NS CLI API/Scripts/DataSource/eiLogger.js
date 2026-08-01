/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * This is a generic file that handles Invoices, Item Fulfillments, Cash Sales and Credit Memos, since they
 * all can be handled the same way. If at any point we need to implement a specific feature for any of them,
 * we can extract it into a separate file (like customerPayment.js, in the same directory).
 */

define(
    [
        './../common/constants',
        './../common/logger',
        './../common/scriptContext',
        'N/record',
    ],
    function (constants, logger, ScriptContext, record) {
        function logInfoToKibana (
            operationType,
            transactionType,
            transactionId,
            executionStatus,
            errorCode,
            errorDetails,
            txnRecord
        ) {
            ScriptContext.initialize(constants.SCRIPT_TYPE.UE, {});
            logger.log({
                    message: 'MEXICO_LOCALIZATION_EI_INFO',
                    operationType: operationType,
                    recordType: _getCompleteRecordType(transactionType, txnRecord),
                    recordId: transactionId,
                    featureName: _getFeatureName(txnRecord),
                    eDocumentCategory: _getEDocumentPackage(txnRecord),
                    operationStatus: executionStatus.toString(),
                    errorCode: errorCode,
                    errorMessage: errorDetails,
                }
                , 'info');
        }

        function _getFeatureName (txnRecord) {
            try {
                var isCartaPorte = txnRecord.getValue(constants.FIELD.MCP_BILL_OF_LADING);
                if (isCartaPorte === true) {
                    return 'Mexico Bill of Lading';
                }
            } catch (ex) {
                null; // not Complemento Carta Porte
            }
            try {
                var isForeignTrade = txnRecord.getValue(constants.FIELD.FT_FOREIGN_TRADE);
                if (isForeignTrade === true) {
                    return 'Mexico Foreign Trade';
                }
            } catch (ex) {
                null; // not Foreign Trade
            }
            return '-';
        }

        function _getEDocumentPackage (txnRecord) {
            try {
                var templateId = txnRecord.getValue(constants.FIELD.EI_TEMPLATE);
                var template = record.load({
                    type: constants.RECORD_TYPE.EI_EDOCUMENT_TEMPLATE,
                    id: templateId,
                });
                var templateName = template.getValue({
                    fieldId: 'name',
                });
                if (templateName.toLowerCase().indexOf('mysuite') !== -1) {
                    templateName = 'MySuite';
                } else if (templateName.toLowerCase().indexOf('profact') !== -1) {
                    templateName = 'Profact';
                } else if (templateName.toLowerCase().indexOf('factible') !== -1) {
                    templateName = 'Sol. Factible';
                } else {
                    templateName = 'Others';
                }
                return templateName;
            } catch (ex) {
                return 'Others';
            }
        }

        function _getCompleteRecordType(transactionType, txnRecord){
            var completeRecordName = transactionType;
            if (completeRecordName === constants.RECORD_TYPE.ITEM_FULFILLMENT) {
                try {
                    var entity = txnRecord.getValue(constants.FIELD.ENTITY);
                    if (entity) {
                        completeRecordName = completeRecordName.concat(' coming from Sales Order');
                    } else {
                        completeRecordName = completeRecordName.concat(' coming from Transfer Order');
                    }
                }
                catch(e) {
                    completeRecordName = completeRecordName.concat(' coming from Transfer Order');
                }
            }
            return completeRecordName;
        }

        return {
            logInfoToKibana: logInfoToKibana,
        };
    }
);
