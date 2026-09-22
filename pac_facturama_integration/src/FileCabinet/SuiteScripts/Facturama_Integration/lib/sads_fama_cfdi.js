/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 *
 * Módulo: Constructor de los campos fiscales del CFDI timbrado.
 */
define(['N/encode', 'N/xml', './sads_fama_logger'], function (encode, xml, logger) {
    'use strict';

    var FIELDS = {
        EDOC_CERTIFIED: 'custbody_psg_ei_certified_edoc',
        UUID: 'custbody_mx_cfdi_uuid',
        CERTIFY_TIMESTAMP: 'custbody_mx_cfdi_certify_timestamp',
        SAT_SERIAL: 'custbody_mx_cfdi_sat_serial',
        SAT_SIGNATURE: 'custbody_mx_cfdi_sat_signature',
        CFDI_SIGNATURE: 'custbody_mx_cfdi_signature',
        ORIGINAL_STRING: 'custbody_mx_cfdi_cadena_original',
        QR_CODE: 'custbody_mx_cfdi_qr_code',
        FOLIO: 'custbody_mx_cfdi_folio',
        SERIE: 'custbody_mx_cfdi_serie',
        ISSUE_DATETIME: 'custbody_mx_cfdi_issue_datetime',
        ISSUER_SERIAL: 'custbody_mx_cfdi_issuer_serial'

    };

    /**
     * Construye el objeto con los campos fiscales del CFDI timbrado para actualizar la transacción.
     * Si ocurre un error, se registra y se devuelve lo que se haya logrado mapear para no
     * interrumpir el flujo del llamador.
     * @param {Object} originalPayload - Payload original (PlugInContext o datos de la transacción).
     * @param {Object} facturamaData - Cuerpo de la respuesta del PAC ya parseado.
     * @param {number} xmlFileId - ID interno del archivo XML guardado en el File Cabinet.
     * @param {number} cfdiId - ID interno de la transacción en el servidor del PAC.
     * @param {string} [xmlContent] - Contenido del XML en Base64 (para extraer el NoCertificado).
     * @returns {Object} Campos fiscales listos para actualizar en la transacción.
     */
    function buildExtraFields(originalPayload, facturamaData, xmlFileId, cfdiId, xmlContent) {
        logger.write('Funcion buildExtraFields en ejecucion', { cfdiId: cfdiId });

        // Se inicializa vacío para poder devolver lo construido si algo falla a mitad del proceso
        var fields = {};

        try {
            fields[FIELDS.EDOC_CERTIFIED] = xmlFileId;

            // Validación defensiva anidada (ES5 no tiene Optional Chaining ?.)
            if (facturamaData && facturamaData.Complement && facturamaData.Complement.TaxStamp) {
                var taxStamp = facturamaData.Complement.TaxStamp;

                fields[FIELDS.UUID] = taxStamp.Uuid;
                fields[FIELDS.CERTIFY_TIMESTAMP] = taxStamp.Date;
                fields[FIELDS.SAT_SERIAL] = taxStamp.SatCertNumber;
                fields[FIELDS.SAT_SIGNATURE] = taxStamp.SatSign;
                fields[FIELDS.CFDI_SIGNATURE] = taxStamp.CfdiSign;

                if (facturamaData.OriginalString) {
                    fields[FIELDS.ORIGINAL_STRING] = facturamaData.OriginalString;
                }

                if (originalPayload && originalPayload.Issuer && originalPayload.Receiver) {
                    var last8Sello = taxStamp.CfdiSign.substring(taxStamp.CfdiSign.length - 8);
                    
                    var qrUrl = 'https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=' +
                        taxStamp.Uuid + '&amp;re=' + originalPayload.Issuer.Rfc +
                        '&amp;rr=' + originalPayload.Receiver.Rfc +
                        '&amp;tt=' + originalPayload.Total + '&amp;fe=' + last8Sello;
                        
                    fields[FIELDS.QR_CODE] = qrUrl;
                }
            }

            if (facturamaData && facturamaData.Issuer && facturamaData.Issuer.SerialNumber) {
                fields[FIELDS.ISSUER_SERIAL] = facturamaData.Issuer.SerialNumber;
            } else if (xmlContent) {
                try {
                    var xmlString = encode.convert({ string: xmlContent, inputEncoding: encode.Encoding.BASE_64, outputEncoding: encode.Encoding.UTF_8 });

                    var xmlDocument = xml.Parser.fromString({ text: xmlString });
                    var comprobanteNode = xmlDocument.getElementsByTagName({ tagName: 'cfdi:Comprobante' })[0];
                    if (comprobanteNode) {
                        fields[FIELDS.ISSUER_SERIAL] = comprobanteNode.getAttribute({ name: 'NoCertificado' });
                    }
                    logger.write('Funcion buildExtraFields en ejecucion, Campos construidos:', fields)
                } catch (xmlError) {
                    logError('Error extrayendo certificado del XML', xmlError, { cfdiId: cfdiId });
                }
            }

            return fields;

        } catch (mainError) {
            logError('CRITICO: Fallo al construir campos extra', mainError, { cfdiId: cfdiId });
            // Se devuelve lo mapeado para no interrumpir el flujo del llamador
            return fields;
        }
    }

    /**
     * Estandariza el registro de errores, soportando errores nativos de JS y de SuiteScript.
     * @private
     * @param {string} customMessage - Mensaje contextual.
     * @param {Error|Object} e - Objeto de error capturado.
     * @param {Object} [contextData] - Datos adicionales para reproducir el fallo.
     * @returns {void}
     */
    function logError(customMessage, e, contextData) {
        var errorDetails = {
            name: e.name || 'UNEXPECTED_ERROR',
            message: e.message || e.toString(),
            stack: 'No stack trace available',
            context: contextData || {}
        };

        if (e.stack) {
            errorDetails.stack = e.stack;
        } else if (typeof e.getStackTrace === 'function') {
            errorDetails.stack = e.getStackTrace().join('\n');
        }

        logger.write('ERROR: ' + customMessage, errorDetails);
    }

    return {
        buildExtraFields: buildExtraFields
    };
});
