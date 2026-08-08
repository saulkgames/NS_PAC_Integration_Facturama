/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};

TAF.DAO.MappingDao = function _MappingDao() {
	this.cache = {};
	this.MAX_RESULTS = 1000;
    this.searchColumns = [
        new nlobjSearchColumn('custrecord_mx_mapper_keyvalue_category'),
        new nlobjSearchColumn('custrecord_mx_mapper_keyvalue_rectype'),
        new nlobjSearchColumn('custrecord_mx_mapper_keyvalue_key'),
        new nlobjSearchColumn('custrecord_mx_mapper_keyvalue_subrectype'),
        new nlobjSearchColumn('custrecord_mx_mapper_keyvalue_subkey'),
        new nlobjSearchColumn('custrecord_mx_mapper_keyvalue_value'),
        new nlobjSearchColumn('custrecord_mx_mapper_keyvalue_inputvalue')
    ];
};

TAF.DAO.MappingDao.prototype.getList = function _GetList(filters, daoFilters) {
	var category_id = this.getCategory(filters);
	if (category_id == '') { return {}; }

	var mapping_category_list = new TAF.DAO.MappingCategoryDao().getList();
	var key_dao = mapping_category_list[category_id].dao;
	var daoList = key_dao.split(',');

	for (var i=0; i < daoList.length; i++) {
		var dao = daoList[i].trim();
		this.getKeys(category_id, false, dao, daoFilters);
	}

	this.getMappings(category_id, filters);
	return this.cache;
};

TAF.DAO.MappingDao.prototype.getListWithDefault = function _GetListWithDefault(filters, values) {
	var category_id = this.getCategory(filters);
	if (category_id == '') { return {}; }

	var mapping_category_list = new TAF.DAO.MappingCategoryDao().getList();
	var key_dao = mapping_category_list[category_id].dao;
	var daoFilters = this.getMappingDaoFilters(new TAF.DAO.MappingFilterDao().getMappingFilterByIds(mapping_category_list[category_id].filters), values);
	this.getKeys(category_id, true, key_dao, daoFilters);
	this.getMappings(category_id, filters);
	return this.cache;
};

TAF.DAO.MappingDao.prototype.deleteMapping = function _DeleteMapping(id) {
	try {
		nlapiDeleteRecord('customrecord_mx_mapper_keyvalue', id);
	} catch(e) {
		var errorMsg = e.getCode ? e.getCode() + ': ' + e.getDetails() : 'Error: ' + (e.message ? e.message : e);
		nlapiLogExecution('ERROR', 'TAF.DAO.MappingDao.deleteMapping', errorMsg);
	}
};

TAF.DAO.MappingDao.prototype.getCategory = function _GetCategory(filters) {
	var key = 'custrecord_mx_mapper_keyvalue_category';
	return 	filters && filters[key] && filters[key].length > 1 ?
			filters[key][1]: '';
};

TAF.DAO.MappingDao.prototype.initializeCacheItem = function _InitializeCacheItem(category_id, mappingKey, defaultValue) {
	var index = TAF.DAO.Mapping.getMappingIndex(mappingKey);

	var item = new TAF.DAO.Mapping('');

	item.category = category_id;
	item.recordType = mappingKey.recordType;
	item.key = mappingKey.key;
	item.subRecordType = mappingKey.subRecordType;
	item.subKey = mappingKey.subKey;
	
	item.key_text = mappingKey.getName ? mappingKey.getName() : mappingKey.name;

	if (defaultValue) {
		item.value = defaultValue.id;
		item.value_text = defaultValue.inreport;
		item.value_name = defaultValue.name;
	}

	this.cache[index] = item;
}

TAF.DAO.MappingDao.prototype.getKeys = function _GetKeys(category_id, with_default, key_dao, daoFilters) {
	var defaultValue = with_default ? new TAF.DAO.MappingValueDao().getDefaultValue(category_id) : '';
	var keyList = new TAF.DAO[key_dao]().getList(daoFilters);

	for (var index in keyList) {		
		this.initializeCacheItem(category_id, keyList[index], defaultValue)
	}
};

