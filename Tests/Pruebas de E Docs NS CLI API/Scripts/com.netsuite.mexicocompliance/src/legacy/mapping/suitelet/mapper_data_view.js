/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.Mapper = TAF.Mapper || {};

TAF.Mapper.ViewData = function _ViewData () {
	var data = {
		mappingCategories : {},
		mappings : {},
		mappingValues : {},
		mode : ACTION.EDIT,
		languageId : 'en',
		columnHeader : '',
	};

	return data;
};



