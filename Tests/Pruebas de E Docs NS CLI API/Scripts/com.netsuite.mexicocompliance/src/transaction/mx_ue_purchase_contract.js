/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../customFields/transactions/purchaseContract',
		'../common/constants',
		'../customFields/templates/visibilityHelper'
	],

	function (
		purchaseContractTemplate,
		constants,
		visibilityHelper
	) {
		function beforeSubmit (context) {
			var purchaseContract = purchaseContractTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			purchaseContract.values.forceClearField(constants.FIELD.OPERATION_TYPE);
		}

		function beforeLoad (context) {
			visibilityHelper.hideFieldsViewMode(context);
		}

		return {
			beforeSubmit: beforeSubmit,
			beforeLoad: beforeLoad,
		};
	}
);
