/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * * Módulo: Configuración y Autenticación (Repository Pattern / Infrastructure Adapter)
 */
define(['N/search', 'N/encode'], function(search, encode) {
    'use strict';

    // ==========================================
    // 1. CONSTANTES 
    // ==========================================
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
        TMPL_CP: 'custrecord_sads_fama_tmpl_cp'
    };

    // ==========================================
    // 2. API PÚBLICA (Repositorio)
    // ==========================================
    
    /**
     * Obtiene la configuración de Facturama desde la base de datos (NetSuite Custom Record) 
     * para una subsidiaria específica.
     * * @param {number|string} subsidiaryId - El ID interno de la subsidiaria.
     * @returns {Object} Un objeto con las credenciales, URLs de API y mapeo de plantillas PDF.
     * @throws {Error} Si no se proporciona el subsidiaryId, si no se encuentra un registro activo, o si faltan datos críticos.
     */
    function get(subsidiaryId) {
        // Guard Clause (Falla rápido si el orquestador no envía subsidiaria)
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
                FLD.USER, FLD.PASS, FLD.URL_API, FLD.URL_GET,
                FLD.TMPL_INV, FLD.TMPL_CS, FLD.TMPL_CM, FLD.TMPL_IF, FLD.TMPL_CP
            ]
        });
        
        var results = configSearch.run().getRange({ start: 0, end: 1 });
        
        if (results.length === 0) {
            throw new Error('No se encontró configuración activa de Facturama para la subsidiaria ID: ' + subsidiaryId);
        }

        var row = results[0];

        // Extracción limpia usando nuestro diccionario de constantes
        var configData = {
            user: row.getValue(FLD.USER),
            pass: row.getValue(FLD.PASS),
            apiPostUrl: row.getValue(FLD.URL_API),
            apiGetUrl: row.getValue(FLD.URL_GET),
            templates: {
                'invoice': row.getValue(FLD.TMPL_INV),
                'cashsale': row.getValue(FLD.TMPL_CS),
                'creditmemo': row.getValue(FLD.TMPL_CM),
                'itemfulfillment': row.getValue(FLD.TMPL_IF),
                'customerpayment': row.getValue(FLD.TMPL_CP)
            }
        };

        // Fail-Safe Defaults: Validamos que los datos extraídos no sean un cascarón vacío
        _validateCriticalConfig(configData, subsidiaryId);

        return configData;
    }

    /**
     * Genera las cabeceras HTTP de autorización (Basic Auth) requeridas para las peticiones a la API del PAC.
     * * @param {string} user - El nombre de usuario de la cuenta de Facturama.
     * @param {string} pass - La contraseña de la cuenta de Facturama.
     * @returns {Object} Un objeto con las cabeceras 'Authorization' y 'Content-Type'.
     * @throws {Error} Si las credenciales proporcionadas son nulas o indefinidas.
     */
    function getAuthHeaders(user, pass) {
        // Prevención de inyección de valores 'undefined' en la codificación Base64
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

    // ==========================================
    // 3. FUNCIONES PRIVADAS (Reglas de Negocio / Validaciones)
    // ==========================================
    
    /**
     * Asegura que el objeto de configuración extraído contenga todos los campos vitales 
     * para operar correctamente antes de entregarlo al orquestador.
     * * @private
     * @param {Object} config - El objeto de configuración mapeado desde la búsqueda de NetSuite.
     * @param {number|string} subId - El ID de la subsidiaria (usado para inyectar contexto en el error).
     * @throws {Error} Si falta algún campo requerido (user, pass, apiPostUrl, apiGetUrl).
     */
    function _validateCriticalConfig(config, subId) {
        var missing = [];
        
        if (!config.user) missing.push('Usuario');
        if (!config.pass) missing.push('Contraseña');
        if (!config.apiPostUrl) missing.push('URL API Timbrado');
        if (!config.apiGetUrl) missing.push('URL API Descarga XML');

        if (missing.length > 0) {
            // Se propaga un error descriptivo que el orquestador registrará fácilmente
            throw new Error('La configuración para la subsidiaria (' + subId + ') está incompleta. Faltan los campos vitales: ' + missing.join(', '));
        }
    }

    return { 
        get: get, 
        getAuthHeaders: getAuthHeaders 
    };
});