/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * This module is responsible for Tax Codes validation features
 *
 */

define(
	[
		'../common/application',
		'../common/scriptContext',
		'../common/constants',
		'../translations/translator',
	],
	function (
		application,
		scriptContext,
		constants,
		translator
	) {

		const TaxCodeValidation = function () {
			this.context = null;
			this.window = null;
		};

		TaxCodeValidation.prototype.initialize = function (windowInject) {
			if (scriptContext.getInstance().getScriptType().isCS()) {
				this.window = windowInject || (typeof (window) !== 'undefined' ? window : null);
			}
		};

		TaxCodeValidation.prototype.isTransactionValid = function () {
			this.context = scriptContext.getInstance().getContext();
			this._GetTaxGroups.Cache = null;

			if (application.isMexico(this.context)) {
				return this._isValid();
			}
			else {
				return true;
			}
		};

		TaxCodeValidation.prototype._isValid = function () {
			const invalidTaxCodes = this._CheckTaxCodes();
			if (invalidTaxCodes.length > 0) {
				const errorMsg = this._getErrorMessage(invalidTaxCodes);
				return this.window.confirm(errorMsg); // standard JS method
			}
			return true;
		};

		TaxCodeValidation.prototype._getErrorMessage = function (invalidTaxCodes) {
			let tcList = '';
			for (let i in invalidTaxCodes) {
				tcList += (!tcList ? '' : ', ') + invalidTaxCodes[i];
			}

			return application.isEntityLocal(this.context.currentRecord)
				? translator.ERROR_INVALID_TAX_CODES_LOCAL([tcList])
				: translator.ERROR_INVALID_TAX_CODES_FOREIGN([tcList]);
		};

		// Return the invalid tax codes, if any
		TaxCodeValidation.prototype._CheckTaxCodes = function () {
			const invalidTaxCodes = [];

			this._CheckSublist(constants.SUBLIST.EXPENSES, invalidTaxCodes);
			this._CheckSublist(constants.SUBLIST.ITEMS, invalidTaxCodes);

			return invalidTaxCodes;
		};

		// Checks sublist for invalid tax codes
		TaxCodeValidation.prototype._CheckSublist = function (type, invalidTaxCodes) {
			const record = this.context.currentRecord;
			const sublistCount = record.getLineCount({sublistId: type});

			for (let i = 0; i < sublistCount; ++i) {
				const taxRate = parseFloat(record.getSublistValue({
					sublistId: type,
					fieldId: constants.FIELD.TAX_RATE_1,
					line: i,
				}));

				if (isNaN(taxRate)) {
					continue;
				}
				const tc = record.getSublistValue({
					sublistId: type,
					fieldId: constants.FIELD.TAX_CODE,
					line: i,
				});

				const isVendorLocal = !application.isTransactionImport(record);
				const isTacLocal = this._IsTaxLocal(tc);

				if (isVendorLocal && !isTacLocal || !isVendorLocal && isTacLocal) {
					invalidTaxCodes[tc] = record.getSublistText({
						sublistId: type,
						fieldId: constants.FIELD.TAX_CODE,
						line: i,
					});
				}
			}
		};

		// Determines if tax is non-import
		TaxCodeValidation.prototype._IsTaxLocal = function (id) {
			return this._IsSingleTaxCodeNotTaxGroup(id)
				? !this._IsImportTaxCode(id)
				: this._IsTaxGroupLocal(id);
		};

		// Determines if tax is single or a tax group
		TaxCodeValidation.prototype._IsSingleTaxCodeNotTaxGroup = function (id) {
			const taxGroups = this._GetTaxGroups();
			return taxGroups[id] === undefined;
		};

		TaxCodeValidation.prototype._IsImportTaxCode = function (taxCodeId) {
			if (taxCodeId == null) {
				return false;
			}
			const iId = parseInt(taxCodeId, 10);
			if (isNaN(iId)) {
				return false;
			}
			const record = this.context.currentRecord;
			const sImportTaxCodes = record.getValue({fieldId: constants.FIELD.MX_IMPORT_TAX_CODES});
			if (sImportTaxCodes == null || sImportTaxCodes === '') {
				return false;
			}
			return sImportTaxCodes.indexOf('|' + iId + '|') > -1;
		};

		TaxCodeValidation.prototype._IsTaxGroupLocal = function (taxGroupId) {
			const taxGroups = this._GetTaxGroups();
			const groupTaxCodes = taxGroups[taxGroupId];
			let isGroupLocal = true;
			for (let i = 0; i < groupTaxCodes.length; ++i) {
				var taxCodeId = groupTaxCodes[i];
				isGroupLocal = isGroupLocal && !this._IsImportTaxCode(taxCodeId);
				// return !this._IsImportTaxCode(record, taxCodeId);
			}
			return groupTaxCodes.length > 0
				? isGroupLocal
				: false;
		};

		TaxCodeValidation.prototype._GetTaxGroups = function () {
			if (this._GetTaxGroups.Cache === null) {
				const record = this.context.currentRecord;
				const taxGroups = record.getValue({fieldId: constants.FIELD.MX_TAX_GROUPS});

				if (!taxGroups) {
					return {};
				}
				this._GetTaxGroups.Cache = JSON.parse(taxGroups);
			}
			return this._GetTaxGroups.Cache;
		};

		const getInstance = function () {
			return new TaxCodeValidation();
		};

		return {
			getInstance: getInstance,
		};
	}
);
