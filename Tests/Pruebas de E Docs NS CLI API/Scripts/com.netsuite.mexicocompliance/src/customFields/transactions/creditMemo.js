/* istanbul ignore next */
define(
	[
		'../templates/moduleFactory',
		'../../common/constants',
		'../serieField',
		'../folioField',
		'../templates/dropdownModule',
	],
	function (
		ModuleFactory,
		constants,
		SerieField,
		FolioField,
		DropdownModule
	) {
		var config = {
			fieldIds: [
				{
					id: constants.FIELD.MX_CFDI_ADDENDUM,
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
					id: constants.FIELD.MX_SAT_PAYMENT_TERM,
					defaultValue: '',
				},
			],
			sublistColumns: [
				{
					id: constants.SUBLIST.ITEMS,
					columnIds: [constants.FIELD.MX_CUSTCOL_SAT_ITEM_CODE],
				},
				{
					id: constants.SUBLIST.ITEMS,
					columnIds: [constants.FIELD.MX_CUSTCOL_SAT_TAX_OBJECT],
				}],
			sublistIds: [
				constants.SUBLIST.RELATED_CFDIS,
			],
			dropdownList: [
				{
					id: constants.FIELD.MX_CFDI_USAGE,
					defaultValueCode: 'G02',
					removeNewOption: true,
				},
				{
					id: constants.FIELD.MX_CFDI_SAT_EXPORT_TYPE,
					defaultValueCode: '01',
					removeNewOption: true,
				},
				{
					id: constants.FIELD.MX_RELATED_CFDIS_RELATIONSHIP_TYPE,
					removeNewOption: true,
				},
			],
			recordTypes: [constants.RECORD_TYPE.CREDIT_MEMO],
			contextFieldIds: [constants.FIELD.ENTITY, constants.FIELD.SUBSIDIARY],
			extensions: {
				dropdown: DropdownModule,
				folioField: FolioField,
				serieField: SerieField
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
