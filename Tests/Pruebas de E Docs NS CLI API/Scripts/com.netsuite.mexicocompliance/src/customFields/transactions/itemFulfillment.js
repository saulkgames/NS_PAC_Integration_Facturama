define(
	[
		'N/log',
		'N/record',
		'../templates/dropdownModule',
		'../templates/moduleFactory',
		'../templates/visibilityModule',
		'../../common/scriptContext',
		'../../common/constants',
		'../../common/ui',
		'../serieField',
		'../folioField'
	],
	function (
		log,
		record,
		DropdownModule,
		ModuleFactory,
		VisibilityModule,
		scriptContext,
		constants,
		ui,
		SerieField,
		FolioField
	) {
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
			],
			sublistColumns: [{
				id: constants.SUBLIST.ITEMS,
				columnIds: [constants.FIELD.MX_CUSTCOL_SAT_ITEM_CODE],
			}],
			sublistIds: [
				constants.SUBLIST.RELATED_CFDIS,
			],
			dropdownList: [
				{
					id: constants.FIELD.MX_CFDI_USAGE,
					removeNewOption: true,
				},
				{
					id: constants.FIELD.MX_RELATED_CFDIS_RELATIONSHIP_TYPE,
					removeNewOption: true,
				},
				{
					id: constants.FIELD.MX_CFDI_SAT_EXPORT_TYPE,
					defaultValueCode: '01', // "01 - No aplica"
					removeNewOption: true,
				},
			],
			recordTypes: [constants.RECORD_TYPE.ITEM_FULFILLMENT],
			// there is no context fields on this form.
			// Context is sourced from related "Transfer Order", "Sales Order" or an "Intercompany Transfer Order" records
			contextFieldIds: [],
			extensions: {
				dropdown: DropdownModule,
				folioField: FolioField,
				serieField: SerieField,
			},
		};
		var instance;
		var getInstance = function (scriptType, context) {
			var itemFulfillment = ModuleFactory.instantiate(instance, config, scriptType, context);

			// todo: think of a way to leverage scriptContext for context overriding

			itemFulfillment.visibility.updateAll = function () {
				var context = scriptContext.getInstance().getContext();
				itemFulfillment.visibility.contextOverride = loadCreatedFromRecord(context);
				VisibilityModule.module.prototype.updateAll.call(itemFulfillment.visibility);
			};

			itemFulfillment.visibility.updateFields = function () {
				var context = scriptContext.getInstance().getContext();
				itemFulfillment.visibility.contextOverride = loadCreatedFromRecord(context);
				VisibilityModule.module.prototype.updateFields.call(itemFulfillment.visibility);
			};

			itemFulfillment.visibility.updateSublists = function () {
				var context = scriptContext.getInstance().getContext();
				itemFulfillment.visibility.contextOverride = loadCreatedFromRecord(context);
				VisibilityModule.module.prototype.updateSublists.call(itemFulfillment.visibility);
			};

			itemFulfillment.serieField.sourceSerie = function () {
				var context = scriptContext.getInstance().getContext();
				itemFulfillment.serieField.contextOverride = loadCreatedFromRecord(context);
				if (_shouldSourceSerieAndFolioField(itemFulfillment.serieField.contextOverride.contextRecord)) {
					SerieField.module.prototype.sourceSerie.call(itemFulfillment.serieField);
				}
			};

			itemFulfillment.folioField.sourceFolio = function () {
				var context = scriptContext.getInstance().getContext();
				itemFulfillment.folioField.contextOverride = loadCreatedFromRecord(context);
				if (_shouldSourceSerieAndFolioField(itemFulfillment.folioField.contextOverride.contextRecord)) {
					FolioField.module.prototype.sourceFolio.call(itemFulfillment.folioField);
				}
			};

			instance = itemFulfillment;
			return itemFulfillment;
		};

		var loadCreatedFromRecord = function (context) {
			var recordId = ui.getValue({
				fieldId: constants.FIELD.CREATED_FROM,
				context: context,
			});

			var contextOverride = {
				suppressFields: false,
				contextRecord: null,
			};

			// when we are coming to Item Fulfillment page from:
			//  Transfer Order,
			//  Sales Order,
			//  Intercompany Transfer Order
			// we want to have context decision based on Subsidiary set in one of this Orders.
			// When coming from any other transaction (ex.: from  Vendor Return Authorization) we want to always suppress
			// the Mexico fields so they are always hidden
			try {
				contextOverride.contextRecord = record.load({
					type: constants.RECORD_TYPE.TRANSFER_ORDER,
					id: recordId,
				});
				return contextOverride;
			} catch (e) {
				log.debug('TRANSFER ORDER NOT FOUND', 'Checking Next');
			}

			try {
				contextOverride.contextRecord = record.load({
					type: constants.RECORD_TYPE.SALES_ORDER,
					id: recordId,
				});
				return contextOverride;
			} catch (e) {
				log.debug('SALES ORDER NOT FOUND', 'Checking Next');
			}

			try {
				contextOverride.contextRecord = record.load({
					type: constants.RECORD_TYPE.INTERCOMPANY_TRANSFER_ORDER,
					id: recordId,
				});
				return contextOverride;
			} catch (e) {
				log.debug('INTERCOMPANY TRANSFER ORDER NOT FOUND', 'Suppresing Mexican Context');
			}
			contextOverride.suppressFields = true;
			return contextOverride;
		};

		var _shouldSourceSerieAndFolioField = function (contextRecord) {
			return contextRecord && contextRecord.type !== constants.RECORD_TYPE.VENDOR_RETURN_AUTHORIZATION;
		};

		return {
			getInstance: getInstance,
			destroyInstance: function () {
				instance = null;
			},
		};
	}
);
