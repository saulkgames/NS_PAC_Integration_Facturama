/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(
	[
		'N/log',
		'../common/scriptContext',
		'./csLogger',
	],
	function (
		log,
		scriptContext,
		csLogger) {
		var self = {
			log: function (exception, logLevel) {
				if (!logLevel) {
					logLevel = 'error';
				}
				try {
					var isCS = scriptContext.getInstance().getScriptType().isCS();
				} catch (ex) {
					log.error('LOGGER', 'ScriptContext not initialized. Could not log: ' + JSON.stringify(exception));
					return;
				}

				if (isCS) {
					csLogger.log(exception, logLevel);
				} else {
					var loggerFactory;
					require(['N/internal/elasticLogger'], function (elasticLogger) {
						loggerFactory = elasticLogger;
					});
					this.logToKibana(exception, loggerFactory, logLevel);
				}

			},

			logToKibana: function (exception, loggerFactory, logLevel) {
				try {
					if (logLevel === 'error') {
						var message = JSON.stringify(exception);
						var logger = loggerFactory.create({'type': loggerFactory.Type.PSG});
						var logEntry = {
							'errorMessage': message,
							'errorCode': 'MEXICO_LOCALIZATION_ERROR',
						};
						var result = logger.error(logEntry);
						log.audit('LOGGER', '[' + message + '] was logged into: ' + logger.toString() + JSON.stringify(logger) + ':');
						log.audit('LOGGER', JSON.stringify(result));
					} else {
						var logger = loggerFactory.create({'type': loggerFactory.Type.PSG});
						var message = JSON.stringify(exception);
						var logEntry = {
							'message': exception.message,
							'operationType': exception.operationType,
							'recordType': exception.recordType,
							'recordId': exception.recordId,
							'featureName': exception.featureName,
							'eDocumentCategory': exception.eDocumentCategory,
							'operationStatus': exception.operationStatus,
							'errorCode': exception.errorCode,
							'errorMessage': exception.errorMessage,
						};
						var result = logger.error(logEntry);
						log.audit('LOGGER', '[' + message + '] was logged as info into: ' + logger.toString() + JSON.stringify(logger) + ':');
						log.audit('LOGGER', JSON.stringify(result));
					}
				} catch (e) {
					log.error('LOGGER', 'Could not log to Kibana: ' + JSON.stringify(e));
					log.error('LOGGER', 'Original error: ' + message);
				}

			},

			logLargeText: function (title, logInput, isError) {
				if(!title) return;
			
				var maxLengthAllowed = 3000;
				var logInputLength = (logInput || '').length;
				var totalLogEntries = Math.floor(logInputLength/maxLengthAllowed) + 1;
			
				for (var stringPart = 1, initialIndex = 0; initialIndex <= logInputLength; stringPart++, initialIndex = initialIndex + maxLengthAllowed) {
					var finalIndex = (initialIndex + maxLengthAllowed > logInputLength ? logInputLength : initialIndex + maxLengthAllowed);
					
					if(isError) {
						log.error(
							title + '(' + stringPart + '/' + totalLogEntries + ')',
							logInput.substring(initialIndex, finalIndex)
						);
					} else {
						log.debug(
							title + '(' + stringPart + '/' + totalLogEntries + ')',
							logInput.substring(initialIndex, finalIndex)
						);
					}
				}
			}
		};
		return {
			log: self.log,
			logToKibana: self.logToKibana,
			logLargeText: self.logLargeText,
			_test_module: self,
		};

	}
);