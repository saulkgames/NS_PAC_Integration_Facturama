<#ftl output_format="XML">
<?xml version="1.0" encoding="utf-8"?>

<#setting locale = "en_US">

<#macro printAttrPair attr value>
	<#if value?has_content>
        ${attr}="${value}"
    </#if>
</#macro>

<#macro printNodePair node attr value>
	<#if value?has_content>
		<${node} ${attr}="${value}"/>
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
<#assign "totalAmount" = summary.subtotal - summary.totalDiscount>
<#assign paymentMethod = satCodes.paymentMethod>
<#assign paymentTerm = satCodes.paymentTerm>


<#assign byTaxObject = summary.byTaxObject>

<#assign "foreignTradeFeature" = custom.foreignTradeInfo?has_content?string('true','false')>

<cfdi:Comprobante
   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
   xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd <#if foreignTradeFeature == "true">  http://www.sat.gob.mx/ComercioExterior20 http://www.sat.gob.mx/sitio_internet/cfd/ComercioExterior20/ComercioExterior20.xsd</#if>"
   Fecha="${transaction.createddate?string.iso_nz}"
   <@printAttrPair attr="Folio" value=transaction.custbody_mx_cfdi_folio/>
   <@printAttrPair attr="Serie" value=transaction.custbody_mx_cfdi_serie/>
   <@printAttrPair attr="FormaPago" value=(paymentMethod)!""/>


   LugarExpedicion="${customCompanyInfo.zip}"
   <@printAttrPair attr="MetodoPago" value=(paymentTerm)!""/>
   Exportacion="${transaction.custbody_mx_cfdi_sat_export_type?string[0..1]?trim}"
   TipoCambio="${exchangeRate}"
   Moneda="${currencyCode}"
   SubTotal="${summary.subtotal?number?string["0.00"]}"
   TipoDeComprobante="${satCodes.proofType}"
   Total="${summary.totalAmount?number?string["0.00"]}"
   Version="4.0"
   Descuento="${summary.totalDiscount?number?abs?string["0.00"]}">
	<#if customer.custentity_mx_rfc == "XAXX010101000" && satCodes.proofType == "I">
		<cfdi:InformacionGlobal 
			Periodicidad="${custom.publicoEnGeneralInfo.recurrenceCode}"
			Meses="${custom.publicoEnGeneralInfo.monthsCode}"
			Año="${transaction.custbody_mcf_sat_year}"
		/>
	</#if>
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
       Nombre="${customCompanyInfo.custrecord_mx_sat_registered_name?string?replace("'", "&apos;")?replace("\"","&quot;")?no_esc}"
       RegimenFiscal="${satCodes.industryType}"
       Rfc="${custom.companyInfo.rfc?no_esc}"
   />
   <cfdi:Receptor
       Nombre="${customer.custentity_mx_sat_registered_name?string?replace("'", "&apos;")?replace("\"","&quot;")?no_esc}"
       Rfc="${customer.custentity_mx_rfc?no_esc}"
       UsoCFDI="${satCodes.cfdiUsage}"
       DomicilioFiscalReceptor="${custom.billaddr.customerdefaultzipcode}"
       RegimenFiscalReceptor="${satCodes.customerIndustryType}"
<#if foreignTradeFeature == "true">
       NumRegIdTrib="${customer.defaulttaxreg}"
       ResidenciaFiscal="${custom.foreignTradeInfo.satAddressFields.Receptor.satcountry}"
