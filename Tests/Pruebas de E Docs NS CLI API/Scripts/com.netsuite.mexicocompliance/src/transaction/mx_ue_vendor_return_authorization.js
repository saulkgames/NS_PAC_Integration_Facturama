/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../customFields/transactions/vendorReturnAuthorization',
		'../common/constants',
		'../customFields/templates/visibilityHelper'
	],

	function (
		vendorReturnAuthorizationTemplate,
		constants,
		visibilityHelper
	) {
		function beforeSubmit (context) {
			// on batch process trigger the beforeLoad is not executed hence we need to trigger init here as well
			var vendorReturnAuthorization = vendorReturnAuthorizationTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			vendorReturnAuthorization.values.forceClearField(constants.FIELD.MX_SAT_PAYMENT_METHOD);
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
