/* istanbul ignore next */
define([
	'./mx_model',
], function (generalModel) {
	/**
	 * Constants are defined in constructor
	 */
	var model = function () {
		generalModel.model.call(this);
		this.recordName = 'entity';
		this.columns = {
			id: 'internalid',
			entityId: 'entityid',
			email: 'email',
			type: 'type',
		};
	};

	generalModel.extends(model, generalModel.model);
	return model;
});