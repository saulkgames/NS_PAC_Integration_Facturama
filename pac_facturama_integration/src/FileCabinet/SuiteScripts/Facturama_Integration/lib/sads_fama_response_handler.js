/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo: Response Handler (Mapeo Oficial y Resiliente)
 */
define([], function() {
    'use strict';

    function analyzeResponse(httpCode, responseBody) {
        var statusObj = {
            success: false,
            eDocStatus: '4', // Por defecto: 4 = Fallo de certificación
            details: ''
        };

        // 1. EVALUACIÓN RESILIENTE: Si hay UUID, es un éxito sin importar el código HTTP.
        // Esto nos blinda contra el 208 Already Reported o futuros códigos no documentados.
        var hasValidUUID = responseBody && 
                           responseBody.Complement && 
                           responseBody.Complement.TaxStamp && 
                           responseBody.Complement.TaxStamp.Uuid;

        if (httpCode === 200 || httpCode === 201 || httpCode === 208 || hasValidUUID) {
            statusObj.success = true;
            statusObj.eDocStatus = '3'; // 3 = Certificado
            statusObj.details = httpCode === 208 
                ? 'Documento recuperado exitosamente del PAC (208 Already Reported)'
                : 'Documento electrónico correctamente certificado';
            return statusObj;
        }

        // 2. EVALUACIÓN DE ERRORES CONOCIDOS
        var errorDetail = _extractFacturamaError(responseBody);

        switch (httpCode) {
            case 400:
                statusObj.eDocStatus = '21'; // 21 = Error de datos de certificación
                statusObj.details = 'PAC - 400 Bad Request: Parámetros incompletos o inválidos. ' + errorDetail;
                break;
            case 401:
                statusObj.eDocStatus = '4'; 
                statusObj.details = 'PAC - 401 Unauthorized: Credenciales incorrectas o caducadas. ' + errorDetail;
                break;
            case 403:
                statusObj.eDocStatus = '4';
                statusObj.details = 'PAC - 403 Forbidden: Permisos insuficientes. ' + errorDetail;
                break;
            case 404:
                statusObj.eDocStatus = '4';
                statusObj.details = 'PAC - 404 Not Found: Recurso no encontrado. ' + errorDetail;
                break;
            case 500:
                statusObj.eDocStatus = '4';
                statusObj.details = 'PAC - 500 Internal Server Error: Error interno en Facturama. ' + errorDetail;
                break;
            case 503:
                statusObj.eDocStatus = '4';
                statusObj.details = 'PAC - 503 Service Unavailable: Facturama en mantenimiento. ' + errorDetail;
                break;
            default:
                statusObj.eDocStatus = '4';
                statusObj.details = 'PAC - Error (' + httpCode + '): ' + errorDetail;
                break;
        }

        return statusObj;
    }

    function _extractFacturamaError(responseBody) {
        if (typeof responseBody === 'object') {
            var msg = responseBody.Message || responseBody.message || '';
            var model = responseBody.ModelState || responseBody.modelState || '';
            var combined = msg + (model ? ' | ' + JSON.stringify(model) : '');
            return combined ? combined : JSON.stringify(responseBody);
        }
        return String(responseBody || 'Sin detalle adicional');
    }

    return { analyzeResponse: analyzeResponse };
});