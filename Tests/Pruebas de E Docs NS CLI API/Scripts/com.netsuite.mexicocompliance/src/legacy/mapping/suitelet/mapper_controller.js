/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

var TAF = TAF || {};
TAF.Mapper = TAF.Mapper || {};

TAF.Mapper.run = function(request, response) {
	new TAF.Mapper.Controller().run(request, response);
};

TAF.Mapper.Controller = function _Controller() {};

TAF.Mapper.Controller.prototype.run = function _run(request, response) {
	var params = request.getAllParameters();
	var form = {};

	var filter = { isinactive : ['is', 'F'] };
	this.categories = new TAF.DAO.MappingCategoryDao().getList(filter);
	var selectedCategory = params[ELEMENT_NAME.CATEGORY] || (Object.keys(this.categories).length > 0 ? Object.keys(this.categories)[0] : '');

	if (this.categories[selectedCategory].name && this.categories[selectedCategory].name.indexOf('PT SAF-T: Taxonomy') > -1) {
		params[ELEMENT_NAME.ACTION] = ACTION.VIEWONLY;
	} else if (params[ELEMENT_NAME.ACTION] == ACTION.VIEWONLY) {
		params[ELEMENT_NAME.ACTION] = '';
	}

	switch (params[ELEMENT_NAME.ACTION]) {
		case ACTION.SAVE:
			params.message = this.saveMappings(params);
			form = this.displayForm(params);
			break;
		case ACTION.VIEWONLY:
		case ACTION.VIEW:
		case ACTION.EDIT:
		default: //first load
			form = this.displayForm(params);
			break;
	}
	response.writePage(form);
};

TAF.Mapper.Controller.prototype.saveMappings = function _saveMappings(params) {
	var mappings = new TAF.Mapper.Adaptor().convertToMapping(JSON.parse(params[ELEMENT_NAME.MAPPINGS] || '{}'), params[ELEMENT_NAME.CATEGORY]);
	var message = new TAF.DAO.MappingDao().update(mappings,params[ELEMENT_NAME.CATEGORY]);
	return message;
};

TAF.Mapper.Controller.prototype.displayForm = function _displayForm(params) {
	var mappingData = this.getMappingData(params);
	
	if (params[ELEMENT_NAME.ACTION] == ACTION.SAVE) {
		mappingData.mode = ACTION.VIEW;
	} else {
		mappingData.mode = params[ELEMENT_NAME.ACTION] || ACTION.EDIT;
	}
	mappingData.message = params.message || null;
	mappingData.languageId = nlapiGetContext().getPreference('LANGUAGE');

	var viewData = new TAF.Mapper.Adaptor().convertToDataView(mappingData);
	var view = new TAF.Mapper.View();

  return view.getForm(viewData);
};

TAF.Mapper.Controller.prototype.getMappingData = function _getMappingData(params) {
	var mappingData = {};
	try {
		mappingData.categories = this.categories || new TAF.DAO.MappingCategoryDao().getList();
		mappingData.selectedCategory = params[ELEMENT_NAME.CATEGORY] || (Object.keys(mappingData.categories).length > 0 ? Object.keys(mappingData.categories)[0] : ''); 

		if (!mappingData.selectedCategory) {
			return mappingData;
		}
		var filterIds = mappingData.categories[mappingData.selectedCategory].filters;
		var mappingFilters = this.getMappingFilters(params, filterIds);
		mappingData.filters = this.getMappingUiFilters(mappingFilters);
		mappingData.values = new TAF.DAO.MappingValueDao().getList({'custrecord_mx_mapper_value_category': ['anyof', mappingData.selectedCategory]});
		mappingData.mappings = new TAF.DAO.MappingDao().getList({'custrecord_mx_mapper_keyvalue_category': ['anyof', mappingData.selectedCategory]}, this.getMappingDaoFilters(mappingFilters));
	} catch (ex) {
		var errorMsg = ex.getCode ? ex.getCode() + ': ' + ex.getDetails() : 'Error: ' + (ex.message ? ex.message : ex);
		mappingData.message = {
			result: 'fail',
			error: errorMsg
		};
	}
	return mappingData;
};

TAF.Mapper.Controller.prototype.getMappingDaoFilters = function getMappingDaoFilters(filters) {
	var mappingDaoFilters = {};
	
	for (var filter in filters) {
		var mappingFilters =  filters[filter].mappingFilters;
		for (var mf in mappingFilters) {
			mappingDaoFilters[mf] = mappingFilters[mf];
		} 
	}
	
	return mappingDaoFilters;
};

TAF.Mapper.Controller.prototype.getMappingFilters = function _getMappingFilters(params, filterIds) {
	var mappingFilters = {};
	
	if (!filterIds || filterIds == '') {
		return mappingFilters;
	}

	try {
		var filters = new TAF.DAO.MappingFilterDao().getMappingFilterByIds(filterIds);
		for (var i = 0; filters && i < filters.length; i++) {
			var filter = filters[i];
			if (filter.isUi) {
				var filterName = ELEMENT_NAME.FIELD + filter.name.toLowerCase();
				filter.lov = this.getListOfValues(filter, params[filterName]);
				filter.mappingFilters = this.getMappingFilterValues(filter.mappingFilters, filter.lov, params[filterName]);
			}
			mappingFilters[filter.name] = filter;
		}
	} catch (ex) {
		var errorMsg = ex.getCode ? ex.getCode() + ': ' + ex.getDetails() : 'Error: ' + (ex.message ? ex.message : ex);
		nlapiLogExecution('ERROR', 'TAF.Mapper.Controller.getMappingFilters', errorMsg);
	}
	return mappingFilters;
};

TAF.Mapper.Controller.prototype.getMappingUiFilters = function _getMappingUiFilters(mappingFilters) {
	var mappingUIFilters = {};

	for (var filter in mappingFilters) {
		if (mappingFilters[filter].isUi) {
			mappingUIFilters[filter] = mappingFilters[filter];
		}
	}
	return mappingUIFilters;
};

TAF.Mapper.Controller.prototype.getListOfValues = function _getListOfValues(filter, selectedDefaultId) {
	var dao = TAF.DAO[filter.dao] ? new TAF.DAO[filter.dao]() : {};
	var listOfValues = dao.getList ? dao.getList(filter.daoFilter) : {};
	
	if (!listOfValues) {
		return {};
	}
	
	if (Object.keys(listOfValues).length == 0) {
		return listOfValues;
	}
	
	if (selectedDefaultId && listOfValues[selectedDefaultId]) {
		listOfValues[selectedDefaultId].isSelected = true;
	} else {
		listOfValues[Object.keys(listOfValues)[0]].isSelected = true;
	}
	
	return listOfValues;
};

TAF.Mapper.Controller.prototype.getMappingFilterValues = function _getMappingFilterValues(mappingFilters, listOfValues, defaultValue) {
	var mappingFilterValue = {};
	var value = '';
	
	if (typeof listOfValues == 'object') {
		value = defaultValue || (Object.keys(listOfValues).length > 0 ? Object.keys(listOfValues)[0] : '');
	}
	
	for (var mappingFilter in mappingFilters) {
		mappingFilterValue[mappingFilter] = mappingFilters[mappingFilter];
		
		if (!mappingFilters[mappingFilter][1]) {
			mappingFilterValue[mappingFilter][1] = value;
		}
	}
	return mappingFilterValue;
};