/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../customFields/templates/visibilityHelper',
	],

	function (visibilityHelper) {
		function beforeLoad (context) {
			visibilityHelper.hideFieldsViewMode(context);
		}

		return {
			beforeLoad: beforeLoad,
		};
	}
);
