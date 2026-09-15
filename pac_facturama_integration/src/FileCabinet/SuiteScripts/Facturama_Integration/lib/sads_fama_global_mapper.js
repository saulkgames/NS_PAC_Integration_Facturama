/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo: Mapeador de Factura Global (Domain Layer / Core)
 * Responsabilidad: Construir el payload JSON exacto para Facturama CFDI 4.0 Global
 */
define([], function () {
    'use strict';

    // ==========================================
    // 1. CONSTANTES DEL DOMINIO SAT (Globales 4.0)
    // ==========================================
    var SAT_GLOBAL = {
        RFC: 'XAXX010101000',
        NAME: 'PUBLICO EN GENERAL',
        USE_CFDI: 'S01',
        REGIME: '616'
    };

    // ==========================================
    // 2. API PÚBLICA
    // ==========================================

    /**
     * Construye el JSON final para enviar a Facturama respetando estrictamente su esquema.
     * @param {Object} ctx - Metadatos de la cabecera (Periodicidad, Meses, Año, Configuración de Subsidiaria).
     * @param {Array} rawItems - Arreglo de líneas/tickets obtenidos de NetSuite.
     * @returns {Object} Payload JSON listo para la petición HTTP.
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

    // ==========================================
    // 3. FUNCIONES PRIVADAS (Transformación de Datos)
    // ==========================================

    /**
      * Mapeador puro (Adaptador de Salida). 
      * Su única responsabilidad es ensamblar el JSON requerido por Facturama.
      * 
      * @param {Array} rawItems - Arreglo de líneas obtenidas de NetSuite.
      * @returns {Array} Arreglo de objetos 'Item' listos para el payload.
      * @private
      */
    function _buildItems(rawItems) {
        var items = [];

        for (var i = 0; i < rawItems.length; i++) {
            // 1. Sanitización
            var cleanData = _sanitizeRowData(rawItems[i]);

            // 2. Ejecución de Reglas de Negocio (Dominio)
            var fiscalData = _calculateFiscalValues(cleanData);

            // 3. Mapeo estricto del contrato (JSON)
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
     * Filtro de Frontera (Anticorruption Layer).
     * Extrae, parsea y protege contra valores nulos o indefinidos del ERP.
     * 
     * @param {Object} row - Fila cruda de NetSuite.
     * @returns {Object} Diccionario con datos limpios y tipados.
     * @private
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
     * Motor de Cálculo de Dominio (Top-Down Reverse Engineering).
     * Aplica el Patrón Estrategia y Fail-Fast para garantizar la invariante del SAT.
     * @param {Object} data - Diccionario de datos sanitizados.
     * @returns {Object} Nodos financieros perfectamente cuadrados para el PAC.
     * @private
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
     * Utilidad para evitar errores de precisión de punto flotante nativos de JavaScript.
     * (Ej. Evita que 0.1 + 0.2 retorne 0.30000000000000004)
     * @param {number} num - Número a redondear.
     * @param {number} decimals - Cantidad de decimales deseada.
     * @returns {number} Número redondeado a la cantidad de decimales especificada.
     * @private
     */
    function _round(num, decimals) {
        var multiplier = Math.pow(10, decimals);
        return Math.round(num * multiplier) / multiplier;
    }

    return {
        buildFacturamaPayload: buildFacturamaPayload
    };
});
// Correcion de decimales, redondeados a 6 decimales para cumplir con el esquema de Facturama CFDI 4.0 Global, evitando errores de validación en la API de Facturama.
// Agregada estrategia para impuesto y subtotal basado en el total cuando el erp redondee los montos y genere discrepancias matemáticas. Se implementa un patrón de Fail-Fast para detectar inconsistencias graves en los registros contables.