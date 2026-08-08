/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * This is the entry point for Client Events related to Customers that need to be run on localized context
 *
 */

define(
	[
		'../common/constants',
		'../customFields/entities/customer',
		'../common/ui',
		'../customFields/rfcField',
	],
	function (
		constants,
		customerTemplate,
		ui,
		RfcField
	) {
		var self = {
			contextMode : '',

			localizationContextEnter: function (context) {
				this.contextMode = context.mode;
				customerTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				ui.setFieldDisplay({
					context: context,
					fieldId: constants.FIELD.MX_CUSTENTITY_RFC,
					displayType: RfcField.getInstance().getDisplayType(),
				});
			},
		};

		return {
			localizationContextEnter: self.localizationContextEnter,
			_test_module: self,
		};
	}
);
