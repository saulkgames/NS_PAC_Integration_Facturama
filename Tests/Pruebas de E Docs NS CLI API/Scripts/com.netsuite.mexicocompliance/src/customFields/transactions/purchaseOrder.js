/* istanbul ignore next */
define(
	[
		'../templates/moduleFactory',
		'../../common/constants',
		'../../customFields/operationTypeField',
		'../../customFields/templates/dropdownModule',
	],
	function (
		ModuleFactory,
		constants,
		operationTypeField,
		dropdownModule
	) {
		var config = {
			fieldIds: [
				{
					id: constants.FIELD.MX_UUID_RECEIVED,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
			],
			dropdownList: [
				{
					id: constants.FIELD.OPERATION_TYPE,
					removeNewOption: true,
					removeBlankOption: true,
				},
			],
			recordTypes: [constants.RECORD_TYPE.PURCHASE_ORDER],
			contextFieldIds: [
				constants.FIELD.ENTITY,
				constants.FIELD.SUBSIDIARY,
			],
			extensions: {
				dropdown: dropdownModule,
				operationTypeField: operationTypeField,
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