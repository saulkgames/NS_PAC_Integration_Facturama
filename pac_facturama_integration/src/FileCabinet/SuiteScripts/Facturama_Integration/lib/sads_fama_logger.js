/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * * Módulo: Logger Personalizado (Infraestructura / Adapter)
 * Patrones: Factory, Strategy (Serialización segura)
 */
define(['N/record', 'N/log', 'N/file'], function(record, log, file) {
    'use strict';

    // ==========================================
    // 1. CONSTANTES (Eliminación de Magic Strings)
    // ==========================================
    var CONSTANTS = {
        RECORD_TYPE: 'customrecord_sads_fama_logger',
        FLD_TITLE: 'custrecord_sads_fama_log_title',
        FLD_MESSAGE: 'custrecord_sads_fama_log_message',
        FOLDER_ID: -15, // TODO: Idealmente debería venir de sads_fama_config a futuro
        MAX_CHAR_LIMIT: 3900
    };

    // ==========================================
    // 2. API PÚBLICA (El Puerto de Entrada)
    // ==========================================
    
    /**
     * Función principal de registro (logging) para depuración y auditoría de scripts.
     * Intercepta mensajes largos y los convierte automáticamente en archivos adjuntos.
     * * @param {string} title - El título del log (se truncará a 300 caracteres si excede el límite).
     * @param {string|Object|null} messageData - El contenido a registrar. Puede ser una cadena de texto o un objeto complejo.
     * @returns {void}
     */
    function write(title, messageData) {
        try {
            var safeTitle = _sanitizeTitle(title);
            var parsedMessage = _safeStringify(messageData);
            
            var fileId = null;
            var finalMessage = parsedMessage;

            // Lógica de desbordamiento (Overflow Strategy)
            if (parsedMessage.length > CONSTANTS.MAX_CHAR_LIMIT) {
                var isJsonObj = typeof messageData === 'object' && messageData !== null;
                fileId = _createLogAttachment(safeTitle, parsedMessage, isJsonObj);
                
                finalMessage = 'El contenido excede el límite de caracteres (' + parsedMessage.length + 
                               ' chars).\n\nSe ha generado un archivo adjunto con ID interno: ' + fileId;
            }

            // Persistencia del Log
            var logInternalId = _createCustomRecord(safeTitle, finalMessage);

            if (fileId) {
                _attachFile(fileId, logInternalId);
            }

        } catch (e) {
            // FALLBACK ABSOLUTO (Fail-Safe Defaults)
            // Si todo falla, no podemos dejar de registrar el error crítico. Usamos el log nativo de NetSuite.
            var errorStack = e.stack || (typeof e.getStackTrace === 'function' ? e.getStackTrace().join('\n') : 'Sin stack trace');
            log.error({
                title: 'CRÍTICO: Fallo en Custom Logger (' + (title || 'Sin Título') + ')',
                details: e.message + '\n' + errorStack
            });
        }
    }

    // ==========================================
    // 3. FUNCIONES PRIVADAS (Principio de Responsabilidad Única - SRP)
    // ==========================================

    /**
     * Sanitiza el título del log para asegurar que cumpla con los límites de la base de datos.
     * * @private
     * @param {string} title - El título original enviado al logger.
     * @returns {string} El título sanitizado y truncado a un máximo de 300 caracteres.
     */
    function _sanitizeTitle(title) {
        return (title || 'Log sin título').substring(0, 300);
    }

    /**
     * Serializador Seguro: Previene colapsos (TypeError) causados por Referencias Circulares 
     * comunes en objetos nativos de JS o NetSuite.
     * * @private
     * @param {*} data - Cualquier tipo de dato que se intente registrar.
     * @returns {string} Una representación segura en cadena del dato proporcionado.
     */
    function _safeStringify(data) {
        if (data === null) return 'null';
        if (data === undefined) return 'undefined';
        if (typeof data !== 'object') return String(data);

        try {
            // Patrón de Caché para detectar referencias circulares
            var cache = [];
            var result = JSON.stringify(data, function(key, value) {
                if (typeof value === 'object' && value !== null) {
                    if (cache.indexOf(value) !== -1) {
                        // En lugar de crashear, advertimos la estructura circular
                        return '[Referencia Circular Detectada]';
                    }
                    cache.push(value);
                }
                return value;
            }, 2);
            cache = null; // Garbage Collection amigable
            return result;
        } catch (e) {
            // Degradación elegante: Si aún así falla, devolvemos lo que podamos
            return 'Objeto no parseable (Fallo de serialización estricta): ' + e.message;
        }
    }

    /**
     * Crea un archivo físico en el File Cabinet de NetSuite cuando el log excede el límite de texto.
     * * @private
     * @param {string} title - El título base para nombrar el archivo.
     * @param {string} content - El contenido extenso a guardar.
     * @param {boolean} isJson - Indica si el contenido debe guardarse con extensión .json o .txt.
     * @returns {number} El ID interno del archivo generado.
     */
    function _createLogAttachment(title, content, isJson) {
        var timestamp = new Date().getTime();
        var safeFileName = title.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        var extension = isJson ? '.json' : '.txt';
        var fileName = 'Log_' + safeFileName + '_' + timestamp + extension;
        
        var logFile = file.create({
            name: fileName,
            fileType: isJson ? file.Type.JSON : file.Type.PLAINTEXT,
            contents: content,
            folder: CONSTANTS.FOLDER_ID
        });
        
        return logFile.save();
    }

    /**
     * Genera el registro personalizado en la base de datos de NetSuite para indexar el log.
     * * @private
     * @param {string} title - El título sanitizado del log.
     * @param {string} message - El mensaje o el aviso de desbordamiento (overflow).
     * @returns {number} El ID interno del Custom Record creado.
     */
    function _createCustomRecord(title, message) {
        var logRecord = record.create({ type: CONSTANTS.RECORD_TYPE });
        logRecord.setValue({ fieldId: CONSTANTS.FLD_TITLE, value: title });
        logRecord.setValue({ fieldId: CONSTANTS.FLD_MESSAGE, value: message });
        
        return logRecord.save({ ignoreMandatoryFields: true });
    }

    /**
     * Vincula (attach) un archivo del File Cabinet al registro personalizado del log para fácil acceso.
     * * @private
     * @param {number} fileId - El ID interno del archivo generado.
     * @param {number} logId - El ID interno del registro personalizado (Custom Record).
     * @returns {void}
     */
    function _attachFile(fileId, logId) {
        record.attach({
            record: { type: 'file', id: fileId },
            to: { type: CONSTANTS.RECORD_TYPE, id: logId }
        });
    }

    return { write: write };
});
/**
 * refactor(logger): aplicar SRP, serialización segura y agregar documentación JSDoc
 * Descripción (Body):
 * Se refactorizó el adaptador de infraestructura sads_fama_logger.js para incrementar su robustez y mantenibilidad, aplicando principios SOLID y de diseño seguro:
 * * 🛡️ Diseño Fail-Safe (_safeStringify): Se mitigó un riesgo crítico donde JSON.stringify causaba un colapso del sistema al intentar serializar objetos con referencias circulares. Se implementó una caché interna que neutraliza el error registrando un [Referencia Circular Detectada].
 * * 🧹 Clean Code (SRP): Se descompuso la función write en métodos privados atómicos (_createLogAttachment, _createCustomRecord, _attachFile), aislando las responsabilidades (File System vs. Database Records).
 * * ⚙️ Mejora del Fallback: En caso de fallo total del custom logger (ej. límite de cuota en el File Cabinet), la excepción delegada al sistema nativo (log.error) ahora captura correctamente el stack trace y contexto para evitar la pérdida del Compromise Recording.
 * * 📚 Documentación (JSDoc): Se añadieron etiquetas de documentación estándar JSDoc a todas las funciones de la API pública y soporte interno, definiendo tipos, parámetros, y retornos esperados, facilitando el mantenimiento y habilitando el IntelliSense en los IDEs.
 */