/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo 3: Error Handler y Comunicación API
 */
define(['N/https', 'N/log'], function(https, log) {
    'use strict';

    function _handleError(statusCode, responseBody) {
        var errorMap = {
            400: '400 Bad Request: Los parámetros que enviaste están incompletos o son inválidos.',
            401: '401 Unauthorized: Olvidaste poner tu usuario y contraseña, está caducada, o es incorrecta.',
            403: '403 Forbidden: Entendimos la petición y sabemos quién eres, pero no se supone que estés haciendo esto.',
            404: '404 Not Found: No pudimos encontrar lo que sea que estás solicitando.',
            500: '500 Internal Server Error: Ocurrió un error en nuestro servidor que no vimos venir. Intenta más tarde.',
            503: '503 Service Unavailable: Estamos actualizando el servicio o dando mantenimiento al servidor.'
        };

        var userMessage = errorMap[statusCode] || ('Error HTTP no mapeado: ' + statusCode);
        var detailedError = responseBody ? (' | Detalles Facturama: ' + responseBody) : '';

        log.error('Facturama Error [' + statusCode + ']', userMessage + detailedError);

        return { 
            success: false, 
            message: userMessage + detailedError 
        };
    }

    function postTimbrado(url, headers, payload) {
        var response = https.post({
            url: url,
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (response.code !== 200 && response.code !== 201) {
            return _handleError(response.code, response.body);
        }

        return {
            success: true,
            data: JSON.parse(response.body)
        };
    }

    return {
        postTimbrado: postTimbrado
    };
});