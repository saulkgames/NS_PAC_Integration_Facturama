/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * This dataModule is responsible for fetching data from the back-end
 *
 */

define(
	['N/record',
		'N/search',
		'../common/constants'],

	/**
     *
     * @param {record} recordModule
     * @param {search} search
     * @param constants
     * @returns {{loadMexicoImportTaxCodes: (function(*): Array)}}
     */
	function (recordModule, search, constants) {

		var loadMexicoImportTaxCodes = function (options) {
			var filters = [[constants.FIELD.MX_ITR_IMPORT, search.Operator.IS, 'T']];

			if (options.isOneWorld) {
				filters.push('and');
				filters.push([constants.FIELD.COUNTRY, search.Operator.IS, constants.OTHER.MEXICO_COUNTRY_CODE]);
			}

			var results = search.create({
				type: search.Type.SALES_TAX_ITEM,
				columns: [],
				filters: filters,
			}).run().getRange({
				start: 0,
				end: 1000,
			});

			var taxCodes = [];
			for (var i = 0; i < results.length; ++i) {
				taxCodes.push(results[i].id);
			}
			return taxCodes;
		};

		var loadMexicoTaxGroups = function (options) {
			var filters = [];

			if (options.isOneWorld) {
				filters.push({
					name: constants.FIELD.COUNTRY,
					operator: search.Operator.IS,
					values: constants.OTHER.MEXICO_COUNTRY_CODE,
				});
			}

			var results = search.create({
				type: search.Type.TAX_GROUP,
				columns: [],
				filters: filters,
			}).run().getRange({
				start: 0,
				end: 1000,
			});

			var taxGroups = {};
			for (var i = 0; i < results.length; ++i) {
				var id = results[i].id;
				var rec = recordModule.load({
					type: constants.RECORD_TYPE.TAX_GROUP,
					id: id,
				});
				var taxCodeCount = rec.getLineCount({
					sublistId: constants.SUBLIST.TAX_ITEMS,
				});
				var taxCodes = [];
				for (var j = 0; j < taxCodeCount; ++j) {
					var taxCodeId = rec.getSublistValue({
						sublistId: constants.SUBLIST.TAX_ITEMS,
						fieldId: constants.FIELD.TAX_NAME,
						line: j,
					});

					if (taxCodeId != null) {
						var taxRate = parseFloat(rec.getSublistValue({
							sublistId: constants.SUBLIST.TAX_ITEMS,
							fieldId: constants.FIELD.RATE,
							line: j,
						}));

						if (_isWitholdingTax(taxRate)) {
							taxCodes.push(taxCodeId);
						}
					}
				}
				taxGroups[id] = taxCodes;
			}
			return taxGroups;
		};

		var _isWitholdingTax = function (taxRate) {
			return !isNaN(taxRate) && taxRate >= 0.0;
		};

		return {
			loadMexicoImportTaxCodes: loadMexicoImportTaxCodes,
			loadMexicoTaxGroups: loadMexicoTaxGroups,
		};
	}
);