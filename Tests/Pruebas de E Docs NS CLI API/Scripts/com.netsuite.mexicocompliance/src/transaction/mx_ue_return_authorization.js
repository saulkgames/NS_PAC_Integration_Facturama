/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../customFields/transactions/returnAuthorization',
		'../common/constants',
		'../customFields/templates/visibilityHelper'
	],

	function (
		returnAuthorizationTemplate,
		constants,
		visibilityHelper
	) {
		function beforeLoad (context) {
			var returnAuthorization = returnAuthorizationTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			returnAuthorization.values.forceClearField(constants.FIELD.MX_SAT_PAYMENT_METHOD);

			visibilityHelper.hideFieldsViewMode(context);
		}

		return {
			beforeLoad: beforeLoad,
		};
	}
);
