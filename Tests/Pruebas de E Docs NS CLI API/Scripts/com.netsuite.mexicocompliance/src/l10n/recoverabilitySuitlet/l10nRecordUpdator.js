/*
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
*/
 
define([
	'N/log',
	'N/record',
	'N/search',
	'./../../common/constants',
], function (log, record, search, constants) {
	'use strict';

	function update (id, submitValues, isInternalId) {
		if (isInternalId) {
			updateByInternalId(id,submitValues);
		} else {
			updateByTemplateId(id,submitValues);
		}
	}

	function updateByTemplateId (templateFileId, submitValues) {
		var l10nComponentId = null; 
		var templateSearch = search.create({
			type: constants.RECORD_TYPE.MX_L10N_COMPONENT,
			filters: [
				[constants.FIELD.MX_L10N_FILE, 'is', templateFileId],
			],
		});
		
		templateSearch.run().each(function (result) {
			log.debug('The localization component that needs to be updated is', result.id);
			l10nComponentId = result.id;         
			return true;
		});

		updateByInternalId(l10nComponentId,submitValues);		
	}

	function updateByInternalId (l10nComponentId, submitValues) {
		if (!l10nComponentId) {
			return; // For some reason if there is no l10ncomponent there is nothing to update
		}
		
		record.submitFields({
			type: constants.RECORD_TYPE.MX_L10N_COMPONENT,
			id: l10nComponentId,
			values: submitValues,
		});
	}

	return {       
		update : update,		
	};
});