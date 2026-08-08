/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * This module is responsible for managing the Operation Type custom field
 *
 */

define(
	[
		'../common/application',
		'../common/constants',
		'../common/lister',
		'../common/scriptContext',
		'../common/ui',
		'../translations/translator',
	],
	function (
		application,
		constants,
		lister,
		scriptContext,
		ui,
		translator
	) {

		let instance;
		let windowObject;

		const OperationTypeField = function (windowInject) {
			windowObject = windowInject || (typeof (window) !== 'undefined' ? window : null);
		};

		OperationTypeField.prototype.updateDropdownOptions = function () {
			const context = scriptContext.getInstance().getContext();
			if (application.isViewMode(context)) {
				return;
			}

			const record = application.getRecord(context);
			let dropDown;
			try {
				dropDown = this._getDropdown();
			} catch (error) {
				return;
			}
			let originalValue = record.getValue({ fieldId: constants.FIELD.OPERATION_TYPE });

			if (application.isTransactionImport(record)) {
				dropDown.deleteOneOption(constants.OPERATION_TYPE.REAL_ESTATE_LEASING);

				if (originalValue === constants.OPERATION_TYPE.REAL_ESTATE_LEASING.toString()) {
					originalValue = constants.OPERATION_TYPE.OTHERS;
				}
			} else {
				// Removed and added again, just to preserve the order of options
				dropDown.deleteOneOption(constants.OPERATION_TYPE.PROFESSIONAL_SERVICES);
				dropDown.deleteOneOption(constants.OPERATION_TYPE.REAL_ESTATE_LEASING);
				dropDown.deleteOneOption(constants.OPERATION_TYPE.OTHERS);
				dropDown.deleteOneOption(constants.OPERATION_TYPE.ASSETS_ALIENATION);
				dropDown.deleteOneOption(constants.OPERATION_TYPE.GOODS_SERVICES_IMPORT);
				dropDown.deleteOneOption(constants.OPERATION_TYPE.VIRTUAL_TRANSF_IMPORT);
				dropDown.deleteOneOption(constants.OPERATION_TYPE.GLOBAL_OPERATIONS);
				dropDown.addOption(translator.OPERATION_TYPE_PROFESSIONAL_SERVICES(), constants.OPERATION_TYPE.PROFESSIONAL_SERVICES);
				dropDown.addOption(translator.OPERATION_TYPE_REAL_ESTATE_LEASING(), constants.OPERATION_TYPE.REAL_ESTATE_LEASING);
				dropDown.addOption(translator.OPERATION_TYPE_OTHERS(), constants.OPERATION_TYPE.OTHERS);
				dropDown.addOption(translator.OPERATION_TYPE_ASSETS_ALIENATION(), constants.OPERATION_TYPE.ASSETS_ALIENATION);
				dropDown.addOption(translator.OPERATION_TYPE_GOODS_SERVICES_IMPORT(), constants.OPERATION_TYPE.GOODS_SERVICES_IMPORT);
				dropDown.addOption(translator.OPERATION_TYPE_VIRTUAL_TRANSF_IMPORT(), constants.OPERATION_TYPE.VIRTUAL_TRANSF_IMPORT);
				dropDown.addOption(translator.OPERATION_TYPE_GLOBAL_OPERATIONS(), constants.OPERATION_TYPE.GLOBAL_OPERATIONS);
			}

			const newValue = originalValue || constants.OPERATION_TYPE.OTHERS;
			this._setValue(context, newValue);
		};

		OperationTypeField.prototype.hideOrDeprecate = function () {
			const context = scriptContext.getInstance().getContext();
			if (!application.isMexico(context)) {
				this._hide(context);
			} else {
				if (application.isCreateMode(context)) {
					this._setValue(context, '');
				}
				this._setLabel(context, translator.OPERATION_TYPE_DEPRECATED());
				this._disable(context);
			}
		};

		OperationTypeField.prototype.isValid = function () {
			const context = scriptContext.getInstance().getContext();
			const record = context.currentRecord;
			if (record.type === constants.RECORD_TYPE.EXPENSE_REPORT
				&& (context.fieldId === constants.FIELD.MX_CUSTCOL_VENDOR
					|| context.fieldId === constants.FIELD.MX_CUSTCOL_OPERATION_TYPE)) {

				const vendorId = record.getCurrentSublistValue({
					sublistId: constants.SUBLIST.EXPENSES,
					fieldId: constants.FIELD.MX_CUSTCOL_VENDOR,
				});

				const operationTypeId = record.getCurrentSublistValue({
					sublistId: constants.SUBLIST.EXPENSES,
					fieldId: constants.FIELD.MX_CUSTCOL_OPERATION_TYPE,
				});

				if (!this._isOperationTypeValid(vendorId, operationTypeId)) {
					const message = translator.ERROR_INVALID_OPERATION_TYPE();
					return (windowObject.confirm(message));
				}
			}
			return true;
		};

		// We introduce this private function in order to mock it in the tests. For some
		// reason the usual strategy of injecting a mock of the "document" object does
		// not work deterministically in the tests, but rather randomly.
		/* istanbul ignore next */
		OperationTypeField.prototype._getDropdown = function () {
			// Undocumented NS function;
			return windowObject.getDropdown(document.main_form.inpt_custbody_mx_operation_type);
		};

		OperationTypeField.prototype._setLabel = function (context, labelText) {
			const operationTypeField = ui.getField({
				context: context,
				fieldId: constants.FIELD.OPERATION_TYPE,
			});
			operationTypeField.label = labelText;
		};

		OperationTypeField.prototype._setValue = function (context, value) {
			const record = application.getRecord(context);
			record.setValue({
				fieldId: constants.FIELD.OPERATION_TYPE,
				value: value,
				ignoreFieldChange: true,
			});
		};

		OperationTypeField.prototype._hide = function (context) {
			this._toggleVisibility(context, constants.FIELD_DISPLAY_TYPE.HIDDEN);
		};

		OperationTypeField.prototype._disable = function (context) {
			this._toggleVisibility(context, constants.FIELD_DISPLAY_TYPE.DISABLED);
		};

		OperationTypeField.prototype._toggleVisibility = function (context, displayType) {
			ui.setFieldDisplay({
				context: context,
				fieldId: constants.FIELD.OPERATION_TYPE,
				displayType: displayType,
			});
		};

		OperationTypeField.prototype._isOperationTypeValid = function (vendorId, operationTypeId) {
			if (operationTypeId === constants.OPERATION_TYPE.REAL_ESTATE_LEASING) {
				if (!vendorId) {
					return true;
				}

				const vendorCountry = application.getEntityCountry(vendorId);

				// Valid, if local vendor
				return vendorCountry == null || vendorCountry === constants.OTHER.MEXICO_COUNTRY_CODE;
			} else {
				return true;
			}
		};

		const getInstance = function (windowInject) {
			return (instance = (instance || new OperationTypeField(windowInject)));
		};

		const destroyInstance = function () {
			instance = null;
		};

		return {
			getInstance: getInstance,
			destroyInstance: destroyInstance,
		};
	}
);
