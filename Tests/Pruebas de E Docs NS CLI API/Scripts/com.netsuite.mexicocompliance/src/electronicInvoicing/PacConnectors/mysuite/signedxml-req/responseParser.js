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
		var resultNode = xml.XPath.select({
			node : xmlDocument,
			xpath : '/soap:Envelope/soap:Body/*[namespace-uri()=\'http://www.fact.com.mx/schema/ws\']', 
		});
			
		var pacResponseObj = util.createPacResponseObject(resultNode[0].childNodes[0]);
		var error = pacResponseObj.error;

		// Code 3109 is already Stamped with UUID (TIMBRE_ALREADY_APPLIED) . 
		if (error && error.code === '3109') {
			pacResponseObj.uuidStamped = 'USE_FOLIO';
		}
		return pacResponseObj;
	};
    

	return {
		parse : parse,
	};
});