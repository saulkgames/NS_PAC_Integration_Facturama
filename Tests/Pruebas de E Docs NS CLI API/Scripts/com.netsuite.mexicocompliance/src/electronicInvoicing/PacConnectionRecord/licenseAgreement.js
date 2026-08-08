/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * This module sets text of 'IMPORTANT' field. In order to make the content of
 * this field translatable, the field must be filled on UE on BeforeLoad.
 * See PSGLBA-2213.
 */
define([
	'./../../common/application',
	'./../../common/constants',
	'./../../translations/translator',
], function (
	application,
	constants,
	translator
) {
	'use strict';
	/**
	 * Set text of 'IMPORTANT' field.
	 * @param context
	 */
	function setValueOfImportantField (context) {
		var record = application.getRecord(context);
		record.setValue({
			fieldId: constants.FIELD.MX_PACINFO_IMPORTANT,
			value: translator.PAC_LICENSE_AGREEMENT(),
			ignoreFieldChange: true,
		});
	}

	return {
		setValueOfImportantField: setValueOfImportantField,
	};
});
