<?xml version="1.0" encoding="utf-8"?>

<#setting locale = "en_US">

<#assign "summary" = custom.summary>
<#assign "satCodes" = custom.satcodes>
<#assign "companyTaxRegNumber" = custom.companyInfo.rfc>

<#function getAttrPair attr value>
   <#if value?has_content>
    <#assign result="${attr}=\"${value}\"">
    <#return result>
  </#if>
</#function>

<#function getSatUnitCode good>
   <#list custom.items as customItem>
      <#if satCodes.items[customItem.line?number].itemCode?string == good?string>
         <#if customItem.type == "Group"  || customItem.type == "Kit">
            <#return "H87">
         <#else>
            <#return (customItem.satUnitCode)!"">
         </#if>
      </#if>
   </#list>
   <#return "">
</#function>

<#function getNodePair node attr value>
   <#if value?has_content>
    <#assign result="<${node} ${attr}=\"${value}\" />">
    <#return result>
  </#if>
</#function>

<#if custom.multiCurrencyFeature == "true">
<#assign "currencyCode" = transaction.currencycode>
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

<#assign "foreignTradeFeature" = custom.foreignTradeInfo?has_content?string('true','false')>
<#assign "cartaPorteFeature" = custom.cartaPorteInfo?has_content?string('true','false')>

<#-- The item fulfillment comes from a sales order -->
<#if customer??>
    <#assign isFromSalesOrder = "true">
    <#if foreignTradeFeature == "true">
        <#assign receptorSatAddressFields = custom.foreignTradeInfo.satAddressFields.Receptor>
    </#if>
    <#if customer.isperson == "T">
        <#assign customerName = customer.firstname + ' ' + customer.lastname>
    <#else>
        <#assign "customerName" = customer.companyname>
    </#if>
    <#assign "receptorRfc" = customer.custentity_mx_rfc>
<#-- The item fulfillment comes from a transfer order or from an intercompany transfer order -->
<#else>
    <#assign isFromSalesOrder = "false">
    <#if foreignTradeFeature == "true">
        <#assign receptorSatAddressFields = custom.foreignTradeInfo.satAddressFields.Emisor>
    </#if>
    <#assign "customerName" = customCompanyInfo.legalname>
    <#assign "receptorRfc" = companyTaxRegNumber>
</#if>

