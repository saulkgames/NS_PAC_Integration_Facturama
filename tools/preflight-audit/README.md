# Preflight Audit (local)

Auditoría estática de pre-despliegue del proyecto SDF `pac_facturama_integration`. Lee el
repositorio, no consulta NetSuite, y genera un informe en JSON y MD a partir de los mismos datos.
Node 18+, sin dependencias.

## Uso

```bash
cd tools/preflight-audit
node audit.js
```

Opciones: `--project <dir>`, `--templates <dir>`, `--out <dir>` (por defecto `reports/`),
`--no-fail` (no devuelve código 2 cuando hay bloqueantes).

Salida: `reports/preflight_report.json` y `reports/preflight_report.md`. Con la misma entrada
produce el mismo contenido, salvo `meta.generatedAt`.

## Qué revisa

- Inventario de objetos SDF (campos, registros, scripts y deployments) y de archivos `.js`.
- Cruce `scriptfile` ↔ archivo, dependencias locales rotas, ciclos, y orden de despliegue por niveles.
- Módulos que deben permanecer sin `N/*` (`PURE_MODULES` en `audit.js`).
- Scripts sin objeto SDF (plugin, ClientScript).
- Identificadores externos (`mx_*`, `drt_*`, `psg_*`) usados pero no definidos en el proyecto.
- Identificadores propios (`_sads_`) usados sin definición, y campos fuera del alcance del registro en que un User Event declara persistirlos.
- Instancias de datos dentro de objetos SDF (solo nombres de campo; los valores no se leen) y referencias a sandbox o a IDs de cuenta.
- IDs hardcodeados, literales de sandbox y URLs.
- Estado de deployments, archivos que no son código en File Cabinet, `authId`, estado de git.
- Plantillas `facturama_*.ftl`: `CfdiType`, `NameId`, guardas `<#stop>`.

## Límites

- No verifica nada contra la cuenta destino (ver sección "No verificable localmente" del informe).
- Los identificadores se extraen por patrón de nombre; una mención en un comentario o mensaje también cuenta.
- La familia de un identificador externo se infiere por prefijo.
- Un estado PASA no sustituye `project:validate --server` ni las pruebas de humo.
