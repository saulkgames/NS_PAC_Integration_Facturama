define(
	[
		'../templates/moduleFactory',
		'../serieField',
		'../folioField',
		'../../common/constants',
		'../../common/scriptContext',
		'../../common/ui',
		'../../customFields/electronicFundsFields',
		'../templates/dropdownModule',
	],
	function (
		ModuleFactory,
		SerieField,
		FolioField,
		constants,
		ScriptContext,
		ui,
		ElectronicFundsFields,
		DropdownModule
	) {
		var ElectronicFunds = ElectronicFundsFields.getInstance();
		var config = {
			fieldIds: [
				{
					id: constants.FIELD.MX_CFDI_SERIE,
					defaultValue: '',
				},
				{
					id: constants.FIELD.MX_CFDI_FOLIO,
					defaultValue: '',
				},
				{
					id: constants.FIELD.EI_CFDI_CADENA_ORIGINAL,
					defaultValue: '',
				},
				{
					id: constants.FIELD.EI_CFDI_ISSUED_TIMESTAMP,
					defaultValue: '',
				},
				{
					id: constants.FIELD.EI_CFDI_ISSUER_SERIAL_NUMBER,
					defaultValue: '',
				},
				{
					id: constants.FIELD.EI_CFDI_SAT_SERIAL_NUMBER,
					defaultValue: '',
				},
				{
					id: constants.FIELD.EI_CFDI_SAT_SIGNATURE,
					defaultValue: '',
				},
				{
					id: constants.FIELD.EI_CFDI_ISSUE_DIGITAL_SIGNATURE,
					defaultValue: '',
				},
				{
					id: constants.FIELD.EI_CFDI_QR_CODE,
					defaultValue: '',
				},
				{
					id: constants.FIELD.MX_CFDI_PAYMENT_ID,
					displayType: ElectronicFunds.getDisplayType.bind(ElectronicFunds),
				},
				{
					id: constants.FIELD.MX_CFDI_ISSUER_ENTITY_RFC,
					displayType: ElectronicFunds.getDisplayType.bind(ElectronicFunds),
				},
				{
					id: constants.FIELD.MX_CFDI_ISSUE_BANK_NAME,
					displayType: ElectronicFunds.getDisplayType.bind(ElectronicFunds),
				},
				{
					id: constants.FIELD.MX_CFDI_PAYER_ACCOUNT,
					displayType: ElectronicFunds.getDisplayType.bind(ElectronicFunds),
				},
				{
					id: constants.FIELD.MX_CFDI_RECIPIENT_ENTITY_RFC,
					displayType: ElectronicFunds.getDisplayType.bind(ElectronicFunds),
				},
				{
					id: constants.FIELD.MX_CFDI_RECIPIENT_ACCOUNT,
					displayType: ElectronicFunds.getDisplayType.bind(ElectronicFunds),
				},
				{
					id: constants.FIELD.MX_CFDI_PAYMENT_CERTIFICATE,
					displayType: ElectronicFunds.getDisplayType.bind(ElectronicFunds),
				},
				{
					id: constants.FIELD.MX_CFDI_PAYMENT_STRING,
					displayType: ElectronicFunds.getDisplayType.bind(ElectronicFunds),
				},
				{
					id: constants.FIELD.MX_CFDI_PAYMENT_SIGNATURE,
					displayType: ElectronicFunds.getDisplayType.bind(ElectronicFunds),
				},
			],
			sublistIds: [
				constants.SUBLIST.RELATED_CFDIS,
			],
			dropdownList: [
				{
					id: constants.FIELD.MX_SAT_PAYMENT_METHOD,
					removeNewOption: true,
				},
				{
					id: constants.FIELD.MX_RELATED_CFDIS_RELATIONSHIP_TYPE,
					removeNewOption: true,
				},
				{
					id: constants.FIELD.MX_CFDI_PAYMENT_STRING_TYPE,
					displayType: ElectronicFunds.getDisplayType.bind(ElectronicFunds),
					removeNewOption: true,
				},
			],
			recordTypes: [constants.RECORD_TYPE.CUSTOMER_PAYMENT],
			contextFieldIds: [
				constants.FIELD.CUSTOMER,
				constants.FIELD.SUBSIDIARY,
				constants.FIELD.MX_SAT_PAYMENT_METHOD,
			],
			extensions: {
				dropdown: DropdownModule,
				electronicFunds: ElectronicFundsFields,
				folioField: FolioField,
				serieField: SerieField,
			},
		};

		var instance;
		var getInstance = function (scriptType, context) {
			instance = ModuleFactory.instantiate(instance, config, scriptType, context);

			if (instance.scriptContext.getScriptType().isCS()) {
				instance.visibility.reloadPage = function (windowInject) {
					var context = ScriptContext.getInstance().getContext();
					var windowObject = windowInject || (typeof (window) !== 'undefined' ? window : null);
					var url = document.location.toString();

					this.config.contextFieldIds.forEach(function (fieldId) {
						var contextFieldValue = ui.getValue({context: context, fieldId: fieldId});
						if (fieldId === constants.FIELD.CUSTOMER) {
							fieldId = constants.FIELD.ENTITY;
						}
						url = windowObject.addParamToURL(url, fieldId, contextFieldValue, true);
					});

					windowObject.onbeforeunload = null;
					windowObject.location.replace(url);
				};
			}
			return instance;
		};

		return {
			getInstance: getInstance,
			destroyInstance: function () {
				instance = null;
			},
		};
	}
);
