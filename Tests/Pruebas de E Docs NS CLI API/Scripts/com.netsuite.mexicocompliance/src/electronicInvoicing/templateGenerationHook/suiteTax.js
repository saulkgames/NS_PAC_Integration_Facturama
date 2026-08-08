/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(['./../../common/constants', 'N/log'], function (constants, log) {
	'use strict';

	var PERCENT = 100.0;

	function SuiteTax (nsQuery) {
		this.nsQuery = nsQuery;
		this.taxCodeRecords = null;
		this.taxDetailsCache = {
			txnId: null,
			taxDetails: [],
		};
	}

	SuiteTax.prototype._getTaxDetailItemsWithRefAsKey = function (txnRecord) {
		var lineCount = txnRecord.getLineCount({
			sublistId: 'taxdetails',
		});
		var taxDetailItems = {};
		var taxItem;
		var taxCode, netAmount, lineNumber, taxRate, taxAmount;
		var taxDetailsRef, taxBaseAmount;
		for (var idx = 0; idx < lineCount; idx++) {
			lineNumber = txnRecord.getSublistValue({
				sublistId: 'taxdetails',
				fieldId: 'linenumber',
				line: idx,
			});
			taxCode = txnRecord.getSublistValue({
				sublistId: 'taxdetails',
				fieldId: 'taxcode',
				line: idx,
			});
			netAmount = txnRecord.getSublistValue({
				sublistId: 'taxdetails',
				fieldId: 'netamount',
				line: idx,
			});
			taxRate = txnRecord.getSublistValue({
				sublistId: 'taxdetails',
				fieldId: 'taxrate',
				line: idx,
			});

			taxDetailsRef = txnRecord.getSublistValue({
				sublistId: 'taxdetails',
				fieldId: 'taxdetailsreference',
				line: idx,
			});

			taxAmount = txnRecord.getSublistValue({
				sublistId: 'taxdetails',
				fieldId: 'taxamount',
				line: idx,
			});
			taxBaseAmount = txnRecord.getSublistValue({
				sublistId: 'taxdetails',
				fieldId: 'taxbasis',
				line: idx,
			});

			taxItem = {
				taxAmount: taxAmount,
				taxCode: taxCode,
				netAmount: netAmount,
				taxRate: taxRate ? taxRate : 0,
				lineNumber: lineNumber,
				taxBaseAmount: taxBaseAmount,
			};
			if (!taxDetailItems[taxDetailsRef]) {
				taxDetailItems[taxDetailsRef] = [];
			}
			taxDetailItems[taxDetailsRef].push(taxItem);
		}
		return taxDetailItems;
	};

	SuiteTax.prototype._getSuiteTaxItem = function (taxDetail, customItem, suiteTaxWithholdingTaxTypes) {
		var customTaxes = customItem.taxes;
		var taxLineItem = {};

		if (!this.taxCodeRecords) {
			this.taxCodeRecords = {};
			var taxCodeRecordResultsIterator = this.nsQuery.runSuiteQLPaged({
				query: constants.SUITEQL.SUITETAX.SALES_TAX_ITEM.NOT_ENCODED_FIELDS,
				pageSize: 1000,
			}).iterator();
			var _taxCodeRecords = this.taxCodeRecords;
			taxCodeRecordResultsIterator.each(function (taxCodeRecordResultPage) {
				var pageResults = taxCodeRecordResultPage.value.data.results;
				pageResults.forEach(function (taxCodeRecordResultRow) {
					var taxCodeRecordResult = taxCodeRecordResultRow.asMap();
					_taxCodeRecords[taxCodeRecordResult.id] = taxCodeRecordResult;
				})
				return true;
			});
		}

		var taxCodeRecord = this.taxCodeRecords[taxDetail.taxCode];

		taxLineItem.taxBaseAmount = taxDetail.taxBaseAmount;
		taxLineItem.taxRate = taxDetail.taxRate / PERCENT;
		taxLineItem.taxAmount = taxDetail.taxAmount ? taxDetail.taxAmount : 0.0;
		taxLineItem.taxCode = taxDetail.taxCode;
		taxLineItem.satTaxCodeKey = 'k' + taxDetail.taxCode;
		taxLineItem.taxType = taxCodeRecord && taxCodeRecord.taxtype
			? taxCodeRecord.taxtype
			: null;

		if (suiteTaxWithholdingTaxTypes.indexOf(taxLineItem.taxType) > -1) {
			customTaxes.taxName = 'WITHHOLDING';
			if (!customTaxes.whTaxItems) {
				customTaxes.whTaxItems = [];
			}
			customTaxes.whTaxItems.push(taxLineItem);
		} else {
			customTaxes.taxName = 'TRANSFERS';
			if (!customTaxes.taxItems) {
				customTaxes.taxItems = [];
			}
			customTaxes.taxItems.push(taxLineItem);
		}
		customTaxes.taxAmount = taxDetail.taxAmount ? taxDetail.taxAmount : 0.0;
		customItem.taxes = customTaxes;
	};

	SuiteTax.prototype.addTaxes = function (customItem, txnRecord, line, suiteTaxWithholdingTaxTypes) {
		// _getTaxDetailItemsWithRefAsKey returns always the same list for the same transaction for whatever line object
		// we are sourcing, and the time consumption is proportional to the number of tax lines.
		// This primitive cache system allow us to speedup invoice (and payment) generation when there are a lot of
		// tax items.
		if (this.taxDetailsCache.txnId !== txnRecord.getValue('id')) {
			this.taxDetailsCache.txnId = txnRecord.getValue('id');
			this.taxDetailsCache.taxDetails = this._getTaxDetailItemsWithRefAsKey(txnRecord);
		}
		var taxDetails = this.taxDetailsCache.taxDetails;
		var taxDetailsRef = txnRecord.getSublistValue({
			sublistId: 'item',
			fieldId: 'taxdetailsreference',
			line: line,
		});
		if (taxDetails[taxDetailsRef]) {
			taxDetails[taxDetailsRef].forEach(function (taxDetail) {
				this._getSuiteTaxItem(taxDetail, customItem, suiteTaxWithholdingTaxTypes);
			}, this);
		}
	};

	function getInstance (nsQuery) {
		return new SuiteTax(nsQuery);
	}

	return {
		getInstance: getInstance,
	};
});
