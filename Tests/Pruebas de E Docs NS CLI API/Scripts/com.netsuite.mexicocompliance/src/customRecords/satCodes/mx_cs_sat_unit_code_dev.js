/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 *
 * This is the entry point for User Events related to Sat Unit Codes
 *
 * For some reason, the "mode" attribute is not present in the "context"
 * object when accessed from the "saveRecord" hook, but it is present
 * from the "pageInit" one. Therefore, we are forced to save it first
 * and then pass it to the "validate" function.
 *
 */

define(
	[
		'../../common/constants',
		'../../common/scriptContext',
		'../../customRecords/satCodes/satCodes',
	],
	function (constants, scriptContext, satCodes) {
		var self = {
			contextMode : '',
			oldRecordCode : '',

			pageInit : function (context) {
				scriptContext.initialize(constants.SCRIPT_TYPE.CS, context);
				this.contextMode = context.mode;
				this.oldRecordCode = context.currentRecord.getValue({fieldId: constants.FIELD.MX_SAT_UNIT_CODE_CODE});
			},

			saveRecord : function (context) {
				var flags = {isUnitCode: true, isClientScript: true};
				var pageValues = {contextMode: this.contextMode, oldSatCode: this.oldRecordCode};

				return satCodes.validate(context, flags, pageValues);
			},
		};

		return {
			pageInit: self.pageInit,
			saveRecord: self.saveRecord,
			_test_module: self,
		};
	}
);
