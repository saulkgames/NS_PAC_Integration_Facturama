# Análisis Comparativo: Plantillas MySuite de Complemento Carta Porte (Traslado vs. Factura)

Fuentes analizadas:
- `Prompt_CartaPorte_Traslado.md` — plantilla FreeMarker legacy (vendor MySuite, no Facturama) para Comprobante de Traslado (CfdiType T), ejecutada sobre Item Fulfillment.
- `Prompt_CartaPorte_Factura.md` — plantilla FreeMarker legacy (mismo vendor) para Factura con Complemento Carta Porte (CfdiType I), ejecutada sobre Invoice.

Ambas plantillas comparten el mismo motor NetSuite E-Document (objetos nativos `transaction`, `customer`, `companyinformation` y el objeto inyectado por el plugin `custom`, con `custom.items`/`custom.satcodes`/`custom.summary`), y el mismo esquema XML de salida (`fx:FactDocMX`, namespace MySuite `fx_2010_g.xsd`) — no es el esquema JSON de Facturama. Se usan aquí únicamente como referencia de mapeo de datos/reglas de negocio para diseñar los adaptadores de este proyecto, no como código a copiar.

## 1. Análisis de Diferencias Estructurales

**Nodos/atributos presentes solo en Traslado:**
- `fx:RegimenesAduaneros` / `fx:RegimenAduaneroCCP` (líneas 411-415 del archivo de Traslado) — no existe en ningún punto de la plantilla de Factura.
- `UbicacionPoloOrigen`/`UbicacionPoloDestino` dentro de `concatCartaPorte()` (condicionados a `custbody_drt_cp_registro_istmo`) — la función `concatCartaPorte()` de Factura es la misma función pero SIN esta rama; solo cubre `EntradaSalidaMerc`/`PaisOrigenDestino`/`ViaEntradaSalida`/`TotalDistRec`.
- `LogisticaInversaRecoleccionDevolucion` como atributo de `fx:Mercancias` (condicionado a `custbody_drt_cp_tipo_transporte == "Autotransporte Federal"`) — ausente por completo de la plantilla de Factura; esta última nunca construye ese atributo.
- `fx:DetalleMercancia` (Transporte Marítimo: PesoBruto/PesoNeto/PesoTara/NumPiezas) — presente en ambas plantillas de forma idéntica dentro del bloque de Mercancia, así que NO es una diferencia real (se incluye aquí solo para dejar constancia de que se verificó).
- Ningún filtro de línea en `Mercancia[]`: Traslado agrega **todas** las líneas de `custom.items` como Mercancia, sin ninguna condición sobre un campo de "desglose". Factura sí filtra (ver abajo) — es la diferencia estructural más importante de todo el análisis.

**Nodos/atributos presentes solo en Factura:**
- Filtro `item.custcol_desglose_detalle == "Desglose factura" || "Ambos"` alrededor de cada `fx:Concepto` — Traslado no tiene este campo en ningún punto del archivo (confirmado por búsqueda exhaustiva: cero coincidencias de `desglose_detalle` en todo el archivo de Traslado, ni en la plantilla ni en el volcado XML real).
- Filtro equivalente `item.custcol_desglose_detalle == "Desglose carta porte" || "Ambos"` alrededor de cada `fx:Mercancia` — mismo campo, mismo motivo.
- En `fx:Autotransporte.Seguros`, los atributos `AseguraMedAmbiente`, `PolizaMedAmbiente`, `AseguraCarga`, `PolizaCarga`, `PrimaSeguro` — la versión de Traslado solo emite `AseguraRespCivil`/`PolizaRespCivil` y cierra el elemento ahí, sin ninguna rama condicional adicional.
- Cálculo real de impuestos por concepto (`Impuestos_Trasladados`/`Impuestos_Retenidos`, `fx:ImpuestosSAT`/`fx:Traslados`/`fx:Retenciones` por línea) — Traslado fija `fx:ObjetoImp` en `"01"` (hardcode) y no calcula ningún impuesto, consistente con que el Traslado nunca es un ingreso facturado.

