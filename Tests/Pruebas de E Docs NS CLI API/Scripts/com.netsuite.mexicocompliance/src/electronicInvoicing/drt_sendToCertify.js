/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 *@NApiVersion 2.x
 *@NScriptType plugintypeimpl
 *@NModuleScope Public
 */
define([
    './lib/commonDataProvider',
    './certifier',
    './../electronicInvoicing/PacConnectionRecord/activeConnection',
    './../common/constants',
    './../common/application',
    'N/search',
    'N/record',
    'N/config',
    'N/runtime',
    'N/log',
], function (
    commonDataProvider,
    certifier,
    pacConnectionInfo,
    constants,
    application,
    search,
    record,
    config,
    runtime,
    log
) {
    function sendForCertification(context) {

        var bundleIds = runtime.getCurrentScript().bundleIds;
        var userId = runtime.getCurrentUser().id;
        var connection = pacConnectionInfo.get();

        if (!connection.pdfLocaleIsoCode) {
            connection.pdfLocaleIsoCode = constants.DEFAULT_PAC_PDF_LOCALE;
        }

        connection.companyRFC = getCompanyRFCForTransaction(context.transaction.tranType, context.transaction.id);
        log.debug('connection.companyRFC', connection.companyRFC);
        switch ((connection.companyRFC).toUpperCase()) {
            case 'AGU820415M75':
                // Aceros de guasave
                connection.username = '82c45445-d8b5-4814-bc49-67fd6b2271f8';
                break;
            case 'PFP810520JX0':
                // Proveedora de fierro y perfiles
                connection.username = '403b2640-9a50-458b-a5e7-7f50d9178f76';
                break;
            case 'NAC930405296':
                // NH Aceros
                connection.username = '36979088-c587-4057-bbe9-040196948e23';
                break;

            default:
                connection.companyRFC = '';
                connection.username = '';
                break;
        }
        log.audit({
            title: 'connection.username',
            details: JSON.stringify(connection.username)
        });

        log.debug('connection pdf locale', connection.pdfLocaleIsoCode);
        var templateCertifier = certifier.getInstance({
            bundleName: constants.OTHER.MEXICO_COMPLIANCE_BUNDLE_NAME,
            bundleId: bundleIds && bundleIds.length > 0 ? bundleIds[0] : 'NO_BUNDLEID',
            userId: userId,
            context: context,
            connection: connection,
        });
        templateCertifier.send();
        log.debug('Post PAC certification results : ', templateCertifier.finalResult);
        return templateCertifier.finalResult;
    }

    function getCompanyRFCForTransaction(transactionRecordType, transactionId) {
        var companyInfoRecord;
        var RFCFieldId;

        if (application.isOneWorld() && (!transactionRecordType || !transactionId)) {
            throw 'OW accounts require transaction record type and transaction id parameter to determine Company RFC';
        }

        if (application.isSuiteTax()) {
            if (application.isOneWorld()) {
                // STE OW
                companyInfoRecord = record.load({
                    type: record.Type.SUBSIDIARY,
                    id: _getTransactionSubsidiaryId(transactionRecordType, transactionId),
                });
            } else {
                // STE SI
                companyInfoRecord = config.load({
                    type: config.Type.COMPANY_INFORMATION,
                });
            }
            return _getCompanyRFCforSTE(companyInfoRecord);
        } else {
            if (application.isOneWorld()) {
                // Legacy OW
                companyInfoRecord = record.load({
                    type: record.Type.SUBSIDIARY,
                    id: _getTransactionSubsidiaryId(transactionRecordType, transactionId),
                });
                RFCFieldId = constants.FIELD.FEDERAL_ID_NUMBER;
            } else {
                // Legacy SI
                companyInfoRecord = config.load({
                    type: config.Type.COMPANY_INFORMATION,
                });
                RFCFieldId = constants.FIELD.EMPLOYER_ID;
            }
            return _getCompanyRFCforLegacy(companyInfoRecord, RFCFieldId);
        }
    }

    function _getCompanyRFCforSTE(companyInfoRecord) {
        var lineCount = companyInfoRecord.getLineCount({
            sublistId: constants.SUBLIST.TAX_REGISTRATION,
        });
        var country;
        for (var i = 0; i < lineCount; i++) {
            country = companyInfoRecord.getSublistValue({
                sublistId: constants.SUBLIST.TAX_REGISTRATION,
                fieldId: constants.FIELD.NEXUS_COUNTRY,
                line: i,
            });
            if (country === constants.OTHER.MEXICO_COUNTRY_CODE) {
                return companyInfoRecord.getSublistValue({
                    sublistId: constants.SUBLIST.TAX_REGISTRATION,
                    fieldId: constants.FIELD.TAX_REGISTRATION_NUMBER,
                    line: i,
                });
            }
        }
    }

    function _getCompanyRFCforLegacy(record, fieldId) {
        return record.getValue(fieldId);
    }

    function _getTransactionSubsidiaryId(transactionRecordType, transactionId) {
        var filters = [];
        var columns = [];

        filters.push({
            name: constants.FIELD.INTERNALID,
            operator: search.Operator.IS,
            values: transactionId,
        });

        columns.push({
            name: constants.FIELD.SUBSIDIARY
        });

        var transactionSearch = search.create({
            type: transactionRecordType,
            columns: columns,
            filters: filters,
        });

        var subsidiaryId = [];
        transactionSearch.run().each(function (result) {
            subsidiaryId.push(result.getValue({
                name: constants.FIELD.SUBSIDIARY,
            }));
        });

        if (subsidiaryId.length !== 1) {
            log.error('Unexpected number of subsidiaries selected on transaction. Exactly One is expected');
            return null;
        }

        return subsidiaryId[0];
    }

    return {
        do: sendForCertification,
        getCompanyRFCForTransaction: getCompanyRFCForTransaction,
    };
});