/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo: Mapeo y Actualización de Campos Nativos
 */
define(['N/record', 'N/encode', './sads_fama_logger'], function (record, encode, logger) {
    'use strict';

    function updateTransaction(txnId, txnType, originalPayload, facturamaData, xmlFileId, cfdiId, xmlContent) {
        var fieldsToUpdate = {
            'custbody_sads_fama_cfdi_resp_id': cfdiId,
            'custbody_psg_ei_certified_edoc': xmlFileId
        };

        if (facturamaData.Complement && facturamaData.Complement.TaxStamp) {
            var taxStamp = facturamaData.Complement.TaxStamp;

            // 1. Mapeo Base
            fieldsToUpdate['custbody_mx_cfdi_uuid'] = taxStamp.Uuid;
            fieldsToUpdate['custbody_mx_cfdi_certify_timestamp'] = taxStamp.Date;
            fieldsToUpdate['custbody_mx_cfdi_sat_serial'] = taxStamp.SatCertNumber;
            fieldsToUpdate['custbody_mx_cfdi_sat_signature'] = taxStamp.SatSign;
            fieldsToUpdate['custbody_mx_cfdi_issuer_signature'] = taxStamp.CfdiSign;
            fieldsToUpdate['custbody_mx_cfdi_signature'] = taxStamp.CfdiSign;

            if (facturamaData.OriginalString) {
                fieldsToUpdate['custbody_mx_cfdi_cadena_original'] = facturamaData.OriginalString;
            }

            // 2. Mapeo Cruzado (Payload Original)
            if (originalPayload.Issuer && originalPayload.Receiver) {
                var last8Sello = taxStamp.CfdiSign.substring(taxStamp.CfdiSign.length - 8);
                var qrUrl = 'https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=' +
                    taxStamp.Uuid + '&re=' + originalPayload.Issuer.Rfc +
                    '&rr=' + originalPayload.Receiver.Rfc +
                    '&tt=' + originalPayload.Total + '&fe=' + last8Sello;

                fieldsToUpdate['custbody_mx_cfdi_qr_code'] = qrUrl;
            }

            if (originalPayload.Folio) fieldsToUpdate['custbody_mx_cfdi_folio'] = originalPayload.Folio;
            if (originalPayload.Serie) fieldsToUpdate['custbody_mx_cfdi_serie'] = originalPayload.Serie;

            // CONVERSIÓN SEGURA DE FECHA 
            if (originalPayload.Date) {
                try {
                    var parts = originalPayload.Date.split('T');
                    var dateParts = parts[0].split('-');
                    var timeParts = parts[1].split(':');

                    var issueDate = new Date(dateParts[0], parseInt(dateParts[1], 10) - 1, dateParts[2], timeParts[0], timeParts[1], timeParts[2]);
                    fieldsToUpdate['custbody_mx_cfdi_issue_datetime'] = issueDate;
                } catch (e) {
                    logger.write('Advertencia CFDI - Fecha Emisión', 'Fallo al parsear Issue Date Time (' + originalPayload.Date + '). Detalle: ' + e.message);
                }
            }
        }

        // 3. Extracción del Número de Serie de CSD (Emisor)
        if (facturamaData.Issuer && facturamaData.Issuer.SerialNumber) {
            fieldsToUpdate['custbody_mx_cfdi_issuer_serial'] = facturamaData.Issuer.SerialNumber;
        }
        else if (xmlContent) {
            try {
                var xmlString = encode.convert({
                    string: xmlContent,
                    inputEncoding: encode.Encoding.BASE_64,
                    outputEncoding: encode.Encoding.UTF_8
                });

                var match = xmlString.match(/NoCertificado="([0-9]{20})"/);
                if (match && match[1]) {
                    fieldsToUpdate['custbody_mx_cfdi_issuer_serial'] = match[1];
                }
            } catch (errBase64) {
                // Logueamos si falla la conversión de Base64
                logger.write('Advertencia CFDI - Decodificación XML', 'Fallo decodificación Base64 del XML, intentando en texto plano. Error: ' + errBase64.message);
                try {
                    var rawMatch = String(xmlContent).match(/NoCertificado="([0-9]{20})"/);
                    if (rawMatch && rawMatch[1]) {
                        fieldsToUpdate['custbody_mx_cfdi_issuer_serial'] = rawMatch[1];
                    }
                } catch (errText) {
                    // Logueamos si también falla la extracción en texto plano
                    logger.write('Error CFDI - Extracción CSD', 'Fallo extracción CSD en texto plano. Error: ' + errText.message);
                }
            }
        }

        // 4. Guardamos todo en la transacción (Protegido con Try/Catch)
        try {
            record.submitFields({
                type: txnType,
                id: txnId,
                values: fieldsToUpdate,
                options: { ignoreMandatoryFields: true }
            });
        } catch (submitErr) {
            // Logueamos los campos exactos que causaron el rechazo
            logger.write('Error Crítico CFDI - submitFields', {
                error: submitErr.message,
                camposIntentados: fieldsToUpdate
            });

            // Extraemos el UUID para protegerlo y mostrarlo en la interfaz
            var uuidSalvado = fieldsToUpdate['custbody_mx_cfdi_uuid'] || 'UUID Desconocido';

            // Lanzamos un error explícito que será visible en el Historial de Auditoría
            throw new Error(
                'ALERTA: El CFDI fue TIMBRADO EXITOSAMENTE en Facturama (UUID: ' + uuidSalvado +
                '), pero ocurrió un error local en NetSuite al intentar guardar los campos de la transacción. ' +
                'No vuelva a timbrar este documento. Contacte a soporte. Detalle NetSuite: ' + submitErr.message
            );
        }

    } return { updateTransaction: updateTransaction };
    
});