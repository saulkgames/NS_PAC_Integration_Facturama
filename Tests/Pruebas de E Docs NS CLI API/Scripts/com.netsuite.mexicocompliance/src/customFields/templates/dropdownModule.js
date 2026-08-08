/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(
	[
		'../../common/application',
		'../../common/constants',
		'../../common/scriptContext',
		'../../common/ui',
		'../../common/dom',
	],
	function (application, constants, scriptContext, ui, dom) {

		const module = function (config) {
			this.config = config;
			this.config.dropdownList = this.config.dropdownList || [];
		};

		module.prototype.initialize = function () {
			const context = scriptContext.getInstance().getContext();
			if (scriptContext.getInstance().getScriptType().isCS()) {
				this.config.dropdownList.forEach(function (dropdown) {
					this._manageOptions(context, dropdown);
					dom.dropdown.removePopupButtons(dropdown.id);
				}.bind(this));
			}
		};

		module.prototype._manageOptions = function (context, dropdown) {
			const nsDropdown = dom.dropdown.getNsDropdown(dropdown.id);
			if (!nsDropdown) {
				window.console.log('Did not find dropdown object with id: ' + dropdown.id);
				return;
			}

			if (dropdown.removeNewOption) {
				dom.dropdown.deleteNewOption(nsDropdown);
			}

			if (dropdown.removeBlankOption) {
				dom.dropdown.deleteBlankOption(nsDropdown);
			}

			if (this._shouldSelectDefaultValue(context, dropdown)) {
				dom.dropdown.selectOption(nsDropdown, dropdown.defaultValueCode);
			}
		};

		module.prototype._shouldSelectDefaultValue = function (context, dropdown) {
			return dropdown.defaultValueCode
				&& (application.isCreateMode(context) || this._isNotSameRecordTypeCopy(context));
		};

		/**
		 * Returns true if we are in copy mode and this is a non-standard copy (transaction type change eg. sales
		 * order -> cash sale)
		 * @param context
		 * @returns {boolean}
		 * @private
		 */
		module.prototype._isNotSameRecordTypeCopy = function (context) {
			if (!application.isCopyMode(context)) {
				return false;
			}

			// If this is a regular (same transaction type) copy, "Created From" field will be empty
			const createdFrom = ui.getValue({context: context, fieldId: constants.FIELD.CREATED_FROM});
			return Boolean(createdFrom); // not empty or null
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
