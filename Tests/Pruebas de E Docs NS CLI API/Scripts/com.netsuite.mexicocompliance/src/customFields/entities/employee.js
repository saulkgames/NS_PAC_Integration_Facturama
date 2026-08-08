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
				{id: constants.FIELD.MX_CUSTENTITY_RFC},
			],
			sublistIds: [
				constants.SUBLIST.BANK_DETAILS,
			],
			recordTypes: [constants.RECORD_TYPE.EMPLOYEE],
			contextFieldIds: [constants.FIELD.SUBSIDIARY],
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