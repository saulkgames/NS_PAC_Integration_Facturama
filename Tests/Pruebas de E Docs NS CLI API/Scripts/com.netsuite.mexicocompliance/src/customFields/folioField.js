/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 */
define([
	'N/record',
	'N/log',
	'../common/application',
	'../common/scriptContext',
	'../common/constants',
	'../electronicInvoicing/lib/commonDataProvider',
],
function (
	record,
	log,
	application,
	scriptContext,
	constants,
	commonDataProvider
) {
	/**
	 * @constructor Initialize the object.
	 * Value of contextOverride.contextRecord serves to modify the context determination. Some forms/records determine their context based
	 * on related record. (Ex.: Item Fulfillment determines the context based on related Transfer Order)
	 * If contextOverride.suppressFields is set to True context is always considered non-Mexican.
	 */
	const FolioField = function () {
		this.contextOverride = {
			suppressFields: false,
			contextRecord: null,
		};
	};

	/**
	 * Set value of 'Folio' field. Folio is number part of 'Transaction Number' field, without prefix and suffix.
	 * If there's a value set for 'Prefix' and 'Suffix' in the enabled 'Mexico PAC' record (under the specific transaction type subtab),
	 * they are used to parse out the Prefix and Suffix of the Transaction Number field, and store only the number.
	 * If no PAC configuration is enabled, or more that one is enabled, Folio field will be set to empty string.
	 * If prefix or suffix are not set in PAC configuration, the 'Transaction Number' is stored in Folio field as is.
	 * Transaction number is generated after record is saved, so this method must be called in 'afterSubmit' method.
	 */
	FolioField.prototype.sourceFolio = function () {
		const context = scriptContext.getInstance().getContext();

		const currentRecord = application.getRecord(context);
		if (currentRecord.getValue(constants.FIELD.MX_CFDI_FOLIO)) return;

		if (!this._isFormManaged(context)) {
			return;
		}

		const pacInfo = this._getPacInfo(context);

		if (pacInfo) {
			const recordType = application.getRecordType(context);
			const prefix = pacInfo.prefixes[recordType];
			const suffix = pacInfo.suffixes[recordType];

			const recordId = context.newRecord.getValue({
				context: context,
				fieldId: constants.FIELD.ID,
			});

			const recForEditing = new TransactionRecord(recordId, recordType);
			const transactionNumber = recForEditing.getTransactionNumber(context);

			const folio = this._extractFolio(transactionNumber, prefix, suffix);
			recForEditing.setFolio(context, folio);
			recForEditing.save();
		} else {
			this._cleanFolio(context);
		}
	};

	FolioField.prototype._cleanFolio = function (context) {
		const recordType = application.getRecordType(context);

		const recordId = context.newRecord.getValue({
			context: context,
			fieldId: constants.FIELD.ID,
		});

		const currentFolio = context.newRecord.getValue({
			context: context,
			fieldId: constants.FIELD.MX_CFDI_FOLIO,
		});
		if (currentFolio) {
			const recForEditing = new TransactionRecord(recordId, recordType);
			recForEditing.setFolio(context, '');
			recForEditing.save();
		}
	};

	/**
	 * Form is managed if page was opened in Create, Edit, or Copy mode and if context is Mexican.
	 * Context may be overridden by contextOverride property. If contextOverride.contextRecord is non-Mexican
	 * or contextOverride.suppressFields is set to True context is always considered non-Mexican.
	 * @param context
	 * @returns {boolean} True if context is Mexican and UserEventType is Create, Edit or Copy.
	 * @private
	 */
	FolioField.prototype._isFormManaged = function (context) {
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
	 * @param context
	 */
	FolioField.prototype._getPacInfo = function (context) {
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

	/**
	 * Escapes special characters so it is safe to use the returned string in regular expression.
	 * @param stringToGoIntoTheRegex input string which may (but shouldn't) include some special characters like * or ? etc.
	 * @returns {String} input string with escaped special characters
	 * @private
	 */
	FolioField.prototype._escapeRegExp = function (stringToGoIntoTheRegex) {
		return stringToGoIntoTheRegex.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
	};

	/**
	 * Removes prefix and suffix from transaction number and returns plain number.
	 * @param transactionNumber transaction number which may include prefix and suffix
	 * @param prefix prefix for given record type
	 * @param suffix suffix for given record type
	 * @returns {String} Folio - transaction number without prefix and suffix
	 * @private
	 */
	FolioField.prototype._extractFolio = function (transactionNumber, prefix, suffix) {
		const escapedPrefix = this._escapeRegExp(prefix || '');
		const escapedSuffix = this._escapeRegExp(suffix || '');
		const prefixRegex = new RegExp('^(' + escapedPrefix + ')');
		const suffixRegex = new RegExp('(' + escapedSuffix + ')$');

		return transactionNumber.replace(prefixRegex, '').replace(suffixRegex, '');
	};

	/**
	 * Class allow access to stored transaction record.
	 * @param recordId Internal ID of record instance which will be loaded
	 * @param recordType Record type
	 * @constructor Load record with given ID and record type.
	 */
	const TransactionRecord = function (recordId, recordType) {
		this._transactionRecord = record.load({
			type: recordType,
			id: recordId,
			isDynamic: true,
		});
	};

	TransactionRecord.prototype.getTransactionNumber = function (context) {
		return this._transactionRecord.getValue({
			context: context,
			fieldId: constants.FIELD.TRANSACTION_NUMBER,
		});
	};

	TransactionRecord.prototype.setFolio = function (context, folio) {
		this._transactionRecord.setValue({
			context: context,
			fieldId: constants.FIELD.MX_CFDI_FOLIO,
			value: folio,
		});
	};

	TransactionRecord.prototype.save = function () {
		const undepFunds = this._transactionRecord.getValue({fieldId: 'undepfunds'}) === 'T';
		const undepFundsAccount = (this._transactionRecord.getValue({fieldId: 'account'}) || '').trim() !== '';

		if (!undepFunds && !undepFundsAccount) {
			this._transactionRecord.setValue({fieldId: 'undepfunds', value:'T'});
		}		
		
		this._transactionRecord.save({
			enableSourcing: false,
			ignoreMandatoryFields: true,
		});
	};

	const getInstance = function () {
		return new FolioField();
	};

	return {
		getInstance: getInstance,
		module: FolioField,
	};
});
