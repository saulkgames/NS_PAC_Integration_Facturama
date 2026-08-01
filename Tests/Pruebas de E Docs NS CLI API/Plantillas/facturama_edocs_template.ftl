<#setting locale = "en_US">
<#-- 
================================================================================
PLANTILLA DEFINITIVA: NETSUITE (CUSTOM DATA SOURCE MX) -> FACTURAMA API-LITE V3
Tipo: Ingreso (Factura/Cash Sale) - Método: PUE
Soporta: Traslados (IVA/IEPS) y Retenciones (IVA/ISR) por línea.
================================================================================
-->

<#-- 1. PREPARACIÓN DE VARIABLES BASE -->
<#if (custom.multiCurrencyFeature!"false") == "true">
  <#assign currencyCode = (transaction.currencysymbol)!"MXN">
  <#if (transaction.exchangerate!1)?number == 1>
    <#assign exchangeRate = 1>
  <#else>
    <#assign exchangeRate = (transaction.exchangerate!1)?number?string["0.0000"]>
  </#if>
<#else>
  <#assign currencyCode = "MXN">
  <#assign exchangeRate = 1>
</#if>

<#if (custom.oneWorldFeature!"false") == "true">
  <#assign customCompanyInfo = transaction.subsidiary>
<#else>
  <#assign customCompanyInfo = companyinformation>
</#if>

<#assign summary = custom.summary!{}>
<#assign satCodes = custom.satcodes!{}>
<#assign companyTaxRegNumber = (custom.companyInfo.rfc)!"">

<#-- Determinación segura del Código Postal del Receptor -->
<#assign rfcReceptor = (customer.custentity_mx_rfc)!"">
<#if rfcReceptor == "XAXX010101000" || rfcReceptor == "XEXX010101000" || rfcReceptor == "">
  <#assign domicilioFiscalReceptor = (customCompanyInfo.zip)!"">
<#else>
  <#assign domicilioFiscalReceptor = (custom.billaddr.customerdefaultzipcode)!(customer.billzip!"")>
</#if>

<#-- Función para mapear claves SAT a Nombres descriptivos requeridos por Facturama -->
<#function getTaxName satCode>
  <#if satCode == "001"><#return "ISR"></#if>
  <#if satCode == "002"><#return "IVA"></#if>
  <#if satCode == "003"><#return "IEPS"></#if>
  <#return "IVA">
</#function>

