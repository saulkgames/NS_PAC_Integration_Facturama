/* istanbul ignore next */
define(
	['./mx_model'],

	function (generalModel) {
		/**
		 * Constants are defined in constructor
		 */
		var model = function () {
			generalModel.model.call(this);
			this.recordName = 'customrecord_mapper_keyvalue';
			this.columns = {
				id: 'internalid',
				name: 'name',
				category: 'custrecord_mapper_keyvalue_category', // list/record
				key: 'custrecord_mapper_keyvalue_key', // text
				value: 'custrecord_mapper_keyvalue_value', // list/record
				inputvalue: 'custrecord_mapper_keyvalue_inputvalue', // text
			};
		};

		generalModel.extends(model, generalModel.model);
		return model;
	}
);
