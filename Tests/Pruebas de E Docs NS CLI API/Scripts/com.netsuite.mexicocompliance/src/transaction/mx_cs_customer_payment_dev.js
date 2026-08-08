/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 */

define(
	[
		'../common/constants',
		'../customFields/transactions/customerPayment',
		'../common/csLogger',
	],
	function (constants, customerPaymentTemplate, logger) {
		var self = {
			pageInit: function (context) {
				var customerPayment = customerPaymentTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				customerPayment.values.onCopy();
				try {
					customerPayment.electronicFunds.isInSession()
						? customerPayment.electronicFunds.fetchFromSession()
						: customerPayment.visibility.reloadPage();
					customerPayment.electronicFunds.updateVisibility(context);
				} catch (exception) {
					logger.log(exception);
				}
			},

			fieldChanged: function (context) {
				var customerPayment = customerPaymentTemplate.getInstance(constants.SCRIPT_TYPE.CS, context);
				customerPayment.electronicFunds.updateVisibility(context);
			},
		};

		return {
			pageInit: 		self.pageInit,
			fieldChanged:   self.fieldChanged,
			test_module:	self,
		};
	}
);