TAF.DAO.MappingDao.prototype.getMappings = function _GetMappings(category_id, filters) {
	var values = new TAF.DAO.MappingValueDao().getList({'custrecord_mx_mapper_value_category': ['anyof', category_id]});
	var resultSet = this.searchMappings(category_id, filters, this.searchColumns);
	
	var index = 0;

	do {
		var mappings = resultSet.getResults(index, index + this.MAX_RESULTS);
		this.setMappings(mappings, values);
		index += this.MAX_RESULTS;
	} while (mappings && mappings.length >= this.MAX_RESULTS);
};

TAF.DAO.MappingDao.prototype.searchMappings = function _searchMappings(category_id, filters, columns){
    if (!category_id) {
        throw nlapiCreateError('INVALID_PARAMETER', 'Category id is null.');
    }

    if (!filters || !filters['custrecord_mx_mapper_keyvalue_category']) {
        throw nlapiCreateError('INVALID_PARAMETER', 'Filter parameter is null or custrecord_mx_mapper_keyvalue_category not defined in Filter parameter.');
    }

    if (!filters['custrecord_mx_mapper_keyvalue_category'][0] || !filters['custrecord_mx_mapper_keyvalue_category'][1]) {
        throw nlapiCreateError('INVALID_PARAMETER', 'Operator is not defined in Filter parameter.');
    }
    var searchFilters = [new nlobjSearchFilter('custrecord_mx_mapper_keyvalue_category', null, filters['custrecord_mx_mapper_keyvalue_category'][0], filters['custrecord_mx_mapper_keyvalue_category'][1])];

    var search = nlapiCreateSearch('customrecord_mx_mapper_keyvalue', searchFilters, columns);
    var resultSet = search.runSearch();

    return resultSet
}

TAF.DAO.MappingDao.prototype.setMappings = function _setMappings(mappings, values) {
	for (var i = 0; i < mappings.length; i++) {
		var mapping = mappings[i];

		var item = this.getItem(mapping)

		var index = TAF.DAO.Mapping.getMappingIndex(item);
		var cachedItem = this.cache[index];

		if (cachedItem) {
			cachedItem.id = mapping.getId();
			cachedItem.value = mapping.getValue('custrecord_mx_mapper_keyvalue_value');
			
			if(cachedItem.value){
				cachedItem.value_text = values[cachedItem.value].inreport;
				cachedItem.value_name = values[cachedItem.value].name;
			}else{
				cachedItem.value = cachedItem.value_text = mapping.getValue('custrecord_mx_mapper_keyvalue_inputvalue');
				cachedItem.value_name = '';
			}
		}
	}
};

TAF.DAO.MappingDao.prototype.getItem= function _getItem(mapping){
    return {
        category: mapping.getValue('custrecord_mx_mapper_keyvalue_category'),
        recordType: mapping.getValue('custrecord_mx_mapper_keyvalue_rectype'),
        key: mapping.getValue('custrecord_mx_mapper_keyvalue_key'),
        subRecordType: mapping.getValue('custrecord_mx_mapper_keyvalue_subrectype'),
        subKey: mapping.getValue('custrecord_mx_mapper_keyvalue_subkey'),
    }
}

/**
 * mappings: [
 * 	{
 * 		id: mapping recod id
 *		category: category
 * 		index: composite index from rectype, key and subkey
 * 		value: id of value record
 * 	}
 * ]
 */

