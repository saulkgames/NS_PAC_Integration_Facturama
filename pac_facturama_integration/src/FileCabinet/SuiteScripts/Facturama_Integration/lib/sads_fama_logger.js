/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 *
 * Módulo: Logger centralizado. Persiste los logs en un Custom Record y desborda a archivo
 * cuando el contenido excede el límite de texto.
 */
define(['N/record', 'N/log', 'N/file'], function(record, log, file) {
    'use strict';

    var CONSTANTS = {
        RECORD_TYPE: 'customrecord_sads_fama_logger',
        FLD_TITLE: 'custrecord_sads_fama_log_title',
        FLD_MESSAGE: 'custrecord_sads_fama_log_message',
        FOLDER_ID: -15, // TODO: idealmente debería venir de sads_fama_config a futuro
        MAX_CHAR_LIMIT: 3900
    };

    /**
     * Registra un mensaje para depuración y auditoría. Si el contenido excede el límite de
     * caracteres, lo guarda como archivo adjunto y deja una referencia en el registro.
     * @param {string} title - Título del log (se trunca a 300 caracteres).
     * @param {string|Object|null} messageData - Contenido a registrar (texto u objeto).
     * @returns {void}
     */
    function write(title, messageData) {
        try {
            var safeTitle = _sanitizeTitle(title);
            var parsedMessage = _safeStringify(messageData);
            
            var fileId = null;
            var finalMessage = parsedMessage;

            // Desbordamiento a archivo cuando el mensaje excede el límite
            if (parsedMessage.length > CONSTANTS.MAX_CHAR_LIMIT) {
                var isJsonObj = typeof messageData === 'object' && messageData !== null;
                fileId = _createLogAttachment(safeTitle, parsedMessage, isJsonObj);
                
                finalMessage = 'El contenido excede el límite de caracteres (' + parsedMessage.length + 
                               ' chars).\n\nSe ha generado un archivo adjunto con ID interno: ' + fileId;
            }

            var logInternalId = _createCustomRecord(safeTitle, finalMessage);

            if (fileId) {
                _attachFile(fileId, logInternalId);
            }

        } catch (e) {
            // Fallback absoluto: si el logger custom falla, no se puede perder el error crítico,
            // así que se delega al log nativo de NetSuite.
            var errorStack = e.stack || (typeof e.getStackTrace === 'function' ? e.getStackTrace().join('\n') : 'Sin stack trace');
            log.error({
                title: 'CRÍTICO: Fallo en Custom Logger (' + (title || 'Sin Título') + ')',
                details: e.message + '\n' + errorStack
            });
        }
    }

    /**
     * Sanitiza el título para que cumpla con los límites de la base de datos.
     * @private
     * @param {string} title - Título original enviado al logger.
     * @returns {string} Título sanitizado y truncado a 300 caracteres.
     */
    function _sanitizeTitle(title) {
        return (title || 'Log sin título').substring(0, 300);
    }

    /**
     * Serializa de forma segura, previniendo colapsos por referencias circulares comunes en
     * objetos nativos de JS o NetSuite.
     * @private
     * @param {*} data - Cualquier dato que se intente registrar.
     * @returns {string} Representación segura en cadena del dato.
     */
    function _safeStringify(data) {
        if (data === null) return 'null';
        if (data === undefined) return 'undefined';
        if (typeof data !== 'object') return String(data);

        try {
            // Caché para detectar referencias circulares
            var cache = [];
            var result = JSON.stringify(data, function(key, value) {
                if (typeof value === 'object' && value !== null) {
                    if (cache.indexOf(value) !== -1) {
                        return '[Referencia Circular Detectada]';
                    }
                    cache.push(value);
                }
                return value;
            }, 2);
            cache = null;
            return result;
        } catch (e) {
            return 'Objeto no parseable (Fallo de serialización estricta): ' + e.message;
        }
    }

    /**
     * Crea un archivo en el File Cabinet cuando el log excede el límite de texto.
     * @private
     * @param {string} title - Título base para nombrar el archivo.
     * @param {string} content - Contenido extenso a guardar.
     * @param {boolean} isJson - Indica si se guarda con extensión .json o .txt.
     * @returns {number} ID interno del archivo generado.
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
     * Crea el Custom Record que indexa el log en la base de datos.
     * @private
     * @param {string} title - Título sanitizado del log.
     * @param {string} message - Mensaje o aviso de desbordamiento.
     * @returns {number} ID interno del Custom Record creado.
     */
    function _createCustomRecord(title, message) {
        var logRecord = record.create({ type: CONSTANTS.RECORD_TYPE });
        logRecord.setValue({ fieldId: CONSTANTS.FLD_TITLE, value: title });
        logRecord.setValue({ fieldId: CONSTANTS.FLD_MESSAGE, value: message });
        
        return logRecord.save({ ignoreMandatoryFields: true });
    }

    /**
     * Vincula un archivo del File Cabinet al Custom Record del log.
     * @private
     * @param {number} fileId - ID interno del archivo generado.
     * @param {number} logId - ID interno del Custom Record.
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
