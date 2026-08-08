/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
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
			filename: 'manage_templates.js',
			uuid: constants.SHARED_MODULE.EI_UUID,
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