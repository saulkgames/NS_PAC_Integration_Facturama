/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * This script handles visibility for transactions with respect to page events: context-based events are treated
 * in the mx_cs_field_visibility.js script.
 */

define(
	[
		'N/log',
		'./application',
		'../plugin/mx_lrc_config',
	],
	function (log, application, lrcConfig) {
		function pageInit (context) {
			try {
				if (!application.isMexico(context)) {
					lrcConfig.fields.forEach(function (fieldConfig) {
						const field = context.currentRecord.getField({fieldId: fieldConfig.id});
						if (field) {
							field.isDisplay = false;
						}
					});
				}
			} catch (exception) {
				log.error('Could not hide fields', exception);
			}
		}

		return {
			pageInit: pageInit,
		};
	}
);
