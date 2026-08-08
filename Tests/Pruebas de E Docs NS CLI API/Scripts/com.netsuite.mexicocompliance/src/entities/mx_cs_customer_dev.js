/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * This is the entry point for Client Events related to Customers
 *
 */

define(
	[
		'../common/application',
		'../common/constants',
		'../customFields/entities/customer',
	],
	function (
		application,
		constants,
		customerTemplate
	) {
		var customer = null;
		var self = {
			contextMode : '',

			pageInit : function (context) {
				this.contextMode = context.mode;
				customer = customerTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				customer.rfcField.validate();
			},

			fieldChanged : function (context) {
				context.mode = this.contextMode;
				customer = customerTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				customer.rfcField.copyValueFromTaxRegistrationSublist();
				if (context.fieldId === constants.FIELD.MX_CUSTENTITY_RFC
					|| context.fieldId === constants.FIELD.IS_PERSON) {
					customer.rfcField.validate();
				}
			},

			saveRecord : function (context) {
				context.mode = this.contextMode;
				customer = customerTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				return true;
			},

			sublistChanged : function (context) {
				context.mode = this.contextMode;
				customer = customerTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				customer.rfcField.copyValueFromTaxRegistrationSublist();
			},

		};

		return {
			fieldChanged: self.fieldChanged,
			pageInit: self.pageInit,
			saveRecord: self.saveRecord,
			sublistChanged: self.sublistChanged,
			_test_module: self,
		};
	}
);
