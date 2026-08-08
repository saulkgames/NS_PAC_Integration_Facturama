/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../common/constants',
		'../customFields/transactions/itemFulfillment',
	],

	function (
		constants,
		itemFulfillmentTemplate
	) {
		function beforeSubmit (context) {
			// on batch process trigger the beforeLoad is not executed hence we need to trigger init here as well
			var itemFulfillment = itemFulfillmentTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			itemFulfillment.serieField.sourceSerie();
		}

		function afterSubmit (context) {
			var itemFulfillment = itemFulfillmentTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			itemFulfillment.folioField.sourceFolio();
		}

		return {
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit,
		};
	}
);
