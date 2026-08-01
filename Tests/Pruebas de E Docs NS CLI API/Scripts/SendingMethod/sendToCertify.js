/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 *@NApiVersion 2.1
 *@NScriptType plugintypeimpl
 *@NModuleScope Public
 */
define([
	'./certifier',
	'./../customFields/companyRfc',
	'./../electronicInvoicing/PacConnectionRecord/activeConnection',
	'./../common/constants',
	'N/runtime',
	'N/log',
	'./eiLogger',
], function (
	certifier,
	companyRfc,
	pacConnectionInfo,
	constants,
	runtime,
	log,
	eiLogger
) {
	function sendForCertification (context, customDataSource, transactionRecord) {
		var bundleIds = runtime.getCurrentScript().bundleIds;
		var userId = runtime.getCurrentUser().id;
		var connection = pacConnectionInfo.get(context.transaction.subsidiary);
		
		if (!connection.pdfLocaleIsoCode) {
			connection.pdfLocaleIsoCode = constants.DEFAULT_PAC_PDF_LOCALE;
		}

		connection.companyRFC = companyRfc.getForTransaction(context.transaction.tranType, context.transaction.id);

		log.debug('connection pdf locale',connection.pdfLocaleIsoCode);
		var templateCertifier = certifier.getInstance(
			{
				bundleName: constants.OTHER.MEXICO_COMPLIANCE_BUNDLE_NAME,
				bundleId: bundleIds && bundleIds.length > 0 ? bundleIds[0] : 'NO_BUNDLEID',
				userId: userId,
				context: context,
				connection: connection,
			},
			customDataSource,
			transactionRecord
		);
		templateCertifier.send();
		log.debug('Post PAC certification results : ', templateCertifier.finalResult);
		try {
			eiLogger.logInfoToKibana(
				'Certification',
				templateCertifier.finalResult.transactionType,
				templateCertifier.finalResult.transactionId,
				templateCertifier.finalResult.eDocStatus,
				templateCertifier.finalResult.details.substring(0, templateCertifier.finalResult.details.indexOf(':')),
				templateCertifier.finalResult.details.substring(templateCertifier.finalResult.details.indexOf(':') + 1),
				transactionRecord);
		} catch (exception) {
			log.error('Error Send to Certify', 'Unable to log to Kibana ' + exception);
		}
		return templateCertifier.finalResult;
	}

	return {
		do: sendForCertification,
	};
});
