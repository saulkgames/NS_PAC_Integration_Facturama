/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * This is the entry point for User Events related to Partners
 *
 */

define(
	[
		'../common/application',
		'../common/constants',
		'../customFields/entities/partner',
	],
	function (
		application,
		constants,
		partnerTemplate
	) {
		var self = {
			beforeLoad : function (context) {
				var partner = partnerTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
				if (application.isViewMode(context)) {
					partner.rfcField.validate();
				}
			},
		};

		return {
			beforeLoad: self.beforeLoad,
			_test_module: self,
		};
	}
);
