/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * This user event handles visibility for all supported transactions that does
 * not have a specific user event.
 */

define(
	[
		'../common/constants',
		'../customFields/templates/visibilityHelper'
	],

	function (
		constants,
		visibilityHelper
	) {
		function beforeLoad (context) {
			visibilityHelper.hideFieldsViewMode(context);
		}

		return {
			beforeLoad: beforeLoad,
		};
	}
);
