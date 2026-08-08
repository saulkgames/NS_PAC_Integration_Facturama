/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 */

define(
	[
		'../common/application',
		'../common/constants',
		'../customFields/transactions/billPayment',
	],
	function (application, constants, billPaymentTemplate) {
		var self = {
			mode: null,
			billPayment: null,

			pageInit: function (context) {
				this.mode = context.mode;
				this.billPayment = billPaymentTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				this.billPayment.bankInfoField.repopulate();
			},

			fieldChanged: function (context) {
				if (this.mode) {
					this.billPayment = billPaymentTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
					this.billPayment.bankInfoField.onBankInfoChange();
					this.billPayment.bankInfoField.onEntityChange();
				}
			},

			saveRecord: function (context) {
				this.billPayment = billPaymentTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				this.billPayment.scriptContext.updateContext(context);
				this.billPayment.bankInfoField.copyReplicaValueToRecord();
				return true;
			},
		};

		return {
			pageInit: 		self.pageInit,
			fieldChanged: 	self.fieldChanged,
			saveRecord: 	self.saveRecord,
			test_module:	self,
		};
	}
);
