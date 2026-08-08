/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * PSGLBA-1860 - This script deletes "Subsidiary Workflow Search" workflow on SI account.
 *
 * Workflow "Subsidiary Workflow Search" is unnecessary
 * on single-instance accounts and it causes problems there,
 * so it should be deleted after installation/update of the bundle is done.
 *
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define(
	['N/record', 'N/search', './../../common/application', './../../model/mx_model_workflow'],
	function (record, search, application, WorkflowModel) {
		var WORKFLOW_NAME = 'Mexico Hide/Show Subsidiary Field';
		var workflowModel = new WorkflowModel();

		/**
		 * Check if current account is One World or Single Instance,
		 * if it is Single Instance, 'Mexico Hide/Show Subsidiary Field'
		 * workflow will be deleted.
		 * @param context
		 */
		var execute = function (context) {
			if (!application.isOneWorld()) {
				log.debug('deleteSubsidiaryWorkflow', 'Workflow \'' + WORKFLOW_NAME + '\' will be deleted from Single Instance account.');
				deleteSubsidiaryWorkflow();
			} else {
				log.debug('deleteSubsidiaryWorkflow', 'One World account detected - script won\'t be executed.');
			}
		};

		/**
		 * Delete 'Mexico Hide/Show Subsidiary Field' workflow
		 */
		var deleteSubsidiaryWorkflow = function (context) {
			// Find Workflow and get ID
			var workflowId = getSubsidiaryWorkflow().id;

			// Delete workflow
			log.debug('deleteSubsidiaryWorkflow', 'Removing workflow with id ' + workflowId);
			record.delete({
				type: 'workflow',
				id: workflowId,
			});
			log.audit('deleteSubsidiaryWorkflow', 'Workflow with id ' + workflowId + ' has been removed.');
		};

		/**
		 * Get workflow with name 'Mexico Hide/Show Subsidiary Field'.
		 * Unfortunately, we can't search by 'scriptid', search fails with message: "An nlobjSearchFilter contains invalid search criteria: scriptid."
		 * @returns {object} workflow model
		 */
		function getSubsidiaryWorkflow () {
			var workflows = search.create({
                type: "workflow",
                columns: ['internalid', 'name'],
                filters: [
					[workflowModel.columns.name, 'is', WORKFLOW_NAME],
				],
            }).run().getRange({
                start: 0,
                end: 1000,
            });
			if (workflows.length !== 1) {
				throw ('deleteSubsidiaryWorkflow', 'Workflow "' + WORKFLOW_NAME + '" not found. Number of search results: ' + workflows.length);
			}
			return workflows[0];
		}

		return {
			execute: execute,
		};
	}
);