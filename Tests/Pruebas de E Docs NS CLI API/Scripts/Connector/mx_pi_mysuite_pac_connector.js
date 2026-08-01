/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.1
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 */

define([
	'./lib/pacSender',
	'./mysuite/signedxml-req/responseParser',
	'N/encode',
	'N/log',
], function (
	pacSender,
	sendXmlResponseParser,
	encode,
	log
) {
	'use strict';

	function sendXMLForSigningSoapTemplate (data) {
		var message = (
			'<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">'
			+ '<soap12:Body><RequestTransaction xmlns="http://www.fact.com.mx/schema/ws">'
			+ '<Requestor>'
			+ data.username
			+ '</Requestor>'
			+ '<Transaction>CONVERT_NATIVE_XML</Transaction>'
			+ '<Country>MX</Country>'
			+ '<Entity>'
			+ data.companyRFC
			+ '</Entity>'
			+ '<UserName>'
			+ 'MX'+'.'+ data.taxId +'.' 
			+ '</UserName>'
			+ '<User>'
			+ data.username
			+ '</User>'
			+ '<Data1>'
			+ data.templateXml
			+ '</Data1>'
			+ '<Data2>XML</Data2><Data3></Data3></RequestTransaction></soap12:Body></soap12:Envelope>'
		);

		log.debug('Data for Wrapper', JSON.stringify(data));
		log.debug('Wrapped message send to PAC', message);

		return message;
	}

	function encodeRetrieveDocumentRequest (data) {
		var templateXml = '<Dictionary name="StoredXmlSelector">'
			+ '<Entry k="Store" v="ISSUED"/><Entry k="IssuerCountryCode" v="MX"/><Entry k="IssuerTaxId" v="'
			+ data.taxId
			+ '"/><Entry k="Batch" v="'
			+ data.serie
			+ '"/><Entry k="Serial" v="'
			+ data.uuid
			+ '"/><Entry k="Formats" v="xml"/><Entry k="Year" v="'
			+ new Date().getFullYear()
			+ '"/></Dictionary>';
		var templateBase64 = encode.convert({
			string: templateXml,
			inputEncoding: encode.Encoding.UTF_8,
			outputEncoding: encode.Encoding.BASE_64,
		});
		log.debug('UUID template xml req', templateXml);
		return templateBase64;
	}

	function getSignedXmlByUUIDSoapTemplate (data) {
		return (
			'<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">'
			+ '<soap12:Body><RequestTransaction xmlns="http://www.fact.com.mx/schema/ws">'
			+ '<Requestor>'
			+ data.username
			+ '</Requestor>'
			+ '<Transaction>RETRIEVE_DOCUMENT</Transaction>'
			+ '<Country>MX</Country>'
			+ '<Entity>'
			+ data.companyRFC
			+ '</Entity>'
			+ '<UserName>'
			+ 'MX'+'.'+ data.taxId +'.'
			+ '</UserName>'
			+ '<User>'
			+ data.username
			+ '</User>'
			+ '<Data1>'
			+ encodeRetrieveDocumentRequest(data)
			+ '</Data1>'
			+ '<Data2>XML</Data2><Data3></Data3></RequestTransaction></soap12:Body></soap12:Envelope>'
		);
	}

	function getSignedXmlByUUID (props) {
		log.debug('getSignedXmlByUUID props', JSON.stringify(props));

		var responseWrapperObj = pacSender.send(
			props,
			getSignedXmlByUUIDSoapTemplate,
			sendXmlResponseParser
		);
		return responseWrapperObj;
	}

	function sendXMLForSigning (props) {
		log.debug('sendXMLForSigning props', JSON.stringify(props));

		var responseWrapperObj = pacSender.send(
			props,
			sendXMLForSigningSoapTemplate,
			sendXmlResponseParser
		);
		return responseWrapperObj;
	}

	function isAsync () {
		return false;
	}
	return {
		getSignedXmlByUUID: getSignedXmlByUUID,
		sendXMLForSigning: sendXMLForSigning,
		isAsync: isAsync,
	};
});
