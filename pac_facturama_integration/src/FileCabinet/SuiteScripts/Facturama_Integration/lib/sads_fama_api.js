/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * * Módulo: Comunicación HTTP (Adaptador de Infraestructura PAC)
 */
define(['N/https', './sads_fama_logger'], function (https, logger) {
    'use strict';

    // ==========================================
    // 1. FUNCIONES PRIVADAS (Clean Architecture)
    // ==========================================

    /**
     * Factory Pattern para estandarizar el registro de errores HTTP.
     * Captura la pila completa, la respuesta y los códigos de error delegando al logger central.
     * * @private
     * @param {string} customMessage - Mensaje descriptivo sobre el momento en que ocurrió el fallo.
     * @param {Error|Object} e - Objeto de error nativo de JS o de SuiteScript.
     * @param {Object} [contextData] - Datos adicionales para facilitar la auditoría y reproducción del error.
     * @returns {void}
     */
    function logHttpError(customMessage, e, contextData) {
        var errorDetails = {
            name: e.name || 'HTTP_NETWORK_ERROR',
            message: e.message || e.toString(),
            stack: 'Stack trace no disponible',
            context: contextData || {}
        };

        // Extracción del Stack Trace (Nativo JS o SuiteScript)
        if (e.stack) {
            errorDetails.stack = e.stack;
        } else if (typeof e.getStackTrace === 'function') {
            errorDetails.stack = e.getStackTrace().join('\n');
        }

        // Compromise Recording: Guardamos TODO el contexto para auditoría
        logger.write('ERROR COMUNICACION: ' + customMessage, errorDetails);
    }

    // ==========================================
    // 2. API PÚBLICA (Puertos de salida)
    // ==========================================

    /**
     * Parsea de forma segura una cadena JSON.
     * Actúa como un escudo contra fallos de `JSON.parse` cuando el servidor devuelve HTML u otros formatos inválidos.
     * * @param {string} jsonString - La cadena de texto a convertir.
     * @returns {Object|string|null} Retorna el objeto parseado, la cadena original si falla el parseo, o null si la entrada está vacía.
     */
    function safeParse(jsonString) {
        if (!jsonString) return null;
        try { 
            // Corrección: El logger debe ir ANTES del return para que sea alcanzable.
            var parsedObj = JSON.parse(jsonString);
            logger.write('Funcion safeParse Ejecutada, Retorno de Funcion:', jsonString);
            return parsedObj; 
        } catch (e) { 
            return jsonString; 
        } 
    }

    /**
     * Envía el payload de la factura al PAC (Facturama) para su certificación/timbrado.
     * Posee degradación elegante en caso de fallos catastróficos de red.
     * * @param {string} url - El endpoint POST de timbrado.
     * @param {Object} headers - Cabeceras HTTP de autorización y tipo de contenido.
     * @param {string} payload - El contenido JSON en cadena que representa el CFDI.
     * @returns {Object} El cuerpo de la respuesta del PAC o un objeto estandarizado de error de red.
     */
    function postTimbrado(url, headers, payload) {
        var resp = null; // Declaración en nivel superior (Hoisting)
        
        try {
            resp = https.post({ url: url, headers: headers, body: payload });
            logger.write('Funcion postTimbrado Ejecutada, Retorno de Funcion:', resp);
            return safeParse(resp.body); // El Response Handler evaluará el contenido
            
        } catch (networkError) {
            // Este catch atrapa Timeouts, DNS failures, o bloqueos de red de NetSuite.
            // Protegemos la ejecución para que el "Response Handler" no explote.
            logHttpError('Fallo catastrófico de red en postTimbrado', networkError, {
                url: url,
                // NOTA DE SEGURIDAD: Nunca loguees el 'payload' completo si contiene contraseñas o tokens.
                httpCode: resp ? resp.code : 'Sin conexión',
            });
            
            // Retorno seguro simulado para tu Response Handler
            return {
                error_interno: true,
                mensaje: 'Excepción de red al contactar al PAC',
                detalle: networkError.message
            };
        }
    }

    /**
     * Descarga el archivo XML certificado desde el PAC.
     * * @param {string} baseUrl - La URL base para la descarga, debe contener el token '{id}'.
     * @param {Object} headers - Cabeceras HTTP de autorización.
     * @param {string} cfdiId - El identificador único del CFDI en el sistema del PAC.
     * @returns {Object|null} El JSON representativo del XML o null en caso de fallo absoluto de red.
     */
    function getXml(baseUrl, headers, cfdiId) {
        var resp = null; // Lo declaramos aquí para garantizar su acceso en el bloque catch
        var finalUrl = baseUrl.replace('{id}', cfdiId);

        try {
            resp = https.get({ url: finalUrl, headers: headers });

            if (resp.code !== 200) {
                var getErrorBody = safeParse(resp.body);
                var errorMsg = typeof getErrorBody === 'string' ? getErrorBody : JSON.stringify(getErrorBody);
                // Lanzamos el error intencionalmente para que caiga en nuestro manejador unificado
                throw new Error('El PAC rechazó la descarga XML. Body: ' + errorMsg);
            }
            
            logger.write('Funcion getXml Ejecutada, Retorno de Funcion:', resp);
            return safeParse(resp.body);

        } catch (error) {
            // Centralizamos toda la recopilación forense de datos
            var contextData = {
                cfdiId: cfdiId,
                url: finalUrl,
                httpCode: resp ? resp.code : 'N/A',
                responseBody: resp && resp.body ? resp.body : 'Sin respuesta del servidor'
            };

            logHttpError('Fallo al descargar XML del PAC', error, contextData);

            // Criterio de negocio: Retorno seguro con degradación elegante.
            // Si hubo respuesta pero el código no era 200, devolvemos el cuerpo para análisis.
            if (resp && resp.body) {
                return safeParse(resp.body);
            }

            // Si fue un fallo de red absoluto, devolvemos null para no romper flujos posteriores
            return null; 
        }
    }

    return {
        // En Clean Architecture, intentamos minimizar la API pública. 
        // Si nadie fuera de este archivo llama a safeParse, elimínalo de aquí abajo.
        safeParse: safeParse, 
        postTimbrado: postTimbrado,
        getXml: getXml
    };
});
/**
 * TITULO: refactor(http-adapter): blindar adaptador HTTP del PAC y estandarizar manejo de errores
 * Se refactorizó el módulo sads_fama_api.js para actuar como un verdadero Adaptador Secundario (Hexagonal Architecture), protegiendo al ERP de fallos de infraestructura externa. Se aplicaron principios de Clean Code y Fail-Safe Defaults con los siguientes cambios críticos:
 * * 🛡️ Tolerancia a Fallos y Estado Predecible (Saltzer & Schroeder):
 * * Se corrigió el scope de la variable resp mediante Hoisting (var resp = null; al inicio). Esto asegura que el bloque catch siempre tenga un contexto de evaluación seguro si la conexión se corta antes de recibir respuesta, eliminando las validaciones frágiles de tipo (typeof resp !== 'undefined').
 * Se agregaron logs de auditoria en escenarios de exito.
 * Se agregó un escudo protector (try/catch) en postTimbrado. Los errores catastróficos de red (timeouts, DNS) ahora son capturados y devuelven un objeto de error estructurado para que el Response Handler externo los procese sin que colapse el hilo principal de ejecución de NetSuite.
 * * 🧹 Clean Code y DRY (Robert C. Martin):
 * * Corrección Crítica (Bugfix): Se eliminó el uso de JSON.stringify(error). Los objetos Error en JS no son enumerables y devolvían un objeto vacío ({}).
 * Se implementó el método Factory privado logHttpError para centralizar la captura del error. Ahora el sistema extrae inteligentemente el stack trace estándar de JS (e.stack) o el nativo de SuiteScript (e.getStackTrace()), garantizando el principio de Compromise Recording en el logger.
 * * 🏛️ Arquitectura de Límite (Alistair Cockburn):
 * * El módulo ahora respeta su naturaleza de "frontera". Inspecciona y sanitiza el estado del mundo exterior (el servicio del PAC). Devuelve siempre datos controlados (null, objetos JSON o trazas detalladas) hacia el Core del negocio, evitando filtraciones de excepciones no controladas.
 */