/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 *
 * This is the entry point for User Events related to Customers
 *
 */

define(
	[
		'../common/application',
		'../customFields/entities/customer',
		'../common/constants',
		'../customFields/templates/visibilityHelper',
	],
	function (
		application,
		customerTemplate,
		constants,
		visibilityHelper
	) {
		let self = {
			beforeLoad : function (context) {
				let customer = customerTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
				if (application.isViewMode(context)) {
					customer.rfcField.validate();
					visibilityHelper.hideFieldsViewMode(context);
				}
			},

			beforeSubmit: function (context) {
				let customer = customerTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
				customer.rfcField.copyValueFromTaxRegistrationSublist();
			},
		};

		return {
			beforeLoad: self.beforeLoad,
			beforeSubmit: self.beforeSubmit,
			_test_module: self,
		};
	}
);
