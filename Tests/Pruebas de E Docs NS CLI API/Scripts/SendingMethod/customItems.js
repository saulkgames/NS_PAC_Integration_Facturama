/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
	'./../../common/constants',
], function (constants) {
	'use strict';

	function CustomItems (legacyTax, suiteTax, whTax) {
		this.legacyTax = legacyTax;
		this.suiteTax = suiteTax;
		this.whTax = whTax;
	}

	CustomItems.prototype._isItemfulfillment = function (txnRecord) {
		return txnRecord.type === 'itemfulfillment';
	};

	CustomItems.prototype._getAmount = function (txnRecord, line) {
		if (this._isItemfulfillment(txnRecord)) {
			return 0.0;
		}
		return txnRecord.getSublistValue({ 
			fieldId: 'amount',
			sublistId: 'item',
			line: line,
		});
	};

	CustomItems.prototype._getUnit = function (txnRecord, line) {
		return txnRecord.getSublistValue({ 
			fieldId: 'units',
			sublistId: 'item',
			line: line,
		});
	};

	CustomItems.prototype._getUnitText = function (txnRecord, line) {
		return txnRecord.getSublistValue({
			fieldId: 'unitsdisplay',
			sublistId: 'item',
			line: line,
		});
	};

	CustomItems.prototype._getQuantity = function (txnRecord, line) {
		if (this._isItemfulfillment(txnRecord)) {
			return 0.0;
		}
		return txnRecord.getSublistValue({ 
			fieldId: 'quantity',
			sublistId: 'item',
			line: line,
		});
	};

	CustomItems.prototype._getUnitPrice = function (txnRecord, line) {
		if (this._isItemfulfillment(txnRecord)) {
			return 0.0;
		}
		return txnRecord.getSublistValue({ 
			fieldId: 'rate',
			sublistId: 'item',
			line: line,
		});
	};

	CustomItems.prototype._getItemId = function (txnRecord, line) {
		return (
			txnRecord.getSublistValue({ 
				fieldId: 'item',
				sublistId: 'item',
				line: line,
			}) + ''
		);
	};

	CustomItems.prototype._addTaxes = function (customItem, result, txnRecord, line, itemBelongsToAGroup) {
		if (this._isItemfulfillment(txnRecord)) {
			return;
		}
		if (result.suiteTaxFeature) {
			this.suiteTax.addTaxes(customItem, txnRecord, line, result.suiteTaxWithholdingTaxTypes);
		} else if (customItem.isWhtaxApplied) {
			this.whTax.addTaxes(customItem, txnRecord, line, itemBelongsToAGroup);
			this.legacyTax.addTaxes(customItem, txnRecord, line);
		} else {
			this.legacyTax.addTaxes(customItem, txnRecord, line);
		}
	};

	CustomItems.prototype._applyLineDiscount = function (
		result,
		customItem,
		txnRecord,
		line,
		lineCount,
		thereIsAtLeastOneWithholdingTaxApplied
	) {
		var discountsApplied = 0;
		if (txnRecord.type === 'itemfulfillment') {
			return { discountsApplied: discountsApplied };
		}
		var lineItemType;
		var whDiscountBaseAmount, discountAmount, taxDiscountAmount;
		for (var index = line + 1; index < lineCount; index++) {

			// Withholding Tax bundle adds an extra line at the end of the Items list.
			// This extra line is a discount line, and it messes with the generated XML
			// by adding an unwanted discount. Hence, we need to ignore this extra line.
			if ((index + 1) === lineCount && thereIsAtLeastOneWithholdingTaxApplied) {
				discountAmount = 0;
				whDiscountBaseAmount = 0;
			}

			lineItemType = txnRecord.getSublistValue({ 
				sublistId: 'item',
				fieldId: 'itemtype',
				line: index,
			});
			if (lineItemType === 'Subtotal') {
				discountsApplied++;
				continue;
			}
			if (lineItemType !== 'Discount') {
				return { discountsApplied: discountsApplied };
			}

			if (customItem.isWhtaxApplied) {
				if (whDiscountBaseAmount === undefined) {
					whDiscountBaseAmount = txnRecord.getSublistValue({ 
						sublistId: 'item',
						fieldId: constants.FIELD.WH_ITEMCOL_TAXBASEAMOUNT,
						line: index,
					});
					whDiscountBaseAmount = whDiscountBaseAmount
						? whDiscountBaseAmount
						: 0.0;
				}
				if (discountAmount === undefined) {
					discountAmount = txnRecord.getSublistValue({ 
						sublistId: 'item',
						fieldId: 'amount',
						line: index,
					});
				}

				customItem.whDiscountBaseAmount = customItem.whDiscountBaseAmount + Math.abs(whDiscountBaseAmount);
				customItem.discount = customItem.discount + Math.abs(discountAmount);
				customItem.taxDiscount = 0;
			} else {
				if (!thereIsAtLeastOneWithholdingTaxApplied || discountAmount === undefined) {
					discountAmount = txnRecord.getSublistValue({ 
						sublistId: 'item',
						fieldId: 'amount',
						line: index,
					});
				}
				taxDiscountAmount = txnRecord.getSublistValue({ 
					sublistId: 'item',
					fieldId: 'tax1amt',
					line: index,
				});
				customItem.discount = customItem.discount + Math.abs(discountAmount);
				customItem.taxDiscount = customItem.taxDiscount + Math.abs(taxDiscountAmount);
			}
			discountsApplied++;
		}
		return { discountsApplied: discountsApplied };
	};

	CustomItems.prototype._createCustomItem = function (txnRecord, itemType, idx) {
		var customItem = {
			line: idx,
			discount: 0.0,
			taxDiscount: 0.0,
			whDiscountBaseAmount: 0.0,
			whDiscountTaxAmount: 0.0,
			taxes: {
				taxItems: [],
				whTaxItems: [],
			},
			parts: [],
			totalDiscount: 0.0,
			amtExcludeLineDiscount: 0.0,
		};
		customItem.type = itemType;
		customItem.isWhtaxApplied = txnRecord.getSublistValue({ 
			sublistId: 'item',
			fieldId: constants.FIELD.WH_ITEMCOL_APPLIES,
			line: idx,
		});
		customItem.amount = this._getAmount(txnRecord, idx);
		customItem.rate = this._getUnitPrice(txnRecord, idx);
		customItem.quantity = this._getQuantity(txnRecord, idx);
		customItem.itemId = this._getItemId(txnRecord, idx);
		var units = this._getUnit(txnRecord, idx);
		customItem.units = units ? units + '' : null;
		if (this._isItemfulfillment(txnRecord)) {
			customItem.unitsText = this._getUnitText(txnRecord, idx);
		}
		return customItem;
	};

	CustomItems.prototype._getRelatedTaxObjectForItem = function (satCodesDao, idx, txnRecord) {
		satCodesDao.addLineTaxObject(
			idx,
			txnRecord.getSublistValue({ 
				fieldId: constants.FIELD.MX_CUSTCOL_SAT_TAX_OBJECT,
				sublistId: 'item',
				line: idx,
			})
		);
	};

	CustomItems.prototype.addCustomItems = function (result, txnRecord, lineCount) {
		var satCodesDao = result.satCodesDao;

		var lineDiscountApplied;
		var currentGroupItem;
		var customItem;
		var itemType;
		var thereIsAtLeastOneWithholdingTaxApplied = false;
		var itemBelongsToAGroup = false;
		var satItemCodeIds = [];
		for (var idx = 0; idx < lineCount; idx++) {

			satItemCodeIds[idx] = null;

			itemType = txnRecord.getSublistValue({ 
				fieldId: 'itemtype',
				sublistId: 'item',
				line: idx,
			});
			customItem = this._createCustomItem(txnRecord, itemType, idx);
			this._getRelatedTaxObjectForItem(satCodesDao, idx, txnRecord);
			if (customItem.isWhtaxApplied) {
				thereIsAtLeastOneWithholdingTaxApplied = true;
			}
			if (itemType === 'Subtotal') {
				continue;
			}
			if (itemType === 'EndGroup') {
				itemBelongsToAGroup = false;
				currentGroupItem.isWhtaxApplied = thereIsAtLeastOneWithholdingTaxApplied;
				lineDiscountApplied = this._applyLineDiscount(
					result,
					currentGroupItem,
					txnRecord,
					idx,
					lineCount,
					thereIsAtLeastOneWithholdingTaxApplied
				);
				currentGroupItem.amount = this._getAmount(txnRecord, idx);
				idx = idx + lineDiscountApplied.discountsApplied;
				result.items.push(currentGroupItem);
				currentGroupItem = null;
				continue;
			}
			if (customItem.type === 'Group') {
				itemBelongsToAGroup = true;
				currentGroupItem = customItem;
				lineDiscountApplied = this._applyLineDiscount(
					result,
					currentGroupItem,
					txnRecord,
					idx,
					lineCount,
					thereIsAtLeastOneWithholdingTaxApplied
				);
				// store the sat item code id for the item at index idx
				satItemCodeIds[idx] = txnRecord.getSublistValue({
					fieldId: constants.FIELD.MX_CUSTCOL_SAT_ITEM_CODE, 
					sublistId: 'item',
					line: idx,
				});
				idx = idx + lineDiscountApplied.discountsApplied;
				continue;
			}

			lineDiscountApplied = this._applyLineDiscount(
				result,
				customItem,
				txnRecord,
				idx,
				lineCount,
				thereIsAtLeastOneWithholdingTaxApplied
			);
			this._addTaxes(customItem, result, txnRecord, idx, itemBelongsToAGroup);
			if (currentGroupItem) {
				currentGroupItem.parts.push(customItem);
			} else {
				result.items.push(customItem);
			}
			// store the sat item code id for the item at index idx
			satItemCodeIds[idx] = txnRecord.getSublistValue({
				fieldId: constants.FIELD.MX_CUSTCOL_SAT_ITEM_CODE,
				sublistId: 'item',
				line: idx,
			});
			idx = idx + lineDiscountApplied.discountsApplied;
		}

		satCodesDao.getAllLineItemCodes(satItemCodeIds);
	};

	function getInstance (legacyTax, suiteTax, whTax) {
		return new CustomItems(legacyTax, suiteTax, whTax);
	}

	return {
		getInstance: getInstance,
	};
});
