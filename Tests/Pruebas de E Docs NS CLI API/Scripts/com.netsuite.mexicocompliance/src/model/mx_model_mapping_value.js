/**
 * Copyright 2016 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 *
 * @NApiVersion 2.1
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
			this.recordName = 'customrecord_mx_mapper_values';
			this.columns = {
				id: 'internalid',
				inactive: 'isinactive',
				name: 'name',
				category: 'custrecord_mx_mapper_value_category',
				code: 'custrecord_mx_mapper_value_inreport',
				isDefault: 'custrecord_mx_mapper_value_isdefault',
				effectiveFrom: 'custrecord_mx_mapper_value_start',
				validUntil: 'custrecord_mx_mapper_value_end',
			};
		};

		generalModel.extends(model, generalModel.model);
		return model;
	}
);
