/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([], function () {
	'use strict';

	var self = {
		_attachPayloadProperties: function (resultNode, data) {
			var responseStatus = {};
			resultNode.childNodes.map(function (node) {
				switch (node.nodeName) {
					case 'uuid':
						data.cfdiUuid = node.textContent;
						break;
					case 'estatus':
						responseStatus.statusCode = node.textContent;
						break;
					case 'mensaje':
						responseStatus.message = node.textContent;
						break;
				}
			});
			if (responseStatus.statusCode !== '200') {
				data.error = {
					type: 'data_error',
					code: responseStatus.statusCode,
					message: responseStatus.message,
				};
			}
		},

		_extractNodeData: function (resultNode) {
			var responseStatus = {};
			var data = {};
			resultNode.childNodes.map(function (node) {
				switch (node.nodeName) {
					case 'estatus':
						responseStatus.statusCode = node.textContent;
						break;
					case 'mensaje':
						responseStatus.message = node.textContent;
						break;
					case 'resultadosCreacion':
						self._attachPayloadProperties(node, data);
						break;
				}
			});
			if (responseStatus.statusCode !== '200') {
				data.error = {
					type: 'data_error',
					code: responseStatus.statusCode,
					message: responseStatus.message,
					where: 'pac',
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
		_test_module: self,
	};
});
