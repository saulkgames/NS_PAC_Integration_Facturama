/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * This is the entry point for Client Events related to Vendors
 *
 */

define(
	[
		'../common/application',
		'../common/constants',
		'../customFields/entities/vendor',
	],
	function (
		application,
		constants,
		vendorTemplate
	) {
		var self = {
			contextMode : '',
			vendor: null,

			pageInit : function (context) {
				this.contextMode = context.mode;
				this.vendor = vendorTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				this.vendor.rfcField.validate();
			},

			fieldChanged : function (context) {
				context.mode = this.contextMode;
				this.vendor = vendorTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				if (context.fieldId === constants.FIELD.MX_CUSTENTITY_RFC
					|| context.fieldId === constants.FIELD.IS_PERSON) {
					this.vendor.rfcField.validate();
				}
			},

			sublistChanged : function (context) {
				context.mode = this.contextMode;
				this.vendor = vendorTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				this.vendor.rfcField.copyValueFromTaxRegistrationSublist(context);
			},
		};

		return {
			pageInit: self.pageInit,
			sublistChanged: self.sublistChanged,
			fieldChanged: self.fieldChanged,
			_test_module: self,
		};
	}
);
