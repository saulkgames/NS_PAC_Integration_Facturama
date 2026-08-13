/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo: Comunicación HTTP
 */
define(['N/https'], function(https) {
    'use strict';

    function safeParse(jsonString) {
        try { return JSON.parse(jsonString); } 
        catch (e) { return jsonString; }
    }

    function postTimbrado(url, headers, payload) {
        var resp = https.post({ url: url, headers: headers, body: payload });
        return safeParse(resp.body); // El Response Handler procesará los errores
    }

    function getXml(baseUrl, headers, cfdiId) {
        var finalUrl = baseUrl.replace('{id}', cfdiId);
        var resp = https.get({ url: finalUrl, headers: headers });
        
        if (resp.code !== 200) {
            var getErrorBody = safeParse(resp.body);
            throw new Error('Falló descarga XML (HTTP ' + resp.code + '): ' + JSON.stringify(getErrorBody));
        }
        return safeParse(resp.body);
    }

    return { 
        safeParse: safeParse,
        postTimbrado: postTimbrado, 
        getXml: getXml 
    };
});