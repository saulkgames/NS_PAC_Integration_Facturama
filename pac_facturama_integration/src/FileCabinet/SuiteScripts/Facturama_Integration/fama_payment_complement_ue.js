/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 *
 * SADS Facturama - Generador de Payload de Complemento de Pago
 * Responsabilidad: al guardar un Customer Payment, identificar las facturas PPD aplicadas,
 * calcular los campos especiales del nodo "RelatedDocuments" (Facturama CFDI Complemento de
 * Pago) y persistir el JSON resultante en el propio pago (custbody_sads_fama_cpago_payload)
 * para que el orquestador de timbrado lo consuma sin recalcular.
 *
 * Alcance por política interna: solo se generan RelatedDocuments para facturas cuyo
 * custbody_mx_txn_sat_payment_term resuelva a PPD. Las líneas aplicadas a facturas PUE se
 * omiten del arreglo.
 *
 * Nota de diseño: los errores se registran (sads_fama_logger) pero NO se relanzan. Un fallo en
 * este cálculo no debe bloquear el guardado del pago (afterSubmit propaga excepciones como
 * rollback de toda la transacción). Un PPD sin payload generado debe detectarse por monitoreo
 * externo (búsqueda guardada), no impidiendo el registro del cobro.
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

    // ==========================================
    // 1. ENTRY POINT
    // ==========================================

    /**
     * @param {Object} context
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

            var invoiceIds = candidates.map(function (c) { return c.invoiceId; });
            var invoicesById = _fetchInvoiceHeaderData(invoiceIds);
            _fillPreviousPaymentsHistory(invoicesById, paymentId);

            var relatedDocuments = [];
            for (var i = 0; i < candidates.length; i++) {
                var invoiceData = invoicesById[candidates[i].invoiceId];
                if (!invoiceData) {
                    logger.write('fama_payment_complement_ue: factura no encontrada vía SuiteQL', {
                        paymentId: paymentId,
                        invoiceId: candidates[i].invoiceId
                    });
                    continue;
                }

                if (!satCatalog.isPPD(invoiceData.paymentTermId, invoiceData.paymentTermText)) {
                    continue; // Factura PUE: fuera de alcance para Complemento de Pago.
                }

                relatedDocuments.push(_buildRelatedDocument(invoiceData, candidates[i].amountPaid, paymentCurrency, paymentId));
            }

            if (relatedDocuments.length === 0) {
                logger.write('fama_payment_complement_ue: sin facturas PPD aplicadas', { paymentId: paymentId });
                return;
            }

            _persistPayload(paymentId, context.newRecord, relatedDocuments);

        } catch (e) {
            logger.write('ERROR: fama_payment_complement_ue.afterSubmit', {
                paymentId: paymentId,
                message: e.message || e.toString(),
                stack: e.stack || (typeof e.getStackTrace === 'function' ? e.getStackTrace().join('\n') : 'Sin stack trace')
            });
        }
    }

    // ==========================================
    // 2. LECTURA DEL PAGO ACTUAL (Sublista 'apply')
    // ==========================================

    /**
     * Lee la sublista 'apply' del pago y agrupa por factura (una factura puede tener más
     * de una línea aplicada dentro del mismo pago).
     * @private
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

    // ==========================================
    // 3. DATOS BASE DE LAS FACTURAS (SuiteQL)
    // ==========================================

    /**
     * Columnas confirmadas contra el bundle nativo "Mexico Compliance" (custbody_mx_cfdi_*,
     * custbody_mx_txn_sat_payment_term, currency, exchangerate, foreigntotal).
     * @param {*} invoiceIds 
     * @private
     */
    function _fetchInvoiceHeaderData(invoiceIds) {
        var idList = invoiceIds.join(',');

        var sql =
            "SELECT t.id AS id, t.custbody_mx_cfdi_uuid AS uuid, t.custbody_mx_cfdi_serie AS serie, " +
            "t.custbody_mx_cfdi_folio AS folio, BUILTIN.DF(t.currency) AS currencyname, " +
            "t.exchangerate AS exchangerate, t.foreigntotal AS foreigntotal, " +
            "t.custbody_mx_txn_sat_payment_term AS paymentterm_id, " +
            "BUILTIN.DF(t.custbody_mx_txn_sat_payment_term) AS paymentterm_text, " +
            "t.custbody_sads_fama_tax_object AS tax_object " +
            "FROM transaction t WHERE t.id IN (" + idList + ")";

        var rows = query.runSuiteQL({ query: sql }).asMappedResults();

        var invoicesById = {};
        rows.forEach(function (row) {
            invoicesById[row.id] = {
                invoiceId: row.id,
                uuid: row.uuid,
                serie: row.serie,
                folio: row.folio,
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
     * Historial de pagos previos YA CERTIFICADOS (custbody_mx_cfdi_uuid IS NOT NULL) ligados a
     * cada factura, excluyendo explícitamente el pago actual. Patrón validado contra el bundle
     * nativo "Mexico Compliance" (ver AppliedTransactions._fulfillAppliedTransactionObject /
     * SUITEQL.CUSTOMER_PAYMENT.INVOICES_DATA), que usa exactamente este filtro para calcular
     * "times_paid_invoice". Al contar solo pagos ya timbrados, el pago actual (que aún no tiene
     * UUID en este punto del ciclo de vida) queda fuera del conteo sin ambigüedad de timing.
     *
     * El monto acumulado de cada pago previo se lee cargando el registro (record.load) y
     * sumando su propia sublista 'apply' para esta factura, en vez de asumir un nombre de
     * columna SuiteQL no verificado para el enlace pago-factura-monto.
     * @private
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

    // ==========================================
    // 4. CONSTRUCCIÓN DEL NODO RelatedDocuments
    // ==========================================

    /**
     * @private
     */
    function _buildRelatedDocument(invoiceData, amountPaid, paymentCurrency, paymentId) {
        var previousBalance = _round(invoiceData.foreignTotal - invoiceData.amountPreviouslyPaid, ROUND_MONEY);
        var partialityNumber = invoiceData.previousPaymentsCount + 1;
        var outstandingBalance = _round(previousBalance - amountPaid, ROUND_MONEY);
        if (outstandingBalance < 0) outstandingBalance = 0; // Tolerancia a redondeo; no debe quedar negativo.

        // Invariante fiscal: en la primera parcialidad, el saldo anterior debe igualar el total
        // de la factura. Fail-Fast si no cuadra (mismo criterio que sads_fama_global_mapper.js).
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
     * Prorratea el impuesto (IVA) de la factura relacionada en proporción al monto pagado en
     * esta parcialidad, siguiendo el mismo criterio que el bundle nativo
     * (AppliedTransactions._correctAmountsToRealPayments): multiplier = amountPaid / total.
     * Simplificado a un único renglón de IVA, consistente con sads_fama_global_mapper.js.
     * @private
     */
    function _buildProratedTaxes(invoiceData, amountPaid) {
        var multiplier = invoiceData.foreignTotal > 0 ? (amountPaid / invoiceData.foreignTotal) : 0;

        var sql =
            "SELECT SUM(ttd.taxbasis) AS base, SUM(ttd.taxamount) AS tax, MAX(ttd.taxrate) AS rate " +
            "FROM transactionLine tl " +
            "JOIN transactionTaxDetail ttd ON tl.id = ttd.line AND tl.transaction = ttd.transaction " +
            "WHERE tl.transaction = " + invoiceData.invoiceId;

        var rows = query.runSuiteQL({ query: sql }).asMappedResults();
        if (!rows.length || rows[0].tax === null) {
            return [];
        }

        var base = _round((parseFloat(rows[0].base) || 0) * multiplier, ROUND_MONEY);
        var tax = _round((parseFloat(rows[0].tax) || 0) * multiplier, ROUND_MONEY);
        var rate = _round(parseFloat(rows[0].rate) || 0, ROUND_RATE);

        return [{
            "Total": tax,
            "Name": "IVA",
            "Base": base,
            "Rate": rate,
            "IsRetention": false
        }];
    }

    // ==========================================
    // 5. PERSISTENCIA
    // ==========================================

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

    // ==========================================
    // 6. UTILIDADES
    // ==========================================

    function _round(num, decimals) {
        var multiplier = Math.pow(10, decimals);
        return Math.round(num * multiplier) / multiplier;
    }

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
