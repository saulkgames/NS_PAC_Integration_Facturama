/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * We use this file to handle Customers, Leads and Prospects because they
 * are all the same. They only differ in the value of the "status" field.
 *
 */

/* istanbul ignore next */
define(
	[
		'../templates/moduleFactory',
		'../../common/constants',
		'../rfcField',
	],
	function (
		ModuleFactory,
		constants,
		RfcField
	) {
		var config = {
			fieldIds: [
				{
					id: constants.FIELD.MX_CUSTENTITY_RFC,
					// TODO: make getDisplayType static so that we don't have to instantiate RfcField
					displayType: RfcField.getInstance().getDisplayType,
				},
			],
			recordTypes: [
				constants.RECORD_TYPE.CUSTOMER,
				constants.RECORD_TYPE.LEAD,
				constants.RECORD_TYPE.PROSPECT,
			],
			contextFieldIds: [constants.FIELD.SUBSIDIARY],
			contextSublistIds: [
				constants.SUBLIST.SUBSIDIARIES,
				constants.SUBLIST.TAX_REGISTRATION,
			],
			extensions: {
				rfcField : RfcField,
			},
		};
		var instance;

		return {
			getInstance: function (scriptType, context) {
				instance = ModuleFactory.instantiate(instance, config, scriptType, context);
				return instance;
			},
			destroyInstance: function () {
				instance = null;
			},
		};
	}
);