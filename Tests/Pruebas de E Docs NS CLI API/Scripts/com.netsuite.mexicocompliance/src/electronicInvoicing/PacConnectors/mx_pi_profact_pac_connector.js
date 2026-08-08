/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 */

define([
	'./lib/pacSender',
	'./profact/signedxml-req/responseParser',
	'./profact/uuid-req/responseParser',
], function (
	pacSender,
	sendXmlResponseParser,
	signedXmlByUUIDResponseParser
) {
	'use strict';

  
	function sendXMLForSigningSoapTemplate (data) {
		return (
			'<?xml version = "1.0" encoding = "utf-8"?> <soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd = "http://www.w3.org/2001/XMLSchema" xmlns:soap = "http://schemas.xmlsoap.org/soap/envelope/">' 
      +'<soap:Body> <TimbraCFDI xmlns="http://tempuri.org/">'
      +'<usuarioIntegrador>'+data.username+'</usuarioIntegrador>'
       +'<xmlComprobanteBase64>'+data.templateXml+'</xmlComprobanteBase64>'
        +'<idComprobante>'+data.txnId+'</idComprobante>'
        +'</TimbraCFDI> </soap:Body> </soap:Envelope>'
		);
	}

	function getSignedXmlByUUIDSoapTemplate (data) {
		return (
			'<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">' 
      +'<soap:Body> <ObtieneCFDI xmlns="http://tempuri.org/">'
      +'<usuarioIntegrador>'+data.username+'</usuarioIntegrador>'
       +'<rfcEmisor>'+data.rfc+'</rfcEmisor>'
        +'<folioUUID>'+data.uuid+'</folioUUID>'
        +'</ObtieneCFDI> </soap:Body> </soap:Envelope>'
		);
	}

	function getSignedXmlByUUID (props) {
		var responseWrapperObj = pacSender.send(
			props,
			getSignedXmlByUUIDSoapTemplate,
			signedXmlByUUIDResponseParser
		);
		return responseWrapperObj;
	}

	function sendXMLForSigning (props) {
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
		sendXMLForSigning : sendXMLForSigning,
		isAsync : isAsync,
	};
});
