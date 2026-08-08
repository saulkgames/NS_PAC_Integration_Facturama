/* istanbul ignore next */
define(
	['./mx_model'],

	function (generalModel) {
		/**
         * Constants are defined in constructor
		 * NOTE: there are two similar fields - bankAccountNumber and mxBankAccountNumber, because the value bankAccountNumber is copied to mxBankAccountNumber after
		 * 		 installation of Mexico Localization bundle - in mc_bundle_install.js script (check task PSGLBA-2034).
         */
		var model = function () {
			generalModel.model.call(this);
			this.recordName = 'account';
			this.columns = {
				id: 'internalid',
				name: 'name',
				type: 'type',
				bankAccountNumber: 'custrecord_acct_bank_account_number',
				mxBankAccountNumber: 'custrecord_mx_bank_account_number',
				fieldId: 'fieldId',
				value: 'value',

			};
		};

		generalModel.extends(model, generalModel.model);
		return model;
	}
);