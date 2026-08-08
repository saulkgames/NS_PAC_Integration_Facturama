/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(['./../../lib/certifiedXmlParser', 'N/encode'], function (
	certifiedXmlParser,
	encode
) {
	'use strict';
	var self = {
		_attachTimbradoNodeInfo: function (resultNode, data) {
			resultNode.childNodes.map(function (node) {
				switch (node.nodeName) {
					case 'tfdCadenaOriginal':
						data.cfdiCadenaOriginal = node.textContent;
						break;
					case 'cfdQrCode':
						data.cfdiQrCode = node.textContent;
						break;
					case 'tfdSelloDigital':
						data.cfdiDigitalSignature = node.textContent;
						break;
				}
			});
		},

		_attachPayloadProperties: function (resultNode, data) {
			resultNode.childNodes.map(function (node) {
				switch (node.nodeName) {
					case 'timbradoInfo':
						self._attachTimbradoNodeInfo(node, data);
						break;
					case 'xml':
						var certifiedXml = encode.convert({
							string: node.textContent,
							inputEncoding: encode.Encoding.BASE_64,
							outputEncoding: encode.Encoding.UTF_8,
						});
						data.certifiedXml = certifiedXml;
						break;
				}
			});
			certifiedXmlParser.parse(data, data.certifiedXml);
		},

		_extractNodeData: function (resultNode) {
			var data = {
				responseStatus: {},
			};
			resultNode.childNodes.map(function (node) {
				switch (node.nodeName) {
					case 'estatus':
						data.responseStatus.statusCode = node.textContent;
						break;
					case 'mensaje':
						data.responseStatus.message = node.textContent;
						break;
					case 'comprobante':
						self._attachPayloadProperties(node, data);
						break;
				}
			});
			var responseStatus = data.responseStatus;
			if (responseStatus.statusCode !== '200') {
				data.error = {
					type: 'data_error',
					code: responseStatus.statusCode,
					message: responseStatus.message,
				};
			}
			return data;
		},

		createPacResponseObject: function (resultNode) {
			var result = self._extractNodeData(resultNode);
			return result;
		},
	};

	return {
		createPacResponseObject: self.createPacResponseObject,
		_test_module : self,
	};
});
