/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 *
 * SADS Facturama - Cacheo de Objeto de Impuesto (ObjetoImp) en Factura
 * Responsabilidad: al guardar una factura, precalcular y persistir el ObjetoImp SAT a nivel
 * cabecera (custbody_sads_fama_tax_object), para que el Complemento de Pago no tenga que
 * recalcularlo por cada pago aplicado.
 */
define([
    'N/record',
    './lib/sads_fama_sat_catalog',
    './lib/sads_fama_logger'
], function (record, satCatalog, logger) {
    'use strict';

    var FIELDS = {
        TAX_OBJECT: 'custbody_sads_fama_tax_object'
    };

    /**
     * Tras crear/editar la factura, calcula y persiste el ObjetoImp SAT a nivel cabecera.
     * @param {Object} context - Contexto del User Event.
     * @returns {void}
     */
    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
            return;
        }

        var invoiceId = context.newRecord.id;

        try {
            var currentValue = context.newRecord.getValue({ fieldId: FIELDS.TAX_OBJECT });
            var taxObject = satCatalog.computeInvoiceTaxObject(invoiceId);

            // Evita una escritura (y un posible re-disparo del propio evento) si el valor no cambió.
            if (currentValue === taxObject) {
                return;
            }

            var values = {};
            values[FIELDS.TAX_OBJECT] = taxObject;

            record.submitFields({
                type: record.Type.INVOICE,
                id: invoiceId,
                values: values,
                options: { enablesourcing: false, ignoreMandatoryFields: true }
            });

        } catch (e) {
            logger.write('ERROR: fama_invoice_tax_object_ue.afterSubmit', {
                invoiceId: invoiceId,
                message: e.message || e.toString(),
                stack: e.stack || (typeof e.getStackTrace === 'function' ? e.getStackTrace().join('\n') : 'Sin stack trace')
            });
        }
    }

    return { afterSubmit: afterSubmit };
});
