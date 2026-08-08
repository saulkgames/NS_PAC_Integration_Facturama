/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * This is the entry point for User Events related to transactions
 *
 */
define(
	[
		'../common/constants',
		'../customFields/transactions/expenseReport',
	],

	function (constants, expenseReportTemplate) {
		function beforeLoad (context) {
			let expenseReport = expenseReportTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			expenseReport.initModules();
			expenseReport.operationTypeField.hideOrDeprecate();
		}

		return {
			beforeLoad: beforeLoad,
		};
	}
);
