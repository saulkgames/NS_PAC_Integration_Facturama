/**

 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.

 */

if (!TAF) { var TAF = {}; }
TAF.Mapper = TAF.Mapper || {};

TAF.Mapper.Adaptor = function () {
};

TAF.Mapper.Adaptor.prototype.convertToDataView = function (mapperData) {
	var dataView = new TAF.Mapper.ViewData();

	if (!mapperData) {
		return dataView;
	}

	dataView.mode = mapperData.mode;
	dataView.languageId = mapperData.languageId;
	dataView.mappingCategories = this.getMappingCategories(mapperData);
	dataView.columnHeader = this.getColumnHeader(mapperData);
	dataView.mappingValues = this.getMappingValues(mapperData);
	dataView.mappings = this.getMappings(mapperData);
	dataView.message = this.getMessage(mapperData);
	dataView.mappingFilters = this.getMappingFilters(mapperData);
	dataView.uiFilters = this.getUiFilters(mapperData);

	return dataView;
};

TAF.Mapper.Adaptor.prototype.getMappingCategories = function (mapperData) {
	var viewCategories  = {};
	if ((!mapperData) || (!mapperData.categories)) {
		return viewCategories;
	}

	for (var c in mapperData.categories) {
		viewCategories[c] = {
			name:       mapperData.categories[c].name,
			id:         mapperData.categories[c].id,
			header:     mapperData.categories[c].header,
			isSelected: false,
		};
	}

	if (viewCategories[mapperData.selectedCategory]) {
		viewCategories[mapperData.selectedCategory].isSelected = true;
	}

	return viewCategories;
};

TAF.Mapper.Adaptor.prototype.getColumnHeader = function (mapperData) {
	return mapperData.categories[mapperData.selectedCategory] ? mapperData.categories[mapperData.selectedCategory].header : 'KEYS';
};

TAF.Mapper.Adaptor.prototype.getMappingValues = function (mapperData) {
	var viewValues = {};
	if ((!mapperData) || (!mapperData.values)) {
		return viewValues;
	}

	for (var v in mapperData.values) {
		viewValues[v] = {
			name:  mapperData.values[v].name,
			value: mapperData.values[v].inreport,       // TODO: update during integration?
			id:    mapperData.values[v].id,
		};
	}

	return viewValues;
};

TAF.Mapper.Adaptor.prototype.getMappings = function (mapperData) {
	var viewMappings = {};
	if (!mapperData || !mapperData.mappings) {
		return viewMappings;
	}

	var mapping;
	var index;

	for (var m in mapperData.mappings) {
		mapping = mapperData.mappings[m]
		index = TAF.DAO.Mapping.getMappingIndex(mapping)
		
		viewMappings[m] = {
			id:     mapping.id,
			fromId: index,
			// categoryId: mapping.category,
			// recordType: mapping.recordType,
			// key: mapping.key,
			// subKey: mapping.subKey,
			toId:   mapping.value,
			from:   mapping.key_text,    // TODO: update during integration?
			to:     mapping.value_text,  // TODO: update during integration?
			toDesc: mapping.value_name,   // TODO: update during integration?
		};
	}

	return viewMappings;
};

TAF.Mapper.Adaptor.prototype.getMappingFilters = function (mapperData) {
	var viewFilters = {};

	if (!mapperData || !mapperData.filters) {
		return viewFilters;
	}

	for (var f in mapperData.filters) {
		if ((mapperData.filters[f]) && (mapperData.filters[f].isUi)) {
			viewFilters[f] = mapperData.filters[f];
		}
	}

	return viewFilters;
};

TAF.Mapper.Adaptor.prototype.getMessage = function (mapperData) {
	if ((!mapperData)         ||
        (!mapperData.message) ||
        (!mapperData.message.result)) {
		return {};

	} else if (mapperData.message.result == 'pass') {
		return {priority : 'LOWEST', messageHeaderId: 'MAPPER_SUCCESS', messageId : 'MAPPER_SAVE_SUCCESSFUL'};
	} else {
		return {priority : 'HIGH', messageHeaderId: 'MAPPER_ERROR', messageId : 'MAPPER_SAVE_ERROR'};
	}
};



TAF.Mapper.Adaptor.prototype.convertToMapping = function (viewMappings, categoryId) {
	var mappings = {};

	for (var m in viewMappings) {
		mappings[m] = {
			id: viewMappings[m].id,
			category: categoryId,
			index: viewMappings[m].fromId,
			value: viewMappings[m].toId
		}
	}

	return mappings;
};

TAF.Mapper.Adaptor.prototype.getUiFilters = function (mapperData) {
	if (!mapperData || !mapperData.filters) {
		return '[]';
	}

	var filterList = [];
	for (var f in mapperData.filters) {
		if ((mapperData.filters[f]) &&
            (mapperData.filters[f].isUi) &&
            (mapperData.filters[f].name)) {
			filterList.push('custpage_' + mapperData.filters[f].name.toLowerCase());
		}
	}

	return JSON.stringify(filterList);
};



