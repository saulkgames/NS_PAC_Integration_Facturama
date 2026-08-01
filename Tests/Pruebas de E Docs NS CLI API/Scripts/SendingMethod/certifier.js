/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([
	'./PacConnectors/mx_pi_factible_pac_connector',
	'./PacConnectors/mx_pi_profact_pac_connector',
	'./PacConnectors/mx_pi_mysuite_pac_connector',
	'./../common/constants',
	'./../common/lib/fileUtils',
	'./../translations/translator',
	'./pdfCreator',
	'N/record',
	'N/format',
	'N/runtime',
	'N/config',
	'N/log',
	'N/file',
], function (
	factibleMain,
	profactMain,
	mysuiteMain,
	constants,
	fileUtils,
	translator,
	pdfCreator,
	nsRecord,
	nsFormat,
	nsRuntime,
	nsConfig,
	log,
	nsFile
) {
	'use strict';

	var SEND_XML_PHASE = 'sendxml';
	var POLL_BY_UUID_PHASE = 'pollbyuuid';

	var RESPONSE_TIMEOUT_ERR = 'response_timeout';

	var RESPONSE_TIMEOUT_REASON = 1;
	var UUID_STAMPED_ERR_REASON = 2;

	var pacPluginsMap = {
		customscript_mx_pi_factible_connector: factibleMain,
		customscript_mx_pi_profact_connector: profactMain,
		customscript_mx_pi_mysuite_connector : mysuiteMain,
	};

	function Certifier (props, customDataSource, transactionRecord) {
		this.reasonToRetry = null;
		this.sendxmlResponseTimeOutRetry = { retryCount: 0, maxRetryCount: 1 };
		this.uuidStampedErrRetry = { retryCount: 0, maxRetryCount: 1 };
		this.userId = props.userId;
		this.bundleId = props.bundleId;
		this.bundleName = props.bundleName;
		this.context = props.context;
		this.connection = props.connection;
		this.finalResult = null;
		this.txnSubmitValues = {};
		this.txnFileName = this.context.transaction.type + '_' + this.context.transaction.id;
		this.customDataSource = customDataSource;
		this.transactionRecord = transactionRecord;
		this.userPrefs = nsConfig.load({type  : nsConfig.Type.USER_PREFERENCES});
		this.pdfLocale = this.connection.pdfLocaleIsoCode;
	}

	Certifier.prototype.send = function () {
		if (!this._checkForValidConnection()) {
			return;
		}
		this.phase = SEND_XML_PHASE;
		this._loadRecordsAndFieldsRequired();
		this._attachIssueDateToSubmitValues();
		var pacResult = this._getPhasePacResult();
		if (this._handleIfStampedUUID(pacResult)) { return; }
		if (this._handleIfResponseTimeout(pacResult)) { return; }
		if (this._handleIfAsync(pacResult)) { return; }

		this._afterCertificationResult(pacResult);
	};

	Certifier.prototype._attachIssueDateToSubmitValues = function () {
		if (this.phase !== SEND_XML_PHASE) {
			return;
		}
		var currentDate = nsFormat.format({
			value: new Date(),
			type: nsFormat.Type.DATETIME,
			timezone: nsRuntime.getCurrentUser().getPreference('TIMEZONE'),
		});
		this.txnSubmitValues[
			constants.FIELD.EI_CFDI_ISSUED_TIMESTAMP
		] = currentDate;
	};

	Certifier.prototype._initAllTxnSubmitValuesEmpty = function () {
		this.txnSubmitValues[constants.FIELD.EI_CFDI_CADENA_ORIGINAL] = null;
		this.txnSubmitValues[constants.FIELD.EI_CFDI_ISSUE_DIGITAL_SIGNATURE] = null;
		this.txnSubmitValues[constants.FIELD.EI_CFDI_QR_CODE] = null;
		this.txnSubmitValues[constants.FIELD.EI_CFDI_SAT_SIGNATURE] = null;
		this.txnSubmitValues[constants.FIELD.MX_SAT_UUID] = null;
		this.txnSubmitValues[constants.FIELD.MX_SAT_CERTIFY_TIME_TIMESTAMP] = null;
		this.txnSubmitValues[constants.FIELD.EI_CFDI_SAT_SERIAL_NUMBER] = null;
		this.txnSubmitValues[constants.FIELD.EI_CFDI_ISSUER_SERIAL_NUMBER] = null;
	};

	Certifier.prototype._hadCompleteData = function () {
		if (this.phase === SEND_XML_PHASE && !this.pacExecutor.isAsync()) {
			return true;
		} else if (this.phase === SEND_XML_PHASE) {
			return false;
		} else if (this.phase === POLL_BY_UUID_PHASE) {
			return true;
		}
		return true;
	};

	Certifier.prototype._attachPacFieldsToSubmitValues = function (pacResult) {
		if (pacResult.error) {
			return;
		}

		if (this._hadCompleteData()) {
			this.txnSubmitValues[constants.FIELD.EI_CFDI_CADENA_ORIGINAL]
				= pacResult.cfdiCadenaOriginal;
			this.txnSubmitValues[constants.FIELD.EI_CFDI_QR_CODE]
				= pacResult.cfdiQrCode;
			this.txnSubmitValues[constants.FIELD.MX_SAT_UUID] = pacResult.cfdiUuid;

			this.txnSubmitValues[constants.FIELD.EI_CFDI_ISSUE_DIGITAL_SIGNATURE]
				= pacResult.selloCfd;
			this.txnSubmitValues[constants.FIELD.EI_CFDI_SAT_SIGNATURE]
				= pacResult.selloSat;
			this.txnSubmitValues[constants.FIELD.MX_SAT_CERTIFY_TIME_TIMESTAMP]
				= pacResult.dateOfCertification;
			this.txnSubmitValues[constants.FIELD.EI_CFDI_SAT_SERIAL_NUMBER]
				= pacResult.noCertificadoSat;
			this.txnSubmitValues[constants.FIELD.EI_CFDI_ISSUER_SERIAL_NUMBER]
				= pacResult.noCertificado;
			this.txnSubmitValues[constants.FIELD.MX_CFDI_SERIE]
				= this._getSerie();
			this.txnSubmitValues[constants.FIELD.MX_CFDI_FOLIO]
				= this._getFolio();
		} else {
			this._initAllTxnSubmitValuesEmpty();
			this.txnSubmitValues[constants.FIELD.MX_SAT_UUID] = pacResult.cfdiUuid;
		}
		log.debug('PAC response Fields to be updated on transaction', this.txnSubmitValues);
	};

	Certifier.prototype._setPdfLocale = function () {
		var oldLang = this.userPrefs.getValue('LANGUAGE');
		if (oldLang !== this.pdfLocale) {
			this.userPrefs.setValue('LANGUAGE', this.pdfLocale);
			this.userPrefs.save();
			this.oldLocale = oldLang;
			// reloading transaction record for have localized labels
			this.transactionRecord = nsRecord.load({
				type: this.context.transaction.tranType,
				id: this.context.transaction.id,
			});
		}
	};

	Certifier.prototype._resetToOldUserLocale = function () {
		if (this.oldLocale) {
			this.userPrefs.setValue('LANGUAGE', this.oldLocale);
			this.userPrefs.save();
		}
	};

	Certifier.prototype._getSerie = function () {
		if (!this.transactionRecord) {
			return;
		}
		return this.transactionRecord.getValue(constants.FIELD.MX_CFDI_SERIE);
	};

	Certifier.prototype._getFolio = function () {
		if (!this.transactionRecord) {
			return;
		}
		return this.transactionRecord.getValue(constants.FIELD.MX_CFDI_FOLIO);
	};

	Certifier.prototype._loadRecordsAndFieldsRequired = function () {
		try {
			this._setPdfLocale();

			// We load the customer record if it is not an Item Fulfillment. If it is, we load it only if it has
			// an actual customer. More information can be found here:
			// https://confluence.corp.netsuite.com/display/PB/ML+-+Tech+Doc#ML-TechDoc-ItemFulfillments
			if (this._shouldLoadTheCustomerRecord()) {
				this.customerRecord = nsRecord.load({
					type: nsRecord.Type.CUSTOMER,
					id: this.context.customer.id,
				});
			}

			this.otherRecords = {};
			this.customData = this.customDataSource.createCustomDataObject({
				transactionRecord: this.transactionRecord,
				pdf: true,
			}, this.otherRecords);

			var labels = translator.PDF_LABELS(this.pdfLocale);
			this.customData.labels = labels;
			this.customData.locale = this.pdfLocale;
			this._resetToOldUserLocale();
		} catch (e) {
			this._resetToOldUserLocale();
			throw e;
		}
	};

	Certifier.prototype._shouldLoadTheCustomerRecord = function () {
		return this.context.transaction.tranType === constants.RECORD_TYPE.ITEM_FULFILLMENT
			? this.context.customer && this.context.customer.id
			: true;
	};

	Certifier.prototype._addSubSidiaryLogoURLIfNecessary = function () {
		if (this._shouldAddSubsidiaryLogoURL()) {
			this.customData['subsidiaryLogoUrl'] = this._getSubidiaryLogoURL();
		}
	};

	Certifier.prototype._shouldAddSubsidiaryLogoURL = function () {
		return nsRuntime.isFeatureInEffect({feature: constants.FEATURE.ONE_WORLD})
			&& !!this.transactionRecord.getValue('subsidiary');
	};

	Certifier.prototype._getSubidiaryLogoURL = function () {
		var subsidiary = nsRecord.load({
			type: nsRecord.Type.SUBSIDIARY,
			id: this.transactionRecord.getValue('subsidiary'),
		});
		var logoId = subsidiary.getValue('logo');
		if (!logoId) {
			return '';
		}

		var logoFile = nsFile.load({id: logoId});
		return logoFile.url;

	};

	Certifier.prototype._generatePdf = function () {
		try {
			this.customData.certData = this.txnSubmitValues;
			this._addSubSidiaryLogoURLIfNecessary();
			log.debug('Custom Data Source for PDF Generation', this.customData.certData);
			return pdfCreator.createPdf(
				{
					transaction: this.transactionRecord,
					customer: this.customerRecord,
					customData: this.customData,
				},
				this.connection,
				this.txnFileName
			);
		} catch (e) {
			log.error('Error Generating the PDF', e);
		}
		return undefined;
	};

	Certifier.prototype._createEIStatusRequest = function (details) {
		return {
			transactionId: this.context.transaction.id,
			transactionType: this.context.transaction.tranType,
			entity: this.context.customer ? this.context.customer.id : undefined,
			eDocStatus: this.eiStatus + '',
			eventType: this.eiStatus + '',
			details: details,
			owner: this.userId,
			isUpdateFields: true,
			extraFieldsForUpdate: this.txnSubmitValues,
			bundleId: this.bundleId,
			bundleName: this.bundleName,
		};
	};

	Certifier.prototype._getDetailedMessageFromPacResult = function (pacResult) {
		var error = pacResult.error;
		if (!error) {
			return translator.EI_AUDIT_TRAIL_CERTIFY_SUCCESS();
		}

		var errorMessage;
		var satErrMsg = 'SAT - ';
		var pacErrMsg = 'PAC - ';

		if (error.sat) {
			satErrMsg
				= satErrMsg
				+ (error.sat.code ? error.sat.code : '')
				+ ':'
				+ (error.sat.message ? error.sat.message : '');
		}
		if (error) {
			pacErrMsg
				= pacErrMsg
				+ (error.code ? error.code : '')
				+ ':'
				+ (error.message ? error.message : '');
		}
		errorMessage = satErrMsg + '\n' + pacErrMsg;
		return errorMessage;
	};

	Certifier.prototype._generateCertifiedXMLFile = function (xmlContent) {
		try {
			return fileUtils.saveXMLFile('Certified E-Documents', {
				name: this.txnFileName + '.xml',
				description: 'Certified XML Document from PAC',
				contents: xmlContent,
			});
		} catch (e) {
			log.error('Error Saving Certified XML File', e);
		}
	};

	Certifier.prototype._checkForValidConnection = function () {
		if (typeof this.connection === 'string') {
			this.eiStatus = constants.LIST.EI_STATUS.CERT_DATA_ERR;
			this.finalResult = this._createEIStatusRequest(this.connection, {});
			return false;
		}
		this.pacExecutor = this.connection.plugin ? pacPluginsMap[this.connection.plugin] : null;
		if (!this.pacExecutor) {
			this.eiStatus = constants.LIST.EI_STATUS.CERT_DATA_ERR;
			this.finalResult = this._createEIStatusRequest(translator.ERROR_EI_AUDIT_NO_PLUGIN_IMPLEMENTATION_FOUND(), {});
			return false;
		}
		return true;
	};

	Certifier.prototype._setEIStatus = function (pacResult) {
		if (this.phase === SEND_XML_PHASE && !this.pacExecutor.isAsync()) {
			if (!pacResult.error) {
				this.eiStatus = constants.LIST.EI_STATUS.READY_FOR_SENDING;
			} else if (pacResult.error && pacResult.error.type === 'data_error') {
				this.eiStatus = constants.LIST.EI_STATUS.CERT_DATA_ERR;
			} else {
				this.eiStatus = constants.LIST.EI_STATUS.CERT_FAILED;
			}
		}
		// Asynchronous Pac and SendXMl Phase
		else if (this.phase === SEND_XML_PHASE) {
			if (!pacResult.error) {
				this.eiStatus = constants.LIST.EI_STATUS.CERT_IN_PROGRESS;
			} else if (pacResult.error && pacResult.error.type === 'data_error') {
				this.eiStatus = constants.LIST.EI_STATUS.CERT_DATA_ERR;
			} else {
				this.eiStatus = constants.LIST.EI_STATUS.CERT_FAILED;
			}
		} else if (this.phase === POLL_BY_UUID_PHASE) {
			if (!pacResult.error) {
				this.eiStatus = constants.LIST.EI_STATUS.READY_FOR_SENDING;
			} else {
				this.eiStatus = constants.LIST.EI_STATUS.CERT_FAILED;
			}
		}
	};

	Certifier.prototype._attachGeneratedFileIdsToSubmitValues = function () {
		this.txnSubmitValues[
			constants.FIELD.EI_CERTIFIED_EDOCUMENT
		] = this.certifiedXmlFileId;
		this.txnSubmitValues[
			constants.FIELD.EI_GENERATED_PDF_EDOC
		] = this.pdfFileId;
		log.debug('Txn Submit Values attach file ids',this.txnSubmitValues);
	};

	Certifier.prototype._generateFiles = function (pacResult) {
		if (pacResult.error) {
			return;
		}
		this.certifiedXmlFileId = this._generateCertifiedXMLFile(pacResult.certifiedXml);
		this.pdfFileId = this._generatePdf();
		this._attachGeneratedFileIdsToSubmitValues();
	};

	Certifier.prototype._retry = function () {
		var canRetry = function (retryParams) {
			return retryParams.retryCount++ < retryParams.maxRetryCount;
		};
		if (
			this.reasonToRetry === RESPONSE_TIMEOUT_REASON
			&& this.phase === SEND_XML_PHASE
		) {
			if (!canRetry(this.sendxmlResponseTimeOutRetry)) { return; }
			this.send();
		} else if (
			this.reasonToRetry === UUID_STAMPED_ERR_REASON
			&& this.phase === SEND_XML_PHASE
		) {
			if (!canRetry(this.uuidStampedErrRetry)) { return; }
			this._poll();
		}
	};

	Certifier.prototype._updateCertificationInProgress = function () {
		this.txnSubmitValues[constants.FIELD.MX_SAT_UUID] = this.uuidInProcess;
		this.txnSubmitValues[constants.FIELD.EI_DOC_STATUS]
			= constants.LIST.EI_STATUS.CERT_IN_PROGRESS;
		nsRecord.submitFields({
			type: this.context.transaction.tranType,
			id: this.context.transaction.id,
			values: this.txnSubmitValues,
		});
	};

	Certifier.prototype._handleIfResponseTimeout = function (pacResult) {
		if (
			!pacResult.error
			|| !(pacResult.error.type === RESPONSE_TIMEOUT_ERR)
		) {
			return false;
		}
		log.error('handling case which is due to response timeout', pacResult);
		this.reasonToRetry = RESPONSE_TIMEOUT_REASON;
		this._retry();
		return true;
	};

	Certifier.prototype._handleIfStampedUUID = function (pacResult) {
		if (!pacResult.uuidStamped) {
			return false;
		}
		this.uuidInProcess = pacResult.uuidStamped;
		this.reasonToRetry = UUID_STAMPED_ERR_REASON;
		this._retry();
		return true;
	};

	Certifier.prototype._handleIfAsync = function (pacResult) {
		if (pacResult.error) { return false; }
		if (!this.pacExecutor.isAsync()) { return false; }
		this.uuidInProcess = pacResult.cfdiUuid;
		this._updateCertificationInProgress(pacResult.cfdiUuid);
		this._poll();
		return true;
	};

	Certifier.prototype._afterCertificationResult = function (pacResult) {
		this._setEIStatus(pacResult);
		this._attachPacFieldsToSubmitValues(pacResult);

		this._generateFiles(pacResult);
		var auditDetails = this._getDetailedMessageFromPacResult(pacResult);
		this.finalResult = this._createEIStatusRequest(
			auditDetails,
			this.txnSubmitValues
		);
	};

	Certifier.prototype._getIdToPoll = function () {
		if (this.uuidInProcess === 'USE_FOLIO') {
			return this._getFolio();
		}

		return this.uuidInProcess;
	};

	Certifier.prototype._getPhaseRequest = function () {
		var context = this.context;
		if (this.phase === SEND_XML_PHASE) {
			return {
				templateXml: context.eInvoiceContent,
				txnId: this._getFolio(),
				pacName: this.pacName,
				connectionInfo: this.connection,
			};
		}
		if (this.phase === POLL_BY_UUID_PHASE) {
			return {
				templateXml: '',
				txnId: this._getFolio(),
				pacName: this.pacName,
				connectionInfo: this.connection,
				uuid: this._getIdToPoll(),
				rfc: this.customData.companyInfo.rfc,
				serie :  this._getSerie(),
			};
		}
	};

	Certifier.prototype._getPhasePacResult = function () {
		var pacResponse;
		if (this.phase === SEND_XML_PHASE) {
			pacResponse = this.pacExecutor.sendXMLForSigning(this._getPhaseRequest());
		} else if (this.phase === POLL_BY_UUID_PHASE) {
			pacResponse = this.pacExecutor.getSignedXmlByUUID(this._getPhaseRequest());
		}
		if (!pacResponse || !pacResponse.pacResult) {
			throw translator.ERROR_EI_AUDIT_TRAIL_NO_PAC_RESPONSE();
		}
		return pacResponse.pacResult;
	};

	Certifier.prototype._poll = function () {
		if (!this._checkForValidConnection()) {
			return;
		}
		this.phase = POLL_BY_UUID_PHASE;
		var pacResult = this._getPhasePacResult();
		this._afterCertificationResult(pacResult);
	};

	function getInstance (props, customDataSource, transactionRecord) {
		return new Certifier(props, customDataSource, transactionRecord);
	}

	return {
		getInstance: getInstance,
	};
});
