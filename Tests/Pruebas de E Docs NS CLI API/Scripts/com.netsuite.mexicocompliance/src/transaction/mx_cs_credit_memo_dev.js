/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 */

define(
	[
		'../common/constants',
		'../customFields/transactions/creditMemo',
	],
	function (constants, creditMemoTemplate) {
		var self = {
			pageInit: function (context) {
				var creditMemo = creditMemoTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				creditMemo.values.onCopy();
			},
		};

		return {
			pageInit: 	 self.pageInit,
			test_module: self,
		};
	}
);
