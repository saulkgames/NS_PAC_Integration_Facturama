/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 *
 * Módulo: Traduce las respuestas HTTP del PAC a los estados estándar de NetSuite (eDocStatus).
 */
define([], function() {
    'use strict';

    var EDOC_STATUS = {
        CERTIFIED: '3',
        CERT_ERROR: '4',
        DATA_ERROR: '21'
    };

    // Nuevos códigos del PAC se agregan aquí sin tocar la lógica de análisis.
    var ERROR_MAP = {
        400: { status: EDOC_STATUS.DATA_ERROR, msg: 'PAC - 400 Bad Request: Parámetros incompletos o inválidos.' },
        401: { status: EDOC_STATUS.CERT_ERROR, msg: 'PAC - 401 Unauthorized: Credenciales incorrectas o caducadas.' },
        403: { status: EDOC_STATUS.CERT_ERROR, msg: 'PAC - 403 Forbidden: Permisos insuficientes.' },
        404: { status: EDOC_STATUS.CERT_ERROR, msg: 'PAC - 404 Not Found: Recurso no encontrado.' },
        500: { status: EDOC_STATUS.CERT_ERROR, msg: 'PAC - 500 Internal Server Error: Error interno en Facturama.' },
        503: { status: EDOC_STATUS.CERT_ERROR, msg: 'PAC - 503 Service Unavailable: Facturama en mantenimiento.' }
    };

    /**
     * Evalúa la respuesta HTTP del PAC y la traduce a los estados estándar de NetSuite.
     * @param {number|string} httpCode - Código de estado HTTP devuelto por el PAC.
     * @param {Object|string|null} responseBody - Cuerpo de la respuesta entregado por el PAC.
     * @returns {Object} Objeto con success, eDocStatus (código para NetSuite) y details (mensaje).
     */
    function analyzeResponse(httpCode, responseBody) {
        // Se acepta la respuesta si trae un UUID válido, aun si el código HTTP no es de éxito
        var hasValidUUID = !!(responseBody && 
                              responseBody.Complement && 
                              responseBody.Complement.TaxStamp && 
                              responseBody.Complement.TaxStamp.Uuid);

        if (httpCode === 200 || httpCode === 201 || httpCode === 208 || hasValidUUID) {
            return {
                success: true,
                eDocStatus: EDOC_STATUS.CERTIFIED,
                details: httpCode === 208 
                    ? 'Documento recuperado exitosamente del PAC (208 Already Reported)'
                    : 'Documento electrónico correctamente certificado'
            };
        }

        var errorDetail = _extractFacturamaError(responseBody);
        
        // Fallback seguro si el código HTTP no está en el mapa
        var mappedError = ERROR_MAP[httpCode] || { 
            status: EDOC_STATUS.CERT_ERROR, 
            msg: 'PAC - Error no documentado (' + httpCode + ')' 
        };

        return {
            success: false,
            eDocStatus: mappedError.status,
            details: mappedError.msg + ' Detalles: ' + errorDetail
        };
    }

    /**
     * Extrae de forma segura el mensaje de error del payload de Facturama.
     * @private
     * @param {Object|string|null} responseBody - Cuerpo de la respuesta con el detalle del error.
     * @returns {string} Mensaje de error extraído o un mensaje genérico de respaldo.
     */
    function _extractFacturamaError(responseBody) {
        // OJO: typeof null === 'object'; se valida explícitamente !== null.
        if (responseBody !== null && typeof responseBody === 'object') {
            var msg = responseBody.Message || responseBody.message || '';
            var model = responseBody.ModelState || responseBody.modelState || '';
            
            var modelString = '';
            if (model) {
                try {
                    modelString = typeof model === 'string' ? model : JSON.stringify(model);
                } catch (e) {
                    modelString = '[Error al serializar ModelState]';
                }
            }
            
            var combined = msg + (modelString ? ' | ' + modelString : '');
            
            if (combined) {
                return combined;
            }
            
            // Respaldo si el objeto no trae las propiedades esperadas
            try {
                return JSON.stringify(responseBody);
            } catch (e) {
                return '[Objeto de error no parseable]';
            }
        }
        
        return String(responseBody || 'Sin detalle adicional');
    }

    return { analyzeResponse: analyzeResponse };
});
