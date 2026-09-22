/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 *
 * Módulo: Mapeador de Factura Global. Construye el payload JSON exacto para Facturama CFDI 4.0.
 */
define([], function () {
    'use strict';

    var SAT_GLOBAL = {
        RFC: 'XAXX010101000',
        NAME: 'PUBLICO EN GENERAL',
        USE_CFDI: 'S01',
        REGIME: '616'
    };

    /**
     * Construye el JSON final para enviar a Facturama respetando estrictamente su esquema.
     * @param {Object} ctx - Metadatos de cabecera (periodicidad, meses, año, datos del emisor).
     * @param {Array} rawItems - Líneas/tickets obtenidos de NetSuite.
     * @returns {Object} Payload JSON listo para la petición HTTP.
     * @throws {Error} Si no se proporcionan datos suficientes.
     */
    function buildFacturamaPayload(ctx, rawItems) {
        if (!ctx || !rawItems || rawItems.length === 0) {
            throw new Error('Datos insuficientes para construir el payload de la Factura Global.');
        }

        var payload = {
            "NameId": 1,
            "CfdiType": "I",
            "Folio": ctx.folioSolicitado || "GLOBAL",
            "Date": ctx.fechaEmision,
            "PaymentForm": ctx.formaPago,
            "PaymentMethod": ctx.metodoPago,
            "Currency": "MXN",
            "CurrencyExchangeRate": 1,
            "ExpeditionPlace": ctx.issuerZipCode,
            "Exportation": ctx.exportation || "01",
            // Nodo exclusivo y obligatorio para Factura Global CFDI 4.0
            "GlobalInformation": {
                "Periodicity": ctx.periodicidad,
                "Months": ctx.meses,
                "Year": ctx.anio
            },
            "Issuer": {
                "FiscalRegime": ctx.issuerRegime,
                "Rfc": ctx.issuerRfc,
                "Name": ctx.issuerName
            },
            "Receiver": {
                "Rfc": SAT_GLOBAL.RFC,
                "Name": SAT_GLOBAL.NAME,
                "TaxZipCode": ctx.issuerZipCode,
                "FiscalRegime": SAT_GLOBAL.REGIME,
                "CfdiUse": SAT_GLOBAL.USE_CFDI
            },
            "Items": _buildItems(rawItems)
        };

        return payload;
    }

    /**
     * Ensambla el arreglo de nodos 'Item' requerido por Facturama a partir de las líneas de NetSuite.
     * @private
     * @param {Array} rawItems - Líneas obtenidas de NetSuite.
     * @returns {Array} Objetos 'Item' listos para el payload.
     */
    function _buildItems(rawItems) {
        var items = [];

        for (var i = 0; i < rawItems.length; i++) {
            var cleanData = _sanitizeRowData(rawItems[i]);
            var fiscalData = _calculateFiscalValues(cleanData);

            var itemNode = {
                "ProductCode": "01010101",
                "IdentificationNumber": cleanData.ticketNumber + "-" + cleanData.itemDescription,
                "Description": "Venta",
                "Unit": "ACT",
                "UnitCode": "ACT",
                "UnitPrice": fiscalData.unitPrice,
                "Quantity": cleanData.qty,
                "Subtotal": fiscalData.subtotal,
                "Discount": cleanData.discount,
                "Total": fiscalData.totalLine,
                "TaxObject": cleanData.taxObject,
                "Taxes": [
                    {
                        "Total": fiscalData.tax,
                        "Name": "IVA",
                        "Base": fiscalData.base,
                        "Rate": cleanData.taxRate,
                        "IsRetention": false,
                        "IsQuota": false
                    }
                ]
            };

            items.push(itemNode);
        }

        return items;
    }

    /**
     * Extrae, parsea y protege contra valores nulos o indefinidos provenientes del ERP.
     * @private
     * @param {Object} row - Fila cruda de NetSuite.
     * @returns {Object} Diccionario con datos limpios y tipados.
     */
    function _sanitizeRowData(row) {
        var rawTaxRate = parseFloat(row.taxrate) || 0;

        return {
            ticketNumber: row.ticketNumber || "N/A",
            itemDescription: row.itemDescription || "Venta",
            taxObject: row.taxObject || "02",
            qty: _round(parseFloat(row.qty) || 1, 6),
            amount: parseFloat(row.amount) || 0,
            discount: _round(parseFloat(row.discount) || 0, 6),
            unitPrice: parseFloat(row.unitPrice) || 0,
            erpTaxAmount: _round(parseFloat(row.taxAmount) || 0, 6),
            taxRate: _round(rawTaxRate > 1 ? (rawTaxRate / 100) : rawTaxRate, 6)
        };
    }

    /**
     * Calcula base, impuesto, subtotal y total de la línea garantizando la invariante del SAT.
     * Si la matemática del ERP ya cuadra, se usa tal cual; si el ERP redondeó, se recalcula desde
     * el total. Si la discrepancia de impuesto supera la tolerancia, falla rápido (registro corrupto).
     * @private
     * @param {Object} data - Diccionario de datos sanitizados.
     * @returns {Object} Nodos financieros cuadrados para el PAC.
     * @throws {Error} Si la discrepancia entre el impuesto del ERP y el calculado es insalvable.
     */
    function _calculateFiscalValues(data) {
        var TOLERANCIA_MAXIMA = 0.05;

        var erpTotalLine = _round((data.amount - data.discount) + data.erpTaxAmount, 6);

        var fwdBase = _round(data.amount - data.discount, 6);
        var fwdTax = _round(fwdBase * data.taxRate, 6);
        var fwdTotal = _round(fwdBase + fwdTax, 6);
        var fwdSubtotalCalc = _round(data.unitPrice * data.qty, 6);

        var isMathPerfect = (fwdTax === data.erpTaxAmount) &&
            (fwdTotal === erpTotalLine) &&
            (Math.abs(fwdSubtotalCalc - data.amount) < 0.01);

        if (isMathPerfect) {
            return {
                base: fwdBase,
                tax: fwdTax,
                subtotal: _round(data.amount, 6),
                unitPrice: _round(data.unitPrice, 6),
                totalLine: erpTotalLine
            };
        }

        var finalBase = _round(erpTotalLine / (1 + data.taxRate), 6);
        var finalTax = _round(erpTotalLine - finalBase, 6);
        var finalSubtotal = _round(finalBase + data.discount, 6);
        var finalUnitPrice = _round(finalSubtotal / data.qty, 6);

        var discrepanciaImpuesto = Math.abs(_round(data.erpTaxAmount - finalTax, 6));

        if (discrepanciaImpuesto > TOLERANCIA_MAXIMA) {
            throw new Error(
                'FAIL-FAST: Discrepancia matemática insalvable en Ticket ' + data.ticketNumber +
                '. Impuesto ERP: ' + data.erpTaxAmount + ' | Impuesto Real PAC: ' + finalTax +
                '. El registro contable está corrompido.'
            );
        }

        return {
            base: finalBase,
            tax: finalTax,
            subtotal: finalSubtotal,
            unitPrice: finalUnitPrice,
            totalLine: erpTotalLine
        };
    }

    /**
     * Redondea evitando los errores de precisión de punto flotante nativos de JavaScript
     * (ej. evita que 0.1 + 0.2 retorne 0.30000000000000004).
     * @private
     * @param {number} num - Número a redondear.
     * @param {number} decimals - Cantidad de decimales deseada.
     * @returns {number} Número redondeado.
     */
    function _round(num, decimals) {
        var multiplier = Math.pow(10, decimals);
        return Math.round(num * multiplier) / multiplier;
    }

    return {
        buildFacturamaPayload: buildFacturamaPayload
    };
});
