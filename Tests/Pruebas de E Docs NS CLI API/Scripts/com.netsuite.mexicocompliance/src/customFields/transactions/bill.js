define(
	[
		'../importTaxCodes',
		'../taxCodesField',
		'../operationTypeField',
		'../templates/moduleFactory',
		'../../common/constants',
		'../../customFields/templates/dropdownModule',
	],
	/* istanbul ignore next */
	function (
		ImportTaxCodes,
		TaxCodesField,
		OperationTypeField,
		ModuleFactory,
		constants,
		dropdownModule
	) {
		const config = {
			dropdownList: [
				{
					id: constants.FIELD.OPERATION_TYPE,
					removeNewOption: true,
					removeBlankOption: true,
				},
			],
			recordTypes: [constants.RECORD_TYPE.VENDOR_BILL],
			contextFieldIds: [
				constants.FIELD.ENTITY,
				constants.FIELD.SUBSIDIARY,
			],
			extensions: {
				dropdown: dropdownModule,
				operationTypeField: OperationTypeField,
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
