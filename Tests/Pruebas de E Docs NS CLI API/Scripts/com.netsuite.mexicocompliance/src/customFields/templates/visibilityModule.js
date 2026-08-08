/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(
	[
		'../../common/application',
		'../../common/ui',
		'../../common/constants',
		'../../common/scriptContext',
	],
	function (
		application,
		ui,
		constants,
		scriptContext
	) {

		/**
		 @typedef fieldConfig
		 @type {Object}
		 @property {string}   id - id of the field which should be controlled
		 @property {string|function} displayType - display type of the field (normal, hidden, disabled, etc.).
		 It can be either a string or a function that calculates the display type on runtime. In this case,
		 the function must be defined as follows:
		 @param {Object} context - the context of the application.
		 @return {string} the display type of the field.
		 */

		/**
		 @typedef sublistColumnConfig
		 @type {Object}
		 @property {string}   id - id of the sublist containing the columns
		 @property {string[]} columnIds - ids of the sublist columns which visibility should be controlled
		 */

		/**
		 @typedef dropdownConfig
		 @type {Object}
		 @property {string}   id - id of the dropdown field
		 @property {string} defaultValueCode - value that the dropdown should display by default
		 @property {boolean} removeNewOption - true if the option to create a new value for the dropdown should be enabled, false otherwise
		 */

		/**
		 * @constructor Initialize the configuration with default values and performs check on mandatory fields.
		 *  Value of contextOverride.contextRecord serves to modify the context determination. Some forms/records determine their context based
		 *  on related record. (Ex.: Item Fulfillment determines the context based on related Transfer Order)
		 *  If contextOverride.suppressFields is set to True fields managed by configuration are always hidden.
		 *
		 * @param {string[]}              config.contextSublistIds - ids of the sublists on which the MX context is decided
		 * @param {string[]}              config.contextFieldIds - ids of the fields on which the MX context is decided
		 * @param {fieldConfig[]}         config.fieldIds - fields which visibility should be controlled
		 * @param {dropdownConfig[]}      config.dropdownList - dropdown fields which visibility should be controlled
		 * @param {string[]}              config.sublistIds - ids of the sublists which visibility should be controlled
		 * @param {sublistColumnConfig[]} config.sublistColumns - sublist columns which visibility should be controlled
		 * @param {string}                config.recordTypes - form types (ex. invoice), control for which form the functionality is applied
		 */
		const module = function (config, windowInject) {
			this.window = windowInject || (typeof (window) !== 'undefined' ? window : null);
			this.config = config;
			this.config.contextSublistIds = this.config.contextSublistIds || [];
			this.config.contextFieldIds = this.config.contextFieldIds || [];
			this.config.fieldIds = this.config.fieldIds || [];
			this.config.dropdownList = this.config.dropdownList || [];
			this.config.sublistIds = this.config.sublistIds || [];
			this.config.sublistColumns = this.config.sublistColumns || [];
			this.config.recordTypes = this.config.recordTypes || [];

			this.contextOverride = {
				suppressFields: false,
				contextRecord: null,
			};
		};

		module.prototype.updateAll = function () {
			const context = scriptContext.getInstance().getContext();
			if (this._isFormManaged(context)) {
				this._updateFields(context);
				this._updateSublists(context);
			}
		};

		module.prototype.updateFields = function () {
			const context = scriptContext.getInstance().getContext();
			if (this._isFormManaged(context)) {
				this._updateFields(context);
			}
		};

		/**
		 * By default the field is considered shown if no value was set on form configuration
		 * as displayType attribute of the field. If displayType value is set in configuration
		 * it is used as default. In case displayType is a function it gets executed and its
		 * result used as default.
		 */
		module.prototype.forceFieldsDefaultDisplay = function () {
			const context = scriptContext.getInstance().getContext();
			this._updateFields(context, true);
		};

		module.prototype.updateSublists = function () {
			const context = scriptContext.getInstance().getContext();
			if (this._isFormManaged(context)) {
				this._updateSublists(context);
			}
		};

		module.prototype.controlReload = function (mode) {
			const context = scriptContext.getInstance().getContext();
			if (mode === constants.CONTEXT_TYPE.CREATE) {
				const recordType = application.getRecordType(context);
				if (!this._isRecordTypeManaged(recordType)
					|| this.config.contextFieldIds.indexOf(context.fieldId) === -1) {
					return;
				}

				this.reloadPage();
			}
		};

		module.prototype.reloadPage = function () {
			const context = scriptContext.getInstance().getContext();
			let url = document.location.toString();

			this.config.contextFieldIds.forEach(function (fieldId) {
				const contextFieldValue = ui.getValue({context: context, fieldId: fieldId});
				url = this.window.addParamToURL(url, fieldId, contextFieldValue, true);
			}.bind(this));

			this.window.onbeforeunload = null;
			this.window.location.replace(url);
		};

		module.prototype._isClientScript = function (context) {
			return !context.type;
		};

		module.prototype._isFormManaged = function (context) {
			if (context.fieldId && this.config.contextFieldIds.indexOf(context.fieldId) === -1) {
				return false;
			}
			if (context.sublistId && this.config.contextSublistIds.indexOf(context.sublistId) === -1) {
				return false;
			}

			const recordType = application.getRecordType(context);
			const fitsRecord = this._isRecordTypeManaged(recordType);
			const fitsMode = this._isClientScript(context)
				|| application.isEditMode(context)
				|| application.isViewMode(context)
				|| application.isCreateMode(context)
				|| application.isCopyMode(context);
			return fitsRecord && fitsMode;
		};

		module.prototype._isRecordTypeManaged = function (recordType) {
			return this.config.recordTypes.indexOf(recordType) !== -1;
		};

		module.prototype._getDefaultDisplayType = function (context) {
			if (this.contextOverride.suppressFields) {
				return constants.FIELD_DISPLAY_TYPE.HIDDEN;
			}

			const formContext = this.contextOverride.contextRecord
				? {contextRecord: this.contextOverride.contextRecord}
				: context;

			return application.isMexico(formContext)
				? constants.FIELD_DISPLAY_TYPE.NORMAL
				: constants.FIELD_DISPLAY_TYPE.HIDDEN;
		};

		module.prototype._getAlteredDisplayType = function (defaultDisplayType, fieldConfig) {
			let displayType = defaultDisplayType;

			const context = scriptContext.getInstance().getContext();
			if (typeof fieldConfig.displayType === 'function') {
				displayType = fieldConfig.displayType(context);
			} else if (!scriptContext.getInstance().getScriptType().isCS()
				&& fieldConfig.columnIds === undefined
				&& (application.isEditMode(context)
					|| application.isCreateMode(context)
					|| application.isCopyMode(context)
				)
			) {
				displayType = fieldConfig.displayType !== undefined ? fieldConfig.displayType : constants.FIELD_DISPLAY_TYPE.NORMAL;
			}
			else if (fieldConfig.displayType !== undefined
				&& displayType === constants.FIELD_DISPLAY_TYPE.NORMAL) {
				displayType = fieldConfig.displayType;
			}

			return displayType;
		};

		module.prototype._updateFields = function (context, forceDefault) {
			const defaultDisplayType = forceDefault
				? constants.FIELD_DISPLAY_TYPE.NORMAL
				: this._getDefaultDisplayType(context);


			const fields = this.config.fieldIds.concat(this.config.dropdownList);
			fields.forEach(function (currentField) {
				const displayType = this._getAlteredDisplayType(defaultDisplayType, currentField);

				ui.setFieldDisplay({
					context: context,
					fieldId: currentField.id,
					displayType: displayType,
				});
			}.bind(this));
		};

		module.prototype._updateSublists = function (context) {
			if (!scriptContext.getInstance().getScriptType().isCS()) {
				const defaultDisplayType = this._getDefaultDisplayType(context);

				this.config.sublistColumns.forEach(function (sublist) {
					sublist.columnIds.forEach(function (columnId) {
						const displayType = this._getAlteredDisplayType(defaultDisplayType, sublist);
						ui.setFieldDisplay({
							context: context,
							fieldId: columnId,
							sublistId: sublist.id,
							displayType: displayType,
						});
					}.bind(this));
				}.bind(this));

				this.config.sublistIds.forEach(function (sublistId) {
					ui.setSublistDisplay({
						context: context,
						sublistId: sublistId,
						displayType: defaultDisplayType,
					});
				});
			}
		};

		const getConfiguredInstance = function (config, windowInject) {
			return new module(config, windowInject);
		};

		return {
			getConfiguredInstance: getConfiguredInstance,
			module: module,
		};
	}
);
