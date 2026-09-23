/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope Public
 *
 * SADS Facturama - Backfill de ObjetoImp (Tax Object) en Facturas Existentes
 * Recorre todas las facturas que no tienen custbody_sads_fama_tax_object poblado (creadas antes
 * de que fama_invoice_tax_object_ue.js existiera, o que nunca se volvieron a guardar) y lo
 * calcula, para que el Fail-Fast de pi_sads_fama_connector.js no bloquee el Complemento de Pago
 * de facturas antiguas por un campo simplemente no cacheado todavía.
 *
 * Ejecución: manual, vía "Save and Execute" en el deployment. No corre por calendario.
 * Best-effort por diseño: un fallo en una factura individual se registra y NO detiene el
 * backfill del resto (a diferencia del Fail-Fast del timbrado en tiempo real).
 */
define([
    'N/record',
    'N/search',
    './lib/sads_fama_sat_catalog',
    './lib/sads_fama_logger'
], function (record, search, satCatalog, logger) {
    'use strict';

    var FIELDS = {
        TAX_OBJECT: 'custbody_sads_fama_tax_object'
    };

    /**
     * Busca todas las facturas sin ObjetoImp cacheado. El framework de Map/Reduce pagina y
     * distribuye automáticamente los resultados entre las ejecuciones de map().
     * @returns {Object} Objeto de búsqueda (N/search).
     */
    function getInputData() {
        return search.create({
            type: search.Type.INVOICE,
            filters: [
                ['mainline', 'is', 'T'], 'AND',
                [FIELDS.TAX_OBJECT, 'isempty', '']
            ],
            columns: ['internalid']
        });
    }

    /**
     * Calcula y persiste el ObjetoImp de una factura.
     * @param {Object} mapContext - Contexto de la fase Map; mapContext.value es una fila de la
     *   búsqueda de getInputData serializada como JSON.
     * @returns {void}
     */
    function map(mapContext) {
        var invoiceId = JSON.parse(mapContext.value).id;

        try {
            var taxObject = satCatalog.computeInvoiceTaxObject(invoiceId);

            var values = {};
            values[FIELDS.TAX_OBJECT] = taxObject;

            record.submitFields({
                type: record.Type.INVOICE,
                id: invoiceId,
                values: values,
                options: { enablesourcing: false, ignoreMandatoryFields: true }
            });

            mapContext.write({ key: 'OK', value: invoiceId });

        } catch (e) {
            logger.write('ERROR: fama_backfill_tax_object_mr.map', {
                invoiceId: invoiceId,
                message: e.message || e.toString(),
                stack: e.stack || (typeof e.getStackTrace === 'function' ? e.getStackTrace().join('\n') : 'Sin stack trace')
            });
            mapContext.write({ key: 'ERROR', value: invoiceId });
        }
    }

    /**
     * Resume el resultado del backfill (facturas actualizadas vs. fallidas) en el logger central.
     * @param {Object} summaryContext
     * @returns {void}
     */
    function summarize(summaryContext) {
        var counts = { OK: 0, ERROR: 0 };
        var failedIds = [];

        summaryContext.output.iterator().each(function (key, value) {
            counts[key] = (counts[key] || 0) + 1;
            if (key === 'ERROR') {
                failedIds.push(value);
            }
            return true;
        });

        summaryContext.mapSummary.errors.iterator().each(function (key, error) {
            logger.write('ERROR CRÍTICO: fama_backfill_tax_object_mr (fallo de framework, no de negocio)', {
                key: key,
                error: error
            });
            return true;
        });

        logger.write('fama_backfill_tax_object_mr: resumen final', {
            actualizadas: counts.OK || 0,
            fallidas: counts.ERROR || 0,
            idsFallidos: failedIds,
            usageConsumed: summaryContext.usage,
            concurrencia: summaryContext.concurrency,
            duracionSegundos: summaryContext.seconds
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        summarize: summarize
    };
});
