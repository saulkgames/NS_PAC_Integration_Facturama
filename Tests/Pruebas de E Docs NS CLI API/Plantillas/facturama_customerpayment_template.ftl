<#setting locale = "en_US">
<#function getAttrPair attr value>
<#if value?has_content>
<#assign result="${attr}=\"${value}\"">
<#return result>
</#if>
</#function>

<#-- 1. PREPARACIÓN DE VARIABLES (mismo criterio que facturama_edocs_template.ftl) -->
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

<#if !custom.appliedTxns?has_content>
<#stop "ERROR FATAL: El pago no tiene transacciones aplicadas (sublista 'apply'). No se puede generar un Complemento de Pago sin al menos un documento relacionado.">
</#if>

<#-- 2. CONSTRUCCIÓN DEL JSON -->
{
"CfdiType": "P",
"NameId": 1,
<#if transaction.tranid?has_content>
"Folio": "${transaction.tranid?json_string}",
</#if>
"ExpeditionPlace": "${customCompanyInfo.zip}",

"Receiver": {
"Rfc": "${customer.custentity_mx_rfc}",
<#-- El uso de CFDI para un Complemento de Pago es SIEMPRE "CP01", independientemente
     del UsoCFDI capturado en las facturas relacionadas (regla fija del SAT). -->
"CfdiUse": "CP01",
"Name": "${customer.custentity_mx_sat_registered_name?json_string}",
"FiscalRegime": "${satCodes.customerIndustryType}",
"TaxZipCode": "${domicilioFiscalReceptor}"
},

"Complemento": {
"Payments": [
{
"Date": "${transaction.trandate?string.iso}",
"PaymentForm": "${satCodes.paymentMethod}",
"Amount": ${transaction.total?number?c},
"Currency": "${currencyCode}",
"RelatedDocuments": [
<#list custom.appliedTxns as appliedTxn>
<#assign previousBalance = appliedTxn.amountdue?number>
<#assign amountPaid = appliedTxn.amount?number>
<#assign outstandingBalance = previousBalance - amountPaid>
<#if outstandingBalance < 0><#assign outstandingBalance = 0></#if>
{
<#-- SUPUESTO NO VALIDADO: el hook nativo (customerPayment.js, bundle Mexico Compliance)
     no expone el ObjetoImp de la factura relacionada en custom.appliedTxns. Se fija "02"
     (Sí objeto de impuesto) por ser el caso dominante. Si alguna factura PPD llegara a ser
     "01" (No objeto), este valor quedaría incorrecto — validar antes de producción. -->
"TaxObject": "02",
"Uuid": "${appliedTxn.custbody_mx_cfdi_uuid?json_string}",
<#if appliedTxn.custbody_mx_cfdi_serie?has_content>
"Serie": "${appliedTxn.custbody_mx_cfdi_serie?json_string}",
</#if>
"Folio": "${appliedTxn.custbody_mx_cfdi_folio?json_string}",
"Currency": "${appliedTxn.currencysymbol}",
<#-- GAP CONOCIDO: custom.appliedTxns no trae el tipo de cambio de la factura relacionada,
     por lo que "EquivalenceDocRel" no se puede calcular aquí. Si la factura está en moneda
     distinta a la del pago, este nodo debe enriquecerse fuera de la plantilla (por ejemplo,
     en pi_sads_fama_connector.js antes de enviar a Facturama). -->
"PaymentMethod": "${appliedTxn.paymentTerm}",
"PartialityNumber": "${appliedTxn.order}",
"PreviousBalanceAmount": "${previousBalance?string("0.00")}",
"AmountPaid": "${amountPaid?string("0.00")}",
"ImpSaldoInsoluto": "${outstandingBalance?string("0.00")}",
"Taxes": [
<#assign isFirstTax = true>
<#if appliedTxn.taxSummary.transferTaxes?has_content>
<#list appliedTxn.taxSummary.transferTaxes as transferTax>
<#if !isFirstTax>,</#if>
{
"Name": "${getTaxName(transferTax.satTaxCode)}",
"Base": ${transferTax.totalTaxBaseAmount?number?c},
"Rate": ${transferTax.taxRate?number?c},
"Total": ${transferTax.taxAmount?number?c},
"IsRetention": false,
"IsQuota": <#if transferTax.taxFactorType == "Cuota">true<#else>false</#if>
}
<#assign isFirstTax = false>
</#list>
</#if>
<#if appliedTxn.taxSummary.whTaxes?has_content>
<#list appliedTxn.taxSummary.whTaxes as whTax>
<#if !isFirstTax>,</#if>
{
"Name": "${getTaxName(whTax.satTaxCode)}",
"Base": ${whTax.totalTaxBaseAmount?number?c},
"Rate": ${whTax.taxRate?number?c},
"Total": ${whTax.taxAmount?number?c},
"IsRetention": true,
"IsQuota": false
}
<#assign isFirstTax = false>
</#list>
</#if>
]
}<#if appliedTxn_has_next>,</#if>
</#list>
]
}
]
}
}
