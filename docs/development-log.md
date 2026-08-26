# Bitácora de desarrollo

Registro cronológico de avances técnicos del proyecto **NS PAC Integration Facturama**.

### 2026-08-01 — Resumen inicial de la integración NetSuite–Facturama

- **Estado:** pendiente de validación
- **Objetivo o problema:** Implementar un método de envío de E-Documents que conecte NetSuite con Facturama API-Lite para timbrar CFDI 4.0, recuperar el XML certificado y actualizar la transacción de origen.
- **Cambios realizados:** Se inicializó un proyecto SDF de tipo Account Customization y se incorporó un plug-in de envío en SuiteScript 2.0. El flujo implementado recibe el JSON generado por la plantilla de E-Document, obtiene la configuración del PAC por subsidiaria, autentica la petición, solicita el timbrado, descarga y guarda el XML, actualiza campos de certificación CFDI y genera/adjunta un PDF. El repositorio conserva una versión monolítica de fase inicial y una versión modular separada por configuración, API, manejo de archivos y actualización fiscal. También incluye registros personalizados para configuración y logging, plantillas FreeMarker, payloads de ejemplo y material técnico de referencia.
- **Evidencia:** Commit inicial [`999df9c`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/commit/999df9cc28e2ba1a8fc545e6b7a4b221a34ce73c).

### 2026-08-07 — Timbrado de Cash Sale y ajustes de estado y auditoría

- **Estado:** pendiente de validación
- **Objetivo o problema:** Completar la fase inicial del Sending Method para timbrar ventas de contado mediante Facturama y lograr que NetSuite actualice correctamente los campos, el estado y el Historial de Auditoría del documento electrónico.
- **Evidencia:** Commit [`3322e51`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/commit/3322e5138ab4793baa7d013b13c1280c07a02376) y merge [`cb65f02`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/commit/cb65f026bf3fcb12f26ce6a14cf9fc4b45490337).

### 2026-08-14 — Retorno nativo, PDFs certificados y manejo de respuestas del PAC

- **Estado:** pendiente de validación
- **Objetivo o problema:** Integrar el Sending Method con el ciclo de vida nativo de E-Documents, permitir que NetSuite genere el Historial de Auditoría correctamente, producir el PDF certificado según el tipo de transacción y distinguir un timbrado exitoso de errores posteriores en la recuperación del XML.
- **Evidencia:** Commits [`9e8defb`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/commit/9e8defb45bfa8d84bdc8ddd0f340d24c4ffd7be8), [`cd3501b`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/commit/cd3501b8af552502ea929a2a1554b7a32d95dbe8) y [`535a06e`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/commit/535a06eea5b60dd0285b376230c76f01f27f2be4).

### 2026-08-17 — Refactor defensivo de comunicación PAC y construcción de campos CFDI

- **Estado:** pendiente de validación
- **Objetivo o problema:** Mejorar la mantenibilidad y la tolerancia a fallos del Sending Method ante errores de red, respuestas no válidas del PAC y fallos parciales al construir los campos fiscales.
- **Cambios realizados:** Se reforzó el adaptador HTTP con parseo seguro, captura centralizada de errores y contexto de diagnóstico para el timbrado y la descarga del XML. El constructor CFDI centralizó los IDs de campos, sustituyó la extracción por expresión regular del certificado del emisor por análisis con `N/xml`, aisló los errores de fecha/XML y conserva los campos construidos antes de un fallo parcial. En el orquestador se normalizó el alcance y retorno de `objReturn`.
- **Archivos o componentes:** SuiteScript 2.0 `pi_sads_fama_connector.js`; `lib/sads_fama_api.js`; `lib/sads_fama_cfdi.js`.
- **Evidencia:** Commit provisional [`b7dd46d`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/commit/b7dd46ded32170025937029be233d88f5baa1ee7), integrado en `main` mediante [`bb4d03c`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/commit/bb4d03cc170ca3f92e106b384365e8266d1fe81d).
- **Resultado:** El código incorpora mejor trazabilidad de excepciones HTTP y permite recuperar parcialmente campos fiscales cuando falla el procesamiento de fecha o XML. El cambio permanece sin validación funcional en NetSuite.
- **Problemas y riesgos:** El orquestador continúa enviando el payload mediante `N/https.post` directamente, por lo que la nueva protección de `apiModule.postTimbrado` todavía no participa en el flujo real. `getXml` puede devolver `null` o un cuerpo sin `Content`; el orquestador accede a `xmlData.Content` sin validar el objeto y, cuando solo falta `Content`, puede intentar guardar `XML_VACIO` como documento certificado.
- **Pendientes:** Conectar el orquestador con el adaptador `postTimbrado`; validar explícitamente `xmlData` y `Content`; definir el resultado del documento cuando el timbrado fue exitoso pero falla una etapa local; ejecutar pruebas controladas.

