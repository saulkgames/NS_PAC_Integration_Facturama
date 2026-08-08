/* istanbul ignore next */
define(
	[
		'../templates/moduleFactory',
		'../../common/constants',
		'../bankInfoField',
	],
	function (ModuleFactory, constants, BankInfoField) {
		const config = {
			fieldIds: [
				{
					id: constants.FIELD.MX_PAYMENT_METHOD,
					defaultValue: '',
				},
				{
					id: constants.FIELD.MX_BANK_INFORMATION,
					defaultValue: '',
				},
				{
					id: constants.FIELD.MX_BANK_INFORMATION_DN,
					defaultValue: '',
				},
				{
					id: constants.FIELD.MX_BANK_NAME,
					defaultValue: '',
					displayType: constants.FIELD_DISPLAY_TYPE.DISABLED,
				},
				{
					id: constants.FIELD.MX_BANK_ACCOUNT_NUMBER,
					defaultValue: '',
					displayType: constants.FIELD_DISPLAY_TYPE.DISABLED,
				},
				{
					id: constants.FIELD.MX_UUID_RECEIVED,
				},
			],
			recordTypes: [constants.RECORD_TYPE.VENDOR_PAYMENT],
			contextFieldIds: [constants.FIELD.ENTITY, constants.FIELD.SUBSIDIARY],
			extensions: {
				bankInfoField: BankInfoField,
			},
		};
		let instance;

		return {
			getInstance: function (scriptType, context) {
				ModuleFactory.module._initScriptUE = function () {};
				instance = ModuleFactory.instantiate(instance, config, scriptType, context);
				return instance;
			},
			destroyInstance: function () {
				instance = null;
			},
		};
	}
);
