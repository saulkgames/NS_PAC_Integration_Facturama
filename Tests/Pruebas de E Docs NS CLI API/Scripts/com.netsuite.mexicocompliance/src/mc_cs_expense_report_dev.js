/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 */

define(
	[
		'./common/constants',
		'./customFields/transactions/expenseReport',
	],
	function (constants, expenseReportTemplate) {
		var self = {
			validateField: function (context) {
				var expenseReport = expenseReportTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				return expenseReport.operationTypeField.isValid(context);
			},

			saveRecord: function (context) {
				var expenseReport = expenseReportTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				return expenseReport.importTaxCodes.isTransactionValid();
			},
		};

		return {
			validateField: self.validateField,
			saveRecord: self.saveRecord,
			_test_module: self,
		};
	}
);
