<?xml version="1.0" encoding="utf-8"?>
<#setting locale = "en_US">
<#function getAttrPair attr value>
   <#if value?has_content>
    <#assign result="${attr}=\"${value}\"">
    <#return result>
  </#if>

</#function>
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
<cfdi:Comprobante xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:cfdi="http://www.sat.gob.mx/cfd/3" xsi:schemaLocation="http://www.sat.gob.mx/cfd/3 http://www.sat.gob.mx/sitio_internet/cfd/3/cfdv33.xsd http://www.sat.gob.mx/Pagos http://www.sat.gob.mx/sitio_internet/cfd/Pagos/Pagos10.xsd" 
Fecha="${transaction.createddate?string.iso_nz}"
${getAttrPair("Folio",transaction.custbody_mx_cfdi_folio)}
${getAttrPair("Serie",transaction.custbody_mx_cfdi_serie)}
LugarExpedicion="${customCompanyInfo.zip}"
Moneda="XXX"
SubTotal="0"
TipoDeComprobante="P"
Total="0"
Version="3.3">
<#if transaction.recmachcustrecord_mx_rcs_orig_trans?has_content>
<#list custom.relatedCfdis.types as cfdiRelType>
   <cfdi:CfdiRelacionados TipoRelacion="${cfdiRelType}">
   <#assign "cfdisArray" = custom.relatedCfdis.cfdis["k"+cfdiRelType?index]>
   <#if cfdisArray?has_content>
   <#list cfdisArray as cfdiIdx>
      <cfdi:CfdiRelacionado  UUID="${transaction.recmachcustrecord_mx_rcs_orig_trans[cfdiIdx.index?number].custrecord_mx_rcs_uuid}" />
   </#list>
   </#if>
   </cfdi:CfdiRelacionados>
</#list>
</#if>
<cfdi:Emisor ${getAttrPair("Nombre", customCompanyInfo.legalname)} RegimenFiscal="${satCodes.industryType}" Rfc="${companyTaxRegNumber}" />
<cfdi:Receptor Nombre="${customerName}" Rfc="${customer.custentity_mx_rfc}" UsoCFDI="P01" />
<cfdi:Conceptos>
    <cfdi:Concepto Cantidad="1" ClaveProdServ="84111506" ClaveUnidad="ACT" Descripcion="Pago" Importe="0" ValorUnitario="0" />
</cfdi:Conceptos>
<#if currencyCode != "MXN">
  <#assign exchangeRateVal = exchangeRate>
</#if>
<cfdi:Complemento>
    <pago10:Pagos xmlns:pago10="http://www.sat.gob.mx/Pagos" Version="1.0">
      <pago10:Pago
        FechaPago="${transaction.trandate?string.iso_nz}T12:00:00"
        FormaDePagoP="${satCodes.paymentMethod}"
        MonedaP="${currencyCode}"
        ${getAttrPair("TipoCambioP",exchangeRateVal)}
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
      <#assign "invPaymentTerm" = satCodes.paymentTermInvMap["d"+appliedTxn.id]>
      <#if custom.multiCurrencyFeature == "true">
        <#assign appliedTxnCurrency = appliedTxn.currencysymbol>
      <#else>
        <#assign appliedTxnCurrency = currencyCode>
      </#if>
      <pago10:DoctoRelacionado IdDocumento="${appliedTxn.custbody_mx_cfdi_uuid}" ${getAttrPair("Folio",appliedTxn.custbody_mx_cfdi_folio)} ${getAttrPair("Serie",appliedTxn.custbody_mx_cfdi_serie)} MonedaDR="${appliedTxnCurrency}" MetodoDePagoDR="${invPaymentTerm}" NumParcialidad="${appliedTxn.order}" ImpSaldoAnt="${(appliedTxn.amountdue?number + txnitem.amount)?string["0.00"]}" ImpPagado="${txnitem.amount?string["0.00"]}" ImpSaldoInsoluto="${appliedTxn.amountdue?number?string["0.00"]}" />
      </#list>
      </pago10:Pago>
    </pago10:Pagos>
  </cfdi:Complemento>
</cfdi:Comprobante>