/**
 *    Copyright 2019 NetSuite Inc. User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */

define(
	['N/internal/elasticLogger', '../../common/logger'],
	function (loggerFactory, logger) {
		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} context
		 * @param {ServerRequest} context.request - Encapsulation of the incoming request
		 * @param {ServerResponse} context.response - Encapsulation of the Suitelet response
		 * @Since 2015.2
		 */

		function onRequest (context) {
			if (context.request.method === 'POST') {
				var input = JSON.parse(context.request.body);
				var message = input.message;
				if (!message) {
					message = 'Logger SL. Could not get error message from request body';
				}
				logger.logToKibana(message, loggerFactory, 'error');
			}
		}
		return {
			onRequest: onRequest,
		};
	}
);