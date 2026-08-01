<?xml version="1.0" encoding="UTF-8"?>

<#setting locale = "en_US">

<#function getAttrPair attr value>
<#if value?has_content>
<#assign result="${attr}=\"${value}\"">
<#return result>
</#if>
</#function>

<#if custom.multiCurrencyFeature == "true">
<#assign "currencyCode" = transaction.currencysymbol>
<#if currencyCode == "MXN">
<#assign exchangeRate = 1>
<#else>
<#assign exchangeRate = transaction.exchangerate?string["0.000000"]>
</#if>
<#else>
<#assign "currencyCode" = "MXN">
<#assign exchangeRate = 1>
</#if>

<#assign exchangeRateVal = exchangeRate?number>

<#if custom.oneWorldFeature == "true">
<#assign customCompanyInfo = transaction.subsidiary>
<#else>
<#assign "customCompanyInfo" = companyinformation>
</#if>

<#if customer.isperson == "T">
<#assign customerName = customer.firstname + ' ' + customer.lastname>
<#else>
<#assign "customerName" = customer.companyname>
</#if>

<#assign "summary" = custom.summary>
<#assign "satCodes" = custom.satcodes>
<#assign "companyTaxRegNumber" = custom.companyInfo.rfc>

<#if customer.custentity_mx_rfc == "XAXX010101000" || customer.custentity_mx_rfc == "XEXX010101000" || customer.custentity_mx_rfc == "">
<#assign domicilioFiscalReceptor = customCompanyInfo.zip>
<#else>
<#assign domicilioFiscalReceptor = custom.billaddr.customerdefaultzipcode>
</#if>

