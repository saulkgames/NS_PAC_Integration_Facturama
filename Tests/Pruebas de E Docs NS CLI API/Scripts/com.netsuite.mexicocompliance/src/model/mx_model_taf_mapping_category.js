/* istanbul ignore next */
define(
	['./mx_model'],

	function (generalModel) {
		/**
		 * Constants are defined in constructor
		 */
		var model = function () {
			generalModel.model.call(this);
			this.recordName = 'customrecord_mapper_category';
			this.columns = {
				id: 'internalid',
				name: 'name',
				dao: 'custrecord_mapper_category_dao', // text
				header: 'custrecord_mapper_category_header', // text
				code: 'custrecord_mapper_category_code', // text
				filter: 'custrecord_mapper_category_filter', // select
			};
		};

		generalModel.extends(model, generalModel.model);
		return model;
	}
);
