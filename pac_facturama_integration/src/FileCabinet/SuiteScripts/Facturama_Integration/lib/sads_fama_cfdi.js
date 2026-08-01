/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo 2: Actualización de Campos Nativos (CFDI Fields)
 */
define(['N/record'], function(record) {
    'use strict';

    function updateTransaction(txnId, txnType, payload, facturamaResponse, xmlFileId, cfdiId) {
        var taxStamp = facturamaResponse.Complement.TaxStamp;
        
        var last8Sello = taxStamp.CfdiSign.substring(taxStamp.CfdiSign.length - 8);
        var qrString = 'https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=' + 
                       taxStamp.Uuid + '&re=' + payload.Issuer.Rfc + '&rr=' + payload.Receiver.Rfc + 
                       '&tt=' + payload.Total + '&fe=' + last8Sello;

        var fieldsToUpdate = {
            'custbody_mx_cfdi_uuid': taxStamp.Uuid,
            'custbody_mx_cfdi_certify_timestamp': taxStamp.Date,
            'custbody_mx_cfdi_signature': taxStamp.CfdiSign, 
            'custbody_mx_cfdi_sat_signature': taxStamp.SatSign, 
            'custbody_mx_cfdi_sat_serial': taxStamp.SatCertNumber, 
            'custbody_mx_cfdi_qr_code': qrString,
            'custbody_sads_fama_req_id': cfdiId,
            'custbody_psg_ei_certified_edoc': xmlFileId
        };

        if (facturamaResponse.OriginalString) {
            fieldsToUpdate['custbody_mx_cfdi_cadena_original'] = facturamaResponse.OriginalString;
        }
        if (facturamaResponse.Issuer && facturamaResponse.Issuer.SerialNumber) {
            fieldsToUpdate['custbody_mx_cfdi_issuer_serial'] = facturamaResponse.Issuer.SerialNumber;
        }

        record.submitFields({
            type: txnType,
            id: txnId,
            values: fieldsToUpdate,
            options: { ignoreMandatoryFields: true }
        });
    }

    return {
        updateTransaction: updateTransaction
    };
});