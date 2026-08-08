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
	'./factible/signedxml-req/responseParser',
	'./factible/uuid-req/responseParser',
], function (
	pacSender,
	getSignedXmlByUUIDResponseParser,
	sendXmlResponseParser
    
) {
	'use strict';
  
	function getSignedXmlByUUIDSoapTemplate (data) {
		'use strict';
		return (
			'<?xml version="1.0" encoding="UTF-8"?> <soap:Envelope xmlns:namesp1="http://facturacion.erp.solucionfactible.com" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' 
        +'<soap:Body> <namesp1:obtenerDatos> '
        + '<usuario xsi:type="xsd:string">'
        + data.username
        + '</usuario>'
        + '<password xsi:type="xsd:string">'
        + data.password
        + '</password>'
        + '<uuid xsi:type="xsd:string">'
        + data.uuid
        + '</uuid>'
        + '</namesp1:obtenerDatos> </soap:Body> </soap:Envelope>'
		);
		
	}
  
	function sendXMLForSigningSoapTemplate (data) {
		var req = (
			'<?xml version="1.0" encoding="UTF-8"?> <soap:Envelope xmlns:namesp1="http://facturacion.erp.solucionfactible.com" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:soapenc="http://schemas.xmlsoap.org/soap/encoding/" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" soap:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">' 
          +'<soap:Body> <namesp1:importar> '
          + '<usuario xsi:type="xsd:string">'
          + data.username
          + '</usuario>'
          + '<password xsi:type="xsd:string">'
          + data.password
          + '</password>'
          + '<archivoConector xsi:type=":base64Binary">'
          + data.templateXml
          + '</archivoConector>'
          + '<nombreArchivo xsi:type="xsd:string">'+data.txnId+'</nombreArchivo>'
          +'</namesp1:importar> </soap:Body> </soap:Envelope>'
		);	
		return req;
	}
  
	function getSignedXmlByUUID (props) {		
		var responseWrapperObj = pacSender.send(
			props,
			getSignedXmlByUUIDSoapTemplate,
			getSignedXmlByUUIDResponseParser
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
		return true;
	}
  
	return {
		getSignedXmlByUUID: getSignedXmlByUUID,
		sendXMLForSigning : sendXMLForSigning,
		isAsync : isAsync,
	};
});
  