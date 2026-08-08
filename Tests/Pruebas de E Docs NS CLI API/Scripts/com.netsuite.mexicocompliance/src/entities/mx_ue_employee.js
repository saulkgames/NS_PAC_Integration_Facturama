/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * This is the entry point for User Events related to Employees
 *
 */

define(
	[
		'../common/application',
		'../common/constants',
		'../customFields/entities/employee',
	],
	function (
		application,
		constants,
		employeeTemplate
	) {
		var self = {
			beforeLoad : function (context) {
				var employee = employeeTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
				if (application.isViewMode(context)) {
					employee.rfcField.validate();
				}
			},
		};

		return {
			beforeLoad: self.beforeLoad,
			_test_module: self,
		};
	}
);
