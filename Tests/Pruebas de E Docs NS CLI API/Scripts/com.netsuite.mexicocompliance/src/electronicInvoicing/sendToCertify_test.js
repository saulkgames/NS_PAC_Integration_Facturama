/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 *@NApiVersion 2.0
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
	'N/record',
	'./eiLogger',
	'N/file'
], function (
	certifier,
	companyRfc,
	pacConnectionInfo,
	constants,
	runtime,
	log,
	record,
	eiLogger,
	file

) {
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
                } catch(e) { 
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

            // Si se creó un archivo, lo adjuntamos nativamente al registro del logger
            // Aparecerá en la subpestaña "Comunicación" > "Archivos" del Custom Record
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

	function sendForCertification(context, customDataSource, transactionRecord) {
		try {
			var bundleIds = runtime.getCurrentScript().bundleIds;
			var userId = runtime.getCurrentUser().id;
			var connection = pacConnectionInfo.get(context.transaction.subsidiary);
	
			if (!connection.pdfLocaleIsoCode) {
				connection.pdfLocaleIsoCode = constants.DEFAULT_PAC_PDF_LOCALE;
			}
	
			connection.companyRFC = companyRfc.getForTransaction(context.transaction.tranType, context.transaction.id);
	
			log.debug('connection pdf locale', connection.pdfLocaleIsoCode);
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
			write('Send to Certify - POST PAC templateCertifier: ',templateCertifier);
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
				write('Send to Certify - CATCH ERROR : Unable to log to Kibana',exception);
				write('Send to Certify - CATCH templateCertifier.finalResult: ', templateCertifier.finalResult);
			}
			return templateCertifier.finalResult;
		} catch (error) {
			write('Send to Certify - CATCH ERROR : Error in sendForCertification', error);
			write('Send to Certify - CATCH templateCertifier: ', templateCertifier);
		}
	}

	return {
		do: sendForCertification,
	};
});
