<?xml version="1.0" encoding="utf-8"?>

<#setting locale = "en_US">

<#function getAttrPair attr value>
   <#if value?has_content>
    <#assign result="${attr}=\"${value}\"">
    <#return result>
  </#if>
</#function>

<#function getNodePair node attr value>
   <#if value?has_content>
    <#assign result="<${node} ${attr}=\"${value}\" />">
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
<#assign "totalAmount" = summary.subtotal - summary.totalDiscount>
<#assign "companyTaxRegNumber" = custom.companyInfo.rfc>
<#assign paymentMethod = satCodes.paymentMethod>
<#assign paymentTerm = satCodes.paymentTerm>

<#assign "foreignTradeFeature" = custom.foreignTradeInfo?has_content?string('true','false')>

<#if custom.relatedCfdis.types[0] == "07">
  <#assign paymentTerm = "PUE">
</#if>
<cfdi:Comprobante
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:cfdi="http://www.sat.gob.mx/cfd/3"
    xsi:schemaLocation="http://www.sat.gob.mx/cfd/3 http://www.sat.gob.mx/sitio_internet/cfd/3/cfdv33.xsd <#if foreignTradeFeature == "true">  http://www.sat.gob.mx/ComercioExterior11 http://www.sat.gob.mx/sitio_internet/cfd/ComercioExterior11/ComercioExterior11.xsd</#if>"
    Fecha="${transaction.createddate?string.iso_nz}"
    ${getAttrPair("Folio",transaction.custbody_mx_cfdi_folio)}
    ${getAttrPair("Serie",transaction.custbody_mx_cfdi_serie)}
    ${getAttrPair("FormaPago",(paymentMethod)!"")!""}
    LugarExpedicion="${customCompanyInfo.zip}"
    ${getAttrPair("MetodoPago",(paymentTerm)!"")!""}
    TipoCambio="${exchangeRate}"
    Moneda="${currencyCode}"
    SubTotal="${summary.subtotal?number?string["0.00"]}"
    TipoDeComprobante="${satCodes.proofType}"
    Total="${summary.totalAmount?number?string["0.00"]}"
    Version="3.3"
    Descuento="${summary.totalDiscount?number?abs?string["0.00"]}">

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
    <cfdi:Receptor Nombre="${customerName}" Rfc="${customer.custentity_mx_rfc}" UsoCFDI="${satCodes.cfdiUsage}"<#if foreignTradeFeature == "true"> NumRegIdTrib="${customer.defaulttaxreg}" ResidenciaFiscal="${custom.foreignTradeInfo.satAddressFields.Receptor.satcountry}"</#if> />
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
        <#if foreignTradeFeature == "true">NoIdentificacion="${item.item}"</#if>
            Cantidad="${item.quantity?string["0.000000"]}"
            ${getAttrPair("ClaveProdServ",(itemSatCodes.itemCode)!"")!""}
            ${getAttrPair("ClaveUnidad",itemSatUnitCode)!""}
	            Descripcion=<#outputformat "XML">"${item.description}"</#outputformat>
	            Importe="${customItem.amount?number?string["0.00"]}"
	            ValorUnitario="${customItem.rate?number?string["0.00"]}"
	            Descuento="${customItem.totalDiscount?number?abs?string["0.00"]}">
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
	        ${getNodePair("cfdi:InformacionAduanera", "NumeroPedimento" ,item.custcol_mx_txn_line_sat_cust_req_num)}
	        ${getNodePair("cfdi:CuentaPredial", "Numero" ,item.custcol_mx_txn_line_sat_cadastre_id)}
	        <#if customItem.parts?has_content>
	        <#list customItem.parts as part>
	        <#assign "partItem" = transaction.item[part.line?number]>
	        <#assign "partSatCodes" = satCodes.items[part.line?number]>
	        <cfdi:Parte Cantidad="${partItem.quantity?string["0.0"]}" ClaveProdServ="${partSatCodes.itemCode}" Descripcion=<#outputformat "XML">"${partItem.description}"</#outputformat> Importe="${part.amount?number?string["0.00"]}" ValorUnitario="${part.rate?number?string["0.00"]}"/>
	        </#list>
	        </#if>
		</cfdi:Concepto>
	</#list>
	</cfdi:Conceptos>
	<#if summary.includeWithHolding == "true" || summary.includeTransfers == "true">
	<#if summary.includeWithHolding == "true" && summary.includeTransfers == "true">
	<cfdi:Impuestos TotalImpuestosRetenidos="${summary.totalWithHoldTaxAmt?number?string["0.00"]}" TotalImpuestosTrasladados="${summary.totalNonWithHoldTaxAmt?number?string["0.00"]}">
	<#elseif summary.includeWithHolding == "true">
	<cfdi:Impuestos TotalImpuestosRetenidos="${summary.totalWithHoldTaxAmt?number?string["0.00"]}">
	<#elseif summary.includeTransfers == "true">
	<cfdi:Impuestos TotalImpuestosTrasladados="${summary.totalNonWithHoldTaxAmt?number?string["0.00"]}">
	</#if>
		<#if summary.includeWithHolding == "true">
		<cfdi:Retenciones>
			<#list summary.whTaxes as customTaxItem>
			<cfdi:Retencion Importe="${customTaxItem.taxAmount?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" />
			</#list>
		</cfdi:Retenciones>
		</#if>
		<#if summary.includeTransfers == "true">
		<cfdi:Traslados>
			<#list summary.transferTaxes as customTaxItem>
			<#if !customTaxItem.taxFactorType?has_content || customTaxItem.taxFactorType != "Exento">
			<cfdi:Traslado Importe="${customTaxItem.taxAmount?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" TasaOCuota="${customTaxItem.taxRate?number?string["0.000000"]}" TipoFactor="${customTaxItem.taxFactorType}" />
			</#if>
			</#list>
		</cfdi:Traslados>
		</#if>
		<#if summary.includeWithHolding == "true" || summary.includeTransfers == "true">
	</cfdi:Impuestos>
	</#if>
	</#if>
	<#if foreignTradeFeature == "true">
	<cfdi:Complemento>
		<cce11:ComercioExterior
			Version="1.1"
			TipoOperacion="2"
			ClaveDePedimento="A1"
			CertificadoOrigen="${transaction.custbody_mft_certificate_of_origin}"
			<#if transaction.custbody_mft_certificate_of_origin == "1" && transaction.custbody_mft_certificate_of_origin_num!=""> NumCertificadoOrigen="${transaction.custbody_mft_certificate_of_origin_num}"
			</#if> Incoterm="${custom.foreignTradeInfo.satIncoterm}" Subdivision="0"
			<#if transaction.custbody_mft_comments != ""> Observaciones="${transaction.custbody_mft_comments}"
			</#if> TipoCambioUSD="${custom.foreignTradeInfo.xRateUSD}"
			TotalUSD="${custom.foreignTradeInfo.totalUSD?number?string["0.00"]}"
			xmlns:cce11="http://www.sat.gob.mx/ComercioExterior11">
			<cce11:Emisor>
				<cce11:Domicilio
					<#if custom.foreignTradeInfo.satAddressFields.Emisor.satcountry == "MEX">${getAttrPair("Calle",custom.foreignTradeInfo.satAddressFields.Emisor.streetname)}<#else>${getAttrPair("Calle",custom.foreignTradeInfo.satAddressFields.Emisor.address1)}</#if>
					${getAttrPair("NumeroExterior",custom.foreignTradeInfo.satAddressFields.Emisor.streetnumber)}
					${getAttrPair("NumeroInterior",custom.foreignTradeInfo.satAddressFields.Emisor.apartment)}
					<#if custom.foreignTradeInfo.satAddressFields.Emisor.satcountry == "MEX">${getAttrPair("Colonia", custom.foreignTradeInfo.satAddressFields.Emisor.colonia?left_pad(4)[0..*4]?trim)}<#else>${getAttrPair("Colonia", custom.foreignTradeInfo.satAddressFields.Emisor.colonia)}</#if>
					<#if custom.foreignTradeInfo.satAddressFields.Emisor.satcountry == "MEX">${getAttrPair("Localidad",custom.foreignTradeInfo.satAddressFields.Emisor.city?left_pad(2)[0..*2]?trim)}<#else>${getAttrPair("Localidad",custom.foreignTradeInfo.satAddressFields.Emisor.city)}</#if>
					<#if custom.foreignTradeInfo.satAddressFields.Emisor.satcountry == "MEX">${getAttrPair("Municipio",custom.foreignTradeInfo.satAddressFields.Emisor.village?left_pad(3)[0..*3]?trim)}<#else>${getAttrPair("Municipio",custom.foreignTradeInfo.satAddressFields.Emisor.village)}</#if>
					${getAttrPair("Estado",custom.foreignTradeInfo.satAddressFields.Emisor.satstate)}
					${getAttrPair("Pais",custom.foreignTradeInfo.satAddressFields.Emisor.satcountry)}
					${getAttrPair("CodigoPostal",custom.foreignTradeInfo.satAddressFields.Emisor.zip)}/>
			</cce11:Emisor>
			<cce11:Receptor>
				<cce11:Domicilio
					<#if custom.foreignTradeInfo.satAddressFields.Receptor.satcountry == "MEX">${getAttrPair("Calle",custom.foreignTradeInfo.satAddressFields.Receptor.streetname)}<#else>${getAttrPair("Calle",custom.foreignTradeInfo.satAddressFields.Receptor.address1)}</#if>
					${getAttrPair("NumeroExterior",custom.foreignTradeInfo.satAddressFields.Receptor.streetnumber)}
					${getAttrPair("NumeroInterior",custom.foreignTradeInfo.satAddressFields.Receptor.apartment)}
					<#if custom.foreignTradeInfo.satAddressFields.Receptor.satcountry == "MEX">${getAttrPair("Colonia", custom.foreignTradeInfo.satAddressFields.Receptor.colonia?left_pad(4)[0..*4]?trim)}<#else>${getAttrPair("Colonia", custom.foreignTradeInfo.satAddressFields.Receptor.colonia)}</#if>
					<#if custom.foreignTradeInfo.satAddressFields.Receptor.satcountry == "MEX">${getAttrPair("Localidad",custom.foreignTradeInfo.satAddressFields.Receptor.city?left_pad(2)[0..*2]?trim)}<#else>${getAttrPair("Localidad",custom.foreignTradeInfo.satAddressFields.Receptor.city)}</#if>
					<#if custom.foreignTradeInfo.satAddressFields.Receptor.satcountry == "MEX">${getAttrPair("Municipio",custom.foreignTradeInfo.satAddressFields.Receptor.village?left_pad(3)[0..*3]?trim)}<#else>${getAttrPair("Municipio",custom.foreignTradeInfo.satAddressFields.Receptor.village)}</#if>
					${getAttrPair("Estado",custom.foreignTradeInfo.satAddressFields.Receptor.satstate)}
					${getAttrPair("Pais",custom.foreignTradeInfo.satAddressFields.Receptor.satcountry)}
					${getAttrPair("CodigoPostal",custom.foreignTradeInfo.satAddressFields.Receptor.zip)}/>
			</cce11:Receptor>
			<#if transaction.custbody_mft_addressee?has_content && transaction.custbody_mft_addressee.entityid != transaction.entity.entityid>
			<cce11:Destinatario NumRegIdTrib="${transaction.custbody_mft_addressee.defaulttaxreg}" Nombre="${transaction.custbody_mft_addressee.entityid}">
				<cce11:Domicilio
					<#if custom.foreignTradeInfo.satAddressFields.Destinatario.satcountry == "MEX">${getAttrPair("Calle",custom.foreignTradeInfo.satAddressFields.Destinatario.streetname)}<#else>${getAttrPair("Calle",custom.foreignTradeInfo.satAddressFields.Destinatario.address1)}</#if>
					${getAttrPair("NumeroExterior",custom.foreignTradeInfo.satAddressFields.Destinatario.streetnumber)}
					${getAttrPair("NumeroInterior",custom.foreignTradeInfo.satAddressFields.Destinatario.apartment)}
					<#if custom.foreignTradeInfo.satAddressFields.Destinatario.satcountry == "MEX">${getAttrPair("Colonia", custom.foreignTradeInfo.satAddressFields.Destinatario.colonia?left_pad(4)[0..*4]?trim)}<#else>${getAttrPair("Colonia", custom.foreignTradeInfo.satAddressFields.Destinatario.colonia)}</#if>
					<#if custom.foreignTradeInfo.satAddressFields.Destinatario.satcountry == "MEX">${getAttrPair("Localidad",custom.foreignTradeInfo.satAddressFields.Destinatario.city?left_pad(2)[0..*2]?trim)}<#else>${getAttrPair("Localidad",custom.foreignTradeInfo.satAddressFields.Destinatario.city)}</#if>
					<#if custom.foreignTradeInfo.satAddressFields.Destinatario.satcountry == "MEX">${getAttrPair("Municipio",custom.foreignTradeInfo.satAddressFields.Destinatario.village?left_pad(3)[0..*3]?trim)}<#else>${getAttrPair("Municipio",custom.foreignTradeInfo.satAddressFields.Destinatario.village)}</#if>
					${getAttrPair("Estado",custom.foreignTradeInfo.satAddressFields.Destinatario.satstate)}
					${getAttrPair("Pais",custom.foreignTradeInfo.satAddressFields.Destinatario.satcountry)}
					${getAttrPair("CodigoPostal",custom.foreignTradeInfo.satAddressFields.Destinatario.zip)}/>
			</cce11:Destinatario>
			</#if>
			<cce11:Mercancias>
				<#list custom.foreignTradeInfo.items as FTItem>
				<#assign "item" = transaction.item[FTItem.line?number]>
				<cce11:Mercancia
					NoIdentificacion="${item.item}"
					<#if FTItem.satCustomsUnitCode != "99" && FTItem.satTariffItemCode!=""> FraccionArancelaria="${FTItem.satTariffItemCode}"
					</#if><#if FTItem.satCustomsUnitCode != "" && FTItem.satCustomsUnitPrice != "" && FTItem.satCustomsQuantity != ""> CantidadAduana="${FTItem.satCustomsQuantity}"
					</#if><#if FTItem.satCustomsUnitCode != ""> UnidadAduana="${FTItem.satCustomsUnitCode?number?string["00"]}"
					</#if><#if FTItem.satCustomsUnitPrice != ""> ValorUnitarioAduana="${FTItem.satCustomsUnitPrice?number?string["0.00"]}"
					</#if><#if FTItem.satUSDCustomsAmount != ""> ValorDolares="${FTItem.satUSDCustomsAmount?number?string["0.00"]}"
					</#if>>
					<#if item.type != "service" && (FTItem.manufacturer != "" || FTItem.mpn != "")>
					<cce11:DescripcionesEspecificas<#if FTItem.manufacturer != ""> Marca="${FTItem.manufacturer}"</#if><#if FTItem.mpn != ""> NumeroSerie="${FTItem.mpn}"</#if> />
					</#if>
				</cce11:Mercancia>
			</#list>
			</cce11:Mercancias>
		</cce11:ComercioExterior>
	</cfdi:Complemento>
	</#if>
</cfdi:Comprobante>
