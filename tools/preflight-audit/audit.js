#!/usr/bin/env node
'use strict';

/**
 * Auditoría local de pre-despliegue del proyecto SDF pac_facturama_integration.
 * Lee el repositorio (sin acceso a NetSuite) y genera preflight_report.json y
 * preflight_report.md a partir de un mismo conjunto de datos.
 *
 * Uso: node audit.js [--project <dir>] [--templates <dir>] [--out <dir>] [--no-fail]
 * Código de salida: 0 sin bloqueantes, 2 con bloqueantes (salvo --no-fail).
 */

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const SCRIPT_VERSION = '1.0.0';
const REPO_ROOT = path.resolve(__dirname, '..', '..');

const SEVERITY_ORDER = ['BLOQUEANTE', 'ALTA', 'MEDIA', 'INFO'];

const SANDBOX_SCRIPTID = /_sb\d*_|_sb\d*$|^sb\d*_/i;
const ACCOUNT_ID_IN_SCRIPTID = /_\d{6,8}_/;
const SANDBOX_LITERAL = /sandbox|apisandbox|_sb\d|5490848/i;
const CREDENTIAL_NAME = /pass|pwd|token|secret|api[_-]?key|authorization|user(name)?$/i;

const OWNED_PREFIX = '_sads_';
const EXTERNAL_FAMILIES = [
    { name: 'Mexico Compliance', test: /_mx_/ },
    { name: 'DRT (partner)', test: /_drt_|_mcp_/ },
    { name: 'NetSuite PSG / E-Document', test: /_psg_/ },
    { name: 'Propio (sads)', test: /_sads_/ }
];

const SCRIPT_RECORD_TYPES = [
    'UserEventScript', 'MapReduceScript', 'Suitelet', 'ScheduledScript', 'Restlet',
    'plugintypeimpl', 'MassUpdateScript', 'WorkflowActionScript', 'Portlet'
];

const RECORD_TYPE_TO_BODY_FLAG = {
    INVOICE: 'bodysale',
    CASHSALE: 'bodysale',
    CREDITMEMO: 'bodysale',
    SALESORDER: 'bodysale',
    ITEMFULFILLMENT: 'bodyitemfulfillment',
    CUSTOMERPAYMENT: 'bodycustomerpayment',
    TRANSFERORDER: 'bodytransferorder'
};

const PURE_MODULES = ['/SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js'];

const NOT_VERIFIABLE_LOCALLY = [
    { id: 'P-05', tarea: 'Existencia en producción de bundles, registros y campos externos (ver dependencias externas)' },
    { id: 'P-06', tarea: 'Equivalencia en producción de los IDs hardcodeados (ver hallazgos HARDCODE)' },
    { id: 'P-07', tarea: 'project:validate --server contra la cuenta de producción' },
    { id: 'P-08', tarea: 'Timbrado aceptado por el PAC en sandbox con el código a desplegar' },
    { id: 'P-09', tarea: 'Respaldo del estado actual de producción' },
    { id: 'P-10', tarea: 'Ventana de cambio y comunicación a usuarios' },
    { id: 'P-11', tarea: 'Volumen para el backfill de Tax Object' },
    { id: 'D-03', tarea: 'Instancia de configuración de producción (manual)' },
    { id: 'D-07', tarea: 'Plugin implementation y Sending Method (manual)' },
    { id: 'D-08', tarea: 'Carga de plantillas .ftl en Electronic Documents (manual)' },
    { id: 'V-01..V-12', tarea: 'Pruebas de humo y monitoreo post-despliegue' },
    { id: 'R-01..R-07', tarea: 'Plan de rollback' }
];

/**
 * Interpreta los argumentos de línea de comandos.
 * @param {Array<string>} argv
 * @returns {Object}
 */
function parseArgs(argv) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--no-fail') out.noFail = true;
        else if (argv[i].startsWith('--')) out[argv[i].slice(2)] = argv[++i];
    }
    return out;
}

/**
 * Lista archivos de forma recursiva, ignorando node_modules.
 * @param {string} dir
 * @returns {Array<string>} Rutas absolutas ordenadas.
 */
function walk(dir) {
    if (!fs.existsSync(dir)) return [];
    const out = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === 'node_modules') continue;
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(abs));
        else out.push(abs);
    }
    return out.sort();
}

/** @param {string} p @returns {string} Ruta con separador "/". */
function posix(p) {
    return p.replace(/\\/g, '/');
}

/**
 * Valor del primer elemento XML con ese nombre dentro de un bloque.
 * @param {string} block
 * @param {string} name
 * @returns {string|null}
 */
function tagValue(block, name) {
    const m = new RegExp('<' + name + '>([\\s\\S]*?)</' + name + '>').exec(block);
    return m ? m[1].trim() : null;
}

/**
 * Bloques <tag scriptid="...">...</tag> de un XML.
 * @param {string} xml
 * @param {string} tag
 * @returns {Array<{scriptid: string, body: string}>}
 */
function blocks(xml, tag) {
    const re = new RegExp('<' + tag + '\\s+scriptid="([^"]+)"[^>]*>([\\s\\S]*?)</' + tag + '>', 'g');
    const out = [];
    let m;
    while ((m = re.exec(xml)) !== null) out.push({ scriptid: m[1], body: m[2] });
    return out;
}

/** @param {string} xml @returns {Array<string>} scriptids referenciados como [scriptid=...]. */
function scriptidRefs(xml) {
    const out = new Set();
    const re = /\[scriptid=([a-zA-Z0-9_]+)\]/g;
    let m;
    while ((m = re.exec(xml)) !== null) out.add(m[1]);
    return [...out].sort();
}

