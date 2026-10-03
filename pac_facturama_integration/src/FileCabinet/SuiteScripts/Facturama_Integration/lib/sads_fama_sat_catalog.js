/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * Adaptador secundario (patrón Repositorio) del catálogo SAT nativo (Mexico Compliance Bundle):
 * Método de Pago, Objeto de Impuesto, Clave de Unidad.
 *
 * Frontera de Clean Architecture: este módulo, junto con el User Event que lo invoca, es el
 * único autorizado a usar N/search en este flujo. Abstrae el acceso a datos — sus funciones
 * ejecutan la búsqueda, aplican la validación/regla de catálogo correspondiente, y devuelven
 * valores puros (strings, booleanos, mapas planos), nunca objetos de búsqueda de NetSuite. El
 * dominio (sads_fama_carta_porte_mapper.js) nunca llama a este módulo directamente — solo el
 * adaptador orquestador (el User Event) lo hace, y le pasa el resultado ya resuelto al dominio.
 */
define(['N/search'], function (search) {
    'use strict';

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

    var MAPPING_SEARCH_ID = 'customsearch_mx_mapping_search';
    var MAPPING_FIELDS = {
        CATEGORY: 'custrecord_mx_mapper_keyvalue_category.scriptid',
        RECTYPE: 'custrecord_mx_mapper_keyvalue_rectype',
        SUBRECTYPE: 'custrecord_mx_mapper_keyvalue_subrectype',
        SUBKEY: 'custrecord_mx_mapper_keyvalue_subkey',
        VALUE_JOIN: 'custrecord_mx_mapper_keyvalue_value',
        VALUE_CODE: 'custrecord_mx_mapper_value_inreport'
    };
    var UNIT_CODE_MAPPING = {
        CATEGORY: 'sat_unit_code',
        RECTYPE: 'unitstype',
        SUBRECTYPE: 'uom'
    };

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

    /**
     * Construye un filtro OR anidado ([k,'is',v0], 'OR', [k,'is',v1], ...) en vez de 'anyof',
     * replicando el mismo patrón que usa el bundle Mexico Compliance contra esta búsqueda.
     * @private
     */
    function _createOrQuery(fieldId, values) {
        var query = [];
        if (!values || values.length === 0) return query;
        query.push([fieldId, 'is', values[0]]);
        for (var i = 1; i < values.length; i++) {
            query.push('OR', [fieldId, 'is', values[i]]);
        }
        return query;
    }

    /**
     * Resuelve la Clave de Unidad SAT para un conjunto de unidades de NetSuite (campo "units"
     * de línea), reutilizando la misma búsqueda guardada pública que usa el bundle Mexico
     * Compliance para su propia Asignación de Campos para México (categoría "sat_unit_code").
     *
     * @param {Array<string|number>} unitIds - IDs de unidad de NetSuite, pueden repetirse.
     * @param {Object} [logger] - Debe exponer .write(mensaje, detalle).
     * @returns {Object} Mapa { unitId: claveSAT }. Un unitId sin match en la búsqueda, o un
     *   fallo total de la búsqueda, simplemente no aparece en el mapa devuelto.
     */
    function resolveClavesUnidad(unitIds, logger) {
        var unicos = (unitIds || []).filter(function (v, i, arr) {
            return v !== null && v !== undefined && v !== '' && arr.indexOf(v) === i;
        }).map(String);

        if (unicos.length === 0) return {};

        var mapa = {};
        try {
            var searchObj = search.load({ id: MAPPING_SEARCH_ID });
            searchObj.filterExpression = [
                [MAPPING_FIELDS.CATEGORY, 'is', [UNIT_CODE_MAPPING.CATEGORY]],
                'and',
                [MAPPING_FIELDS.RECTYPE, 'is', [UNIT_CODE_MAPPING.RECTYPE]],
                'and',
                [MAPPING_FIELDS.SUBRECTYPE, 'is', [UNIT_CODE_MAPPING.SUBRECTYPE]],
                'and',
                [_createOrQuery(MAPPING_FIELDS.SUBKEY, unicos)]
            ];

            var pagedData = searchObj.runPaged({ pageSize: 1000 });
            pagedData.pageRanges.forEach(function (pageRange) {
                var page = pagedData.fetch({ index: pageRange.index });
                page.data.forEach(function (result) {
                    var subkey = result.getValue({ name: MAPPING_FIELDS.SUBKEY });
                    var codigo = result.getValue({ name: MAPPING_FIELDS.VALUE_CODE, join: MAPPING_FIELDS.VALUE_JOIN });
                    mapa[subkey] = codigo;
                });
            });
        } catch (e) {
            if (logger) {
                logger.write('resolveClavesUnidad: fallo consultando ' + MAPPING_SEARCH_ID, {
                    unitIds: unicos,
                    error: e.message || e.toString()
                });
            }
            return {};
        }

        return mapa;
    }

    return {
        isPPD: isPPD,
        computeInvoiceTaxObject: computeInvoiceTaxObject,
        resolveClavesUnidad: resolveClavesUnidad,
        TAX_OBJECT: TAX_OBJECT
    };
});
