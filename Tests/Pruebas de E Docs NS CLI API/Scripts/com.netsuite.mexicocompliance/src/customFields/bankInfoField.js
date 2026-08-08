/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 */
define([
	'../translations/translator',
	'../model/mx_model_bank_information',
	'../common/application',
	'../common/constants',
	'../common/scriptContext',
	'../common/ui',
],
function (
	Translator,
	BankInfoModel,
	application,
	constants,
	scriptContext,
	ui
) {


	/**
	 *
	 * @constructor
	 */
	var BankInfoField = function () {
		this.bankInfoModel = new BankInfoModel();
		this.field = null;
	};

	BankInfoField.prototype.initialize = function () {
		var context = scriptContext.getInstance().getContext();
		if (this._shouldInitialize(context)) {
			this._hideOriginalField(context);
			this._setUpReplica(context);
		}
	};

	/**
	 * On Legacy Accounts with Witholding Tax (WT) bundle installed WT's client script
	 * triggers re-load of the page on entity change. When this happens we do not get to
	 * reset options properly on fieldChange event and hence it's required to do so
	 * on the following pageInit
	 */
	BankInfoField.prototype.repopulate = function () {
		var context = scriptContext.getInstance().getContext();
		if (this._shouldRepopulate(context)) {
			this._resetFieldOptions(context);
			this.copyReplicaValueToRecord(context);
		}
	};

	BankInfoField.prototype.onEntityChange = function () {
		var context = scriptContext.getInstance().getContext();
		if (context.fieldId === constants.FIELD.ENTITY) {
			this._resetFieldOptions(context);
		}
	};

	BankInfoField.prototype.onBankInfoChange = function () {
		var context = scriptContext.getInstance().getContext();
		if (context.fieldId === constants.FIELD.MX_BANK_INFORMATION_DN) {
			this.copyReplicaValueToRecord(context);
		}
	};

	BankInfoField.prototype.copyReplicaValueToRecord = function () {
		var context = scriptContext.getInstance().getContext();
		var bankInfo = context.currentRecord.getValue({fieldId: constants.FIELD.MX_BANK_INFORMATION_DN});
		context.currentRecord.setValue({
			fieldId: constants.FIELD.MX_BANK_INFORMATION,
			value: bankInfo,
		});
	};

	BankInfoField.prototype._shouldInitialize = function (context) {
		return scriptContext.getInstance().getScriptType().isUE() && (
			application.isCreateMode(context)
			|| application.isEditMode(context)
			|| application.isCopyMode(context)
		);
	};

	BankInfoField.prototype._shouldRepopulate = function (context) {
		return scriptContext.getInstance().getScriptType().isCS() && !application.isSuiteTax()
			&& (application.isEditMode(context) || application.isCopyMode(context));
	};

	BankInfoField.prototype._resetFieldOptions = function (context) {
		if (!this.field) {
			this.field = context.currentRecord.getField({fieldId: constants.FIELD.MX_BANK_INFORMATION_DN});
		}
		this._removeFieldOptions(context);
		this._setFieldOptions(context);
	};

	BankInfoField.prototype._hideOriginalField = function (context) {
		ui.setFieldDisplay({
			context: context,
			fieldId: constants.FIELD.MX_BANK_INFORMATION,
			displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
		});
	};

	BankInfoField.prototype._setUpReplica = function (context) {
		this._addField(context);
		this._addEmptyOption();
		this._setFieldOptions(context);
	};

	BankInfoField.prototype._removeFieldOptions = function (context) {
		ui.setValue({
			context: context,
			fieldId: constants.FIELD.MX_BANK_ACCOUNT_NUMBER,
			value: '',
		});

		ui.setValue({
			context: context,
			fieldId: constants.FIELD.MX_BANK_NAME,
			value: '',
		});

		var field = this.field;
		field.getSelectOptions().forEach(function (option) {
			if (option.value) {
				field.removeSelectOption({value : option.value});
			}
		});
	};

	BankInfoField.prototype._addEmptyOption = function () {
		// there is a limitation on CS that field of type Select can't have blank value added
		// so we force a blank option to be added just on the UE
		ui.addSelectOption({
			field: this.field,
			option: {
				value: '',
				text: '',
			},
		});
	};

	BankInfoField.prototype._setFieldOptions = function (context) {
		var selectOptions = this._loadOptions(context);
		var currentBankInfoValue = ui.getValue({
			context: context,
			fieldId: constants.FIELD.MX_BANK_INFORMATION,
		});

		var param = {
			field: this.field,
		};

		selectOptions.forEach(function (option) {
			param.option = {
				value: option.id,
				text: option.name,
				isSelected: currentBankInfoValue && currentBankInfoValue === option.id,
			};
			ui.addSelectOption(param);
		});
	};

	BankInfoField.prototype._addField = function (context) {
		this.field = context.form.addField({
			id: constants.FIELD.MX_BANK_INFORMATION_DN,
			type: constants.FIELD_TYPE.SELECT,
			label: Translator.LABEL_BANK_INFO(),
		});

		this.field.setHelpText({
			help: Translator.HELP_BANK_INFO(),
		});

		context.form.insertField(this.field, constants.FIELD.MX_BANK_NAME);
	};

	BankInfoField.prototype._loadOptions = function (context) {
		var entityId = ui.getValue({ context: context, fieldId: constants.FIELD.ENTITY });

		if (!entityId) {
			return [];
		}

		return this.bankInfoModel.findDynamic({
			columns: ['id','name'],
			filters: [
				[this.bankInfoModel.columns.entityId, 'is', entityId],
				'and',
				[this.bankInfoModel.columns.isinactive, 'is', 'F'],
			],
		});
	};

	var getInstance = function () {
		return new BankInfoField();
	};

	return {
		getInstance: getInstance,
	};
});