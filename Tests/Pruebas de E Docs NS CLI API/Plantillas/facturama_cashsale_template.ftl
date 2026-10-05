<#setting locale = "en_US">
<#function getAttrPair attr value>
<#if value?has_content>
<#assign result="${attr}=\"${value}\"">
<#return result>
</#if>
</#function>

<#-- 1. PREPARACIÓN DE VARIABLES (Idéntico a la lógica nativa) -->
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

<#assign "summary" = custom.summary>
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
"Date": "${transaction.trandate?string.iso}T00:00:00",

"PaymentForm": "${satCodes.paymentMethod}",
"PaymentMethod": "PUE",
<#if transaction.terms?has_content>
"PaymentConditions": "${transaction.terms?json_string}",
</#if>

"Currency": "${currencyCode}",
"CurrencyExchangeRate": ${exchangeRate},

"ExpeditionPlace": "${customCompanyInfo.zip}",
"Exportation": "${satCodes.exportType}",

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
<#-- El parche crítico: ?trim?number para evitar errores de espacios en blanco -->
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
<#-- Parche: Calculo de TOTAL -->
<#assign subTotal = customItem.amount?number>
<#assign Descuento = customItem.discount?number?abs>
<#assign Impuestos_Trasladados = 0>
<#assign Impuestos_Retenidos = 0>
<#assign Total_Item = 0>
<#assign has_Taxes = false >
<#assign has_whTaxes = false>
<#-- Ciclo condicional para acceder a las variables y sumarlas -->
<#if itemSatCodes.taxObject == "02">
<#-- Ciclo condicional para arreglo de impuestos Trasladados -->
<#if taxes.taxItems?has_content >
<#assign has_Taxes = true >
<#list taxes.taxItems as txItem>
<#assign Impuestos_Trasladados += txItem.taxAmount?number>
</#list>
</#if>
<#-- Ciclo condicional para arreglo de impuestos Retenidos -->
<#if taxes.whTaxItems?has_content >
<#assign has_whTaxes = true >
<#list taxes.whTaxItems as whTxItem>
<#assign Impuestos_Retenidos += whTxItem.taxAmount?number>
</#list>
</#if>
</#if>
{
"ProductCode": "${itemSatCodes.itemCode}",
"IdentificationNumber": "${item.displayname?json_string}",
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
}<#if customItem_has_next>,</#if>
</#list>
]
}