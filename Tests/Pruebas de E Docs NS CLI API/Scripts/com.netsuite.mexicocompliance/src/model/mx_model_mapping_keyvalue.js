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
			this.recordName = 'customrecord_mx_mapper_keyvalue';
			this.columns = {
				id: 'internalid',
				inactive: 'isinactive',
				category: 'custrecord_mx_mapper_keyvalue_category',
				rectype: 'custrecord_mx_mapper_keyvalue_rectype',
				subrectype: 'custrecord_mx_mapper_keyvalue_subrectype',
				key: 'custrecord_mx_mapper_keyvalue_key',
				subkey: 'custrecord_mx_mapper_keyvalue_subkey',
				value: 'custrecord_mx_mapper_keyvalue_value',
				inputvalue: 'custrecord_mx_mapper_keyvalue_inputvalue',
			};
		};
		generalModel.extends(model, generalModel.model);
		return model;
	}
);