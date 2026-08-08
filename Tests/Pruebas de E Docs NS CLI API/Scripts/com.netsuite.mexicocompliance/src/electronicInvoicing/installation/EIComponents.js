/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
	'N/runtime',
	'N/log',
	'./../../common/sharedModuleFinder',    
	'./../sharedmodules/manageTemplates',
	'./../sharedmodules/manageSendingMethods',
	'./../../l10n/recoverabilitySuitlet/l10nRecordUpdator',
	'./../../translations/translator',
	'./../../common/constants',
], function (runtime, log, sharedModuleFinder, manageTemplates, manageSendingMethods, l10nUpdator, translator, constants) {
	'use strict';

	function createSendingMethods (fileIds) {

		var bundleIds = runtime.getCurrentScript().bundleIds;
		var sendingMethodCreateRequest;

		fileIds.forEach(function (sendingMethodFileId) {
			manageSendingMethods.onAvailable(function (err, api) {
				if (err) {
					log.error('Install Electronic Invoicing  Sending Methods','Find Module Error');
					return;
				}
				sendingMethodCreateRequest = {
					fileId: sendingMethodFileId,
					bundleId: bundleIds && bundleIds.length > 0? bundleIds[0]+'':'NO_BUNDLEID',
					bundleName: constants.OTHER.MEXICO_COMPLIANCE_BUNDLE_NAME,
				};

				log.debug('upsertSendingMethod EI Sending Method params',sendingMethodCreateRequest);
				var result = api.upsertSendingMethod(sendingMethodCreateRequest);
				log.debug('upsertSendingMethod api result', JSON.stringify(result));
			});
		});       
	}

	function createTemplates (fileIds, l10ComponentIds) {

		var upsertResult = null;
		var isL10CompInternalId = l10ComponentIds && l10ComponentIds[0];
		var bundlePath = sharedModuleFinder.getBundlePathByUUID(constants.SHARED_MODULE.MX_LOCALIZATION);

		fileIds.forEach(function (templateFileId, index) {
			
			var submitValues = {};
			manageTemplates.onAvailable(function (err, api) {
				if (err) {
					log.error('Install Electronic Invoicing Template','Find Module Error');				
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
					bundleId: bundlePath,
					bundleName: constants.OTHER.MEXICO_COMPLIANCE_BUNDLE_NAME,
				};

				log.debug('upsertTemplate EI api request params',templateCreateRequest);
				upsertResult = api.upsertTemplate(templateCreateRequest);
				log.debug('upsertTemplate EI api result', JSON.stringify(upsertResult));

				submitValues[constants.FIELD.MX_L10N_STATUS] = upsertResult.result === 1 ? constants.MX_L10N_INSTALL_STATUS.INSTALLED : constants.MX_L10N_INSTALL_STATUS.INSTALLATION_FAILED;
				submitValues[constants.FIELD.MX_L10N_DETAILS] = upsertResult.result === 1 ? '' : (upsertResult.message + ' ' + upsertResult.errorReason.message);
				
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
		var classifiedFileIds = sharedModuleFinder.getEIClassfiedInstallationFileIds();
		this.createTemplates(classifiedFileIds.templateFileIds);
		this.createSendingMethods(classifiedFileIds.sendingMethodFileIds);
	}

	return {       
		install : install,
		createTemplates :createTemplates,
		createSendingMethods : createSendingMethods,
	};
});