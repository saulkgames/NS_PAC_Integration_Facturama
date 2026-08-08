/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['./../../lib/certifiedXmlParser'], function (certifiedXmlParser) {
	'use strict';

	var self = {
		_getUUid: function (value) {
			var json;
			var uuid;
			if (!value) {
				return null;
			}
			try {
				json = JSON.parse(value);
				var kvPair;
				for (var itr = 0; itr < json.length; itr++) {
					kvPair = json[itr];
					if (kvPair['Key'] === 'UUID') {
						uuid = kvPair['Value'];
						return uuid;
					}
				}
			} catch (err) {
				return null;
			}
			return null;
		},

		_createProfactResult: function (values, uuidStamped) {
			var obj = {};
			obj.uuidStamped = uuidStamped;
			var uuid = self._getUUid(values[8]);
			if (uuid) {
				log.debug('ProFact UUID Exists: ', uuid);
				obj.cfdiQrCode = values[4];
				obj.cfdiCadenaOriginal = values[5];
				obj.certifiedXml = values[3];
				certifiedXmlParser.parse(obj, obj.certifiedXml);
				// return {error : {type : 'response_timeout'}};
				return obj;
			}
			obj.error = {
				type: 'data_error',
				where: 'pac',
				sat: {
					code: values[1],
					message: values[2] + '\n Detailed: ' + values[8],
				},
				code: values[6],
				message: values[7],
			};
			return obj;
		},

		createPacResponseObject: function (values, uuidStamped) {
			var result = self._createProfactResult(values, uuidStamped);
			return result;
		},
	};

	return {
		createPacResponseObject: self.createPacResponseObject,
		_test_module: self,
	};
});
