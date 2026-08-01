/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
	'N/search',
	'./../../common/constants',
	'./../../common/application',
], function (
	search,
	constants,
	application
) {
	'use strict';

	function getSubsidiaryIdsByCountry (country) {
		var filters = [];
		var columns = [];

		filters.push({
			name: 'isinactive',
			operator: search.Operator.IS,
			values: 'F',
		});
		filters.push({
			name: 'country',
			operator: search.Operator.ANYOF,
			values: country,
		});
		var subsidiarySearch = search.create({
			type: search.Type.SUBSIDIARY,
			columns: columns,
			filters: filters,
		});

		var ids = [];
		subsidiarySearch.run().each(function (result) {
			ids.push(result.id);
			return true;
		});

		return ids;
	}

	function thereAreOtherPacsEnabledBesidesCurrentOne (pacId) {
		var filters = [];
		var columns = [];

		filters.push({
			name: constants.FIELD.MX_PACINFO_ENABLE,
			operator: search.Operator.IS,
			values: 'T',
		});
		if (pacId && !application.isOneWorld()) {
			filters.push({
				name: constants.FIELD.INTERNALID,
				operator: search.Operator.NONEOF,
				values: [pacId],
			});
		}

		var activePacSearch = search.create({
			type: constants.RECORD_TYPE.MX_PAC_CONNECTION_INFO,
			columns: columns,
			filters: filters,
		});

		var results = activePacSearch.run().getRange({start: 0, end: 1});

		return results.length > 0;
	}

	function getActivePacConnectionIds () {
		var filters = [];
		var columns = [];

		filters.push({
			name: constants.FIELD.MX_PACINFO_ENABLE,
			operator: search.Operator.IS,
			values: 'T',
		});
		var activePacSearch = search.create({
			type: constants.RECORD_TYPE.MX_PAC_CONNECTION_INFO,
			columns: columns,
			filters: filters,
		});

		var activePACs = [];
		activePacSearch.run().each(function (result) {
			activePACs.push(result.id);
			return true;
		});

		return activePACs;
	}

	function getActivePacConnections (subsidiaryId) {
		var filters = [];
		var columns = [];

		filters.push({
			name: constants.FIELD.MX_PACINFO_ENABLE,
			operator: search.Operator.IS,
			values: 'T',
		});
		if (subsidiaryId && application.isOneWorld()) {
			filters.push({
				name: constants.FIELD.MX_PACINFO_SUBSIDIARY,
				operator: search.Operator.ANYOF,
				values: [subsidiaryId],
			});
		}

		columns.push({ name: constants.FIELD.MX_PACINFO_TAXID });
		columns.push({ name: constants.FIELD.MX_PACINFO_URL });
		columns.push({ name: constants.FIELD.MX_PACINFO_USERNAME });
		columns.push({ name: constants.FIELD.MX_PACINFO_PASSWORD_BACKEND });
		columns.push({ name: constants.FIELD.MX_PACINFO_EDOC_PACKAGE });
		columns.push({ name: constants.FIELD.MX_PACINFO_PAC_PLUGIN_IMPL });

		columns.push({ name: constants.FIELD.MX_PACINFO_TMPL_INVOICE });
		columns.push({ name: constants.FIELD.MX_PACINFO_TMPL_CREDITMEMO });
		columns.push({ name: constants.FIELD.MX_PACINFO_TMPL_CASHSALE });
		columns.push({ name: constants.FIELD.MX_PACINFO_TMPL_PAYMENT });
		columns.push({ name: constants.FIELD.MX_PACINFO_TMPL_ITEMFULFILLMENT });

		columns.push({ name: constants.FIELD.MX_PACINFO_PDF_DEFAULT_LANGUAGE });

		columns.push({ name: constants.FIELD.MX_PACINFO_INVOICE_SERIE });
		columns.push({ name: constants.FIELD.MX_PACINFO_CREDIT_MEMO_SERIE });
		columns.push({ name: constants.FIELD.MX_PACINFO_CASH_SALE_SERIE });
		columns.push({ name: constants.FIELD.MX_PACINFO_CUSTOMER_PAYMENT_SERIE });
		columns.push({ name: constants.FIELD.MX_PACINFO_ITEM_FULFILLMENT_SERIE });

		columns.push({ name: constants.FIELD.MX_PACINFO_INVOICE_PREFIX });
		columns.push({ name: constants.FIELD.MX_PACINFO_CREDIT_MEMO_PREFIX });
		columns.push({ name: constants.FIELD.MX_PACINFO_CASH_SALE_PREFIX });
		columns.push({ name: constants.FIELD.MX_PACINFO_CUSTOMER_PAYMENT_PREFIX });
		columns.push({ name: constants.FIELD.MX_PACINFO_ITEM_FULFILLMENT_PREFIX });

		columns.push({ name: constants.FIELD.MX_PACINFO_INVOICE_SUFFIX });
		columns.push({ name: constants.FIELD.MX_PACINFO_CREDIT_MEMO_SUFFIX });
		columns.push({ name: constants.FIELD.MX_PACINFO_CASH_SALE_SUFFIX });
		columns.push({ name: constants.FIELD.MX_PACINFO_CUSTOMER_PAYMENT_SUFFIX });
		columns.push({ name: constants.FIELD.MX_PACINFO_ITEM_FULFILLMENT_SUFFIX });

		var activePacSearch = search.create({
			type: constants.RECORD_TYPE.MX_PAC_CONNECTION_INFO,
			columns: columns,
			filters: filters,
		});

		var activePACs = [];
		activePacSearch.run().each(function (result) {
			var connectionObject = {};
			connectionObject.taxId = result.getValue({
				name: constants.FIELD.MX_PACINFO_TAXID,
			});
			connectionObject.edocPackage = result.getValue({
				name: constants.FIELD.MX_PACINFO_EDOC_PACKAGE,
			});
			connectionObject.plugin = result.getValue({
				name: constants.FIELD.MX_PACINFO_PAC_PLUGIN_IMPL,
			});
			connectionObject.url = result.getValue({
				name: constants.FIELD.MX_PACINFO_URL,
			});
			connectionObject.username = result.getValue({
				name: constants.FIELD.MX_PACINFO_USERNAME,
			});
			connectionObject.password = result.getValue({
				name: constants.FIELD.MX_PACINFO_PASSWORD_BACKEND,
			});
			connectionObject.pdfLocaleId = result.getValue({
				name : constants.FIELD.MX_PACINFO_PDF_DEFAULT_LANGUAGE,
			});
			connectionObject.id = result.id;

			var templates = {};
			connectionObject.templates = templates;
			templates[constants.RECORD_TYPE.INVOICE] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_TMPL_INVOICE,
			});
			templates[constants.RECORD_TYPE.CREDIT_MEMO] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_TMPL_CREDITMEMO,
			});
			templates[constants.RECORD_TYPE.CASH_SALE] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_TMPL_CASHSALE,
			});
			templates[constants.RECORD_TYPE.CUSTOMER_PAYMENT] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_TMPL_PAYMENT,
			});
			templates[constants.RECORD_TYPE.ITEM_FULFILLMENT] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_TMPL_ITEMFULFILLMENT,
			});

			var series = {};
			connectionObject.series = series;
			series[constants.RECORD_TYPE.INVOICE] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_INVOICE_SERIE,
			});
			series[constants.RECORD_TYPE.CREDIT_MEMO] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_CREDIT_MEMO_SERIE,
			});
			series[constants.RECORD_TYPE.CASH_SALE] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_CASH_SALE_SERIE,
			});
			series[constants.RECORD_TYPE.CUSTOMER_PAYMENT] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_CUSTOMER_PAYMENT_SERIE,
			});
			series[constants.RECORD_TYPE.ITEM_FULFILLMENT] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_ITEM_FULFILLMENT_SERIE,
			});

			var prefixes = {};
			connectionObject.prefixes = prefixes;
			prefixes[constants.RECORD_TYPE.INVOICE] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_INVOICE_PREFIX,
			});
			prefixes[constants.RECORD_TYPE.CREDIT_MEMO] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_CREDIT_MEMO_PREFIX,
			});
			prefixes[constants.RECORD_TYPE.CASH_SALE] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_CASH_SALE_PREFIX,
			});
			prefixes[constants.RECORD_TYPE.CUSTOMER_PAYMENT] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_CUSTOMER_PAYMENT_PREFIX,
			});
			prefixes[constants.RECORD_TYPE.ITEM_FULFILLMENT] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_ITEM_FULFILLMENT_PREFIX,
			});

			var suffixes = {};
			connectionObject.suffixes = suffixes;
			suffixes[constants.RECORD_TYPE.INVOICE] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_INVOICE_SUFFIX,
			});
			suffixes[constants.RECORD_TYPE.CREDIT_MEMO] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_CREDIT_MEMO_SUFFIX,
			});
			suffixes[constants.RECORD_TYPE.CASH_SALE] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_CASH_SALE_SUFFIX,
			});
			suffixes[constants.RECORD_TYPE.CUSTOMER_PAYMENT] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_CUSTOMER_PAYMENT_SUFFIX,
			});
			suffixes[constants.RECORD_TYPE.ITEM_FULFILLMENT] = result.getValue({
				name  : constants.FIELD.MX_PACINFO_ITEM_FULFILLMENT_SUFFIX,
			});

			activePACs.push(connectionObject);
			return true;
		});

		return activePACs;
	}


	function getPacPdfISOCode (id) {
				
		var fields = search.lookupFields({
			id : id,
			type : constants.RECORD_TYPE.MX_PAC_PDF_LANGUAGE,
			columns : constants.FIELD.MX_PACINFO_PDFLOCALE_ISOCODE,
		});

		return fields?fields[constants.FIELD.MX_PACINFO_PDFLOCALE_ISOCODE]:null;  
	}

	function getPacEnableValue (id) {
		var fields = search.lookupFields({
			id : id,
			type : constants.RECORD_TYPE.MX_PAC_CONNECTION_INFO,
			columns : constants.FIELD.MX_PACINFO_ENABLE,
		});

		return fields?fields[constants.FIELD.MX_PACINFO_ENABLE]:null;  
	}

	return {
		getSubsidiaryIdsByCountry : getSubsidiaryIdsByCountry,
		thereAreOtherPacsEnabledBesidesCurrentOne : thereAreOtherPacsEnabledBesidesCurrentOne,
		getActivePacConnections : getActivePacConnections,
		getActivePacConnectionIds :getActivePacConnectionIds,
		getPacPdfISOCode : getPacPdfISOCode,
		getPacEnableValue : getPacEnableValue,
	};
});
