/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../customFields/transactions/billCredit',
		'../common/constants',
	],
	function (billCreditTemplate, constants) {
		function beforeLoad (context) {
			var billCredit = billCreditTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			billCredit.initModules();
		}

		return {
			beforeLoad: beforeLoad,
		};
	}
);
