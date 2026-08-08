/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * This script handles visibility for all supported transactions. We need to do
 * it this way because localized client scripts do not run the pageInit method.
 *
 * This script manages the visibility of fields and sublists based on the settings
 * written in mx_lrc_config: while Localization Assistant uses mx_lrc_config for this on server side,
 * this script does the same on client side.
 */
define(
	['../common/constants', '../plugin/mx_lrc_config'],
	function (constants, lrcConfig) {
		function localizationContextEnter (context) {
			_changeVisibility(context, true);
		}

		function localizationContextExit (context) {
			_changeVisibility(context, false);
		}

		function _changeVisibility (context, isDisplay) {
			lrcConfig.fields.forEach(function (fieldConfig) {
				if (fieldConfig.keepHiddenIn && fieldConfig.keepHiddenIn.indexOf(context.currentRecord.type) > -1) {
					return;
				}
				var field = context.currentRecord.getField({fieldId: fieldConfig.id});
				if (field) {
					field.isDisplay = isDisplay;
				}
			});
			lrcConfig.sublists.forEach(function (sublistId) {
				var sublist = context.currentRecord.getSublist(sublistId);
				if (sublist) {
					sublist.isDisplay = isDisplay;
				}
			});
		}

		return {
			localizationContextEnter: localizationContextEnter,
			localizationContextExit: localizationContextExit,
		};
	}
);
