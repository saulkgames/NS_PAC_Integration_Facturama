/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * This is the entry point for User Events related to Vendors
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
			beforeLoad : function (context) {
				var vendor = vendorTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
				if (application.isViewMode(context)) {
					vendor.rfcField.validate();
				}
			},
		};

		return {
			beforeLoad: self.beforeLoad,
			_test_module: self,
		};
	}
);
