/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * This module is responsible for loading information (Import Tax Codes, Tax Groups) and storing them in hidden fields
 * ,to be used by the Client Script
 *
 */

define(
	[
		'../common/application',
		'../common/constants',
		'../common/scriptContext',
		'../common/ui',
		'../data/dataModule',
	],
	function (
		application,
		constants,
		scriptContext,
		ui,
		dataModule
	) {
		var TaxCodesField = function () {
			this.context = null;
		};

		TaxCodesField.prototype.initialize = function () {
			this.context = scriptContext.getInstance().getContext();

			if (scriptContext.getInstance().getScriptType().isUE()
				&& (application.isCreateMode(this.context)
					|| application.isEditMode(this.context)
					|| application.isCopyMode(this.context)
				)
			) {
				this._addImportTaxCodes();
				this._addTaxGroups();
			}
		};

		TaxCodesField.prototype.getTaxCodes = function () {
			this.context = scriptContext.getInstance().getContext();
			var record = application.getRecord(this.context);

			return record.getValue({fieldId: constants.FIELD.MX_IMPORT_TAX_CODES});
		};

		TaxCodesField.prototype._addImportTaxCodes = function () {
			// Import tax codes are loaded and stored in a hidden field for the Client Script to use
			var mxTaxCodes = this._loadMexicoImportTaxCodes();
			var sTaxCodes = '|' + mxTaxCodes.join('|') + '|';

			ui.addField({
				form: this.context.form,
				fieldId: constants.FIELD.MX_IMPORT_TAX_CODES,
				type: constants.FIELD_TYPE.TEXT_AREA,
				value: sTaxCodes,
				hidden: true,
			});
		};

		TaxCodesField.prototype._addTaxGroups = function () {
			var mxTaxGroups = this._loadMexicoTaxGroups();

			ui.addField({
				form: this.context.form,
				fieldId: constants.FIELD.MX_TAX_GROUPS,
				type: constants.FIELD_TYPE.TEXT_AREA,
				value: JSON.stringify(mxTaxGroups),
				hidden: true,
			});
		};

		TaxCodesField.prototype._loadMexicoImportTaxCodes = function () {
			// This works differently in SuiteTax
			if (application.isSuiteTax()) {
				return [];
			}

			var isOneWorld = application.isOneWorld();
			return dataModule.loadMexicoImportTaxCodes({isOneWorld: isOneWorld});
		};

		TaxCodesField.prototype._loadMexicoTaxGroups = function () {
			// Tax groups were deprecated in SuiteTax
			if (application.isSuiteTax()) {
				return [];
			}

			var isOneWorld = application.isOneWorld();
			return dataModule.loadMexicoTaxGroups({isOneWorld: isOneWorld});
		};

		var getInstance = function () {
			return new TaxCodesField();
		};

		return {
			getInstance: getInstance,
		};
	}
);