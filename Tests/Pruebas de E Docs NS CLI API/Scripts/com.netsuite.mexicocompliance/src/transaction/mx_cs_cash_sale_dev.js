/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 */

define(
	[
		'../common/constants',
		'../customFields/transactions/cashSale',
	],
	function (constants, cashSaleTemplate) {
		var self = {
			pageInit: function (context) {
				var cashSale = cashSaleTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				cashSale.values.onCopy();
			},
		};

		return {
			pageInit: self.pageInit,
		};
	}
);
