/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 *
 * Módulo: Configuración y autenticación del PAC por subsidiaria.
 */
define(['N/search', 'N/encode'], function(search, encode) {
    'use strict';

    var REC_TYPE = 'customrecord_sads_fama_config';
    
    var FLD = {
        SUB: 'custrecord_sads_fama_sub',
        USER: 'custrecord_sads_fama_user',
        PASS: 'custrecord_sads_fama_pass',
        URL_API: 'custrecord_sads_fama_url_api',
        URL_GET: 'custrecord_sads_fama_url_api_getfile',
        TMPL_INV: 'custrecord_sads_fama_tmpl_inv',
        TMPL_CS: 'custrecord_sads_fama_tmpl_cs',
        TMPL_CM: 'custrecord_sads_fama_tmpl_cm',
        TMPL_IF: 'custrecord_sads_fama_tmpl_if',
        TMPL_CP: 'custrecord_sads_fama_tmpl_cp',
        FLD_ID_PDF: 'custrecord_sads_fama_folderid_pdf',
        FLD_ID_XML: 'custrecord_sads_fama_folderid_xml'
    };

    /**
     * Obtiene la configuración de Facturama (Custom Record) para una subsidiaria específica.
     * @param {number|string} subsidiaryId - ID interno de la subsidiaria.
     * @returns {Object} Credenciales, URLs de API, IDs de carpeta y mapeo de plantillas PDF.
     * @throws {Error} Si falta el subsidiaryId, no hay registro activo o faltan datos críticos.
     */
    function get(subsidiaryId) {
        if (!subsidiaryId) {
            throw new Error('SubsidiaryId es obligatorio para obtener la configuración.');
        }

        var configSearch = search.create({
            type: REC_TYPE,
            filters: [
                ['isinactive', 'is', 'F'], 'AND',
                [FLD.SUB, 'anyof', subsidiaryId]
            ],
            columns: [
                FLD.USER, FLD.PASS, FLD.URL_API, FLD.URL_GET,FLD.FLD_ID_PDF, FLD.FLD_ID_XML,
                FLD.TMPL_INV, FLD.TMPL_CS, FLD.TMPL_CM, FLD.TMPL_IF, FLD.TMPL_CP
            ]
        });
        
        var results = configSearch.run().getRange({ start: 0, end: 1 });
        
        if (results.length === 0) {
            throw new Error('No se encontró configuración activa de Facturama para la subsidiaria ID: ' + subsidiaryId);
        }

        var row = results[0];

        var configData = {
            user: row.getValue(FLD.USER),
            pass: row.getValue(FLD.PASS),
            apiPostUrl: row.getValue(FLD.URL_API),
            apiGetUrl: row.getValue(FLD.URL_GET),
            folderIdPdf: row.getValue(FLD.FLD_ID_PDF),
            folderIdXml: row.getValue(FLD.FLD_ID_XML),
            templates: {
                'invoice': row.getValue(FLD.TMPL_INV),
                'cashsale': row.getValue(FLD.TMPL_CS),
                'creditmemo': row.getValue(FLD.TMPL_CM),
                'itemfulfillment': row.getValue(FLD.TMPL_IF),
                'customerpayment': row.getValue(FLD.TMPL_CP)
            }
        };

        _validateCriticalConfig(configData, subsidiaryId);

        return configData;
    }

    /**
     * Genera las cabeceras HTTP de autorización (Basic Auth) para las peticiones a la API del PAC.
     * @param {string} user - Usuario de la cuenta de Facturama.
     * @param {string} pass - Contraseña de la cuenta de Facturama.
     * @returns {Object} Cabeceras 'Authorization' y 'Content-Type'.
     * @throws {Error} Si las credenciales son nulas o indefinidas.
     */
    function getAuthHeaders(user, pass) {
        // Evita inyectar 'undefined' en la codificación Base64
        if (!user || !pass) {
            throw new Error('Credenciales incompletas. Imposible generar cabeceras de autorización HTTP.');
        }

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

    /**
     * Verifica que la configuración extraída contenga todos los campos vitales antes de entregarla.
     * @private
     * @param {Object} config - Objeto de configuración mapeado desde la búsqueda.
     * @param {number|string} subId - ID de la subsidiaria (contexto para el error).
     * @throws {Error} Si falta algún campo requerido (user, pass, apiPostUrl, apiGetUrl).
     * @returns {void}
     */
    function _validateCriticalConfig(config, subId) {
        var missing = [];
        
        if (!config.user) missing.push('Usuario');
        if (!config.pass) missing.push('Contraseña');
        if (!config.apiPostUrl) missing.push('URL API Timbrado');
        if (!config.apiGetUrl) missing.push('URL API Descarga XML');

        if (missing.length > 0) {
            throw new Error('La configuración para la subsidiaria (' + subId + ') está incompleta. Faltan los campos vitales: ' + missing.join(', '));
        }
    }

    return { 
        get: get, 
        getAuthHeaders: getAuthHeaders 
    };
});