**Diferencias en la estructura del encabezado (Comprobante/Identificacion/Receptor):**
- `fx:TipoDeComprobante`: Traslado lo fija hardcodeado a `"TRASLADO"`; Factura lo calcula (`satProofType`, "FACTURA" o "NOTA_DE_CREDITO" según `satCodes.proofType`).
- `fx:Exportacion`: Traslado lo fija hardcodeado a `"01"`; Factura lo toma de `satCodes.exportType` (valor real por transacción).
- `fx:RFCReceptor`/`fx:NombreReceptor`/`fx:DomicilioFiscalReceptor`: en Traslado apuntan a los datos de la **propia empresa emisora** (`custom.companyInfo.rfc`, `customCompanyInfo.custrecord_mx_sat_registered_name`, `customCompanyInfo.zip`) — no hay un tercero real como receptor. En Factura apuntan al **cliente real** (`customer.custentity_mx_rfc`, `customer.custentity_mx_sat_registered_name`, con fallback condicional de CP según si el RFC es genérico). Esta es la diferencia semántica más significativa del bloque Receptor.
- `fx:TiempoDeEmision`: Traslado usa `transaction.trandate?string.iso`; Factura usa `transaction.trandate?string.iso_nz` (variante de formato distinta, mismo campo fuente).
- `fx:Totales`: Traslado fija `SubTotalBruto`/`SubTotal`/`Total` en `"0"` (sin cálculo); Factura los calcula desde `summary.subtotal`/`summary.totalDiscount`/`byTaxObject.totalAmount`.
- `fx:Moneda`: Traslado tiene una regla especial — si `custbody_drt_cp_moneda == "MXN"` fuerza `Moneda="XXX"` (sin `TipoDeCambioVenta`); en cualquier otro caso usa `currencyCode` real + `TipoDeCambioVenta`. Factura siempre usa `currencyCode`/`exchangeRate` reales, sin esa regla especial.

**Variaciones en la anidación / fuente de datos de elementos que SÍ existen en ambas:**
- `fx:Ubicaciones`, `fx:Autotransporte`/`TransporteAereo`/`TransporteMarítimo`/`TransporteFerroviario`, `fx:FiguraTransporte`: en ambas plantillas se leen exactamente igual, desde los mismos campos de cabecera pre-serializados como JSON (`custbody_drt_cp_json_ubicacion?eval`, `custbody_drt_cp_json_transporte?eval`, `custbody_drt_cp_json_figura_transporte?eval`) — no hay variación estructural aquí, solo en Factura se agregan los 5 atributos de seguros adicionales ya mencionados.
- `fx:Concepto.UnidadDeMedida` (Conceptos, no Mercancia): Traslado usa `item.unitsdisplay`; Factura usa `item.units` — mismo propósito (texto de unidad), campo nativo distinto. `fx:Mercancia.Unidad` usa `item.units` en ambas plantillas por igual — no varía ahí.
- `fx:Mercancia` en sí: el conjunto de atributos (BienesTransp, ClaveSTCC, Descripcion, Cantidad, ClaveUnidad, Unidad, Dimensiones, MaterialPeligroso+CveMaterialPeligroso, Embalaje, DescripEmbalaje, PesoEnKg, ValorMercancia, Moneda, FraccionArancelaria, UUIDComercioExt, SectorCOFEPRIS + sus 15 sub-atributos condicionales, DocumentacionAduanera, GuiasIdentificacion, CantidadTransporta, DetalleMercancia) es **idéntico campo por campo** entre ambas plantillas — la única diferencia real en esta sección es el filtro de inclusión de línea ya descrito arriba.

## 2. Matriz de Mapeo de Nodos

### Comprobante / Identificación / Receptor

