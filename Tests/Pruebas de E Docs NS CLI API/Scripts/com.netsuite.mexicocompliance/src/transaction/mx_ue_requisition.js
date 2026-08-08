/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../customFields/transactions/requisition',
		'../common/constants',
	],

	function (
		requisitionTemplate,
		constants
	) {
		function beforeSubmit (context) {
			var requisition = requisitionTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			requisition.values.forceClearField(constants.FIELD.OPERATION_TYPE);
		}

		return {
			beforeSubmit: beforeSubmit,
		};
	}
);
