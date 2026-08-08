<#ftl output_format="XML">
<?xml version="1.0" encoding="UTF-8"?>

<#setting locale = "en_US">

<#assign "summary" = custom.summary>
<#assign "satCodes" = custom.satcodes>

<#macro printAttrPair attr value>
    <#if value?has_content>
        ${attr}="${value}"
    </#if>
</#macro>

<#function getSatUnitCode good>
   <#list custom.items as customItem>
    <#if satCodes.items[customItem.line?number].itemCode == good>
        <#if customItem.type == "Group"  || customItem.type == "Kit">
          <#return "H87">
        <#else>
          <#return (customItem.satUnitCode)!"">
        </#if>
    </#if>
   </#list>
   <#return "">
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

<#assign "companyTaxRegNumber" = custom.companyInfo.rfc>
<#assign companySatRegName = customCompanyInfo.custrecord_mx_sat_registered_name>

<#assign "foreignTradeFeature" = custom.foreignTradeInfo?has_content?string('true','false')>
<#assign "cartaPorteFeature" = custom.cartaPorteInfo?has_content?string('true','false')>

<#-- The item fulfillment comes from a sales order -->
<#if customer??>
    <#assign isFromSalesOrder = "true">
    <#if foreignTradeFeature == "true">
        <#assign receptorSatAddressFields = custom.foreignTradeInfo.satAddressFields.Receptor>
    </#if>
    <#assign "nombreReceptor" = customer.custentity_mx_sat_registered_name>
    <#assign "receptorRfc" = customer.custentity_mx_rfc>
<#-- The item fulfillment comes from a transfer order or from an intercompany transfer order -->
<#else>
    <#assign isFromSalesOrder = "false">
    <#if foreignTradeFeature == "true">
        <#assign receptorSatAddressFields = custom.foreignTradeInfo.satAddressFields.Emisor>
    </#if>
    <#assign "nombreReceptor" = customCompanyInfo.custrecord_mx_sat_registered_name?string>
    <#assign "receptorRfc" = companyTaxRegNumber>
</#if>

<#if isFromSalesOrder != "true" || customer.custentity_mx_rfc == "XAXX010101000" || customer.custentity_mx_rfc == "XEXX010101000" || customer.custentity_mx_rfc == "">
    <#assign domicilioFiscalReceptor = customCompanyInfo.zip>
<#else>
    <#assign domicilioFiscalReceptor = custom.billaddr.customerdefaultzipcode>
</#if>

<#if isFromSalesOrder = "true">
    <#assign regimenFiscalReceptor = customer.custentity_mx_sat_industry_type[0..2]>
<#else>
    <#assign regimenFiscalReceptor = custom.industryTypeFromTransfOrder.code>
</#if>

<#if cartaPorteFeature = "true">
    <#assign receptorRfc = companyTaxRegNumber>
    <#assign domicilioFiscalReceptor = customCompanyInfo.zip>
    <#assign nombreReceptor = customCompanyInfo.custrecord_mx_sat_registered_name?string>
    <#assign regimenFiscalReceptor = satCodes.industryType>
</#if>

