/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 *
 * SADS Facturama - Generador del payload de Complemento de Pago.
 * Al guardar un Customer Payment, identifica las facturas PPD aplicadas, calcula los campos del
 * nodo "RelatedDocuments" (Facturama CFDI Complemento de Pago) y persiste el JSON en el pago
 * (custbody_sads_fama_cpago_payload) para que el orquestador de timbrado lo consuma sin recalcular.
 *
 * Alcance: solo se generan RelatedDocuments para facturas cuyo custbody_mx_txn_sat_payment_term
 * resuelva a PPD; las líneas aplicadas a facturas PUE se omiten.
 *
 * Diseño: los errores se registran (sads_fama_logger) pero NO se relanzan. Un fallo aquí no debe
 * bloquear el guardado del pago (afterSubmit propaga excepciones como rollback de la transacción).
 * Un PPD sin payload debe detectarse por monitoreo externo, no impidiendo el registro del cobro.
 */
define([
    'N/record',
    'N/query',
    './lib/sads_fama_sat_catalog',
    './lib/sads_fama_logger'
], function (record, query, satCatalog, logger) {
    'use strict';

    var FIELDS = {
        PAYLOAD: 'custbody_sads_fama_cpago_payload',
        CACHED_TAX_OBJECT: 'custbody_sads_fama_tax_object'
    };

    var SUBLIST_APPLY = 'apply';
    var ROUND_MONEY = 2;
    var ROUND_RATE = 6;

    /**
     * Tras crear/editar el pago, construye y persiste el payload de Complemento de Pago.
     * @param {Object} context - Contexto del User Event.
     * @returns {void}
     */
    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
            return;
        }

        var paymentId = context.newRecord.id;

        try {
            var paymentCurrency = context.newRecord.getText({ fieldId: 'currency' }) ||
                context.newRecord.getValue({ fieldId: 'currency' });

            var candidates = _getAppliedInvoiceCandidates(context.newRecord);
            if (candidates.length === 0) {
                logger.write('fama_payment_complement_ue: pago sin líneas aplicadas', { paymentId: paymentId });
                return;
            }

            // Filtro inicial por Método de Pago SAT: es habitual que un mismo Customer Payment
            // cierre facturas PUE (venta de contado, ya fiscalmente completa desde su propia
            // emisión) junto con facturas PPD. Las PUE no requieren Complemento de Pago ante el
            // SAT, solo necesitan quedar registradas en NetSuite. Se descartan aquí, ANTES de la
            // consulta de cabecera y del historial de pagos previos (que incluye record.load por
            // cada pago previo certificado), para no gastar esa gobernanza en facturas que de
            // todos modos se iban a excluir del payload.
            var ppdCandidates = _filterPPDCandidates(candidates);
            if (ppdCandidates.length === 0) {
                logger.write('fama_payment_complement_ue: sin facturas PPD aplicadas (filtro inicial)', {
                    paymentId: paymentId,
                    facturasAplicadas: candidates.length
                });
                return;
            }

            var invoiceIds = ppdCandidates.map(function (c) { return c.invoiceId; });
            var invoicesById = _fetchInvoiceHeaderData(invoiceIds);
            _fillPreviousPaymentsHistory(invoicesById, paymentId);

            var relatedDocuments = [];
            for (var i = 0; i < ppdCandidates.length; i++) {
                var invoiceData = invoicesById[ppdCandidates[i].invoiceId];
                if (!invoiceData) {
                    logger.write('fama_payment_complement_ue: factura no encontrada vía SuiteQL', {
                        paymentId: paymentId,
                        invoiceId: ppdCandidates[i].invoiceId
                    });
                    continue;
                }

                relatedDocuments.push(_buildRelatedDocument(invoiceData, ppdCandidates[i].amountPaid, paymentCurrency, paymentId));
            }

            if (relatedDocuments.length === 0) {
                logger.write('fama_payment_complement_ue: sin facturas PPD aplicadas', { paymentId: paymentId });
                return;
            }

            // Fail-Fast: no se persiste nada que no pase la validación. custbody_sads_fama_cpago_payload
            // ya no se re-verifica en ningún otro punto de la cadena (pi_sads_fama_connector.js dejó de
            // enriquecer/validar tras la consolidación); este es el único filtro antes de que la
            // plantilla lo transporte tal cual hacia Facturama.
            _validateRelatedDocuments(relatedDocuments, paymentId);

            _persistPayload(paymentId, context.newRecord, relatedDocuments);

        } catch (e) {
            logger.write('ERROR: fama_payment_complement_ue.afterSubmit', {
                paymentId: paymentId,
                message: e.message || e.toString(),
                stack: e.stack || (typeof e.getStackTrace === 'function' ? e.getStackTrace().join('\n') : 'Sin stack trace')
            });
        }
    }

    /**
     * Lee la sublista 'apply' del pago y agrupa los importes por factura (una factura puede tener
     * más de una línea aplicada dentro del mismo pago).
     * @private
     * @param {Record} paymentRecord - Registro del Customer Payment.
     * @returns {Array} Arreglo de { invoiceId, amountPaid }.
     */
    function _getAppliedInvoiceCandidates(paymentRecord) {
        var lineCount = paymentRecord.getLineCount({ sublistId: SUBLIST_APPLY });
        var byInvoice = {};

        for (var line = 0; line < lineCount; line++) {
            var applied = paymentRecord.getSublistValue({ sublistId: SUBLIST_APPLY, fieldId: 'apply', line: line });
            if (!applied) continue;

            var amount = parseFloat(paymentRecord.getSublistValue({ sublistId: SUBLIST_APPLY, fieldId: 'amount', line: line })) || 0;
            if (amount <= 0) continue;

            var invoiceId = paymentRecord.getSublistValue({ sublistId: SUBLIST_APPLY, fieldId: 'internalid', line: line });
            if (!invoiceId) continue;

            if (!byInvoice[invoiceId]) {
                byInvoice[invoiceId] = { invoiceId: invoiceId, amountPaid: 0 };
            }
            byInvoice[invoiceId].amountPaid = _round(byInvoice[invoiceId].amountPaid + amount, ROUND_MONEY);
        }

        return Object.keys(byInvoice).map(function (id) { return byInvoice[id]; });
    }

    /**
     * Filtro inicial: de las facturas aplicadas, conserva solo las que son PPD, con la consulta
     * más barata posible (únicamente el método de pago SAT, ninguna otra columna). Se ejecuta
     * antes que cualquier otra consulta para no gastar gobernanza en facturas PUE que de todos
     * modos quedarían fuera del Complemento de Pago.
     * @private
     * @param {Array} candidates - Arreglo de { invoiceId, amountPaid } de _getAppliedInvoiceCandidates.
     * @returns {Array} Subconjunto de `candidates` cuyas facturas son PPD.
     */
    function _filterPPDCandidates(candidates) {
        var idList = candidates.map(function (c) { return c.invoiceId; }).join(',');

        var sql =
            "SELECT t.id AS id, t.custbody_mx_txn_sat_payment_term AS paymentterm_id, " +
            "BUILTIN.DF(t.custbody_mx_txn_sat_payment_term) AS paymentterm_text " +
            "FROM transaction t WHERE t.id IN (" + idList + ")";

        var rows = query.runSuiteQL({ query: sql }).asMappedResults();

        var ppdInvoiceIds = {};
        rows.forEach(function (row) {
            if (satCatalog.isPPD(row.paymentterm_id, row.paymentterm_text)) {
                ppdInvoiceIds[row.id] = true;
            }
        });

        return candidates.filter(function (c) {
            return !!ppdInvoiceIds[c.invoiceId];
        });
    }

    /**
     * Obtiene los datos de cabecera de las facturas aplicadas vía SuiteQL.
     * Columnas confirmadas contra el bundle nativo "Mexico Compliance" (custbody_mx_cfdi_*,
     * custbody_mx_txn_sat_payment_term, currency, exchangerate, foreigntotal).
     * @private
     * @param {Array} invoiceIds - IDs internos de las facturas.
     * @returns {Object} Mapa { invoiceId: datosDeFactura }.
     */
    function _fetchInvoiceHeaderData(invoiceIds) {
        var idList = invoiceIds.join(',');

        var sql =
            "SELECT t.id AS id, t.custbody_mx_cfdi_uuid AS uuid, t.custbody_mx_cfdi_serie AS serie, " +
            "t.custbody_mx_cfdi_folio AS folio, t.tranid AS tranid, BUILTIN.DF(t.currency) AS currencyname, " +
            "t.exchangerate AS exchangerate, t.foreigntotal AS foreigntotal, " +
            "t.custbody_mx_txn_sat_payment_term AS paymentterm_id, " +
            "BUILTIN.DF(t.custbody_mx_txn_sat_payment_term) AS paymentterm_text, " +
            "t.custbody_sads_fama_tax_object AS tax_object " +
            "FROM transaction t WHERE t.id IN (" + idList + ")";

        var rows = query.runSuiteQL({ query: sql }).asMappedResults();

        var invoicesById = {};
        rows.forEach(function (row) {
            // Fallback: algunas facturas no tienen custbody_mx_cfdi_serie/folio poblados aunque
            // ya estén timbradas. El tranid ("B1653380") ya trae la combinación Serie+Folio;
            // se descompone en letras iniciales (Serie) y dígitos (Folio) cuando ambos vienen vacíos.
            var serieFolio = (!row.serie && !row.folio) ? _decomposeTranId(row.tranid) : null;

            invoicesById[row.id] = {
                invoiceId: row.id,
                uuid: row.uuid,
                serie: serieFolio ? serieFolio.serie : row.serie,
                folio: serieFolio ? serieFolio.folio : row.folio,
                currency: row.currencyname,
                exchangerate: parseFloat(row.exchangerate) || 1,
                foreignTotal: parseFloat(row.foreigntotal) || 0,
                paymentTermId: row.paymentterm_id,
                paymentTermText: row.paymentterm_text,
                cachedTaxObject: row.tax_object || null,
                previousPaymentsCount: 0,
                amountPreviouslyPaid: 0
            };
        });

        return invoicesById;
    }

    /**
     * Calcula, por factura, el conteo y monto acumulado de pagos previos YA CERTIFICADOS
     * (custbody_mx_cfdi_uuid IS NOT NULL), excluyendo el pago actual.
     *
     * Contar solo pagos timbrados deja fuera al pago actual (que aún no tiene UUID en este punto
     * del ciclo) sin ambigüedad de timing; es el mismo criterio que usa el bundle nativo
     * "Mexico Compliance" para "times_paid_invoice". El monto acumulado se obtiene cargando cada
     * pago previo y sumando su propia sublista 'apply' para esta factura, en vez de asumir un
     * nombre de columna SuiteQL no verificado para el enlace pago-factura-monto.
     * @private
     * @param {Object} invoicesById - Mapa de facturas a enriquecer (se muta en el lugar).
     * @param {number|string} currentPaymentId - ID del pago en proceso, a excluir del conteo.
     * @returns {void}
     */
    function _fillPreviousPaymentsHistory(invoicesById, currentPaymentId) {
        var invoiceIds = Object.keys(invoicesById);
        if (invoiceIds.length === 0) return;

        var sql =
            "SELECT ptl.previousdoc AS invoiceid, ptl.nextdoc AS paymentid " +
            "FROM PreviousTransactionLink ptl " +
            "JOIN transaction payment ON payment.id = ptl.nextdoc " +
            "WHERE ptl.previousdoc IN (" + invoiceIds.join(',') + ") " +
            "AND ptl.linktype = 'Payment' " +
            "AND payment.type = 'CustPymt' " +
            "AND payment.custbody_mx_cfdi_uuid IS NOT NULL " +
            "AND payment.id != " + currentPaymentId;

        var rows = query.runSuiteQL({ query: sql }).asMappedResults();

        var paymentIdsByInvoice = {};
        rows.forEach(function (row) {
            if (!paymentIdsByInvoice[row.invoiceid]) paymentIdsByInvoice[row.invoiceid] = [];
            paymentIdsByInvoice[row.invoiceid].push(row.paymentid);
        });

        // Un mismo pago previo puede aparecer para varias facturas; se carga una sola vez.
        var loadedPayments = {};

        Object.keys(paymentIdsByInvoice).forEach(function (invoiceId) {
            var inv = invoicesById[invoiceId];
            var uniquePaymentIds = _unique(paymentIdsByInvoice[invoiceId]);
            inv.previousPaymentsCount = uniquePaymentIds.length;

            var totalPrevious = 0;
            uniquePaymentIds.forEach(function (prevPaymentId) {
                if (!loadedPayments[prevPaymentId]) {
                    loadedPayments[prevPaymentId] = record.load({ type: record.Type.CUSTOMER_PAYMENT, id: prevPaymentId });
                }
                totalPrevious += _amountAppliedToInvoice(loadedPayments[prevPaymentId], invoiceId);
            });

            inv.amountPreviouslyPaid = _round(totalPrevious, ROUND_MONEY);
        });
    }

    /**
     * Suma el importe que un pago aplicó a una factura específica (sublista 'apply').
     * @private
     * @param {Record} paymentRecord - Registro del Customer Payment.
     * @param {number|string} invoiceId - ID de la factura a consultar.
     * @returns {number} Importe total aplicado a esa factura.
     */
    function _amountAppliedToInvoice(paymentRecord, invoiceId) {
        var lineCount = paymentRecord.getLineCount({ sublistId: SUBLIST_APPLY });
        var total = 0;

        for (var line = 0; line < lineCount; line++) {
            var applied = paymentRecord.getSublistValue({ sublistId: SUBLIST_APPLY, fieldId: 'apply', line: line });
            if (!applied) continue;

            var lineInvoiceId = paymentRecord.getSublistValue({ sublistId: SUBLIST_APPLY, fieldId: 'internalid', line: line });
            if (String(lineInvoiceId) !== String(invoiceId)) continue;

            total += parseFloat(paymentRecord.getSublistValue({ sublistId: SUBLIST_APPLY, fieldId: 'amount', line: line })) || 0;
        }

        return total;
    }

    /**
     * Construye un nodo RelatedDocuments para una factura aplicada.
     * @private
     * @param {Object} invoiceData - Datos de cabecera e historial de la factura.
     * @param {number} amountPaid - Importe pagado en esta parcialidad.
     * @param {string} paymentCurrency - Moneda del pago.
     * @param {number|string} paymentId - ID del pago en proceso.
     * @returns {Object} Nodo RelatedDocuments para el payload de Facturama.
     * @throws {Error} Si el saldo anterior de la primera parcialidad no cuadra con el total.
     */
    function _buildRelatedDocument(invoiceData, amountPaid, paymentCurrency, paymentId) {
        var previousBalance = _round(invoiceData.foreignTotal - invoiceData.amountPreviouslyPaid, ROUND_MONEY);
        var partialityNumber = invoiceData.previousPaymentsCount + 1;
        var outstandingBalance = _round(previousBalance - amountPaid, ROUND_MONEY);
        if (outstandingBalance < 0) outstandingBalance = 0; // Tolerancia a redondeo; no debe quedar negativo.

        // Invariante fiscal: en la primera parcialidad el saldo anterior debe igualar el total de
        // la factura. Fail-Fast si no cuadra (mismo criterio que sads_fama_global_mapper.js).
        if (partialityNumber === 1 && Math.abs(previousBalance - invoiceData.foreignTotal) > 0.05) {
            throw new Error(
                'FAIL-FAST: Saldo anterior inconsistente en la primera parcialidad de la factura ' +
                invoiceData.invoiceId + '. Total factura: ' + invoiceData.foreignTotal +
                ' | Saldo anterior calculado: ' + previousBalance +
                '. Revisar historial de pagos ligados antes de timbrar.'
            );
        }

        var taxObject = invoiceData.cachedTaxObject || satCatalog.computeInvoiceTaxObject(invoiceData.invoiceId);

        var relatedDocument = {
            "TaxObject": taxObject,
            "Uuid": invoiceData.uuid,
            "Serie": invoiceData.serie,
            "Folio": invoiceData.folio,
            "Currency": invoiceData.currency,
            "PaymentMethod": "PPD",
            "PartialityNumber": String(partialityNumber),
            "PreviousBalanceAmount": previousBalance.toFixed(ROUND_MONEY),
            "AmountPaid": amountPaid.toFixed(ROUND_MONEY),
            "ImpSaldoInsoluto": outstandingBalance.toFixed(ROUND_MONEY),
            "Taxes": _buildProratedTaxes(invoiceData, amountPaid)
        };

        // EquivalenceDocRel solo aplica cuando la moneda de la factura difiere de la del pago.
        // ASUNCIÓN NO VALIDADA EN SANDBOX: se calcula como 1/exchangerate de la factura,
        // consistente con el ejemplo de Facturama (0.049 ~= 1/20.4), pero la dirección exacta
        // del TipCambioDR (Anexo 20 SAT) debe confirmarse con un timbrado de prueba real antes
        // de producción.
        if (invoiceData.currency && paymentCurrency && invoiceData.currency !== paymentCurrency) {
            relatedDocument.EquivalenceDocRel = _round(1 / invoiceData.exchangerate, ROUND_RATE);
        }

        return relatedDocument;
    }

    /**
     * Prorratea el IVA de la factura relacionada en proporción al monto pagado en esta parcialidad
     * (multiplier = amountPaid / total), mismo criterio que el bundle nativo. Simplificado a un
     * único renglón de IVA, consistente con sads_fama_global_mapper.js.
     *
     * NOTA: no se usa transactionTaxDetail.basetaxamount para la Base. Ese campo no es la base
     * gravable (esa es taxbasis, ya removido en esta cuenta) — por el patrón de valores obtenidos
     * en producción (Base idéntica a Total, ambas en el importe del impuesto) todo indica que
     * representa el importe del impuesto en moneda base, no una base gravable. La Base se deriva
     * matemáticamente de Tax/Rate, que es la relación que el propio SAT exige de cualquier forma.
     *
     * taxamount llega en negativo desde SuiteQL (convención contable de NetSuite para el lado de
     * la línea, no el importe cobrado); se normaliza con Math.abs, mismo patrón que ya usa
     * sads_fama_global_mapper.js para discountamount.
     * @private
     * @param {Object} invoiceData - Datos de cabecera de la factura.
     * @param {number} amountPaid - Importe pagado en esta parcialidad.
     * @returns {Array} Arreglo de impuestos prorrateados (vacío si la factura no tiene IVA).
     */
    function _buildProratedTaxes(invoiceData, amountPaid) {
        var multiplier = invoiceData.foreignTotal > 0 ? (amountPaid / invoiceData.foreignTotal) : 0;

        var sql =
            "SELECT SUM(ttd.taxamount) AS tax, MAX(ttd.taxrate) AS rate " +
            "FROM transactionLine tl " +
            "JOIN transactionTaxDetail ttd ON tl.id = ttd.line AND tl.transaction = ttd.transaction " +
            "WHERE tl.transaction = " + invoiceData.invoiceId;

        var rows = query.runSuiteQL({ query: sql }).asMappedResults();
        if (!rows.length || rows[0].tax === null) {
            return [];
        }

        var tax = _round(Math.abs(parseFloat(rows[0].tax) || 0) * multiplier, ROUND_MONEY);
        var rate = _round(Math.abs(parseFloat(rows[0].rate) || 0), ROUND_RATE);
        var base = rate > 0 ? _round(tax / rate, ROUND_MONEY) : 0;

        return [{
            "Total": tax,
            "Name": "IVA",
            "Base": base,
            "Rate": rate,
            "IsRetention": false
        }];
    }

    /**
     * Valida que el arreglo RelatedDocuments esté completo y bien tipado antes de persistirlo.
     * No es una revalidación fiscal (eso ya lo hace _buildRelatedDocument) sino una red de
     * seguridad estructural: detecta strings vacíos, valores no numéricos, NaN silencioso
     * (JSON.stringify convierte NaN/Infinity en null sin avisar) y arreglos vacíos donde no
     * deberían estarlo, antes de que la plantilla FreeMarker transporte el JSON sin más filtros.
     *
     * Recolecta TODOS los errores encontrados (no se detiene en el primero) y los reporta en un
     * solo registro vía sads_fama_logger, para diagnosticar de una sola corrida en vez de una
     * excepción a la vez. Solo al final, si hubo al menos un error, se lanza una excepción
     * resumen (Fail-Fast: no se persiste un payload que no pasó la validación completa).
     * @private
     * @param {Array} relatedDocuments - Nodos RelatedDocuments ya construidos.
     * @param {number|string} paymentId - ID del pago, para contexto en el log y el mensaje de error.
     * @returns {void}
     * @throws {Error} Si se encontró al menos un error de validación.
     */
    function _validateRelatedDocuments(relatedDocuments, paymentId) {
        var UUID_REGEX = /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/;
        var REQUIRED_STRING_FIELDS = [
            'TaxObject', 'Uuid', 'Folio', 'Currency', 'PaymentMethod',
            'PartialityNumber', 'PreviousBalanceAmount', 'AmountPaid', 'ImpSaldoInsoluto'
        ];
        var NUMERIC_STRING_FIELDS = ['PreviousBalanceAmount', 'AmountPaid', 'ImpSaldoInsoluto'];

        var errors = [];

        function fail(index, message) {
            errors.push('RelatedDocument #' + index + ': ' + message);
        }

        function isEmpty(value) {
            return value === null || value === undefined || String(value).trim() === '';
        }

        if (!Array.isArray(relatedDocuments) || relatedDocuments.length === 0) {
            errors.push('El pago no generó ningún RelatedDocument.');
        } else {
            relatedDocuments.forEach(function (doc, index) {
                REQUIRED_STRING_FIELDS.forEach(function (field) {
                    if (isEmpty(doc[field])) {
                        fail(index, 'la propiedad "' + field + '" está vacía o ausente.');
                    }
                });

                if (!isEmpty(doc.Uuid) && !UUID_REGEX.test(doc.Uuid)) {
                    fail(index, 'el Uuid "' + doc.Uuid + '" tiene un formato inválido.');
                }

                NUMERIC_STRING_FIELDS.forEach(function (field) {
                    if (isEmpty(doc[field])) return; // ya reportado arriba, evita mensaje duplicado
                    var num = parseFloat(doc[field]);
                    if (isNaN(num) || !isFinite(num)) {
                        fail(index, '"' + field + '" = "' + doc[field] + '" no es un número válido.');
                    }
                });

                if (!isEmpty(doc.PartialityNumber)) {
                    var partialityNumber = parseInt(doc.PartialityNumber, 10);
                    if (isNaN(partialityNumber) || partialityNumber < 1) {
                        fail(index, 'PartialityNumber inválido: "' + doc.PartialityNumber + '".');
                    }
                }

                if (!isEmpty(doc.PaymentMethod) && doc.PaymentMethod !== 'PPD') {
                    fail(index, 'PaymentMethod "' + doc.PaymentMethod + '"; se esperaba "PPD".');
                }

                if (!Array.isArray(doc.Taxes)) {
                    fail(index, '"Taxes" ausente o con formato inválido (se esperaba un arreglo).');
                } else {
                    // TaxObject "02" (Sí objeto de impuesto) sin ningún renglón de Taxes es una
                    // inconsistencia: o falta el impuesto, o el ObjetoImp está mal calculado.
                    if (doc.TaxObject === '02' && doc.Taxes.length === 0) {
                        fail(index, 'declara TaxObject "02" (sí objeto de impuesto) pero Taxes llegó vacío.');
                    }

                    doc.Taxes.forEach(function (tax, taxIndex) {
                        ['Total', 'Base', 'Rate'].forEach(function (field) {
                            var value = tax[field];
                            if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
                                fail(index, 'el impuesto #' + taxIndex + ' tiene "' + field + '" = ' +
                                    JSON.stringify(value) + ', que no es un número válido.');
                            }
                        });
                        if (isEmpty(tax.Name)) {
                            fail(index, 'el impuesto #' + taxIndex + ' no tiene "Name".');
                        }
                    });
                }

                if (doc.EquivalenceDocRel !== undefined) {
                    var equivalence = doc.EquivalenceDocRel;
                    if (typeof equivalence !== 'number' || isNaN(equivalence) || !isFinite(equivalence) || equivalence <= 0) {
                        fail(index, 'EquivalenceDocRel inválido: ' + JSON.stringify(equivalence) + '.');
                    }
                }
            });
        }

        if (errors.length === 0) {
            return;
        }

        logger.write('ERROR: fama_payment_complement_ue - validación de RelatedDocuments falló', {
            paymentId: paymentId,
            cantidadErrores: errors.length,
            errores: errors,
            relatedDocumentsRecibidos: relatedDocuments
        });

        throw new Error(
            'FAIL-FAST: El pago ' + paymentId + ' tiene ' + errors.length +
            ' error(es) de validación en RelatedDocuments. Ver el detalle completo en sads_fama_logger.'
        );
    }

    /**
     * Descompone un tranid como "B1653380" en su Serie ("B") y Folio ("1653380"), para usarlo
     * como respaldo cuando custbody_mx_cfdi_serie/folio no están poblados en la factura aunque
     * ya esté timbrada.
     * @private
     * @param {string} tranId - Número de transacción de NetSuite (tranid).
     * @returns {{serie: (string|null), folio: (string|null)}}
     */
    function _decomposeTranId(tranId) {
        if (!tranId) {
            return { serie: null, folio: null };
        }

        var match = String(tranId).match(/^([A-Za-z\-]*)(\d+)$/);
        if (!match) {
            return { serie: null, folio: String(tranId) };
        }

        return {
            serie: match[1] || null,
            folio: match[2]
        };
    }

    /**
     * Persiste el payload de Complemento de Pago en el registro del pago.
     * @private
     * @param {number|string} paymentId - ID del Customer Payment.
     * @param {Record} paymentRecord - Registro del pago (para comparar el valor actual).
     * @param {Array} relatedDocuments - Nodos RelatedDocuments a serializar.
     * @returns {void}
     */
    function _persistPayload(paymentId, paymentRecord, relatedDocuments) {
        var newPayload = JSON.stringify(relatedDocuments);
        var currentPayload = paymentRecord.getValue({ fieldId: FIELDS.PAYLOAD });

        // Evita una escritura (y un posible re-disparo del propio evento) si no hay cambios.
        if (currentPayload === newPayload) {
            return;
        }

        var values = {};
        values[FIELDS.PAYLOAD] = newPayload;

        record.submitFields({
            type: record.Type.CUSTOMER_PAYMENT,
            id: paymentId,
            values: values,
            options: { enablesourcing: false, ignoreMandatoryFields: true }
        });

        logger.write('fama_payment_complement_ue: payload generado', {
            paymentId: paymentId,
            relatedDocuments: relatedDocuments
        });
    }

    /**
     * Redondea un número a la cantidad de decimales indicada.
     * @private
     * @param {number} num - Número a redondear.
     * @param {number} decimals - Cantidad de decimales.
     * @returns {number} Número redondeado.
     */
    function _round(num, decimals) {
        var multiplier = Math.pow(10, decimals);
        return Math.round(num * multiplier) / multiplier;
    }

    /**
     * Devuelve los elementos únicos de un arreglo preservando el orden.
     * @private
     * @param {Array} arr - Arreglo de entrada.
     * @returns {Array} Arreglo sin duplicados.
     */
    function _unique(arr) {
        var seen = {};
        var result = [];
        for (var i = 0; i < arr.length; i++) {
            var key = String(arr[i]);
            if (!seen[key]) {
                seen[key] = true;
                result.push(arr[i]);
            }
        }
        return result;
    }

    return { afterSubmit: afterSubmit };
});
