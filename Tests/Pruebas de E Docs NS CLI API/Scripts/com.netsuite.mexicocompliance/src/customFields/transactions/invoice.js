/* istanbul ignore next */
define(
	[
		'../templates/moduleFactory',
		'../../common/constants',
		'../templates/dropdownModule',
		'../serieField',
		'../folioField'
	],
	function (
		ModuleFactory,
		constants,
		DropdownModule,
		SerieField,
		FolioField
	) {
		var config = {
			fieldIds: [
				{
					id: constants.FIELD.MX_CFDI_ADDENDUM,
					defaultValue: '',
				},
				{
					id: constants.FIELD.MX_SAT_CERTIFY_TIME_TIMESTAMP,
					defaultValue: '',
				},
				{
					id: constants.FIELD.MX_SAT_UUID,
					defaultValue: '',
				},
				{
					id: constants.FIELD.MX_CUSTOMER_RFC,
					defaultValue: '',
				},
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
					id: constants.FIELD.EI_CFDI_QR_CODE,
					defaultValue: '',
				},
				{
					id: constants.FIELD.EI_CFDI_ISSUE_DIGITAL_SIGNATURE,
					defaultValue: '',
				},
				{
					id: constants.FIELD.EI_CFDI_SAT_SIGNATURE,
					defaultValue: '',
				},
				{
					id: constants.FIELD.EI_CFDI_SAT_SERIAL_NUMBER,
					defaultValue: '',
				},
			],
			dropdownList: [
				{
					id: constants.FIELD.MX_CFDI_USAGE,
					removeNewOption: true,
				},
				{
					id: constants.FIELD.MX_SAT_PAYMENT_TERM,
					defaultValueCode: 'PPD', // "PPD - Payment in Installments or Deferred"
					removeNewOption: true,
				},
				{
					id: constants.FIELD.MX_SAT_PAYMENT_METHOD,
					removeNewOption: true,
				},
				{
					id: constants.FIELD.MX_RELATED_CFDIS_RELATIONSHIP_TYPE,
					removeNewOption: true,
				},
				{
					id: constants.FIELD.MX_CFDI_SAT_EXPORT_TYPE,
					removeNewOption: true,
				},
				{
					id: constants.FIELD.MX_CUSTCOL_SAT_TAX_OBJECT,
					removeNewOption: true,
				}
			],
			sublistColumns: [{
				id: constants.SUBLIST.ITEMS,
				columnIds: [constants.FIELD.MX_CUSTCOL_SAT_ITEM_CODE, constants.FIELD.MX_CUSTCOL_SAT_TAX_OBJECT],
			}],
			sublistIds: [
				constants.SUBLIST.RELATED_CFDIS,
			],
			recordTypes: [constants.RECORD_TYPE.INVOICE],
			contextFieldIds: [constants.FIELD.ENTITY, constants.FIELD.SUBSIDIARY],
			extensions: {
				dropdown: DropdownModule,
				serieField: SerieField,
				folioField: FolioField
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
