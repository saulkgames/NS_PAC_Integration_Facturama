/**
 * Copyright (c) 2020, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(
	[
		'N/config',
		'N/log',
		'N/record',
		'N/search',
		'./../common/application',
		'./../common/constants',
	],
	function (config, log, record, search, application, constants) {
		'use strict';

		function getCompanyRFCForTransaction (transactionRecordType, transactionId) {
			var companyInfoRecord;
			var RFCFieldId;

			if (application.isOneWorld() && (!transactionRecordType || !transactionId)) {
				throw 'OW accounts require transaction record type and transaction id parameter to determine Company RFC';
			}

			if (application.isSuiteTax()) {
				if (application.isOneWorld()) {
					companyInfoRecord = _loadCompanyInfoRecord(transactionRecordType, transactionId);
				} else {
					companyInfoRecord = _loadCompanyInfoConfiguration();
				}
				return _getCompanyRFCforSTE(companyInfoRecord);
			} else {
				if (application.isOneWorld()) {
					companyInfoRecord = _loadCompanyInfoRecord(transactionRecordType, transactionId);
					RFCFieldId = constants.FIELD.FEDERAL_ID_NUMBER;
				} else {
					companyInfoRecord = _loadCompanyInfoConfiguration();
					RFCFieldId = constants.FIELD.EMPLOYER_ID;
				}
				return _getCompanyRFCforLegacy(companyInfoRecord, RFCFieldId);
			}
		}

		function _getCompanyRFCforSTE (companyInfoRecord) {
			var lineCount = companyInfoRecord.getLineCount({
				sublistId : constants.SUBLIST.TAX_REGISTRATION,
			});
			var country;
			for (var i=0; i<lineCount; i++) {
				country = companyInfoRecord.getSublistValue({
					sublistId: constants.SUBLIST.TAX_REGISTRATION,
					fieldId : constants.FIELD.NEXUS_COUNTRY,
					line : i,
				});
				if (country === constants.OTHER.MEXICO_COUNTRY_CODE) {
					return companyInfoRecord.getSublistValue({
						sublistId: constants.SUBLIST.TAX_REGISTRATION,
						fieldId: constants.FIELD.TAX_REGISTRATION_NUMBER,
						line : i,
					});
				}
			}
		}

		function _getCompanyRFCforLegacy (record, fieldId) {
			return record.getValue(fieldId);
		}

		function _getTransactionSubsidiaryId (transactionRecordType, transactionId) {
			var filters = [];
			var columns = [];

			filters.push({
				name: constants.FIELD.INTERNALID,
				operator: search.Operator.IS,
				values: transactionId,
			});

			columns.push({ name: constants.FIELD.SUBSIDIARY });

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

		function _loadCompanyInfoRecord (transactionRecordType, transactionId) {
			return record.load({
				type : record.Type.SUBSIDIARY,
				id : _getTransactionSubsidiaryId(transactionRecordType, transactionId),
			});
		}

		function _loadCompanyInfoConfiguration () {
			return config.load({
				type : config.Type.COMPANY_INFORMATION,
			});
		}

		return {
			getForTransaction: getCompanyRFCForTransaction,
		};
	}
);
