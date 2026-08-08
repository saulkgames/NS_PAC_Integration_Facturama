/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 * otherwise make available this code.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
	'./../../common/sharedModuleFinder',
	'./../../common/constants',
], function (sharedModuleFinder, constants) {
	'use strict';
    
	var onAvailable = function (cb) {
        
		var fileObj = sharedModuleFinder.getSharedModule({
			filename: '12194_LocalizationApi.js',
			uuid: constants.SHARED_MODULE.EP_UUID,
		});		
		if (fileObj) {
			require([fileObj],function (api) {				
				cb(null,api);
			});
		} else {
			cb('No Api',null);
		}        
	};

	return {
		onAvailable : onAvailable,
	};
});