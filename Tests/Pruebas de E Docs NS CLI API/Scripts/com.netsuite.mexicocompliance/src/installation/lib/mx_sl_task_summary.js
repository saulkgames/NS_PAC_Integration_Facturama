/**
 *    Copyright 2019 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(
	['./../../model/mx_model_scheduled_task_summary'],
	function (ScheduledTaskSummaryModel) {
		var scheduledTaskSummaryModel = new ScheduledTaskSummaryModel();
		function createSummaryRecord (currentScheduledTaskScriptName, currentScheduledTaskScriptId) {
			if (checkIfTaskAlreadyRun(currentScheduledTaskScriptId)) {return;}
			scheduledTaskSummaryModel.save({
				name: currentScheduledTaskScriptName,
				scriptId: currentScheduledTaskScriptId,
				didTheTaskFinish: true,
			});
		}

		function checkIfTaskAlreadyRun (scriptId) {
			var scheduledTaskSummaryArr = scheduledTaskSummaryModel.findDynamic({
				columns: ['id','scriptId','didTheTaskFinish'],
				filters: [
					[scheduledTaskSummaryModel.columns.scriptId, 'is', scriptId],
				],
				searchCount: 1,
			});
			if (!scheduledTaskSummaryArr[0]) {return false;}
			return scheduledTaskSummaryArr[0].didTheTaskFinish;
		}
		return {
			createSummaryRecord: createSummaryRecord,
			checkIfTaskAlreadyRun: checkIfTaskAlreadyRun,
		};
	}
);