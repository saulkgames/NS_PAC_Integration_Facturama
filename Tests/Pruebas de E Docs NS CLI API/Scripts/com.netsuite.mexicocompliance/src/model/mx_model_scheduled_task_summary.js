/**
 * @NApiVersion 2.1
 */
/* istanbul ignore next */
define(
	['./mx_model'],

	function (generalModel) {
		var model = function () {
			generalModel.model.call(this);
			this.recordName = 'customrecord_mx_scheduled_task_summary';
			this.columns = {
				id: 'internalid',
				name: 'name',
				scriptId: 'custrecord_mx_script_id',
				didTheTaskFinish: 'custrecord_mx_did_the_task_finish',
			};
		};

		generalModel.extends(model, generalModel.model);
		return model;
	}
);