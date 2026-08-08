/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * This is the entry point for Client scripts related to transactions
 *
 */
define(
	[
		'../common/constants',
		'../customFields/transactions/check',
	],
	function (constants, checkTemplate) {

		const self = {
			_mode: null,
			_check: null,

			pageInit: function (context) {
				self._mode = context.mode;
				self._check = checkTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				self._check.operationTypeField.updateDropdownOptions();
			},
			fieldChanged: function (context) {
				if (self._mode) {
					self._check = checkTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
					self._check.operationTypeField.updateDropdownOptions();
				}
			},
			saveRecord: function (context) {
				self._check = checkTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				self._check.scriptContext.updateContext(context);
				return self._check.importTaxCodes.isTransactionValid();
			},
		};

		return {
			test_module: self,
			pageInit: self.pageInit,
			fieldChanged: self.fieldChanged,
			saveRecord: self.saveRecord,
		};
	}
);
