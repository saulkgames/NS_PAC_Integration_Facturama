<#setting locale = "en_US">
<#function getAttrPair attr value>
<#if value?has_content>
<#assign result="${attr}=\"${value}\"">
<#return result>
</#if>
</#function>

<#-- 1. PREPARACIÓN DE VARIABLES Y CONTEXTO -->
<#if custom.multiCurrencyFeature == "true">
<#assign "currencyCode" = transaction.currencysymbol>
<#if transaction.exchangerate == 1>
<#assign exchangeRate = 1>
<#else>
<#assign exchangeRate = transaction.exchangerate?string["0.000000"]>
</#if>
<#else>
<#assign "currencyCode" = "MXN">
<#assign exchangeRate = 1>
</#if>

<#if custom.oneWorldFeature == "true">
<#assign customCompanyInfo = transaction.subsidiary>
<#else>
<#assign customCompanyInfo = companyinformation>
</#if>

<#assign "satCodes" = custom.satcodes>
<#assign "companyTaxRegNumber" = custom.companyInfo.rfc>

<#if customer.custentity_mx_rfc == "XAXX010101000" || customer.custentity_mx_rfc == "XEXX010101000" || customer.custentity_mx_rfc == "">
<#assign domicilioFiscalReceptor = customCompanyInfo.zip>
<#else>
<#assign domicilioFiscalReceptor = custom.billaddr.customerdefaultzipcode>
</#if>

<#function getTaxName satCode>
<#if satCode == "001"><#return "ISR"></#if>
<#if satCode == "002"><#return "IVA"></#if>
<#if satCode == "003"><#return "IEPS"></#if>
<#return "IVA">
</#function>

<#assign satMetodoPago = satCodes.paymentTerm!"">
<#assign satFormaPago = satCodes.paymentMethod!"">

<#if !satMetodoPago?has_content>
<#stop "ERROR FATAL: El Método de Pago está vacío. Capture el dato en NetSuite antes de timbrar.">
</#if>

<#if !satFormaPago?has_content>
<#stop "ERROR FATAL: La Forma de Pago está vacía. Capture el dato en NetSuite antes de timbrar.">
</#if>

<#if satMetodoPago == "PPD" && satFormaPago != "99">
<#stop "ERROR DE INTEGRIDAD: Si el Método de Pago es PPD, la Forma de Pago debe ser '99' en el registro. Corrija NetSuite para evitar discrepancias contables con el SAT.">
</#if>

<#-- COMPLEMENTO CARTA PORTE (adaptador puro, ver CLAUDE.md y
Diseno_Orquestacion_Factura_CartaPorte.md): el objeto Complemento.CartaPorte31 lo arma
fama_factura_cartaporte_complement_ue.js al guardar la Factura, a partir de las líneas con
custcol_desglose_detalle = "2", y lo persiste en custbody_sads_fama_cartaporte_payload — esta
plantilla solo lo transporta. Las líneas custcol_desglose_detalle = "1" siguen su camino normal
más abajo, sin ningún cambio a su cálculo de impuestos. -->
<#if transaction.custbody_drt_cp_complemento_cartaporte?has_content>
<#if transaction.custbody_drt_cp_tipo_transporte?has_content && transaction.custbody_drt_cp_tipo_transporte != "Autotransporte Federal">
<#stop "ERROR FATAL: El Complemento Carta Porte de esta plantilla solo soporta Autotransporte Federal. Tipo de transporte recibido: '${transaction.custbody_drt_cp_tipo_transporte}' no está implementado todavía.">
</#if>
<#if !transaction.custbody_sads_fama_cartaporte_payload?has_content>
<#stop "ERROR FATAL: custbody_sads_fama_cartaporte_payload está vacío. fama_factura_cartaporte_complement_ue.js todavía no corrió sobre este registro — guárdalo de nuevo.">
</#if>
</#if>

