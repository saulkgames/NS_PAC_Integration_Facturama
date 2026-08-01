/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(['./pacRequestObject', 'N/https', 'N/log'], function (PacRequest, https, log) {
	'use strict';

	var OK_CODE = 200;

	function _handleHttpRequestError (err) {
		var errorObj = {
			type: 'connection_failure',
			where: 'request',
			message: err ? err.message : null,
			code : (err && err.name)? err.name :'CONNECTON_FAILURE',
		};
		var result = {
			type: 'pacresponse',
			pacResult: {
				error: errorObj,
			},
		};
		if (err && err.name === 'SSS_REQUEST_TIME_EXCEEDED') {
			errorObj.type = 'response_timeout';
			errorObj.code = 'RESPONSE_TIMEOUT';
		}
		return result;
	}

	function _handleHttpResponse (httpResponse, responseParser) {
		try {
			switch (httpResponse.code) {
				case OK_CODE:
					var successObj = responseParser.parse(httpResponse.body);
					return {
						type: 'pacresponse',
						pacResult: successObj,
					};
				default:
					return {
						type: 'pacresponse',
						pacResult: {
							error: {
								type: 'request_error',
								where: 'request',
								message: httpResponse.body,
								code: 'HTTP-'+httpResponse.code,
							},
						},
					};
			}
		} catch (err) {
			log.error('Parse Response', err);
			return {
				type: 'pacresponse',
				pacResult: {
					error: {
						type: 'response_parse_error',
						where: 'request',
						message: err ? err.message : null,
						code : 'XML_RESPONSE_PARSE_ERR',
					},
				},
			};
		}
	}

	function send (props, soapTemplate, responseParser) {
		var connectionInfo = props.connectionInfo;
		var reqObj = new PacRequest(connectionInfo, props, soapTemplate);
		var httpRequest = reqObj.createHttpRequest();
		var httpResponse;
		log.debug('http request ::pac',JSON.stringify(httpRequest));
		var d = new Date();
		try {
			httpResponse = https.post(httpRequest);
			log.debug('http response :: pac',JSON.stringify(httpResponse));
		} catch (err) {
			log.error('Error occured in https.post', err);
			return _handleHttpRequestError(err);
		}
		log.debug('Time taken to get PAC response  is '+ (new Date() - d) +' millisec, PAC Response :', JSON.stringify(httpResponse));
		return _handleHttpResponse(httpResponse, responseParser);
	}

	return {
		send: send,
	};
});