| Nodo / Propiedad | CartaPorte Traslado (Item Fulfillment) | CartaPorte Factura (Invoice) |
|---|---|---|
| TipoDeComprobante | `"TRASLADO"` (hardcode) | `satProofType` → `satCodes.proofType == "I"` ? `"FACTURA"` : `"NOTA_DE_CREDITO"` |
| RFCEmisor | `custom.companyInfo.rfc` | `custom.companyInfo.rfc` |
| RazonSocialEmisor | `customCompanyInfo.custrecord_mx_sat_registered_name` | `customCompanyInfo.custrecord_mx_sat_registered_name` |
| Usuario | `custom.loggedUserName` | `custom.loggedUserName` |
| Serie | `transaction.custbody_mx_cfdi_serie` | `transaction.custbody_mx_cfdi_serie` |
| Folio | `transaction.custbody_mx_cfdi_folio` | `transaction.custbody_mx_cfdi_folio` |
| TiempoDeEmision | `transaction.trandate?string.iso` + `"T00:00:00"` | `transaction.trandate?string.iso_nz` + `"T00:00:00"` |
| Exportacion | `"01"` (hardcode) | `satCodes.exportType` |
| LugarExpedicion | `customCompanyInfo.zip` | `customCompanyInfo.zip` |
| RegimenFiscal (Emisor) | `satCodes.industryType` | `satCodes.industryType` |
| RFCReceptor | `custom.companyInfo.rfc` (RFC propio del emisor) | `customer.custentity_mx_rfc` (RFC real del cliente) |
| NombreReceptor | `customCompanyInfo.custrecord_mx_sat_registered_name` (nombre propio) | `customer.custentity_mx_sat_registered_name` |
| DomicilioFiscalReceptor | `customCompanyInfo.zip` (CP propio) | RFC genérico/vacío → `customCompanyInfo.zip`; si no, `custom.billaddr.customerdefaultzipcode` |
| RegimenFiscalReceptor | `satCodes.customerIndustryType` | `satCodes.customerIndustryType` |
| UsoCFDI | `satCodes.cfdiUsage` | `satCodes.cfdiUsage` |
| CfdiRelacionados.TipoRelacion | `custom.relatedCfdis.types` (loop) | `custom.relatedCfdis.types` (loop) |
| CfdiRelacionados.UUID | `transaction.recmachcustrecord_mx_rcs_orig_trans[idx].custrecord_mx_rcs_uuid` | `transaction.recmachcustrecord_mx_rcs_orig_trans[idx].custrecord_mx_rcs_uuid` |

### Conceptos (fx:Concepto, por línea)

| Nodo / Propiedad | CartaPorte Traslado | CartaPorte Factura |
|---|---|---|
| Filtro de inclusión de línea | Ninguno — todas las líneas de `custom.items` | `item.custcol_desglose_detalle == "Desglose factura" \|\| "Ambos"` |
| Cantidad | `item.quantity` | `item.quantity` |
| ClaveUnidad | `customItem.satUnitCode` (o `"H87"` si Group/Kit) | `customItem.satUnitCode` (o `"H87"` si Group/Kit) |
| UnidadDeMedida | `item.unitsdisplay` (o `"Pieza"` si Group/Kit) | `item.units` (o `"Pieza"` si Group/Kit) |
| ClaveProdServ | `satCodes.items[idx].itemCode` | `satCodes.items[idx].itemCode` |
| Codigo | `item.item` | `item.item` |
| Descripcion | `item.description` | `item.description` (con `?replace` de comillas) |
| ValorUnitario | `customItem.rate` | `customItem.rate` |
| Importe | `customItem.amount` | `customItem.amount` |
| ObjetoImp | `"01"` (hardcode) | `itemSatCodes.taxObject` (real) |
| ImpuestosSAT (Traslados/Retenciones) | [NO APLICA] — no se calculan impuestos | `taxes.taxItems` / `taxes.whTaxItems` (real, solo si `taxObject == "02"`) |
| Opciones.Parte (kits) | `transaction.item[part.line]` + `satCodes.items[part.line]` | [NO APLICA] — no se encontró bloque `Parte` en la plantilla de Factura |

### Totales

| Nodo / Propiedad | CartaPorte Traslado | CartaPorte Factura |
|---|---|---|
| Moneda | `custbody_drt_cp_moneda == "MXN"` ? `"XXX"` : `currencyCode` | `currencyCode` (siempre) |
| TipoDeCambioVenta | Solo si Moneda ≠ `"XXX"`: `exchangeRate` | `exchangeRate` (siempre) |
| SubTotalBruto / SubTotal | `"0"` (hardcode) | `summary.subtotal` |
| Descuento | [NO APLICA] — no se declara | `summary.totalDiscount` |
| Total | `"0"` (hardcode) | `byTaxObject.totalAmount` |

### CartaPorte31 (atributos de cabecera)

