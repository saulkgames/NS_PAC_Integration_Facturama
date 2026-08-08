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
		const config = {
			fieldIds: [
				{
					id: constants.FIELD.MX_CUSTENTITY_RFC,
					// TODO: make getDisplayType static so that we don't have to instantiate RfcField
					displayType: RfcField.getInstance().getDisplayType,
				},
			],
			sublistIds: [
				constants.SUBLIST.BANK_DETAILS,
			],
			recordTypes: [constants.RECORD_TYPE.VENDOR],
			contextSublistIds: [
				constants.SUBLIST.SUBSIDIARIES,
				constants.SUBLIST.TAX_REGISTRATION,
			],
			extensions: {
				rfcField : RfcField,
			},
		};
		let instance;

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
