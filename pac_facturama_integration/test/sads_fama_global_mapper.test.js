var path = require('path');
var loadAmdModule = require('./helpers/loadAmdModule');

var MAPPER_PATH = path.join(
    __dirname,
    '..',
    'src/FileCabinet/SuiteScripts/Facturama_Integration/lib/sads_fama_global_mapper.js'
);

describe('sads_fama_global_mapper (lógica pura, sin dependencias N/*)', function () {
    var mapper;

    beforeAll(function () {
        // Sin segundo argumento: el módulo se define como define([], function () {...}),
        // no hay ninguna dependencia N/* que mockear.
        mapper = loadAmdModule(MAPPER_PATH);
    });

    var baseCtx = {
        folioSolicitado: 'GLOBAL-1',
        fechaEmision: '2026-09-21T10:00:00',
        formaPago: '01',
        metodoPago: 'PUE',
        issuerZipCode: '81000',
        issuerRegime: '601',
        issuerRfc: 'AAA010101AAA',
        issuerName: 'ALMETAL SA DE CV',
        periodicidad: '01',
        meses: '09',
        anio: '2026'
    };

    test('arma el payload global y calcula el impuesto de línea cuando el ERP no redondeó', function () {
        var rawItems = [{
            ticketNumber: 'CS-1001',
            itemDescription: 'Perfil de acero',
            taxObject: '02',
            qty: '1',
            amount: '500',
            discount: '0',
            unitPrice: '500',
            taxAmount: '80',
            taxrate: '0.16'
        }];

        var payload = mapper.buildFacturamaPayload(baseCtx, rawItems);

        expect(payload.CfdiType).toBe('I');
        expect(payload.GlobalInformation.Year).toBe('2026');
        expect(payload.Items).toHaveLength(1);
        expect(payload.Items[0].Subtotal).toBeCloseTo(500, 6);
        expect(payload.Items[0].Total).toBeCloseTo(580, 6);
        expect(payload.Items[0].Taxes[0].Total).toBeCloseTo(80, 6);
    });

    test('recalcula base/impuesto a partir del total cuando el ERP redondeó el impuesto (caso del hotfix 0dc75ad)', function () {
        // amount=100 a tasa 16% da un impuesto matemático de 16.00, pero el ERP registró 16.01
        // por redondeo previo. isMathPerfect debe fallar y el módulo debe recalcular desde el total.
        var rawItems = [{
            ticketNumber: 'CS-2002',
            amount: '100',
            unitPrice: '100',
            qty: '1',
            taxAmount: '16.01',
            taxrate: '0.16'
        }];

        var payload = mapper.buildFacturamaPayload(baseCtx, rawItems);
        var item = payload.Items[0];

        // El total de línea debe seguir cuadrando con lo que el ERP reportó (100 + 16.01).
        expect(item.Total).toBeCloseTo(116.01, 6);
        // Pero el impuesto recalculado ya no es exactamente 16.01: sale de total/(1+tasa).
        expect(item.Taxes[0].Total).not.toBeCloseTo(16.01, 6);
    });

    test('Fail-Fast: rechaza una línea cuya discrepancia entre impuesto ERP y calculado es insalvable', function () {
        var rawItems = [{
            ticketNumber: 'CS-9999',
            amount: '100',
            unitPrice: '100',
            qty: '1',
            taxAmount: '999', // Muy lejos de lo que corresponde matemáticamente a 100 * 0.16.
            taxrate: '0.16'
        }];

        expect(function () {
            mapper.buildFacturamaPayload(baseCtx, rawItems);
        }).toThrow(/FAIL-FAST/);
    });

    test('lanza error si no se proporcionan items', function () {
        expect(function () {
            mapper.buildFacturamaPayload(baseCtx, []);
        }).toThrow(/Datos insuficientes/);
    });
});