### 2026-08-24 — Arquitectura asíncrona para facturación global y descarga unificada de XML/PDF

- **Estado:** pendiente de validación
- **Objetivo o problema:** Incorporar una herramienta de facturación global con Facturama para seleccionar ventas de contado, generar un CFDI global de forma asíncrona y conservar los archivos certificados proporcionados por el PAC.
- **Cambios realizados:** Se añadió un Suitelet con Client Script para capturar parámetros fiscales y seleccionar Cash Sales. El envío crea un registro de control y ejecuta un Map/Reduce que consulta las transacciones, construye el payload CFDI 4.0 mediante un mapper dedicado, timbra con Facturama y actualiza cada Cash Sale con UUID, XML y PDF. El adaptador HTTP sustituyó `getXml` por `getFile` para descargar distintos tipos de archivo, mientras que el gestor de archivos reemplazó `saveXml` por `saveFile` y diferencia XML y PDF según la extensión. El flujo descarga ahora ambos comprobantes directamente del PAC y envía una notificación con los archivos adjuntos. También se incorporó el identificador de respuesta de Facturama en `custbody_sads_fama_cfdi_resp_id` para el flujo individual.
- **Archivos o componentes:** SuiteScript 2.x `fama_global_invoice_suitelet.js`, `fama_global_invoice_client.js`, `fama_global_invoice_library.js`; Map/Reduce `sads_fama_mr_global_orchestrator.js`; mapper `lib/sads_fama_global_mapper.js`; adaptadores `lib/sads_fama_api.js` y `lib/sads_fama_files.js`; orquestador individual `pi_sads_fama_connector.js`; fuentes de referencia bajo `Tests/Pruebas de E Docs NS CLI API/Scripts/com.drt.globalInvoice/`.
- **Evidencia:** Commits [`e9ce636`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/commit/e9ce6363a5fff13b5af58db8a252c36c047371bc), [`f97b837`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/commit/f97b837a0b17591ada678a9abb3f70c2abc83eba), [`5eabfd5`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/commit/5eabfd54c893b45d072c659993778922805ad235) y [`2e74e6a`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/commit/2e74e6a45eff976a608f1ef975e914c751226851). La comparación desde la última actualización documental contiene seis commits y 21 archivos afectados. Los mensajes de los commits indican explícitamente que las pruebas continúan pendientes.
- **Resultado:** La inspección confirma una arquitectura Suitelet–Map/Reduce implementada y la integración de las interfaces genéricas `getFile` y `saveFile` para XML/PDF. No existe evidencia de ejecución end-to-end, despliegue SDF ni timbrado global exitoso en NetSuite, por lo que el avance no se considera completado.
- **Decisiones técnicas:** Se separó la interfaz de captura del procesamiento fiscal mediante un registro de control y un Map/Reduce. La construcción del payload se aisló en un mapper y se decidió utilizar el PDF certificado entregado por Facturama, evitando generarlo localmente para la factura global.
- **Problemas y riesgos:** Los errores individuales de `reduce` se capturan sin relanzarse; por ello `summarize` puede reportar éxito aunque alguna Cash Sale no haya sido actualizada. Si falla `map`, el registro de control puede quedar sin estado final porque `summarize` obtiene su ID únicamente desde las salidas exitosas. No se localizaron objetos SDF para los nuevos scripts, despliegues o parámetros, por lo que falta confirmar cómo se instalarán y configurarán. El adaptador HTTP registra respuestas completas del PAC, potencialmente incluyendo contenido Base64 o datos fiscales, y requiere revisar volumen, redacción y permisos de los logs.
- **Pendientes:** Desplegar y configurar el Suitelet, Client Script y Map/Reduce en sandbox; validar los IDs de scripts, despliegues, parámetros, custom record, campos y carpeta de destino; corregir la propagación y contabilización de errores parciales; ejecutar pruebas con una y múltiples Cash Sales; comprobar payload, timbrado, UUID, XML, PDF, correo y actualización del registro de control; medir gobernanza; revisar protección de credenciales y datos fiscales en logs.
- **Referencias:** Comparación de `main` entre [`9557633...2e74e6a`](https://github.com/saulkgames/NS_PAC_Integration_Facturama/compare/9557633b59e3159d8d97d019450327e72e31be37...2e74e6a45eff976a608f1ef975e914c751226851).
