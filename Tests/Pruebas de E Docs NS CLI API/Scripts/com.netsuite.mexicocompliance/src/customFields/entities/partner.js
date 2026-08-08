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
			recordTypes: [constants.RECORD_TYPE.PARTNER],
			contextFieldIds: [constants.FIELD.SUBSIDIARY],
			contextSublistIds: [constants.SUBLIST.TAX_REGISTRATION],
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