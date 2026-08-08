/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['../common/constants'], function (constants) {
	return Object.freeze({
		country: constants.OTHER.MEXICO_COUNTRY_CODE,
		fields: [
			{
				id: constants.FIELD.MX_CUSTITEM_SAT_ITEM_CODE,
				type: constants.XML_FIELD_TYPE.SELECT,
			},
			{
				id: constants.FIELD.MX_CUSTITEM_SAT_ITEM_TYPE,
				type: constants.XML_FIELD_TYPE.SELECT
			},
			{
				id: constants.FIELD.MX_CUSTOMER_RFC,
				type: constants.XML_FIELD_TYPE.TEXT,
				keepHiddenIn: [
					constants.RECORD_TYPE.CASH_REFUND,
					constants.RECORD_TYPE.CUSTOMER_DEPOSIT,
					constants.RECORD_TYPE.CUSTOMER_REFUND,
					constants.RECORD_TYPE.ESTIMATE,
					constants.RECORD_TYPE.RETURN_AUTHORIZATION,
				],
			},
			{
				id: constants.FIELD.MX_UUID_RECEIVED,
				type: constants.XML_FIELD_TYPE.TEXT,
				keepHiddenIn: [
					constants.RECORD_TYPE.BLANKET_PURCHASE_ORDER,
					constants.RECORD_TYPE.CHECK,
					constants.RECORD_TYPE.CREDIT_CARD_CHARGE,
					constants.RECORD_TYPE.INVENTORY_STATUS_CHANGE,
					constants.RECORD_TYPE.PURCHASE_CONTRACT,
					constants.RECORD_TYPE.PURCHASE_REQUISITION,
					constants.RECORD_TYPE.VENDOR_RETURN_AUTHORIZATION,
					constants.RECORD_TYPE.PURCHASE_ORDER,
				],
			},
			{
				id: constants.FIELD.OPERATION_TYPE,
				type: constants.XML_FIELD_TYPE.SELECT,
				keepHiddenIn: [
					constants.RECORD_TYPE.BLANKET_PURCHASE_ORDER,
					constants.RECORD_TYPE.CREDIT_CARD_CHARGE,
					constants.RECORD_TYPE.INVENTORY_STATUS_CHANGE,
					constants.RECORD_TYPE.PURCHASE_CONTRACT,
					constants.RECORD_TYPE.PURCHASE_REQUISITION,
					constants.RECORD_TYPE.VENDOR_RETURN_AUTHORIZATION,
				],
			},
			{id: constants.FIELD.MX_PAYMENT_METHOD, type: constants.XML_FIELD_TYPE.SELECT},
			{id: constants.FIELD.MX_BANK_INFORMATION, type: constants.XML_FIELD_TYPE.SELECT},
			{id: constants.FIELD.MX_BANK_INFORMATION_DN, type: constants.XML_FIELD_TYPE.SELECT},
			{id: constants.FIELD.MX_BANK_NAME, type: constants.XML_FIELD_TYPE.TEXT},
			{id: constants.FIELD.MX_BANK_ACCOUNT_NUMBER, type: constants.XML_FIELD_TYPE.TEXT},
			{
				id: constants.FIELD.MX_CUSTENTITY_RFC,
				type: constants.XML_FIELD_TYPE.TEXT,
			},
			{
				id: constants.FIELD.MX_CUSTENTITY_SAT_INDUSTRY_TYPE,
				type: constants.XML_FIELD_TYPE.SELECT,
			},
			{
				id: constants.FIELD.MX_CFDI_ADDENDUM,
				type: constants.XML_FIELD_TYPE.TEXT,
				keepHiddenIn: [
					constants.RECORD_TYPE.CASH_REFUND,
					constants.RECORD_TYPE.CUSTOMER_DEPOSIT,
					constants.RECORD_TYPE.CUSTOMER_REFUND,
					constants.RECORD_TYPE.ESTIMATE,
					constants.RECORD_TYPE.RETURN_AUTHORIZATION,
					constants.RECORD_TYPE.SALES_ORDER,
				],
			},
			{
				id: constants.FIELD.MX_SAT_CERTIFY_TIME_TIMESTAMP,
				type: constants.XML_FIELD_TYPE.TEXT,
				keepHiddenIn: [
					constants.RECORD_TYPE.CASH_REFUND,
					constants.RECORD_TYPE.CUSTOMER_DEPOSIT,
					constants.RECORD_TYPE.CUSTOMER_REFUND,
					constants.RECORD_TYPE.ESTIMATE,
					constants.RECORD_TYPE.RETURN_AUTHORIZATION,
					constants.RECORD_TYPE.SALES_ORDER,
				],
			},
			{
				id: constants.FIELD.MX_SAT_UUID,
				type: constants.XML_FIELD_TYPE.TEXT,
				keepHiddenIn: [
					constants.RECORD_TYPE.CASH_REFUND,
					constants.RECORD_TYPE.CUSTOMER_DEPOSIT,
					constants.RECORD_TYPE.CUSTOMER_REFUND,
					constants.RECORD_TYPE.ESTIMATE,
					constants.RECORD_TYPE.RETURN_AUTHORIZATION,
					constants.RECORD_TYPE.SALES_ORDER,
				],
			},
			{
				id: constants.FIELD.MX_CFDI_SERIE,
				type: constants.XML_FIELD_TYPE.TEXT,
				keepHiddenIn: [
					constants.RECORD_TYPE.SALES_ORDER,
					constants.RECORD_TYPE.ESTIMATE,
				],
			},
			{
				id: constants.FIELD.MX_CFDI_FOLIO,
				type: constants.XML_FIELD_TYPE.TEXT,
				keepHiddenIn: [
					constants.RECORD_TYPE.SALES_ORDER,
					constants.RECORD_TYPE.ESTIMATE,
				],
			},
			{
				id: constants.FIELD.MX_CFDI_SAT_EXPORT_TYPE,
				type: constants.XML_FIELD_TYPE.SELECT,
				keepHiddenIn: [
					constants.RECORD_TYPE.SALES_ORDER,
					constants.RECORD_TYPE.ESTIMATE,
				],
			},
			{
				id: constants.FIELD.MX_CFDI_USAGE,
				type: constants.XML_FIELD_TYPE.SELECT,
				keepHiddenIn: [
					constants.RECORD_TYPE.CASH_REFUND,
					constants.RECORD_TYPE.ESTIMATE,
					constants.RECORD_TYPE.RETURN_AUTHORIZATION,
					constants.RECORD_TYPE.SALES_ORDER,
				],
			},
			{
				id: constants.FIELD.MX_SAT_PAYMENT_TERM,
				type: constants.XML_FIELD_TYPE.SELECT,
				keepHiddenIn: [
					constants.RECORD_TYPE.CASH_REFUND,
					constants.RECORD_TYPE.ESTIMATE,
					constants.RECORD_TYPE.RETURN_AUTHORIZATION,
					constants.RECORD_TYPE.SALES_ORDER,
				],
			},
			{
				id: constants.FIELD.MX_SAT_PAYMENT_METHOD,
				type: constants.XML_FIELD_TYPE.SELECT,
				keepHiddenIn: [
					constants.RECORD_TYPE.CASH_REFUND,
					constants.RECORD_TYPE.CUSTOMER_DEPOSIT,
					constants.RECORD_TYPE.CUSTOMER_REFUND,
					constants.RECORD_TYPE.ESTIMATE,
					constants.RECORD_TYPE.OPPORTUNITY,
					constants.RECORD_TYPE.RETURN_AUTHORIZATION,
					constants.RECORD_TYPE.VENDOR_RETURN_AUTHORIZATION,
				],
			},
			{id: constants.FIELD.MX_RELATED_CFDIS_RELATIONSHIP_TYPE, type: constants.XML_FIELD_TYPE.SELECT},
			{
				id: constants.FIELD.MX_JOURNALENTRY_AUTHORIZEDBY,
				type: constants.XML_FIELD_TYPE.SELECT,
				keepHiddenIn: [
					constants.RECORD_TYPE.JOURNAL_ENTRY,
				],
			},
			{
				id: constants.FIELD.MX_JOURNALENTRY_CREATEDBY,
				type: constants.XML_FIELD_TYPE.SELECT,
				keepHiddenIn: [
					constants.RECORD_TYPE.JOURNAL_ENTRY,
				],
			},
			{id: constants.FIELD.MX_SAT_REGISTERED_NAME_ENTITY, type: constants.XML_FIELD_TYPE.TEXT},
		],
		sublists: [
			constants.SUBLIST.BANK_DETAILS,
			constants.SUBLIST.RELATED_CFDIS,
		],
		sublistColumns: [
			// This is commented because the team decided to only display SAT Item Code column in Custom MX forms.
			// In a future, it will be displayed based on the Subsidiary.
			// To be restored when we can manage sublist columns the same way as body fields
			/* {
				id: constants.SUBLIST.ITEMS,
				columnIds: [
					constants.FIELD.MX_CUSTCOL_SAT_ITEM_CODE,
					constants.FIELD.MX_CUSTCOL_SAT_TAX_OBJECT
				],
			},
			{
				id: constants.SUBLIST.EXPENSES,
				columnIds: [
					constants.FIELD.MX_CUSTCOL_VENDOR,
					constants.FIELD.MX_CUSTCOL_OPERATION_TYPE,
				],
			},*/
		],
	});
});
