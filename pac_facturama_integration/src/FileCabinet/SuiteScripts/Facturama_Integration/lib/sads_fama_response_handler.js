/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * * Módulo: Response Handler (Capa Anticorrupción / Translator)
 */
define([], function() {
    'use strict';

    // ==========================================
    // 1. CONSTANTES DEL DOMINIO (Evitar Magic Strings)
    // ==========================================
    var EDOC_STATUS = {
        CERTIFIED: '3',
        CERT_ERROR: '4',
        DATA_ERROR: '21'
    };

    // ==========================================
    // 2. DICCIONARIO DE ESTRATEGIAS (Open/Closed Principle)
    // ==========================================
    // Si el PAC agrega nuevos códigos, solo agregamos una línea aquí,
    // sin tocar la lógica de negocio principal.
    var ERROR_MAP = {
        400: { status: EDOC_STATUS.DATA_ERROR, msg: 'PAC - 400 Bad Request: Parámetros incompletos o inválidos.' },
        401: { status: EDOC_STATUS.CERT_ERROR, msg: 'PAC - 401 Unauthorized: Credenciales incorrectas o caducadas.' },
        403: { status: EDOC_STATUS.CERT_ERROR, msg: 'PAC - 403 Forbidden: Permisos insuficientes.' },
        404: { status: EDOC_STATUS.CERT_ERROR, msg: 'PAC - 404 Not Found: Recurso no encontrado.' },
        500: { status: EDOC_STATUS.CERT_ERROR, msg: 'PAC - 500 Internal Server Error: Error interno en Facturama.' },
        503: { status: EDOC_STATUS.CERT_ERROR, msg: 'PAC - 503 Service Unavailable: Facturama en mantenimiento.' }
    };

    // ==========================================
    // 3. API PÚBLICA (Lógica de Mapeo)
    // ==========================================
    
    /**
     * Evalúa la respuesta HTTP del PAC y la traduce a los estados estandarizados de NetSuite (eDocStatus).
     * Funciona como una Capa Anticorrupción (ACL) para proteger el núcleo de la aplicación de cambios en la API externa.
     * * @param {number|string} httpCode - El código de estado HTTP devuelto por la petición al PAC.
     * @param {Object|string|null} responseBody - El cuerpo de la respuesta (payload) entregado por el PAC.
     * @returns {Object} Objeto estructurado que contiene el éxito de la operación (success), el código de estado para NetSuite (eDocStatus) y un mensaje detallado (details).
     */
    function analyzeResponse(httpCode, responseBody) {
        // 1. EVALUACIÓN RESILIENTE: 
        // Excelente práctica. Nos protegemos de códigos HTTP incorrectos si el UUID ya existe.
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

        // 2. EVALUACIÓN DE ERRORES CONOCIDOS (Uso de Diccionario en lugar de Switch)
        var errorDetail = _extractFacturamaError(responseBody);
        
        // Si el código HTTP no está en nuestro mapa, usamos un Fallback seguro.
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

    // ==========================================
    // 4. FUNCIONES DE SOPORTE (Privadas)
    // ==========================================
    
    /**
     * Extrae de forma segura el mensaje de error del payload enviado por Facturama.
     * Implementa defensas contra valores nulos y errores de serialización (Fail-Safe Defaults).
     * * @private
     * @param {Object|string|null} responseBody - El cuerpo de la respuesta del PAC que contiene el detalle del error.
     * @returns {string} El mensaje de error extraído, concatenado de forma segura, o un mensaje genérico de fallback.
     */
    function _extractFacturamaError(responseBody) {
        // BUGFIX CRÍTICO: typeof null === 'object'. Agregamos validación estricta !== null.
        if (responseBody !== null && typeof responseBody === 'object') {
            var msg = responseBody.Message || responseBody.message || '';
            var model = responseBody.ModelState || responseBody.modelState || '';
            
            var modelString = '';
            if (model) {
                // Fail-Safe: Evitamos que JSON.stringify rompa si hay estructuras circulares o raras
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
            
            // Fallback si el objeto no trae las propiedades esperadas
            try {
                return JSON.stringify(responseBody);
            } catch (e) {
                return '[Objeto de error no parseable]';
            }
        }
        
        // Si es string o undefined, lo casteamos a cadena de forma segura
        return String(responseBody || 'Sin detalle adicional');
    }

    return { analyzeResponse: analyzeResponse };
});
/**
 * refactor(response-handler): aplicar patron diccionario, prevenir bugs de null y agregar JSDoc
 * Descripción (Body):
 * Se refactorizó la Capa Anticorrupción (ACL) encargada de interpretar las respuestas del PAC hacia NetSuite:
 * * 🐛 Prevención de Errores (JS Quirks): Se corrigió una vulnerabilidad lógica en la extracción de errores donde typeof null === 'object' podía ocasionar un TypeError fatal en el ERP si el responseBody llegaba nulo. Se implementó un Fail-Safe para serializaciones complejas.
 * * 🏗️ Clean Code (Open/Closed Principle): Se eliminó el bloque switch verboso reemplazándolo por el patrón ERROR_MAP (Diccionario/Estrategia). Esto reduce la complejidad ciclomática y permite agregar nuevos códigos HTTP en el futuro sin modificar la lógica principal.
 * * 🏷️ Remoción de Magic Strings: Se centralizaron los códigos de NetSuite (3, 4, 21) en un objeto constante EDOC_STATUS para documentar la intención del dominio y mejorar la mantenibilidad.
 * * 📚 Documentación (JSDoc): Se incorporaron firmas de funciones estandarizadas en JSDoc para la API pública y funciones privadas, documentando los parámetros esperados, tipos de datos devueltos y protegiendo el contrato de la capa anticorrupción para habilitar IntelliSense en los IDEs.
 */