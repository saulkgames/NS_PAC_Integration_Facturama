/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 */

define(
	[
		'../common/constants',
		'../customFields/transactions/invoice',
	],
	function (constants, invoiceTemplate) {
		var self = {
			pageInit: function (context) {
				var invoice = invoiceTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				invoice.values.onCopy();
			},
		};

		return {
			pageInit: self.pageInit,
			test_module: self,
		};
	}
);
