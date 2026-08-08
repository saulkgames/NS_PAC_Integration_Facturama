<#ftl output_format="XML">
<?xml version="1.0" encoding="utf-8"?>
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
    <#if transaction.exchangerate == 1>
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

<#assign companyTaxRegNumber = custom.companyInfo.rfc>
<#assign companySatRegName = customCompanyInfo.custrecord_mx_sat_registered_name?string?replace("'", "&apos;")?replace("\"","&quot;")>
<#assign customerSatRegName = customer.custentity_mx_sat_registered_name?string?replace("'", "&apos;")?replace("\"","&quot;")>
<#assign customerTaxRegNumber = customer.custentity_mx_rfc>

<#assign "summary" = custom.summary>
<#assign "satCodes" = custom.satcodes>

<#if customer.custentity_mx_rfc == "XAXX010101000" || customer.custentity_mx_rfc == "XEXX010101000" || customer.custentity_mx_rfc == "">
    <#assign domicilioFiscalReceptor = customCompanyInfo.zip>
<#else>
    <#assign domicilioFiscalReceptor = custom.billaddr.customerdefaultzipcode>
</#if>

<cfdi:Comprobante
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
    xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd
    http://www.sat.gob.mx/Pagos20 http://www.sat.gob.mx/sitio_internet/cfd/Pagos/Pagos20.xsd"
    Fecha="${transaction.createddate?string.iso_nz}"
	<@printAttrPair attr="Folio" value=transaction.custbody_mx_cfdi_folio/>
	<@printAttrPair attr="Serie" value=transaction.custbody_mx_cfdi_serie/>
    LugarExpedicion="${customCompanyInfo.zip}"
    Moneda="XXX"
    SubTotal="0"
    TipoDeComprobante="P"
    Exportacion="01"
    Total="0"
    Version="4.0">
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
    <cfdi:Emisor
            Nombre="${companySatRegName?no_esc}"
            RegimenFiscal="${satCodes.industryType}"
            Rfc="${companyTaxRegNumber?no_esc}" />
    <cfdi:Receptor
            Nombre="${customerSatRegName?no_esc}"
            DomicilioFiscalReceptor="${domicilioFiscalReceptor}"
            Rfc="${customerTaxRegNumber?no_esc}"
            RegimenFiscalReceptor="${customer.custentity_mx_sat_industry_type[0..2]}"
            UsoCFDI="CP01" />
    <cfdi:Conceptos>
        <cfdi:Concepto
                Cantidad="1"
                ClaveProdServ="84111506"
                ClaveUnidad="ACT"
                Descripcion="Pago"
                Importe="0"
                ValorUnitario="0"
                ObjetoImp="01" />
    </cfdi:Conceptos>
    <cfdi:Complemento>
        <pago20:Pagos xmlns:pago20="http://www.sat.gob.mx/Pagos20" Version="2.0">
            <pago20:Totales
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
            <pago20:Pago
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
                    <pago20:DoctoRelacionado
                        IdDocumento="${appliedTxn.custbody_mx_cfdi_uuid}"
                        <@printAttrPair attr="Folio" value=appliedTxn.custbody_mx_cfdi_folio/>
                        <@printAttrPair attr="Serie" value=appliedTxn.custbody_mx_cfdi_serie/>
                        MonedaDR="${appliedTxnCurrency}"
                        EquivalenciaDR = "1"
                        NumParcialidad="${appliedTxn.order}"
                        ImpSaldoAnt="${(appliedTxn.amountdue?number + appliedTxn.amount?number)?string["0.00"]}"
                        ImpPagado="${appliedTxn.amount?number?string["0.00"]}"
                        ImpSaldoInsoluto="${appliedTxn.amountdue?number?string["0.00"]}"
                        ObjetoImpDR="${objetoImpDR}">
                        <#if objetoImpDR == "02">
                            <pago20:ImpuestosDR>
                                <#if appliedTxn.taxSummary.whTaxes?has_content>
                                    <pago20:RetencionesDR>
                                        <#list appliedTxn.taxSummary.whTaxes as whTax>
                                            <pago20:RetencionDR
                                                BaseDR="${whTax.totalTaxBaseAmount?number?string["0.000000"]}"
                                                ImporteDR="${whTax.taxAmount?number?string["0.000000"]}"
                                                ImpuestoDR="${whTax.satTaxCode}"
                                                TasaOCuotaDR="${whTax.taxRate?number?string["0.000000"]}"
                                                TipoFactorDR="${whTax.taxFactorType}"
                                            />
                                        </#list>
                                    </pago20:RetencionesDR>
                                </#if>
                                <#if appliedTxn.taxSummary.transferTaxes?has_content || appliedTxn.taxSummary.exemptTaxes?has_content>
                                    <pago20:TrasladosDR>
                                        <#list appliedTxn.taxSummary.transferTaxes as transferTax>
                                                <pago20:TrasladoDR
                                                    BaseDR="${transferTax.totalTaxBaseAmount?number?string["0.000000"]}"
                                                    ImporteDR="${transferTax.taxAmount?number?string["0.000000"]}"
                                                    ImpuestoDR="${transferTax.satTaxCode}"
                                                    TasaOCuotaDR="${transferTax.taxRate?number?string["0.000000"]}"
                                                    TipoFactorDR="${transferTax.taxFactorType}"
                                                    />
                                        </#list>
                                        <#list appliedTxn.taxSummary.exemptTaxes as exemptTaxes>
                                            <pago20:TrasladoDR
                                                BaseDR="${exemptTaxes.totalTaxBaseAmount?number?string["0.000000"]}"
                                                ImpuestoDR="${exemptTaxes.satTaxCode}"
                                                TipoFactorDR="${exemptTaxes.taxFactorType}"
                                                />
                                        </#list>
                                    </pago20:TrasladosDR>
                                </#if>
                            </pago20:ImpuestosDR>
                        </#if>
                    </pago20:DoctoRelacionado>
                </#list>
                <#if custom.accumWhTaxes?has_content || custom.accumTransferTaxes?has_content || custom.accumExemptTaxes?has_content>
                    <pago20:ImpuestosP>
                        <#if custom.accumWhTaxes?has_content>
                            <pago20:RetencionesP>
                                <#list custom.accumWhTaxes as accumWhTax>
                                    <pago20:RetencionP
                                        ImpuestoP="${accumWhTax.satTaxCode}"
                                        ImporteP="${accumWhTax.taxAmount?number?string["0.000000"]}"/>
                                </#list>
                            </pago20:RetencionesP>
                        </#if>
                        <#if custom.accumTransferTaxes?has_content || custom.accumExemptTaxes?has_content>
                            <pago20:TrasladosP>
                                <#if custom.accumExemptTaxes?has_content>
                                    <pago20:TrasladoP
                                        BaseP="${custom.accumExemptTaxes.taxSummary?number?string["0.000000"]}"
                                        ImpuestoP="${custom.accumExemptTaxes.satTaxCode}"
                                        TipoFactorP="${custom.accumExemptTaxes.taxFactorType}"
                                        />
                                </#if>
                                <#list custom.accumTransferTaxes as accumTransferTax>
                                    <pago20:TrasladoP
                                        BaseP="${accumTransferTax.taxSummary?number?string["0.000000"]}"
                                        ImpuestoP="${accumTransferTax.satTaxCode}"
                                        TipoFactorP="${accumTransferTax.taxFactorType}"
                                        TasaOCuotaP="${accumTransferTax.taxRate?number?string["0.000000"]}"
                                        ImporteP="${accumTransferTax.taxAmount?number?string["0.000000"]}"/>
                                </#list>
                            </pago20:TrasladosP>
                        </#if>

                    </pago20:ImpuestosP>
                </#if>
            </pago20:Pago>
        </pago20:Pagos>
    </cfdi:Complemento>
</cfdi:Comprobante>