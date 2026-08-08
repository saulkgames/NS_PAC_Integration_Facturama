/* istanbul ignore next */
define(
	[
		'../templates/moduleFactory',
		'../../common/constants',
	],
	function (ModuleFactory, constants) {
		const config = {
			fieldIds: [
				{
					id: constants.FIELD.MX_SAT_PAYMENT_METHOD,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
			],
			recordTypes: [constants.RECORD_TYPE.OPPORTUNITY],
			contextFieldIds: [
				constants.FIELD.ENTITY,
				constants.FIELD.SUBSIDIARY,
			],
			sublistColumns: [{
				id: constants.SUBLIST.ITEMS,
				columnIds: [constants.FIELD.MX_CUSTCOL_SAT_ITEM_CODE],
				displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
			}],
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