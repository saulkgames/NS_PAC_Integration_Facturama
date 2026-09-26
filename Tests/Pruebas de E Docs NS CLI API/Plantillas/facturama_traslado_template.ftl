<#setting locale = "en_US">

<#-- 1. PREPARACIÓN DE VARIABLES Y CONTEXTO -->
<#if custom.oneWorldFeature == "true">
<#assign customCompanyInfo = transaction.subsidiary>
<#else>
<#assign customCompanyInfo = companyinformation>
</#if>

<#assign "satCodes" = custom.satcodes>
<#assign "companyTaxRegNumber" = custom.companyInfo.rfc>

<#-- COMPROBANTE DE TRASLADO (CfdiType T): el Receptor es el propio emisor — no hay venta, solo
se acredita el movimiento legal de mercancía propia entre ubicaciones. Confirmado por evidencia
directa: la plantilla MySuite ya probada en esta cuenta usa custom.companyInfo.rfc /
customCompanyInfo.custrecord_mx_sat_registered_name para Receptor (nunca customer.*), y el XML
certificado real (transacción 1520482) trae RFCReceptor = RFCEmisor. -->

<#-- 2. VALIDACIONES Fail-Fast (ver CLAUDE.md) -->
<#if !transaction.custbody_drt_cp_complemento_cartaporte?has_content || transaction.custbody_drt_cp_complemento_cartaporte?string != "T">
<#stop "ERROR FATAL: Esta Ejecución de Orden de Venta no tiene marcado el Complemento Carta Porte (custbody_drt_cp_complemento_cartaporte). Esta plantilla es exclusiva para traslados con Carta Porte.">
</#if>
<#if !transaction.custbody_mcp_idccp?has_content>
<#stop "ERROR FATAL: Falta el IdCCP (custbody_mcp_idccp) — identificador único del Complemento Carta Porte.">
</#if>
<#if !companyTaxRegNumber?has_content>
<#stop "ERROR FATAL: No se pudo determinar el RFC del emisor (custom.companyInfo.rfc).">
</#if>
<#if !customCompanyInfo.custrecord_mx_sat_registered_name?has_content>
<#stop "ERROR FATAL: La subsidiaria emisora no tiene Nombre/Razón Social SAT capturado.">
</#if>
<#if !customCompanyInfo.zip?has_content>
<#stop "ERROR FATAL: La subsidiaria emisora no tiene Código Postal capturado (ExpeditionPlace).">
</#if>
<#if !satCodes.industryType?has_content>
<#stop "ERROR FATAL: satCodes.industryType (Régimen Fiscal del emisor) está vacío.">
</#if>
<#if !transaction.custbody_drt_cp_json_ubicacion?has_content>
<#stop "ERROR FATAL: Falta el detalle de Ubicaciones (custbody_drt_cp_json_ubicacion).">
</#if>
<#if !transaction.custbody_drt_cp_numtotalmercancias?has_content>
<#stop "ERROR FATAL: Falta custbody_drt_cp_numtotalmercancias.">
</#if>
<#-- PesoBrutoTotal y UnidadPeso son obligatorios en el esquema SAT de Carta Porte 3.1 — a
diferencia de PesoNetoTotal (opcional, si acaso presente se usa más abajo con ?has_content), estos
dos no deben rellenarse con un valor por defecto si faltan: encontrado en sandbox (transacción
2052117, 2026-09-25) que un ItemFulfillment real puede llegar aquí sin custbody_drt_cp_
pesobrutototal capturado, y sin esta guarda el ?number revienta con un error genérico de NetSuite
("UNEXPECTED_ERROR" sin mensaje) en vez de señalar el campo real que falta. -->
<#if !transaction.custbody_drt_cp_pesobrutototal?has_content>
<#stop "ERROR FATAL: Falta custbody_drt_cp_pesobrutototal (Peso Bruto Total) — campo obligatorio del Complemento Carta Porte.">
</#if>
<#if !transaction.custbody_drt_cp_clave_unidadpeso?has_content>
<#stop "ERROR FATAL: Falta custbody_drt_cp_clave_unidadpeso (Unidad de Peso) — campo obligatorio del Complemento Carta Porte.">
</#if>

<#-- Solo Autotransporte Federal está soportado por esta plantilla (única modalidad con datos
reales disponibles al construirla). Transporte Aéreo/Marítimo/Ferroviario quedan pendientes. -->
<#if transaction.custbody_drt_cp_tipo_transporte?has_content && transaction.custbody_drt_cp_tipo_transporte != "Autotransporte Federal">
<#stop "ERROR FATAL: Esta plantilla solo soporta Autotransporte Federal. Tipo de transporte recibido: '${transaction.custbody_drt_cp_tipo_transporte}' no está implementado todavía.">
</#if>
<#if !transaction.custbody_drt_cp_json_transporte?has_content>
<#stop "ERROR FATAL: Falta el detalle de Autotransporte (custbody_drt_cp_json_transporte).">
</#if>

