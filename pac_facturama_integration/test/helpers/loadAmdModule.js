/**
 * Shim mínimo para cargar en Node un módulo SuiteScript escrito como AMD (`define([...], fn)`)
 * sin necesitar RequireJS ni el framework oficial @oracle/suitecloud-unit-testing.
 *
 * Solo sirve para módulos cuyas dependencias N/* se puedan reemplazar por mocks simples
 * (o que, como sads_fama_global_mapper.js, no tengan ninguna dependencia). Para módulos con
 * dependencias más pesadas (N/record, N/search, N/query), lo natural es migrar a los stubs
 * oficiales de @oracle/suitecloud-unit-testing en vez de extender este shim.
 *
 * @param {string} modulePath - Ruta absoluta al archivo .js del módulo SuiteScript.
 * @param {Object} [mockDeps] - Mapa { 'N/search': mockSearchModule, ... } de dependencias.
 * @returns {*} El objeto retornado por el módulo (lo que devuelve su función define()).
 */
function loadAmdModule(modulePath, mockDeps) {
    mockDeps = mockDeps || {};

    var fs = require('fs');
    var vm = require('vm');

    var code = fs.readFileSync(modulePath, 'utf8');
    var exported;

    var sandbox = {
        define: function (deps, factory) {
            var resolvedDeps = deps.map(function (depName) {
                if (!(depName in mockDeps)) {
                    throw new Error('loadAmdModule: falta un mock para la dependencia "' + depName + '"');
                }
                return mockDeps[depName];
            });
            exported = factory.apply(null, resolvedDeps);
        }
    };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { filename: modulePath });

    return exported;
}

module.exports = loadAmdModule;
