/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 */

define(
	[
		'./../sendToCertify',
		'./../../common/sharedModuleFinder',
		'./../templateGenerationHook/cfdi',
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
		'./../templateGenerationHook/cancellation',
		'./../../latamEDocumentCertification/lecApi',
		'N/log',
		'N/search',
		'N/record',
		'N/format',
		'N/runtime',
		'N/config',
		'N/query',
		'./../../common/constants',
		'./../../common/logger',
	],
	function (
		sendToCertify,
		sharedModuleFinder,
		cfdi,
		CustomDataSource,
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
		cancellation,
		lecApi,
		nsLog,
		nsSearch,
		nsRecord,
		nsFormat,
		nsRuntime,
		nsConfig,
		nsQuery,
		constants,
		logger
	) {
		var satCodesInstance;

		/**
		 * send - This function is the entry point of our plugin script
		 * @param {Object} plugInContext
		 * @param {String} plugInContext.scriptId
		 * @param {String} plugInContext.sendMethodId
		 * @param {String} plugInContext.eInvoiceContent
		 * @param {Object} plugInContext.customer
		 * @param {String} plugInContext.customer.id
		 * @param {Array}  plugInContext.customer.recipients
		 * @param {Object} plugInContext.transaction
		 * @param {String} plugInContext.transaction.number
		 * @param {String} plugInContext.transaction.id
		 * @param {String} plugInContext.transaction.poNum
		 * @param {Object} plugInContext.sender
		 * @param {String} plugInContext.sender.id
		 * @param {String} plugInContext.sender.name
		 * @param {String} plugInContext.sender.email
		 * @param {Array} plugInContext.attachmentFileIds
		 *
		 * @returns {Object} result
		 * @returns {Boolean} result.success
		 * @returns {String} result.message
		 */
		function send (pluginContext) {
			nsLog.debug('EI plugin - input', JSON.stringify(pluginContext));

			if(pluginContext.transaction != null && pluginContext.transaction.tranType == constants.CUSTOMTRANSACTION.MCF_EDOC_CANCEL){
				var result = callEcsApiForCancellation(pluginContext);

				return {
					eiStatus: constants.LIST.EI_STATUS.CERT_IN_PROGRESS,
					message: result.message,
					success: result.success,
				};
			} else {
				var transactionRecord = nsRecord.load({
					type: pluginContext.transaction.tranType,
					id: pluginContext.transaction.id,
				});

				var cfdiInstance = cfdi.getInstance(nsQuery, nsLog);
				var rfcInstance = rfc.getInstance(nsConfig, nsRecord);
				/* istanbul ignore next */
				satCodesInstance = SATCodes.getInstance(
					cfdiInstance,
					satMappingLookup.getInstance(nsSearch, nsRuntime),
					transactionRecord
				);
				var legacyTaxInstance = legacyTax.getInstance(nsSearch, nsFormat, nsRecord);
				var whTaxInstance = whTax.getInstance(nsQuery, nsFormat, nsLog);
				var commonXmlGeneratorInstance = CommonXmlGenerator.getInstance(
					cfdiInstance,
					customItems.getInstance(legacyTaxInstance, suiteTax.getInstance(nsQuery), whTaxInstance),
					nsSearch,
					nsRuntime,
					rfcInstance,
					satCodesInstance,
					sharedModuleFinder,
					summary.getInstance(taxUtils),
					whTaxInstance,
					nsLog,
					nsQuery
				);
				var customDataSource = CustomDataSource.getInstance(
					commonXmlGeneratorInstance,
					CustomerPaymentXmlGenerator.getInstance(
						cfdiInstance,
						rfcInstance,
						satCodesInstance,
						nsRuntime,
						nsSearch,
						nsRecord,
						commonXmlGeneratorInstance,
						nsQuery
					)
				);
				satMappingLookup.clearInstance(); // For Unit Tests
				return {
					eiStatus: sendToCertify.do(pluginContext, customDataSource, transactionRecord),
					message: '',
					success: true,
				};
			}
		}


		function callEcsApiForCancellation(pluginContext) {
			var xmlContent = pluginContext.eInvoiceContent;
			var transactionId = pluginContext.transaction.id;
			var transactionType = pluginContext.transaction.tranType;
			var subsidiary = pluginContext.transaction.subsidiary;
			var eiTemplate = { value: "", text: "" };

			if (pluginContext.eiTemplate == null) {
				var eDocument = cancellation.getInstance(nsQuery, nsLog).getCancellationEdocument(transactionId);

				eiTemplate.value = eDocument.template;
				eiTemplate.text = eDocument.name;
			} else {
				eiTemplate.value = pluginContext.eiTemplate.id;
				eiTemplate.text = pluginContext.eiTemplate.name;
			}

			const apiContext = {
				categoryId: "",
				categoryExternalId: constants.LEC_TYPES.CATEGORY.GOODS,
				eiContent: xmlContent,
				recordId: transactionId,
				recordType: transactionType,
				subsidiaryId: subsidiary,
				eiTemplateId: eiTemplate.value.toString(),
				eiTemplateName: eiTemplate.text.toString()
			};

			const apiResult = lecApi.externalSendDocument(apiContext);
			log.debug("ECS API Call result", JSON.stringify(apiResult));


			return apiResult;
		}

		// TODO: if we don't mock this, the generation test breaks :( Pending to figure out why.
		function setSATCodesInstance (fakeSatCodesInstance) {
			satCodesInstance = fakeSatCodesInstance;
		}

		return {
			send: send,
			setSATCodesInstance: setSATCodesInstance,
		};
	}
);