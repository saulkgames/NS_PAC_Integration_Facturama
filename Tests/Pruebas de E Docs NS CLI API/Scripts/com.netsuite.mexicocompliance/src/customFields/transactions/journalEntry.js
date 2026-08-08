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
			recordTypes: [constants.RECORD_TYPE.JOURNAL_ENTRY],
			fieldIds: [
				{
					id: constants.FIELD.MX_JOURNALENTRY_AUTHORIZEDBY,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
				{
					id: constants.FIELD.MX_JOURNALENTRY_CREATEDBY,
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