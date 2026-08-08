/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(
	[
		'N/log',
		'../../common/application',
		'../../common/constants',
		'../../common/scriptContext',
		'../../common/ui',
	],
	function (
		log,
		application,
		constants,
		scriptContext,
		ui
	) {

		const module = function (config) {
			this.config = config;
			this.config.contextSublistIds = this.config.contextSublistIds || [];
			this.config.contextFieldIds = this.config.contextFieldIds || [];
			this.config.fieldIds = this.config.fieldIds || [];
			this.config.sublistIds = this.config.sublistIds || [];
			this.config.sublistColumns = this.config.sublistColumns || [];
			this.config.recordTypes = this.config.recordTypes || [];

			this.contextRecord = null;
		};

		module.prototype.clearAll = function () {
			const context = scriptContext.getInstance().getContext();
			if (this._isFormManaged(context)) {
				this._clearFields(context);
				if (!scriptContext.getInstance().getScriptType().isCS()) {
					this._clearSublists(context);
					this._clearSublistColumns(context);
				}
			}
		};

		module.prototype.forceClearField = function (fieldId) {
			const context = scriptContext.getInstance().getContext();
			ui.setValue({
				context: context,
				fieldId: fieldId,
				value: '',
			});
		};

		module.prototype.clearFields = function () {
			const context = scriptContext.getInstance().getContext();
			if (this._isFormManaged(context)) {
				this._clearFields(context);
			}
		};

		module.prototype.clearSublists = function () {
			const context = scriptContext.getInstance().getContext();
			if (this._isFormManaged(context) && !scriptContext.getInstance().getScriptType().isCS()) {
				this._clearSublists(context);
			}
		};

		module.prototype.clearSublistColumns = function () {
			const context = scriptContext.getInstance().getContext();
			if (this._isFormManaged(context) && !scriptContext.getInstance().getScriptType().isCS()) {
				this._clearSublistColumns(context);
			}
		};

		module.prototype.onCopy = function () {
			const context = scriptContext.getInstance().getContext();
			if (!application.isCopyMode(context)) {
				return;
			}

			// These fields should always be blanked out in new copies
			[
				constants.FIELD.MX_SAT_UUID,
				constants.FIELD.EI_CFDI_SAT_SIGNATURE,
				constants.FIELD.EI_CFDI_SAT_SERIAL_NUMBER,
				constants.FIELD.MX_SAT_CERTIFY_TIME_TIMESTAMP,
				constants.FIELD.EI_CFDI_ISSUED_TIMESTAMP,
				constants.FIELD.EI_CFDI_CADENA_ORIGINAL,
				constants.FIELD.EI_CFDI_ISSUE_DIGITAL_SIGNATURE,
				constants.FIELD.EI_CFDI_QR_CODE,
				constants.FIELD.EI_CFDI_ISSUER_SERIAL_NUMBER,
				constants.FIELD.MX_UUID_RECEIVED,
				constants.FIELD.MX_CFDI_SERIE,
				constants.FIELD.MX_CFDI_FOLIO,
			].map(function (copyFieldId) {
				ui.setValue({
					context: context,
					fieldId: copyFieldId,
					value: '',
				});
			});
		};

		module.prototype._isFormManaged = function (context) {
			if (
				[constants.CONTEXT_TYPE.EDIT, constants.CONTEXT_TYPE.CREATE, constants.CONTEXT_TYPE.COPY]
					.indexOf(application.getContextMode(context)) === -1
			) {
				return false;
			}

			const formContext = this.contextRecord
				? {contextRecord: this.contextRecord}
				: context;

			return !application.isMexico(formContext);
		};

		module.prototype._clearFields = function (context) {
			const fields = this.config.fieldIds.concat(this.config.dropdownList);

			fields.forEach(function (currentField) {
				ui.setValue({
					context: context,
					fieldId: currentField.id,
					value: currentField.defaultValue || '',
				});
			});
		};

		module.prototype._clearSublists = function (context) {
			const record = application.getRecord(context);
			this.config.sublistIds.forEach(function (sublistId) {
				const lineCount = record.getLineCount({
					sublistId: sublistId,
				});

				for (let i = 0; i < lineCount; i++) {
					try {
						record.removeLine({
							sublistId: sublistId,
							line: 0,
						});
					} catch (exception) {
						log.error({
							title: 'Failed to erase all lines on sublist:  ' + sublistId,
							details: exception,
						});
					}
				}
			});
		};

		module.prototype._clearSublistColumns = function (context) {
			const record = application.getRecord(context);

			this.config.sublistColumns.forEach(function (sublist) {
				const lineCount = record.getLineCount({
					sublistId: sublist.id,
				});

				sublist.columnIds.forEach(function (columnId) {
					for (let i = 0; i < lineCount; i++) {
						if (sublist.id !== constants.SUBLIST.ITEMS || record.getSublistValue({
							fieldId: constants.FIELD.ITEM_TYPE,
							sublistId: sublist.id,
							line: i,
						}) !== 'EndGroup') {
							try {
								record.setSublistValue({
									fieldId: columnId,
									sublistId: sublist.id,
									line: i,
									value: '',
								});
							} catch (exception) {
								log.error({
									title: 'Failed to erase column: ' + columnId + ' on sublist:  ' + sublist.id,
									details: exception,
								});
							}
						}
					}
				});
			});
		};

		const getConfiguredInstance = function (config) {
			return new module(config);
		};

		return {
			getConfiguredInstance: getConfiguredInstance,
			module: module,
		};
	}
);
