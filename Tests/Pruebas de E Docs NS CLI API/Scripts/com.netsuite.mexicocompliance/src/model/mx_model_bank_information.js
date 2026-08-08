/* istanbul ignore next */
define(
	['./mx_model'],

	function (generalModel) {
		/**
		 * Constants are defined in constructor
		 */
		var model = function () {
			generalModel.model.call(this);
			this.recordName = 'customrecord_psg_mx_bank_info';
			this.columns = {
				id: 'internalid',
				name: 'name',
				isinactive: 'isinactive',
				entityId: 'custrecord_psg_mx_bank_info_entity',
				accountNumber: 'custrecord_psg_mx_acct_num',
				bankName: 'custrecord_psg_mx_bank_name',
			};
		};

		generalModel.extends(model, generalModel.model);
		return model;
	}
);