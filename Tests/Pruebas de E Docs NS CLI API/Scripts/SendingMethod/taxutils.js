/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
    
], function () {
	'use strict';
	function newTaxLineCopy (taxLine) {
		return {
			taxRate: taxLine.taxRate,
			taxFactorType: taxLine.taxFactorType,
			taxCode: taxLine.taxCode,
			taxType : taxLine.taxType,
			satTaxCodeKey : taxLine.satTaxCodeKey,
			satTaxCode : taxLine.satTaxCode,
			rateString : taxLine.rateString,
		};
	}

	function groupTaxesBy (taxItems,sums) {
		var aggregatedTaxItems = {};
		var groupBy;
		var aggTaxItem;
		taxItems.map(function (taxLine) {
			groupBy = taxLine.satTaxCode+'_'+taxLine.rateString+'_'+taxLine.taxFactorType;
			aggTaxItem = aggregatedTaxItems[groupBy];
			if (!aggTaxItem) {
				aggTaxItem = newTaxLineCopy(taxLine);
				aggTaxItem.taxAmount = taxLine.taxAmount;
				aggTaxItem.taxBaseAmount = taxLine.taxBaseAmount;
				aggregatedTaxItems[groupBy] = aggTaxItem;
				return;
			}
			if (sums.base) {
				aggTaxItem.taxBaseAmount = taxLine.taxBaseAmount + aggTaxItem.taxBaseAmount;
			}
			if (sums.taxAmount) {
				aggTaxItem.taxAmount = taxLine.taxAmount + aggTaxItem.taxAmount;
			}
		});

		return Object.keys(aggregatedTaxItems).map(function (key) {
			return aggregatedTaxItems[key];
		});
	}

	return {
		newTaxLineCopy : newTaxLineCopy,
		groupTaxesBy : groupTaxesBy,
	};
});