/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['./../../common/constants'], function (constants) {
	'use strict';

	var instance;

	function SATMappingLookup (nsSearch, nsRuntime) {
		this.searchObj = nsSearch.load({
			id: 'customsearch_mx_mapping_search',
		});
		this.nsRuntime = nsRuntime;
		this.whTaxTypeCache = {};
		this.taxTypeCache = {};
		this.taxCodeCache = {};
		this.unitSubkeys = {};
		this.searchSatTaxFactorTypeCache = null;
		this.searchTaxCache = null;
		this.searchWHTaxCache = null;
	}

	function _getSatCodeMap (pagedResultSet, willDataBeCached) {
		var data = {};
		var key;
		var subkey;
		var id;

		for (var pageRangeKey in pagedResultSet.pageRanges) {
			var pageIndex = pagedResultSet.pageRanges[pageRangeKey].index;
			var pageFetch = pagedResultSet.fetch({
				index: pageIndex,
			});
			var pageData = pageFetch.data;
			pageData.forEach(function (mapping) {
				var details = {};
				details.code = mapping.getValue({
					name: 'custrecord_mx_mapper_value_inreport',
					join: 'custrecord_mx_mapper_keyvalue_value',
				});
				details.name = mapping.getValue({
					name: 'name',
					join: 'custrecord_mx_mapper_keyvalue_value',
				});
				key = mapping.getValue({
					name: 'custrecord_mx_mapper_keyvalue_key',
				});
				subkey = mapping.getValue({
					name: 'custrecord_mx_mapper_keyvalue_subkey',
				});
				id = 'k'+key;
				if (subkey) {
					id = id + '_' + subkey;
				}
				// If data is going to be cached, we need to store the key and subkeys to allow the search function to find
				// the required data later. They'll be deleted later.
				if (willDataBeCached) {
					details.key = key;
					details.subkey = subkey;
				}

				data[id] = details;
			});
		}
		return data;
	}


	function cacheLookup (cache, key, ids) {
		var detailsKeys = [];
		Object.keys(cache).forEach(function (keyCache) {
			var cachedObject = cache[keyCache];
			if ((key === 'custrecord_mx_mapper_keyvalue_key' && ids.indexOf(cachedObject.key) !== -1)
				|| (key === 'custrecord_mx_mapper_keyvalue_subkey' && ids.indexOf(cachedObject.subkey) !== -1)) {
				detailsKeys.push(keyCache);
			}
		});
		var details = {};
		detailsKeys.forEach(function (detailKey) {
			var detailObject = JSON.parse(JSON.stringify(cache[detailKey]));
			delete detailObject.subkey;
			delete detailObject.key;
			details[detailKey] = detailObject;
		});

		return details;
	}

	function _createOrQuery (key, values) {
		var query = [];
		if (!values || values.length === 0) {
			return query;
		}
		query.push([key, 'is', values[0]]);
		for (var index = 1; index < values.length; index++) {
			query.push('OR', [key, 'is', values[index]]);
		}
		return query;
	}

	SATMappingLookup.prototype.getSatTaxFactorType = function () {
		var allKeys = Object.keys(this.taxCodeCache);
		if (allKeys.length === 0) {
			return {};
		}

		if (this.searchSatTaxFactorTypeCache != null) {
			return cacheLookup(this.searchSatTaxFactorTypeCache, 'custrecord_mx_mapper_keyvalue_key', allKeys);
		}

		this.searchObj.filterExpression = [
			[
				'custrecord_mx_mapper_keyvalue_category.scriptid',
				'is',
				['sat_tax_factor_type'],
			],
			'and',
			[
				'custrecord_mx_mapper_keyvalue_rectype',
				'is',
				'salestaxitem',
			],
		];
		log.debug('Search object For Mapping Tool usage', this.searchObj);
		this.searchSatTaxFactorTypeCache = _getSatCodeMap(this.searchObj.runPaged({
			pageSize: 1000,
		}), true);
		return cacheLookup(this.searchSatTaxFactorTypeCache, 'custrecord_mx_mapper_keyvalue_key', allKeys);
	};

	SATMappingLookup.prototype.getSatTaxCategories = function (withholding) {
		var cacheStore = withholding ? this.whTaxTypeCache : this.taxTypeCache;
		var taxTypeRecord;
		var searchCache;
		if (withholding && !this.nsRuntime.isFeatureInEffect({ feature: constants.FEATURE.SUITE_TAX })) {
			taxTypeRecord = 'customrecord_4601_witaxtype';
			searchCache = this.searchWHTaxCache;
		} else {
			taxTypeRecord = 'taxtype';
			searchCache = this.searchTaxCache;
		}
		var allKeys = Object.keys(cacheStore);
		if (allKeys.length === 0) {
			return {};
		}

		if (searchCache != null) {
			return cacheLookup(searchCache, 'custrecord_mx_mapper_keyvalue_key', allKeys);
		}

		this.searchObj.filterExpression = [
			[
				'custrecord_mx_mapper_keyvalue_category.scriptid',
				'is',
				['sat_tax_category'],
			],
			'and',
			[
				'custrecord_mx_mapper_keyvalue_rectype',
				'is',
				taxTypeRecord,
			],
		];
		log.debug('Search obj', this.searchObj);
		var details = _getSatCodeMap(this.searchObj.runPaged({
			pageSize: 1000,
		}), true);
		if (withholding && !this.nsRuntime.isFeatureInEffect({ feature: constants.FEATURE.SUITE_TAX })) {
			this.searchWHTaxCache = details;
		} else {
			this.searchTaxCache = details;
		}
		log.debug('SAT  Categories', details);
		return cacheLookup(details, 'custrecord_mx_mapper_keyvalue_key', allKeys);
	};

	SATMappingLookup.prototype.getSatUnitCodes = function () {
		var query = _createOrQuery('custrecord_mx_mapper_keyvalue_subkey',Object.keys(this.unitSubkeys));

		if (query.length === 0) {
			return {};
		}
		this.searchObj.filterExpression = [
			[
				'custrecord_mx_mapper_keyvalue_category.scriptid',
				'is',
				['sat_unit_code'],
			],
			'and',
			['custrecord_mx_mapper_keyvalue_rectype', 'is', ['unitstype']],
			'and',
			['custrecord_mx_mapper_keyvalue_subrectype', 'is', ['uom']],
			'and',
			[query],
		];
		var details = _getSatCodeMap(this.searchObj.runPaged({
			pageSize: 1000,
		}));
		return details;
	};

	SATMappingLookup.prototype.needTaxCategory = function (taxType, withholding) {
		var cacheStore = withholding ? this.whTaxTypeCache : this.taxTypeCache;
		cacheStore[taxType] = true;
	};

	SATMappingLookup.prototype.needUnitCode = function (unit) {
		if (!unit) {return;}
		this.unitSubkeys[unit] = true;
	};

	SATMappingLookup.prototype.needTaxFactorType = function (taxCode) {
		if (!taxCode) {return;}
		this.taxCodeCache[taxCode] = true;
	};

	function getInstance (nsSearch, nsRuntime) {
		return (instance = (instance || new SATMappingLookup(nsSearch, nsRuntime)));
	}

	function clearInstance () {
		instance = undefined;
	}

	return {
		getInstance: getInstance,
		clearInstance: clearInstance,
	};
});