<#if currencyCode != "MXN">
<#assign exchangeRateVal = exchangeRate>
</#if>
<cfdi:Comprobante
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" <#if cartaPorteFeature == "true">xmlns:cartaporte="http://www.sat.gob.mx/CartaPorte"</#if>
    xmlns:cfdi="http://www.sat.gob.mx/cfd/3" xsi:schemaLocation="http://www.sat.gob.mx/cfd/3 http://www.sat.gob.mx/sitio_internet/cfd/3/cfdv33.xsd <#if foreignTradeFeature == "true">http://www.sat.gob.mx/ComercioExterior11 http://www.sat.gob.mx/sitio_internet/cfd/ComercioExterior11/ComercioExterior11.xsd</#if> <#if cartaPorteFeature == "true">http://www.sat.gob.mx/CartaPorte http://www.sat.gob.mx/sitio_internet/cfd/CartaPorte/CartaPorte.xsd</#if>"
    Fecha="${transaction.createddate?string.iso_nz}"
    ${getAttrPair("Folio",transaction.custbody_mx_cfdi_folio)}
    ${getAttrPair("Serie",transaction.custbody_mx_cfdi_serie)}
    LugarExpedicion="${customCompanyInfo.zip}"
    Moneda="<#if cartaPorteFeature == "true">XXX<#else>${currencyCode}</#if>" ${getAttrPair("TipoCambio",(exchangeRateVal)!"")!""} SubTotal="<#if cartaPorteFeature == "true">0<#else>0.00</#if>" TipoDeComprobante="${satCodes.proofType}" Total="<#if cartaPorteFeature == "true">0<#else>0.00</#if>" Version="3.3">
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
    <cfdi:Receptor
        Nombre="${customerName}"
        Rfc="${receptorRfc}"
        UsoCFDI="${satCodes.cfdiUsage}"
        <#if foreignTradeFeature == "true" && isFromSalesOrder == "true"> NumRegIdTrib="${customer.defaulttaxreg}" ResidenciaFiscal="${custom.foreignTradeInfo.satAddressFields.Receptor.satcountry}"</#if> />
    <cfdi:Conceptos>
       <#list custom.items as customItem>
       <#assign "item" = transaction.item[customItem.line?number]>
        <#assign "itemSatCodes" = satCodes.items[customItem.line?number]>
        <#if customItem.type == "Group" || customItem.type == "Kit">
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
           ValorUnitario="0.00">
		   <#if foreignTradeFeature == "false" && (cartaPorteFeature == "false" || (cartaPorteFeature == "true" && custom.cartaPorteInfo.internationalTransport == "Sí"))>${getNodePair("cfdi:InformacionAduanera", "NumeroPedimento" ,item.custcol_mx_txn_line_sat_cust_req_num)}</#if>
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

    <#if foreignTradeFeature == "true">
    <cfdi:Complemento>
        <cce11:ComercioExterior Version="1.1" TipoOperacion="2" MotivoTraslado="${custom.foreignTradeInfo.satReasonForTransfer}" ClaveDePedimento="A1" CertificadoOrigen="${transaction.custbody_mft_certificate_of_origin}"     <#if transaction.custbody_mft_certificate_of_origin == "1" && transaction.custbody_mft_certificate_of_origin_num!=""> NumCertificadoOrigen="${transaction.custbody_mft_certificate_of_origin_num}"
        </#if> Incoterm="${custom.foreignTradeInfo.satIncoterm}" Subdivision="0" <#if transaction.custbody_mft_comments != ""> Observaciones="${transaction.custbody_mft_comments}"
        </#if> TipoCambioUSD="${custom.foreignTradeInfo.xRateUSD}" TotalUSD="${custom.foreignTradeInfo.totalUSD?number?string["0.00"]}"
        xmlns:cce11="http://www.sat.gob.mx/ComercioExterior11"
        >
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
				    <#if receptorSatAddressFields.satcountry == "MEX">${getAttrPair("Calle",receptorSatAddressFields.streetname)}<#else>${getAttrPair("Calle",receptorSatAddressFields.address1)}</#if>
                    ${getAttrPair("NumeroExterior",receptorSatAddressFields.streetnumber)}
                    ${getAttrPair("NumeroInterior",receptorSatAddressFields.apartment)}
                    <#if receptorSatAddressFields.satcountry == "MEX">${getAttrPair("Colonia", receptorSatAddressFields.colonia?left_pad(4)[0..*4]?trim)}<#else>${getAttrPair("Colonia", receptorSatAddressFields.colonia)}</#if>
                    <#if receptorSatAddressFields.satcountry == "MEX">${getAttrPair("Localidad",receptorSatAddressFields.city?left_pad(2)[0..*2]?trim)}<#else>${getAttrPair("Localidad",receptorSatAddressFields.city)}</#if>
                    <#if receptorSatAddressFields.satcountry == "MEX">${getAttrPair("Municipio",receptorSatAddressFields.village?left_pad(3)[0..*3]?trim)}<#else>${getAttrPair("Municipio",receptorSatAddressFields.village)}</#if>
                    ${getAttrPair("Estado",receptorSatAddressFields.satstate)}
                    ${getAttrPair("Pais",receptorSatAddressFields.satcountry)}
                    ${getAttrPair("CodigoPostal",receptorSatAddressFields.zip)}/>
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
            </#if><#if FTItem.satUSDCustomsAmount != ""> ValorDolares="${FTItem.satUSDCustomsAmount?number?string["0.00"]}"
            </#if><#if FTItem.satCustomsUnitCode != ""> UnidadAduana="${FTItem.satCustomsUnitCode?number?string["00"]}"
            </#if><#if FTItem.satCustomsUnitPrice != ""> ValorUnitarioAduana="${FTItem.satCustomsUnitPrice?number?string["0.00"]}"
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

