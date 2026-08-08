/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
	'N/query',
	'N/record',
	'./../../common/constants',
], function (nsquery,record, constants) {
	'use strict';

	var proofTypeMap = {
		invoice: 'I',
		cashsale: 'I',
		creditmemo: 'E',
		itemfulfillment: 'T',
	};

	function SATCodes (cfdi, satMappingLookup, transactionRecord) {
		this.cfdi = cfdi;
		this.satMappingLookup = satMappingLookup;

		var items = [];
		var itemLineCount = transactionRecord.type === constants.RECORD_TYPE.CUSTOMER_PAYMENT
			? 0
			: transactionRecord.getLineCount({sublistId: 'item'});
		for (var index = 0; index < itemLineCount; index++) {
			items[index] = { taxes: [] };
		}
		this.satcodes = {
			items: items,
			paymentTermInvMap: {},
			paymentMethodInvMap: {},
			whTaxTypes: {},
			taxTypes: {},
			paymentTermSatCodes: {},
			paymentMethodCodes: {},
		};
		this.satItemCodesCache = {};
		this.satTaxCodeCache = null;
		this.satMappingValCache = null;
		this.satPaymentTermCache = null;
		this.satIndustryTypeCache = null;
		this.satExportTypeCache = {};
	}

	SATCodes.prototype._getMexicoSatItemCode = function (id) {
		var strId = id + '';
		return this.satItemCodesCache[strId] || {code: undefined};
	};

	SATCodes.prototype.getMexicoTaxObject = function (id) {
		var defaultObj = {code: undefined};
		if (!id) {
			return defaultObj;
		}

		if (!this.satTaxCodeCache) {
			this.satTaxCodeCache = {};

			var queryResults = nsquery.runSuiteQL({
				query: constants.SUITEQL.SAT.TAX_OBJECT.NOT_ENCODED_FIELDS,
			}).asMappedResults();

			queryResults.forEach(function (result) {
				this.satTaxCodeCache[result.id] = {
					code: result['code'],
				};
			}, this);
		}

		return this.satTaxCodeCache[id] || defaultObj;
	};


	SATCodes.prototype._getMexicoMappingValue = function (id) {

		var defaultObj = {code: undefined, name: undefined};

		if (!id) {
			return defaultObj;
		}

		if (!this.satMappingValCache) {
			this.satMappingValCache = {};

			var fields = nsquery.runSuiteQL({
				query: constants.SUITEQL.MX_MAPPER_VALUES.NOT_ENCODED_FIELDS,
			}).asMappedResults();

			fields.forEach(function (field) {
				var id = field.id + '';
				this.satMappingValCache[id] = {
					code: field['custrecord_mx_mapper_value_inreport'],
					name: field.name,
				};
			}, this);
		}
		var strId = '' + id;
		return this.satMappingValCache[strId] || defaultObj;
	};

	SATCodes.prototype.getMexicoSatPaymentTerm = function (id) {

		if (!this.satPaymentTermCache) {
			this.satPaymentTermCache = {};
			var fields = nsquery.runSuiteQL({
				query: constants.SUITEQL.SAT.PAYMENT_TERM.NOT_ENCODED_FIELDS,
			}).asMappedResults();

			fields.forEach(function (field) {
				var id = field.id + '';
				this.satPaymentTermCache[id] = {
					code: field['custrecord_mx_sat_pt_code'],
					name: field.name,
				};
			}, this);
		}
		var strId = '' + id;
		return this.satPaymentTermCache[strId] || {code: undefined, name: undefined};
	};

	SATCodes.prototype.getMexicoSatIndustryType = function (id) {
		if (!id) {
			return;
		}

		if (!this.satIndustryTypeCache) {
			this.satIndustryTypeCache = {};
			var fields = nsquery.runSuiteQL({
				query: constants.SUITEQL.SAT.INDUSTRY_TYPE.NOT_ENCODED_FIELDS,
			}).asMappedResults();

			fields.forEach(function (field) {
				var id = field.id + '';
				this.satIndustryTypeCache[id] = {
					code: field['custrecord_mx_sat_it_code'],
					name: field.name,
				};
			}, this);
		}
		var strId = '' + id;
		return this.satIndustryTypeCache[strId] || {code: undefined, name: undefined};
	};

	SATCodes.prototype.getPaymentTerm = function (id, invoiceId) {
		if (!id) {
			return;
		}
		var obj = this.getMexicoSatPaymentTerm(id);
		var code = obj.code;
		if (invoiceId) {
			this.satcodes.paymentTermInvMap['d' + invoiceId] = code;
			return code;
		}
		this.satcodes.paymentTerm = code;
		this.satcodes.paymentTermName = obj.name;
		return code;
	};

	SATCodes.prototype.getPaymentStringTypeCode = function (paymentStringTypeId) {
		if (!paymentStringTypeId) {
			return;
		}

		var paymentString = record.load({
			type: constants.RECORD_TYPE.MX_PAYMENT_STRING_TYPE,
			id: paymentStringTypeId,
		});

		if (!paymentString) {
			return;
		}

		this.satcodes.paymentStringTypeCode = paymentString.getValue('custrecord_mx_code');
		this.satcodes.paymentStringTypeName = paymentString.getValue('name');
		return this.satcodes.paymentStringTypeCode;
	};

	SATCodes.prototype.getPaymentMethod = function (id, invoiceId) {
		if (!id) {
			return;
		}
		var obj = this._getMexicoMappingValue(id);
		if (invoiceId) {
			this.satcodes.paymentMethodInvMap['d' + invoiceId] = obj.code;
			return obj.code;
		}
		this.satcodes.paymentMethod = obj.code;
		this.satcodes.paymentMethodName = obj.name;
		return obj.code;
	};

	SATCodes.prototype.getExportType = function (id) {
		var defaultObject = {code: undefined, name: undefined};
		if (!id) {
			return defaultObject;
		}

		var obj = this.satExportTypeCache[id];

		if (!obj) {
			try {
				var satExportType = record.load({
					type: constants.RECORD_TYPE.MX_SAT_EXPORT_TYPE,
					id: id,
				});
				this.satExportTypeCache[id] = {
					code: satExportType.getValue('custrecord_mx_sat_et_code'),
					name: satExportType.getValue('name'),
				};
			} catch (err) {
				this.satExportTypeCache[id] = defaultObject;
			}
			obj = this.satExportTypeCache[id];
		}

		this.satcodes.exportType = obj.code;
		this.satcodes.exportTypeName = obj.name;

		return obj;
	};

	SATCodes.prototype.getAllLineItemCodes = function (satItemCodeIds) {
		// If satcodes.items is not fulfilled, we don't have any place where to store the data, so no need to continue.
		// This happens in Customer Payment generation.
		if (satItemCodeIds.length === 0 || this.satcodes.items.length === 0) {
			return;
		}

		// Get all ids not null or empty to avoid creating a bad query with empty ids.
		var notEmptySatItemCodeIds = satItemCodeIds.filter(function (id) {
			return id !== '' && !!id;
		});

		if (notEmptySatItemCodeIds.length === 0) {
			return;
		}

		// Create and run the query to get all ids that we need.
		var fields = nsquery.runSuiteQL({
			query: constants.SUITEQL.SAT.ITEM_CODE_MIRROR.NOT_ENCODED_FIELDS.replace(constants.SUITEQL.LIST_PLACEHOLDER, notEmptySatItemCodeIds.join(',')),
		}).asMappedResults();
		fields.forEach(function (field) {
			var id = field.id + '';
			this.satItemCodesCache[id] = {
				code: field['custrecord_mx_ic_mr_code'],
			};
		}, this);

		for (var idx = 0; idx < satItemCodeIds.length; idx++) {
			var satItemCodeId = satItemCodeIds[idx];
			this._getLineItemCode(
				idx,
				satItemCodeId
			);
		}
	};

	SATCodes.prototype._getLineItemCode = function (lineNo, id) {
		if (!id) {
			return;
		}
		var lineSatCodes = this.satcodes.items[lineNo];
		lineSatCodes.itemCode = this._getMexicoSatItemCode(id).code;
	};

	SATCodes.prototype.addLineTaxObject = function (lineNo, id) {
		if (!id || this.satcodes.items.length === 0) {
			return;
		}
		var lineSatCodes = this.satcodes.items[lineNo];
		lineSatCodes.taxObject = this.getMexicoTaxObject(id).code;
	};

	SATCodes.prototype.getIndustryType = function (id) {
		if (!id) {
			return;
		}
		var obj = this.getMexicoSatIndustryType(id);
		this.satcodes.industryType = obj.code;
		this.satcodes.industryTypeName = obj.name;
	};

	SATCodes.prototype.getCustomerIndustryType = function (id) {
		if (!id) {
			return;
		}
		var obj = this.getMexicoSatIndustryType(id);
		this.satcodes.customerIndustryType = obj.code;
		this.satcodes.customerIndustryTypeName = obj.name;
	};

	SATCodes.prototype.getProofType = function (type) {
		this.satcodes.proofType = proofTypeMap[type];
	};

	SATCodes.prototype.pushForLineSatTaxCode = function (taxType, wh) {
		if (!taxType) {
			return;
		}
		this.satMappingLookup.needTaxCategory(taxType, wh);
	};

	SATCodes.prototype.pushForLineSatTaxFactorType = function (taxCode) {
		if (!taxCode) {
			return;
		}
		this.satMappingLookup.needTaxFactorType(taxCode);
	};

	SATCodes.prototype.fetchSatTaxCodesForAllPushed = function () {
		this.satcodes.whTaxTypes = this.satMappingLookup.getSatTaxCategories(true);
		this.satcodes.taxTypes = this.satMappingLookup.getSatTaxCategories(false);
	};

	SATCodes.prototype.fetchSatTaxFactorTypeForAllPushed = function () {
		this.satcodes.taxFactorTypes = this.satMappingLookup.getSatTaxFactorType();
	};

	SATCodes.prototype.fetchSatUnitCodesForAllPushed = function () {
		this.satcodes.unitCodes = this.satMappingLookup.getSatUnitCodes();
	};

	SATCodes.prototype.pushForLineSatUnitCode = function (unit) {
		if (!unit) {
			return;
		}
		this.satMappingLookup.needUnitCode(unit);
	};

	SATCodes.prototype.getJson = function () {
		return this.satcodes;
	};

	SATCodes.prototype.getTransactionLevelSatCodes = function (txnRecord) {
		var paymentTerm = txnRecord.getValue(constants.FIELD.MX_SAT_PAYMENT_TERM);
		var paymentMethod = txnRecord.getValue(constants.FIELD.MX_SAT_PAYMENT_METHOD);
		var cfdiUsageId = txnRecord.getValue(constants.FIELD.MX_CFDI_USAGE);
		var exportTypeId = txnRecord.getValue(constants.FIELD.MX_CFDI_SAT_EXPORT_TYPE);
		this.getPaymentTerm(paymentTerm);
		this.getPaymentMethod(paymentMethod);
		var obj = this.cfdi.getCfdiUsage(cfdiUsageId);

		if (obj) {
			this.satcodes.cfdiUsage = obj.code;
			this.satcodes.cfdiUsageName = obj.name;
		} else {
			this.satcodes.cfdiUsage = '';
			this.satcodes.cfdiUsageName = '';
		}

		this.getExportType(exportTypeId);
		this.getProofType(txnRecord.type);
	};

	function getInstance (cfdi, satMappingLookup, transactionRecord) {
		return new SATCodes(cfdi, satMappingLookup, transactionRecord);
	}

	return {
		getInstance: getInstance,
	};
});
