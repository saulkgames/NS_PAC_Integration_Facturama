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
			xpath : '/soap:Envelope/soap:Body/ns2:importarResponse/return', 
		});		
		var pacResponseObj = util.createPacResponseObject(resultNode[0]);
		var error = pacResponseObj.error;
		if (error && error.code === '624') {
			pacResponseObj.uuidStamped = pacResponseObj.cfdiUuid;
		}
		return pacResponseObj;
	};
    

	return {
		parse : parse,
	};
});