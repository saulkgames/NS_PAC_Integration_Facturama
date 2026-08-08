/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * This is the entry point for Client Events related to Partners
 *
 */

define(
	[
		'../common/constants',
		'../common/application',
		'../customFields/entities/partner',
	],
	function (
		constants,
		application,
		partnerTemplate
	) {
		var self = {
			contextMode : '',
			partner: null,

			pageInit : function (context) {
				this.contextMode = context.mode;
				this.partner = partnerTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				this.partner.rfcField.validate();
			},

			fieldChanged : function (context) {
				context.mode = this.contextMode;
				this.partner = partnerTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				this.partner.rfcField.copyValueFromTaxRegistrationSublist();
				if (context.fieldId === constants.FIELD.MX_CUSTENTITY_RFC
					|| context.fieldId === constants.FIELD.IS_PERSON) {
					this.partner.rfcField.validate();
				}
			},

			sublistChanged : function (context) {
				context.mode = this.contextMode;
				this.partner = partnerTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				this.partner.rfcField.copyValueFromTaxRegistrationSublist();
			},
		};

		return {
			fieldChanged: self.fieldChanged,
			pageInit: self.pageInit,
			sublistChanged: self.sublistChanged,
			_test_module: self,
		};
	}
);
