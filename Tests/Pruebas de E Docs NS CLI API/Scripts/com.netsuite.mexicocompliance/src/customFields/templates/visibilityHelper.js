/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(
	[
		'../../common/constants',
		'../../plugin/mx_lrc_config',
	],
	function (constants, lrcConfig) {

		const hideFieldsViewMode = function (context) {
			if (context.type === constants.CONTEXT_TYPE.VIEW) {
				lrcConfig.fields.forEach(function (fieldConfig) {
					if (fieldConfig.keepHiddenIn && fieldConfig.keepHiddenIn.includes(context.newRecord.type)) {
						const field = context.form.getField({id: fieldConfig.id});
						if (field) {
							field.updateDisplayType({
								displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
							});
						}
					}
				});
			}
		};

		return {
			hideFieldsViewMode: hideFieldsViewMode,
		};
	}
);
