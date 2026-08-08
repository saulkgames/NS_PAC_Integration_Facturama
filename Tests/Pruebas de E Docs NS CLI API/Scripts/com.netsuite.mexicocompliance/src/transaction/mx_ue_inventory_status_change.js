/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../common/constants',
		'../customFields/transactions/inventoryStatusChange',
		'../customFields/templates/visibilityHelper'
	],

	function (
		constants,
		inventoryStatusChangeTemplate,
		visibilityHelper
	) {
		function beforeSubmit (context) {
			var inventoryStatusChange = inventoryStatusChangeTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			inventoryStatusChange.values.forceClearField(constants.FIELD.OPERATION_TYPE);
		}

		function beforeLoad(context) {
			visibilityHelper.hideFieldsViewMode(context);
		}

		return {
			beforeSubmit: beforeSubmit,
			beforeLoad: beforeLoad,
		};
	}
);