/**
 * Analiza un objeto SDF (XML) sin volcar valores de datos de instancias.
 * @param {string} file Ruta absoluta.
 * @param {string} projectSrc
 * @returns {Object|null}
 */
function parseSdfObject(file, projectSrc) {
    const xml = fs.readFileSync(file, 'utf8');
    const root = /<([a-zA-Z0-9]+)\s+scriptid="([^"]+)"/.exec(xml);
    if (!root) return null;

    const obj = {
        file: posix(path.relative(projectSrc, file)),
        type: root[1],
        scriptid: root[2],
        name: tagValue(xml, 'name') || tagValue(xml, 'label') || tagValue(xml, 'recordname'),
        description: (tagValue(xml.replace(/<scriptdeployments>[\s\S]*<\/scriptdeployments>/, ''), 'description') || '').slice(0, 400),
        refs: scriptidRefs(xml),
        scriptfile: null,
        deployments: [],
        scriptCustomFields: [],
        appliesTo: [],
        fieldtype: null,
        subtab: null,
        displaytype: null,
        recordFields: [],
        instances: []
    };

    const sf = /<scriptfile>\[([^\]]+)\]<\/scriptfile>/.exec(xml);
    if (sf) obj.scriptfile = sf[1];

    for (const d of blocks(xml, 'scriptdeployment')) {
        obj.deployments.push({
            scriptid: d.scriptid,
            status: tagValue(d.body, 'status'),
            isdeployed: tagValue(d.body, 'isdeployed'),
            isinactive: tagValue(d.body, 'isinactive'),
            recordtype: tagValue(d.body, 'recordtype'),
            allroles: tagValue(d.body, 'allroles'),
            allemployees: tagValue(d.body, 'allemployees'),
            audslctrole: tagValue(d.body, 'audslctrole'),
            loglevel: tagValue(d.body, 'loglevel'),
            runasrole: tagValue(d.body, 'runasrole'),
            startdate: tagValue(d.body, 'startdate')
        });
    }

    obj.scriptCustomFields = blocks(xml, 'scriptcustomfield').map(b => b.scriptid);

    if (obj.type === 'transactionbodycustomfield') {
        const re = /<(body[a-z]+)>T<\/\1>/g;
        let m;
        while ((m = re.exec(xml)) !== null) obj.appliesTo.push(m[1]);
        obj.fieldtype = tagValue(xml, 'fieldtype');
        obj.subtab = tagValue(xml, 'subtab');
        obj.displaytype = tagValue(xml, 'displaytype');
    }

    if (obj.type === 'customrecordtype') {
        obj.recordFields = blocks(xml, 'customrecordcustomfield').map(b => b.scriptid);
        for (const inst of blocks(xml, 'instance')) {
            const tagNames = [];
            const re = /<([a-z0-9_]+)>/gi;
            let m;
            while ((m = re.exec(inst.body)) !== null) tagNames.push(m[1]);
            const unique = [...new Set(tagNames)].sort();
            obj.instances.push({
                scriptid: inst.scriptid,
                fieldTags: unique,
                credentialTags: unique.filter(t => CREDENTIAL_NAME.test(t)),
                sandboxBound: SANDBOX_SCRIPTID.test(inst.scriptid),
                refs: scriptidRefs(inst.body)
            });
        }
    }

    return obj;
}

/**
 * Elimina comentarios de línea de un fragmento de lista define([...]).
 * @param {string} text
 * @returns {string}
 */
function stripLineComments(text) {
    return text.replace(/\/\/.*$/gm, '');
}

/**
 * Analiza los archivos .js del File Cabinet: tipo de script, módulos y dependencias locales.
 * @param {string} fcRoot Raíz src/FileCabinet.
 * @returns {Map<string, Object>} Clave: ruta de File Cabinet.
 */