| Nodo / Propiedad | CartaPorte Traslado | CartaPorte Factura |
|---|---|---|
| IdCCP | `transaction.custbody_mcp_idccp` | `transaction.custbody_mcp_idccp` |
| TranspInternac | `transaction.custbody_drt_cp_transpinternac` | `transaction.custbody_drt_cp_transpinternac` |
| EntradaSalidaMerc | `transaction.custbody_drt_cp_entradasalidamerc` (si `transpinternac != "No"`) | `transaction.custbody_drt_cp_entradasalidamerc` (si `transpinternac != "No"`) |
| PaisOrigenDestino | `transaction.custbody_drt_cp_PaisOrigenDestino` (si ≠ `"MEX"`) | `transaction.custbody_drt_cp_PaisOrigenDestino` (si ≠ `"MEX"`) |
| ViaEntradaSalida | `transaction.custbody_drt_cp_ViaEntradaSalida` (si `transpinternac != "No"`) | `transaction.custbody_drt_cp_ViaEntradaSalida` (si `transpinternac != "No"`) |
| TotalDistRec | `transaction.custbody_drt_cp_TotalDistRec` (si tipo_transporte ≠ "Transporte Aéreo") | `transaction.custbody_drt_cp_TotalDistRec` (si tipo_transporte ≠ "Transporte Aéreo") |
| UbicacionPoloOrigen / UbicacionPoloDestino | `transaction.custbody_drt_cp_ubicacion_polo_origen` / `_destino` (si `registro_istmo != "No"`) | [NO APLICA] — `concatCartaPorte()` de Factura no incluye esta rama |
| RegimenesAduaneros / RegimenAduaneroCCP | `transaction.custbody_drt_cp_regimen_aduanero` (si `transpinternac != "No"` y `entradasalidamerc` tiene valor) | [NO APLICA] |

### Ubicaciones (por Ubicacion)

| Nodo / Propiedad | CartaPorte Traslado | CartaPorte Factura |
|---|---|---|
| Fuente del arreglo | `transaction.custbody_drt_cp_json_ubicacion?eval` | `transaction.custbody_drt_cp_json_ubicacion?eval` |
| TipoUbicacion | `ubicacion.tipoUbicacion` | `ubicacion.tipoUbicacion` |
| IDUbicacion | `ubicacion.idUbicacion` | `ubicacion.idUbicacion` |
| RFCRemitenteDestinatario | `ubicacion.rfcRemitenteDestinatario` | `ubicacion.rfcRemitenteDestinatario` |
| NombreRemitenteDestinatario | `ubicacion.nombreRemitenteDestinatario` | `ubicacion.nombreRemitenteDestinatario` |
| FechaHoraSalidaLlegada | Origen: `transaction.custbody_drt_cp_fechahora_salida`; Destino: `transaction.custbody_drt_cp_fechahora_llegada` | Origen: `transaction.custbody_drt_cp_fechahora_salida`; Destino: `transaction.custbody_drt_cp_fechahora_llegada` |
| DistanciaRecorrida | `transaction.custbody_drt_cp_totaldistrec` (solo si tipo ≠ Origen) | `transaction.custbody_drt_cp_totaldistrec` (solo si tipo ≠ Origen) |
| Domicilio.Calle/NumExt/NumInt/Colonia/Localidad/Referencia/Municipio | `ubicacion.domicilioCalle` / `domicilioNumExt` / ... (mismo esquema de nombres) | `ubicacion.domicilioCalle` / `domicilioNumExt` / ... (idéntico) |
| Domicilio.Estado / Pais / CodigoPostal | `ubicacion.domicilioEstado` / `domicilioPais` / `domicilioCodigoPostal` | `ubicacion.domicilioEstado` / `domicilioPais` / `domicilioCodigoPostal` |

### Mercancias (atributos de cabecera) y Mercancia (por línea)

