<#setting locale = "en_US">
<#function getAttrPair attr value>
<#if value?has_content>
<#assign result="${attr}=\"${value}\"">
<#return result>
</#if>
</#function>

<#-- 1. PREPARACIÓN DE VARIABLES -->
<#assign customCompanyInfo = companyinformation>
<#if custom.oneWorldFeature == "true">
<#assign customCompanyInfo = transaction.subsidiary>
</#if>
<#assign issuerRFC = custom.companyInfo.rfc!"">
<#assign domicilioFiscalReceptor = custom.billaddr.customerdefaultzipcode!"">

<#-- Fuentes de campo confirmadas por prueba directa en sandbox el 2026-09-24 (ver
     docs/development-log.md): satCodes.paymentMethod y satCodes.customerIndustryType NO los
     llena el hook nativo de Customer Payment (solo el de Invoice). Se leen directo de
     transaction/customer, igual que la plantilla MySuite de Complemento de Pago que sí funciona
     en esta cuenta. -->
<#assign receiverRfc = transaction.custbody_mx_customer_rfc!"">
<#assign receiverName = customer.custentity_mx_sat_registered_name!"">
<#assign rawReceiverFiscalRegime = customer.custentity_mx_sat_industry_type!"">
<#if rawReceiverFiscalRegime?length gte 3>
<#assign receiverFiscalRegime = rawReceiverFiscalRegime[0..2]>
<#else>
<#assign receiverFiscalRegime = rawReceiverFiscalRegime>
</#if>

<#assign issuerName = customCompanyInfo.custrecord_mx_sat_registered_name!"">
<#assign issuerRfcFinal = customCompanyInfo.custrecord_alm_subsidiaria_rfc!issuerRFC!"">
<#assign rawIssuerFiscalRegime = customCompanyInfo.custrecord_mx_sat_industry_type!"">
<#if rawIssuerFiscalRegime?length gte 3>
<#assign issuerFiscalRegime = rawIssuerFiscalRegime[0..2]>
<#else>
<#assign issuerFiscalRegime = rawIssuerFiscalRegime>
</#if>

<#assign paymentForm = transaction.custbody_mx_txn_sat_payment_method!"">
<#if paymentForm?length gte 2>
<#assign paymentForm = paymentForm[0..1]>
</#if>

<#-- 2. VALIDACIONES Fail-Fast (ver CLAUDE.md: dato fiscal incompleto -> no generar, no adivinar) -->
<#if !transaction.custbody_sads_fama_cpago_payload?has_content>
<#stop "SIN COMPLEMENTO DE PAGO: custbody_sads_fama_cpago_payload está vacío. O el pago no tiene facturas PPD aplicadas (no requiere Complemento de Pago), o fama_payment_complement_ue.js todavía no corrió sobre este registro — guárdalo de nuevo.">
</#if>
<#if !paymentForm?has_content>
<#stop "ERROR FATAL: La Forma de Pago SAT (custbody_mx_txn_sat_payment_method) está vacía para este Customer Payment.">
</#if>
<#if !receiverRfc?has_content>
<#stop "ERROR FATAL: El pago no tiene el RFC del cliente (custbody_mx_customer_rfc) capturado.">
</#if>
<#if !receiverName?has_content>
<#stop "ERROR FATAL: El cliente no tiene Nombre/Razón Social SAT (custentity_mx_sat_registered_name) capturado.">
</#if>
<#if !receiverFiscalRegime?has_content>
<#stop "ERROR FATAL: El cliente no tiene Régimen Fiscal SAT (custentity_mx_sat_industry_type) capturado.">
</#if>
<#if !domicilioFiscalReceptor?has_content>
<#stop "ERROR FATAL: No se pudo determinar el Código Postal fiscal del receptor (domicilio fiscal del cliente).">
</#if>
<#if !customCompanyInfo.zip?has_content>
<#stop "ERROR FATAL: La subsidiaria/compañía emisora no tiene Código Postal capturado (ExpeditionPlace).">
</#if>
<#if !issuerRfcFinal?has_content>
<#stop "ERROR FATAL: No se pudo determinar el RFC del emisor (custrecord_alm_subsidiaria_rfc / custrecord_sads_fama config).">
</#if>
<#if !issuerName?has_content>
<#stop "ERROR FATAL: La subsidiaria/compañía emisora no tiene Nombre/Razón Social SAT (custrecord_mx_sat_registered_name) capturado.">
</#if>
<#if !issuerFiscalRegime?has_content>
<#stop "ERROR FATAL: La subsidiaria/compañía emisora no tiene Régimen Fiscal SAT (custrecord_mx_sat_industry_type) capturado.">
</#if>

<#-- El arreglo RelatedDocuments (TaxObject, PartialityNumber, PreviousBalanceAmount, Taxes y,
     cuando aplica, EquivalenceDocRel) NO se construye en esta plantilla. Esta plantilla es un
     adaptador puro de salida: toma el JSON ya calculado por la capa de dominio
     (fama_payment_complement_ue.js, User Event de Customer Payment) desde
     custbody_sads_fama_cpago_payload y lo inserta TAL CUAL (ya es un arreglo completo — no
     envolverlo en otro [ ] o queda doblemente anidado). Cualquier cambio a cómo se calculan esos
     valores va en fama_payment_complement_ue.js, nunca aquí. -->

<#-- 3. CONSTRUCCIÓN DEL JSON -->
{
"CfdiType": "P",
"NameId": "14",
<#if transaction.tranid?has_content>
"Folio": "${transaction.tranid?json_string}",
</#if>
"ExpeditionPlace": "${customCompanyInfo.zip?json_string}",
"Receiver": {
"Rfc": "${receiverRfc?json_string}",
"CfdiUse": "CP01",
"Name": "${receiverName?json_string}",
"FiscalRegime": "${receiverFiscalRegime?json_string}",
"TaxZipCode": "${domicilioFiscalReceptor?json_string}"
},
"Issuer": {
"FiscalRegime": "${issuerFiscalRegime?json_string}",
"Rfc": "${issuerRfcFinal?json_string}",
"Name": "${issuerName?json_string}"
},
"Complemento": {
"Payments": [
{
"Date": "${(transaction.trandate!.now)?string("yyyy-MM-dd")}",
"PaymentForm": "${paymentForm?json_string}",
"Amount": ${(transaction.payment!0)?c},
"Currency": "${(transaction.currencysymbol!"MXN")?json_string}",
"OperationNumber": "${(transaction.tranid!"")?json_string}",
"RelatedDocuments": ${transaction.custbody_sads_fama_cpago_payload}
}
]
}
}
