/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 * This is the entry point for User Events related to transactions
 */

define([
	'N/error',
	'./../common/application',
	'./../common/constants',
	'./../common/ui',
	'./PacConnectionRecord/updater',
	'./PacConnectionRecord/validator',
	'./PacConnectionRecord/licenseAgreement',
], function (error, application, constants, ui, updater, validator, licenseAgreement) {
	function beforeLoad (context) {
		// It is not possible to log context there, because it fails when deploying by SDF or exporting XML with instances of 'Mexico PAC' record. Error message:"ReferenceError: Empty Invocation Targer!"
		log.debug('mx_ue_pac_connection- beforeLoad');
		licenseAgreement.setValueOfImportantField(context);

		if (!application.isOneWorld()) {
			ui.setFieldDisplay({
				context: context,
				fieldId: constants.FIELD.MX_PACINFO_SUBSIDIARY,
				displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
			});
		}
	}

	function beforeSubmit (context) {
		log.debug('mx_ue_pac_connection- beforeSubmit', context);

		var validation = validator.validate({
			id: context.newRecord.getValue(constants.FIELD.ID),
			oldInactive: context.oldRecord ? validator.isDisabled(context.oldRecord) : true,
			inactive: validator.isDisabled(context.newRecord),
			mode: context.type,
			iAgree: validator.isIAgreed(context.newRecord),
			subsidiaries: context.newRecord.getValue(constants.FIELD.MX_PACINFO_SUBSIDIARY),
			name: context.newRecord.getValue(constants.FIELD.MX_PACINFO_EDOC_PACKAGE),
			isEnabled: context.newRecord.getValue(constants.FIELD.MX_PACINFO_ENABLE)
		});

		if (!validation.result) {
			throw validation.errorMessage;
		}
	}

	function afterSubmit (context) {
		log.debug('mx_ue_pac_connection- afterSubmit', context);
		updater.updateEdocumentPackage(context);
	}

	return {
		beforeLoad: beforeLoad,
		beforeSubmit: beforeSubmit,
		afterSubmit: afterSubmit,
	};
});
