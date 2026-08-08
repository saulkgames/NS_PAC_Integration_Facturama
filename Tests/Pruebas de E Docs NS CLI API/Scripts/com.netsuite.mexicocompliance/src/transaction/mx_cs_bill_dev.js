/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define(
	[
		'../customFields/transactions/bill',
		'../common/constants',
	],
	function (billTemplate, constants) {
		var self = {
			_mode: null,
			_bill: null,

			pageInit: function (context) {
				this._mode = context.mode;
				this._bill = billTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				this._bill.operationTypeField.updateDropdownOptions();
				this._bill.values.onCopy();
			},

			fieldChanged: function (context) {
				if (this._mode) {
					this._bill = billTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
					this._bill.operationTypeField.updateDropdownOptions();
				}
			},

			saveRecord: function (context) {
				this._bill.scriptContext.updateContext(context);
				return this._bill.importTaxCodes.isTransactionValid();
			},
		};

		return {
			pageInit: self.pageInit,
			fieldChanged: self.fieldChanged,
			saveRecord: self.saveRecord,
		};
	}
);
