/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 *@NApiVersion 2.1
 *@NScriptType BundleInstallationScript
 */
define(['N/task','N/search'], function (task, nssearch) {
	function createScheduledInstallationTask () {
		task.create({
			taskType: task.TaskType.SCHEDULED_SCRIPT,
			scriptId: 'customscript_mc_install_ss',
			deploymentId: 'customdeploy_mc_install_ss',
		}).submit();
	}

	function createScheduledMigrationTasks () {
		if (!checkIfTaskAlreadyRun('customscript_mx_migrate_taf_mapping')) {
			task.create({
				taskType: task.TaskType.MAP_REDUCE,
				scriptId: 'customscript_mx_migrate_taf_mapping',
				deploymentId: 'customdeploy_mx_migrate_taf_mapping',
			}).submit();
		}
		if (!checkIfTaskAlreadyRun('customscript_mx_mr_copy_bank_acc_numbers')) {
			task.create({
				taskType: task.TaskType.MAP_REDUCE,
				scriptId: 'customscript_mx_mr_copy_bank_acc_numbers',
				deploymentId: 'customdeploy_mx_mr_copy_bank_acc_numbers',
			}).submit();
		}
		if (!checkIfTaskAlreadyRun('customscript_mx_mr_copy_tax_reg_rfc')) {
			task.create({
				taskType: task.TaskType.MAP_REDUCE,
				scriptId: 'customscript_mx_mr_copy_tax_reg_rfc',
				deploymentId: 'customdeploy_mx_mr_copy_tax_reg_rfc',
			}).submit();
		}
	}

	function createScheduledDeleteSubsWorkflowFromSIAccountTask () {
		task.create({
			taskType: task.TaskType.SCHEDULED_SCRIPT,
			scriptId: 'customscript_mx_delete_subs_workflow',
			deploymentId: 'customdeploy_mx_delete_subs_workflow',
		}).submit();
	}

	function createSelectAllMexicanSubsidiariesInEnabledPACTask () {
		if (!checkIfTaskAlreadyRun('customscript_mx_ss_set_sub_in_pac')) {
			task.create({
				taskType: task.TaskType.SCHEDULED_SCRIPT,
				scriptId: 'customscript_mx_ss_set_sub_in_pac',
				deploymentId: 'customdeploy_mx_ss_set_sub_in_pac',
			}).submit();
		}
	}

	function checkIfTaskAlreadyRun (scriptId) {
		var taskSummarySearch = nssearch.create({
			type: 'customrecord_mx_scheduled_task_summary',
			columns: ['internalid','custrecord_mx_script_id','custrecord_mx_did_the_task_finish'],
			filters: [
				['custrecord_mx_script_id', 'is', scriptId],
			],
		});
		var taskSummarySearchResult = taskSummarySearch.run().getRange({
			start: 0,
			end: 1,
		});
		if (!taskSummarySearchResult[0]) {return false;}
		return taskSummarySearchResult[0].getValue({name: 'custrecord_mx_did_the_task_finish'});
	}

	function createUpdateEIComponentHashTask () {
		if (!checkIfTaskAlreadyRun('customscript_mx_update_ei_component_hash')) {
			task.create({
				taskType: task.TaskType.SCHEDULED_SCRIPT,
				scriptId: 'customscript_mx_update_ei_component_hash',
				deploymentId: 'customdeploy_mx_update_ei_component_hash',
			}).submit();
		}
	}

	return {
		checkIfTaskAlreadyRun: checkIfTaskAlreadyRun,
		afterInstall : function () {
			log.error('Mexico Bundle Installation', 'Entry Point afterInstall');
			createScheduledInstallationTask();
			createScheduledMigrationTasks();
			createScheduledDeleteSubsWorkflowFromSIAccountTask();
			createSelectAllMexicanSubsidiariesInEnabledPACTask();
			log.error('Mexico Bundle Installation', 'Exit Point afterInstall');
		},
		afterUpdate : function () {
			log.error('Mexico Bundle Installation', 'Entry Point afterUpdate');
			createScheduledMigrationTasks();
			createScheduledDeleteSubsWorkflowFromSIAccountTask();
			createSelectAllMexicanSubsidiariesInEnabledPACTask();
			createUpdateEIComponentHashTask();
			log.error('Mexico Bundle Installation', 'Exit Point afterUpdate');
		},
	};
});
