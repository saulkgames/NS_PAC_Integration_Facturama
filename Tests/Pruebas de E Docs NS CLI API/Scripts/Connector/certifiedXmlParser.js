/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
	'N/xml',
], function (nsxml) {
	'use strict';
    
	function parseCertifiedXml (obj,xmlstr,otherPropsMap) {
		var xmlDocument = nsxml.Parser.fromString({
			text : xmlstr,
		});
		var fetchTimbrado,noCertificadoSat,
			rfcProvCertif,selloCfd,selloSat,cfdiUuid,
			noCertificado;
		var timbreFiscalDigital = nsxml.XPath.select({
			node : xmlDocument,
			xpath : '/cfdi:Comprobante/cfdi:Complemento/tfd:TimbreFiscalDigital', 
		});
		var comprobanteNode = nsxml.XPath.select({
			node : xmlDocument,
			xpath : '/cfdi:Comprobante',
		});
		var comprobanteAttrs = comprobanteNode[0].attributes;

		var fiscalDigitalAttributes = timbreFiscalDigital[0].attributes;
        
		fetchTimbrado = fiscalDigitalAttributes['FechaTimbrado'];
		noCertificadoSat = fiscalDigitalAttributes['NoCertificadoSAT'];
		rfcProvCertif = fiscalDigitalAttributes['RfcProvCertif'];
		selloCfd = fiscalDigitalAttributes['SelloCFD'];
		selloSat = fiscalDigitalAttributes['SelloSAT'];
		cfdiUuid = fiscalDigitalAttributes['UUID'];

		noCertificado = comprobanteAttrs['NoCertificado'];

		obj.dateOfCertification = fetchTimbrado && fetchTimbrado.value;
		obj.noCertificadoSat = noCertificadoSat && noCertificadoSat.value;
		obj.rfcProvCertif = rfcProvCertif && rfcProvCertif.value;
		obj.selloCfd = selloCfd && selloCfd.value;
		obj.selloSat = selloSat && selloSat.value;
		obj.cfdiUuid = cfdiUuid && cfdiUuid.value; 
		obj.noCertificado = noCertificado && noCertificado.value;

		_mapOtherProps(otherPropsMap,xmlDocument,obj);
	}

	function _mapOtherProps (otherPropsMap,xmlDocument,obj) {
		if (!otherPropsMap) {
			return;
		}
		var element;
		var value;
		var attrIdx;
		var nodePath;
		var attr;
		Object.keys(otherPropsMap).map(function (key) {
			value = otherPropsMap[key];
			attrIdx = value.lastIndexOf('@');
			
			if (attrIdx>=0) {
				nodePath = value.substring(0,attrIdx-1);
				attr = value.substring(attrIdx+1);
			} else {
				nodePath = value;
			}
			element = nsxml.XPath.select({
				node : xmlDocument,
				xpath : nodePath, 
			});
			
			if (attrIdx<0) {
				obj[key] = element && element[0]? element[0].textContent : null;
			} else {
				var ele = element && element[0]? element[0].attributes : {};
				obj[key] = ele[attr]? ele[attr].value : null;
			}
		});
	}

	return {
		parse : parseCertifiedXml,
	};
});