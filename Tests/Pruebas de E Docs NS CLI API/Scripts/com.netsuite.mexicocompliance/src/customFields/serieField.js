/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 */
define([
	'N/log',
	'../common/application',
	'../common/scriptContext',
	'../common/constants',
	'../common/ui',
	'../electronicInvoicing/lib/commonDataProvider',
],
function (
	log,
	application,
	scriptContext,
	constants,
	ui,
	commonDataProvider
) {
	/**
	 * @constructor Initialize the object.
	 * Value of contextOverride.contextRecord serves to modify the context determination. Some forms/records determine their context based
	 * on related record. (Ex.: Item Fulfillment determines the context based on related Transfer Order)
	 * If contextOverride.suppressFields is set to True context is always considered non-Mexican.
	 */
	const SerieField = function () {
		this.contextOverride = {
			suppressFields: false,
			contextRecord: null,
		};
	};

	/**
	 * Load the serie value for given record type from enable PAC record and set it's value to 'serie' field.
	 * If no PAC configuration is enabled, or more that one is enabled, serie field will be set to empty string.
	 * If the transaction already has a serie value, it won't load and update it.
	 * This method should be called from beforeSubmit method.
	 */
	SerieField.prototype.sourceSerie = function () {
		
		const context = scriptContext.getInstance().getContext();
		if (!this._isFormManaged(context)) return;

		let serie = '';

		const currentRecord = application.getRecord(context);
		if (currentRecord.getValue(constants.FIELD.MX_CFDI_SERIE)) return;

		const pacInfo = this._getPacInfo(context);

		if (pacInfo) {
			const recordType = application.getRecordType(context);
			serie = pacInfo.series[recordType];
		}

		ui.setValue({
			context: context,
			fieldId: constants.FIELD.MX_CFDI_SERIE,
			value: serie,
		});
		
	};

	/**
	 * Form is managed if page was opened in Create, Edit, or Copy mode and if context is Mexican.
	 * Context may be overridden by contextOverride property. If contextOverride.contextRecord is non-Mexican or
	 * contextOverride.suppressFields is set to True context is always considered non-Mexican.
	 * @param context
	 * @returns {boolean} True if context is Mexican and UserEventType is Create, Edit or Copy.
	 * @private
	 */
	SerieField.prototype._isFormManaged = function (context) {
		if (!application.isCreateMode(context) && !application.isEditMode(context) && !application.isCopyMode(context)) {
			return false;
		}

		if (this.contextOverride.suppressFields) {
			return false;
		}

		const formContext = this.contextOverride.contextRecord
			? {contextRecord: this.contextOverride.contextRecord}
			: context;

		return application.isMexico(formContext);
	};

	/**
	 * Load enabled PAC Configuration, if no PAC Configuration is enabled,
	 * or if there is more then one enabled PAC, it will log an error and return null.
	 * @returns {*} Enabled PAC Configuration
	 * @private
	 */
	SerieField.prototype._getPacInfo = function (context) {
		const record = application.getRecord(context);
		const subsidiaryId = record.getValue({fieldId: constants.FIELD.SUBSIDIARY});
		const activeConnections = commonDataProvider.getActivePacConnections(subsidiaryId);

		if (activeConnections && activeConnections.length > 0) {
			return activeConnections[0];
		} else {
			log.debug('Failed to find active PAC Connection');
			return null;
		}
	};

	const getInstance = function () {
		return new SerieField();
	};

	return {
		getInstance: getInstance,
		module: SerieField,
	};
});