/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * Módulo: Catálogo SAT compartido (Mexico Compliance Bundle)
 * Responsabilidad: Resolver valores del catálogo SAT nativo (Método de Pago, Objeto de Impuesto)
 * reutilizados tanto por el script de cacheo en Factura como por el de Complemento de Pago.
 */
define(['N/search'], function (search) {
    'use strict';

    // ==========================================
    // 1. CONSTANTES
    // ==========================================
    var PPD_LIST_VALUE = '4';
    var PPD_TEXT_PREFIX = 'PPD';

    var FIELDS = {
        LINE_TAX_OBJECT: 'custcol_mx_txn_line_sat_tax_object',
        TAX_OBJECT_CODE: 'custrecord_mx_sat_to_code'
    };

    var TAX_OBJECT = {
        NO_OBJETO: '01',
        SI_OBJETO: '02'
    };

    // ==========================================
    // 2. API PÚBLICA
    // ==========================================

    /**
     * Determina si el Método de Pago SAT de una factura es PPD (Pago en Parcialidades o Diferido).
     * Acepta indistintamente el id interno de lista ("4") o el texto ya resuelto
     * ("PPD - Pago en Parcialidades o Diferido"), ya que el origen del dato (getValue vs.
     * getText / SuiteQL vs. search.lookupFields) puede variar según el punto de lectura.
     *
     * @param {string|number} value - Valor crudo del campo custbody_mx_txn_sat_payment_term.
     * @param {string} [text] - Valor de texto del mismo campo, si está disponible.
     * @returns {boolean}
     */
    function isPPD(value, text) {
        if (value !== null && value !== undefined && String(value) === PPD_LIST_VALUE) {
            return true;
        }
        if (text && String(text).toUpperCase().indexOf(PPD_TEXT_PREFIX) === 0) {
            return true;
        }
        return false;
    }

    /**
     * Calcula el ObjetoImp ("01"/"02") de una factura a partir del objeto de impuesto SAT
     * de sus líneas de venta (custcol_mx_txn_line_sat_tax_object -> customrecord_mx_sat_tax_object).
     *
     * Regla de negocio: si TODAS las líneas están marcadas como "01" (No objeto de impuesto),
     * el resultado a nivel cabecera es "01". En cualquier otro caso (incluido mixto, o sin dato),
     * se reporta "02" por seguridad fiscal (fail-safe hacia el escenario gravable).
     *
     * No cubre los códigos "03" (Sí objeto, no obligado al desglose) ni "04" (Exportación):
     * no hay evidencia en este proyecto de que dichos escenarios apliquen; si llegaran a
     * presentarse, esta función debe extenderse explícitamente.
     *
     * @param {string|number} invoiceId - ID interno de la factura.
     * @returns {string} "01" o "02".
     */
    function computeInvoiceTaxObject(invoiceId) {
        var lineTaxObjects = [];

        var colTaxObject = search.createColumn({
            name: FIELDS.TAX_OBJECT_CODE,
            join: FIELDS.LINE_TAX_OBJECT
        });

        var invoiceSearch = search.create({
            type: search.Type.INVOICE,
            filters: [
                ['internalid', 'anyof', invoiceId], 'AND',
                ['mainline', 'is', 'F'], 'AND',
                ['taxline', 'is', 'F'], 'AND',
                ['shipping', 'is', 'F'], 'AND',
                ['cogs', 'is', 'F']
            ],
            columns: [colTaxObject]
        });

        invoiceSearch.run().each(function (result) {
            lineTaxObjects.push(result.getValue(colTaxObject));
            return true;
        });

        if (lineTaxObjects.length === 0) {
            return TAX_OBJECT.SI_OBJETO;
        }

        var allExempt = true;
        for (var i = 0; i < lineTaxObjects.length; i++) {
            if (lineTaxObjects[i] !== TAX_OBJECT.NO_OBJETO) {
                allExempt = false;
                break;
            }
        }

        return allExempt ? TAX_OBJECT.NO_OBJETO : TAX_OBJECT.SI_OBJETO;
    }

    return {
        isPPD: isPPD,
        computeInvoiceTaxObject: computeInvoiceTaxObject,
        TAX_OBJECT: TAX_OBJECT
    };
});
