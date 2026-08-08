/* istanbul ignore next */
define(
	[
		'../../common/constants',
		'../templates/moduleFactory',
		'../rfcField',
	],
	function (
		constants,
		ModuleFactory,
		RfcField
	) {
		var config = {
			fieldIds: [
				{id: constants.FIELD.MX_CUSTENTITY_RFC},
			],
			recordTypes: [constants.RECORD_TYPE.CONTACT],
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