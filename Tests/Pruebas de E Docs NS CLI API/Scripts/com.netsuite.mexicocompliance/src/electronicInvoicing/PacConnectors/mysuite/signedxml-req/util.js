/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([
	'./../../lib/certifiedXmlParser',
	'./../../lib/qrcodeGenerator',
	'N/encode',
	'N/log',
], function (
	certifiedXmlParser,
	qrcode,
	encode,
	log
) {
	'use strict';

	var SAT_URL_LINK = 'https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx';
	var QR_WIDTH = 10;
	var QR_HEIGHT = 10;
	var SELLO_LAST_CH = 8;
	var BASE64_TXT_IN_URL = 'base64,';

	var self = {
		_extractResponseStatus : function (responseStatus, resultNode) {
			var message;
			resultNode.childNodes.map(function (node) {				
				switch (node.nodeName) {
					case 'Code':
						responseStatus.statusCode = node.textContent;
						break;
					case 'Description':
						message = node.textContent;
						break;
					case 'Data':
						message = message +'\n' + node.textContent;
						break;
				}
			});
	
			responseStatus.message = message;
		},
		_extractResponseData : function (data, resultNode) {
			var xpathMap = {
				'cfdiCadenaOriginal' : '/cfdi:Comprobante/cfdi:Addenda/fx:FactDocMX/fx:Identificacion/fx:CadenaOriginal',
				'rfcEmisor' : '/cfdi:Comprobante/cfdi:Emisor/@Rfc',
				'rfcReceptor' : '/cfdi:Comprobante/cfdi:Receptor/@Rfc',
				'voucherTotal' : '/cfdi:Comprobante/@Total',
			};
	
			resultNode.childNodes.map(function (node) {				
				switch (node.nodeName) {
					case 'ResponseData1':						
						if (!node.textContent) {
							break;
						}
						var output = encode.convert({
							string: node.textContent,
							inputEncoding: encode.Encoding.BASE_64,
							outputEncoding: encode.Encoding.UTF_8,
						});
						data.certifiedXml = output;
						certifiedXmlParser.parse(data, output, xpathMap);
						self._addQrCode(data);
						break;
				}
			});
		},
		_generateUrlParamString : function (data) {
			return Object.keys(data).map(function (k) {
				return encodeURIComponent(k) + '=' + encodeURI(data[k]);
			}).join('&');
		},
		_addQrCode: function (data) {
			var url = SAT_URL_LINK+'?' + self._generateUrlParamString({
				Id :data.cfdiUuid,
				re : data.rfcEmisor,
				rr : data.rfcReceptor,
				tt : data.voucherTotal,
				fe : data.selloCfd.substring(data.selloCfd.length - SELLO_LAST_CH),
			});
			var qr = qrcode(0,'M');
			qr.addData(url,'Byte');
			qr.make();
			var genQrCode = qr.createDataURL(QR_WIDTH, QR_HEIGHT);
			var base64TxtIdx = genQrCode.indexOf(BASE64_TXT_IN_URL);
			data.cfdiQrCode = genQrCode.substr(base64TxtIdx+BASE64_TXT_IN_URL.length);
		},
		_extractNodeData : function (resultNode) {
			var responseStatus = {};
			var data = {};
			resultNode.childNodes.map(function (node) {
				log.debug('extract :: node name ', node.nodeName);
				switch (node.nodeName) {
					case 'Response':
						self._extractResponseStatus(responseStatus, node);
						break;
					case 'ResponseData':
						self._extractResponseData(data, node);
						break;
				}
			});
			if (responseStatus.statusCode !== '1') {
				data.error = {
					type: 'data_error',
					code: responseStatus.statusCode,
					message: responseStatus.message,
					where: 'pac',
				};
			}
			return data;
		},
		createPacResponseObject:function (resultNode) {
			var result = self._extractNodeData(resultNode);
			return result;
		},
	};

	return {
		createPacResponseObject: self.createPacResponseObject,
		_test_module : self,
	};
});
