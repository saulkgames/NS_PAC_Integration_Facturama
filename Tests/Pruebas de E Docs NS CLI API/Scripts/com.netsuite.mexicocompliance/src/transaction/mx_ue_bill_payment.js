/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../common/constants',
		'../customFields/transactions/billPayment',
	],

	function (constants, billPaymentTemplate) {
		function beforeLoad (context) {
			var billPayment = billPaymentTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			billPayment.initModules();
		}

		return {
			beforeLoad: beforeLoad,
		};
	}
);
