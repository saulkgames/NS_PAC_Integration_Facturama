# Informe de pre-despliegue (auditoría local)

Generado: 2026-10-03T18:20:07.206Z | Script v1.0.0 | Proyecto: pac_facturama_integration

## Veredicto

NO LISTO (bloqueantes: 2, altas: 7, medias: 10, informativas: 9)

Git: rama main, HEAD 7ad2f99, tags en HEAD: ninguno, cambios en src/: 7

## 1. Gates del checklist verificables localmente

| ID | Tarea | Estado | Evidencia |
|---|---|---|---|
| P-01 | Versión congelada en git (sin cambios en src/ y con tag en HEAD) | FALLA | 7 archivos con cambios; tags en HEAD: ninguno |
| P-02 | authId de despliegue distinto de sandbox | REVISAR | defaultAuthId = Almetal_SB |
| P-03 | Objetos SDF sin instancias con credenciales ni identificadores de sandbox | FALLA | 2 instancias con campos de credenciales; 3 referencias a sandbox |
| P-04 | File Cabinet sin archivos que no sean código | FALLA | 1 archivos |
| P-06 (parcial) | IDs hardcodeados identificados para verificar en producción | REVISAR | CONST_SUBSIDIARY = 9; TARGET_FOLDER_ID = 412704; PPD_LIST_VALUE = 4; BUNDLE_ID = 436209 |
| P-07 (parcial) | Manifest sin objetos de sandbox | FALLA | 1 de sandbox; 1 con id de cuenta/bundle |
| ESTR-01 | Todo scriptfile de SDF existe y no hay dependencias locales rotas ni ciclos | PASA | 3 niveles de dependencia; 0 ciclos |
| ESTR-02 | Identificadores propios (_sads_) definidos y campos dentro de alcance | PASA | 0 sin definir; 0 fuera de alcance |
| ESTR-03 | Mapper de dominio sin módulos N/* | PASA | /SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js |
| D-07 (parcial) | Scripts sin objeto SDF identificados (creación manual) | REVISAR | /SuiteScripts/Facturama_Integration/pi_sads_fama_connector.js |

## 2. Hallazgos

| Severidad | Área | Código | Descripción | Evidencia | Checklist |
|---|---|---|---|---|---|
| BLOQUEANTE | SDF | INSTANCIA_CON_CREDENCIALES | customrecord_sads_fama_config: la instancia val_8391540_5490848_sb1_162 lleva campos de credenciales dentro del objeto SDF (valores no impresos) | campos: custrecord_sads_fama_pass, custrecord_sads_fama_user | P-03 |
| BLOQUEANTE | SDF | INSTANCIA_CON_CREDENCIALES | customrecord_sads_fama_config: la instancia val_8908228_5490848_347 lleva campos de credenciales dentro del objeto SDF (valores no impresos) | campos: custrecord_sads_fama_pass, custrecord_sads_fama_user | P-03 |
| ALTA | Git | CAMBIOS_SIN_COMMIT | 7 archivos de src/ con cambios sin commit | M pac_facturama_integration/src/FileCabinet/SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js; ?? pac_facturama_integration/src/FileCabinet/SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js; ?? pac_facturama_integration/src/FileCabinet/SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js; ?? pac_facturama_integration/src/FileCabinet/SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js; ?? pac_facturama_integration/src/Objects/custbody_sads_fama_cartaporte_payload.xml; ?? pac_facturama_integration/src/Objects/customscript_sads_fama_factura_cp_ue.xml; ?? pac_facturama_integration/src/Objects/customscript_sads_fama_traslado_ue.xml | P-01 |
| ALTA | HARDCODE | ID_HARDCODEADO | CONST_SUBSIDIARY = 9: verificar su equivalente en producción | /SuiteScripts/Facturama_Integration/fama_global_invoice_library.js:11 | P-06 |
| ALTA | HARDCODE | ID_HARDCODEADO | TARGET_FOLDER_ID = 412704: verificar su equivalente en producción | /SuiteScripts/Facturama_Integration/lib/sads_fama_files.js:11 | P-06 |
| ALTA | SDF | INSTANCIA_ATADA_A_SANDBOX | customrecord_sads_fama_config: la instancia val_8391540_5490848_sb1_162 tiene identificador de sandbox |  | P-03 |
| ALTA | Manifest | MANIFEST_OBJETO_DE_SANDBOX | El manifest depende de un objeto con identificador de sandbox | custtmpl_167_5490848_sb1_764 | P-07 |
| ALTA | SDF | REFERENCIA_A_SANDBOX | customrecord_sads_fama_config (instancia val_8391540_5490848_sb1_162) referencia un objeto de sandbox | custtmpl_167_5490848_sb1_764 | P-03 |
| ALTA | SDF | SCRIPT_SIN_OBJETO_SDF | /SuiteScripts/Facturama_Integration/pi_sads_fama_connector.js (plugintypeimpl) no tiene objeto SDF: se crea y asocia a mano en la cuenta destino |  | D-07 |
| MEDIA | Despliegue | ARCHIVO_NO_CODIGO_EN_FILECABINET | deploy.xml incluye ~/FileCabinet/*: este archivo viajaría a producción | /SuiteScripts/Diccionario_pac_facturama_integration.txt | P-04 |
| MEDIA | Deployment | DEPLOYMENT_EN_TESTING | customscript_fama_global_invoice_sl/customdeploy_fama_global_invoice_sl está en TESTING (solo corre para el propietario) |  | D-10 |
| MEDIA | HARDCODE | ID_HARDCODEADO | BUNDLE_ID = 436209: verificar su equivalente en producción | /SuiteScripts/Facturama_Integration/pi_sads_fama_connector.js:22 | P-06 |
| MEDIA | HARDCODE | ID_HARDCODEADO | PPD_LIST_VALUE = 4: verificar su equivalente en producción | /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js:18 | P-06 |
| MEDIA | Deployment | LOGLEVEL_DEBUG | 7 deployments en nivel DEBUG | customdeploy_fama_backfill_tax_object_mr, customdeploy_fama_global_invoice_sl, customdeploy_sads_fama_factura_cp_ue, customdeploy_sads_fama_invoice_ue, customdeploy_sads_fama_mr_global_orch, customdeploy_sads_fama_payment_ue, customdeploy_sads_fama_traslado_ue | V-12 |
| MEDIA | Manifest | MANIFEST_OBJETO_CON_ID_DE_CUENTA | El manifest depende de un objeto con identificador numérico de cuenta/bundle | custtab_7_4346104_208 | P-07 |
| MEDIA | SDF | REFERENCIA_CON_ID_DE_CUENTA | custbody_sads_edocuments_package referencia un objeto con identificador de cuenta/bundle | custtab_7_4346104_208 | P-07 |
| MEDIA | SDF | REFERENCIA_CON_ID_DE_CUENTA | custbody_sads_fama_cfdi_resp_id referencia un objeto con identificador de cuenta/bundle | custtab_7_4346104_208 | P-07 |
| MEDIA | Deployment | SUITELET_SIN_AUDIENCIA | customscript_fama_global_invoice_sl/customdeploy_fama_global_invoice_sl no tiene audiencia definida |  | D-10 |
| MEDIA | HARDCODE | URL_LITERAL | URL literal en código | /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js:63 \| var qrUrl = 'https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=' + | P-06 |
| INFO | SDF | CLIENTSCRIPT_SIN_OBJETO | /SuiteScripts/Facturama_Integration/fama_global_invoice_client.js se enlaza por nombre de archivo desde otro script |  |  |
| INFO | Deployment | FECHA_INICIO_PASADA | customscript_sads_fama_mr_global_orch/customdeploy_sads_fama_mr_global_orch tiene fecha de inicio pasada | 2026-08-22 |  |
| INFO | HARDCODE | ID_HARDCODEADO | AUTHOR_ID = -5 (id de sistema) | /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js:27 | P-06 |
| INFO | HARDCODE | ID_HARDCODEADO | FOLDER_ID = -15 (id de sistema) | /SuiteScripts/Facturama_Integration/lib/sads_fama_logger.js:15 | P-06 |
| INFO | HARDCODE | LITERAL_SANDBOX | Literal que sugiere dependencia de sandbox | /SuiteScripts/Facturama_Integration/fama_payment_complement_ue.js:346 \| // ASUNCIÓN NO VALIDADA EN SANDBOX: se calcula como 1/exchangerate de la factura, | P-06 |
| INFO | Dependencias | MENCION_ABREVIADA_DE_ID_PROPIO | custrecord_sads_fama es prefijo de un id definido (probable mención en texto) | template:facturama_customerpayment_template.ftl |  |
| INFO | Plantillas | PLANTILLAS_CANDIDATAS_DUPLICADAS | Varias plantillas con CfdiType/NameId I/1: confirmar cuál se carga en producción | facturama_cashsale_template.ftl, facturama_edocs_template.ftl, facturama_invoice_template.ftl | D-08 |
| INFO | Deployment | RUNASROLE | customscript_fama_backfill_tax_object_mr/customdeploy_fama_backfill_tax_object_mr se ejecuta como ADMINISTRATOR |  |  |
| INFO | Deployment | RUNASROLE | customscript_sads_fama_mr_global_orch/customdeploy_sads_fama_mr_global_orch se ejecuta como ADMINISTRATOR |  |  |

## 3. Inventario de objetos SDF

| Tipo | scriptid | Archivo de script / alcance | Detalle |
|---|---|---|---|
| customrecordtype | customrecord_sads_fama_config |  | 2 instancias de datos |
| customrecordtype | customrecord_sads_fama_logger |  |  |
| mapreducescript | customscript_fama_backfill_tax_object_mr | /SuiteScripts/Facturama_Integration/fama_backfill_tax_object_mr.js | customdeploy_fama_backfill_tax_object_mr [-, NOTSCHEDULED] |
| mapreducescript | customscript_sads_fama_mr_global_orch | /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js | customdeploy_sads_fama_mr_global_orch [-, NOTSCHEDULED] |
| suitelet | customscript_fama_global_invoice_sl | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js | customdeploy_fama_global_invoice_sl [-, TESTING] |
| transactionbodycustomfield | custbody_sads_edocuments_package | bodysale | SELECT |
| transactionbodycustomfield | custbody_sads_fama_cartaporte_payload | bodyitemfulfillment, bodysale | CLOBTEXT |
| transactionbodycustomfield | custbody_sads_fama_cfdi_resp_id | bodycustomerpayment, bodyitemfulfillment, bodysale, bodytransferorder | TEXT |
| transactionbodycustomfield | custbody_sads_fama_cpago_payload | bodycustomerpayment | TEXTAREA |
| transactionbodycustomfield | custbody_sads_fama_req_id | bodysale | TEXT |
| transactionbodycustomfield | custbody_sads_fama_tax_object | bodysale | TEXT |
| usereventscript | customscript_sads_fama_factura_cp_ue | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js | customdeploy_sads_fama_factura_cp_ue [INVOICE, RELEASED] |
| usereventscript | customscript_sads_fama_invoice_ue | /SuiteScripts/Facturama_Integration/fama_invoice_tax_object_ue.js | customdeploy_sads_fama_invoice_ue [INVOICE, RELEASED] |
| usereventscript | customscript_sads_fama_payment_ue | /SuiteScripts/Facturama_Integration/fama_payment_complement_ue.js | customdeploy_sads_fama_payment_ue [CUSTOMERPAYMENT, RELEASED] |
| usereventscript | customscript_sads_fama_traslado_ue | /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js | customdeploy_sads_fama_traslado_ue [ITEMFULFILLMENT, RELEASED] |

## 4. Archivos y orden de despliegue (nivel 0 = hojas, se despliegan primero)

Nivel 0:

- /SuiteScripts/Facturama_Integration/fama_global_invoice_client.js (ClientScript)
- /SuiteScripts/Facturama_Integration/fama_global_invoice_library.js
- /SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js
- /SuiteScripts/Facturama_Integration/lib/sads_fama_config.js
- /SuiteScripts/Facturama_Integration/lib/sads_fama_global_mapper.js
- /SuiteScripts/Facturama_Integration/lib/sads_fama_logger.js
- /SuiteScripts/Facturama_Integration/lib/sads_fama_response_handler.js
- /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js

Nivel 1:

- /SuiteScripts/Facturama_Integration/fama_backfill_tax_object_mr.js (MapReduceScript) -> customscript_fama_backfill_tax_object_mr
- /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js (UserEventScript) -> customscript_sads_fama_factura_cp_ue
- /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js (Suitelet) -> customscript_fama_global_invoice_sl
- /SuiteScripts/Facturama_Integration/fama_invoice_tax_object_ue.js (UserEventScript) -> customscript_sads_fama_invoice_ue
- /SuiteScripts/Facturama_Integration/fama_payment_complement_ue.js (UserEventScript) -> customscript_sads_fama_payment_ue
- /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js (UserEventScript) -> customscript_sads_fama_traslado_ue
- /SuiteScripts/Facturama_Integration/lib/sads_fama_api.js
- /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js
- /SuiteScripts/Facturama_Integration/lib/sads_fama_files.js

Nivel 2:

- /SuiteScripts/Facturama_Integration/pi_sads_fama_connector.js (plugintypeimpl)
- /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js (MapReduceScript) -> customscript_sads_fama_mr_global_orch

## 5. Dependencias externas (no definidas en el proyecto)

### DRT (partner) (72)

| Identificador | Usado en |
|---|---|
| custbody_drt_cp_clave_unidadpeso | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js |
| custbody_drt_cp_complemento_cartaporte | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, template:facturama_invoice_template.ftl |
| custbody_drt_cp_destino | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custbody_drt_cp_fechahora_llegada | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js |
| custbody_drt_cp_fechahora_salida | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js |
| custbody_drt_cp_figura_transporte | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custbody_drt_cp_id_destino | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js |
| custbody_drt_cp_id_origen | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js |
| custbody_drt_cp_logistica_inversa_rede | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custbody_drt_cp_origen | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custbody_drt_cp_peso_bruto_vehicular | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js |
| custbody_drt_cp_registro_istmo | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custbody_drt_cp_tipo_transporte | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, template:facturama_invoice_template.ftl, template:facturama_traslado_template.ftl |
| custbody_drt_cp_totaldistrec | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js |
| custbody_drt_cp_transpinternac | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custbody_drt_cp_transporte | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custbody_drt_cp_ubicacion_polo_destino | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js |
| custbody_drt_cp_ubicacion_polo_origen | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js |
| custbody_mcp_idccp | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_carta_porte_mapper.js |
| custcol_drt_cp_materialpeligroso | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custcol_drt_cp_pesoenkg | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| customrecord_drt_cp_figura_transporte | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| customrecord_drt_cp_remolque | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| customrecord_drt_cp_transporte | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| customrecord_drt_cp_ubicacion | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| customrecord_drt_reg_facturacion_interco | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_anio | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_cfdi_usage | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js |
| custrecord_drt_cod_postal_emisor | /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_cp_anio | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_asegurarespcivil | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_configvehicular | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_ft_numlicencia | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_nombrefigura | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_numpermisosct | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_permsct | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_placa | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_placavm | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_polizarespcivil | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_rfcfigura | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_subtiporem | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_tipo_transporte | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_tipofigura | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_cp_transporte | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_customer | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js |
| custrecord_drt_documento_xml | /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_end_date | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js |
| custrecord_drt_facturas | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_meses | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_pc_ubi_calle | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_pc_ubi_codigopostal | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_pc_ubi_colonia | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_pc_ubi_estado | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_pc_ubi_localidad | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_pc_ubi_municipio | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_pc_ubi_nombre_rd | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_pc_ubi_numeroexterior | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_pc_ubi_numerointerior | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_pc_ubi_referencia | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_pc_ubi_residencia_fiscal | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_pc_ubi_rfc | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js |
| custrecord_drt_pdf_generado | /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_periodicidad | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_sat_payment_method | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_sat_payment_term | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_start_date | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js |
| custrecord_drt_status | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_subsidiary | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_uuid | /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_xml_generado | /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_xml_issue_date | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custrecord_drt_xml_issue_date_2 | /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |

### Mexico Compliance (34)

| Identificador | Usado en |
|---|---|
| custbody_mx_cfdi_cadena_original | /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js |
| custbody_mx_cfdi_certify_timestamp | /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custbody_mx_cfdi_folio | /SuiteScripts/Facturama_Integration/fama_payment_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js |
| custbody_mx_cfdi_issue_datetime | /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js |
| custbody_mx_cfdi_issuer_serial | /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js |
| custbody_mx_cfdi_qr_code | /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js |
| custbody_mx_cfdi_sat_serial | /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js |
| custbody_mx_cfdi_sat_signature | /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js |
| custbody_mx_cfdi_serie | /SuiteScripts/Facturama_Integration/fama_payment_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js, template:facturama_cashsale_template.ftl, template:facturama_creditmemo_template.ftl, template:facturama_edocs_template.ftl, template:facturama_invoice_template.ftl, template:facturama_traslado_template.ftl |
| custbody_mx_cfdi_signature | /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js |
| custbody_mx_cfdi_uuid | /SuiteScripts/Facturama_Integration/fama_global_invoice_library.js, /SuiteScripts/Facturama_Integration/fama_payment_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custbody_mx_customer_rfc | template:facturama_customerpayment_template.ftl |
| custbody_mx_txn_sat_payment_method | /SuiteScripts/Facturama_Integration/fama_global_invoice_library.js, template:facturama_customerpayment_template.ftl |
| custbody_mx_txn_sat_payment_term | /SuiteScripts/Facturama_Integration/fama_payment_complement_ue.js, /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js |
| custcol_mx_txn_line_sat_item_code | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, /SuiteScripts/Facturama_Integration/fama_traslado_complement_ue.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custcol_mx_txn_line_sat_tax_object | /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custentity_mx_rfc | template:facturama_cashsale_template.ftl, template:facturama_creditmemo_template.ftl, template:facturama_edocs_template.ftl, template:facturama_invoice_template.ftl |
| custentity_mx_sat_industry_type | template:facturama_customerpayment_template.ftl |
| custentity_mx_sat_registered_name | template:facturama_cashsale_template.ftl, template:facturama_creditmemo_template.ftl, template:facturama_customerpayment_template.ftl, template:facturama_edocs_template.ftl, template:facturama_invoice_template.ftl |
| customrecord_mx_mapper_values | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js |
| customrecord_mx_sat_cfdi_usage | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js |
| customrecord_mx_sat_payment_term | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js |
| customrecord_mx_sat_tax_object | /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js |
| customsearch_mx_mapping_search | /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js |
| custrecord_mx_mapper_keyvalue_category | /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js |
| custrecord_mx_mapper_keyvalue_rectype | /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js |
| custrecord_mx_mapper_keyvalue_subkey | /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js |
| custrecord_mx_mapper_keyvalue_subrectype | /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js |
| custrecord_mx_mapper_keyvalue_value | /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js |
| custrecord_mx_mapper_value_inreport | /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js |
| custrecord_mx_rcs_uuid | template:facturama_creditmemo_template.ftl, template:facturama_edocs_template.ftl, template:facturama_invoice_template.ftl |
| custrecord_mx_sat_industry_type | /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js, template:facturama_customerpayment_template.ftl |
| custrecord_mx_sat_registered_name | /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js, template:facturama_cashsale_template.ftl, template:facturama_creditmemo_template.ftl, template:facturama_customerpayment_template.ftl, template:facturama_edocs_template.ftl, template:facturama_invoice_template.ftl, template:facturama_traslado_template.ftl |
| custrecord_mx_sat_to_code | /SuiteScripts/Facturama_Integration/lib/sads_fama_sat_catalog.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |

### NetSuite PSG / E-Document (2)

| Identificador | Usado en |
|---|---|
| custbody_psg_ei_certified_edoc | /SuiteScripts/Facturama_Integration/lib/sads_fama_cfdi.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custbody_psg_ei_status | /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |

### Otros (cuenta) (6)

| Identificador | Usado en |
|---|---|
| custbody_alm_date_time | template:facturama_edocs_template.ftl, template:facturama_invoice_template.ftl |
| custbody_edoc_generated_pdf | /SuiteScripts/Facturama_Integration/pi_sads_fama_connector.js, /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js |
| custcol_desglose_detalle | /SuiteScripts/Facturama_Integration/fama_factura_cartaporte_complement_ue.js, template:facturama_invoice_template.ftl |
| customrecord_mcf_sat_months | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js |
| customrecord_mcf_sat_recurrence | /SuiteScripts/Facturama_Integration/fama_global_invoice_suitelet.js |
| custrecord_alm_subsidiaria_rfc | /SuiteScripts/Facturama_Integration/sads_fama_mr_global_orchestrator.js, template:facturama_customerpayment_template.ftl |

### Propio (sads) (1)

| Identificador | Usado en |
|---|---|
| custrecord_sads_fama | template:facturama_customerpayment_template.ftl |

## 6. Plantillas FreeMarker de Facturama

| Archivo | CfdiType | NameId | <#stop> | desglose_detalle | payload Carta Porte | IDs externos |
|---|---|---|---|---|---|---|
| facturama_cashsale_template.ftl | I | 1 | 0 | no | no | 4 |
| facturama_creditmemo_template.ftl | E | 2 | 7 | no | no | 5 |
| facturama_customerpayment_template.ftl | P | 14 | 10 | no | no | 9 |
| facturama_edocs_template.ftl | I | 1 | 4 | no | no | 6 |
| facturama_invoice_template.ftl | I | 1 | 6 | sí | sí | 10 |
| facturama_traslado_template.ftl | T | 36 | 2 | no | sí | 5 |

## 7. Manifest

Features requeridos: SERVERSIDESCRIPTING, ADVANCEDPRINTING, WORKFLOW, CUSTOMRECORDS, SUBSIDIARIES

Objetos de los que depende (22): custbody_psg_ei_trans_edoc_standard, customrecord_psg_ei_standards, customrole1021, customrole1022, customrole1023, customrole1024, customrole1026, customrole1028, customrole1029, customrole1030, customrole1035, customrole1071, customrole1081, customrolealm_cordinador, custtab_7_4346104_208, custtab_mx_cfdi_data, custtmpl_167_5490848_sb1_764, custtmpl_cashsale_certified_pdf_template, custtmpl_creditmemo_certified_pdf_template, custtmpl_invoice_certified_pdf_template, custtmpl_itemfulfillment_certified_pdf, custtmpl_payment_certified_pdf_template

## 8. No verificable localmente

| ID | Tarea |
|---|---|
| P-05 | Existencia en producción de bundles, registros y campos externos (ver dependencias externas) |
| P-06 | Equivalencia en producción de los IDs hardcodeados (ver hallazgos HARDCODE) |
| P-07 | project:validate --server contra la cuenta de producción |
| P-08 | Timbrado aceptado por el PAC en sandbox con el código a desplegar |
| P-09 | Respaldo del estado actual de producción |
| P-10 | Ventana de cambio y comunicación a usuarios |
| P-11 | Volumen para el backfill de Tax Object |
| D-03 | Instancia de configuración de producción (manual) |
| D-07 | Plugin implementation y Sending Method (manual) |
| D-08 | Carga de plantillas .ftl en Electronic Documents (manual) |
| V-01..V-12 | Pruebas de humo y monitoreo post-despliegue |
| R-01..R-07 | Plan de rollback |

## Supuestos y límites

- Análisis estático del repositorio: no consulta NetSuite ni la cuenta de producción.
- Los identificadores externos se extraen por patrón de nombre (custbody_, custcol_, customrecord_, etc.); una cadena en un comentario también cuenta.
- Las instancias de datos de objetos SDF se reportan por nombre de campo; sus valores no se leen ni se imprimen.
- La clasificación de familias externas (Mexico Compliance, DRT) es heurística por prefijo.
- Un estado PASA en este informe no sustituye las verificaciones contra la cuenta (sección 8).
