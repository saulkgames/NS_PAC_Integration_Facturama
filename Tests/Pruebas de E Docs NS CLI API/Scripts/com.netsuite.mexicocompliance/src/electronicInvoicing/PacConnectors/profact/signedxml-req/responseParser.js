/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['N/xml', './util'], function (xml, util) {
	'use strict';

	var parse = function (xmlstr) {
		var UUID_EXISTED_MSG = 'Este CFDI ya ha sido timbrado con UUID';

		var xmlDocument = xml.Parser.fromString({
			text: xmlstr,
		});
		var anyTypeNodes = xml.XPath.select({
			node: xmlDocument,
			xpath:
        '/soap:Envelope/soap:Body/*[namespace-uri()=\'http://tempuri.org/\']/*[namespace-uri()=\'http://tempuri.org/\']/*[namespace-uri()=\'http://tempuri.org/\']',
		});

		var textValues = [];

		anyTypeNodes.map(function (anyTypeNode) {
			textValues.push(anyTypeNode.textContent);
		});
		var uuidStampedErrIndex = 2;
		var uuidStampedError = textValues[uuidStampedErrIndex] ? textValues[uuidStampedErrIndex] : '';
		var stampedUuid;
		if (uuidStampedError.indexOf(UUID_EXISTED_MSG) >= 0) {
			stampedUuid = uuidStampedError.match(/\S{8}-\S{4}-\S{4}-\S{4}-\S{12}/)[0];
		}
		var pacResponseObj = util.createPacResponseObject(textValues, stampedUuid);
		log.debug('ProFact PAC  Response Object', pacResponseObj);
		return pacResponseObj;
	};

	return {
		parse: parse,
	};
});
