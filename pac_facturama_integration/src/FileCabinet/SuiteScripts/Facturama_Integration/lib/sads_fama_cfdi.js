/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo: Constructor de Campos Fiscales
 */
define(['N/encode'], function(encode) {
    'use strict';

    function buildExtraFields(originalPayload, facturamaData, xmlFileId, cfdiId, xmlContent) {
        var fields = {
            'custbody_sads_fama_cfdi_resp_id': cfdiId,
            'custbody_psg_ei_certified_edoc': xmlFileId
        };

        if (facturamaData && facturamaData.Complement && facturamaData.Complement.TaxStamp) {
            var taxStamp = facturamaData.Complement.TaxStamp;
            
            fields['custbody_mx_cfdi_uuid'] = taxStamp.Uuid;
            fields['custbody_mx_cfdi_certify_timestamp'] = taxStamp.Date; 
            fields['custbody_mx_cfdi_sat_serial'] = taxStamp.SatCertNumber;
            fields['custbody_mx_cfdi_sat_signature'] = taxStamp.SatSign;
            fields['custbody_mx_cfdi_issuer_signature'] = taxStamp.CfdiSign;
            fields['custbody_mx_cfdi_signature'] = taxStamp.CfdiSign; 

            if (facturamaData.OriginalString) fields['custbody_mx_cfdi_cadena_original'] = facturamaData.OriginalString;

            if (originalPayload.Issuer && originalPayload.Receiver) {
                var last8Sello = taxStamp.CfdiSign.substring(taxStamp.CfdiSign.length - 8);
                var qrUrl = 'https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=' + 
                            taxStamp.Uuid + '&re=' + originalPayload.Issuer.Rfc + 
                            '&rr=' + originalPayload.Receiver.Rfc + 
                            '&tt=' + originalPayload.Total + '&fe=' + last8Sello;
                fields['custbody_mx_cfdi_qr_code'] = qrUrl;
            }

            if (originalPayload.Folio) fields['custbody_mx_cfdi_folio'] = originalPayload.Folio;
            if (originalPayload.Serie) fields['custbody_mx_cfdi_serie'] = originalPayload.Serie;
            
            if (originalPayload.Date) {
                try {
                    var parts = originalPayload.Date.split('T');
                    var dateParts = parts[0].split('-'); 
                    var timeParts = parts[1].split(':'); 
                    fields['custbody_mx_cfdi_issue_datetime'] = new Date(dateParts[0], parseInt(dateParts[1], 10) - 1, dateParts[2], timeParts[0], timeParts[1], timeParts[2]);
                } catch (e) {}
            }
        }

        if (facturamaData && facturamaData.Issuer && facturamaData.Issuer.SerialNumber) {
            fields['custbody_mx_cfdi_issuer_serial'] = facturamaData.Issuer.SerialNumber;
        } else if (xmlContent) {
            try {
                var xmlString = encode.convert({ string: xmlContent, inputEncoding: encode.Encoding.BASE_64, outputEncoding: encode.Encoding.UTF_8 });
                var match = xmlString.match(/NoCertificado="([0-9]{20})"/);
                if (match && match[1]) fields['custbody_mx_cfdi_issuer_serial'] = match[1];
            } catch (e) {}
        }

        return fields;
    }

    return { buildExtraFields: buildExtraFields };
});