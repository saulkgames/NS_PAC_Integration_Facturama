/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo: Logger Personalizado
 */
define(['N/record', 'N/log'], function(record, log) {
    'use strict';

    function write(title, messageData) {
        try {
            var logRecord = record.create({ type: 'customrecord_sads_fama_logger' });
            var safeTitle = (title || 'Log sin título').substring(0, 300);
            
            var parsedMessage = '';
            if (typeof messageData === 'object') {
                try { parsedMessage = JSON.stringify(messageData); } 
                catch(e) { parsedMessage = 'Objeto no parseable: ' + e.message; }
            } else {
                parsedMessage = String(messageData || '');
            }
            
            var safeMessage = parsedMessage.substring(0, 3900);

            logRecord.setValue({ fieldId: 'custrecord_sads_fama_log_title', value: safeTitle });
            logRecord.setValue({ fieldId: 'custrecord_sads_fama_log_message', value: safeMessage });
            logRecord.save({ ignoreMandatoryFields: true });
        } catch (e) {
            log.error('Fallo Crítico en Custom Logger', e.toString());
        }
    }

    return { write: write };
});