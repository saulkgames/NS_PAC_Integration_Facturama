/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo 1: AuthHeaders & PAC Config
 */
define(['N/search', 'N/encode'], function(search, encode) {
    'use strict';

    function get(subsidiaryId) {
        var configSearch = search.create({
            type: 'customrecord_sads_fama_config',
            filters: [['custrecord_sads_fama_sub', 'anyof', subsidiaryId]],
            columns: [
                'custrecord_sads_fama_user', 
                'custrecord_sads_fama_pass', 
                'custrecord_sads_fama_url_api', 
                'custrecord_sads_fama_url_api_getxml'
            ]
        });
        
        var resultSet = configSearch.run().getRange({ start: 0, end: 1 });
        if (!resultSet || resultSet.length === 0) {
            throw new Error('Configuración no encontrada para la subsidiaria: ' + subsidiaryId);
        }

        return {
            user: resultSet[0].getValue('custrecord_sads_fama_user'),
            pass: resultSet[0].getValue('custrecord_sads_fama_pass'),
            apiPostUrl: resultSet[0].getValue('custrecord_sads_fama_url_api'),
            apiGetUrl: resultSet[0].getValue('custrecord_sads_fama_url_api_getxml')
        };
    }

    function getAuthHeaders(user, pass) {
        var base64Auth = encode.convert({
            string: user + ':' + pass,
            inputEncoding: encode.Encoding.UTF_8,
            outputEncoding: encode.Encoding.BASE_64
        });
        
        return {
            'Authorization': 'Basic ' + base64Auth,
            'Content-Type': 'application/json'
        };
    }

    return {
        get: get,
        getAuthHeaders: getAuthHeaders
    };
});