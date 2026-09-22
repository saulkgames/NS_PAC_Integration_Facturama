/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 *
 * Módulo: Comunicación HTTP con la API de Facturama (PAC).
 */
define(['N/https', './sads_fama_logger'], function (https, logger) {
    'use strict';

    /**
     * Estandariza el registro de errores HTTP delegando al logger central.
     * @private
     * @param {string} customMessage - Contexto de dónde ocurrió el fallo.
     * @param {Error|Object} e - Objeto de error nativo de JS o de SuiteScript.
     * @param {Object} [contextData] - Datos adicionales para la auditoría del error.
     * @returns {void}
     */
    function logHttpError(customMessage, e, contextData) {
        var errorDetails = {
            name: e.name || 'HTTP_NETWORK_ERROR',
            message: e.message || e.toString(),
            stack: 'Stack trace no disponible',
            context: contextData || {}
        };

        if (e.stack) {
            errorDetails.stack = e.stack;
        } else if (typeof e.getStackTrace === 'function') {
            errorDetails.stack = e.getStackTrace().join('\n');
        }

        logger.write('ERROR COMUNICACION: ' + customMessage, errorDetails);
    }

    /**
     * Parsea de forma segura una cadena JSON. Protege contra respuestas del servidor que no son
     * JSON (por ejemplo HTML), devolviendo la cadena original si el parseo falla.
     * @param {string} jsonString - Cadena de texto a convertir.
     * @returns {Object|string|null} Objeto parseado, la cadena original si falla, o null si está vacía.
     */
    function safeParse(jsonString) {
        if (!jsonString) return null;
        try { 
            var parsedObj = JSON.parse(jsonString);
            logger.write('Funcion safeParse Ejecutada, Retorno de Funcion:', jsonString);
            return parsedObj; 
        } catch (e) { 
            return jsonString; 
        } 
    }

    /**
     * Envía el payload de la factura al PAC (Facturama) para su certificación/timbrado.
     * @param {string} url - Endpoint POST de timbrado.
     * @param {Object} headers - Cabeceras HTTP de autorización y tipo de contenido.
     * @param {string} payload - Contenido JSON en cadena que representa el CFDI.
     * @returns {Object} Cuerpo de la respuesta del PAC o un objeto estandarizado de error de red.
     */
    function postTimbrado(url, headers, payload) {
        var resp = null;
        
        try {
            resp = https.post({ url: url, headers: headers, body: payload });
            logger.write('Funcion postTimbrado Ejecutada, Retorno de Funcion:', resp);
            return safeParse(resp.body);
            
        } catch (networkError) {
            // Atrapa timeouts, fallos de DNS o bloqueos de red de NetSuite para que el
            // Response Handler externo reciba un objeto de error en lugar de una excepción.
            logHttpError('Fallo catastrófico de red en postTimbrado', networkError, {
                url: url,
                // NOTA DE SEGURIDAD: nunca registrar el 'payload' completo si contiene credenciales o tokens.
                httpCode: resp ? resp.code : 'Sin conexión',
            });
            
            return {
                error_interno: true,
                mensaje: 'Excepción de red al contactar al PAC',
                detalle: networkError.message
            };
        }
    }

    /**
     * Descarga un archivo (XML o PDF) certificado desde el PAC.
     * @param {string} baseUrl - URL base de descarga; debe contener los tokens '{id}' y '{type}'.
     * @param {Object} headers - Cabeceras HTTP de autorización.
     * @param {string} cfdiId - Identificador único del CFDI en el sistema del PAC.
     * @param {string} type - Tipo de documento a descargar (ej. 'xml', 'pdf').
     * @returns {Object|string|null} Contenido parseado, o null ante un fallo de red absoluto.
     */
    function getFile(baseUrl, headers, cfdiId, type) {
        var resp = null;
        var finalUrl = baseUrl.replace('{id}', cfdiId).replace('{type}', type);

        try {
            resp = https.get({ url: finalUrl, headers: headers });

            if (resp.code !== 200) {
                var getErrorBody = safeParse(resp.body);
                var errorMsg = typeof getErrorBody === 'string' ? getErrorBody : JSON.stringify(getErrorBody);
                // Se lanza para caer en el manejador unificado de errores
                throw new Error('El PAC rechazó la descarga XML. Body: ' + errorMsg);
            }
            
            logger.write('Funcion getFile Ejecutada, Retorno de Funcion:', resp);
            return safeParse(resp.body);

        } catch (error) {
            var contextData = {
                cfdiId: cfdiId,
                url: finalUrl,
                httpCode: resp ? resp.code : 'N/A',
                responseBody: resp && resp.body ? resp.body : 'Sin respuesta del servidor'
            };

            logHttpError('Fallo al descargar XML del PAC', error, contextData);

            // Si hubo respuesta con código distinto de 200, se devuelve el cuerpo para su análisis
            if (resp && resp.body) {
                return safeParse(resp.body);
            }

            // Ante un fallo de red absoluto se devuelve null para no romper flujos posteriores
            return null; 
        }
    }

    return {
        safeParse: safeParse, 
        postTimbrado: postTimbrado,
        getFile: getFile
    };
});
