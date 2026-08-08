/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([
	'N/xml','./util',
], function (xml,util) {
	'use strict';

	var parse = function (xmlstr) {
        

		var xmlDocument = xml.Parser.fromString({
			text : xmlstr,
		});
		var anyTypeNodes = xml.XPath.select({
			node : xmlDocument,
			xpath : '/soap:Envelope/soap:Body/*[namespace-uri()=\'http://tempuri.org/\']/*[namespace-uri()=\'http://tempuri.org/\']/*[namespace-uri()=\'http://tempuri.org/\']', 
		});
        
		var textValues = [];
		anyTypeNodes.map(function (anyTypeNode) {
			textValues.push(anyTypeNode.textContent);
		});       
		var pacResponseObj = util.createPacResponseObject(textValues);
		log.debug('ProFact PAC Response Object',pacResponseObj);
		return pacResponseObj;
	};
    

	return {
		parse : parse,
	};
});