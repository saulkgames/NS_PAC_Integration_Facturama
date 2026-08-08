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
			this.recordName = 'customrecord_mx_mapper_category';
			this.columns = {
				id: 'internalid',
				inactive: 'isinactive',
				name: 'name',
				dao: 'custrecord_mx_mapper_category_dao',
				header: 'custrecord_mx_mapper_category_header',
				code: 'custrecord_mx_mapper_category_code',
				filter: 'custrecord_mx_mapper_category_filter',
				condition: 'custrecord_mx_mapper_category_condition',
			};
		};

		generalModel.extends(model, generalModel.model);
		return model;
	}
);