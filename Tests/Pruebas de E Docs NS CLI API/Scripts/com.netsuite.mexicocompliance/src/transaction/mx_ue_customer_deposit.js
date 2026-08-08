/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../customFields/transactions/customerDeposit',
		'../common/constants',
		'../customFields/templates/visibilityHelper'
	],

	function (
		customerDepositTemplate,
		constants,
		visibilityHelper
	) {
		function beforeLoad (context) {
			var customerDeposit = customerDepositTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			customerDeposit.values.forceClearField(constants.FIELD.MX_SAT_PAYMENT_METHOD);

			visibilityHelper.hideFieldsViewMode(context);
		}

		return {
			beforeLoad: beforeLoad,
		};
	}
);
