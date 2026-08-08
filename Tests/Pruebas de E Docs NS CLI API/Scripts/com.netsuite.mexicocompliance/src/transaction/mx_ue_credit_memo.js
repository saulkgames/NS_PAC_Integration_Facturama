/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../customFields/transactions/creditMemo',
		'../common/application',
		'../common/constants',
	],

	function (creditMemoTemplate, application, constants) {
		function beforeLoad (context) {
			var creditMemo = creditMemoTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			if (application.isCreateMode(context)) {
				creditMemo.values.forceClearField(constants.FIELD.MX_CFDI_ADDENDUM);
			}
		}

		function beforeSubmit (context) {
			// on batch process trigger the beforeLoad is not executed hence we need to trigger init here as well
			var creditMemo = creditMemoTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			creditMemo.serieField.sourceSerie();
		}

		function afterSubmit (context) {
			var creditMemo = creditMemoTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			creditMemo.folioField.sourceFolio();
		}

		return {
			beforeLoad: beforeLoad,
			beforeSubmit: beforeSubmit,
			afterSubmit: afterSubmit
		};
	}
);
