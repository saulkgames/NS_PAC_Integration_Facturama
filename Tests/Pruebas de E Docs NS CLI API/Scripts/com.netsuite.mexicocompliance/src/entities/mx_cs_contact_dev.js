/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * This is the entry point for Client Events related to Contacts
 *
 */

define(
	[
		'../customFields/entities/contact',
		'../common/application',
		'../common/constants',
	],
	function (
		contactTemplate,
		application,
		constants
	) {
		var contact = null;
		var self = {
			contextMode : '',

			pageInit : function (context) {
				this.contextMode = context.mode;
				contact = contactTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				contact.rfcField.validate();
			},

			fieldChanged : function (context) {
				context.mode = this.contextMode;
				contact = contactTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				if (context.fieldId === constants.FIELD.MX_CUSTENTITY_RFC) {
					contact.rfcField.validate();
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
