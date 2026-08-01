/**
 * Copyright (c) 2021, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(['./../../common/constants'], function (constants) {
	'use strict';

	function Rfc (config, record) {
		this.config = config;
		this.record = record;
	}

	Rfc.prototype.addCompanyRfc = function (result, txnRecord, recordsLoaded) {
		var companyInfo = result.companyInfo;
		var industryTypeId;
		var companyInfoRecord = this._getCompanyInfoRecord(result.oneWorldFeature, txnRecord);

		if (!companyInfoRecord) {
			recordsLoaded.companyInfoRecord = undefined;
			return;
		}

		if (result.suiteTaxFeature) {
			this._addRfcFromTaxRegistrationsSublist(companyInfoRecord, companyInfo);
		} else {
			var fieldId = result.oneWorldFeature
				? constants.FIELD.FEDERAL_ID_NUMBER
				: constants.FIELD.EMPLOYER_ID;
			companyInfo.rfc = companyInfoRecord.getValue(fieldId);
		}

		industryTypeId = companyInfoRecord.getValue(constants.FIELD.INDUSTRY_TYPE);
		result.satCodesDao.getIndustryType(industryTypeId);

		recordsLoaded.companyInfoRecord = companyInfoRecord;
	};

	Rfc.prototype._getCompanyInfoRecord = function (isOneWorld, txnRecord) {
		return isOneWorld
			? this.record.load({
				type : this.record.Type.SUBSIDIARY,
				id : txnRecord.getValue('subsidiary'),
			})
			: this.config.load({
				type : this.config.Type.COMPANY_INFORMATION,
			});
	};

	Rfc.prototype._addRfcFromTaxRegistrationsSublist = function (companyInfoRecord, companyInfo) {
		var lineCount = companyInfoRecord.getLineCount({
			sublistId : constants.SUBLIST.TAX_REGISTRATION,
		});
		for (var i=0; i<lineCount; i++) {
			var country = companyInfoRecord.getSublistValue({
				sublistId: constants.SUBLIST.TAX_REGISTRATION,
				fieldId : constants.FIELD.NEXUS_COUNTRY,
				line : i,
			});
			if (country === constants.OTHER.MEXICO_COUNTRY_CODE) {
				companyInfo.rfc = companyInfoRecord.getSublistValue({
					sublistId: constants.SUBLIST.TAX_REGISTRATION,
					fieldId: constants.FIELD.TAX_REGISTRATION_NUMBER,
					line : i,
				});
				break;
			}
		}
	};

	function getInstance (config, record) {
		return new Rfc(config, record);
	}

	return {
		getInstance: getInstance,
	};
});
