<#ftl output_format="XML">
<?xml version="1.0" encoding="UTF-8"?>

<#setting locale = "en_US">

<#function roundUp value>
    <#return value?string["0.00;;roundingMode=halfUp"]>
</#function>

<#macro printAttrPair attr value>
	<#if value?has_content>
        ${attr}="${value}"
    </#if>
</#macro>

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

<#if customer.custentity_mx_rfc == "XAXX010101000" || customer.custentity_mx_rfc == "XEXX010101000" || customer.custentity_mx_rfc == "">
    <#assign domicilioFiscalReceptor = customCompanyInfo.zip>
<#else>
    <#assign domicilioFiscalReceptor = custom.billaddr.customerdefaultzipcode>
</#if>

<fx:FactDocMX
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:xsd="http://www.w3.org/2001/XMLSchema"
    xsi:schemaLocation="http://www.fact.com.mx/schema/fx   http://www.mysuitemex.com/fact/schema/fx_2010_g.xsd"
    xmlns:fx="http://www.fact.com.mx/schema/fx">
    <fx:Version>8</fx:Version>
    <fx:Identificacion>
        <fx:CdgPaisEmisor>MX</fx:CdgPaisEmisor>
        <fx:TipoDeComprobante>PAGO</fx:TipoDeComprobante>
        <fx:RFCEmisor>${custom.companyInfo.rfc?no_esc}</fx:RFCEmisor>
        <fx:RazonSocialEmisor>${customCompanyInfo.custrecord_mx_sat_registered_name?string?replace("'", "&apos;")?replace("\"","&quot;")?no_esc}</fx:RazonSocialEmisor>
        <fx:Usuario>${custom.loggedUserName}</fx:Usuario>
        <fx:AsignacionSolicitada>
            <#if transaction.custbody_mx_cfdi_serie?has_content>
                <fx:Serie>${transaction.custbody_mx_cfdi_serie}</fx:Serie>
            </#if>
            <#if transaction.custbody_mx_cfdi_folio?has_content>
                 <fx:Folio>${transaction.custbody_mx_cfdi_folio}</fx:Folio>
            </#if>
            <fx:TiempoDeEmision>${transaction.createddate?string.iso_nz}</fx:TiempoDeEmision>
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
		<fx:RFCReceptor>${customer.custentity_mx_rfc?no_esc}</fx:RFCReceptor>
        <fx:NombreReceptor>${customer.custentity_mx_sat_registered_name?string?replace("'", "&apos;")?replace("\"","&quot;")?no_esc}</fx:NombreReceptor>
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
        <fx:Totales
            MontoTotalPagos="${roundUp(transaction.payment * exchangeRateVal)}"

            <#if custom.totalRetencionesISR?has_content>TotalRetencionesISR="${roundUp(exchangeRateVal * custom.totalRetencionesISR?number)}"</#if>
            <#if custom.totalRetencionesIVA?has_content>TotalRetencionesIVA="${roundUp(exchangeRateVal * custom.totalRetencionesIVA?number)}"</#if>
            <#if custom.totalRetencionesIEPS?has_content>TotalRetencionesIEPS="${roundUp(exchangeRateVal * custom.totalRetencionesIEPS?number)}"</#if>

            <#if custom.totalTrasladosBaseIVA16?has_content>TotalTrasladosBaseIVA16="${roundUp(exchangeRateVal * custom.totalTrasladosBaseIVA16?number)}"</#if>
            <#if custom.totalTrasladosImpuestoIVA16?has_content>TotalTrasladosImpuestoIVA16="${roundUp(exchangeRateVal * custom.totalTrasladosImpuestoIVA16?number)}"</#if>
            <#if custom.totalTrasladosBaseIVA8?has_content>TotalTrasladosBaseIVA8="${roundUp(exchangeRateVal * custom.totalTrasladosBaseIVA8?number)}"</#if>
            <#if custom.totalTrasladosImpuestoIVA8?has_content>TotalTrasladosImpuestoIVA8="${roundUp(exchangeRateVal * custom.totalTrasladosImpuestoIVA8?number)}"</#if>
            <#if custom.totalTrasladosBaseIVA0?has_content>TotalTrasladosBaseIVA0="${roundUp(exchangeRateVal * custom.totalTrasladosBaseIVA0?number)}"</#if>
            <#if custom.totalTrasladosImpuestoIVA0?has_content>TotalTrasladosImpuestoIVA0="${roundUp(exchangeRateVal * custom.totalTrasladosImpuestoIVA0?number)}"</#if>

            <#if custom.totalTrasladosBaseIVAExento?has_content>TotalTrasladosBaseIVAExento="${roundUp(exchangeRateVal * custom.totalTrasladosBaseIVAExento?number)}"</#if>
        />
        <fx:Pago
           FechaPago="${transaction.trandate?string.iso_nz}T12:00:00"
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
            <#if custom.multiCurrencyFeature == "true">
                <#assign appliedTxnCurrency = appliedTxn.currencysymbol>
            <#else>
                <#assign appliedTxnCurrency = currencyCode>
            </#if>
            <#if appliedTxn.taxSummary.whTaxes?has_content || appliedTxn.taxSummary.transferTaxes?has_content || appliedTxn.taxSummary.exemptTaxes?has_content>
                <#assign objetoImpDR = "02">
            <#else>
                <#assign objetoImpDR = "01">
            </#if>
            <fx:DoctoRelacionado IdDocumento="${appliedTxn.custbody_mx_cfdi_uuid}"
				<@printAttrPair attr="Folio" value=appliedTxn.custbody_mx_cfdi_folio/>
				<@printAttrPair attr="Serie" value=appliedTxn.custbody_mx_cfdi_serie/>
                MonedaDR="${appliedTxnCurrency}"
                <#if appliedTxnCurrency == currencyCode>
                    EquivalenciaDR = "1"
                </#if>
                NumParcialidad="${appliedTxn.order}"
                ImpSaldoAnt="${(appliedTxn.amountdue?number + appliedTxn.amount?number)?string["0.00"]}"
                ImpPagado="${appliedTxn.amount?number?string["0.00"]}"
                ImpSaldoInsoluto="${appliedTxn.amountdue?number?string["0.00"]}"
                ObjetoImpDR="${objetoImpDR}">
                <#if objetoImpDR == "02">
                    <fx:ImpuestosDR>
                        <#if appliedTxn.taxSummary.whTaxes?has_content >
                            <fx:RetencionesDR>
                                <#list appliedTxn.taxSummary.whTaxes as whTax>
                                    <fx:RetencionDR
                                            BaseDR="${whTax.totalTaxBaseAmount?number?string["0.000000"]}"
                                            ImporteDR="${whTax.taxAmount?number?string["0.000000"]}"
                                            ImpuestoDR="${whTax.satTaxCode}"
                                            TasaOCuotaDR="${whTax.taxRate?number?string["0.000000"]}"
                                            TipoFactorDR="${whTax.taxFactorType}"
                                    />
                                </#list>
                            </fx:RetencionesDR>
                        </#if>
                        <#if appliedTxn.taxSummary.transferTaxes?has_content || appliedTxn.taxSummary.exemptTaxes?has_content>
                            <fx:TrasladosDR>
                                <#list appliedTxn.taxSummary.transferTaxes as transferTax>
                                    <fx:TrasladoDR
                                            BaseDR="${transferTax.totalTaxBaseAmount?number?string["0.000000"]}"
                                            ImporteDR="${transferTax.taxAmount?number?string["0.000000"]}"
                                            ImpuestoDR="${transferTax.satTaxCode}"
                                            TasaOCuotaDR="${transferTax.taxRate?number?string["0.000000"]}"
                                            TipoFactorDR="${transferTax.taxFactorType}"
                                    />
                                </#list>
                                <#list appliedTxn.taxSummary.exemptTaxes as exemptTaxes>
                                    <fx:TrasladoDR
                                        BaseDR="${exemptTaxes.totalTaxBaseAmount?number?string["0.000000"]}"
                                        ImpuestoDR="${exemptTaxes.satTaxCode}"
                                        TipoFactorDR="${exemptTaxes.taxFactorType}"
                                        />
                                </#list>
                            </fx:TrasladosDR>
                        </#if>
                    </fx:ImpuestosDR>
                </#if>
            </fx:DoctoRelacionado>
        </#list>
        <#if custom.accumWhTaxes?has_content || custom.accumTransferTaxes?has_content || custom.accumExemptTaxes?has_content>
            <fx:ImpuestosP>
                <#if custom.accumWhTaxes?has_content>
                    <fx:RetencionesP>
                        <#list custom.accumWhTaxes as accumWhTax>
                            <fx:RetencionP
                                ImpuestoP="${accumWhTax.satTaxCode}"
                                ImporteP="${accumWhTax.taxAmount?number?string["0.000000"]}"/>
                        </#list>
                    </fx:RetencionesP>
                </#if>
                <#if custom.accumTransferTaxes?has_content || custom.accumExemptTaxes?has_content>
                    <fx:TrasladosP>
                        <#if custom.accumExemptTaxes?has_content>
                            <fx:TrasladoP
                                BaseP="${custom.accumExemptTaxes.taxSummary?number?string["0.000000"]}"
                                ImpuestoP="${custom.accumExemptTaxes.satTaxCode}"
                                TipoFactorP="${custom.accumExemptTaxes.taxFactorType}"
                                />
                        </#if>
                        <#list custom.accumTransferTaxes as accumTransferTax>
                            <fx:TrasladoP
                                BaseP="${accumTransferTax.taxSummary?number?string["0.000000"]}"
                                ImpuestoP="${accumTransferTax.satTaxCode}"
                                TipoFactorP="${accumTransferTax.taxFactorType}"
                                TasaOCuotaP="${accumTransferTax.taxRate?number?string["0.000000"]}"
                                ImporteP="${accumTransferTax.taxAmount?number?string["0.000000"]}"/>
                        </#list>
                    </fx:TrasladosP>
                </#if>
            </fx:ImpuestosP>
        </#if>
      </fx:Pago>
    </fx:Pagos20>
  </fx:Complementos>
</fx:FactDocMX>