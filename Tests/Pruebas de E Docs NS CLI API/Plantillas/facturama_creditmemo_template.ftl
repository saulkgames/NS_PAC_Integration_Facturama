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
<#else>
<#assign "currencyCode" = "MXN">
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

<#-- 2. VALIDACIONES Fail-Fast (ver CLAUDE.md) -->
<#if !satMetodoPago?has_content>
<#stop "ERROR FATAL: El Método de Pago (satCodes.paymentTerm) está vacío. Capture el dato en NetSuite antes de timbrar.">
</#if>
<#if !satFormaPago?has_content>
<#stop "ERROR FATAL: La Forma de Pago (satCodes.paymentMethod) está vacía. Capture el dato en NetSuite antes de timbrar.">
</#if>
<#if satMetodoPago == "PPD" && satFormaPago != "99">
<#stop "ERROR DE INTEGRIDAD: Si el Método de Pago es PPD, la Forma de Pago debe ser '99' en el registro. Corrija NetSuite para evitar discrepancias contables con el SAT.">
</#if>

<#-- NOTA DE CRÉDITO (CfdiType E): en teoría siempre debe declarar al menos un CFDI relacionado —
pero esta plantilla YA NO detiene la generación por eso (ver docs/development-log.md, entrada del
error PAC "Unexpected character... <, position 0"): facturama_edocs_template.ftl (Factura) omite
el nodo cuando no hay datos, en vez de usar <#stop>, y es la única plantilla de esta familia
probada con éxito contra un CFDI real con Relations. Esta ahora replica exactamente ese patrón
opcional/blindado. La regla de negocio "una Nota de Crédito debe tener Relations" queda pendiente
de mover a un User Event (capa de dominio, ver CLAUDE.md) — un <#stop> aquí no es el lugar correcto
para validarla mientras no se confirme por qué el <#stop> anterior producía ese error. -->
<#assign cfdiRelType = "">
<#assign cfdisArray = "">
<#if custom.relatedCfdis?has_content && custom.relatedCfdis.types?has_content>
<#if custom.relatedCfdis.types?size gt 1>
<#stop "ERROR FATAL: El proveedor PAC (Facturama) no soporta múltiples Tipos de Relación en un mismo comprobante. La transacción tiene ${custom.relatedCfdis.types?size} tipos distintos. Unifique el Tipo de Relación en NetSuite.">
</#if>
<#assign cfdiRelType = custom.relatedCfdis.types[0]>
<#assign cfdisArray = custom.relatedCfdis.cfdis["k0"]!"">
<#-- Regla SAT: si la Nota de Crédito "paga" un anticipo (Tipo de Relación 07), el Método de Pago
del propio comprobante debe forzarse a PUE, sin importar el método habitual del cliente. Regla de
catálogo SAT fija (no es una decisión de negocio de la empresa) — ver mysuite_credit_memo_template.ftl,
que ya aplica esta misma regla en producción. -->
<#if cfdiRelType == "07">
<#assign satMetodoPago = "PUE">
</#if>
</#if>

<#-- 3. CONSTRUCCIÓN DEL JSON -->
{
"NameId": 2,
"CfdiType": "E",
<#if transaction.transactionnumber?has_content>
"Folio": "${transaction.transactionnumber?json_string}",
<#elseif transaction.tranid?has_content>
"Folio": "${transaction.tranid?json_string}",
</#if>
<#if transaction.custbody_mx_cfdi_serie?has_content>
"Serie": "${transaction.custbody_mx_cfdi_serie?json_string}",
</#if>
"Date": "${transaction.trandate?string.iso}T00:00:00",
"PaymentForm": "${satFormaPago}",
"PaymentMethod": "${satMetodoPago}",
<#if transaction.terms?has_content>
"PaymentConditions": "${transaction.terms?json_string}",
</#if>
"Currency": "${currencyCode}",
"ExpeditionPlace": "${customCompanyInfo.zip}",
"Exportation": "${satCodes.exportType}",
<#if custom.relatedCfdis?has_content && custom.relatedCfdis.types?has_content && cfdisArray?has_content>
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
},
"Items": [
<#list custom.items as customItem>
<#assign "item" = transaction.item[customItem.line?number]>
<#assign "taxes" = customItem.taxes>
<#assign "itemSatCodes" = satCodes.items[customItem.line?number]>
<#if customItem.type == "Group" || customItem.type == "Kit">
<#assign "itemSatUnitCode" = "H87">
<#assign "itemUnits" = "Pieza">
<#else>
<#assign "itemSatUnitCode" = (customItem.satUnitCode)!"">
<#assign "itemUnits" = item.units>
</#if>
<#assign subTotal = customItem.amount?number>
<#assign Descuento = (customItem.totalDiscount!"0")?number?abs>
<#assign Impuestos_Trasladados = 0>
<#assign Impuestos_Retenidos = 0>
<#assign has_Taxes = false>
<#assign has_whTaxes = false>
<#if itemSatCodes.taxObject == "02">
<#if taxes.taxItems?has_content>
<#assign has_Taxes = true>
<#list taxes.taxItems as txItem>
<#assign Impuestos_Trasladados += txItem.taxAmount?number>
</#list>
</#if>
<#if taxes.whTaxItems?has_content>
<#assign has_whTaxes = true>
<#list taxes.whTaxItems as whTxItem>
<#assign Impuestos_Retenidos += whTxItem.taxAmount?number>
</#list>
</#if>
</#if>
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
"Subtotal": ${subTotal?c},
"Discount": ${Descuento?c},
<#assign Total_Item = subTotal - Descuento + Impuestos_Trasladados - Impuestos_Retenidos>
"Total": ${Total_Item?c},
"TaxObject": "${itemSatCodes.taxObject}",
"Taxes": [
<#assign isFirstTax = true>
<#if has_Taxes>
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
<#if has_whTaxes>
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
}<#if customItem_has_next>,</#if>
</#list>
]
}
