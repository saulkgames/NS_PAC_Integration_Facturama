/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * This is the entry point for Client Events related to Employees
 *
 */

define(
	[
		'../customFields/entities/employee',
		'../common/constants',
	],
	function (
		employeeTemplate,
		constants
	) {
		var self = {
			contextMode : '',
			employee: null,

			pageInit : function (context) {
				this.contextMode = context.mode;
				this.employee = employeeTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				this.employee.rfcField.validate();
			},

			fieldChanged : function (context) {
				context.mode = this.contextMode;
				this.employee = employeeTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				if (context.fieldId === constants.FIELD.MX_CUSTENTITY_RFC) {
					this.employee.rfcField.validate();
				}
			},
		};

		return {
			fieldChanged: self.fieldChanged,
			pageInit: self.pageInit,
			_test_module: self,
		};
	}
);
