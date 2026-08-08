/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../common/constants',
		'../customFields/transactions/bill',
	],

	function (constants, billTemplate) {
		function beforeLoad (context) {
			var bill = billTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			bill.initModules();
		}

		return {
			beforeLoad: beforeLoad,
		};
	}
);
