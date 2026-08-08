/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * This is the entry point for User Events related to Sat Item Codes
 *
 */

define(
	[
		'../../common/constants',
		'../../customRecords/satCodes/satCodes',
	],
	function (constants, satCodes) {
		var self = {
			beforeSubmit : function (context) {
				var flags = {isUnitCode: false, isClientScript: false};
				var pageValues = {contextMode: context.type, oldSatCode: ''};

				satCodes.validate(context, flags, pageValues);
			},
		};

		return {
			beforeSubmit: self.beforeSubmit,
			_test_module: self,
		};
	}
);