function analyzeJsFiles(fcRoot) {
    const map = new Map();
    const files = walk(fcRoot).filter(f => f.endsWith('.js'));

    for (const abs of files) {
        const src = fs.readFileSync(abs, 'utf8');
        const cab = '/' + posix(path.relative(fcRoot, abs));
        const header = {
            apiVersion: (/@NApiVersion\s+(\S+)/.exec(src) || [])[1] || null,
            scriptType: (/@NScriptType\s+(\S+)/.exec(src) || [])[1] || null,
            moduleScope: (/@NModuleScope\s+(\S+)/.exec(src) || [])[1] || null
        };
        const defineMatch = /\bdefine\s*\(\s*\[([\s\S]*?)\]/.exec(src);
        const deps = [];
        if (defineMatch) {
            const re = /['"]([^'"]+)['"]/g;
            const cleaned = stripLineComments(defineMatch[1]);
            let m;
            while ((m = re.exec(cleaned)) !== null) deps.push(m[1]);
        }
        map.set(cab, {
            path: cab,
            abs,
            bytes: Buffer.byteLength(src),
            src,
            ...header,
            nativeModules: deps.filter(d => /^N\//.test(d)).sort(),
            rawLocalDeps: deps.filter(d => !/^N\//.test(d)),
            localDeps: [],
            brokenDeps: [],
            level: 0
        });
    }

    for (const info of map.values()) {
        for (const dep of info.rawLocalDeps) {
            const base = dep.startsWith('/')
                ? dep
                : '/' + posix(path.relative(fcRoot, path.resolve(path.dirname(info.abs), dep)));
            const target = base.endsWith('.js') ? base : base + '.js';
            if (map.has(target)) info.localDeps.push(target);
            else info.brokenDeps.push(dep);
        }
    }
    return map;
}

/**
 * Calcula niveles de despliegue (0 = hojas) y ciclos de dependencia.
 * @param {Map<string, Object>} files
 * @returns {{levels: Array<Array<string>>, cycles: Array<Array<string>>}}
 */
function computeDeployOrder(files) {
    const state = new Map();
    const level = new Map();
    const cycles = [];

    function visit(node, stack) {
        if (level.has(node)) return level.get(node);
        if (state.get(node) === 'visiting') {
            cycles.push(stack.slice(stack.indexOf(node)).concat(node));
            return 0;
        }
        state.set(node, 'visiting');
        stack.push(node);
        let lv = 0;
        for (const d of files.get(node).localDeps) lv = Math.max(lv, 1 + visit(d, stack));
        stack.pop();
        state.set(node, 'done');
        level.set(node, lv);
        return lv;
    }

    for (const key of [...files.keys()].sort()) visit(key, []);

    const levels = [];
    for (const [key, lv] of level) {
        files.get(key).level = lv;
        (levels[lv] = levels[lv] || []).push(key);
    }
    return { levels: levels.map(l => (l || []).sort()), cycles };
}

/**
 * Extrae identificadores de objetos NetSuite (campos, registros, búsquedas, scripts).
 * @param {string} text
 * @returns {Set<string>} En minúsculas.
 */
function extractIds(text) {
    const re = /\b(?:customsearch|customrecord|custbody|custcol|custentity|custrecord|custitem|custscript|customscript|customdeploy|custtmpl|custtab)_[a-z0-9_]*[a-z0-9](?![a-z0-9_*])/gi;
    const out = new Set();
    let m;
    while ((m = re.exec(text)) !== null) out.add(m[0].toLowerCase().replace(/_vacia$/, ''));
    return out;
}

/**
 * Enmascara literales largos en líneas que mencionan credenciales.
 * @param {string} line
 * @returns {string}
 */
function maskLine(line) {
    const trimmed = line.trim().slice(0, 160);
    return CREDENTIAL_NAME.test(trimmed) || /pass|token|secret|authorization/i.test(trimmed)
        ? trimmed.replace(/(['"])(?:(?!\1).){6,}\1/g, '"***"')
        : trimmed;
}

/**
 * Busca valores hardcodeados dependientes de entorno en código fuente.
 * @param {Map<string, Object>} files
 * @returns {Array<Object>}
 */
function scanHardcodes(files) {
    const out = [];
    const constRe = /\b([A-Z][A-Z0-9_]*(?:ID|FOLDER|BUNDLE|LIST_VALUE)[A-Z0-9_]*)\s*[:=]\s*(['"]?-?\d+['"]?)/;
    const urlRe = /(['"])https?:\/\/[^'"\s]+\1/;

    for (const info of files.values()) {
        info.src.split(/\r?\n/).forEach((line, i) => {
            const isComment = /^\s*(\/\/|\*|\/\*)/.test(line);
            const where = info.path + ':' + (i + 1);

            const c = constRe.exec(line);
            if (c && !isComment) {
                const value = c[2].replace(/['"]/g, '');
                out.push({ kind: 'ID_HARDCODEADO', name: c[1], value, negative: value.startsWith('-'), where, snippet: maskLine(line) });
            }
            if (SANDBOX_LITERAL.test(line)) {
                out.push({ kind: 'LITERAL_SANDBOX', where, inComment: isComment, snippet: maskLine(line) });
            }
            if (urlRe.test(line) && !isComment) {
                out.push({ kind: 'URL_LITERAL', where, snippet: maskLine(line) });
            }
        });
    }
    return out;
}

/**
 * Analiza plantillas FreeMarker de Facturama.
 * @param {string} dir
 * @returns {Array<Object>}
 */
function analyzeTemplates(dir) {
    return walk(dir)
        .filter(f => /^facturama_.*\.ftl$/i.test(path.basename(f)))
        .map(abs => {
            const src = fs.readFileSync(abs, 'utf8');
            return {
                file: path.basename(abs),
                bytes: Buffer.byteLength(src),
                nameId: (/"NameId"\s*:\s*"?(\d+)"?/.exec(src) || [])[1] || null,
                cfdiType: (/"CfdiType"\s*:\s*"([A-Z])"/.exec(src) || [])[1] || null,
                stopGuards: (src.match(/<#stop/g) || []).length,
                usesDesgloseDetalle: /custcol_desglose_detalle/i.test(src),
                usesCartaPortePayload: /custbody_sads_fama_cartaporte_payload/i.test(src),
                ids: [...extractIds(src)].sort()
            };
        });
}

/**
 * Ejecuta git en la raíz del repositorio.
 * @param {Array<string>} args
 * @returns {string|null} Salida o null si git falla.
 */
function git(args) {
    try {
        return cp.execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).replace(/\s+$/, '');
    } catch (e) {
        return null;
    }
}

/**
 * Estado de git acotado al proyecto.
 * @param {string} projectDir
 * @returns {Object}
 */
function gitState(projectDir) {
    const rel = posix(path.relative(REPO_ROOT, projectDir));
    const status = git(['status', '--porcelain', '--', rel]);
    if (status === null) return { available: false };
    const changes = status.split(/\r?\n/).filter(Boolean).map(l => ({ code: l.slice(0, 2).trim(), file: l.slice(3).replace(/^"|"$/g, '') }));
    const tags = git(['tag', '--points-at', 'HEAD']);
    return {
        available: true,
        branch: git(['rev-parse', '--abbrev-ref', 'HEAD']),
        head: git(['rev-parse', '--short', 'HEAD']),
        tagsAtHead: tags ? tags.split(/\r?\n/).filter(Boolean) : [],
        changesInSrc: changes.filter(c => c.file.indexOf('/src/') !== -1),
        changesOutsideSrc: changes.filter(c => c.file.indexOf('/src/') === -1)
    };
}

/**
 * Lee manifest.xml: features y objetos de los que depende el proyecto.
 * @param {string} projectSrc
 * @returns {Object}
 */
function parseManifest(projectSrc) {
    const file = path.join(projectSrc, 'manifest.xml');
    if (!fs.existsSync(file)) return { present: false, features: [], objects: [] };
    const xml = fs.readFileSync(file, 'utf8');
    const features = [];
    const fre = /<feature required="(true|false)">([^<]+)<\/feature>/g;
    let m;
    while ((m = fre.exec(xml)) !== null) features.push({ name: m[2], required: m[1] === 'true' });
    const objects = [];
    const ore = /<object>([^<]+)<\/object>/g;
    while ((m = ore.exec(xml)) !== null) objects.push(m[1]);
    return { present: true, features, objects: objects.sort() };
}

/**
 * Orquesta todo el análisis y devuelve el informe como objeto.
 * @param {Object} opts
 * @returns {Object}
 */
function buildReport(opts) {
    const projectSrc = path.join(opts.projectDir, 'src');
    const fcRoot = path.join(projectSrc, 'FileCabinet');
    const objectsDir = path.join(projectSrc, 'Objects');
    const findings = [];
    const add = (severity, area, id, message, evidence, checklist) =>
        findings.push({ severity, area, id, message, evidence: evidence || '', checklist: checklist || '' });

    const sdfObjects = walk(objectsDir).filter(f => f.endsWith('.xml'))
        .map(f => parseSdfObject(f, projectSrc)).filter(Boolean);
    const files = analyzeJsFiles(fcRoot);
    const order = computeDeployOrder(files);
    const templates = analyzeTemplates(opts.templatesDir);
    const manifest = parseManifest(projectSrc);
    const git_ = gitState(opts.projectDir);

    const definedIds = new Set();
    for (const o of sdfObjects) {
        definedIds.add(o.scriptid.toLowerCase());
        o.deployments.forEach(d => definedIds.add(d.scriptid.toLowerCase()));
        o.scriptCustomFields.forEach(s => definedIds.add(s.toLowerCase()));
        o.recordFields.forEach(s => definedIds.add(s.toLowerCase()));
        o.instances.forEach(i => definedIds.add(i.scriptid.toLowerCase()));
    }
    const objectByScriptfile = new Map();
    for (const o of sdfObjects) if (o.scriptfile) objectByScriptfile.set(o.scriptfile, o);

    // Referencias scriptfile -> archivo
    for (const o of sdfObjects) {
        if (o.scriptfile && !files.has(o.scriptfile)) {
            add('BLOQUEANTE', 'SDF', 'SCRIPTFILE_INEXISTENTE', o.scriptid + ' apunta a un archivo que no existe en File Cabinet', o.scriptfile);
        }
    }

    // Dependencias locales rotas y ciclos
    for (const f of files.values()) {
        for (const dep of f.brokenDeps) {
            add('BLOQUEANTE', 'Dependencias', 'DEPENDENCIA_LOCAL_ROTA', f.path + ' importa un módulo que no existe', dep);
        }
    }
    for (const c of order.cycles) {
        add('BLOQUEANTE', 'Dependencias', 'CICLO_DE_DEPENDENCIAS', 'Ciclo entre módulos', c.join(' -> '));
    }

    // Módulos que deben permanecer puros
    for (const p of PURE_MODULES) {
        const f = files.get(p);
        if (f && f.nativeModules.length > 0) {
            add('BLOQUEANTE', 'Arquitectura', 'MODULO_PURO_CON_N', p + ' debe tener cero módulos N/*', f.nativeModules.join(', '));
        }
    }

    // Scripts con tipo que requiere registro de script
    for (const f of files.values()) {
        if (!f.scriptType) continue;
        const hasObject = [...objectByScriptfile.keys()].includes(f.path);
        if (SCRIPT_RECORD_TYPES.includes(f.scriptType) && !hasObject) {
            const sev = f.scriptType === 'plugintypeimpl' ? 'ALTA' : 'MEDIA';
            add(sev, 'SDF', 'SCRIPT_SIN_OBJETO_SDF',
                f.path + ' (' + f.scriptType + ') no tiene objeto SDF: se crea y asocia a mano en la cuenta destino', '', 'D-07');
        }
        if (f.scriptType === 'ClientScript' && !hasObject) {
            const base = path.basename(f.path);
            const referenced = [...files.values()].some(o => o !== f && o.src.indexOf(base) !== -1);
            add(referenced ? 'INFO' : 'MEDIA', 'SDF', 'CLIENTSCRIPT_SIN_OBJETO',
                f.path + (referenced ? ' se enlaza por nombre de archivo desde otro script' : ' no tiene objeto SDF ni referencia desde otro script'));
        }
    }

    // Identificadores propios (_sads_) usados pero no definidos
    const usedBy = new Map();
    const scanTargets = [...files.values()].map(f => ({ name: f.path, text: f.src }))
        .concat(opts.templateSources.map(t => ({ name: 'template:' + t.name, text: t.text })));
    for (const t of scanTargets) {
        for (const id of extractIds(t.text)) {
            if (!usedBy.has(id)) usedBy.set(id, new Set());
            usedBy.get(id).add(t.name);
        }
    }
    const external = {};
    for (const [id, users] of [...usedBy.entries()].sort()) {
        if (definedIds.has(id)) continue;
        const fam = EXTERNAL_FAMILIES.find(f => f.test.test(id));
        const famName = fam ? fam.name : 'Otros (cuenta)';
        (external[famName] = external[famName] || []).push({ id, usedIn: [...users].sort() });
        if (id.indexOf(OWNED_PREFIX) !== -1) {
            const isPrefixMention = [...definedIds].some(d => d.startsWith(id + '_'));
            if (isPrefixMention) {
                add('INFO', 'Dependencias', 'MENCION_ABREVIADA_DE_ID_PROPIO', id + ' es prefijo de un id definido (probable mención en texto)', [...users].sort().join(', '));
            } else {
                add('BLOQUEANTE', 'Dependencias', 'ID_PROPIO_NO_DEFINIDO', id + ' usa el prefijo propio pero no está definido en ningún objeto SDF', [...users].sort().join(', '));
            }
        }
    }

    // Instancias de datos dentro de objetos SDF
    for (const o of sdfObjects) {
        for (const i of o.instances) {
            if (i.credentialTags.length > 0) {
                add('BLOQUEANTE', 'SDF', 'INSTANCIA_CON_CREDENCIALES',
                    o.scriptid + ': la instancia ' + i.scriptid + ' lleva campos de credenciales dentro del objeto SDF (valores no impresos)',
                    'campos: ' + i.credentialTags.join(', '), 'P-03');
            }
            if (i.sandboxBound) {
                add('ALTA', 'SDF', 'INSTANCIA_ATADA_A_SANDBOX', o.scriptid + ': la instancia ' + i.scriptid + ' tiene identificador de sandbox', '', 'P-03');
            }
            for (const ref of i.refs.filter(r => SANDBOX_SCRIPTID.test(r))) {
                add('ALTA', 'SDF', 'REFERENCIA_A_SANDBOX', o.scriptid + ' (instancia ' + i.scriptid + ') referencia un objeto de sandbox', ref, 'P-03');
            }
        }
    }

    // Manifest y referencias con identificador de sandbox o de cuenta
    for (const obj of manifest.objects) {
        if (SANDBOX_SCRIPTID.test(obj)) {
            add('ALTA', 'Manifest', 'MANIFEST_OBJETO_DE_SANDBOX', 'El manifest depende de un objeto con identificador de sandbox', obj, 'P-07');
        } else if (ACCOUNT_ID_IN_SCRIPTID.test(obj)) {
            add('MEDIA', 'Manifest', 'MANIFEST_OBJETO_CON_ID_DE_CUENTA', 'El manifest depende de un objeto con identificador numérico de cuenta/bundle', obj, 'P-07');
        }
    }
    for (const o of sdfObjects) {
        for (const ref of o.refs) {
            if (o.type === 'customrecordtype' && o.instances.some(i => i.refs.includes(ref))) continue;
            if (ACCOUNT_ID_IN_SCRIPTID.test(ref) || SANDBOX_SCRIPTID.test(ref)) {
                add('MEDIA', 'SDF', 'REFERENCIA_CON_ID_DE_CUENTA', o.scriptid + ' referencia un objeto con identificador de cuenta/bundle', ref, 'P-07');
            }
        }
    }

    // Estado de deployments
    const debugDeployments = [];
    for (const o of sdfObjects) {
        for (const d of o.deployments) {
            const ctx = o.scriptid + '/' + d.scriptid;
            if (d.status === 'TESTING') add('MEDIA', 'Deployment', 'DEPLOYMENT_EN_TESTING', ctx + ' está en TESTING (solo corre para el propietario)', '', 'D-10');
            if (o.type === 'suitelet' && d.allroles === 'F' && d.allemployees === 'F' && !d.audslctrole) {
                add('MEDIA', 'Deployment', 'SUITELET_SIN_AUDIENCIA', ctx + ' no tiene audiencia definida', '', 'D-10');
            }
            if (d.loglevel === 'DEBUG') debugDeployments.push(d.scriptid);
            if (d.runasrole) add('INFO', 'Deployment', 'RUNASROLE', ctx + ' se ejecuta como ' + d.runasrole);
            if (d.startdate && new Date(d.startdate) < new Date()) {
                add('INFO', 'Deployment', 'FECHA_INICIO_PASADA', ctx + ' tiene fecha de inicio pasada', d.startdate);
            }
        }
    }

    if (debugDeployments.length > 0) {
        add('MEDIA', 'Deployment', 'LOGLEVEL_DEBUG', debugDeployments.length + ' deployments en nivel DEBUG', debugDeployments.sort().join(', '), 'V-12');
    }

    // Alcance de campos que cada User Event declara persistir
    const fieldByScriptid = new Map(sdfObjects.filter(o => o.type === 'transactionbodycustomfield').map(o => [o.scriptid.toLowerCase(), o]));
    for (const o of sdfObjects.filter(x => x.type === 'usereventscript')) {
        const declared = [...extractIds(o.description)].filter(id => id.startsWith('custbody_'));
        for (const d of o.deployments) {
            const flag = RECORD_TYPE_TO_BODY_FLAG[d.recordtype];
            if (!flag) continue;
            for (const id of declared) {
                const field = fieldByScriptid.get(id);
                if (field && field.appliesTo.indexOf(flag) === -1) {
                    add('BLOQUEANTE', 'SDF', 'CAMPO_FUERA_DE_ALCANCE',
                        o.scriptid + ' declara persistir ' + id + ' en ' + d.recordtype + ' pero el campo no aplica a ese registro (' + flag + ' = F)');
                }
            }
        }
    }

    // Hardcodes de entorno
    const hardcodes = scanHardcodes(files);
    for (const h of hardcodes) {
        if (h.kind === 'ID_HARDCODEADO') {
            const accountBound = !h.negative && /FOLDER|SUBSIDIARY/.test(h.name);
            add(h.negative ? 'INFO' : (accountBound ? 'ALTA' : 'MEDIA'), 'HARDCODE', 'ID_HARDCODEADO',
                h.name + ' = ' + h.value + (h.negative ? ' (id de sistema)' : ': verificar su equivalente en producción'), h.where, 'P-06');
        } else if (h.kind === 'LITERAL_SANDBOX') {
            add(h.inComment ? 'INFO' : 'ALTA', 'HARDCODE', 'LITERAL_SANDBOX', 'Literal que sugiere dependencia de sandbox', h.where + ' | ' + h.snippet, 'P-06');
        } else if (h.kind === 'URL_LITERAL') {
            add('MEDIA', 'HARDCODE', 'URL_LITERAL', 'URL literal en código', h.where + ' | ' + h.snippet, 'P-06');
        }
    }

    // Archivos que no son código dentro de File Cabinet
    const nonCode = walk(fcRoot).filter(f => !/\.(js|xml)$/.test(f) && !/\.attributes/.test(posix(f)));
    for (const f of nonCode) {
        add('MEDIA', 'Despliegue', 'ARCHIVO_NO_CODIGO_EN_FILECABINET',
            'deploy.xml incluye ~/FileCabinet/*: este archivo viajaría a producción', '/' + posix(path.relative(fcRoot, f)), 'P-04');
    }

    // Plantillas
    const groups = {};
    for (const t of templates) {
        const key = (t.cfdiType || '?') + '|' + (t.nameId || '?');
        (groups[key] = groups[key] || []).push(t.file);
    }
    for (const [key, list] of Object.entries(groups)) {
        if (list.length > 1) {
            add('INFO', 'Plantillas', 'PLANTILLAS_CANDIDATAS_DUPLICADAS',
                'Varias plantillas con CfdiType/NameId ' + key.replace('|', '/') + ': confirmar cuál se carga en producción', list.join(', '), 'D-08');
        }
    }

    // project.json
    const projectJson = path.join(opts.projectDir, 'project.json');
    let authId = null;
    if (fs.existsSync(projectJson)) {
        try { authId = JSON.parse(fs.readFileSync(projectJson, 'utf8')).defaultAuthId || null; } catch (e) { authId = null; }
    }

    // Git
    if (!git_.available) {
        add('INFO', 'Git', 'GIT_NO_DISPONIBLE', 'No se pudo consultar git; no se evalúa P-01', '', 'P-01');
    } else if (git_.changesInSrc.length > 0) {
        add('ALTA', 'Git', 'CAMBIOS_SIN_COMMIT', git_.changesInSrc.length + ' archivos de src/ con cambios sin commit', git_.changesInSrc.map(c => c.code + ' ' + c.file).join('; '), 'P-01');
    } else if (git_.tagsAtHead.length === 0) {
        add('MEDIA', 'Git', 'SIN_TAG_DE_RELEASE', 'HEAD no tiene tag de release', git_.head, 'P-01');
    }

    // Checklist local
    const has = id => findings.some(f => f.id === id);
    const count = id => findings.filter(f => f.id === id).length;
    const instCred = findings.filter(f => f.id === 'INSTANCIA_CON_CREDENCIALES').length;
    const sandboxRefs = findings.filter(f => ['INSTANCIA_ATADA_A_SANDBOX', 'REFERENCIA_A_SANDBOX', 'MANIFEST_OBJETO_DE_SANDBOX'].includes(f.id)).length;

    const checklist = [
        {
            id: 'P-01', tarea: 'Versión congelada en git (sin cambios en src/ y con tag en HEAD)',
            estado: !git_.available ? 'NO VERIFICABLE' : (git_.changesInSrc.length > 0 ? 'FALLA' : (git_.tagsAtHead.length ? 'PASA' : 'REVISAR')),
            evidencia: git_.available ? git_.changesInSrc.length + ' archivos con cambios; tags en HEAD: ' + (git_.tagsAtHead.join(', ') || 'ninguno') : 'git no disponible'
        },
        {
            id: 'P-02', tarea: 'authId de despliegue distinto de sandbox',
            estado: authId === null ? 'REVISAR' : (/(^|[_-])sb\d*($|[_-])|sandbox/i.test(authId) ? 'REVISAR' : 'PASA'),
            evidencia: authId === null ? 'project.json ausente o sin defaultAuthId' : 'defaultAuthId = ' + authId
        },
        {
            id: 'P-03', tarea: 'Objetos SDF sin instancias con credenciales ni identificadores de sandbox',
            estado: (instCred + sandboxRefs) > 0 ? 'FALLA' : 'PASA',
            evidencia: instCred + ' instancias con campos de credenciales; ' + sandboxRefs + ' referencias a sandbox'
        },
        {
            id: 'P-04', tarea: 'File Cabinet sin archivos que no sean código',
            estado: has('ARCHIVO_NO_CODIGO_EN_FILECABINET') ? 'FALLA' : 'PASA',
            evidencia: count('ARCHIVO_NO_CODIGO_EN_FILECABINET') + ' archivos'
        },
        {
            id: 'P-06 (parcial)', tarea: 'IDs hardcodeados identificados para verificar en producción',
            estado: findings.some(f => f.id === 'ID_HARDCODEADO' && f.severity !== 'INFO') ? 'REVISAR' : 'PASA',
            evidencia: findings.filter(f => f.id === 'ID_HARDCODEADO' && f.severity !== 'INFO').map(f => f.message.split(':')[0]).join('; ') || 'ninguno'
        },
        {
            id: 'P-07 (parcial)', tarea: 'Manifest sin objetos de sandbox',
            estado: has('MANIFEST_OBJETO_DE_SANDBOX') ? 'FALLA' : (has('MANIFEST_OBJETO_CON_ID_DE_CUENTA') ? 'REVISAR' : 'PASA'),
            evidencia: count('MANIFEST_OBJETO_DE_SANDBOX') + ' de sandbox; ' + count('MANIFEST_OBJETO_CON_ID_DE_CUENTA') + ' con id de cuenta/bundle'
        },
        {
            id: 'ESTR-01', tarea: 'Todo scriptfile de SDF existe y no hay dependencias locales rotas ni ciclos',
            estado: (has('SCRIPTFILE_INEXISTENTE') || has('DEPENDENCIA_LOCAL_ROTA') || has('CICLO_DE_DEPENDENCIAS')) ? 'FALLA' : 'PASA',
            evidencia: order.levels.length + ' niveles de dependencia; ' + order.cycles.length + ' ciclos'
        },
        {
            id: 'ESTR-02', tarea: 'Identificadores propios (_sads_) definidos y campos dentro de alcance',
            estado: (has('ID_PROPIO_NO_DEFINIDO') || has('CAMPO_FUERA_DE_ALCANCE')) ? 'FALLA' : 'PASA',
            evidencia: count('ID_PROPIO_NO_DEFINIDO') + ' sin definir; ' + count('CAMPO_FUERA_DE_ALCANCE') + ' fuera de alcance'
        },
        {
            id: 'ESTR-03', tarea: 'Mapper de dominio sin módulos N/*',
            estado: has('MODULO_PURO_CON_N') ? 'FALLA' : 'PASA',
            evidencia: PURE_MODULES.join(', ')
        },
        {
            id: 'D-07 (parcial)', tarea: 'Scripts sin objeto SDF identificados (creación manual)',
            estado: has('SCRIPT_SIN_OBJETO_SDF') ? 'REVISAR' : 'PASA',
            evidencia: findings.filter(f => f.id === 'SCRIPT_SIN_OBJETO_SDF').map(f => f.message.split(' ')[0]).join('; ') || 'ninguno'
        }
    ];

    const counts = {};
    SEVERITY_ORDER.forEach(s => { counts[s] = findings.filter(f => f.severity === s).length; });
    findings.sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity) || a.id.localeCompare(b.id) || a.message.localeCompare(b.message));
    const verdict = counts.BLOQUEANTE > 0 ? 'NO LISTO' : (counts.ALTA > 0 ? 'LISTO CON OBSERVACIONES' : 'LISTO (fase local)');

    return {
        meta: {
            generatedAt: new Date().toISOString(),
            scriptVersion: SCRIPT_VERSION,
            scope: 'local',
            projectDir: posix(path.relative(REPO_ROOT, opts.projectDir)),
            node: process.version
        },
        summary: { verdict, counts },
        git: git_,
        checklistLocal: checklist,
        findings,
        inventory: {
            sdfObjects: sdfObjects.map(o => ({
                scriptid: o.scriptid, type: o.type, name: o.name, file: o.file, scriptfile: o.scriptfile,
                fieldtype: o.fieldtype, appliesTo: o.appliesTo, subtab: o.subtab,
                recordFields: o.recordFields.length, instances: o.instances.map(i => ({
                    scriptid: i.scriptid, fieldTags: i.fieldTags, credentialTags: i.credentialTags, sandboxBound: i.sandboxBound
                })),
                deployments: o.deployments
            })).sort((a, b) => a.type.localeCompare(b.type) || a.scriptid.localeCompare(b.scriptid)),
            files: [...files.values()].map(f => ({
                path: f.path, bytes: f.bytes, apiVersion: f.apiVersion, scriptType: f.scriptType,
                nativeModules: f.nativeModules, localDeps: f.localDeps, level: f.level,
                sdfObject: (objectByScriptfile.get(f.path) || {}).scriptid || null
            })).sort((a, b) => a.level - b.level || a.path.localeCompare(b.path)),
            templates: templates.map(t => ({ ...t, ids: t.ids.length })),
            manifest
        },
        deployOrder: order,
        externalDependencies: external,
        notVerifiableLocally: NOT_VERIFIABLE_LOCALLY
    };
}

/** @param {string} s @returns {string} Texto seguro para una celda de tabla Markdown. */
function cell(s) {
    return String(s === null || s === undefined ? '' : s).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

/**
 * Convierte el informe en Markdown.
 * @param {Object} r
 * @returns {string}
 */
function renderMarkdown(r) {
    const L = [];
    const table = (head, rows) => {
        L.push('| ' + head.join(' | ') + ' |');
        L.push('|' + head.map(() => '---').join('|') + '|');
        rows.forEach(row => L.push('| ' + row.map(cell).join(' | ') + ' |'));
        L.push('');
    };

    L.push('# Informe de pre-despliegue (auditoría local)', '');
    L.push('Generado: ' + r.meta.generatedAt + ' | Script v' + r.meta.scriptVersion + ' | Proyecto: ' + r.meta.projectDir, '');
    L.push('## Veredicto', '');
    L.push(r.summary.verdict + ' (bloqueantes: ' + r.summary.counts.BLOQUEANTE + ', altas: ' + r.summary.counts.ALTA +
        ', medias: ' + r.summary.counts.MEDIA + ', informativas: ' + r.summary.counts.INFO + ')', '');
    if (r.git.available) {
        L.push('Git: rama ' + r.git.branch + ', HEAD ' + r.git.head + ', tags en HEAD: ' + (r.git.tagsAtHead.join(', ') || 'ninguno') +
            ', cambios en src/: ' + r.git.changesInSrc.length, '');
    }

    L.push('## 1. Gates del checklist verificables localmente', '');
    table(['ID', 'Tarea', 'Estado', 'Evidencia'], r.checklistLocal.map(c => [c.id, c.tarea, c.estado, c.evidencia]));

    L.push('## 2. Hallazgos', '');
    table(['Severidad', 'Área', 'Código', 'Descripción', 'Evidencia', 'Checklist'],
        r.findings.map(f => [f.severity, f.area, f.id, f.message, f.evidence, f.checklist]));

    L.push('## 3. Inventario de objetos SDF', '');
    table(['Tipo', 'scriptid', 'Archivo de script / alcance', 'Detalle'],
        r.inventory.sdfObjects.map(o => {
            const detail = o.deployments.length
                ? o.deployments.map(d => d.scriptid + ' [' + (d.recordtype || '-') + ', ' + d.status + ']').join('; ')
                : (o.instances.length ? o.instances.length + ' instancias de datos' : (o.fieldtype || ''));
            return [o.type, o.scriptid, o.scriptfile || (o.appliesTo.join(', ')), detail];
        }));

    L.push('## 4. Archivos y orden de despliegue (nivel 0 = hojas, se despliegan primero)', '');
    r.deployOrder.levels.forEach((level, i) => {
        L.push('Nivel ' + i + ':', '');
        level.forEach(p => {
            const f = r.inventory.files.find(x => x.path === p);
            L.push('- ' + p + (f && f.scriptType ? ' (' + f.scriptType + ')' : '') + (f && f.sdfObject ? ' -> ' + f.sdfObject : ''));
        });
        L.push('');
    });

    L.push('## 5. Dependencias externas (no definidas en el proyecto)', '');
    Object.keys(r.externalDependencies).sort().forEach(fam => {
        L.push('### ' + fam + ' (' + r.externalDependencies[fam].length + ')', '');
        table(['Identificador', 'Usado en'], r.externalDependencies[fam].map(e => [e.id, e.usedIn.join(', ')]));
    });

    L.push('## 6. Plantillas FreeMarker de Facturama', '');
    table(['Archivo', 'CfdiType', 'NameId', '<#stop>', 'desglose_detalle', 'payload Carta Porte', 'IDs externos'],
        r.inventory.templates.map(t => [t.file, t.cfdiType, t.nameId, t.stopGuards, t.usesDesgloseDetalle ? 'sí' : 'no', t.usesCartaPortePayload ? 'sí' : 'no', t.ids]));

    L.push('## 7. Manifest', '');
    L.push('Features requeridos: ' + (r.inventory.manifest.features.filter(f => f.required).map(f => f.name).join(', ') || 'ninguno'), '');
    L.push('Objetos de los que depende (' + r.inventory.manifest.objects.length + '): ' + r.inventory.manifest.objects.join(', '), '');

    L.push('## 8. No verificable localmente', '');
    table(['ID', 'Tarea'], r.notVerifiableLocally.map(n => [n.id, n.tarea]));

    L.push('## Supuestos y límites', '');
    L.push('- Análisis estático del repositorio: no consulta NetSuite ni la cuenta de producción.');
    L.push('- Los identificadores externos se extraen por patrón de nombre (custbody_, custcol_, customrecord_, etc.); una cadena en un comentario también cuenta.');
    L.push('- Las instancias de datos de objetos SDF se reportan por nombre de campo; sus valores no se leen ni se imprimen.');
    L.push('- La clasificación de familias externas (Mexico Compliance, DRT) es heurística por prefijo.');
    L.push('- Un estado PASA en este informe no sustituye las verificaciones contra la cuenta (sección 8).', '');
    return L.join('\n');
}

/** Punto de entrada. */
function main() {
    const args = parseArgs(process.argv.slice(2));
    const projectDir = path.resolve(args.project || path.join(REPO_ROOT, 'pac_facturama_integration'));
    const templatesDir = path.resolve(args.templates || path.join(REPO_ROOT, 'Tests', 'Pruebas de E Docs NS CLI API', 'Plantillas'));
    const outDir = path.resolve(args.out || path.join(__dirname, 'reports'));

    const templateSources = walk(templatesDir)
        .filter(f => /^facturama_.*\.ftl$/i.test(path.basename(f)))
        .map(f => ({ name: path.basename(f), text: fs.readFileSync(f, 'utf8') }));

    const report = buildReport({ projectDir, templatesDir, templateSources });

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'preflight_report.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(outDir, 'preflight_report.md'), renderMarkdown(report));

    const c = report.summary.counts;
    console.log('Veredicto: ' + report.summary.verdict);
    console.log('Bloqueantes: ' + c.BLOQUEANTE + ' | Altas: ' + c.ALTA + ' | Medias: ' + c.MEDIA + ' | Info: ' + c.INFO);
    console.log('Informe: ' + posix(path.join(outDir, 'preflight_report.md')));
    console.log('Datos:   ' + posix(path.join(outDir, 'preflight_report.json')));
    if (c.BLOQUEANTE > 0 && !args.noFail) process.exitCode = 2;
}

main();
