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
			recordTypes: [constants.RECORD_TYPE.CUSTOMER_REFUND],
			fieldIds: [
				{
					id: constants.FIELD.MX_CUSTOMER_RFC,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
				{
					id: constants.FIELD.EI_CFDI_CADENA_ORIGINAL,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
				{
					id: constants.FIELD.MX_SAT_CERTIFY_TIME_TIMESTAMP,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
				{
					id: constants.FIELD.MX_CFDI_ADDENDUM,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
				{
					id: constants.FIELD.MX_SAT_UUID,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
				{
					id: constants.FIELD.MX_SAT_PAYMENT_METHOD,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
			],
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
