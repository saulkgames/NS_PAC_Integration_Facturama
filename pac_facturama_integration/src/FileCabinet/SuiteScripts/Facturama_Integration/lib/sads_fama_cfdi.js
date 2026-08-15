/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo: Constructor de Campos Fiscales
 */
define(['N/encode', 'N/xml', './sads_fama_logger'], function(encode, xml, logger) {
    'use strict';

    // ==========================================
    // 1. CONSTANTES (Evitar Magic Strings - Clean Code)
    // ==========================================
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

    // ==========================================
    // 2. API PÚBLICA (Hexagonal Architecture: Puertos)
    // ==========================================
    function buildExtraFields(originalPayload, facturamaData, xmlFileId, cfdiId, xmlContent) {
        logger.write('Iniciando construccion de campos extra', { cfdiId: cfdiId });
        
        // Inicializamos fields desde el principio. Si algo falla a la mitad, 
        // devolveremos lo que hayamos logrado construir (Cumpliendo tu requerimiento de retorno)
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
                                taxStamp.Uuid + '&re=' + originalPayload.Issuer.Rfc + 
                                '&rr=' + originalPayload.Receiver.Rfc + 
                                '&tt=' + originalPayload.Total + '&fe=' + last8Sello;
                    fields[FIELDS.QR_CODE] = qrUrl;
                }
            }

            if (originalPayload) {
                if (originalPayload.Folio) fields[FIELDS.FOLIO] = originalPayload.Folio;
                if (originalPayload.Serie) fields[FIELDS.SERIE] = originalPayload.Serie;
                
                if (originalPayload.Date) {
                    // Try/Catch aislado para que un fallo en la fecha no destruya el resto de la factura
                    try {
                        var parts = originalPayload.Date.split('T');
                        var dateParts = parts[0].split('-'); 
                        var timeParts = parts[1].split(':'); 
                        fields[FIELDS.ISSUE_DATETIME] = new Date(dateParts[0], parseInt(dateParts[1], 10) - 1, dateParts[2], timeParts[0], timeParts[1], timeParts[2]);
                    } catch (dateError) {
                        logError('Error parseando fecha', dateError, { rawDate: originalPayload.Date, cfdiId: cfdiId });
                    }
                }
            }

            // Extracción del número de certificado
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
                } catch (xmlError) {
                    logError('Error extrayendo certificado del XML', xmlError, { cfdiId: cfdiId });
                }
            }

            return fields;

        } catch (mainError) {
            // Manejador centralizado de la función principal
            logError('CRITICO: Fallo al construir campos extra', mainError, { cfdiId: cfdiId });
            // Devolvemos lo que se haya logrado mapear para no interrumpir el flujo del caller
            return fields; 
        }
    }

    // ==========================================
    // 3. FUNCIONES PRIVADAS (Clean Architecture)
    // ==========================================

    /**
     * Factory Pattern para estandarizar el registro de errores.
     * Analiza si es un error nativo de JS o un SuiteScript Error.
     * @param {string} customMessage - Mensaje contextual
     * @param {Error} e - El objeto de error capturado
     * @param {Object} contextData - Datos adicionales para reproducir el fallo
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
//Camibio de uso de REGEX POR N/XML PARA MANIPULAR DE MEJOR MANERA EL XML Y OBTENER EL NUMERO DE CERTIFICADO DEL EMISOR.
//Agregado un control de retorno seguro y un logger.write para capturar toda la pila de ejecucion, response, mensaje y codigo de error. Esto es para poder capturar errores de comunicación con el PAC y poder analizarlos posteriormente.
//MODULARIZACION DE FUNCIONES PARA MEJORAR LA LECTURA Y MANTENIMIENTO DEL CODIGO.