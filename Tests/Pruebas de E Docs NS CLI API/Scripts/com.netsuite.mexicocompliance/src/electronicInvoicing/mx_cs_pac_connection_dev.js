/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 *
 * This is the entry point for User Events related to transactions
 */

define([
	'N/ui/message',
	'./PacConnectionRecord/validator',
	'../common/application',
	'../common/constants',
], function (uiMessage, validator, application, constants) {
	
	var banner;
	var mode;
	var validationProps = {
		oldInactive : false,
	};

	function pageInit (context) {
		mode = context.mode;
		
		validationProps.mode = mode;
		if (application.isEditMode(context)) {
			// Must do a Server Call to get pac enabled status. Using context.currentRecord value will be from UI.
			validationProps.oldInactive = !validator.isPacEnabled(context.currentRecord.id);	
		}
	}

	function fieldChanged (context) {	
		if (context.fieldId === constants.FIELD.MX_PACINFO_PASSWORD) {
			context.currentRecord.setValue(constants.FIELD.MX_PACINFO_PASSWORD_BACKEND, context.currentRecord.getValue(constants.FIELD.MX_PACINFO_PASSWORD));
		}
	}

	function saveRecord (context) {
		var currentRecord = context.currentRecord;
		validationProps.inactive = !currentRecord.getValue(constants.FIELD.MX_PACINFO_ENABLE);
		validationProps.iAgree = currentRecord.getValue(constants.FIELD.MX_PACINFO_I_AGREE);
		var validationResult = validator.validate(validationProps);
		if (validationResult.result) {
			return true;
		}
		if (banner) {
			banner.hide();
		}
		banner = uiMessage.create({
			title: validationResult.errorName,
			message: validationResult.errorMessage,
			type: uiMessage.Type.ERROR,
		});
		banner.show();

		return false;
	}

	return {
		pageInit: pageInit,
		fieldChanged : fieldChanged,
		saveRecord: saveRecord,	
	};
});