TAF.DAO.MappingDao.prototype.update = function _Update(mappings, categoryId) {
	var message = {result: 'pass'};
	// var policyNumCategory = new TAF.DAO.MappingCategoryDao().getByCode('MX_POLICY_NUMBER');
	// var valuefield = null;

	try {
		var record = {};
		var mappingRecordId = '';
		var mapping = {};
		var searchFilter = [new nlobjSearchFilter('custrecord_mx_mapper_keyvalue_category', null, 'is', categoryId)];
        var searchResults = nlapiSearchRecord( 'customrecord_mx_mapper_keyvalue', null, searchFilter, this.searchColumns);

		for (var index in mappings) {
			mapping	= mappings[index];		
			mappingRecordId = mapping.id;

			if(this.mappingExists(mapping, index, searchResults)){
				continue;
			}
			if (!mapping.value) {
				this.deleteMapping(mappingRecordId);
			} else {
				if (mappingRecordId) {
					record = nlapiLoadRecord('customrecord_mx_mapper_keyvalue', mappingRecordId);
				} else {
					record = nlapiCreateRecord('customrecord_mx_mapper_keyvalue');
				}

				record.setFieldValue('custrecord_mx_mapper_keyvalue_category', mapping.category);
				record.setFieldValue('custrecord_mx_mapper_keyvalue_rectype', TAF.DAO.Mapping.getRecordType(index));
				record.setFieldValue('custrecord_mx_mapper_keyvalue_key', TAF.DAO.Mapping.getKey(index));
				record.setFieldValue('custrecord_mx_mapper_keyvalue_subrectype', TAF.DAO.Mapping.getSubRecordType(index));
				record.setFieldValue('custrecord_mx_mapper_keyvalue_subkey', TAF.DAO.Mapping.getSubKey(index));
				
				// if (!valueField) {
				// 	valueField = mapping.category == policyNumCategory.id
				// 		? 'custrecord_mx_mapper_keyvalue_inputvalue' 
				// 		: 'custrecord_mx_mapper_keyvalue_value';
				// }
				
				// record.setFieldValue(valueField, mapping.value);
				record.setFieldValue('custrecord_mx_mapper_keyvalue_value', mapping.value);
				
				nlapiSubmitRecord(record);
			}
		}
		return message;
	} catch(e) {
		var errorMsg = e.getCode ? e.getCode() + ': ' + e.getDetails() : 'Error: ' + (e.message ? e.message : e);
		nlapiLogExecution('ERROR', 'TAF.DAO.MappingDao.Update', errorMsg);
		message = { result: 'fail', error: errorMsg };
		return message;
	}
};

TAF.DAO.MappingDao.prototype.mappingExists = function _mappingExists(mapping, index, searchresults){
	for (var searchResult in searchresults){
		if(mapping.category === searchresults[searchResult].getValue(this.searchColumns[0])
			&& TAF.DAO.Mapping.getRecordType(index) === searchresults[searchResult].getValue(this.searchColumns[1])
			&& TAF.DAO.Mapping.getKey(index) === searchresults[searchResult].getValue(this.searchColumns[2])
			&& TAF.DAO.Mapping.getSubRecordType(index) === searchresults[searchResult].getValue(this.searchColumns[3])
			&& TAF.DAO.Mapping.getSubKey(index) === searchresults[searchResult].getValue(this.searchColumns[4])
			&& mapping.value === searchresults[searchResult].getValue(this.searchColumns[5])){
				return true;
		}
    }
	return false;
}

TAF.DAO.MappingDao.prototype.getMappingDaoFilters = function getMappingDaoFilters(filters, values) {
	var mappingDaoFilters = {};
	for (var filter in filters) {
		var currentFilter = filters[filter];
		if (currentFilter.isUi) {
			continue;
		}

		var mappingFilters =  currentFilter.mappingFilters;
		for (var mf in mappingFilters) {
			mappingDaoFilters[mf] = mappingFilters[mf];
		}
	}

	if (values){
		for (var mdf in mappingDaoFilters) {
			if(values[mdf]) {
				mappingDaoFilters[mdf][1] = values[mdf];
			}
		}
	}

	return mappingDaoFilters;
};
