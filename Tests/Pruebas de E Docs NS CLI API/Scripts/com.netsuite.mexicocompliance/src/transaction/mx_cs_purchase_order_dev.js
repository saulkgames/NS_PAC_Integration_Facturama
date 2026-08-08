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
		'../customFields/transactions/purchaseOrder',
	],
	function (constants, purchaseOrderTemplate) {
		var self = {
			mode: null,
			purchaseOrder: null,
			pageInit: function (context) {
				self.mode = context.mode;
				self.purchaseOrder = purchaseOrderTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				self.purchaseOrder.operationTypeField.updateDropdownOptions();
			},
			fieldChanged: function (context) {
				if (self.mode) {
					self.purchaseOrder = purchaseOrderTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
					self.purchaseOrder.operationTypeField.updateDropdownOptions();
				}
			},
			saveRecord: function (context) {
				self.purchaseOrder.scriptContext.updateContext(context);
				return true;
			},
		};


		return {
			test_module: self,
			pageInit: self.pageInit,
			fieldChanged: self.fieldChanged,
			saveRecord: self.saveRecord,
		};
	}
);