<fx:FactDocMX
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xmlns:xsd="http://www.w3.org/2001/XMLSchema"
xsi:schemaLocation="http://www.fact.com.mx/schema/fx http://www.mysuitemex.com/fact/schema/fx_2010_g.xsd"
xmlns:fx="http://www.fact.com.mx/schema/fx">
<fx:Version>8</fx:Version>
<fx:Identificacion>
<fx:CdgPaisEmisor>MX</fx:CdgPaisEmisor>
<fx:TipoDeComprobante>PAGO</fx:TipoDeComprobante>
<fx:RFCEmisor>${companyTaxRegNumber}</fx:RFCEmisor>
<fx:RazonSocialEmisor>${customCompanyInfo.custrecord_mx_sat_registered_name}</fx:RazonSocialEmisor>
<fx:Usuario>${custom.loggedUserName}</fx:Usuario>
<fx:AsignacionSolicitada>
<#if transaction.custbody_mx_cfdi_serie?has_content>
<fx:Serie>${transaction.custbody_mx_cfdi_serie}</fx:Serie>
</#if>
<#if transaction.custbody_mx_cfdi_folio?has_content>
<fx:Folio>${transaction.custbody_mx_cfdi_folio}</fx:Folio>
</#if>
<fx:TiempoDeEmision>${transaction.custbody_alm_date_time?string.iso_nz}</fx:TiempoDeEmision>
</fx:AsignacionSolicitada>
<fx:Exportacion>01</fx:Exportacion>
<fx:LugarExpedicion>${customCompanyInfo.zip}</fx:LugarExpedicion>
</fx:Identificacion>
<#list custom.relatedCfdis.types as cfdiRelType>
<fx:CfdiRelacionados>
<fx:TipoRelacion>${cfdiRelType}</fx:TipoRelacion>
<#assign "cfdisArray" = custom.relatedCfdis.cfdis["k"+cfdiRelType?index]>
<#if cfdisArray?has_content>
<#list cfdisArray as cfdiIdx>
<fx:CfdiRelacionado>
<fx:UUID>${transaction.recmachcustrecord_mx_rcs_orig_trans[cfdiIdx.index?number].custrecord_mx_rcs_uuid}</fx:UUID>
</fx:CfdiRelacionado>
</#list>
</#if>
</fx:CfdiRelacionados>
</#list>
<fx:Emisor>
<fx:RegimenFiscal>
<fx:Regimen>${satCodes.industryType}</fx:Regimen>
</fx:RegimenFiscal>
</fx:Emisor>
<fx:Receptor>
<fx:CdgPaisReceptor>${customer.billcountry}</fx:CdgPaisReceptor>
<fx:RFCReceptor>${customer.custentity_mx_rfc}</fx:RFCReceptor>
<fx:NombreReceptor>${customer.custentity_mx_sat_registered_name}</fx:NombreReceptor>
<fx:DomicilioFiscalReceptor>${domicilioFiscalReceptor}</fx:DomicilioFiscalReceptor>
<fx:RegimenFiscalReceptor>${customer.custentity_mx_sat_industry_type[0..2]}</fx:RegimenFiscalReceptor>
<fx:UsoCFDI>CP01</fx:UsoCFDI>
</fx:Receptor>
<fx:Conceptos>
<fx:Concepto>
<fx:Cantidad>1</fx:Cantidad>
<fx:ClaveUnidad>ACT</fx:ClaveUnidad>
<fx:ClaveProdServ>84111506</fx:ClaveProdServ>
<fx:Descripcion>Pago</fx:Descripcion>
<fx:ValorUnitario>0</fx:ValorUnitario>
<fx:Importe>0</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
</fx:Concepto>
</fx:Conceptos>
<fx:Totales>
<fx:Moneda>XXX</fx:Moneda>
<fx:SubTotalBruto>0</fx:SubTotalBruto>
<fx:SubTotal>0</fx:SubTotal>
<fx:Total>0</fx:Total>
<fx:TotalEnLetra>-</fx:TotalEnLetra>
</fx:Totales>
<fx:Complementos>
<fx:Pagos20 Version="2.0">
<fx:Totales MontoTotalPagos="${(transaction.payment * exchangeRateVal)?string["0.00"]}" />
<fx:Pago
FechaPago="${transaction.trandate?string.iso}T00:00:00"
FormaDePagoP="${transaction.custbody_mx_txn_sat_payment_method[0..1]}"
MonedaP="${currencyCode}"
TipoCambioP="${exchangeRateVal}"
Monto="${transaction.payment?string["0.00"]}"
<#if transaction.custbody_mx_cfdi_payment_id?has_content>
NumOperacion="${transaction.custbody_mx_cfdi_payment_id}"
</#if>
<#if transaction.custbody_mx_cfdi_issuer_entity_rfc?has_content>
RfcEmisorCtaOrd="${transaction.custbody_mx_cfdi_issuer_entity_rfc}"
</#if>
<#if transaction.custbody_mx_cfdi_issue_bank_name?has_content>
NomBancoOrdExt="${transaction.custbody_mx_cfdi_issue_bank_name}"
</#if>
<#if transaction.custbody_mx_cfdi_payer_account?has_content>
CtaOrdenante="${transaction.custbody_mx_cfdi_payer_account}"
</#if>
<#if transaction.custbody_mx_cfdi_recipient_entity_rfc?has_content>
RfcEmisorCtaBen="${transaction.custbody_mx_cfdi_recipient_entity_rfc}"
</#if>
<#if transaction.custbody_mx_cfdi_recipient_account?has_content>
CtaBeneficiario="${transaction.custbody_mx_cfdi_recipient_account}"
</#if>
<#if transaction.custbody_mx_cfdi_payment_string_type?has_content>
TipoCadPago="${satCodes.paymentStringTypeCode}"
</#if>
<#if transaction.custbody_mx_cfdi_payment_certificate?has_content>
CertPago="${transaction.custbody_mx_cfdi_payment_certificate}"
</#if>
<#if transaction.custbody_mx_cfdi_payment_string?has_content>
CadPago="${transaction.custbody_mx_cfdi_payment_string}"
</#if>
<#if transaction.custbody_mx_cfdi_payment_signature?has_content>
SelloPago="${transaction.custbody_mx_cfdi_payment_signature}"
</#if>
>
<#list custom.appliedTxns as appliedTxn>
<#assign "txnitem" = transaction.apply[appliedTxn.line?number]>
<#if custom.multiCurrencyFeature == "true">
<#assign appliedTxnCurrency = appliedTxn.currencysymbol>
<#else>
<#assign appliedTxnCurrency = currencyCode>
</#if>
<#if appliedTxn.taxSummary.whTaxes?has_content || appliedTxn.taxSummary.transferTaxes?has_content>
<#assign objetoImpDR = "02">
<#else>
<#assign objetoImpDR = "01">
</#if>
<fx:DoctoRelacionado IdDocumento="${appliedTxn.custbody_mx_cfdi_uuid}"
${getAttrPair("Folio", appliedTxn.custbody_mx_cfdi_folio)}
${getAttrPair("Serie", appliedTxn.custbody_mx_cfdi_serie)}
MonedaDR="${appliedTxnCurrency}"
<#if appliedTxnCurrency == currencyCode>
EquivalenciaDR = "1"
</#if>
NumParcialidad="${appliedTxn.order}"
ImpSaldoAnt="${(appliedTxn.amountdue?number + txnitem.amount)?string["0.00"]}"
ImpPagado="${txnitem.amount?string["0.00"]}"
ImpSaldoInsoluto="${appliedTxn.amountdue?number?string["0.00"]}"
ObjetoImpDR="${objetoImpDR}">
<#if objetoImpDR == "02">
<fx:ImpuestosDR>
<#if appliedTxn.taxSummary.whTaxes?has_content>
<fx:RetencionesDR>
<#list appliedTxn.taxSummary.whTaxes as whTax>
<#assign retentionDR =whTax.totalTaxBaseAmount?number?string["0.00"]?number * whTax.taxRate?number>
<fx:RetencionDR
BaseDR="${whTax.totalTaxBaseAmount?number?string["0.00"]}"
ImporteDR="${retentionDR?number?string["0.00"]}"
ImpuestoDR="${whTax.satTaxCode}"
TasaOCuotaDR="${whTax.taxRate?number?string["0.000000"]}"
TipoFactorDR="${whTax.taxFactorType}"
/>
</#list>
</fx:RetencionesDR>
</#if>
<#if appliedTxn.taxSummary.transferTaxes?has_content>
<fx:TrasladosDR>
<#list appliedTxn.taxSummary.transferTaxes as transferTax>
<#if transferTax.taxFactorType == "Exento">
<fx:TrasladoDR
BaseDR="${transferTax.totalTaxBaseAmount?number?string["0.00"]}"
ImpuestoDR="${transferTax.satTaxCode}"
TipoFactorDR="${transferTax.taxFactorType}"
/>
</#if>
<#if !transferTax.taxFactorType?has_content || transferTax.taxFactorType != "Exento">
<#assign importDR = transferTax.totalTaxBaseAmount?number?string["0.00"]?number * transferTax.taxRate?number>
<fx:TrasladoDR
BaseDR="${transferTax.totalTaxBaseAmount?number?string["0.00"]}"
ImporteDR="${importDR?number?string["0.00"]}"
ImpuestoDR="${transferTax.satTaxCode}"
TasaOCuotaDR="${transferTax.taxRate?number?string["0.000000"]}"
TipoFactorDR="${transferTax.taxFactorType}"
/>
</#if>
</#list>
</fx:TrasladosDR>
</#if>
</fx:ImpuestosDR>
</#if>
</fx:DoctoRelacionado>
</#list>
</fx:Pago>
</fx:Pagos20>
</fx:Complemento