<#-- 2. CONSTRUCCIÓN DEL JSON -->
{
"NameId": 1,
"CfdiType": "I",
<#if transaction.transactionnumber?has_content>
"Folio": "${transaction.transactionnumber?json_string}",
<#elseif transaction.tranid?has_content>
"Folio": "${transaction.tranid?json_string}",
</#if>
<#if transaction.custbody_mx_cfdi_serie?has_content>
"Serie": "${transaction.custbody_mx_cfdi_serie?json_string}",
</#if>
"Date": "${transaction.custbody_alm_date_time?datetime?string("yyyy-MM-dd HH:mm:ss")}",
"PaymentForm": "${satFormaPago}",
"PaymentMethod": "${satMetodoPago}",
<#if transaction.terms?has_content>
"PaymentConditions": "${transaction.terms?json_string}",
</#if>
"Currency": "${currencyCode}",
"CurrencyExchangeRate": ${exchangeRate},
"ExpeditionPlace": "${customCompanyInfo.zip}",
"Exportation": "${satCodes.exportType}",
<#-- NODO: CFDI Relacionados -->
<#if custom.relatedCfdis?has_content && custom.relatedCfdis.types?has_content>
<#if custom.relatedCfdis.types?size > 1>
<#stop "ERROR FATAL: El proveedor PAC (Facturama) no soporta múltiples Tipos de Relación en un mismo comprobante. La transacción tiene ${custom.relatedCfdis.types?size} tipos distintos. Unifique el Tipo de Relación en NetSuite.">
</#if>
<#assign cfdiRelType = custom.relatedCfdis.types[0]>
<#assign cfdisArray = custom.relatedCfdis.cfdis["k0"]>
<#if cfdisArray?has_content>
"Relations": {
"Type": "${cfdiRelType}",
"Cfdis": [
<#list cfdisArray as cfdiIdx>
{
"Uuid": "${transaction.recmachcustrecord_mx_rcs_orig_trans[cfdiIdx.index?number].custrecord_mx_rcs_uuid}"
}<#if cfdiIdx_has_next>,</#if>
</#list>
]
},
</#if>
</#if>
"Issuer": {
"FiscalRegime": "${satCodes.industryType}",
"Rfc": "${companyTaxRegNumber}",
"Name": "${customCompanyInfo.custrecord_mx_sat_registered_name?json_string}"
},
"Receiver": {
"Rfc": "${customer.custentity_mx_rfc}",
"Name": "${customer.custentity_mx_sat_registered_name?json_string}",
"TaxZipCode": "${domicilioFiscalReceptor}",
"FiscalRegime": "${satCodes.customerIndustryType}",
"CfdiUse": "${satCodes.cfdiUsage}"
},"Items": [
<#assign isFirstItem = true>
<#list custom.items as customItem>
<#assign "item" = transaction.item[customItem.line?trim?number]>
<#assign "taxes" = customItem.taxes>
<#assign "itemSatCodes" = satCodes.items[customItem.line?trim?number]>
<#if customItem.type == "Group" || customItem.type == "Kit">
<#assign "itemSatUnitCode" = "H87">
<#assign "itemUnits" = "Pieza">
<#else>
<#assign "itemSatUnitCode" = (customItem.satUnitCode)!"">
<#assign "itemUnits" = item.units>
</#if>
<#-- RN: solo las líneas "Desglose factura" son Conceptos facturables. Las líneas "Desglose
carta porte" las procesa fama_factura_cartaporte_complement_ue.js por separado — aquí ni
siquiera se calculan sus impuestos.
NOTA: transaction.item[].custcol_desglose_detalle expone el TEXTO de la lista aquí (confirmado
contra un render real: comparar contra el id crudo "1" no hizo match en ningún caso y dejó
Items[] vacío) — no el id interno. El User Event sí lee el id crudo vía getSublistValue, por
eso su comparación contra "2" es correcta y no necesita cambiar. -->
<#if item.custcol_desglose_detalle == "Desglose factura">
<#assign subTotal = customItem.amount?number>
<#assign Descuento = customItem.discount?number?abs>
<#assign Impuestos_Trasladados = 0>
<#assign Impuestos_Retenidos = 0>
<#assign Total_Item = 0>
<#assign has_Taxes = false >
<#assign has_whTaxes = false>
<#if itemSatCodes.taxObject == "02">
<#if taxes.taxItems?has_content >
<#assign has_Taxes = true >
<#list taxes.taxItems as txItem>
<#assign Impuestos_Trasladados += txItem.taxAmount?number>
</#list>
</#if>
<#if taxes.whTaxItems?has_content >
<#assign has_whTaxes = true >
<#list taxes.whTaxItems as whTxItem>
<#assign Impuestos_Retenidos += whTxItem.taxAmount?number>
</#list>
</#if>
</#if>
<#if !isFirstItem>,</#if>
<#assign isFirstItem = false>
{
"ProductCode": "${itemSatCodes.itemCode}",
"IdentificationNumber": "${item.custcol_pfp_codigoarticulo_?json_string}",
"Description": "${item.item?json_string}",
<#if itemUnits?has_content>
"Unit": "${itemUnits?json_string}",
</#if>
<#if itemSatUnitCode?has_content>
"UnitCode": "${itemSatUnitCode}",
</#if>
"UnitPrice": ${customItem.rate?number?c},
"Quantity": ${item.quantity?number?c},
"Subtotal": ${subTotal},
"Discount": ${Descuento},
<#assign Total_Item = subTotal - Descuento + Impuestos_Trasladados - Impuestos_Retenidos>
"Total": ${Total_Item},
"TaxObject": "${itemSatCodes.taxObject}",
"Taxes": [
<#assign isFirstTax = true>
<#if has_Taxes >
<#list taxes.taxItems as customTaxItem>
<#if customTaxItem.taxFactorType != "Exento">
<#if !isFirstTax>,</#if>
{
"Name": "${getTaxName(customTaxItem.satTaxCode)}",
"Base": ${customTaxItem.taxBaseAmount?number?c},
"Rate": ${customTaxItem.taxRate?number?c},
"Total": ${customTaxItem.taxAmount?number?c},
"IsRetention": false,
"IsQuota": <#if customTaxItem.taxFactorType == "Cuota">true<#else>false</#if>
}
<#assign isFirstTax = false>
</#if>
</#list>
</#if>
<#if has_whTaxes >
<#list taxes.whTaxItems as customTaxItem>
<#if !isFirstTax>,</#if>
{
"Name": "${getTaxName(customTaxItem.satTaxCode)}",
"Base": ${customTaxItem.taxBaseAmount?number?c},
"Rate": ${customTaxItem.taxRate?number?c},
"Total": ${customTaxItem.taxAmount?number?c},
"IsRetention": true,
"IsQuota": false
}
<#assign isFirstTax = false>
</#list>
</#if>
]
}
</#if>
</#list>
]
<#if transaction.custbody_drt_cp_complemento_cartaporte?has_content>
,"Complemento": ${transaction.custbody_sads_fama_cartaporte_payload}
</#if>
}