/* istanbul ignore next */
define(
	[
		'../importTaxCodes',
		'../taxCodesField',
		'../templates/moduleFactory',
		'../../common/constants',
		'../../customFields/operationTypeField',
	],
	function (
		ImportTaxCodes,
		TaxCodesField,
		ModuleFactory,
		constants,
		operationTypeField
	) {
		const config = {
			sublistColumns: [
				{
					id: constants.SUBLIST.EXPENSES,
					columnIds: [
						constants.FIELD.MX_CUSTCOL_VENDOR,
						constants.FIELD.MX_CUSTCOL_OPERATION_TYPE,
					],
				},
			],
			recordTypes: [constants.RECORD_TYPE.EXPENSE_REPORT],
			contextFieldIds: [
				constants.FIELD.ENTITY,
				constants.FIELD.SUBSIDIARY,
			],
			extensions: {
				operationTypeField: operationTypeField,
				importTaxCodes: ImportTaxCodes,
				taxCodesField: TaxCodesField,
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