| Nodo / Propiedad | CartaPorte Traslado | CartaPorte Factura |
|---|---|---|
| Filtro de inclusión de línea (Mercancia) | Ninguno — todas las líneas de `custom.items` | `item.custcol_desglose_detalle == "Desglose carta porte" \|\| "Ambos"` |
| PesoBrutoTotal | `transaction.custbody_drt_cp_pesobrutototal` | `transaction.custbody_drt_cp_pesobrutototal` |
| UnidadPeso | `transaction.custbody_drt_cp_clave_unidadpeso` | `transaction.custbody_drt_cp_clave_unidadpeso` |
| PesoNetoTotal | `transaction.custbody_drt_cp_pesonetototal` | `transaction.custbody_drt_cp_pesonetototal` |
| NumTotalMercancias | `transaction.custbody_drt_cp_numtotalmercancias` | `transaction.custbody_drt_cp_numtotalmercancias` |
| CargoPorTasacion | `transaction.custbody_drt_cp_cargoportasacion` (si tiene contenido) | `transaction.custbody_drt_cp_cargoportasacion` (si tiene contenido) |
| LogisticaInversaRecoleccionDevolucion | `transaction.custbody_drt_cp_logistica_inversa_rede` (solo si tipo_transporte == "Autotransporte Federal") | [NO APLICA] — no se construye en ningún punto de la plantilla |
| BienesTransp | `satCodes.items[idx].itemCode` | `satCodes.items[idx].itemCode` |
| ClaveSTCC | `item.custcol_drt_cp_ClaveSTCC` | `item.custcol_drt_cp_ClaveSTCC` |
| Descripcion | `item.item` (con `?replace` de comillas) | `item.description` (con `?replace` de comillas y `<br />`) |
| Cantidad | `item.quantity` | `item.quantity` |
| ClaveUnidad | `customItem.satUnitCode` (mismo cálculo que Conceptos) | `customItem.satUnitCode` (mismo cálculo que Conceptos) |
| Unidad | `item.units` | `item.units` |
| Dimensiones | `item.custcol_drt_cp_dimensiones` | `item.custcol_drt_cp_dimensiones` |
| MaterialPeligroso / CveMaterialPeligroso | `item.custcol_drt_cp_MaterialPeligroso` (bool) → `"Si"` + `item.custcol_drt_cp_CveMaterialPeligroso` | `item.custcol_drt_cp_MaterialPeligroso` + `item.custcol_alm_mat_peligro_sat` (doble validación) + `item.custcol_drt_cp_CveMaterialPeligroso` |
| Embalaje / DescripEmbalaje | `item.custcol_drt_cp_embalaje` / `item.custcol_drt_cp_descripembalaje` | `item.custcol_drt_cp_embalaje?keep_before(":")` / `item.custcol_drt_cp_descripembalaje` |
| PesoEnKg | `item.custcol_drt_cp_pesoenkg` | `item.custcol_drt_cp_pesoenkg` |
| ValorMercancia / Moneda | `item.custcol_drt_cp_valormercancia` / `item.custbody_drt_cp_moneda` | `item.custcol_drt_cp_valormercancia` / `transaction.custbody_drt_cp_moneda` |
| FraccionArancelaria / UUIDComercioExt | `item.custcol_drt_cp_fraccionarancelaria` / `item.custcol_drt_cp_uuidcomercioext` | `item.custcol_drt_cp_fraccionarancelaria` / `item.custcol_drt_cp_uuidcomercioext` |
| SectorCOFEPRIS (+ 15 sub-atributos condicionales) | `item.custcol_drt_cp_sector_cofepris` + `concatSectorCofepris()` | `item.custcol_drt_cp_sector_cofepris` + `concatSectorCofepris()` (idéntico) |
| DocumentacionAduanera (TipoDocumento/NumPedimento/IdentDocAduanero/RFCImpo) | `concatDocumentacionAduanera()`, condicionado a `transpinternac != "No"` | `concatDocumentacionAduanera()`, condicionado a `transpinternac != "No"` (idéntico) |
| GuiasIdentificacion | `item.custcol_drt_cp_numeroguiaidentificaci` / `descripguiaidentificac` / `pesoguiaidentificacion` | `item.custcol_drt_cp_numeroguiaidentificaci` / `descripguiaidentificac` / `pesoguiaidentificacion` (idéntico) |
| CantidadTransporta | `item.quantity`, `custbody_drt_cp_id_origen`, `custbody_drt_cp_id_destino`, `item.custcol_drt_cp_cvestransporte` | `item.quantity`, `custbody_drt_cp_id_origen`, `custbody_drt_cp_id_destino`, `item.custcol_drt_cp_cvestransporte` |
| DetalleMercancia (solo Transporte Marítimo) | `item.custcol_drt_cp_pesobruto` / `pesoneto` / `custcol_drt_pc_pesotara` / `custcol_drt_cp_numpiezas` | `item.custcol_drt_cp_pesobruto` / `pesoneto` / `custcol_drt_pc_pesotara` / `custcol_drt_cp_numpiezas` (idéntico) |

### Autotransporte / Remolques

