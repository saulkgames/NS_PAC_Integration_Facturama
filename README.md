# NS PAC Integration Facturama

Integración entre NetSuite y **Facturama** (Proveedor Autorizado de Certificación) para el timbrado de Comprobantes Fiscales Digitales por Internet (CFDI 4.0) del grupo industrial Almetal/NH, bajo el marco fiscal mexicano (SAT, CFDI 4.0, Complemento Carta Porte, Nómina).

Proyecto SDF (SuiteCloud Development Framework) de tipo *Account Customization*, implementado en SuiteScript 2.x.

## Alcance funcional

- **Timbrado individual**: plug-in "Sending Method" integrado al ciclo nativo de E-Documents de NetSuite para timbrar ventas de contado (Cash Sale) contra la API de Facturama, recuperar el XML certificado, generar el PDF y actualizar los campos fiscales de la transacción de origen.
- **Facturación global**: herramienta con interfaz Suitelet para seleccionar múltiples Cash Sales y generar un CFDI global de forma asíncrona mediante un proceso Map/Reduce, que consulta las transacciones, construye el payload CFDI 4.0, timbra con Facturama y actualiza cada transacción con UUID, XML y PDF certificados.
- **Complemento de pagos (PPD)**: en desarrollo; construcción del CFDI con complemento de pagos para operaciones con forma de pago 99.

## Estructura del repositorio

```
pac_facturama_integration/          Proyecto SDF (manifest, deploy, objetos)
  src/
    Objects/                        Campos custom, registros custom y deployments (XML)
    FileCabinet/SuiteScripts/
      Facturama_Integration/
        pi_sads_fama_connector.js           Plug-in de timbrado individual (Sending Method)
        fama_global_invoice_suitelet.js      Suitelet de facturación global
        fama_global_invoice_client.js        Client Script del Suitelet
        fama_global_invoice_library.js       Lógica compartida del flujo global
        sads_fama_mr_global_orchestrator.js  Map/Reduce orquestador de facturación global
        lib/
          sads_fama_api.js              Adaptador HTTP contra la API de Facturama
          sads_fama_cfdi.js             Construcción de campos y estructura CFDI
          sads_fama_config.js           Configuración del PAC por subsidiaria
          sads_fama_files.js            Descarga y almacenamiento de XML/PDF
          sads_fama_global_mapper.js    Mapeo de transacciones al payload CFDI global
          sads_fama_logger.js           Logging centralizado
          sads_fama_response_handler.js Manejo de respuestas y errores del PAC
docs/
  development-log.md                Bitácora cronológica de desarrollo
  Informe_ejecutivo_bitacora_Facturama.{docx,pdf}
Tests/                              Payloads de ejemplo, plantillas y material de referencia
```

## Objetos custom relevantes

| Objeto | Propósito |
|---|---|
| `customrecord_sads_fama_config` | Configuración de credenciales y parámetros del PAC por subsidiaria |
| `customrecord_sads_fama_logger` | Registro de logs de la integración |
| `custbody_sads_fama_req_id` / `custbody_sads_fama_cfdi_resp_id` | Identificadores de solicitud/respuesta de Facturama en la transacción |
| `custbody_sads_edocuments_package` | Paquete de E-Document asociado |
| `customscript_fama_global_invoice_sl` | Deployment del Suitelet de facturación global |
| `customscript_sads_fama_mr_global_orch` | Deployment del Map/Reduce orquestador |

## Estado

En desarrollo activo. Consultar [docs/development-log.md](docs/development-log.md) para el detalle cronológico de avances, resultados de pruebas y pendientes por hito.

**Riesgo abierto:** se identificó que `customrecord_sads_fama_config.xml` llegó a contener credenciales en texto claro en el historial del repositorio. Estas credenciales deben considerarse comprometidas hasta confirmar su rotación y la limpieza del historial de versiones.

## Supuestos

- Esta descripción se elaboró a partir de la estructura de archivos y la bitácora de desarrollo existentes en el repositorio al 2026-09-19; no se verificó contra el entorno NetSuite en vivo.
