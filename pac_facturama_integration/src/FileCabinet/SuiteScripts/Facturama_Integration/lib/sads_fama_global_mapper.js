/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo: Mapeador de Factura Global (Domain Layer / Core)
 * Responsabilidad: Construir el payload JSON exacto para Facturama CFDI 4.0 Global
 */
define([], function() {
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
     * Transforma las líneas de NetSuite en el arreglo 'Items' esperado por Facturama.
     * @param {Array} rawItems - Arreglo de líneas/tickets obtenidos de NetSuite.
     * @returns {Array} Arreglo de objetos 'Item' listos para el payload.
     * @private
     */
    function _buildItems(rawItems) {
        var items = [];
        
        for (var i = 0; i < rawItems.length; i++) {
            var row = rawItems[i];
        
            // Aseguramos que los valores matemáticos jamás sean NaN o indefinidos.
            var qty = parseFloat(row.quantity) || 1;
            var amount = parseFloat(row.amount) || 0;
            var taxRate = parseFloat(row.taxrate) || 0;
            var taxAmount = parseFloat(row.taxamt) || 0;
            var discount = parseFloat(row.discount) || 0;
            var unitPrice = amount / qty;

            var itemNode = {               
                "ProductCode": "01010101", 
                "IdentificationNumber": row.ticketNumber || "TICKET",
                "Description": "Venta",
                "Unit": "ACT",
                "UnitCode": "ACT",
                "UnitPrice": _round(unitPrice, 6), 
                "Quantity": qty, 
                "Subtotal": _round(amount, 2), 
                "Discount": _round(discount, 2), 
                "Total": _round((amount - discount) + taxAmount, 2), 
                "TaxObject": "02",
                "Taxes": [
                    {
                        "Name": "IVA",
                        "Base": _round(amount - discount, 2),
                        "Rate": _round(taxRate, 6),
                        "Total": _round(taxAmount, 2),
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