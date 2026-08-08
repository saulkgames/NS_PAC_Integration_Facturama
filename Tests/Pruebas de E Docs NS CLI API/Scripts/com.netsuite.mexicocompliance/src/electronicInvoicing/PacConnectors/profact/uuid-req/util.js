/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([
	'./../../lib/certifiedXmlParser',
], function (certifiedXmlParser) {
	'use strict';

	function _hadError (value) {
		if (value && value.trim() === '0') {
			return false;
		}
		return true;
	}

	function _createProfactResult (values) {
		var obj = {};
		var isError = _hadError(values[1]);
		if (!isError) {
			obj.cfdiQrCode = values[4];
			obj.cfdiCadenaOriginal = values[5];
			obj.certifiedXml = values[3];
			certifiedXmlParser.parse(obj, obj.certifiedXml);
			return obj;
		}
		obj.error = {
			type : 'data_error',
			where : 'pac',
			sat :  {
				code: values[1],
				message: values[2] + '\n Detailed :' + values[8],
			},
			code: values[6],
			message: values[7],
		};
		return obj;
	}

	function createPacResponseObject (values) {
		var result = _createProfactResult(values);
		return result;
	}

	return {
		createPacResponseObject: createPacResponseObject,
	};
});
