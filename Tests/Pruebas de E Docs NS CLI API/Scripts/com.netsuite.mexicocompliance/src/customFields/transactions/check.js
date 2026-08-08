define(
	[
		'../templates/moduleFactory',
		'../../common/constants',
		'../../common/application',
		'../../customFields/operationTypeField',
		'../importTaxCodes',
		'../taxCodesField',
		'../../customFields/templates/dropdownModule',
	],
	function (
		ModuleFactory,
		constants,
		application,
		operationTypeField,
		ImportTaxCodes,
		TaxCodesField,
		dropdownModule
	) {
		const config = {
			fieldIds: [
				{
					id: constants.FIELD.MX_UUID_RECEIVED,
					displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
				},
			],
			dropdownList: [
				{
					id: constants.FIELD.OPERATION_TYPE,
					removeNewOption: true,
					removeBlankOption: true,
					displayType: function (context) {
						return application.isSuiteTax() || !application.isMexico(context)
							? constants.FIELD_DISPLAY_TYPE.HIDDEN
							: constants.FIELD_DISPLAY_TYPE.NORMAL;
					},
				},
			],
			contextFieldIds: [
				constants.FIELD.ENTITY,
				constants.FIELD.SUBSIDIARY,
			],
			recordTypes: [constants.RECORD_TYPE.CHECK],
			extensions: {
				dropdown: dropdownModule,
				operationTypeField: operationTypeField,
				importTaxCodes: ImportTaxCodes,
				taxCodesField: TaxCodesField,
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
