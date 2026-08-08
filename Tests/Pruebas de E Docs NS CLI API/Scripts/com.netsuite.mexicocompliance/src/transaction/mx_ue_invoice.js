/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

/* istanbul ignore next */
define(
	[
		'../customFields/transactions/invoice',
		'../common/constants',
	],

	function (
		invoiceTemplate,
		constants
	) {
		function beforeSubmit (context) {
			// on batch process trigger the beforeLoad is not executed hence we need to trigger init here as well
			var invoice = invoiceTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			invoice.serieField.sourceSerie();
		}

		function afterSubmit (context) {
			var invoice = invoiceTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			invoice.folioField.sourceFolio();
		}

		return {
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit,
		};
	}
);
