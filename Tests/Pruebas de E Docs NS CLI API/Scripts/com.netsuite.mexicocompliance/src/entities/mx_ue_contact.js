/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * This is the entry point for User Events related to Contacts
 *
 */

define(
	[
		'../common/constants',
		'../common/application',
		'../customFields/entities/contact',
	],
	function (
		constants,
		application,
		contactTemplate
	) {
		var self = {
			beforeLoad : function (context) {
				var contact = contactTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
				if (application.isViewMode(context)) {
					contact.rfcField.validate();
				}
			},
		};

		return {
			beforeLoad: self.beforeLoad,
			_test_module: self,
		};
	}
);