<#assign objUbicaciones = transaction.custbody_drt_cp_json_ubicacion?eval>
<#assign objTransporte = transaction.custbody_drt_cp_json_transporte?eval>
<#assign objFiguraTransporte = []>
<#if transaction.custbody_drt_cp_json_figura_transporte?has_content>
<#assign objFiguraTransporte = transaction.custbody_drt_cp_json_figura_transporte?eval>
</#if>

<#-- 3. CONSTRUCCIÓN DEL JSON -->
{
"NameId": "36",
"CfdiType": "T",
<#if transaction.transactionnumber?has_content>
"Folio": "${transaction.transactionnumber?json_string}",
<#elseif transaction.tranid?has_content>
"Folio": "${transaction.tranid?json_string}",
</#if>
<#if transaction.custbody_mx_cfdi_serie?has_content>
"Serie": "${transaction.custbody_mx_cfdi_serie?json_string}",
</#if>
"Date": "${transaction.trandate?string.iso}T00:00:00",
"Currency": "XXX",
"ExpeditionPlace": "${customCompanyInfo.zip?json_string}",
"Exportation": "01",
"Issuer": {
"FiscalRegime": "${satCodes.industryType?json_string}",
"Rfc": "${companyTaxRegNumber?json_string}",
"Name": "${customCompanyInfo.custrecord_mx_sat_registered_name?json_string}"
},
"Receiver": {
"Rfc": "${companyTaxRegNumber?json_string}",
"Name": "${customCompanyInfo.custrecord_mx_sat_registered_name?json_string}",
"CfdiUse": "S01",
"FiscalRegime": "${satCodes.industryType?json_string}",
"TaxZipCode": "${customCompanyInfo.zip?json_string}"
},
"Items": [
{
"ProductCode": "78101800",
"Description": "Transporte de carga por carretera",
"IdentificationNumber": "${transaction.transactionnumber?json_string}",
"UnitCode": "E48",
"UnitPrice": 0,
"Quantity": 1,
"Subtotal": 0,
"TaxObject": "01",
"Total": 0
}
],
"Complemento": {
"CartaPorte31": {
"IdCCP": "${transaction.custbody_mcp_idccp?json_string}",
"TranspInternac": "${(transaction.custbody_drt_cp_transpinternac!"No")?json_string}",
<#if transaction.custbody_drt_cp_totaldistrec?has_content>
"TotalDistRec": "${transaction.custbody_drt_cp_totaldistrec?number?string["0.00"]}",
</#if>
<#if transaction.custbody_drt_cp_registro_istmo?has_content && transaction.custbody_drt_cp_registro_istmo != "No">
"RegistroISTMO": "${transaction.custbody_drt_cp_registro_istmo?json_string}",
<#if transaction.custbody_drt_cp_ubicacion_polo_origen?has_content>
"UbicacionPoloOrigen": "${transaction.custbody_drt_cp_ubicacion_polo_origen?json_string}",
</#if>
<#if transaction.custbody_drt_cp_ubicacion_polo_destino?has_content>
"UbicacionPoloDestino": "${transaction.custbody_drt_cp_ubicacion_polo_destino?json_string}",
</#if>
</#if>
"Ubicaciones": [
<#list objUbicaciones as ubicacion>
{
"TipoUbicacion": "${ubicacion.tipoUbicacion?json_string}",
<#if ((ubicacion.idUbicacion)!"")?has_content>
"IDUbicacion": "${ubicacion.idUbicacion?json_string}",
</#if>
<#if ((ubicacion.rfcRemitenteDestinatario)!"")?has_content>
"RFCRemitenteDestinatario": "${ubicacion.rfcRemitenteDestinatario?json_string}",
</#if>
<#if ((ubicacion.nombreRemitenteDestinatario)!"")?has_content>
"NombreRemitenteDestinatario": "${ubicacion.nombreRemitenteDestinatario?json_string}",
</#if>
<#if ubicacion.tipoUbicacion == "Origen">
"FechaHoraSalidaLlegada": "${transaction.custbody_drt_cp_fechahora_salida?string.iso_nz}",
<#else>
"FechaHoraSalidaLlegada": "${transaction.custbody_drt_cp_fechahora_llegada?string.iso_nz}",
<#if transaction.custbody_drt_cp_totaldistrec?has_content>
"DistanciaRecorrida": "${transaction.custbody_drt_cp_totaldistrec?number?string["0.00"]}",
</#if>
</#if>
"Domicilio": {
<#if ((ubicacion.domicilioCalle)!"")?has_content>
"Calle": "${ubicacion.domicilioCalle?json_string}",
</#if>
<#if ((ubicacion.domicilioNumExt)!"")?has_content>
"NumeroExterior": "${ubicacion.domicilioNumExt?json_string}",
</#if>
<#if ((ubicacion.domicilioNumInt)!"")?has_content>
"NumeroInterior": "${ubicacion.domicilioNumInt?json_string}",
</#if>
<#if ((ubicacion.domicilioColonia)!"")?has_content>
"Colonia": "${ubicacion.domicilioColonia?json_string}",
</#if>
<#if ((ubicacion.domicilioLocalidad)!"")?has_content>
"Localidad": "${ubicacion.domicilioLocalidad?json_string}",
</#if>
<#if ((ubicacion.domicilioReferencia)!"")?has_content>
"Referencia": "${ubicacion.domicilioReferencia?json_string}",
</#if>
<#if ((ubicacion.domicilioMunicipio)!"")?has_content>
"Municipio": "${ubicacion.domicilioMunicipio?json_string}",
</#if>
"Estado": "${ubicacion.domicilioEstado?json_string}",
"Pais": "${ubicacion.domicilioPais?json_string}",
"CodigoPostal": "${ubicacion.domicilioCodigoPostal?json_string}"
}
}<#if ubicacion?has_next>,</#if>
</#list>
],
"Mercancias": {
"PesoBrutoTotal": "${transaction.custbody_drt_cp_pesobrutototal?number?string["0.000"]}",
"UnidadPeso": "${transaction.custbody_drt_cp_clave_unidadpeso?json_string}",
<#if transaction.custbody_drt_cp_pesonetototal?has_content>
"PesoNetoTotal": "${transaction.custbody_drt_cp_pesonetototal?number?string["0.000"]}",
</#if>
"NumTotalMercancias": "${transaction.custbody_drt_cp_numtotalmercancias?number?c}",
<#if transaction.custbody_drt_cp_logistica_inversa_rede?has_content>
"LogisticaInversaRecoleccionDevolucion": "${transaction.custbody_drt_cp_logistica_inversa_rede?json_string}",
</#if>
"Mercancia": [
<#list custom.items as customItem>
<#assign "item" = transaction.item[customItem.line?number]>
<#assign "itemSatCodes" = satCodes.items[customItem.line?number]>
<#-- PesoEnKg y MaterialPeligroso se leen del sublist nativo (item.custcol_drt_cp_*), NO de
custom.items — así los usa facturama_traslado_template.ftl/mysuite, que es la única fuente
probada; custom.items no expone estas dos propiedades. -->
<#if !item.custcol_drt_cp_pesoenkg?has_content>
<#stop "ERROR FATAL: La línea de artículo '${item.item}' (line ${customItem.line}) no tiene Peso en Kg (custcol_drt_cp_pesoenkg) capturado — obligatorio para Mercancias.">
</#if>
{
"BienesTransp": "${itemSatCodes.itemCode?json_string}",
"Descripcion": "${item.item?json_string}",
"Cantidad": "${item.quantity?number?string["0.000000"]}",
"ClaveUnidad": "${customItem.satUnitCode?json_string}",
"MaterialPeligroso": <#if item.custcol_drt_cp_materialpeligroso>"Sí"<#else>"No"</#if>,
"PesoEnKg": "${item.custcol_drt_cp_pesoenkg?number?string["0.000"]}",
"CantidadTransporta": [
{
"Cantidad": "${item.quantity?number?string["0.000000"]}",
"IDOrigen": "${transaction.custbody_drt_cp_id_origen?json_string}",
"IDDestino": "${transaction.custbody_drt_cp_id_destino?json_string}"
}
]
}<#if customItem?has_next>,</#if>
</#list>
],
"Autotransporte": [
<#list objTransporte as transporte>
{
"PermSCT": "${transporte.permSCT?json_string}",
"NumPermisoSCT": "${transporte.numPermisoSCT?json_string}",
"IdentificacionVehicular": {
"ConfigVehicular": "${transporte.configVehicular?json_string}",
<#if transaction.custbody_drt_cp_peso_bruto_vehicular?has_content>
"PesoBrutoVehicular": "${transaction.custbody_drt_cp_peso_bruto_vehicular?number?string["0"]}",
</#if>
"PlacaVM": "${transporte.placaVM?json_string}",
"AnioModeloVM": "${transporte.anioModeloVM?c}"
},
"Seguros": {
"AseguraRespCivil": "${transporte.aseguraRespCivil?json_string}",
"PolizaRespCivil": "${transporte.polizaRespCivil?json_string}"
}<#if transporte.remolques?has_content>,
"Remolques": [
<#list transporte.remolques as remolque>
{
"SubTipoRem": "${remolque.subTipoRem?json_string}",
"Placa": "${remolque.placaRem?json_string}"
}<#if remolque?has_next>,</#if>
</#list>
]
</#if>
}<#if transporte?has_next>,</#if>
</#list>
]
}
<#if objFiguraTransporte?has_content>
,
"FiguraTransporte": [
<#list objFiguraTransporte as figTransp>
{
"TipoFigura": "${figTransp.tipoFigura?json_string}",
<#if ((figTransp.rfcfigura)!"")?has_content>
"RFCFigura": "${figTransp.rfcfigura?json_string}",
</#if>
<#if ((figTransp.numlicencia)!"")?has_content>
"NumLicencia": "${figTransp.numlicencia?json_string}",
</#if>
"NombreFigura": "${figTransp.nombrefigura?json_string}"
}<#if figTransp?has_next>,</#if>
</#list>
]
</#if>
}
}
}
