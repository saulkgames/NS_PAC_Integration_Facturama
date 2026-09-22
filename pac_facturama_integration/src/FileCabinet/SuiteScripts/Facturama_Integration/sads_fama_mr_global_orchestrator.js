/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 *
 * SADS Facturama - Orquestador Map/Reduce de Factura Global.
 * Coordina la extracción de Cash Sales, la construcción del payload CFDI 4.0,
 * el timbrado en el PAC, la generación de archivos y la actualización transaccional.
 */
define([
    'N/search',
    'N/record',
    'N/runtime',
    'N/email',
    'N/file',
    './lib/sads_fama_logger',
    './lib/sads_fama_config',
    './lib/sads_fama_global_mapper',
    './lib/sads_fama_api',
    './lib/sads_fama_files'
], function (search, record, runtime, email, file, logger, configModule, mapper, api, filesAdapter) {
    'use strict';

    var CONSTANTS = {
        PARAM_REG_ID: 'custscript_sads_fama_reg_fact_id', // ID del Custom Record generado por la UI
        PARAM_TEMPLATE_ID: 'custscript_sads_fama_pdf_template', // ID de la plantilla PDF (Advanced PDF/HTML)
        AUTHOR_ID: -5, // ID interno del empleado/sistema que envía el correo
        STATUS_SUCCESS: 'SUCCESS',
        STATUS_ERROR: 'ERROR'
    };

    /**
     * Define la entrada de la fase Map. Falla rápido si no se provee el contexto inicial.
     * @param {Object} inputContext - Objeto inyectado por el framework de NetSuite.
     * @returns {Array} Arreglo con un único objeto para forzar una sola ejecución de Map.
     * @throws {Error} Si el parámetro de ID de registro no está configurado.
     */
    function getInputData(inputContext) {
        try {
            var currentScript = runtime.getCurrentScript();
            var customRecordId = currentScript.getParameter({ name: CONSTANTS.PARAM_REG_ID });

            if (!customRecordId) {
                throw new Error('Falta el parámetro crítico: ID de Registro de Facturación Intercompañía.');
            }

            return [{ regId: customRecordId }];

        } catch (e) {
            logError('Fallo fatal en getInputData', e);
            throw e; // Interrumpe la ejecución del Map/Reduce por completo
        }
    }

    /**
     * Orquesta el flujo de negocio: extracción, mapeo, timbrado y generación de archivos.
     * @param {Object} mapContext - Contexto de la fase Map; provee write() para pasar datos al Reduce.
     * @returns {void}
     */
    function map(mapContext) {
        try {
            var data = JSON.parse(mapContext.value);
            var regId = data.regId;
            var currentScript = runtime.getCurrentScript();

            // 1. Extracción de la configuración capturada en la UI
            var lookupData = search.lookupFields({
                type: 'customrecord_drt_reg_facturacion_interco',
                id: regId,
                columns: [
                    'custrecord_drt_facturas',
                    'custrecord_drt_periodicidad',
                    'custrecord_drt_meses',
                    'custrecord_drt_anio',
                    'custrecord_drt_subsidiary',
                    'custrecord_drt_sat_payment_term', // Forma de Pago
                    'custrecord_drt_sat_payment_method',// Método de Pago
                    'custrecord_drt_xml_issue_date'
                ]
            });

            var cashSalesIds = _extractMultiSelectIds(lookupData.custrecord_drt_facturas);
            if (cashSalesIds.length === 0) {
                throw new Error('El registro no contiene transacciones (Cash Sales) seleccionadas.');
            }

            // 2. Búsqueda de los tickets seleccionados
            var rawItems = _fetchCashSalesData(cashSalesIds);

            // 3. Contexto de dominio (datos del emisor)
            var subsidiaryId = lookupData.custrecord_drt_subsidiary.length > 0 ? lookupData.custrecord_drt_subsidiary[0].value : null;
            var issuerData = _getIssuerData(subsidiaryId);
            var issueDateStr = lookupData.custrecord_drt_xml_issue_date;
            var parsedSatDate = _parseAndFormatSatDate(issueDateStr);
            var extractedFormaPago = extractSatCode(lookupData.custrecord_drt_sat_payment_method);
            var extractedMetodoPago = extractSatCode(lookupData.custrecord_drt_sat_payment_term);

            if (!extractedFormaPago) {
                throw new Error('Violación de Regla de Negocio: No se especificó la Forma de Pago (Payment Term). No se permite el uso de valores por defecto.');
            }

            var contextData = {
                periodicidad: '01',
                meses: parsedSatDate.month,
                anio: parsedSatDate.year,
                formaPago: extractedFormaPago,
                metodoPago: extractedMetodoPago,
                fechaEmision: parsedSatDate.iso,
                folioSolicitado: 'GLOBAL-' + regId,
                issuerRfc: issuerData.rfc,
                issuerName: issuerData.name,
                issuerZipCode: issuerData.zip,
                issuerRegime: issuerData.regime ? issuerData.regime.trim() : '601'
            };

            // 4. Transformación al payload de Facturama
            var configData = configModule.get(subsidiaryId);
            var payload = mapper.buildFacturamaPayload(contextData, rawItems);
            var jsonId = filesAdapter.saveFile('Payload_Facturama_' + regId + '.json', payload, configData.folderIdPdf);

            // 5. Timbrado vía adaptador HTTP
            var headers = configModule.getAuthHeaders(configData.user, configData.pass);
            var apiResponse = api.postTimbrado(configData.apiPostUrl, headers, JSON.stringify(payload));

            // Validar que la respuesta sea exitosa y tenga la estructura esperada
            if (!apiResponse || apiResponse.error_interno || apiResponse.Message || !apiResponse.Complement) {
                var errorDetail = 'Error desconocido';
                var failData = {
                    'custrecord_drt_status': apiResponse.Message || errorDetail,
                    'custrecord_drt_documento_xml': jsonId,
                };
                if (apiResponse) {
                    errorDetail = apiResponse.ModelState ? JSON.stringify(apiResponse.ModelState) : (apiResponse.Message || apiResponse.detalle);
                }
                record.submitFields({
                    type: 'customrecord_drt_reg_facturacion_interco',
                    id: regId,
                    values: failData,
                    options: { ignoreMandatoryFields: true }
                });
                throw new Error('El PAC rechazó el timbraFdo (400 Bad Request): ' + errorDetail);
            }

            var cfdiId = apiResponse.Id;
            var uuid = apiResponse.Complement.TaxStamp.Uuid;
            var rawPacDate = apiResponse.Complement.TaxStamp.Date;

            // 6. Descarga y generación de archivos físicos
            var fileNamePrefix = 'FacturaGlobal_' + uuid;

            var xmlData = api.getFile(configData.apiGetUrl, headers, cfdiId, 'xml');
            var xmlId = filesAdapter.saveFile(fileNamePrefix + '.xml', xmlData.Content, configData.folderIdXml);

            var pdfData = api.getFile(configData.apiGetUrl, headers, cfdiId, 'pdf');
            var pdfId = filesAdapter.saveFile(fileNamePrefix + '.pdf', pdfData.Content, configData.folderIdPdf);

            // 7. Despachar tareas atómicas a la fase Reduce
            var successData = {
                uuid: uuid,
                date: rawPacDate,
                xmlId: xmlId,
                pdfId: pdfId,
                regId: regId,
                jsonId: jsonId
            };

            for (var i = 0; i < cashSalesIds.length; i++) {
                mapContext.write({
                    key: cashSalesIds[i],
                    value: successData
                });
            }

        } catch (e) {
            logError('Fallo en la etapa MAP (Construcción o Timbrado)', e, { rawMapValue: mapContext.value });
            throw e; // Protege el estado: si falla aquí, Reduce no mutará la base de datos
        }
    }

    /**
     * Actualiza cada Cash Sale con el UUID y los archivos generados.
     * @param {Object} reduceContext - Provee el ID del ticket (key) y los datos de éxito (values).
     * @returns {void}
     */
    function reduce(reduceContext) {
        var cashSaleId = reduceContext.key;

        try {
            var successData = JSON.parse(reduceContext.values[0]);

            var safeDate = _parsePacDate(successData.date);
            record.submitFields({
                type: record.Type.CASH_SALE,
                id: cashSaleId,
                values: {
                    'custbody_mx_cfdi_uuid': successData.uuid,
                    'custbody_psg_ei_certified_edoc': successData.xmlId,
                    'custbody_edoc_generated_pdf': successData.pdfId,
                    'custbody_psg_ei_status': 7,
                    'custbody_mx_cfdi_certify_timestamp': safeDate
                },
                options: { ignoreMandatoryFields: true }
            });

            // Reenviar metadatos agrupados al Summarize para la notificación
            reduceContext.write({
                key: successData.regId,
                value: { xmlId: successData.xmlId, pdfId: successData.pdfId, uuid: successData.uuid, date: safeDate, jsonId: successData.jsonId }
            });

        } catch (e) {
            logError('Fallo aisaldo al actualizar Cash Sale ID: ' + cashSaleId, e);
        }
    }

    /**
     * Evalúa el resultado final del proceso y notifica a los usuarios.
     * @param {Object} summaryContext - Estadísticas, errores y salidas del Map/Reduce.
     * @returns {void}
     */
    function summarize(summaryContext) {
        var totalErrors = 0;

        summaryContext.mapSummary.errors.iterator().each(function (key, error) {
            logError('Excepción capturada en MapSummary', error);
            totalErrors++;
            return true;
        });

        summaryContext.reduceSummary.errors.iterator().each(function (key, error) {
            logError('Excepción capturada en ReduceSummary', error);
            totalErrors++;
            return true;
        });

        var fileData = null;
        var regId = null;

        summaryContext.output.iterator().each(function (key, value) {
            regId = key;
            fileData = JSON.parse(value);
            return false; // Solo se necesita la metadata de un nodo; todos comparten la misma
        });

        try {
            if (totalErrors === 0 && fileData && regId) {
                _sendSuccessEmail(regId, fileData.xmlId, fileData.pdfId, fileData.uuid);
                _updateCustomRecordStatus(regId, fileData, 'Factura Global Generada Correctamente.');
                logger.write('3. ORQUESTACIÓN FINALIZADA', { regId: regId, status: 'ÉXITO TOTAL' });
            } else if (regId) {
                _updateCustomRecordStatus(regId, fileData, 'Proceso finalizado con errores parciales o totales. Revisa el Logger.');
                logger.write('3. ORQUESTACIÓN FINALIZADA CON ERRORES', { regId: regId, erroresDetectados: totalErrors });
            }
        } catch (e) {
            logError('Fallo crítico en fase Summarize (Envío de correo/Actualización)', e);
        }
    }

    /**
     * Recupera y formatea los datos de la subsidiaria emisora.
     * @private
     * @param {number|string} subsidiaryId - ID interno de la subsidiaria.
     * @returns {Object} Datos del emisor (rfc, name, zip, regime).
     */
    function _getIssuerData(subsidiaryId) {
        if (!subsidiaryId) throw new Error('Se requiere una subsidiaria para obtener los datos del Emisor.');

        var fields = search.lookupFields({
            type: search.Type.SUBSIDIARY,
            id: subsidiaryId,
            columns: ['custrecord_alm_subsidiaria_rfc', 'custrecord_mx_sat_registered_name', 'custrecord_drt_cod_postal_emisor', 'custrecord_mx_sat_industry_type']
        });

        return {
            rfc: fields.custrecord_alm_subsidiaria_rfc,
            name: fields.custrecord_mx_sat_registered_name,
            zip: fields.custrecord_drt_cod_postal_emisor,
            regime: fields.custrecord_mx_sat_industry_type[0] ? fields.custrecord_mx_sat_industry_type[0].text.split('-')[0] : '601'
        };
    }

    /**
     * Sanitiza el valor crudo de un Multi-Select Field de NetSuite a un arreglo JS estándar.
     * @private
     * @param {*} rawFieldValue - Valor crudo del campo.
     * @returns {Array} Arreglo de IDs.
     */
    function _extractMultiSelectIds(rawFieldValue) {
        if (!rawFieldValue) return [];
        if (Array.isArray(rawFieldValue) && rawFieldValue.length > 0 && typeof rawFieldValue[0] === 'object') {
            return rawFieldValue.map(function (obj) { return obj.value; });
        }
        if (Array.isArray(rawFieldValue)) return rawFieldValue;
        if (typeof rawFieldValue === 'string') return rawFieldValue.split(',');
        return [];
    }

    /**
     * Busca los Cash Sales seleccionados y extrae los totales de cada línea.
     * @private
     * @param {Array} cashSalesIds - IDs internos de las transacciones.
     * @returns {Array} Objetos de línea sanitizados y listos para el mapeador.
     */
    function _fetchCashSalesData(cashSalesIds) {
        if (!cashSalesIds || cashSalesIds.length === 0) return [];
        var rawItems = [];

        // Filtros estrictos para ignorar líneas basura (COGS, impuestos, envío)
        var transactionSearchFilters = [
            ['mainline', 'is', 'F'], 'AND',
            ['shipping', 'is', 'F'], 'AND',
            ['taxline', 'is', 'F'], 'AND',
            ['cogs', 'is', 'F'], 'AND',
            ['formulatext: {item}', 'isnotempty', ''], 'AND',
            ['internalid', 'anyof', cashSalesIds]
        ];

        var colTranId = search.createColumn({ name: 'tranid' });
        var colItemName = search.createColumn({ name: 'displayname', join: 'item' });
        var colQuantity = search.createColumn({ name: 'quantity' });
        var colAmount = search.createColumn({ name: 'amount' });
        var colDiscount = search.createColumn({ name: 'discountamount' });
        var colSatItemCode = search.createColumn({ name: 'custcol_mx_txn_line_sat_item_code' });
        var colTaxAmount = search.createColumn({ name: 'taxamount' });
        var colTaxRate = search.createColumn({ name: 'rate', join: 'taxitem' });
        var colTaxObject = search.createColumn({ name: 'custrecord_mx_sat_to_code', join: 'custcol_mx_txn_line_sat_tax_object' });
        var colItemRate = search.createColumn({ name: 'rate' });

        var salesSearch = search.create({
            type: search.Type.CASH_SALE,
            filters: transactionSearchFilters,
            columns: [
                colTranId,
                colQuantity,
                colAmount,
                colDiscount,
                colSatItemCode,
                colTaxAmount,
                colTaxObject,
                colTaxRate,
                colItemName,
                colItemRate
            ]
        });

        salesSearch.run().each(function (result) {
            rawItems.push({
                ticketNumber: result.getValue(colTranId),
                itemDescription: result.getValue(colItemName),
                qty: result.getValue(colQuantity),
                amount: result.getValue(colAmount),
                discount: Math.abs(parseFloat(result.getValue(colDiscount)) || 0),
                satCode: result.getText(colSatItemCode),
                taxObject: result.getValue(colTaxObject),
                taxAmount: result.getValue(colTaxAmount),
                taxrate: result.getValue(colTaxRate),
                unitPrice: result.getValue(colItemRate)
            });
            return true;
        });
        return rawItems;
    }

    /**
     * Obtiene la fecha actual en formato ISO 8601 estricto para Facturama.
     * @private
     * @returns {string} Fecha ISO sin milisegundos (ej. "2026-08-21T12:40:23").
     */
    function _getIsoDateString() {
        var d = new Date();
        return d.toISOString().split('.')[0];
    }

    /**
     * Adjunta los archivos del File Cabinet y envía el correo de éxito.
     * @private
     * @param {number|string} regId - ID del registro pivote de facturación.
     * @param {number} xmlId - ID interno del archivo XML.
     * @param {number} pdfId - ID interno del archivo PDF.
     * @param {string} uuid - UUID fiscal del CFDI generado.
     * @returns {void}
     */
    function _sendSuccessEmail(regId, xmlId, pdfId, uuid) {
        var customRecord = record.load({ type: 'customrecord_drt_reg_facturacion_interco', id: regId });
        // En un entorno real se extraería el correo del usuario creador o de una configuración
        var userObj = runtime.getCurrentUser();
        var userEmail = userObj.email || 'operaciones@almetal.in'
        var recipients = [userEmail];

        var xmlAttachment = file.load({ id: xmlId });
        var pdfAttachment = file.load({ id: pdfId });

        email.send({
            author: CONSTANTS.AUTHOR_ID,
            recipients: recipients,
            subject: 'Notificación de Sistema: Factura Global Generada Exitosamente',
            body: 'Se ha completado la generación masiva de la Factura Global.\n\nUUID Fiscal: ' + uuid + '\n\nSe adjuntan los comprobantes XML y PDF generados desde el PAC.',
            attachments: [xmlAttachment, pdfAttachment]
        });
    }

    /**
     * Actualiza el registro pivote para informar a la UI (Suitelet) del resultado final.
     * @private
     * @param {number|string} regId - ID del registro pivote de facturación.
     * @param {Object} fileData - Metadatos de los archivos generados y UUID.
     * @param {string} message - Mensaje de estado (actualmente no persistido).
     * @returns {void}
     */
    function _updateCustomRecordStatus(regId, fileData, message) {
        var safeDate = _parsePacDate(fileData.date);
        record.submitFields({
            type: 'customrecord_drt_reg_facturacion_interco',
            id: regId,
            values: {
                'custrecord_drt_status': CONSTANTS.STATUS_SUCCESS,
                'custrecord_drt_xml_generado': fileData.xmlId,
                'custrecord_drt_pdf_generado': fileData.pdfId,
                'custrecord_drt_documento_xml': fileData.jsonId,
                'custrecord_drt_uuid': fileData.uuid,
                'custrecord_drt_xml_issue_date_2': safeDate,
            },
            options: { ignoreMandatoryFields: true }
        });
    }

    /**
     * Registra un error de forma estandarizada a través del logger central.
     * @private
     * @param {string} customMessage - Contexto de dónde ocurrió el fallo.
     * @param {Error|Object} e - Excepción capturada.
     * @param {Object} [contextData] - Estado relevante para reproducir el error.
     * @returns {void}
     */
    function logError(customMessage, e, contextData) {
        var errorDetails = {
            name: e.name || 'MAP_REDUCE_ERROR',
            message: e.message || e.toString(),
            stack: e.stack || (typeof e.getStackTrace === 'function' ? e.getStackTrace().join('\n') : 'No stack trace'),
            context: contextData || {}
        };
        logger.write('ERROR ORQUESTADOR GLOBAL: ' + customMessage, errorDetails);
    }

    /**
     * Extrae el código SAT de un objeto {text}, tomando la parte anterior al primer guion.
     * @private
     * @param {Object} lookupObj - Objeto que contiene código y descripción.
     * @returns {string} El código extraído.
     */
    function extractSatCode(lookupObj) {
        if (!lookupObj || lookupObj.length === 0) return '';
        var text = lookupObj[0].text || '';
        return text.split('-')[0].trim().split(' ')[0].trim();
    }

    /**
     * Extrae, normaliza y formatea una fecha capturada en la UI, aislándola de los formatos
     * regionales impredecibles de NetSuite.
     * @private
     * @param {string} rawDateStr - Cadena proveniente de NetSuite (ej. "01/09/2026 6:00:00 pm").
     * @returns {Object} Objeto con el ISO formateado, mes (2 dígitos) y año.
     */
    function _parseAndFormatSatDate(rawDateStr) {
        var dateObj = new Date(); // Fallback seguro: fecha actual del servidor

        if (rawDateStr) {
            var cleanStr = rawDateStr.toLowerCase().trim();
            var isNetSuiteLatamFormat = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(cleanStr);

            if (isNetSuiteLatamFormat) {
                // Formato regional latino: "DD/MM/YYYY h:mm:ss am/pm"
                var parts = cleanStr.split(' ');

                var dateParts = parts[0].split('/');
                var day = parseInt(dateParts[0], 10);
                var month = parseInt(dateParts[1], 10) - 1; // JS indexa los meses de 0 a 11
                var year = parseInt(dateParts[2], 10);

                var timeParts = parts[1] ? parts[1].split(':') : ['00', '00', '00'];
                var hours = parseInt(timeParts[0], 10) || 0;
                var minutes = parseInt(timeParts[1], 10) || 0;
                var seconds = parseInt(timeParts[2], 10) || 0;

                // Conversión estricta a formato de 24 horas
                var ampm = parts[2] ? parts[2].trim() : '';
                if (ampm === 'pm' && hours < 12) {
                    hours += 12;
                } else if (ampm === 'am' && hours === 12) {
                    hours = 0;
                }

                dateObj = new Date(year, month, day, hours, minutes, seconds);
            } else {
                // Fallback si la cuenta usa formato ISO nativo
                var parsed = new Date(rawDateStr);
                if (!isNaN(parsed.getTime())) {
                    dateObj = parsed;
                }
            }
        }

        // Reconstrucción manual exacta para el PAC (sin depender de .toISOString)
        var pad = function (n) { return n < 10 ? '0' + n : n; };

        var finalYear = dateObj.getFullYear().toString();
        var finalMonth = pad(dateObj.getMonth() + 1).toString();
        var finalDay = pad(dateObj.getDate());
        var finalHours = pad(dateObj.getHours());
        var finalMinutes = pad(dateObj.getMinutes());
        var finalSeconds = pad(dateObj.getSeconds());

        var formattedDate = finalYear + '-' + finalMonth + '-' + finalDay + ' ' + finalHours + ':' + finalMinutes + ':' + finalSeconds;

        return {
            iso: formattedDate,
            month: finalMonth,
            year: finalYear
        };
    }

    /**
     * Convierte la fecha del PAC a un objeto Date nativo, evitando suposiciones de zona horaria.
     * @private
     * @param {string} pacDateStr - Fecha retornada por el PAC (ej. "2018-02-27T10:46:19").
     * @returns {Date} Objeto Date válido para NetSuite.
     */
    function _parsePacDate(pacDateStr) {
        if (!pacDateStr) return new Date(); // Fallback: fecha actual si viene vacío

        var parts = pacDateStr.split('T');
        var dateParts = parts[0].split('-');
        var timeParts = parts[1].split(':');

        var year = parseInt(dateParts[0], 10);
        var month = parseInt(dateParts[1], 10) - 1; // JS indexa los meses de 0 a 11
        var day = parseInt(dateParts[2], 10);

        var hours = parseInt(timeParts[0], 10) || 0;
        var minutes = parseInt(timeParts[1], 10) || 0;
        var seconds = parseInt(timeParts[2], 10) || 0;

        // Instancia la fecha en el tiempo local exacto de los números provistos
        return new Date(year, month, day, hours, minutes, seconds);
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
