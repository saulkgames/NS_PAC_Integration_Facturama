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
					id: constants.FIELD.MX_SAT_PAYMENT_METHOD,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
				{
					id: constants.FIELD.MX_UUID_RECEIVED,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
				{
					id: constants.FIELD.OPERATION_TYPE,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
			],
			recordTypes: [constants.RECORD_TYPE.VENDOR_RETURN_AUTHORIZATION],
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