<fx:FactDocMX
    xmlns:fx="http://www.fact.com.mx/schema/fx"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.fact.com.mx/schema/fx http://www.mysuitemex.com/fact/schema/fx_2010_g.xsd">
    <fx:Version>8</fx:Version>
    <fx:Identificacion>
        <fx:CdgPaisEmisor>MX</fx:CdgPaisEmisor>
        <fx:TipoDeComprobante>TRASLADO</fx:TipoDeComprobante>
        <fx:RFCEmisor>${companyTaxRegNumber?no_esc}</fx:RFCEmisor>
        <fx:RazonSocialEmisor>${companySatRegName?replace("'", "&apos;")?replace("\"","&quot;")?no_esc}</fx:RazonSocialEmisor>
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
        <fx:Exportacion>${transaction.custbody_mx_cfdi_sat_export_type[0..1]}</fx:Exportacion>
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
        <#--to be simplified when MXL provides more complete data-->
        <#if foreignTradeFeature == "true" && isFromSalesOrder == "true">
            <fx:CdgPaisReceptor>${custom.foreignTradeInfo.satAddressFields.Receptor.nscountry}</fx:CdgPaisReceptor>
        <#else>
            <fx:CdgPaisReceptor>MX</fx:CdgPaisReceptor>
        </#if>
        <fx:RFCReceptor>${receptorRfc?no_esc}</fx:RFCReceptor>
        <#if foreignTradeFeature == "true" && isFromSalesOrder == "true">
            <fx:TaxID>${customer.defaulttaxreg}</fx:TaxID>
        </#if>
        <fx:NombreReceptor>${nombreReceptor?replace("'", "&apos;")?replace("\"","&quot;")?no_esc}</fx:NombreReceptor>
        <fx:DomicilioFiscalReceptor>${domicilioFiscalReceptor}</fx:DomicilioFiscalReceptor>
        <#if foreignTradeFeature == "true" && isFromSalesOrder == "true">
            <fx:ResidenciaFiscal>${custom.foreignTradeInfo.satAddressFields.Receptor.satcountry}</fx:ResidenciaFiscal>
        </#if>
        <fx:RegimenFiscalReceptor>${regimenFiscalReceptor}</fx:RegimenFiscalReceptor>
        <fx:UsoCFDI>${satCodes.cfdiUsage}</fx:UsoCFDI>
    </fx:Receptor>
    <fx:Conceptos>
    <#list custom.items as customItem>
    <#assign "item" = transaction.item[customItem.line?number]>
    <#assign "taxes" = customItem.taxes>
    <#assign "itemSatCodes" = satCodes.items[customItem.line?number]>
    <#if customItem.type == "Group"  || customItem.type == "Kit">
      <#assign "itemSatUnitCode" = "H87">
      <#assign "itemUnits" = "Pieza">
    <#else>
      <#assign "itemSatUnitCode" = (customItem.satUnitCode)!"">
      <#assign "itemUnits" = item.unitsdisplay>
    </#if>
    <fx:Concepto>
        <fx:Cantidad>${item.quantity?string["0.000000"]}</fx:Cantidad>
        <fx:ClaveUnidad>${itemSatUnitCode}</fx:ClaveUnidad>
        <#if itemUnits?has_content>
        <fx:UnidadDeMedida>${itemUnits}</fx:UnidadDeMedida>
        </#if>
        <fx:ClaveProdServ>${itemSatCodes.itemCode}</fx:ClaveProdServ>
        <fx:Codigo>${item.item}_${item.line?number + 1}</fx:Codigo>
        <fx:Descripcion>"${item.description}"</fx:Descripcion>
        <fx:ValorUnitario>${customItem.rate?number?string["0.00"]}</fx:ValorUnitario>
        <fx:Importe>${customItem.amount?number?string["0.00"]}</fx:Importe>
        <fx:ObjetoImp>01</fx:ObjetoImp>
        <fx:Opciones>
        <#if customItem.parts?has_content>
            <#list customItem.parts as part>
            <#assign "partItem" = transaction.item[part.line?number]>
            <#assign "partSatCodes" = satCodes.items[part.line?number]>
            <fx:Parte Cantidad="${partItem.quantity?string["0.0"]}" ClaveProdServ="${partSatCodes.itemCode}" Descripcion="${partItem.description}" Importe="${part.amount?number?string["0.00"]}" ValorUnitario="${part.rate?number?string["0.00"]}" NoIdentificacion="${part.itemId}" Unidad="${part.satUnitCode}"/>
            </#list>
        </#if>
        <#if cartaPorteFeature == "true" && custom.cartaPorteInfo.internationalTransport == "Sí">
            <fx:DatosDeImportacion>
                <fx:InformacionAduanera>
                        <fx:NumeroDePedimento>${item.custcol_mx_txn_line_sat_cust_req_num}</fx:NumeroDePedimento>
                </fx:InformacionAduanera>
            </fx:DatosDeImportacion>
        </#if>
        </fx:Opciones>
    </fx:Concepto>
    </#list>
