/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 */

/* istanbul ignore next */
define(
	['./mx_model'],
	function (generalModel) {
		/**
     * Constants are defined in constructor
     */
		var model = function () {
			generalModel.model.call(this);
			this.recordName = 'workflow';
			this.columns = {
				id: 'internalid',
				name: 'name',
			};
		};

		generalModel.extends(model, generalModel.model);
		return model;
	}
);