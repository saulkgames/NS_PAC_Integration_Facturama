/* istanbul ignore next */
define(
	[
		'../templates/moduleFactory',
		'../../common/constants',
		'../templates/dropdownModule',
	],
	function (
		ModuleFactory,
		constants,
		DropdownModule
	) {
		var config = {
			fieldIds: [
				{
					id: constants.FIELD.MX_CUSTOMER_RFC,
					defaultValue: '',
				},
			],
			dropdownList: [
				{
					id: constants.FIELD.MX_SAT_PAYMENT_METHOD,
					defaultValueCode: '99', // "99 - To be Defined"
					removeNewOption: true,
				},
			],
			sublistColumns: [{
				id: constants.SUBLIST.ITEMS,
				columnIds: [constants.FIELD.MX_CUSTCOL_SAT_ITEM_CODE],
			}],

			recordTypes: [constants.RECORD_TYPE.SALES_ORDER],
			contextFieldIds: [constants.FIELD.ENTITY, constants.FIELD.SUBSIDIARY],
			extensions: {
				dropdown: DropdownModule,
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
