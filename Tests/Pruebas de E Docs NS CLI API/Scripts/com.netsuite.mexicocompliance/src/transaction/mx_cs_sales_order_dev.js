/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 */

define(
	[
		'../common/constants',
		'../customFields/transactions/salesOrder',
	],
	function (constants, salesOrderTemplate) {
		var self = {
			pageInit: function (context) {
				salesOrderTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
			},
		};

		return {
			pageInit: self.pageInit,
			test_module: self,
		};
	}
);
