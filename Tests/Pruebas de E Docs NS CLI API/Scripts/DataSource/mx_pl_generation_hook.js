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
	'./../templateGenerationHook/cfdi', //Ya lo tengo esta en SendingMethod
	'./../templateGenerationHook/cancellation', //Ya lo tengo esta en SendingMethod
	'./../templateGenerationHook/customDataSource', //Ya lo tengo esta en SendingMethod
	'./../templateGenerationHook/customItems', //Ya lo tengo esta en SendingMethod
	'./../templateGenerationHook/legacyTax', //Ya lo tengo esta en SendingMethod
	'./../templateGenerationHook/rfc', //Ya lo tengo esta en SendingMethod
	'./../templateGenerationHook/SATCodes', //Ya lo tengo esta en SendingMethod
	'./../templateGenerationHook/satMappingLookup', //Ya lo tengo esta en SendingMethod
	'./../templateGenerationHook/suiteTax', //Ya lo tengo esta en SendingMethod
	'./../templateGenerationHook/summary', //Ya lo tengo esta en SendingMethod
	'./../templateGenerationHook/taxutils', //Ya lo tengo esta en SendingMethod 
	'./../templateGenerationHook/withholdingTax', //Ya lo tengo esta en SendingMethod
	'./../templateGenerationHook/xmlGenerators/common', //Ya lo tengo esta en SendingMethod
	'./../templateGenerationHook/xmlGenerators/customerPayment', //Ya lo tengo esta en SendingMethod
	'./../../latamEDocumentCertification/lecApi', //Ya lo tengo esta en SendingMethod
	'./../../common/sharedModuleFinder', //Ya lo tengo esta en SendingMethod
	'./../../common/localeCurrencyMap', 
	'./../../common/logger', //Ya lo tengo esta en SendingMethod
	'./../eiLogger',
	'./../../common/constants'//Ya lo tengo esta en SendingMethod

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
