/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

/* istanbul ignore next */
define(
	[
		'../customFields/transactions/cashSale',
		'../common/constants',
		'../customFields/templates/visibilityHelper',
	],

	function (
		cashSaleTemplate,
		constants,
		visibilityHelper
	) {
		var cashSale;

		function beforeLoad (context) {
			visibilityHelper.hideFieldsViewMode(context);
			cashSale = cashSaleTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
		}

		function beforeSubmit (context) {
			// on batch process trigger the beforeLoad is not executed hence we need to trigger init here as well
			cashSale = cashSaleTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			cashSale.serieField.sourceSerie();
		}

		function afterSubmit (context) {
			cashSale = cashSaleTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			cashSale.folioField.sourceFolio();
		}

		return {
			beforeLoad: beforeLoad,
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit
		};
	}
);
