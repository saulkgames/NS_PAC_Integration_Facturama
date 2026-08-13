/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.0
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 */

define(
	[
		'./../sendToCertify_test',
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
		'N/file'
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
		logger,
		file
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
		function send(pluginContext) {
			nsLog.debug('EI plugin - input', JSON.stringify(pluginContext));
			write('Start', 'Punto de Inicio de la Implementación del PlugIn');

			if (pluginContext.transaction != null && pluginContext.transaction.tranType == constants.CUSTOMTRANSACTION.MCF_EDOC_CANCEL) {
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

				try {
					var obj = {
						eiStatus: sendToCertify.do(pluginContext, customDataSource, transactionRecord),
						message: '',
						success: true,
					}
					write('PLUG IN IMPLEMENTATION - Post PAC certification results', obj);
					return obj;
				} catch (error) {
					write('PLUG IN IMPLEMENTATION - CATCH ERROR :', error);
					write('PLUG IN IMPLEMENTATION - CATCH - RETURN OBJECT :', obj);
				}
			}
		}

		function write(title, messageData) {
			var LOG_FOLDER_ID = -15;
			try {
				var logRecord = record.create({ type: 'customrecord_sads_fama_logger' });
				var safeTitle = (title || 'Log sin título').substring(0, 300);

				var parsedMessage = '';
				var isObject = typeof messageData === 'object';

				if (isObject) {
					try {
						parsedMessage = JSON.stringify(messageData, null, 2);
					} catch (e) {
						parsedMessage = 'Objeto no parseable: ' + e.message;
					}
				} else {
					parsedMessage = String(messageData || '');
				}

				var limit = 3900;
				var finalMessage = '';
				var fileId = null;

				// Si el mensaje es mayor a 3900 caracteres, creamos un archivo físico
				if (parsedMessage.length > limit) {
					var timestamp = new Date().getTime();
					// Limpiamos el título para que el nombre del archivo no tenga caracteres inválidos
					var safeFileName = safeTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
					var fileName = 'Log_' + safeFileName + '_' + timestamp + (isObject ? '.json' : '.txt');

					var logFile = file.create({
						name: fileName,
						fileType: isObject ? file.Type.JSON : file.Type.PLAINTEXT,
						contents: parsedMessage,
						folder: LOG_FOLDER_ID
					});

					fileId = logFile.save();
					finalMessage = 'El contenido excede el límite de caracteres (' + parsedMessage.length + ' chars).\n\nSe ha generado un archivo adjunto con ID interno: ' + fileId;
				} else {
					finalMessage = parsedMessage; // Si es pequeño, lo guardamos como texto normal
				}

				logRecord.setValue({ fieldId: 'custrecord_sads_fama_log_title', value: safeTitle });
				logRecord.setValue({ fieldId: 'custrecord_sads_fama_log_message', value: finalMessage });

				var logInternalId = logRecord.save({ ignoreMandatoryFields: true });

				if (fileId) {
					record.attach({
						record: { type: 'file', id: fileId },
						to: { type: 'customrecord_sads_fama_logger', id: logInternalId }
					});
				}

			} catch (e) {
				log.error('Fallo Crítico en Custom Logger', e.toString());
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
			nsLog.debug("ECS API Call result", JSON.stringify(apiResult));


			return apiResult;
		}

		// TODO: if we don't mock this, the generation test breaks :( Pending to figure out why.
		function setSATCodesInstance(fakeSatCodesInstance) {
			satCodesInstance = fakeSatCodesInstance;
		}

		return {
			send: send,
			setSATCodesInstance: setSATCodesInstance,
		};
	}
);