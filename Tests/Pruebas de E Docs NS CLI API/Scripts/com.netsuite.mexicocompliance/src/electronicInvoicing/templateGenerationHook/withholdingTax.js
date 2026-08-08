/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */


define([
	'N/record',
	'./../../common/constants',
], function (record, constants) {

	function WithholdingTax (nsQuery, nsFormat, nsLog) {
		this.nsQuery = nsQuery;
		this.nsFormat = nsFormat;
		this.nsLog = nsLog;
		this.taxcodeIDs = null;
		this.taxItemsCache = {};
	}

	WithholdingTax.prototype._getWithHoldingChildTaxItemsIfGroup = function (taxCode) {
		if (this.taxItemsCache[taxCode]) {
			return this.taxItemsCache[taxCode];
		}
		var taxItems = [];
		log.debug('WH tax code', taxCode);
		var withHoldGroupSearch = this.nsQuery.runSuiteQL({
			query: constants.SUITEQL.WITHHOLDING.GROUP_SEARCH.NOT_ENCODED_FIELDS,
			params: [taxCode],
		}).asMappedResults();

		withHoldGroupSearch.forEach(function (result) {
			// Multiplying the rate because the type of the rate column is PERCENT and when fetching it through SQL,
			// it is returned as it is stored (for example 0.16 for 16%), while all other way to fetch it (N/search and N/record)
			// return the value already multiplied by 100 (for example, N/record.load as done below returns 16 for 16%).
			// To keep the code consistency, we multiply the fetched value by 100.
			var taxItem = {
				// eslint-disable-next-line no-magic-numbers
				rate: result[constants.RECORD_TYPE.WT_TAX_CODE.RATE] ? result[constants.RECORD_TYPE.WT_TAX_CODE.RATE] * 100 : null,
				taxtype: result[constants.RECORD_TYPE.WT_TAX_CODE.TYPE],
				itemid: result[constants.RECORD_TYPE.WT_TAX_CODE.NAME],
				id: result['id'],
			};
			taxItems.push(taxItem);
		});

		if (taxItems.length > 0) {
			this.taxItemsCache[taxCode] = taxItems;
			return taxItems;
		}
		var whTaxCodeRecord = record.load({
			type: constants.RECORD_TYPE.WT_TAX_CODE.RECORD,
			id: taxCode,
		});
		var taxType = whTaxCodeRecord.getValue(constants.RECORD_TYPE.WT_TAX_CODE.TYPE);
		var resultObject = [
			{
				rate: whTaxCodeRecord.getValue(constants.RECORD_TYPE.WT_TAX_CODE.RATE),
				taxtype: taxType ? taxType : null,
				itemid: whTaxCodeRecord.getValue(constants.RECORD_TYPE.WT_TAX_CODE.NAME),
				id: taxCode,
			},
		];
		this.taxItemsCache[taxCode] = resultObject;
		return resultObject;
	};

	WithholdingTax.prototype.addTaxes = function (customItem, txnRecord, line, itemBelongsToAGroup) {
		var customTaxes = customItem.taxes;
		var taxCode = txnRecord.getSublistValue({
			sublistId: 'item',
			fieldId: constants.FIELD.WH_ITEMCOL_TAXCODE,
			line: line,
		});
		var taxItems = this._getWithHoldingChildTaxItemsIfGroup(taxCode);
		var taxLineItem = {};
		var taxLineItems = customTaxes.whTaxItems;
		var grossAmount = txnRecord.getSublistValue({
			sublistId: 'item',
			fieldId: constants.FIELD.WH_ITEMCOL_TAXBASEAMOUNT,
			line: line,
		});
		var taxAmount = txnRecord.getSublistValue({
			sublistId: 'item',
			fieldId: constants.FIELD.WH_ITEMCOL_TAXAMOUNT,
			line: line,
		});
		var taxBaseAmount = Math.abs(grossAmount) - customItem.whDiscountBaseAmount;
		var that = this;
		taxItems.map(function (val) {
			taxLineItem = {};

			var taxRatePercent = that.nsFormat.parse({
				type: that.nsFormat.Type.PERCENT,
				value: val.rate ? val.rate : 0.0,
			});
			// eslint-disable-next-line no-magic-numbers
			taxLineItem.taxRate = taxRatePercent / 100;
			taxLineItem.taxBaseAmount = taxBaseAmount;
			taxLineItem.taxCode = val.itemid;

			taxLineItem.itemBelongsToAGroup = itemBelongsToAGroup;
			taxLineItem.taxType = val.taxtype;
			taxLineItem.id = val.id;
			taxLineItems.push(taxLineItem);
		});

		customTaxes.taxName = 'WITHHOLDING';
		customTaxes.taxAmount = taxAmount ? Math.abs(taxAmount) : 0.0;
		customTaxes.whTaxItems = taxLineItems;
		log.debug('WH Taxes', customTaxes);
	};

	WithholdingTax.prototype.getSuiteTaxTypes = function () {
		if (this.taxcodeIDs) {
			return this.taxcodeIDs;
		}
		this.taxcodeIDs = [];
		try {
			this.nsQuery.runSuiteQL({
				query: constants.SUITEQL.SUITETAX.WITHHOLDING.NOT_ENCODED_FIELDS,
				params: ['T', 'MX'],
			}).asMappedResults().forEach(function (result) {
				this.taxcodeIDs.push(result['id']);
			}, this);
		} catch (e) {
			this.nsLog.error(e.name, e.message);
			throw e;
		}
		return this.taxcodeIDs;
	};

	function getInstance (nsQuery, nsFormat, nsLog) {
		return new WithholdingTax(nsQuery, nsFormat, nsLog);
	}

	return {
		getInstance: getInstance,
	};
});
