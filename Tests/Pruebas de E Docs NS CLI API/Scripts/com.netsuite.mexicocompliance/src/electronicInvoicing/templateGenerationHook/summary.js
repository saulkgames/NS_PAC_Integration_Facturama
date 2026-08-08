/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
	'./../../common/constants',
	'N/log',
], function (constants, log) {
	'use strict';

	var SAT_CURRENCY_PRECISION = 2;
	var SAT_TAXRATE_PRECISION = 6;

	var GROUPBYTAX_SUM_CFG = {
		base : true,
		taxAmount : true,
	};

	var taxUtils;

	function TransactionSummary (taxUtilsInject) {
		taxUtils = taxUtilsInject;
	}

	function AbsSumOperation (initValue) {
		this.sum = initValue;
		this.add = function (value) {
			this.sum = Math.abs(value) + this.sum;
			return this;
		};

		this.reset = function (value) {
			this.sum = value;
		};
	}

	function SumOperation (initValue) {
		this.sum = initValue;
		this.add = function (value) {
			this.sum = value + this.sum;
			return this;
		};
	}

	function multiply (val1,val2) {
		return val1*val2;
	}

	function copyArrayItems (src,dst) {
		src.map(function (item) {
			dst.push(item);
		});
	}

	function toNonEmpty (val) {
		return val?val :0.0;
	}

	function _getItemTotalDiscountShare (summary,item) {
		return _currency(multiply(summary.bodyDiscount,item.amount - item.discount) / summary.subtotalExcludeLineDiscount);
	}

	function _getGroupDiscountShare (group,item) {
		return _currency(multiply(group.totalDiscount,item.amount)/group.amount);
	}

	function _mergeTaxes (result) {
		result.items.map(function (item) {
			item.taxes.taxItems = taxUtils.groupTaxesBy(item.taxes.taxItems,GROUPBYTAX_SUM_CFG);
			item.taxes.whTaxItems = taxUtils.groupTaxesBy(item.taxes.whTaxItems,GROUPBYTAX_SUM_CFG);
		});
	}

	function _currency (val) {
		return parseFloat(val.toFixed(SAT_CURRENCY_PRECISION));
	}

	function _setTaxRateString (taxLine) {
		taxLine.rateString = taxLine.taxRate.toFixed(SAT_TAXRATE_PRECISION);
	}

	TransactionSummary.prototype._calculatePartsSectionForItemGroup = function (result) {
		var partRateQuantityEmpty = false;
		result.items.map(function (item) {
			var groupDiscount = new AbsSumOperation(0.0);
			var totalGroupRate = new SumOperation(0.0);
			if (item.type !== 'Group') {return;}
			var groupTaxLines = item.taxes.taxItems;
			var whGroupTaxLines = item.taxes.whTaxItems;
			item.parts.map(function (part) {
				copyArrayItems(part.taxes.taxItems,groupTaxLines);
				copyArrayItems(part.taxes.whTaxItems,whGroupTaxLines);
				groupDiscount.add(part.totalDiscount);
				if (!part.rate || !part.quantity) {
					partRateQuantityEmpty = true;
				}
				totalGroupRate.add(_currency(multiply(toNonEmpty(part.rate),toNonEmpty(part.quantity))));

			});
			item.totalDiscount = groupDiscount.sum;
			item.rate = partRateQuantityEmpty?null:totalGroupRate.sum;
		});
	};

	TransactionSummary.prototype._calculateSubTotal = function (result) {
		var summary = result.summary;
		var subtotal = new SumOperation(0.0);
		result.items.map(function (item) {
			subtotal.add(item.amount);
		});
		summary.subtotal = subtotal.sum;
	};

	TransactionSummary.prototype._calculateSubTotalExcludeLineDiscounts = function (result) {
		var summary = result.summary;
		var subtotal = new SumOperation(0.0);
		result.items.map(function (item) {
			subtotal.add(item.amount - item.discount);
		});
		summary.subtotalExcludeLineDiscount = subtotal.sum;
	};

	TransactionSummary.prototype.summarize = function (result) {
		var summary = result.summary;

		if (result.suiteTaxFeature && result.isFromCustomerPayment) {
			this._createTaxesSummary(result);
			return;
		}
		summary.byTaxObject = {};
		var totalDiscount = new AbsSumOperation(0.0);

		this._calculateSubTotal(result);
		this._calculateSubTotalExcludeLineDiscounts(result);

		var itemTotalDiscount = new AbsSumOperation(0.0);
		function _aggregateTotalDiscount (item,group) {
			itemTotalDiscount.add(item.discount);

			if (group) {
				itemTotalDiscount.add(_getGroupDiscountShare(group,item));
				log.debug('Group items line discount share',_getGroupDiscountShare(group,item));

			} else {
				log.debug('Item Line Discount - '+item.amount,item.discount);
				itemTotalDiscount.add(_getItemTotalDiscountShare(summary,item));
				log.debug('item line discount::',_getItemTotalDiscountShare(summary,item));
				log.debug('group item total discount',itemTotalDiscount.sum+','+item.discount);
			}

			item.totalDiscount = itemTotalDiscount.sum;
			itemTotalDiscount.reset(0.0);
		}
		var transfersTaxExemptedAmount = new SumOperation(0.0);
		var withHoldingTaxAmount = new SumOperation(0.0);
		var withHoldingTaxAmountByTaxObject = new SumOperation(0.0);
		var transfersTaxAmount = new SumOperation(0.0);
		var transfersTaxAmountByTaxObject = new SumOperation(0.0);
		var taxBaseTransferAmount = new SumOperation(0.0);
		var taxBaseTransferAmountByTaxObject = new SumOperation(0.0);
		var taxBaseWithHoldAmount = new SumOperation(0.0);
		var taxBaseWithHoldAmountByTaxObject = new SumOperation(0.0);
		var allExemptTaxes = true;

		function _taxCalculations (item, index) {
			item.taxes.taxItems.map(function (taxLine) {
				taxLine.taxType = 'k'+taxLine.taxType;
				_setTaxRateString(taxLine);
				if (!result.suiteTaxFeature) {
					taxLine.taxBaseAmount = taxLine.taxBaseAmount - item.totalDiscount;
					taxLine.taxAmount = _currency(multiply(taxLine.taxBaseAmount, taxLine.taxRate));
				}
				if (result.satcodes.items[index] && result.satcodes.items[index].taxObject === '02') {
					taxBaseTransferAmountByTaxObject.add(taxLine.taxBaseAmount);
					transfersTaxAmountByTaxObject.add(taxLine.taxAmount);
				}
				taxBaseTransferAmount.add(taxLine.taxBaseAmount);
				transfersTaxAmount.add(taxLine.taxAmount);
				if (taxLine.taxFactorType === constants.LIST.TAX_FACTOR_TYPE.EXEMPT) {
					transfersTaxExemptedAmount.add(taxLine.taxAmount);
				} else {
					allExemptTaxes = false;
				}
			});
			item.taxes.whTaxItems.map(function (taxLine) {
				if (taxLine.itemBelongsToAGroup) {
					taxLine.taxBaseAmount = taxLine.taxBaseAmount - item.totalDiscount;
				}
				taxLine.taxType = 'k'+taxLine.taxType;
				_setTaxRateString(taxLine);
				taxLine.taxAmount = _currency(multiply(taxLine.taxBaseAmount,taxLine.taxRate));
				if (result.satcodes.items[index] && result.satcodes.items[index].taxObject === '02') {
					withHoldingTaxAmountByTaxObject.add(taxLine.taxAmount);
					taxBaseWithHoldAmountByTaxObject.add(taxLine.taxBaseAmount);
				}
				withHoldingTaxAmount.add(taxLine.taxAmount);
				taxBaseWithHoldAmount.add(taxLine.taxBaseAmount);
			});
		}

		// Calculate Total Discount
		result.items.map(function (item) {
			_aggregateTotalDiscount(item);
			item.parts.map(function (part) {
				_aggregateTotalDiscount(part,item);
			});
		});

		result.items.map(function (item) {
			if (item.parts.length === 0) {
				_taxCalculations(item, item.line);
			}
			item.parts.map(function (part) {
				_taxCalculations(part, item.line);
			});
		});

		this._calculatePartsSectionForItemGroup(result);
		_mergeTaxes(result);
		result.items.map(function (item) {
			totalDiscount.add(item.totalDiscount);
		});

		const byTaxObject = summary.byTaxObject;
		summary.totalWithHoldTaxAmt = withHoldingTaxAmount.sum;
		byTaxObject.totalWithHoldTaxAmt = withHoldingTaxAmountByTaxObject.sum;

		summary.totalNonWithHoldTaxAmt = transfersTaxAmount.sum - transfersTaxExemptedAmount.sum;
		byTaxObject.totalNonWithHoldTaxAmt = transfersTaxAmountByTaxObject.sum - transfersTaxExemptedAmount.sum;
		summary.transfersTaxExemptedAmount = transfersTaxExemptedAmount.sum;

		summary.totalTaxAmt = summary.totalNonWithHoldTaxAmt - summary.totalWithHoldTaxAmt;
		byTaxObject.totalTaxAmt = byTaxObject.totalNonWithHoldTaxAmt - byTaxObject.totalWithHoldTaxAmt;

		summary.totalAmount = summary.totalTaxAmt + summary.subtotal - totalDiscount.sum;
		byTaxObject.totalAmount = byTaxObject.totalTaxAmt + summary.subtotal - totalDiscount.sum;

		summary.totalDiscount = totalDiscount.sum;
		summary.totalTaxSum = summary.totalNonWithHoldTaxAmt + summary.totalWithHoldTaxAmt;
		byTaxObject.totalTaxSum = byTaxObject.totalNonWithHoldTaxAmt + byTaxObject.totalWithHoldTaxAmt;
		summary.totalSum = summary.subtotal + summary.totalTaxSum - totalDiscount.sum;
		byTaxObject.totalSum = summary.subtotal + byTaxObject.totalTaxSum - totalDiscount.sum;

		summary.totalBaseTransfer = taxBaseTransferAmount.sum;
		byTaxObject.totalBaseTransfer = taxBaseTransferAmountByTaxObject.sum;
		summary.totalBaseWithHold = taxBaseWithHoldAmount.sum;
		byTaxObject.totalBaseWithHold = taxBaseWithHoldAmountByTaxObject.sum;

		log.debug('Summary Object', JSON.stringify(summary));
		summary.includeTransfers = !allExemptTaxes;

		this._createTaxesSummary(result);
	};

	TransactionSummary.prototype._createTaxesSummary = function (result) {
		var summary = result.summary;
		var whTaxes = {};
		var transferTaxes = {};
		var exemptTaxes = {};

		function addTaxAmount (taxesMap, taxLine, wh, index) {
			_setTaxRateString(taxLine);

			var groupBy;
			if (wh) {
				groupBy = taxLine.satTaxCode;
			} else {
				groupBy = taxLine.satTaxCode+'_'+ taxLine.rateString+'_'+taxLine.taxFactorType;
			}

			var line = taxesMap[groupBy];

			if (!line) {
				line = taxUtils.newTaxLineCopy(taxLine);
				line.taxAmount = new SumOperation(0.0);
				line.taxAmountByTaxObject = new SumOperation(0.0);
				line.totalTaxBaseAmount = new SumOperation(0.0);
				taxesMap[groupBy] = line;
			}

			// Total tax base amount is required only in CFDI4, and should be filtered by tax object only when sourcing for
			// invoices, cash sale or credit memo. When the system is doing the sourcing for a Customer Payment, for each invoice attached
			// we need to source the tax base amount without filtering by tax object.
			var roundedLineTaxBaseAmount = parseFloat(toNonEmpty(taxLine.taxBaseAmount).toFixed(2));
			if (result.satcodes.items[index] && result.satcodes.items[index].taxObject === '02') {
				line.taxAmountByTaxObject.add(taxLine.taxAmount);
				line.totalTaxBaseAmount.add(roundedLineTaxBaseAmount);
			} else if (result.isFromCustomerPayment) {
				line.totalTaxBaseAmount.add(roundedLineTaxBaseAmount);
			}

			line.taxAmount.add(taxLine.taxAmount);
		}

		result.items.map(function (item) {
			item.taxes.taxItems.filter(function (taxItem) {
				return taxItem.taxFactorType !== constants.LIST.TAX_FACTOR_TYPE.EXEMPT;
			}).map(function (taxLine) {
				addTaxAmount(transferTaxes, taxLine, false, item.line);
			});

			item.taxes.taxItems.filter(function (taxItem) {
				return taxItem.taxFactorType === constants.LIST.TAX_FACTOR_TYPE.EXEMPT;
			}).map(function (taxLine) {
				addTaxAmount(exemptTaxes, taxLine, false, item.line);
			});

			item.taxes.whTaxItems.map(function (taxLine) {
				addTaxAmount(whTaxes, taxLine,true, item.line);
			});
		});

		summary.whTaxes = Object.keys(whTaxes).map(function (val) {
			var taxTmp = whTaxes[val];
			taxTmp.taxAmount = taxTmp.taxAmount.sum;
			taxTmp.taxAmountByTaxObject = taxTmp.taxAmountByTaxObject.sum;
			taxTmp.totalTaxBaseAmount = taxTmp.totalTaxBaseAmount.sum;
			return taxTmp;
		});
		summary.transferTaxes = Object.keys(transferTaxes).map(function (val) {
			var taxTmp = transferTaxes[val];
			taxTmp.taxAmount = taxTmp.taxAmount.sum;
			taxTmp.taxAmountByTaxObject = taxTmp.taxAmountByTaxObject.sum;
			taxTmp.totalTaxBaseAmount = taxTmp.totalTaxBaseAmount.sum;
			return taxTmp;
		});
		summary.exemptTaxes = Object.keys(exemptTaxes).map(function (val) {
			var taxTmp = exemptTaxes[val];
			taxTmp.taxAmount = taxTmp.taxAmount.sum;
			taxTmp.taxAmountByTaxObject = taxTmp.taxAmountByTaxObject.sum;
			taxTmp.totalTaxBaseAmount = taxTmp.totalTaxBaseAmount.sum;
			return taxTmp;
		});
		summary.includeWithHolding = summary.whTaxes.length > 0;

		summary.transferTaxesWNotZeroBase = summary.transferTaxes.filter(function (taxline) {
			return taxline.totalTaxBaseAmount > 0;
		});
		summary.includesTransferTaxesWNotZeroBase = summary.includeTransfers && summary.transferTaxesWNotZeroBase.length > 0;
		summary.whTaxesWNotZeroBase = summary.whTaxes.filter(function (taxline) {
			return taxline.totalTaxBaseAmount > 0;
		});
		summary.includesWHTaxesWNotZeroBase = summary.whTaxesWNotZeroBase.length > 0;
		summary.hasAtLeastOneExemptTax = summary.exemptTaxes.some(function (exemptTax) {
			return exemptTax.totalTaxBaseAmount > 0;
		});
	};

	function getInstance (taxUtils) {
		return new TransactionSummary(taxUtils);
	}

	return {
		getInstance: getInstance,
	};
});