| Nodo / Propiedad | CartaPorte Traslado | CartaPorte Factura |
|---|---|---|
| Fuente del objeto | `transaction.custbody_drt_cp_json_transporte?eval` (según `custbody_drt_cp_tipo_transporte`) | `transaction.custbody_drt_cp_json_transporte?eval` (según `custbody_drt_cp_tipo_transporte`) |
| PermSCT / NumPermisoSCT | `transporte.permSCT` / `transporte.numPermisoSCT` | `transporte.permSCT` / `transporte.numPermisoSCT` |
| ConfigVehicular / PlacaVM / AnioModeloVM | `transporte.configVehicular` / `placaVM` / `anioModeloVM` | `transporte.configVehicular` / `placaVM` / `anioModeloVM` |
| PesoBrutoVehicular | `transaction.custbody_drt_cp_peso_bruto_vehicular` (solo Autotransporte Federal) | `transaction.custbody_drt_cp_peso_bruto_vehicular` (solo Autotransporte Federal) |
| AseguraRespCivil / PolizaRespCivil | `transporte.aseguraRespCivil` / `polizaRespCivil` | `transporte.aseguraRespCivil` / `polizaRespCivil` |
| AseguraMedAmbiente / PolizaMedAmbiente | [NO APLICA] — el elemento `Seguros` se cierra sin estos atributos | `transporte.aseguraMedAmbiente` / `polizaMedAmbiente` (solo si hay Material Peligroso) |
| AseguraCarga / PolizaCarga | [NO APLICA] | `transporte.aseguraCarga` / `polizaCarga` |
| PrimaSeguro | [NO APLICA] | `transporte.primaSeguro` |
| Remolques.SubTipoRem / Placa | `remolque.subTipoRem` / `remolque.placaRem` | `remolque.subTipoRem?keep_before(":")` / `remolque.placaRem` |
| TransporteAereo (todos los atributos) | Igual en ambas — mismo bloque completo (`transporte.matriculaAeronave`, `nombreAseg`, `numPolizaSeguro`, `numeroGuia`, `lugarContrato`, `codigoTransportista`, `rfcEmbarcador`, `numRegIdTribEmbarc`, `residenciaFiscalEmbarc`, `nombreEmbarcador`) | Igual en ambas |

### FiguraTransporte

| Nodo / Propiedad | CartaPorte Traslado | CartaPorte Factura |
|---|---|---|
| Fuente del arreglo | `transaction.custbody_drt_cp_json_figura_transporte?eval` | `transaction.custbody_drt_cp_json_figura_transporte?eval` |
| TipoFigura | `figTransp.tipoFigura` | `figTransp.tipoFigura` |
| RFCFigura / NumLicencia / NombreFigura | `figTransp.rfcfigura` / `numlicencia` / `nombrefigura` | `figTransp.rfcfigura` / `numlicencia` / `nombrefigura` |
| NumRegIdTribFigura / ResidenciaFiscalFigura | `figTransp.numregidtribfigura` / `residenciafiscalfigura` (solo si ≠ "MEX") | `figTransp.numregidtribfigura` / `residenciafiscalfigura` (solo si ≠ "MEX") |
| ParteTransporte | Comentado/deshabilitado en el XML (`<!-- ... -->`) | `figTransp.partetransporte` (activo, sin comentar) |
| Domicilio (Calle/NumExt/NumInt/Colonia/Localidad/Referencia/Municipio/Estado/Pais/CP) | `figTransp.calle` / ... (mismo esquema) | `figTransp.calle` / ... (idéntico) |

## Notas y limitaciones

- Ambas plantillas son del vendor MySuite (esquema `fx:`), no de Facturama (esquema JSON). Se usan como referencia de reglas de negocio y de dónde vive cada dato en NetSuite — el mapeo de campos NetSuite→dato es directamente reutilizable; la sintaxis de salida (XML de atributos vs. JSON) no lo es.
- El hallazgo más relevante para el diseño de los adaptadores de este proyecto es la ausencia total de `custcol_desglose_detalle` en el flujo de Traslado: confirma que ese campo es exclusivo del escenario Factura (donde sí hace falta separar líneas facturables de líneas de mercancía) y que Item Fulfillment nunca necesitó ese filtro porque, en un Traslado puro, toda línea es mercancía por definición.
- No se pudo confirmar en ninguna de las dos plantillas dónde se emite el atributo `RegistroISTMO` en sí (ninguna de las dos lo escribe como atributo propio de `CartaPorte31`, solo sus dos campos dependientes `UbicacionPoloOrigen`/`UbicacionPoloDestino`, y solo en Traslado) — se reporta como observación, no se asume que sea un error, ya que no se confirmó si esta cuenta usa el régimen ISTMO en la práctica.
