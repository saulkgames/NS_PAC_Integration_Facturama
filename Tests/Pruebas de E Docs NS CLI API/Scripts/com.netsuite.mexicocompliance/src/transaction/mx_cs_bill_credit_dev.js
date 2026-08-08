/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * This is the entry point for Client scripts related to transactions
 *
 */
define(
	[
		'../common/constants',
		'../customFields/transactions/billCredit',
	],
	function (constants, billCreditTemplate) {
		var self = {
			_mode : null,
			_billCredit : null,

			pageInit: function (context) {
				this._mode = context.mode;
				this._billCredit = billCreditTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				this._billCredit.operationTypeField.updateDropdownOptions();
				this._billCredit.values.onCopy();
			},

			fieldChanged: function (context) {
				if (this._mode) {
					this._billCredit = billCreditTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
					this._billCredit.operationTypeField.updateDropdownOptions();
				}
			},

			saveRecord: function (context) {
				this._billCredit.scriptContext.updateContext(context);
				return this._billCredit.importTaxCodes.isTransactionValid();
			},
		};

		return {
			pageInit: self.pageInit,
			fieldChanged: self.fieldChanged,
			saveRecord: self.saveRecord,
		};
	}
);