</#if>
   />
   <cfdi:Conceptos>
      <#list custom.items as customItem>
      <#assign "item" = transaction.item[customItem.line?number]>
      <#assign "taxes" = customItem.taxes>
      <#assign "itemSatCodes" = satCodes.items[customItem.line?number]>
      <#if customItem.type == "Group"  || customItem.type == "Kit">
         <#assign "itemSatUnitCode" = "H87">
      <#else>
         <#assign "itemSatUnitCode" = (customItem.satUnitCode)!"">
      </#if>
      <cfdi:Concepto
      <#if foreignTradeFeature == "true">NoIdentificacion="${item.item}_${item.line}"</#if>
      Cantidad="${item.quantity?string["0.000000"]}"
	  <@printAttrPair attr="ClaveProdServ" value=(itemSatCodes.itemCode)!""/>
	  <@printAttrPair attr="ClaveUnidad" value=(itemSatUnitCode)!""/>
      Descripcion="${item.description}"
      Importe="${customItem.amount?number?string["0.00"]}"
      ValorUnitario="${customItem.rate?number?string["0.00"]}"
      Descuento="${customItem.totalDiscount?number?abs?string["0.00"]}"
      ObjetoImp="${itemSatCodes.taxObject}">
      <#if itemSatCodes.taxObject == "02">
          <cfdi:Impuestos>
             <#if taxes.taxItems?has_content>
             <cfdi:Traslados>
                <#list taxes.taxItems as customTaxItem>
                <#if customTaxItem.taxFactorType == "Exento">
                <cfdi:Traslado Base="${customTaxItem.taxBaseAmount?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" TipoFactor="${customTaxItem.taxFactorType}" />
                </#if>
                <#if !customTaxItem.taxFactorType?has_content || customTaxItem.taxFactorType != "Exento">
                <cfdi:Traslado Base="${customTaxItem.taxBaseAmount?number?string["0.00"]}" Importe="${customTaxItem.taxAmount?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" TasaOCuota="${customTaxItem.taxRate?number?string["0.000000"]}" TipoFactor="${customTaxItem.taxFactorType}" />
                </#if>
                </#list>
             </cfdi:Traslados>
             </#if>
             <#if taxes.whTaxItems?has_content>
             <cfdi:Retenciones>
                <#list taxes.whTaxItems as customTaxItem>
                <cfdi:Retencion Base="${customTaxItem.taxBaseAmount?number?string["0.00"]}" Importe="${customTaxItem.taxAmount?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" TasaOCuota="${customTaxItem.taxRate?number?string["0.000000"]}" TipoFactor="${customTaxItem.taxFactorType}" />
                </#list>
             </cfdi:Retenciones>
             </#if>
          </cfdi:Impuestos>
      </#if>
	  <@printNodePair node="cfdi:InformacionAduanera" attr="NumeroPedimento" value=item.custcol_mx_txn_line_sat_cust_req_num/>
      <@printNodePair node="cfdi:CuentaPredial" attr="Numero" value=item.custcol_mx_txn_line_sat_cadastre_id/>
      <#if customItem.parts?has_content>
      <#list customItem.parts as part>
      <#assign "partItem" = transaction.item[part.line?number]>
      <#assign "partSatCodes" = satCodes.items[part.line?number]>
      <cfdi:Parte Cantidad="${partItem.quantity?string["0.0"]}" ClaveProdServ="${partSatCodes.itemCode}" Descripcion="${partItem.description}" NoIdentificacion="${part.itemId}" Importe="${part.amount?number?string["0.00"]}" ValorUnitario="${part.rate?number?string["0.00"]}"/>
      </#list>
      </#if>
      </cfdi:Concepto>
      </#list>
   </cfdi:Conceptos>
    <#if summary.includesWHTaxesWNotZeroBase == "true" || summary.includesTransferTaxesWNotZeroBase == "true" || summary.hasAtLeastOneExemptTax == "true">
        <#if summary.includesWHTaxesWNotZeroBase == "true" && summary.includesTransferTaxesWNotZeroBase == "true">
            <cfdi:Impuestos TotalImpuestosRetenidos="${byTaxObject.totalWithHoldTaxAmt?number?string["0.00"]}" TotalImpuestosTrasladados="${byTaxObject.totalNonWithHoldTaxAmt?number?string["0.00"]}">
        <#elseif summary.includesWHTaxesWNotZeroBase == "true">
            <cfdi:Impuestos TotalImpuestosRetenidos="${byTaxObject.totalWithHoldTaxAmt?number?string["0.00"]}">
        <#elseif summary.includesTransferTaxesWNotZeroBase == "true">
            <cfdi:Impuestos TotalImpuestosTrasladados="${byTaxObject.totalNonWithHoldTaxAmt?number?string["0.00"]}">
		<#else>
			<cfdi:Impuestos>
        </#if>
        <#if summary.includesWHTaxesWNotZeroBase == "true">
            <cfdi:Retenciones>
                <#list summary.whTaxesWNotZeroBase as customTaxItem>
                    <cfdi:Retencion Importe="${customTaxItem.taxAmountByTaxObject?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" />
                </#list>
            </cfdi:Retenciones>
        </#if>
        <#if summary.includesTransferTaxesWNotZeroBase == "true" || summary.hasAtLeastOneExemptTax == "true">
            <cfdi:Traslados>
                <#list summary.transferTaxesWNotZeroBase as customTaxItem>
                    <#if !customTaxItem.taxFactorType?has_content || customTaxItem.taxFactorType != "Exento">
                        <cfdi:Traslado Base="${customTaxItem.totalTaxBaseAmount?number?string["0.00"]}" Importe="${customTaxItem.taxAmountByTaxObject?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" TasaOCuota="${customTaxItem.taxRate?number?string["0.000000"]}" TipoFactor="${customTaxItem.taxFactorType}" />
                    </#if>
                </#list>
				<#list summary.exemptTaxes as customTaxItem>
                    <#if customTaxItem.taxFactorType?has_content>
                        <cfdi:Traslado Base="${customTaxItem.totalTaxBaseAmount?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" TipoFactor="${customTaxItem.taxFactorType}"/>
                    </#if>
                </#list>
            </cfdi:Traslados>
        </#if>
            </cfdi:Impuestos>
   </#if>
   <#if foreignTradeFeature == "true">
   <cfdi:Complemento>
      <cce20:ComercioExterior
              Version="2.0"
              ClaveDePedimento="A1"
              CertificadoOrigen="${transaction.custbody_mft_certificate_of_origin}"
      <#if transaction.custbody_mft_certificate_of_origin == "1" && transaction.custbody_mft_certificate_of_origin_num!=""> NumCertificadoOrigen="${transaction.custbody_mft_certificate_of_origin_num}"
   </#if> Incoterm="${custom.foreignTradeInfo.satIncoterm}"
   <#if transaction.custbody_mft_comments != ""> Observaciones="${transaction.custbody_mft_comments}"
   </#if> TipoCambioUSD="${custom.foreignTradeInfo.xRateUSD}"
   TotalUSD="${custom.foreignTradeInfo.totalUSD?number?string["0.00"]}"
   xmlns:cce20="http://www.sat.gob.mx/ComercioExterior20">
   <cce20:Emisor>
		<cce20:Domicilio
			<#if custom.foreignTradeInfo.satAddressFields.Emisor.satcountry == "MEX">
			    <@printAttrPair attr="Calle" value=custom.foreignTradeInfo.satAddressFields.Emisor.streetname/>
			    <@printAttrPair attr="NumeroExterior" value=custom.foreignTradeInfo.satAddressFields.Emisor.streetnumber/>
				<@printAttrPair attr="NumeroInterior" value=custom.foreignTradeInfo.satAddressFields.Emisor.apartment/>
				<@printAttrPair attr="Colonia" value=custom.foreignTradeInfo.satAddressFields.Emisor.colonia?left_pad(4)[0..*4]?trim/>
			    <@printAttrPair attr="Localidad" value=custom.foreignTradeInfo.satAddressFields.Emisor.city?left_pad(2)[0..*2]?trim/>
			    <@printAttrPair attr="Municipio" value=custom.foreignTradeInfo.satAddressFields.Emisor.village?left_pad(3)[0..*3]?trim/>
            <#else>
                <@printAttrPair attr="Calle" value=custom.foreignTradeInfo.satAddressFields.Emisor.address1/>
                <@printAttrPair attr="NumeroExterior" value=custom.foreignTradeInfo.satAddressFields.Emisor.streetnumber/>
				<@printAttrPair attr="NumeroInterior" value=custom.foreignTradeInfo.satAddressFields.Emisor.apartment/>
				<@printAttrPair attr="Colonia" value=custom.foreignTradeInfo.satAddressFields.Emisor.colonia/>
                <@printAttrPair attr="Localidad" value=custom.foreignTradeInfo.satAddressFields.Emisor.city/>
                <@printAttrPair attr="Municipio" value=custom.foreignTradeInfo.satAddressFields.Emisor.village/>
            </#if>
			<@printAttrPair attr="Estado" value=custom.foreignTradeInfo.satAddressFields.Emisor.satstate/>
			<@printAttrPair attr="Pais" value=custom.foreignTradeInfo.satAddressFields.Emisor.satcountry/>
			<@printAttrPair attr="CodigoPostal" value=custom.foreignTradeInfo.satAddressFields.Emisor.zip/>
		/>
	</cce20:Emisor>
	<cce20:Receptor<#if customer.custentity_mx_rfc == "XEXX010101000"> NumRegIdTrib="${customer.defaulttaxreg}"</#if>>
		<cce20:Domicilio
			<#if custom.foreignTradeInfo.satAddressFields.Receptor.satcountry == "MEX">
				<@printAttrPair attr="Calle" value=custom.foreignTradeInfo.satAddressFields.Receptor.streetname/>
				<@printAttrPair attr="NumeroExterior" value=custom.foreignTradeInfo.satAddressFields.Receptor.streetnumber/>
				<@printAttrPair attr="NumeroInterior" value=custom.foreignTradeInfo.satAddressFields.Receptor.apartment/>
				<@printAttrPair attr="Colonia" value=custom.foreignTradeInfo.satAddressFields.Receptor.colonia?left_pad(4)[0..*4]?trim/>
				<@printAttrPair attr="Localidad" value=custom.foreignTradeInfo.satAddressFields.Receptor.city?left_pad(2)[0..*2]?trim/>
				<@printAttrPair attr="Municipio" value=custom.foreignTradeInfo.satAddressFields.Receptor.village?left_pad(3)[0..*3]?trim/>
			<#else>
				<@printAttrPair attr="Calle" value=custom.foreignTradeInfo.satAddressFields.Receptor.address1/>
				<@printAttrPair attr="NumeroExterior" value=custom.foreignTradeInfo.satAddressFields.Receptor.streetnumber/>
				<@printAttrPair attr="NumeroInterior" value=custom.foreignTradeInfo.satAddressFields.Receptor.apartment/>
				<@printAttrPair attr="Colonia" value=custom.foreignTradeInfo.satAddressFields.Receptor.colonia/>
				<@printAttrPair attr="Localidad" value=custom.foreignTradeInfo.satAddressFields.Receptor.city/>
				<@printAttrPair attr="Municipio" value=custom.foreignTradeInfo.satAddressFields.Receptor.village/>
			</#if>
			<@printAttrPair attr="Estado" value=custom.foreignTradeInfo.satAddressFields.Receptor.satstate/>
			<@printAttrPair attr="Pais" value=custom.foreignTradeInfo.satAddressFields.Receptor.satcountry/>
			<@printAttrPair attr="CodigoPostal" value=custom.foreignTradeInfo.satAddressFields.Receptor.zip/>
		/>
	</cce20:Receptor>
	<#if transaction.custbody_mft_addressee?has_content && transaction.custbody_mft_addressee.entityid != transaction.entity.entityid>
		<cce20:Destinatario NumRegIdTrib="${transaction.custbody_mft_addressee.defaulttaxreg}" Nombre="${transaction.custbody_mft_addressee.entityid}">
			<cce20:Domicilio
				<#if custom.foreignTradeInfo.satAddressFields.Destinatario.satcountry == "MEX">
					<@printAttrPair attr="Calle" value=custom.foreignTradeInfo.satAddressFields.Destinatario.streetname/>
					<@printAttrPair attr="NumeroExterior" value=custom.foreignTradeInfo.satAddressFields.Destinatario.streetnumber/>
					<@printAttrPair attr="NumeroInterior" value=custom.foreignTradeInfo.satAddressFields.Destinatario.apartment/>
					<@printAttrPair attr="Colonia" value=custom.foreignTradeInfo.satAddressFields.Destinatario.colonia?left_pad(4)[0..*4]?trim/>
					<@printAttrPair attr="Localidad" value=custom.foreignTradeInfo.satAddressFields.Destinatario.city?left_pad(2)[0..*2]?trim/>
					<@printAttrPair attr="Municipio" value=custom.foreignTradeInfo.satAddressFields.Destinatario.village?left_pad(3)[0..*3]?trim/>
				<#else>
					<@printAttrPair attr="Calle" value=custom.foreignTradeInfo.satAddressFields.Destinatario.address1/>
					<@printAttrPair attr="NumeroExterior" value=custom.foreignTradeInfo.satAddressFields.Destinatario.streetnumber/>
					<@printAttrPair attr="NumeroInterior" value=custom.foreignTradeInfo.satAddressFields.Destinatario.apartment/>
					<@printAttrPair attr="Colonia" value=custom.foreignTradeInfo.satAddressFields.Destinatario.colonia/>
					<@printAttrPair attr="Localidad" value=custom.foreignTradeInfo.satAddressFields.Destinatario.city/>
					<@printAttrPair attr="Municipio" value=custom.foreignTradeInfo.satAddressFields.Destinatario.village/>
				</#if>
				<@printAttrPair attr="Estado" value=custom.foreignTradeInfo.satAddressFields.Destinatario.satstate/>
				<@printAttrPair attr="Pais" value=custom.foreignTradeInfo.satAddressFields.Destinatario.satcountry/>
				<@printAttrPair attr="CodigoPostal" value=custom.foreignTradeInfo.satAddressFields.Destinatario.zip/>
			/>
   		</cce20:Destinatario>
   </#if>
   <cce20:Mercancias>
      <#list custom.foreignTradeInfo.items as FTItem>
      <#assign "item" = transaction.item[FTItem.line?number]>
      <cce20:Mercancia
              NoIdentificacion="${item.item}_${item.line}"
      <#if FTItem.satCustomsUnitCode != "99" && FTItem.satTariffItemCode!=""> FraccionArancelaria="${FTItem.satTariffItemCode}"
   </#if><#if FTItem.satCustomsUnitCode != "" && FTItem.satCustomsUnitPrice != "" && FTItem.satCustomsQuantity != ""> CantidadAduana="${FTItem.satCustomsQuantity}"
   </#if><#if FTItem.satCustomsUnitCode != ""> UnidadAduana="${FTItem.satCustomsUnitCode?number?string["00"]}"
   </#if><#if FTItem.satCustomsUnitPrice != ""> ValorUnitarioAduana="${FTItem.satCustomsUnitPrice?number?string["0.000000"]}"
   </#if><#if FTItem.satUSDCustomsAmount != ""> ValorDolares="${FTItem.satUSDCustomsAmount?number?string["0.0000"]}"
   </#if>>
   <#if item.type != "service" && (FTItem.manufacturer != "" || FTItem.mpn != "")>
   <cce20:DescripcionesEspecificas<#if FTItem.manufacturer != ""> Marca="${FTItem.manufacturer}"</#if><#if FTItem.mpn != ""> NumeroSerie="${FTItem.mpn}"</#if> />
   </#if>
   </cce20:Mercancia>
   </#list>
   </cce20:Mercancias>
   </cce20:ComercioExterior>
   </cfdi:Complemento>
   </#if>
</cfdi:Comprobante>
