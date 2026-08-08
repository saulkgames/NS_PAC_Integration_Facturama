/* istanbul ignore next */
define(
	[
		'../importTaxCodes',
		'../taxCodesField',
		'../templates/moduleFactory',
		'../../customFields/operationTypeField',
		'../../common/constants',
		'../../customFields/templates/dropdownModule',
	],
	function (
		ImportTaxCodes,
		TaxCodesField,
		ModuleFactory,
		OperationTypeField,
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
			recordTypes: [constants.RECORD_TYPE.VENDOR_CREDIT],
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
