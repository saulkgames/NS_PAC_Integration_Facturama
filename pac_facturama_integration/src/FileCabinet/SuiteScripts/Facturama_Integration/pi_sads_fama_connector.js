/**
 * @NApiVersion 2.0
 * @NScriptType plugintypeimpl
 * @NModuleScope Public
 *
 * SADS Facturama - Plug-in de timbrado individual (Sending Method).
 */
define([
    'N/search',
    'N/record',
    'N/https', // TODO (Arquitectura): remover a futuro y delegar 100% en apiModule
    './lib/sads_fama_logger',
    './lib/sads_fama_config',
    './lib/sads_fama_api',
    './lib/sads_fama_files',
    './lib/sads_fama_cfdi',
    './lib/sads_fama_response_handler'
], function (search, record, https, logger, configModule, apiModule, filesModule, cfdiModule, responseHandler) {
    'use strict';

    var CONSTANTS = {
        BUNDLE_ID: '436209',
        BUNDLE_NAME: 'Mexico Compliance',
        STATUS_ERROR: '4'
    };

    /**
     * Punto de entrada del plug-in. Orquesta el flujo completo: validación, configuración,
     * timbrado en el PAC, análisis de respuesta y generación de XML/PDF.
     * @param {Object} plugInContext - Contexto inyectado por el framework de NetSuite.
     * @param {Object} plugInContext.transaction - Datos básicos de la transacción (id, type, tranType).
     * @param {Object} [plugInContext.customer] - Cliente asociado (id).
     * @param {string} plugInContext.eInvoiceContent - Payload JSON/XML generado por el estándar de NetSuite.
     * @param {number|string} plugInContext.userId - ID del usuario que ejecuta la acción.
     * @returns {Object} Respuesta estandarizada requerida por el EI Framework (eiStatus, message, success).
     */
    function send(plugInContext) {
        var txnId = (plugInContext.transaction && plugInContext.transaction.id) ? plugInContext.transaction.id : 'DESCONOCIDO';
        logger.write('1. INICIO FLUJO ORQUESTADOR', 'Plug-in invocado para transacción ID: ' + txnId);

        try {
            // Paso 1: Validación de entrada
            var rawPayload = plugInContext.eInvoiceContent;
            if (!rawPayload) throw new Error('eInvoiceContent vacío provisto por el framework.');
            
            var originalPayload = apiModule.safeParse(rawPayload);
            var txnType = plugInContext.transaction.tranType || plugInContext.transaction.type;

            // Paso 1.5: Enriquecimiento de Complemento de Pago (TaxObject/EquivalenceDocRel)
            // La plantilla FreeMarker de Customer Payment no puede completar estos campos por sí
            // sola: el hook nativo (customerPayment.js, bundle Mexico Compliance) no expone el
            // ObjetoImp ni el tipo de cambio de la factura relacionada en custom.appliedTxns.
            // Fail-Fast intencional: si el enriquecimiento no se puede completar o validar para
            // TODOS los RelatedDocuments, se aborta el envío completo (no se contacta a Facturama)
            // en vez de timbrar con datos fiscales incompletos. La excepción sube al catch general
            // de send(), que ya registra el error vía logError y devuelve el intento como fallido.
            if (originalPayload && originalPayload.CfdiType === 'P') {
                _enrichRelatedDocuments(originalPayload);
                rawPayload = JSON.stringify(originalPayload);
            }

            // Paso 2: Obtención de configuración
            var txnLookup = search.lookupFields({
                type: search.Type.TRANSACTION,
                id: txnId,
                columns: ['subsidiary', 'tranid']
            });

            // Validar la subsidiaria antes de leer la posición [0]
            if (!txnLookup.subsidiary || txnLookup.subsidiary.length === 0) {
                throw new Error('La transacción no tiene una subsidiaria asignada.');
            }

            var configData = configModule.get(txnLookup.subsidiary[0].value);
            var headers = configModule.getAuthHeaders(configData.user, configData.pass);

            // Paso 3: Comunicación con el PAC (fuga de abstracción mantenida por compatibilidad)
            var postResp = https.post({ url: configData.apiPostUrl, headers: headers, body: rawPayload });
            var parsedBody = apiModule.safeParse(postResp.body);

            // Paso 4: Análisis de respuesta
            var statusAnalysis = responseHandler.analyzeResponse(postResp.code, parsedBody);

            if (!statusAnalysis.success) {
                logger.write('FALLO EN TIMBRADO (PAC)', statusAnalysis.details);
                return _buildFrameworkReturn(plugInContext, statusAnalysis.eDocStatus, statusAnalysis.details, false, {});
            }

            // Paso 5: Construcción y guardado de archivos (XML y PDF)
            var facturamaData = parsedBody;
            var cfdiId = facturamaData.Id;
            var uuid = facturamaData.Complement && facturamaData.Complement.TaxStamp ? facturamaData.Complement.TaxStamp.Uuid : 'UUID_N/A';
            var filePrefix = txnLookup.tranid + '_' + uuid;

            var xmlData = apiModule.getFile(configData.apiGetUrl, headers, cfdiId, 'xml');
            var xmlContent = (xmlData && xmlData.Content) ? xmlData.Content : 'XML_VACIO';
            var xmlFileId = filesModule.saveFile('CFDI_' + filePrefix + '.xml', xmlContent);

            var extraFields = cfdiModule.buildExtraFields(originalPayload, facturamaData, xmlFileId, cfdiId, xmlContent);

            var txnRecordFull = record.load({ type: txnType, id: txnId });
            var customerRecordFull = plugInContext.customer ? record.load({ type: 'customer', id: plugInContext.customer.id }) : null;

            if (!configData.templates[txnType]) {
                throw new Error('No hay plantilla PDF configurada para el tipo de transacción: ' + txnType);
            }

            var pdfFileId = filesModule.generateCertifiedPdf(txnRecordFull, customerRecordFull, configData.templates[txnType], extraFields, filePrefix + '.pdf');
            extraFields['custbody_edoc_generated_pdf'] = pdfFileId;
            extraFields['custbody_sads_fama_cfdi_resp_id'] = cfdiId;

            // Paso 6: Retorno exitoso
            var finalReturn = _buildFrameworkReturn(plugInContext, statusAnalysis.eDocStatus, statusAnalysis.details, true, extraFields);
            logger.write('FIN EXITOSO'+ JSON.stringify({ transactionId: txnId, uuid: uuid }), finalReturn);
            
            return finalReturn;

        } catch (ex) {
            logError('ERROR FATAL EN ORQUESTADOR', ex, { transactionId: txnId });
            
            var errorMsg = 'Excepción interna: ' + (ex.message || 'Error desconocido');
            return _buildFrameworkReturn(plugInContext, CONSTANTS.STATUS_ERROR, errorMsg, false, {});
        }
    }

    /**
     * Construye el objeto estandarizado que requiere el framework de NetSuite para actualizar
     * los registros tras un intento de envío.
     * @private
     * @param {Object} plugInContext - Contexto original inyectado por NetSuite.
     * @param {string} eDocStatus - Estado final del documento (ej. '3' certificado, '4' error).
     * @param {string} detailsMsg - Mensaje descriptivo del resultado.
     * @param {boolean} isSuccess - Indica si la operación fue exitosa y permite actualizar campos.
     * @param {Object} extraFields - IDs de campos custom a actualizar en la transacción.
     * @returns {Object} Estructura requerida por `app_einvoice_sending_manager.js`.
     */
    function _buildFrameworkReturn(plugInContext, eDocStatus, detailsMsg, isSuccess, extraFields) {
        var txn = plugInContext.transaction || {};
        var cust = plugInContext.customer || {};

        var finalResult = {
            transactionId: txn.id || '',
            transactionType: txn.tranType || txn.type || '',
            entity: cust.id || undefined,
            eDocStatus: eDocStatus,
            eventType: eDocStatus,
            details: detailsMsg,
            owner: plugInContext.userId || undefined,
            isUpdateFields: isSuccess,
            extraFieldsForUpdate: extraFields || {},
            bundleId: CONSTANTS.BUNDLE_ID,
            bundleName: CONSTANTS.BUNDLE_NAME
        };

        logger.write('Funcion _buildFrameworkReturn ejecutada, resultado construido para el framework', finalResult);

        return {
            eiStatus: finalResult,
            message: isSuccess ? '' : detailsMsg, // El framework usa `message` solo para los errores
            success: isSuccess
        };
    }

    /**
     * Completa, en el payload ya parseado de un Complemento de Pago, los campos que la plantilla
     * FreeMarker no puede resolver por sí sola (TaxObject y, cuando aplica, EquivalenceDocRel de
     * cada RelatedDocument). Muta `payload` in-place.
     *
     * Fail-Fast deliberado: cualquier condición que impida garantizar que un RelatedDocument
     * queda fiscalmente completo lanza una excepción y aborta TODO el envío (no se llega a
     * contactar a Facturama). Se prefiere no timbrar a timbrar con datos incompletos que nadie
     * notaría salvo revisando el log manualmente.
     *
     * @private
     * @param {Object} payload - Payload CfdiType "P" ya parseado (objeto, no string).
     * @returns {void}
     * @throws {Error} Si falta el Uuid, no se encuentra la factura, no tiene ObjetoImp cacheado,
     *   o se necesita EquivalenceDocRel y no hay tipo de cambio disponible.
     */
    function _enrichRelatedDocuments(payload) {
        if (!payload.Complemento || !payload.Complemento.Payments) {
            throw new Error('FAIL-FAST: Payload CfdiType "P" sin nodo Complemento.Payments; no se puede armar el Complemento de Pago.');
        }

        var uuids = [];
        payload.Complemento.Payments.forEach(function (payment) {
            (payment.RelatedDocuments || []).forEach(function (doc) {
                if (!doc.Uuid) {
                    throw new Error('FAIL-FAST: Un RelatedDocument llegó sin Uuid; no se puede identificar la factura relacionada.');
                }
                if (uuids.indexOf(doc.Uuid) === -1) {
                    uuids.push(doc.Uuid);
                }
            });
        });

        if (uuids.length === 0) {
            throw new Error('FAIL-FAST: El Complemento de Pago no tiene ningún RelatedDocument; revisar la plantilla o los datos aplicados del pago.');
        }

        var invoiceDataByUuid = _fetchRelatedInvoiceData(uuids);

        payload.Complemento.Payments.forEach(function (payment) {
            var paymentCurrency = _normalizeCurrency(payment.Currency);

            (payment.RelatedDocuments || []).forEach(function (doc) {
                var invoiceData = invoiceDataByUuid[doc.Uuid];
                if (!invoiceData) {
                    throw new Error('FAIL-FAST: No se encontró ninguna factura con Uuid ' + doc.Uuid + '. Verificar que no haya sido eliminada/anulada o que el Uuid coincida exactamente.');
                }

                if (!invoiceData.taxObject) {
                    throw new Error('FAIL-FAST: La factura con Uuid ' + doc.Uuid + ' no tiene custbody_sads_fama_tax_object poblado. Guardarla de nuevo para que el User Event la cachee, o correr el backfill pendiente.');
                }
                doc.TaxObject = invoiceData.taxObject;

                // ASUNCIÓN NO VALIDADA EN SANDBOX: se calcula como 1/exchangerate de la factura,
                // consistente con el ejemplo de Facturama (0.049 ~= 1/20.4); confirmar dirección
                // exacta del TipCambioDR (Anexo 20 SAT) con un timbrado de prueba real.
                var docCurrency = _normalizeCurrency(doc.Currency);
                if (docCurrency && paymentCurrency && docCurrency !== paymentCurrency) {
                    if (!invoiceData.exchangerate) {
                        throw new Error('FAIL-FAST: La factura con Uuid ' + doc.Uuid + ' está en moneda distinta a la del pago (' + doc.Currency + ' vs ' + payment.Currency + ') pero no tiene tipo de cambio disponible para calcular EquivalenceDocRel.');
                    }
                    doc.EquivalenceDocRel = _round(1 / invoiceData.exchangerate, 6);
                }
            });
        });
    }

    /**
     * Busca, por UUID de CFDI, el ObjetoImp cacheado y el tipo de cambio de cada factura.
     * @private
     * @param {Array<string>} uuids - UUIDs de las facturas relacionadas del Complemento de Pago.
     * @returns {Object} Mapa { uuid: { taxObject, exchangerate } }.
     */
    function _fetchRelatedInvoiceData(uuids) {
        var result = {};

        var uuidFilterExpr = [];
        uuids.forEach(function (uuid, index) {
            if (index > 0) uuidFilterExpr.push('OR');
            uuidFilterExpr.push(['custbody_mx_cfdi_uuid', 'is', uuid]);
        });

        var colUuid = search.createColumn({ name: 'custbody_mx_cfdi_uuid' });
        var colTaxObject = search.createColumn({ name: 'custbody_sads_fama_tax_object' });
        var colExchangeRate = search.createColumn({ name: 'exchangerate' });

        var invoiceSearch = search.create({
            type: search.Type.TRANSACTION,
            filters: [
                ['mainline', 'is', 'T'], 'AND',
                uuidFilterExpr
            ],
            columns: [colUuid, colTaxObject, colExchangeRate]
        });

        invoiceSearch.run().each(function (row) {
            var uuid = row.getValue(colUuid);
            result[uuid] = {
                taxObject: row.getValue(colTaxObject) || null,
                exchangerate: parseFloat(row.getValue(colExchangeRate)) || null
            };
            return true;
        });

        return result;
    }

    /**
     * Utilidad de redondeo (evita errores de precisión de punto flotante).
     * @private
     * @param {number} num
     * @param {number} decimals
     * @returns {number}
     */
    function _round(num, decimals) {
        var multiplier = Math.pow(10, decimals);
        return Math.round(num * multiplier) / multiplier;
    }

    /**
     * Normaliza un código de moneda para comparar sin falsos negativos por mayúsculas o espacios.
     * @private
     * @param {string} currency
     * @returns {string}
     */
    function _normalizeCurrency(currency) {
        return (currency || '').trim().toUpperCase();
    }

    /**
     * Registra un error de forma estandarizada a través del logger central.
     * @private
     * @param {string} customMessage - Contexto de dónde ocurrió el fallo.
     * @param {Error|Object} e - Excepción capturada.
     * @param {Object} contextData - Estado relevante para reproducir el error.
     * @returns {void}
     */
    function logError(customMessage, e, contextData) {
        var errorDetails = {
            name: e.name || 'ORCHESTRATOR_ERROR',
            message: e.message || e.toString(),
            stack: e.stack || (typeof e.getStackTrace === 'function' ? e.getStackTrace().join('\n') : 'No stack trace'),
            context: contextData || {}
        };
        logger.write(customMessage, errorDetails);
    }

    /**
     * Devuelve el estado y las capacidades actuales del plug-in al framework de EI.
     * @param {Object} scriptContext - Contexto base de ejecución.
     * @returns {Object} Estado indicando soporte de procesamiento síncrono.
     */
    function getStatus(scriptContext) { 
        return { success: true, message: 'Procesamiento síncrono.' }; 
    }

    /**
     * Método requerido por la interfaz del plug-in (no implementado/delegado).
     * @param {Object} fakeSatCodesInstance - Instancia ficticia o base enviada por NetSuite.
     * @returns {void}
     */
    function setSATCodesInstance(fakeSatCodesInstance) { }

    return { 
        send: send, 
        getStatus: getStatus, 
        setSATCodesInstance: setSATCodesInstance 
    };
});
