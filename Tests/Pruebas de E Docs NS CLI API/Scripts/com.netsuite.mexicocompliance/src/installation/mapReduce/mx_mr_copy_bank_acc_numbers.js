/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
	'N/search',
	'N/record',
	'N/runtime',
	'../../model/mx_model_account',
	'../lib/mx_sl_task_summary',
],

function (search, record, runtime, AccountModel, taskSummary) {
	var accountModel = new AccountModel();
	function getInputData () {
		if (!accountRecordHasBankAccountNumberFromTaf()) {return [];}
		return accountModel.findDynamic({
			columns: ['id','name','type','bankAccountNumber'],
			filters: [
				[accountModel.columns.type, 'is', 'Bank'],
			],
			searchCount: 0,
		});
	}

	function map (context) {
		var accountFromContext = JSON.parse(context['value']);
		accountModel.save({
			id: parseInt(accountFromContext.id),
			mxBankAccountNumber: accountFromContext.bankAccountNumber,
		});
	}

	function accountRecordHasBankAccountNumberFromTaf () {
		try {
			accountModel.findDynamic({
				columns: ['id','name','type','bankAccountNumber'],
				filters: [
					[accountModel.columns.type, 'is', 'Bank'],
				],
			});
		} catch (e) {
			log.debug('Taf bundle not installed.');
			return false;
		}
		return true;
	}

	// eslint-disable-next-line no-unused-vars
	function summarize (summary)
	{
		taskSummary.createSummaryRecord('Copy Bank Account Numbers',runtime.getCurrentScript().id);
	}

	return {
		getInputData: getInputData,
		map: map,
		summarize: summarize,
	};
});