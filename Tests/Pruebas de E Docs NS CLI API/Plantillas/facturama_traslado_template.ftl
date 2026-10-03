<#setting locale = "en_US">

<#-- ADAPTADOR PURO (ver CLAUDE.md): el objeto Complemento.CartaPorte31 completo (Ubicaciones,
Mercancias, Autotransporte, FiguraTransporte) lo arma fama_traslado_complement_ue.js al guardar la
Ejecución de Orden de Venta y lo persiste en custbody_sads_fama_cartaporte_payload — esta plantilla
solo lo transporta, igual que facturama_customerpayment_template.ftl con
custbody_sads_fama_cpago_payload. Modo diagnóstico (decisión del usuario, 2026-09-26): ese payload
puede traer valores "{campo}_vacia" donde falte un dato — revisar antes de timbrar.

Único caso que sigue deteniendo la generación aquí (no es un dato faltante, es una modalidad que
el User Event no sabe construir todavía): Transporte Aéreo/Marítimo/Ferroviario. -->

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

<#if transaction.custbody_drt_cp_tipo_transporte?has_content && transaction.custbody_drt_cp_tipo_transporte != "Autotransporte Federal">
<#stop "ERROR FATAL: Esta plantilla solo soporta Autotransporte Federal. Tipo de transporte recibido: '${transaction.custbody_drt_cp_tipo_transporte}' no está implementado todavía.">
</#if>
<#if !transaction.custbody_sads_fama_cartaporte_payload?has_content>
<#stop "ERROR FATAL: custbody_sads_fama_cartaporte_payload está vacío. O el Complemento Carta Porte no está marcado en esta transacción, o fama_traslado_complement_ue.js todavía no corrió sobre este registro — guárdalo de nuevo.">
</#if>

<#function strOrVacio valor nombreCampo>
<#if valor?has_content>
<#return valor>
<#else>
<#return nombreCampo + "_vacia">
</#if>
</#function>

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
"Currency": "MXN",
"CurrencyExchangeRate": 1,
"ExpeditionPlace": "${strOrVacio(customCompanyInfo.zip!"", "customcompanyinfo_zip")?json_string}",
"Exportation": "01",
"Issuer": {
"FiscalRegime": "${strOrVacio(satCodes.industryType!"", "satcodes_industrytype")?json_string}",
"Rfc": "${strOrVacio(companyTaxRegNumber!"", "custom_companyinfo_rfc")?json_string}",
"Name": "${strOrVacio(customCompanyInfo.custrecord_mx_sat_registered_name!"", "custrecord_mx_sat_registered_name")?json_string}"
},
"Receiver": {
"Rfc": "${strOrVacio(companyTaxRegNumber!"", "custom_companyinfo_rfc")?json_string}",
"Name": "${strOrVacio(customCompanyInfo.custrecord_mx_sat_registered_name!"", "custrecord_mx_sat_registered_name")?json_string}",
"CfdiUse": "S01",
"FiscalRegime": "${strOrVacio(satCodes.industryType!"", "satcodes_industrytype")?json_string}",
"TaxZipCode": "${strOrVacio(customCompanyInfo.zip!"", "customcompanyinfo_zip")?json_string}"
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
"Complemento": ${transaction.custbody_sads_fama_cartaporte_payload}
}
