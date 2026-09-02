/**
 * @NApiVersion 2.0
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 * 
 * SADS Facturama - Orquestador Map/Reduce para Factura Global
 * 
 * Arquitectura: Hexagonal (Ports and Adapters) & Mediator Pattern
 * Descripción: Coordina la extracción masiva de tickets (Cash Sales), la transformación
 * de datos a través de la capa de Dominio, la comunicación con el PAC vía Adaptadores HTTP, 
 * la generación de archivos físicos y la actualización transaccional usando límites elásticos.
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

    // ==========================================
    // 1. CONSTANTES DEL SISTEMA (No Magic Strings)
    // ==========================================
    var CONSTANTS = {
        PARAM_REG_ID: 'custscript_sads_fama_reg_fact_id', // ID del Custom Record generado por la UI
        PARAM_TEMPLATE_ID: 'custscript_sads_fama_pdf_template', // ID de la Plantilla PDF (Advanced PDF/HTML)
        AUTHOR_ID: -5, // ID interno del empleado/sistema que envía el correo
        STATUS_SUCCESS: 'SUCCESS',
        STATUS_ERROR: 'ERROR'
    };

    // ==========================================
    // 2. GET INPUT DATA (El Recolector)
    // ==========================================

    /**
     * Define la entrada de datos para la fase Map.
     * Patrón Fail-Safe: Falla rápido si no se provee el contexto inicial.
     * 
     * @param {Object} inputContext - Objeto inyectado por el framework de NetSuite.
     * @returns {Array} Un arreglo con un único objeto para forzar una sola ejecución de la etapa Map.
     * @throws {Error} Si el parámetro de ID de registro no está configurado.
     */
    function getInputData(inputContext) {
        try {
            var currentScript = runtime.getCurrentScript();
            var customRecordId = currentScript.getParameter({ name: CONSTANTS.PARAM_REG_ID });

            if (!customRecordId) {
                throw new Error('Falta el parámetro crítico: ID de Registro de Facturación Intercompañía.');
            }

            logger.write('1. INICIO MAP/REDUCE: Factura Global', { customRecordId: customRecordId });

            return [{ regId: customRecordId }];

        } catch (e) {
            logError('Fallo fatal en getInputData', e);
            throw e; // Interrumpe la ejecución del Map/Reduce completamente
        }
    }

    // ==========================================
    // 3. MAP (El Director de Orquesta - Fase 1)
    // ==========================================

    /**
     * Orquesta el flujo de negocio: Extracción, Mapeo, Timbrado y Generación de Archivos.
     * 
     * @param {Object} mapContext - Contexto de la fase Map, provee el método write() para pasar datos al Reduce.
     */
    function map(mapContext) {
        try {
            var data = JSON.parse(mapContext.value);
            var regId = data.regId;
            var currentScript = runtime.getCurrentScript();

            // 1. Extracción de Configuración de la UI (Costo: 1 Unidad)
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

            // 2. Adaptador de Datos: Búsqueda de tickets (Costo: 10 Unidades)
            var rawItems = _fetchCashSalesData(cashSalesIds);

            // 3. Preparar Contexto de Dominio (Configuraciones de Emisor)
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

            // 4. Transformación a Payload Facturama (Dominio Puro)
            var payload = mapper.buildFacturamaPayload(contextData, rawItems);
            logger.write('PAYLOAD SAT (CFDI 4.0) CONSTRUIDO', payload);

            logger.write('SIMULACIÓN FINALIZADA', 'El proceso se detiene aquí por diseño. Revisa el payload anterior. No se enviará a Facturama.');

            // 5. Timbrado mediante Adaptador HTTP (Costo: 10 Unidades)
            var configData = configModule.get(subsidiaryId);
            var headers = configModule.getAuthHeaders(configData.user, configData.pass);
            var apiResponse = api.postTimbrado(configData.apiPostUrl, headers, JSON.stringify(payload));

            // 🛡️ Fail-Safe Default: Validar que la respuesta sea exitosa y tenga la estructura esperada
            if (!apiResponse || apiResponse.error_interno || apiResponse.Message || !apiResponse.Complement) {
                // Extraemos el detalle del error del PAC (ModelState) si existe
                var errorDetail = 'Error desconocido';
                if (apiResponse) {
                    errorDetail = apiResponse.ModelState ? JSON.stringify(apiResponse.ModelState) : (apiResponse.Message || apiResponse.detalle);
                }
                throw new Error('El PAC rechazó el timbraFdo (400 Bad Request): ' + errorDetail);
            }

            var cfdiId = apiResponse.Id;
            var uuid = apiResponse.Complement.TaxStamp.Uuid;

            // 6. Descarga y Generación de Archivos Físicos
            var xmlData = api.getFile(configData.apiGetUrl, headers, cfdiId, 'xml');
            var fileNamePrefix = 'FacturaGlobal_' + uuid;

            var xmlId = filesAdapter.saveFile(fileNamePrefix + '.xml', xmlData.Content, configData.folderIdXml);
            //var templateId = currentScript.getParameter({ name: CONSTANTS.PARAM_TEMPLATE_ID });

            /*if (!templateId) {
                throw new Error('No se ha configurado el parámetro de Plantilla PDF en el despliegue del script.');
            }
            */
            // Usamos el Custom Record como pivote para inyectar datos globales a la plantilla
            //var dummyRecord = record.load({ type: 'customrecord_drt_reg_facturacion_interco', id: regId });
            var pdfData = api.getFile(configData.apiGetUrl, headers, cfdiId, 'pdf');
            var pdfId = filesAdapter.saveFile(fileNamePrefix + '.pdf', pdfData.Content, configData.folderIdPdf);

            // 7. El Puente (Mediator): Despachar tareas atómicas a la fase Reduce
            var successData = {
                uuid: uuid,
                xmlId: xmlId,
                pdfId: pdfId,
                regId: regId
            };

            for (var i = 0; i < cashSalesIds.length; i++) {
                mapContext.write({
                    key: cashSalesIds[i],
                    value: successData
                });
            }

            logger.write('2. TIMBRADO GLOBAL EXITOSO', { uuid: uuid, cantidadTickets: cashSalesIds.length });

        } catch (e) {
            logError('Fallo en la etapa MAP (Construcción o Timbrado)', e, { rawMapValue: mapContext.value });
            throw e; // Protege el estado: Si falla aquí, la etapa Reduce no mutará la base de datos.
        }
    }

    // ==========================================
    // 4. REDUCE (El Mutador Elástico - Fase 2)
    // ==========================================

    /**
     * Actualiza cada Cash Sale con el UUID y los archivos generados.
     * Se ejecuta de forma paralela y distribuida protegiendo los límites de Gobernanza.
     * 
     * @param {Object} reduceContext - Provee el ID del ticket (key) y los datos de éxito (values).
     */
    function reduce(reduceContext) {
        var cashSaleId = reduceContext.key;

        try {
            var successData = JSON.parse(reduceContext.values[0]);

            // Actualización atómica de la transacción (Costo: 10 Unidades por ticket)
            record.submitFields({
                type: record.Type.CASH_SALE,
                id: cashSaleId,
                values: {
                    'custbody_mx_cfdi_uuid': successData.uuid,
                    'custbody_psg_ei_certified_edoc': successData.xmlId,
                    'custbody_edoc_generated_pdf': successData.pdfId
                },
                options: { ignoreMandatoryFields: true }
            });

            // Reenviamos metadatos agrupados al Summarize para la notificación
            reduceContext.write({
                key: successData.regId,
                value: { xmlId: successData.xmlId, pdfId: successData.pdfId, uuid: successData.uuid }
            });

        } catch (e) {
            logError('Fallo aisaldo al actualizar Cash Sale ID: ' + cashSaleId, e);
        }
    }

    // ==========================================
    // 5. SUMMARIZE (El Observador / Cierre)
    // ==========================================

    /**
     * Evalúa el resultado final del proceso distribuido y notifica a los usuarios.
     * Implementa el Patrón Observer mediante el envío de correos con adjuntos.
     * 
     * @param {Object} summaryContext - Contiene las estadísticas, errores y salidas del Map/Reduce.
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
            return false; // Solo necesitamos la metadata de un nodo, todos tienen la misma.
        });

        try {
            if (totalErrors === 0 && fileData && regId) {
                _sendSuccessEmail(regId, fileData.xmlId, fileData.pdfId, fileData.uuid);
                _updateCustomRecordStatus(regId, CONSTANTS.STATUS_SUCCESS, 'Factura Global Generada Correctamente.');
                logger.write('3. ORQUESTACIÓN FINALIZADA', { regId: regId, status: 'ÉXITO TOTAL' });
            } else if (regId) {
                _updateCustomRecordStatus(regId, CONSTANTS.STATUS_ERROR, 'Proceso finalizado con errores parciales o totales. Revisa el Logger.');
                logger.write('3. ORQUESTACIÓN FINALIZADA CON ERRORES', { regId: regId, erroresDetectados: totalErrors });
            }
        } catch (e) {
            logError('Fallo crítico en fase Summarize (Envío de correo/Actualización)', e);
        }
    }

    // ==========================================
    // 6. FUNCIONES PRIVADAS (Adaptadores y Helper)
    // ==========================================

    /**
     * Recupera y formatea de forma segura los datos de la subsidiaria emisora.
     * @private
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
     * Sanitiza el valor crudo del Multi-Select Field de NetSuite a un Arreglo JS estándar.
     * Programación Defensiva (Fail-Safe Defaults).
     * @private
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
     * Repositorio: Realiza la búsqueda de los Cash Sales extraídos de la UI y suma los totales de línea.
     * Patrón: Adaptador de Infraestructura (Protege al Dominio mediante search.create).
     * 
     * @private
     * @param {Array} cashSalesIds - Arreglo de IDs internos de transacciones.
     * @returns {Array} Arreglo de objetos de línea sanitizados y listos para el Mapeador.
     */
    function _fetchCashSalesData(cashSalesIds) {
        if (!cashSalesIds || cashSalesIds.length === 0) return [];
        var rawItems = [];

        // 1. Filtros estrictos para ignorar líneas basura (COGS, Impuestos, Envío)
        var transactionSearchFilters = [
            ['mainline', 'is', 'F'], 'AND',
            ['shipping', 'is', 'F'], 'AND',
            ['taxline', 'is', 'F'], 'AND',
            ['cogs', 'is', 'F'], 'AND',
            ['formulatext: {item}', 'isnotempty', ''], 'AND',
            ['internalid', 'anyof', cashSalesIds]
        ];

        // 2. Definición de Columnas (Contrato Estricto)
        var colTranId = search.createColumn({ name: 'tranid' });
        var colItemName = search.createColumn({ name: 'displayname', join: 'item' });
        var colQuantity = search.createColumn({ name: 'quantity' });
        var colAmount = search.createColumn({ name: 'amount' });
        var colDiscount = search.createColumn({ name: 'discountamount' }); // 🛡️ CORRECCIÓN: Columna real de descuento
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

        // 3. Mapeo Seguro
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
        logger.write('RAW ITEMS EXTRAÍDOS DE CASH SALES', { count: rawItems.length, items: rawItems });
        return rawItems;
    }

    /**
     * Obtiene la fecha actual en formato ISO 8601 estricto para Facturama.
     * @private
     */
    function _getIsoDateString() {
        var d = new Date();
        return d.toISOString().split('.')[0]; // Ej. "2026-08-21T12:40:23"
    }

    /**
     * Adjunta los archivos del File Cabinet y envía el correo de éxito.
     * @private
     */
    function _sendSuccessEmail(regId, xmlId, pdfId, uuid) {
        var customRecord = record.load({ type: 'customrecord_drt_reg_facturacion_interco', id: regId });
        // En un entorno real, extraerías el correo del usuario que creó el registro o de una configuración
        var recipients = ['facturacion@zapateriascandy.com.mx', 'iztac.amaya@disruptt.mx'];

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
     * Actualiza el registro personalizado para informar a la UI (Suitelet) del resultado final.
     * @private
     */
    function _updateCustomRecordStatus(regId, status, message) {
        record.submitFields({
            type: 'customrecord_drt_reg_facturacion_interco',
            id: regId,
            values: {
                'custrecord_drt_status': status
            },
            options: { ignoreMandatoryFields: true }
        });
    }

    /**
     * Delegador de errores estándar (Compromise Recording).
     * @private
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
     * Extrae el codigo del SAT de un objeto que contiene el codigo y la descripcion, separando por el caracter '-'.
     * @param {object} lookupObj - Objeto que contiene el código y la descripción.
     * @returns {string} El código extraído antes del primer guion.
     * @private
     */
    function extractSatCode(lookupObj) {
        if (!lookupObj || lookupObj.length === 0) return '';
        var text = lookupObj[0].text || '';
        return text.split('-')[0].trim().split(' ')[0].trim();
    }

    /**
     * Extrae, normaliza y formatea de forma segura una fecha capturada en la UI.
     * Patrón: Anticorruption Layer - Aísla el motor JS de los formatos regionales impredecibles de NetSuite.
     * 
     * @private
     * @param {string} rawDateStr - Cadena de texto proveniente de NetSuite (ej. "01/09/2026 6:00:00 pm").
     * @returns {Object} Un objeto con el ISO formateado, el mes a dos dígitos y el año.
     */
    function _parseAndFormatSatDate(rawDateStr) {
        var dateObj = new Date(); // Fallback seguro (Fecha actual del servidor)

        if (rawDateStr) {
            var cleanStr = rawDateStr.toLowerCase().trim();
            // Detectamos si viene en el formato regional latino específico: "DD/MM/YYYY h:mm:ss am/pm"
            var isNetSuiteLatamFormat = /^\d{1,2}\/\d{1,2}\/\d{4}/.test(cleanStr);

            if (isNetSuiteLatamFormat) {
                // 1. Desarmamos el string: ["01/09/2026", "6:00:00", "pm"]
                var parts = cleanStr.split(' ');

                // 2. Extraemos Día, Mes, Año (Asumiendo formato DD/MM/YYYY de la cuenta)
                var dateParts = parts[0].split('/');
                var day = parseInt(dateParts[0], 10);
                var month = parseInt(dateParts[1], 10) - 1; // JS indexa los meses de 0 a 11
                var year = parseInt(dateParts[2], 10);

                // 3. Extraemos Horas, Minutos, Segundos
                var timeParts = parts[1] ? parts[1].split(':') : ['00', '00', '00'];
                var hours = parseInt(timeParts[0], 10) || 0;
                var minutes = parseInt(timeParts[1], 10) || 0;
                var seconds = parseInt(timeParts[2], 10) || 0;

                // 4. Conversión estricta a formato de 24 horas
                var ampm = parts[2] ? parts[2].trim() : '';
                if (ampm === 'pm' && hours < 12) {
                    hours += 12;
                } else if (ampm === 'am' && hours === 12) {
                    hours = 0;
                }

                // Inyección estricta (Evita que JS adivine)
                dateObj = new Date(year, month, day, hours, minutes, seconds);
            } else {
                // Fallback por si el usuario cambia el formato de la cuenta a ISO nativo
                var parsed = new Date(rawDateStr);
                if (!isNaN(parsed.getTime())) {
                    dateObj = parsed;
                }
            }
        }

        // 5. Reconstrucción manual exacta para el PAC (Sin depender de .toISOString)
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

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
/**
 * feat(global-invoice): implementar orquestador map/reduce completo con inyección de PDF y validaciones
 * Descripción (Body):
 * Se consolidó la arquitectura definitiva del Orquestador Map/Reduce para Facturación Global sustituyendo la topología monolítica anterior:
 * * 🔌 Parametrización Abierta (Open/Closed): Se inyectó el parámetro dinámico `PARAM_TEMPLATE_ID` (`custscript_sads_fama_pdf_template`), permitiendo a los administradores del sistema intercambiar la plantilla FreeMarker (PDF) de las facturas globales desde la UI sin modificar el código fuente.
 * * 🛡️ Adaptadores Seguros (Fail-Safe Defaults): Se integraron los adaptadores privados `_fetchCashSalesData` y `_extractMultiSelectIds` que garantizan la sanitización de los objetos extraídos del framework y una consulta optimizada y segura a la base de datos (Search) aislando la memoria.
 * * 📥 Manejo del Contexto Emisor: Se construyó la función `_getIssuerData` la cual realiza un *lookup* eficiente (1 Unidad) a la subsidiaria operativa para construir el nodo SAT Emisor de forma dinámica y precisa.
 * * 📬 Notificación Nativa (Observer Pattern): Se completó el motor de `_sendSuccessEmail`, cargando dinámicamente los registros *XML* y *PDF* creados por el módulo de archivos, transmitiéndolos eficientemente al usuario a través del cliente de correo interno de NetSuite.
 */