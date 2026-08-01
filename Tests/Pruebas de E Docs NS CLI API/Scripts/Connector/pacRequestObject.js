/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(['N/encode'], function (encode) {
	'use strict';

	function PacRequest (connection, props, soapTemplate) {
		this.templateString = props.templateString;
		this.name = connection.name;
		this.url = connection.url;
		this.soapTemplate = soapTemplate;

		this.createHttpRequest = function () { // TODO: check if request have  templateXml or uuid, not both
			return {
				url: this.url,
				headers: {'Content-Type': 'text/xml'},
				body: soapTemplate({
					templateXml : encode.convert({
						string : props.templateXml || '',
						inputEncoding : encode.Encoding.UTF_8,
						outputEncoding : encode.Encoding.BASE_64,
					}),
					username : connection.username,
					password : connection.password,
					taxId : connection.taxId,
					companyRFC: connection.companyRFC,
					serie : props.serie,
					txnId : props.txnId,
					uuid : props.uuid,
					rfc : props.rfc,
				}),
			};
		};
	}

	return PacRequest;
});