</fx:Conceptos>
    <fx:Totales>
        <fx:Moneda><#if cartaPorteFeature == "true">XXX<#else>${currencyCode}</#if></fx:Moneda>
        <#if cartaPorteFeature == "false"><fx:TipoDeCambioVenta>${exchangeRate}</fx:TipoDeCambioVenta></#if>
        <fx:SubTotalBruto><#if cartaPorteFeature == "true">0<#else>0.00</#if></fx:SubTotalBruto>
        <fx:SubTotal><#if cartaPorteFeature == "true">0<#else>0.00</#if></fx:SubTotal>
        <fx:Total><#if cartaPorteFeature == "true">0<#else>0.00</#if></fx:Total>
        <fx:TotalEnLetra>-</fx:TotalEnLetra>
    </fx:Totales>
    <#if foreignTradeFeature == "true" || cartaPorteFeature == "true">
        <fx:Complementos>
            <#if foreignTradeFeature == "true">
                <fx:ComercioExterior20
                                    Version="2.0"
                                    MotivoTraslado="${custom.foreignTradeInfo.satReasonForTransfer}"
                                    ClaveDePedimento="A1"
                                    CertificadoOrigen="${transaction.custbody_mft_certificate_of_origin}"
                        <#if transaction.custbody_mft_certificate_of_origin == "1" && transaction.custbody_mft_certificate_of_origin_num!=""> NumCertificadoOrigen="${transaction.custbody_mft_certificate_of_origin_num}"
                        </#if>Incoterm="${custom.foreignTradeInfo.satIncoterm}"
                        <#if transaction.custbody_mft_comments != ""> Observaciones="${transaction.custbody_mft_comments}"
                        </#if>TipoCambioUSD="${custom.foreignTradeInfo.xRateUSD}"
                        TotalUSD="${custom.foreignTradeInfo.totalUSD?number?string["0.00"]}">
                        <fx:Emisor>
                            <fx:Domicilio
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
                                    <@printAttrPair attr="Calle" value=custom.foreignTradeInfo.satAddressFields.Emisor.address1/>
                                    <@printAttrPair attr="Localidad" value=custom.foreignTradeInfo.satAddressFields.Emisor.city/>
                                    <@printAttrPair attr="Municipio" value=custom.foreignTradeInfo.satAddressFields.Emisor.village/>
                                </#if>
                                <@printAttrPair attr="Estado" value=custom.foreignTradeInfo.satAddressFields.Emisor.satstate/>
                                <@printAttrPair attr="Pais" value=custom.foreignTradeInfo.satAddressFields.Emisor.satcountry/>
                                <@printAttrPair attr="CodigoPostal" value=custom.foreignTradeInfo.satAddressFields.Emisor.zip/>
                            />
                        </fx:Emisor>
                        <fx:Receptor
                            <#if receptorRfc == 'XEXX010101000'>
                                NumRegIdTrib="${customer.defaulttaxreg}"
                            </#if>
                        >
                            <fx:Domicilio
                                <#if receptorSatAddressFields.satcountry == "MEX">
                                    <@printAttrPair attr="Calle" value=receptorSatAddressFields.streetname/>
                                    <@printAttrPair attr="NumeroExterior" value=receptorSatAddressFields.streetnumber/>
                                    <@printAttrPair attr="NumeroInterior" value=receptorSatAddressFields.apartment/>
                                    <@printAttrPair attr="Colonia" value=receptorSatAddressFields.colonia?left_pad(4)[0..*4]?trim/>
                                    <@printAttrPair attr="Localidad" value=receptorSatAddressFields.city?left_pad(2)[0..*2]?trim/>
                                    <@printAttrPair attr="Municipio" value=receptorSatAddressFields.village?left_pad(3)[0..*3]?trim/>
                                <#else>
                                    <@printAttrPair attr="Calle" value=receptorSatAddressFields.address1/>
                                    <@printAttrPair attr="NumeroExterior" value=receptorSatAddressFields.streetnumber/>
                                    <@printAttrPair attr="NumeroInterior" value=receptorSatAddressFields.apartment/>
                                    <@printAttrPair attr="Colonia" value=receptorSatAddressFields.colonia/>
                                    <@printAttrPair attr="Localidad" value=receptorSatAddressFields.city/>
                                    <@printAttrPair attr="Municipio" value=receptorSatAddressFields.village/>
                                </#if>     				    
                                <@printAttrPair attr="Estado" value=receptorSatAddressFields.satstate/>
                                <@printAttrPair attr="Pais" value=receptorSatAddressFields.satcountry/>
                                <@printAttrPair attr="CodigoPostal" value=receptorSatAddressFields.zip/>
                            />
                        </fx:Receptor>
                        <#if transaction.custbody_mft_addressee?has_content && transaction.custbody_mft_addressee.entityid != transaction.entity.entityid>
                            <fx:Destinatario NumRegIdTrib="${transaction.custbody_mft_addressee.defaulttaxreg}" Nombre="${transaction.custbody_mft_addressee.entityid}">
                                <fx:Domicilio
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
                            </fx:Destinatario>
                        </#if>
                        <fx:Mercancias>
                            <#list custom.foreignTradeInfo.items as FTItem>
                            <#assign "item" = transaction.item[FTItem.line?number]>
                            <fx:Mercancia
                                    NoIdentificacion="${item.item}_${item.line?number + 1}"
                            <#if FTItem.satCustomsUnitCode != "99" && FTItem.satTariffItemCode!=""> FraccionArancelaria="${FTItem.satTariffItemCode}"
                            </#if><#if FTItem.satCustomsUnitCode != "" && FTItem.satCustomsUnitPrice != "" && FTItem.satCustomsQuantity != ""> CantidadAduana="${FTItem.satCustomsQuantity}"
                            </#if><#if FTItem.satCustomsUnitCode != ""> UnidadAduana="${FTItem.satCustomsUnitCode?number?string["00"]}"
                            </#if><#if FTItem.satCustomsUnitPrice != ""> ValorUnitarioAduana="${FTItem.satCustomsUnitPrice?number?string["0.000000"]}"
                            </#if><#if FTItem.satUSDCustomsAmount != ""> ValorDolares="${FTItem.satUSDCustomsAmount?number?string["0.0000"]}"
                            </#if>>
                            <#if item.type != "service" && (FTItem.manufacturer != "" || FTItem.mpn != "")>
                            <fx:DescripcionesEspecificas<#if FTItem.manufacturer != ""> Marca="${FTItem.manufacturer}"</#if><#if FTItem.mpn != ""> NumeroSerie="${FTItem.mpn}"</#if> />
                            </#if>
                            </fx:Mercancia>
                            </#list>
                        </fx:Mercancias>
                </fx:ComercioExterior20>
            </#if>
            <#if cartaPorteFeature == "true">
            <#setting time_zone = "GMT">
            <#assign "customerTimeZone" = custom.cartaPorteInfo.customerTimeZone>
                <fx:CartaPorte31
                    Version="3.1"
                    IdCCP="${transaction.custbody_mcp_idccp}"
                    TranspInternac = "${custom.cartaPorteInfo.internationalTransport}"
                    <#if custom.cartaPorteInfo.internationalTransport == "Sí">
                        EntradaSalidaMerc = "${custom.cartaPorteInfo.entryOrExitOfGoods}"
                        <#if custom.cartaPorteInfo.entryOrExitOfGoods == "Entrada">
                            <#assign "originDestinyCountry" = custom.cartaPorteInfo.originCountry>
                        <#else>
                            <#assign "originDestinyCountry" = custom.cartaPorteInfo.destinationCountry>
                        </#if>
                        PaisOrigenDestino = "${originDestinyCountry}"
                    </#if>
                    <#if custom.cartaPorteInfo.internationalTransport == "Sí"> ViaEntradaSalida = "01"</#if>
                    <#if custom.cartaPorteInfo.transportModeCode == "01 - Autotransporte Federal" || custom.cartaPorteInfo.transportModeCode == "04"> TotalDistRec = "${custom.cartaPorteInfo.totalDistanceTraveledInKm}"</#if>>
                    <#if custom.cartaPorteInfo.internationalTransport == "Sí">
                        <fx:RegimenesAduaneros>
                            <fx:RegimenAduaneroCCP RegimenAduanero="${custom.cartaPorteInfo.satCustomsRegime}"/>
                        </fx:RegimenesAduaneros>
                    </#if>
                    <fx:Ubicaciones>
                        <#list custom.cartaPorteInfo.routes as CPRoute>
                            <fx:Ubicacion
                                <#if (custom.cartaPorteInfo.transportModeCode == "01 - Autotransporte Federal" || custom.cartaPorteInfo.transportModeCode == "04") && CPRoute.route.isOrigin == 'false'> DistanciaRecorrida = "${CPRoute.distanceTraveledInKm}"</#if>

                                <#if CPRoute.route.isOrigin == "true">
                                    TipoUbicacion = "Origen"
                                    RFCRemitenteDestinatario = "${companyTaxRegNumber}"
                                    <#if companyTaxRegNumber == "XEXX010101000">
                                        NumRegIdTrib = "${companyTaxRegNumber}"
                                        ResidenciaFiscal = "${CPRoute.country}"
                                    </#if>
                                <#else>
                                    TipoUbicacion = "Destino"
                                    RFCRemitenteDestinatario = "${receptorRfc}"
                                    <#if receptorRfc == "XEXX010101000">
                                        NumRegIdTrib = "${receptorRfc}"
                                        ResidenciaFiscal = "${CPRoute.country}"
                                    </#if>
                                </#if>
                                <#if CPRoute.route.id != ''  && (custom.cartaPorteInfo.routes?size gt 2) >
                                    IDUbicacion = "${CPRoute.route.id}"
                                </#if>

                                FechaHoraSalidaLlegada = "${CPRoute.route.dateTime?remove_ending(".000Z")?datetime("yyyy-MM-dd'T'HH:mm:ss")?iso_nz(customerTimeZone)}"

                                >
                                <#if custom.cartaPorteInfo.transportModeCode != "04">
                                    <fx:Domicilio
                                        <#if CPRoute.address.country.code == "MEX">
                                            Calle = "${CPRoute.address.streetName}"
                                        <#else>
                                            Calle = "${CPRoute.address.address1}"
                                        </#if>
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
                            </fx:Ubicacion>
                        </#list>
                    </fx:Ubicaciones>
                    <fx:Mercancias
                        <#if custom.cartaPorteInfo.satReverseLogisticsCollectionReturn == "Sí">
                            LogisticaInversaRecoleccionDevolucion="${custom.cartaPorteInfo.satReverseLogisticsCollectionReturn}"
                        </#if>
                        NumTotalMercancias="${custom.cartaPorteInfo.totalDistinctGoods}"
                        <#if custom.cartaPorteInfo.transportModeCode == "01 - Autotransporte Federal">
                            PesoBrutoTotal = "${custom.cartaPorteInfo.goods.sumOfItemsWeight}"
                            UnidadPeso="KGM"
                        </#if>
                    >
                        <#list custom.cartaPorteInfo.goods.good as CPMercancia>
                            <fx:Mercancia
                                <#if custom.cartaPorteInfo.internationalTransport == "Sí">
                                    TipoMateria="${CPMercancia.satMaterialType}"
                                    <#if CPMercancia.satMaterialTypeDescription != "">
                                        DescripcionMateria="${CPMercancia.satMaterialTypeDescription}"
                                    </#if>
                                </#if>
                                <#if CPMercancia.transportedGoods??>
                                    BienesTransp="${CPMercancia.transportedGoods}"
                                </#if>
                                <#if CPMercancia.quantity??>
                                    Cantidad="${CPMercancia.quantity}"
                                </#if>
                                <#if getSatUnitCode(CPMercancia.transportedGoods) != "">
                                    ClaveUnidad="${getSatUnitCode(CPMercancia.transportedGoods)}"
                                </#if>
                                <#if CPMercancia.dangerousGood != "" && CPMercancia.dangerousGood == "true">
                                    MaterialPeligroso="Sí"
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
                                <#if transaction.item[CPMercancia?index]??>
                                    Descripcion="${transaction.item[CPMercancia?index].description}"
                                </#if>
                                <#if custom.cartaPorteInfo.internationalTransport == "Sí">
                                    FraccionArancelaria="${CPMercancia.tariffItemCode}"
                                </#if>
                                <#if custom.cartaPorteInfo.internationalTransport == "Sí" && custom.cartaPorteInfo.entryOrExitOfGoods == "Salida"> <#-- TODO: this check is not complete yet. Pending to check if "exportación es considerada definitiva (De tipo A1)" -->
                                    <#if CPMercancia.foreignTradeUUID != "">
                                        UUIDComercioExt="${CPMercancia.foreignTradeUUID}"
                                    </#if>
                                </#if>>
                                <#if custom.cartaPorteInfo.internationalTransport == "Sí" && custom.cartaPorteInfo.entryOrExitOfGoods == "Entrada" >
                                    <fx:DocumentacionAduanera
                                        TipoDocumento="${CPMercancia.satCustomsDocumentType}"
                                        <#if CPMercancia.satCustomsDocumentType == "01">
                                            NumPedimento="${CPMercancia.satCustomsRequestNumber}"
                                        <#else>
                                            IdentDocAduanero="${CPMercancia.satCustomsDocumentId}"
                                        </#if>
                                        <#if CPMercancia.rfcImporter != "">
                                            RFCImpo="${CPMercancia.rfcImporter}"
                                        </#if>
                                    />
                                </#if>
                                <#if (custom.cartaPorteInfo.segments?size gt 1)>
                                    <#list custom.cartaPorteInfo.segments as Segment>
                                        <fx:CantidadTransporta
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
                            </fx:Mercancia>
                        </#list>
                        <fx:Autotransporte
                            <#if custom.cartaPorteInfo.goods.fleet.SCTPermit.code != "">
                                PermSCT="${custom.cartaPorteInfo.goods.fleet.SCTPermit.code}"
                            </#if>
                            <#if custom.cartaPorteInfo.goods.fleet.SCTPermitNumber != "">
                                NumPermisoSCT="${custom.cartaPorteInfo.goods.fleet.SCTPermitNumber}"
                            </#if>
                        >
                            <fx:IdentificacionVehicular
                                PesoBrutoVehicular="${custom.cartaPorteInfo.goods.fleet.satVehicleGrossWeight?number?string["0.00"]}"
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
                            <fx:Seguros
                                AseguraRespCivil="${custom.cartaPorteInfo.goods.fleet.insuranceCompanyName}"
                                PolizaRespCivil="${custom.cartaPorteInfo.goods.fleet.insurancePolicyNumber}"
                                <#if custom.cartaPorteInfo.goods.atLeastOneDangerousGood == "true">
                                    AseguraMedAmbiente="${custom.cartaPorteInfo.goods.fleet.envDamageInsurancePolName}"
                                    PolizaMedAmbiente="${custom.cartaPorteInfo.goods.fleet.envDamageInsurancePolNum}"
                                </#if>
                                <#if custom.cartaPorteInfo.goods.fleet.freightTransportationInsPolName != "">
                                    AseguraCarga="${custom.cartaPorteInfo.goods.fleet.freightTransportationInsPolName}"
                                </#if>
                                <#if custom.cartaPorteInfo.goods.fleet.freightTransportationInsPolNum != "">
                                    PolizaCarga="${custom.cartaPorteInfo.goods.fleet.freightTransportationInsPolNum}"
                                </#if>
                                <#if custom.cartaPorteInfo.goods.fleet.insurancePremiumAmount != "">
                                    PrimaSeguro="${custom.cartaPorteInfo.goods.fleet.insurancePremiumAmount}"
                                </#if>
                            />
                            <#if custom.cartaPorteInfo.goods.fleet.trailerType.code != "" || custom.cartaPorteInfo.goods.fleet.trailerPlate != "">
                                <fx:Remolques>
                                    <fx:Remolque
                                        <#if custom.cartaPorteInfo.goods.fleet.trailerType.code != "">
                                            SubTipoRem="${custom.cartaPorteInfo.goods.fleet.trailerType.code}"
                                        </#if>
                                        <#if custom.cartaPorteInfo.goods.fleet.trailerPlate != "">
                                            Placa="${custom.cartaPorteInfo.goods.fleet.trailerPlate}"
                                        </#if>
                                    />
                                </fx:Remolques>
                            </#if>
                        </fx:Autotransporte>
                    </fx:Mercancias>
                    <fx:FiguraTransporte>
                            <#list custom.cartaPorteInfo.operators as CPOperator>
                                <fx:TiposFigura TipoFigura="01" <#if CPOperator.isMexican == "true">RFCFigura="${CPOperator.operatorRfc}"</#if> NumLicencia="${CPOperator.licenseNumber}" <#if CPOperator.operatorName != "">NombreFigura="${CPOperator.operatorName}"</#if> <#if CPOperator.isMexican == "false">NumRegIdTribFigura="${CPOperator.operatorRfc}" ResidenciaFiscalFigura="${CPOperator.address.country.code}"</#if>>
                                    <fx:Domicilio
                                        <#if CPOperator.isMexican == "true">
                                            Calle = "${CPOperator.address.streetName}"
                                        <#else>
                                            Calle = "${CPOperator.address.address1}"
                                        </#if>
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
                                </fx:TiposFigura>
                            </#list>
                    </fx:FiguraTransporte>
                </fx:CartaPorte31>
            </#if>
        </fx:Complementos>
    </#if>
</fx:FactDocMX>