<#-- 2. CONSTRUCCIÓN DEL JSON -->
{
  "NameId": 1, <#--[cite: 13] -->
  "CfdiType": "I", <#-- Fijo a Ingreso[cite: 11] -->
  "Folio": "${(transaction.tranid!"")?json_string}", <#--[cite: 11] -->
  <#if (transaction.custbody_mx_cfdi_serie!"")?has_content>
  "Serie": "${transaction.custbody_mx_cfdi_serie?json_string}", <#--[cite: 11] -->
  </#if>
  "Date": "${(transaction.trandate?string.iso_nz)!"2023-01-01T00:00:00"}", <#--[cite: 11] -->
  
  "PaymentForm": "${(satCodes.paymentMethod)!"99"}", <#--[cite: 11] -->
  "PaymentMethod": "${(satCodes.paymentTerm)!"PUE"}", <#--[cite: 11] -->
  <#if (transaction.terms!"")?has_content>
  "PaymentConditions": "${transaction.terms?json_string}", <#--[cite: 11] -->
  </#if>
  
  "Currency": "${currencyCode?json_string}", <#--[cite: 11] -->
  "CurrencyExchangeRate": ${exchangeRate}, <#--[cite: 11] -->
  
  "ExpeditionPlace": "${(customCompanyInfo.zip!"")?json_string}", <#--[cite: 11] -->
  "Exportation": "${(satCodes.exportType)!"01"}", <#--[cite: 11] -->

  "Issuer": {
    "FiscalRegime": "${(satCodes.industryType)!"601"}", <#--[cite: 11] -->
    "Rfc": "${companyTaxRegNumber?json_string}", <#--[cite: 11] -->
    "Name": "${(customCompanyInfo.custrecord_mx_sat_registered_name)!(customCompanyInfo.legalname!"")?json_string}" <#--[cite: 11] -->
  },
  
  "Receiver": {
    "Rfc": "${rfcReceptor?json_string}", <#--[cite: 11] -->
    "Name": "${(customer.custentity_mx_sat_registered_name)!(customer.companyname!"")?json_string}", <#--[cite: 11] -->
    "TaxZipCode": "${domicilioFiscalReceptor?json_string}", <#--[cite: 11] -->
    "FiscalRegime": "${(satCodes.customerIndustryType)!"616"}", <#--[cite: 11] -->
    "CfdiUse": "${(satCodes.cfdiUsage)!"G03"}" <#--[cite: 11] -->
  },

  "Items": [
    <#if custom.items?? && custom.items?has_content>
    <#list custom.items as customItem>
    <#assign item = transaction.item[customItem.line?number]>
    <#assign taxes = customItem.taxes!{}>
    <#assign itemSatCodes = satCodes.items[customItem.line?number]!{}>
    
    <#-- Limpieza de la Unidad de Medida SAT vs Interna -->
    <#if (customItem.type!"") == "Group" || (customItem.type!"") == "Kit">
        <#assign itemSatUnitCode = "H87">
        <#assign itemUnits = "Pieza">
    <#else>
        <#assign itemSatUnitCode = (customItem.satUnitCode)!"H87">
        <#assign itemUnits = (item.units)!"PZA">
    </#if>
    
    {
      "ProductCode": "${(itemSatCodes.itemCode)!"01010101"}", <#--[cite: 11] -->
      "IdentificationNumber": "${(item.item!"")?json_string}", <#--[cite: 11] -->
      "Description": "${(item.description!"Articulo sin descripcion")?json_string}", <#--[cite: 11] -->
      "Unit": "${itemUnits?json_string}", <#--[cite: 11] -->
      "UnitCode": "${itemSatUnitCode?json_string}", <#--[cite: 11] -->
      "UnitPrice": ${(customItem.rate!0)?number?c}, <#--[cite: 11] -->
      "Quantity": ${(item.quantity!1)?number?c}, <#--[cite: 11] -->
      "Subtotal": ${(customItem.amount!0)?number?c}, <#--[cite: 11] -->
      "Discount": ${(customItem.totalDiscount!0)?number?abs?c}, <#--[cite: 11] -->
      "TaxObject": "${(itemSatCodes.taxObject)!"02"}" <#--[cite: 11] -->
      
      <#-- Mapeo Dinámico de Impuestos (Traslados y Retenciones)[cite: 11, 14] -->
      <#if (itemSatCodes.taxObject!"") == "02" && ((taxes.taxItems?? && taxes.taxItems?has_content) || (taxes.whTaxItems?? && taxes.whTaxItems?has_content))>
      ,"Taxes": [
        <#assign isFirstTax = true>
        
        <#-- 1. TRASLADOS (IVA, IEPS)[cite: 11] -->
        <#if taxes.taxItems?? && taxes.taxItems?has_content>
          <#list taxes.taxItems as customTaxItem>
            <#if (customTaxItem.taxFactorType!"") != "Exento">
              <#if !isFirstTax>,</#if>
              {
                "Name": "${getTaxName((customTaxItem.satTaxCode)!"002")}", <#--[cite: 13, 14] -->
                "Base": ${(customTaxItem.taxBaseAmount!0)?number?c}, <#--[cite: 11] -->
                "Rate": ${(customTaxItem.taxRate!0)?number?c}, <#--[cite: 11] -->
                "Total": ${(customTaxItem.taxAmount!0)?number?c}, <#--[cite: 11] -->
                "IsRetention": false, <#-- Indica Traslado[cite: 13, 14] -->
                "IsQuota": <#if (customTaxItem.taxFactorType!"") == "Cuota">true<#else>false</#if> <#--[cite: 13, 14] -->
              }
              <#assign isFirstTax = false>
            </#if>
          </#list>
        </#if>
        
        <#-- 2. RETENCIONES (IVA, ISR)[cite: 11] -->
        <#if taxes.whTaxItems?? && taxes.whTaxItems?has_content>
          <#list taxes.whTaxItems as customTaxItem>
            <#if !isFirstTax>,</#if>
            {
              "Name": "${getTaxName((customTaxItem.satTaxCode)!"001")}", <#--[cite: 13, 14] -->
              "Base": ${(customTaxItem.taxBaseAmount!0)?number?c}, <#--[cite: 11] -->
              "Rate": ${(customTaxItem.taxRate!0)?number?c}, <#--[cite: 11] -->
              "Total": ${(customTaxItem.taxAmount!0)?number?c}, <#--[cite: 11] -->
              "IsRetention": true, <#-- Indica Retención[cite: 13, 14] -->
              "IsQuota": false <#--[cite: 13, 14] -->
            }
            <#assign isFirstTax = false>
          </#list>
        </#if>
      ]
      </#if>
    }<#if customItem_has_next>,</#if>
    </#list>
    </#if>
  ]
}