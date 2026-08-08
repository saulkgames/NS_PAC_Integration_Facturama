/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../customFields/transactions/blanketPurchaseOrder',
		'../common/constants',
		'../customFields/templates/visibilityHelper'
	],

	function (blanketPurchaseOrderTemplate,
			  constants,
			  visibilityHelper
	) {
		function beforeSubmit (context) {
			var blanketPurchaseOrder = blanketPurchaseOrderTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			blanketPurchaseOrder.values.forceClearField(constants.FIELD.OPERATION_TYPE);
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
