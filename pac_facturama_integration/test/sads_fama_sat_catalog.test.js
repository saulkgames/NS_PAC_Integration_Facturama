var path = require('path');
var loadAmdModule = require('./helpers/loadAmdModule');

var CATALOG_PATH = path.join(
    __dirname,
    '..',
    'src/FileCabinet/SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js'
);

function makeFakeSearchModule(rowsByUnitId, options) {
    options = options || {};
    var lastFilterExpression = null;
    var loadCallCount = 0;

    function makeResultRow(unitId) {
        return {
            getValue: function (opts) {
                if (opts.name === 'custrecord_mx_mapper_keyvalue_subkey') {
                    return unitId;
                }
                if (opts.name === 'custrecord_mx_mapper_value_inreport' && opts.join === 'custrecord_mx_mapper_keyvalue_value') {
                    return rowsByUnitId[unitId];
                }
                return null;
            }
        };
    }

    return {
        load: function () {
            loadCallCount++;
            if (options.throwOnLoad) {
                throw new Error('search.load: permiso denegado');
            }
            return {
                set filterExpression(expr) { lastFilterExpression = expr; },
                get filterExpression() { return lastFilterExpression; },
                runPaged: function () {
                    if (options.throwOnRunPaged) {
                        throw new Error('runPaged: fallo de ejecución');
                    }
                    var unitIdsConMatch = Object.keys(rowsByUnitId);
                    return {
                        pageRanges: [{ index: 0 }],
                        fetch: function () {
                            return {
                                data: unitIdsConMatch.map(makeResultRow)
                            };
                        }
                    };
                }
            };
        },
        _getLastFilterExpression: function () { return lastFilterExpression; },
        _getLoadCallCount: function () { return loadCallCount; }
    };
}

describe('sads_fama_sat_catalog.resolveClavesUnidad', function () {
    test('deduplica unitIds repetidos antes de armar el OR-chain', function () {
        var fakeSearch = makeFakeSearchModule({ '7857': 'H87' });
        var catalog = loadAmdModule(CATALOG_PATH, { 'N/search': fakeSearch });

        catalog.resolveClavesUnidad(['7857', '7857', '9001'], null);

        var filterExpr = fakeSearch._getLastFilterExpression();
        var orQueryFragment = filterExpr[filterExpr.length - 1][0];

        // [ [subkey,'is',v0], 'OR', [subkey,'is',v1] ] => 3 elementos, no 5.
        expect(orQueryFragment).toHaveLength(3);
        expect(orQueryFragment[0]).toEqual(['custrecord_mx_mapper_keyvalue_subkey', 'is', '7857']);
        expect(orQueryFragment[2]).toEqual(['custrecord_mx_mapper_keyvalue_subkey', 'is', '9001']);
    });

    test('resuelve múltiples unidades distintas usando OR-chain (no anyof)', function () {
        var fakeSearch = makeFakeSearchModule({ '7857': 'H87', '9001': 'KGM' });
        var catalog = loadAmdModule(CATALOG_PATH, { 'N/search': fakeSearch });

        var resultado = catalog.resolveClavesUnidad(['7857', '9001'], null);

        expect(resultado).toEqual({ '7857': 'H87', '9001': 'KGM' });

        var filterExpr = fakeSearch._getLastFilterExpression();
        var orQueryFragment = filterExpr[filterExpr.length - 1][0];
        expect(orQueryFragment[1]).toBe('OR');
    });

    test('una unidad sin match en la búsqueda no aparece en el mapa devuelto', function () {
        var fakeSearch = makeFakeSearchModule({ '7857': 'H87' });
        var catalog = loadAmdModule(CATALOG_PATH, { 'N/search': fakeSearch });

        var resultado = catalog.resolveClavesUnidad(['7857', '9999'], null);

        expect(resultado).toEqual({ '7857': 'H87' });
        expect(resultado['9999']).toBeUndefined();
    });

    test('Fail-Safe: si search.load falla, devuelve {} sin relanzar y loguea', function () {
        var fakeSearch = makeFakeSearchModule({}, { throwOnLoad: true });
        var catalog = loadAmdModule(CATALOG_PATH, { 'N/search': fakeSearch });
        var logs = [];
        var fakeLogger = { write: function (msg, detalle) { logs.push({ msg: msg, detalle: detalle }); } };

        var resultado;
        expect(function () {
            resultado = catalog.resolveClavesUnidad(['7857'], fakeLogger);
        }).not.toThrow();

        expect(resultado).toEqual({});
        expect(logs).toHaveLength(1);
    });

    test('Fail-Safe: si runPaged falla, devuelve {} sin relanzar', function () {
        var fakeSearch = makeFakeSearchModule({}, { throwOnRunPaged: true });
        var catalog = loadAmdModule(CATALOG_PATH, { 'N/search': fakeSearch });

        var resultado = catalog.resolveClavesUnidad(['7857'], null);

        expect(resultado).toEqual({});
    });

    test('arreglo vacío devuelve {} sin invocar search.load', function () {
        var fakeSearch = makeFakeSearchModule({});
        var catalog = loadAmdModule(CATALOG_PATH, { 'N/search': fakeSearch });

        var resultado = catalog.resolveClavesUnidad([], null);

        expect(resultado).toEqual({});
        expect(fakeSearch._getLoadCallCount()).toBe(0);
    });
});
