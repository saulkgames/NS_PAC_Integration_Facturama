/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 */

define(
	[
		'../customFields/transactions/advIntercompanyJournalEntry',
		'../common/constants',
	],

	function (
		advIntercompanyJournalEntryTemplate,
		constants
	) {
		function beforeLoad (context) {
			var advIntercompanyJournalEntry = advIntercompanyJournalEntryTemplate.getInstance(constants.SCRIPT_TYPE.UE, context);
			advIntercompanyJournalEntry.visibility.updateFields();
		}

		return {
			beforeLoad: beforeLoad,
		};
	}
);