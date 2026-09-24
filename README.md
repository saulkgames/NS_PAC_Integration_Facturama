# NS PAC Integration Facturama

Integración entre NetSuite y **Facturama** (Proveedor Autorizado de Certificación) para el timbrado de Comprobantes Fiscales Digitales por Internet (CFDI 4.0) del grupo industrial Almetal/NH, bajo el marco fiscal mexicano (SAT, CFDI 4.0, Complemento Carta Porte, Nómina).

Proyecto SDF (SuiteCloud Development Framework) de tipo *Account Customization*, implementado en SuiteScript 2.x.

## Alcance funcional

- **Timbrado individual**: plug-in "Sending Method" integrado al ciclo nativo de E-Documents de NetSuite para timbrar ventas de contado (Cash Sale) contra la API de Facturama, recuperar el XML certificado, generar el PDF y actualizar los campos fiscales de la transacción de origen.
- **Facturación global**: herramienta con interfaz Suitelet para seleccionar múltiples Cash Sales y generar un CFDI global de forma asíncrona mediante un proceso Map/Reduce, que consulta las transacciones, construye el payload CFDI 4.0, timbra con Facturama y actualiza cada transacción con UUID, XML y PDF certificados.
- **Complemento de pago (PPD)**: en desarrollo activo, bloqueado en pruebas de sandbox. Dos User Events calculan de forma independiente los datos que la factura individual no puede resolver por sí sola: `fama_invoice_tax_object_ue.js` cachea el `ObjetoImp` SAT en cada factura al guardarse, y `fama_payment_complement_ue.js` arma el arreglo `RelatedDocuments` (parcialidad, saldo anterior, impuestos prorrateados) al guardar el Customer Payment, con un filtro inicial que descarta facturas PUE antes de cualquier cálculo costoso y un validador que audita el JSON completo antes de persistirlo. La plantilla FreeMarker (`facturama_customerpayment_template.ftl`, fuera del proyecto SDF — ver Estructura) consume ese resultado como adaptador puro, sin lógica propia. Un Map/Reduce (`fama_backfill_tax_object_mr.js`) permite poblar el campo cacheado en facturas existentes.

## Estructura del repositorio

```
CLAUDE.md                           Convenciones de arquitectura del proyecto (capas, Fail-Safe/Fail-Fast)
pac_facturama_integration/          Proyecto SDF (manifest, deploy, objetos)
  package.json, test/                 Suite Jest para los módulos de lógica pura (sin dependencias N/*)
  src/
    Objects/                        Campos custom, registros custom y deployments (XML)
    FileCabinet/SuiteScripts/
      Facturama_Integration/
        pi_sads_fama_connector.js           Plug-in de timbrado individual (Sending Method)
        fama_global_invoice_suitelet.js      Suitelet de facturación global
        fama_global_invoice_client.js        Client Script del Suitelet
        fama_global_invoice_library.js       Lógica compartida del flujo global
        sads_fama_mr_global_orchestrator.js  Map/Reduce orquestador de facturación global
        fama_invoice_tax_object_ue.js        User Event: cachea ObjetoImp SAT en la factura
        fama_payment_complement_ue.js        User Event: arma y valida RelatedDocuments del Complemento de Pago
        fama_backfill_tax_object_mr.js       Map/Reduce: backfill de ObjetoImp en facturas existentes
        lib/
          sads_fama_api.js              Adaptador HTTP contra la API de Facturama
          sads_fama_cfdi.js             Construcción de campos y estructura CFDI
          sads_fama_config.js           Configuración del PAC por subsidiaria
          sads_fama_files.js            Descarga y almacenamiento de XML/PDF
          sads_fama_global_mapper.js    Mapeo de transacciones al payload CFDI global
          sads_fama_logger.js           Logging centralizado
          sads_fama_response_handler.js Manejo de respuestas y errores del PAC
          sads_fama_sat_catalog.js      Catálogo SAT compartido (PPD/PUE, ObjetoImp por línea)
docs/
  development-log.md                Bitácora cronológica de desarrollo
  Informe_ejecutivo_bitacora_Facturama.{docx,pdf}
Tests/                              Payloads de ejemplo, plantillas y material de referencia
  Pruebas de E Docs NS CLI API/Plantillas/
    facturama_customerpayment_template.ftl   Plantilla E-Document del Complemento de Pago (adaptador puro)
```

## Objetos custom relevantes

| Objeto | Propósito |
|---|---|
| `customrecord_sads_fama_config` | Configuración de credenciales y parámetros del PAC por subsidiaria |
| `customrecord_sads_fama_logger` | Registro de logs de la integración |
| `custbody_sads_fama_req_id` / `custbody_sads_fama_cfdi_resp_id` | Identificadores de solicitud/respuesta de Facturama en la transacción |
| `custbody_sads_edocuments_package` | Paquete de E-Document asociado |
| `custbody_sads_fama_cpago_payload` | JSON pre-calculado del arreglo `RelatedDocuments` (Complemento de Pago), en el Customer Payment |
| `custbody_sads_fama_tax_object` | `ObjetoImp` SAT cacheado a nivel factura |
| `customscript_fama_global_invoice_sl` | Deployment del Suitelet de facturación global |
| `customscript_sads_fama_mr_global_orch` | Deployment del Map/Reduce orquestador |
| `customscript_sads_fama_payment_ue` / `customscript_sads_fama_invoice_ue` | Deployments de los User Events del Complemento de Pago |
| `customscript_fama_backfill_tax_object_mr` | Deployment del Map/Reduce de backfill (ejecución manual, no programada) |

## Estado

En desarrollo activo. Consultar [docs/development-log.md](docs/development-log.md) para el detalle cronológico de avances, resultados de pruebas y pendientes por hito. Las convenciones de arquitectura del proyecto (separación por capas, criterio Fail-Safe vs. Fail-Fast) están documentadas en [CLAUDE.md](CLAUDE.md).

El Complemento de Pago es el frente activo: el cálculo de `RelatedDocuments` ya está validado con datos reales de sandbox, pero la generación del E-Document para Customer Payment todavía falla en pruebas — ver la entrada del 2026-09-23 en la bitácora para el diagnóstico en curso.

**Riesgo abierto:** se identificó que `customrecord_sads_fama_config.xml` llegó a contener credenciales en texto claro en el historial del repositorio. Estas credenciales deben considerarse comprometidas hasta confirmar su rotación y la limpieza del historial de versiones.

## Supuestos

- Esta descripción se actualizó a partir de la estructura de archivos y la bitácora de desarrollo existentes en el repositorio al 2026-09-23; no se verificó contra el entorno NetSuite en vivo.
