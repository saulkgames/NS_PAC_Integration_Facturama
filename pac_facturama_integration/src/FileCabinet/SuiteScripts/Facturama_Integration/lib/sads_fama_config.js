/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo: Configuración y Autenticación
 */
define(['N/search', 'N/encode'], function(search, encode) {
    'use strict';

    function get(subsidiaryId) {
        var configSearch = search.create({
            type: 'customrecord_sads_fama_config',
            filters: [
                ['isinactive', 'is', 'F'], 'AND',
                ['custrecord_sads_fama_sub', 'anyof', subsidiaryId]
            ],
            columns: [
                'custrecord_sads_fama_user', 
                'custrecord_sads_fama_pass', 
                'custrecord_sads_fama_url_api', 
                'custrecord_sads_fama_url_api_getxml',
                'custrecord_sads_fama_tmpl_inv',
                'custrecord_sads_fama_tmpl_cs',
                'custrecord_sads_fama_tmpl_cm',
                'custrecord_sads_fama_tmpl_if',
                'custrecord_sads_fama_tmpl_cp'
            ]
        });
        
        var results = configSearch.run().getRange({ start: 0, end: 1 });
        if (results.length === 0) {
            throw new Error('No se encontró configuración de Facturama para subsidiaria: ' + subsidiaryId);
        }

        // Devolvemos el diccionario de plantillas emulando la arquitectura de Oracle.
        // Las llaves deben ser exactas al ID de transacción interno de NetSuite.
        return {
            user: results[0].getValue('custrecord_sads_fama_user'),
            pass: results[0].getValue('custrecord_sads_fama_pass'),
            apiPostUrl: results[0].getValue('custrecord_sads_fama_url_api'),
            apiGetUrl: results[0].getValue('custrecord_sads_fama_url_api_getxml'),
            templates: {
                'invoice': results[0].getValue('custrecord_sads_fama_tmpl_inv'),
                'cashsale': results[0].getValue('custrecord_sads_fama_tmpl_cs'),
                'creditmemo': results[0].getValue('custrecord_sads_fama_tmpl_cm'),
                'itemfulfillment': results[0].getValue('custrecord_sads_fama_tmpl_if'),
                'customerpayment': results[0].getValue('custrecord_sads_fama_tmpl_cp')
            }
        };
    }

    function getAuthHeaders(user, pass) {
        var base64Encoded = encode.convert({
            string: user + ':' + pass,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });
        return {
            'Authorization': 'Basic ' + base64Encoded,
            'Content-Type': 'application/json'
        };
    }

    return { get: get, getAuthHeaders: getAuthHeaders };
});