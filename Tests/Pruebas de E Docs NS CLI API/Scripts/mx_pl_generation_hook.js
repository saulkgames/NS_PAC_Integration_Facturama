/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 */
define([
	'N/config',
	'N/format',
	'N/log',
	'N/query',
	'N/record',
	'N/render',
	'N/runtime',
	'N/search',
	'./../templateGenerationHook/cfdi',
	'./../templateGenerationHook/cancellation',
	'./../templateGenerationHook/customDataSource',
	'./../templateGenerationHook/customItems',
	'./../templateGenerationHook/legacyTax',
	'./../templateGenerationHook/rfc',
	'./../templateGenerationHook/SATCodes',
	'./../templateGenerationHook/satMappingLookup',
	'./../templateGenerationHook/suiteTax',
	'./../templateGenerationHook/summary',
	'./../templateGenerationHook/taxutils',
	'./../templateGenerationHook/withholdingTax',
	'./../templateGenerationHook/xmlGenerators/common',
	'./../templateGenerationHook/xmlGenerators/customerPayment',
	'./../../latamEDocumentCertification/lecApi',
	'./../../common/sharedModuleFinder',
	'./../../common/localeCurrencyMap',
	'./../../common/logger',
	'./../eiLogger',
	'./../../common/constants'

], function (
	config,
	format,
	nsLog,
	nsQuery,
	record,
	render,
	runtime,
	search,
	cfdi,
	cancellation,
	customDataSource,
	customItems,
	legacyTax,
	rfc,
	SATCodes,
	satMappingLookup,
	suiteTax,
	summary,
	taxUtils,
	whTax,
	CommonXmlGenerator,
	CustomerPaymentXmlGenerator,
	lecApi,
	sharedModuleFinder,
	localeCurrencyMap,
	logger,
	eiLogger,
	constants
) {
	function inject (obj) {
		var alias = 'custom';
		var cdsToBeInjected = {};

		logger.logLargeText('Entry Point for EI Custom Data Source - Plugin Implementation BEGIN', JSON.stringify(obj), false);

		if(obj.transactionRecord != null && obj.transactionRecord.type == constants.CUSTOMTRANSACTION.MCF_EDOC_CANCEL){
			cdsToBeInjected = createDataSourceForCancellation(obj);
			alias = 'eDocCDS';
		} else {
			var recordsLoaded = {};
			var cfdiInstance = cfdi.getInstance(nsQuery, nsLog);
			var rfcInstance = rfc.getInstance(config, record);
			var satCodesInstance = SATCodes.getInstance(
				cfdiInstance,
				satMappingLookup.getInstance(search, runtime),
				obj.transactionRecord
			);
			var legacyTaxInstance = legacyTax.getInstance(search, format, record);
			var whTaxInstance = whTax.getInstance(nsQuery, format, nsLog);
			var commonXmlGeneratorInstance = CommonXmlGenerator.getInstance(
				cfdiInstance,
				customItems.getInstance(legacyTaxInstance, suiteTax.getInstance(nsQuery), whTaxInstance),
				search,
				runtime,
				rfcInstance,
				satCodesInstance,
				sharedModuleFinder,
				summary.getInstance(taxUtils),
				whTaxInstance,
				nsLog,
				nsQuery
			);
			var cdsToBeInjected = customDataSource.getInstance(
				commonXmlGeneratorInstance,
				CustomerPaymentXmlGenerator.getInstance(
					cfdiInstance,
					rfcInstance,
					satCodesInstance,
					runtime,
					search,
					record,
					commonXmlGeneratorInstance,
					nsQuery
				)
			).createCustomDataObject(obj, recordsLoaded);
		}

		logger.logLargeText('Exit Point for EI Custom Data Source - Plugin Implementation END ', cdsToBeInjected, false);
		try {
			_logInfoToKibana(obj);
		} catch (exception) {
			nsLog.error('Error MX EI Generation', 'Unable to log to Kibana ' + exception);
		}
		cdsToBeInjected.localeCurrencyMap = localeCurrencyMap;
		satMappingLookup.clearInstance(); // for Integration Tests
		return {
			customDataSources: [
				{
					format: render.DataSource.OBJECT,
					alias: alias,
					data: cdsToBeInjected,
				},
			],
		};
	}

	function createDataSourceForCancellation(obj) {
		var cdsBeforeFormatting = cancellation.getInstance(nsQuery, nsLog).getCancellationInfo(obj.transactionId);

		var formattedCds = lecApi.getEDocumentModel({
			subsidiaryId: cdsBeforeFormatting.subsidiary.id,
            categoryId: "",
            categoryExternalId: constants.LEC_TYPES.CATEGORY.GOODS,
            operationTypeId: "",
            operationTypeExternalId: constants.LEC_TYPES.OPERATION_TYPE.CANCEL,
            eDocumentModel: cdsBeforeFormatting
		});

		if (!formattedCds.success) {
			nsLog.error('Error MX EI Generation', 'Unable to execute LEC getEDocumentModel: ' + formattedCds.message);
		}

		return formattedCds.eDocumentModel;
	}

	function _logInfoToKibana (obj) {
		var txnRecord = obj.transactionRecord;
		eiLogger.logInfoToKibana(
			'Generation',
			_getRecordType(txnRecord, obj.pdf),
			txnRecord.getValue('id'),
			'-',
			'-',
			'-',
			txnRecord
		);
	}

	function _getRecordType (txnRecord, isPdf) {
		var recordObj;
		if (isPdf) {
			recordObj = txnRecord;
		} else {
			recordObj = txnRecord.getRecord();
		}
		return recordObj.type;
	}

	return {
		inject: inject,
	};
});
