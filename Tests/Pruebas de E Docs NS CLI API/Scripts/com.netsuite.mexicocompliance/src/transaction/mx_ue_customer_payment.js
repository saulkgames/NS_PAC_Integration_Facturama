/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../common/constants',
		'../customFields/transactions/customerPayment',
	],
	function (
		constants,
		customerPaymentTemplate
	) {
		function beforeLoad (context) {
			var customerPayment = customerPaymentTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			if (!customerPayment.electronicFunds.isInSession()) {
				customerPayment.electronicFunds.refreshSession();
			}
		}

		function beforeSubmit (context) {
			// on batch process trigger the beforeLoad is not executed hence we need to trigger init here as well
			var customerPayment = customerPaymentTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			if (!customerPayment.electronicFunds.isInSession()) {
				customerPayment.electronicFunds.refreshSession();
			}
			customerPayment.serieField.sourceSerie();
			customerPayment.electronicFunds.clearFields();
		}

		function afterSubmit (context) {
			var customerPayment = customerPaymentTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			customerPayment.folioField.sourceFolio();
		}

		return {
			beforeLoad: beforeLoad,
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit
		};
	}
);
