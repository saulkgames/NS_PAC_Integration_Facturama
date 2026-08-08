/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(['N/search', './../../common/constants'], function (
	search,
	constants
) {
	'use strict';

	function getPackageIdsByName (name) {
		var docSearch = search.create({
			type: constants.RECORD_TYPE.EI_EDOCUMENT_PACKAGE,
			columns: [],
			filters: [['name', 'is', name]],
		});
		var ids = [];
		docSearch.run().each(function (result) {
			ids.push(result.id);
			return true;
		});

		return ids;
	}

	function getSendingMethodIdsByPackage (packageId) {
		var sendingMethodsSearch = search.create({
			type: constants.RECORD_TYPE.EI_EDOCUMENT_SENDING_METHOD,
			columns: [constants.FIELD.EI_SM_SENDING_CHANNEL],
			filters: [[constants.FIELD.EI_SM_PACKAGE, 'anyof', [packageId]]],
		});
		var ids = [];
		sendingMethodsSearch.run().each(function (result) {
			ids.push({
				id : result.id,
				channel : result.getValue(constants.FIELD.EI_SM_SENDING_CHANNEL),
			});
			return true;
		});
  
		return ids;
	}

	function getTemplateIdsByPackage (packageId) {
		var templatesSearch = search.create({
			type: constants.RECORD_TYPE.EI_EDOCUMENT_TEMPLATE,
			columns: [],
			filters: [[constants.FIELD.EI_TMPL_PACKAGE, 'anyof', [packageId]]],
		});
		var ids = [];
		templatesSearch.run().each(function (result) {
			ids.push(result.id);
			return true;
		});
  
		return ids;
	}

	return {
		getPackageIdsByName: getPackageIdsByName,
		getSendingMethodIdsByPackage: getSendingMethodIdsByPackage,
		getTemplateIdsByPackage: getTemplateIdsByPackage,
	};
});