<#if cartaPorteFeature == "true">
	<cfdi:Complemento>
		<cartaporte:CartaPorte
			Version="1.0"
			TranspInternac = "${custom.cartaPorteInfo.internationalTransport}"
			<#if custom.cartaPorteInfo.internationalTransport == "Sí"> EntradaSalidaMerc = "${custom.cartaPorteInfo.entryOrExitOfGoods}"</#if>
			<#if custom.cartaPorteInfo.internationalTransport == "Sí"> ViaEntradaSalida = "01"</#if>
			<#if custom.cartaPorteInfo.transportModeCode == "01 - Autotransporte Federal" || custom.cartaPorteInfo.transportModeCode == "04"> TotalDistRec = "${custom.cartaPorteInfo.totalDistanceTraveledInKm}"</#if>>
			<cartaporte:Ubicaciones>
				<#list custom.cartaPorteInfo.routes as CPRoute>
					<cartaporte:Ubicacion
						<#if (custom.cartaPorteInfo.transportModeCode == "01 - Autotransporte Federal" || custom.cartaPorteInfo.transportModeCode == "04") && CPRoute.route.isOrigin == 'false'> DistanciaRecorrida = "${CPRoute.distanceTraveledInKm}"</#if>>
					<#if CPRoute.route.isOrigin == "true">
						<cartaporte:Origen
						<#if CPRoute.route.id != ''  && (custom.cartaPorteInfo.routes?size gt 2) >IDOrigen = "${CPRoute.route.id}"</#if>
						<#if companyTaxRegNumber == '' || companyTaxRegNumber == 'XEXX010101000'> NumRegIdTrib = "${companyTaxRegNumber}"</#if>
						<#if companyTaxRegNumber == '' || companyTaxRegNumber == 'XEXX010101000'> ResidenciaFiscal = "${CPRoute.country}"</#if>
						FechaHoraSalida = "${CPRoute.route.dateTime?remove_ending(".000Z")}"/>
					</#if>
					<#if CPRoute.route.isOrigin == 'false'>
						<cartaporte:Destino
						<#if CPRoute.route.id != ''  && (custom.cartaPorteInfo.routes?size gt 2) >IDDestino = "${CPRoute.route.id}"</#if>
						<#if companyTaxRegNumber != '' && companyTaxRegNumber != 'XEXX010101000' && companyTaxRegNumber != receptorRfc> ${getAttrPair("RFCDestinatario",receptorRfc)}</#if>
						<#if companyTaxRegNumber == '' || companyTaxRegNumber == 'XEXX010101000'> NumRegIdTrib = "${receptorRfc}"</#if>
						<#if companyTaxRegNumber == '' || companyTaxRegNumber == 'XEXX010101000'> ${getAttrPair("ResidenciaFiscal", CPRoute.country)}</#if>
						FechaHoraProgLlegada = "${CPRoute.route.dateTime?remove_ending(".000Z")}"/>
					</#if>
					<#if custom.cartaPorteInfo.transportModeCode != "04">
						<cartaporte:Domicilio
							Calle = "${CPRoute.address.streetName}"
							<#if CPRoute.address.streetNumber != "">
								NumeroExterior = "${CPRoute.address.streetNumber}"
							</#if>
							<#if CPRoute.address.fieldFloor != "">
								NumeroInterior = "${CPRoute.address.fieldFloor}"
							</#if>
							<#if CPRoute.address.colonia.code != "">
								Colonia = "${CPRoute.address.colonia.code}"
							</#if>
							<#if CPRoute.address.city.code != "">
								Localidad = "${CPRoute.address.city.code}"
							</#if>
							<#if CPRoute.address.village.code != "">
								Municipio = "${CPRoute.address.village.code}"
							</#if>
							Estado = "${CPRoute.address.state.code}"
							CodigoPostal = "${CPRoute.address.zipCode}"
							Pais = "${CPRoute.address.country.code}"
							/>
					</#if>
					</cartaporte:Ubicacion>
				</#list>
			</cartaporte:Ubicaciones>
			<cartaporte:Mercancias NumTotalMercancias="${custom.cartaPorteInfo.totalDistinctGoods}">
				<#list custom.cartaPorteInfo.goods.good as CPMercancia>
					<cartaporte:Mercancia
						<#if CPMercancia.transportedGoods??>
							BienesTransp="${CPMercancia.transportedGoods}"
						</#if>
						<#if CPMercancia.quantity??>
							Cantidad="${CPMercancia.quantity}"
						</#if>
						<#if getSatUnitCode(CPMercancia.transportedGoods) != "">
							ClaveUnidad="${getSatUnitCode(CPMercancia.transportedGoods)}"
						</#if>
						<#if CPMercancia.dangerousGood != "">
							MaterialPeligroso="<#if CPMercancia.dangerousGood == "true">Sí<#else>No</#if>"
						</#if>
						<#if CPMercancia.dangerousGood == "true">
							<#if CPMercancia.dangerousGoodCode != "">
								CveMaterialPeligroso="${CPMercancia.dangerousGoodCode}"
							</#if>
							<#if CPMercancia.packagingType != "">
								Embalaje="${CPMercancia.packagingType}"
							</#if>
							<#if CPMercancia.packagingDescription != "">
								DescripEmbalaje="${CPMercancia.packagingDescription}"
							</#if>
						</#if>
						<#if CPMercancia.weightInKg??>
							PesoEnKg="${CPMercancia.weightInKg}"
						</#if>
						<#if custom.cartaPorteInfo.internationalTransport == "Sí">
							FraccionArancelaria="${CPMercancia.tariffItemCode}"
						</#if>
						<#if custom.cartaPorteInfo.internationalTransport == "Sí" && custom.cartaPorteInfo.entryOrExitOfGoods == "Salida"> <#-- TODO: this check is not complete yet. Pending to check if "exportación es considerada definitiva (De tipo A1)" -->
							<#if CPMercancia.foreignTradeUUID != "">
								UUIDComercioExt="${CPMercancia.foreignTradeUUID}"
							</#if>
						</#if>>
						<#if (custom.cartaPorteInfo.segments?size gt 1)>
							<#list custom.cartaPorteInfo.segments as Segment>
								<cartaporte:CantidadTransporta
									<#if CPMercancia.quantity??>
										Cantidad="${CPMercancia.quantity}"
									</#if>
									<#if Segment.originID != "">
										IDOrigen="${Segment.originID}"
									</#if>
									<#if Segment.destinationID != "">
										IDDestino="${Segment.destinationID}"
									</#if>
								/>
							</#list>
						</#if>
					</cartaporte:Mercancia>
				</#list>
				<cartaporte:AutotransporteFederal
					<#if custom.cartaPorteInfo.goods.fleet.SCTPermit.code != "">
						PermSCT="${custom.cartaPorteInfo.goods.fleet.SCTPermit.code}"
					</#if>
					<#if custom.cartaPorteInfo.goods.fleet.SCTPermitNumber != "">
						NumPermisoSCT="${custom.cartaPorteInfo.goods.fleet.SCTPermitNumber}"
					</#if>
					<#if custom.cartaPorteInfo.goods.fleet.insuranceCompanyName != "">
						NombreAseg="${custom.cartaPorteInfo.goods.fleet.insuranceCompanyName}"
					</#if>
					<#if custom.cartaPorteInfo.goods.fleet.insurancePolicyNumber != "">
						NumPolizaSeguro="${custom.cartaPorteInfo.goods.fleet.insurancePolicyNumber}"
					</#if>
					>
					<cartaporte:IdentificacionVehicular
						<#if custom.cartaPorteInfo.goods.fleet.vehicleType.code != "">
							ConfigVehicular="${custom.cartaPorteInfo.goods.fleet.vehicleType.code}"
						</#if>
						<#if custom.cartaPorteInfo.goods.fleet.plate != "">
							PlacaVM="${custom.cartaPorteInfo.goods.fleet.plate}"
						</#if>
						<#if custom.cartaPorteInfo.goods.fleet.modelYear??>
							AnioModeloVM="${custom.cartaPorteInfo.goods.fleet.modelYear}"
						</#if>
					/>
					<#if custom.cartaPorteInfo.goods.fleet.trailerType.code != "" || custom.cartaPorteInfo.goods.fleet.trailerPlate != "">
					<cartaporte:Remolques>
						<cartaporte:Remolque
							<#if custom.cartaPorteInfo.goods.fleet.trailerType.code != "">
								SubTipoRem="${custom.cartaPorteInfo.goods.fleet.trailerType.code}"
							</#if>
							<#if custom.cartaPorteInfo.goods.fleet.trailerPlate != "">
								Placa="${custom.cartaPorteInfo.goods.fleet.trailerPlate}"
							</#if>
						/>
					</cartaporte:Remolques>
					</#if>
				</cartaporte:AutotransporteFederal>
			</cartaporte:Mercancias>
			<cartaporte:FiguraTransporte CveTransporte="01">
				<cartaporte:Operadores>
					<#list custom.cartaPorteInfo.operators as CPOperator>
					<cartaporte:Operador <#if CPOperator.isMexican == "true">RFCOperador="${CPOperator.operatorRfc}"</#if> NumLicencia="${CPOperator.licenseNumber}" <#if CPOperator.operatorName != "">NombreOperador="${CPOperator.operatorName}"</#if> <#if CPOperator.isMexican == "false">NumRegIdTribOperador="${CPOperator.operatorRfc}" ResidenciaFiscalOperador="${CPOperator.address.country.code}"</#if>>
					<cartaporte:Domicilio
						Calle = "${CPOperator.address.streetName}"
						<#if CPOperator.address.streetNumber != "">
							NumeroExterior = "${CPOperator.address.streetNumber}"
						</#if>
						<#if CPOperator.address.fieldFloor != "">
							NumeroInterior = "${CPOperator.address.fieldFloor}"
						</#if>
						<#if CPOperator.address.colonia.code != "">
							Colonia = "${CPOperator.address.colonia.code}"
						</#if>
						<#if CPOperator.address.city.code != "">
							Localidad = "${CPOperator.address.city.code}"
						</#if>
						<#if CPOperator.address.village.code != "">
							Municipio = "${CPOperator.address.village.code}"
						</#if>
						Estado = "${CPOperator.address.state.code}"
						CodigoPostal = "${CPOperator.address.zipCode}"
						Pais = "${CPOperator.address.country.code}"
					/>
					</cartaporte:Operador>
				</#list>
				</cartaporte:Operadores>
			</cartaporte:FiguraTransporte>
		</cartaporte:CartaPorte>
	</cfdi:Complemento>
</#if>

</cfdi:Comprobante>
