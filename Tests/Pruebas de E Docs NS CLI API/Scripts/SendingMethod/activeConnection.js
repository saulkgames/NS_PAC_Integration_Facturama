/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
	'./../lib/commonDataProvider',
	'./../../translations/translator',
], function (commonDataProvider, translator) {
	'use strict';

	function get (subsidiaryId) {
		var activePACs = commonDataProvider.getActivePacConnections(subsidiaryId);

		if (activePACs.length === 0) {
			return translator.ERROR_EI_AUDIT_TRAIL_NO_PAC();
		}

		if (activePACs[0].pdfLocaleId) {
			activePACs[0].pdfLocaleIsoCode = commonDataProvider.getPacPdfISOCode(activePACs[0].pdfLocaleId);
		}

		return activePACs[0];
	}

	return {
		get: get,
	};
});
