/* istanbul ignore next */
define(
	[
		'../templates/moduleFactory',
		'../../common/constants',
	],
	function (
		ModuleFactory,
		constants
	) {
		var config = {
			fieldIds: [
				{
					id: constants.FIELD.MX_UUID_RECEIVED,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
				{
					id: constants.FIELD.OPERATION_TYPE,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
			],
			recordTypes: [constants.RECORD_TYPE.PURCHASE_REQUISITION],
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