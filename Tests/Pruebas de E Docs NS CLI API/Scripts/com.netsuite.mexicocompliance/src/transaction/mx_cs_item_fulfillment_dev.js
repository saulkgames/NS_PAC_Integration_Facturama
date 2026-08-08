/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 */

define(
	[
		'../common/constants',
		'../customFields/transactions/itemFulfillment',
	],
	function (constants, itemFulfillment) {
		var self = {
			pageInit: function (context) {
				// Needed just to hide the New and Open buttons of the CFDI Usage field
				itemFulfillment.getInstance(constants.SCRIPT_TYPE.CS, context);
			},
		};

		return {
			pageInit: self.pageInit,
			test_module: self,
		};
	}
);
