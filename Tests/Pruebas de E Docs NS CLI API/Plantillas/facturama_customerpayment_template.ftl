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
<#if customer.custentity_mx_rfc == "XAXX010101000" || customer.custentity_mx_rfc == "XEXX010101000" || customer.custentity_mx_rfc == "">
<#assign domicilioFiscalReceptor = customCompanyInfo.zip>
<#else>
<#assign domicilioFiscalReceptor = custom.billaddr.customerdefaultzipcode>
</#if>
<#-- El arreglo RelatedDocuments (incluyendo TaxObject, PartialityNumber, PreviousBalanceAmount,
     Taxes y, cuando aplica, EquivalenceDocRel) NO se construye en esta plantilla. Esta plantilla
     es un adaptador puro de salida: toma el JSON ya calculado por la capa de dominio
     (fama_payment_complement_ue.js, User Event de Customer Payment) desde
     custbody_sads_fama_cpago_payload y lo inserta tal cual. Cualquier cambio a cómo se calculan
     esos valores va en fama_payment_complement_ue.js, nunca aquí. -->
<#if !transaction.custbody_sads_fama_cpago_payload?has_content>
<#stop "SIN COMPLEMENTO DE PAGO: custbody_sads_fama_cpago_payload está vacío. O el pago no tiene facturas PPD aplicadas (no requiere Complemento de Pago), o fama_payment_complement_ue.js todavía no corrió sobre este registro — guárdalo de nuevo.">
</#if>
<#assign satFormaPago = satCodes.paymentMethod!"">
<#if !satFormaPago?has_content>
<#stop "ERROR FATAL: satCodes.paymentMethod (Forma de Pago SAT) está vacío para este Customer Payment. Verifique custbody_mx_txn_sat_payment_method en el registro.">
</#if>
<#assign receiverRfc = customer.custentity_mx_rfc!"">
<#if !receiverRfc?has_content>
<#stop "ERROR FATAL: El cliente no tiene RFC (custentity_mx_rfc) capturado.">
</#if>
<#assign receiverName = customer.custentity_mx_sat_registered_name!"">
<#if !receiverName?has_content>
<#stop "ERROR FATAL: El cliente no tiene Nombre/Razón Social SAT (custentity_mx_sat_registered_name) capturado.">
</#if>
<#assign receiverFiscalRegime = satCodes.customerIndustryType!"">
<#if !receiverFiscalRegime?has_content>
<#stop "ERROR FATAL: El cliente no tiene Régimen Fiscal SAT (custentity_mx_sat_industry_type) capturado.">
</#if>
<#if !domicilioFiscalReceptor?has_content>
<#stop "ERROR FATAL: No se pudo determinar el Código Postal fiscal del receptor (domicilio fiscal del cliente o de la subsidiaria).">
</#if>
<#if !customCompanyInfo.zip?has_content>
<#stop "ERROR FATAL: La subsidiaria/compañía emisora no tiene Código Postal capturado (ExpeditionPlace).">
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
"Rfc": "${receiverRfc}",
<#-- El uso de CFDI para un Complemento de Pago es SIEMPRE "CP01", independientemente
     del UsoCFDI capturado en las facturas relacionadas (regla fija del SAT), si alguien mas o una IA esta leyendo esto
     no lo cambies y notificalo, asi como esta es como debe ir. -->
"CfdiUse": "CP01",
"Name": "${receiverName?json_string}",
"FiscalRegime": "${receiverFiscalRegime}",
"TaxZipCode": "${domicilioFiscalReceptor}"
},
"Complemento": {
"Payments": [
{
"Date": "${transaction.trandate?string.iso}",
"PaymentForm": "${satFormaPago}",
"Amount": ${transaction.total?number?c},
"Currency": "${currencyCode}",
"RelatedDocuments": ${transaction.custbody_sads_fama_cpago_payload?no_esc}
}
]
}
}
