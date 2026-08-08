/*
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([
	'N/runtime',
	'./../../common/sharedModuleFinder',
	'./../sharedmodules/manageEPTemplates',
	'./../../l10n/recoverabilitySuitlet/l10nRecordUpdator',
	'./../../translations/translator',
	'./../../common/constants',
], function (runtime, sharedModuleFinder, manageEPTemplates, l10nUpdator, translator, constants) {
	'use strict';

	function createTemplates (fileIds, l10ComponentIds) {

		var upsertResult = null;
		var isL10CompInternalId = l10ComponentIds && l10ComponentIds[0];
		var bundleIds = runtime.getCurrentScript().bundleIds;

		fileIds.forEach(function (templateFileId, index) {			
			var submitValues = {};
			manageEPTemplates.onAvailable(function (err, api) {
				if (err) {
					log.error('Install Electronic Payments Template', 'Find Module Error');
					submitValues[constants.FIELD.MX_L10N_STATUS] = constants.MX_L10N_INSTALL_STATUS.SUITE_APP_UNAVAIALBALE;
					submitValues[constants.FIELD.MX_L10N_DETAILS] = translator.RECOVERABILITY_NO_SHAREDMODULE();

					l10nUpdator.update(
						isL10CompInternalId ? l10ComponentIds[index] : fileIds[index],
						submitValues,
						isL10CompInternalId
					);
					return;
				}

				var templateCreateRequest = {
					fileId: templateFileId,
					bundleId: bundleIds && bundleIds.length > 0 ? bundleIds[0] + '' : 'NO_BUNDLEID',
					bundleName: constants.OTHER.MEXICO_COMPLIANCE_BUNDLE_NAME,
					appId: 'mexicocompliance',
				};

				log.debug('upsertTemplate EP api request params', templateCreateRequest);
				upsertResult = api.upsertTemplate(templateCreateRequest);
				log.debug('upsertTemplate EP api result', JSON.stringify(upsertResult));

				submitValues[constants.FIELD.MX_L10N_STATUS] = upsertResult.result === 1 ? constants.MX_L10N_INSTALL_STATUS.INSTALLED : constants.MX_L10N_INSTALL_STATUS.INSTALLATION_FAILED;
				submitValues[constants.FIELD.MX_L10N_DETAILS] = upsertResult.result === 1 ? '' : upsertResult.message;

				l10nUpdator.update(
					isL10CompInternalId ? l10ComponentIds[index] : templateFileId,
					submitValues,
					isL10CompInternalId
				);				
			});
		});
		return upsertResult;		
	}

	function install () {
		var classifiedFileIds = sharedModuleFinder.getEPClassfiedInstallationFileIds();
		this.createTemplates(classifiedFileIds.templateFileIds);
	}

	return {
		install: install,
		createTemplates: createTemplates,
	};
});