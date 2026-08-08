<#ftl output_format="XML">
<?xml version="1.0" encoding="utf-8"?>

<#setting locale = "en_US">

<#assign "summary" = custom.summary>
<#assign "satCodes" = custom.satcodes>
<#assign "companyTaxRegNumber" = custom.companyInfo.rfc>

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
    <#assign "nombreReceptor" = customer.custentity_mx_sat_registered_name?string?replace("'", "&apos;")?replace("\"","&quot;")?no_esc>
    <#assign "receptorRfc" = customer.custentity_mx_rfc>
<#-- The item fulfillment comes from a transfer order or from an intercompany transfer order -->
<#else>
    <#assign isFromSalesOrder = "false">
    <#if foreignTradeFeature == "true">
        <#assign receptorSatAddressFields = custom.foreignTradeInfo.satAddressFields.Emisor>
    </#if>
    <#assign "customerName" = customCompanyInfo.legalname>
    <#assign "nombreReceptor" = customCompanyInfo.custrecord_mx_sat_registered_name?string?replace("'", "&apos;")?replace("\"","&quot;")?no_esc>
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

<#if cartaPorteFeature == "true">
    <#assign "domicilioFiscalReceptor" = customCompanyInfo.zip>
    <#assign "nombreReceptor" = customCompanyInfo.custrecord_mx_sat_registered_name?string?replace("'", "&apos;")?replace("\"","&quot;")?no_esc>
    <#assign "receptorRfc" = companyTaxRegNumber>
    <#assign "regimenFiscalReceptor" = satCodes.industryType>
</#if>

<#assign companySatRegName = customCompanyInfo.custrecord_mx_sat_registered_name?string?replace("'", "&apos;")?replace("\"","&quot;")?no_esc>

<#if currencyCode != "MXN">
<#assign exchangeRateVal = exchangeRate>
</#if>

<cfdi:Comprobante
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
        xsi:schemaLocation="http://www.sat.gob.mx/cfd/4
            http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd
        <#if foreignTradeFeature == "true"> http://www.sat.gob.mx/ComercioExterior20 http://www.sat.gob.mx/sitio_internet/cfd/ComercioExterior20/ComercioExterior20.xsd</#if>
        <#if cartaPorteFeature == "true"> http://www.sat.gob.mx/CartaPorte31 http://www.sat.gob.mx/sitio_internet/cfd/CartaPorte/CartaPorte31.xsd</#if>"
    <#if cartaPorteFeature == "true"> xmlns:cartaporte31="http://www.sat.gob.mx/CartaPorte31"</#if>
    Fecha="${transaction.createddate?string.iso_nz}"
    <@printAttrPair attr="Folio" value=transaction.custbody_mx_cfdi_folio/>
    <@printAttrPair attr="Serie" value=transaction.custbody_mx_cfdi_serie/>
    LugarExpedicion="${customCompanyInfo.zip}"
    Exportacion="${transaction.custbody_mx_cfdi_sat_export_type[0..1]}"
    Moneda="<#if cartaPorteFeature == "true">XXX<#else>${currencyCode}</#if>" <#if cartaPorteFeature == "false"><@printAttrPair attr="TipoCambio" value=(exchangeRateVal)!""/></#if> SubTotal="<#if cartaPorteFeature == "true">0<#else>0.00</#if>" TipoDeComprobante="${satCodes.proofType}" Total="<#if cartaPorteFeature == "true">0<#else>0.00</#if>" Version="4.0">
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
        Nombre="${companySatRegName}"
        RegimenFiscal="${satCodes.industryType}"
        Rfc="${companyTaxRegNumber?no_esc}"/>
    <cfdi:Receptor
        Nombre="${nombreReceptor}"
        DomicilioFiscalReceptor="${domicilioFiscalReceptor}"
        RegimenFiscalReceptor="${regimenFiscalReceptor}"
        Rfc="${receptorRfc?no_esc}"
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
            <#if foreignTradeFeature == "true">NoIdentificacion="${item.item}_${item.line?number + 1}"</#if>
            Cantidad="${item.quantity?string["0.000000"]}"
            <@printAttrPair attr="ClaveProdServ" value=(itemSatCodes.itemCode)!""/>
            <@printAttrPair attr="ClaveUnidad" value=itemSatUnitCode!""/>
            ObjetoImp="01"
            Descripcion="${item.description}"
            Importe="${customItem.amount?number?string["0.00"]}"
            ValorUnitario="0.00">
            <@printNodePair node="cfdi:InformacionAduanera" attr="NumeroPedimento" value=item.custcol_mx_txn_line_sat_cust_req_num/>
            <@printNodePair node="cfdi:CuentaPredial" attr="Numero" value=item.custcol_mx_txn_line_sat_cadastre_id/>
            <#if customItem.parts?has_content>
            <#list customItem.parts as part>
            <#assign "partItem" = transaction.item[part.line?number]>
            <#assign "partSatCodes" = satCodes.items[part.line?number]>
            <cfdi:Parte Cantidad="${partItem.quantity?string["0.0"]}" ClaveProdServ="${partSatCodes.itemCode}" Descripcion="${partItem.description}" Importe="${part.amount?number?string["0.00"]}" ValorUnitario="${part.rate?number?string["0.00"]}" NoIdentificacion="${part.itemId}"/>
            </#list>
            </#if>
            <#if cartaPorteFeature == "true" && custom.cartaPorteInfo.internationalTransport == "Sí">
                <cfdi:DatosDeImportacion>
                    <cfdi:InformacionAduanera>
                        <#list custom.cartaPorteInfo.goods.good as CPMercancia>
                            <cfdi:NumeroDePedimento>${CPMercancia.satCustomsRequestNumber}</cfdi:NumeroDePedimento>
                        </#list>
                    </cfdi:InformacionAduanera>
                </cfdi:DatosDeImportacion>
            </#if>
        </cfdi:Concepto>
        </#list>
    </cfdi:Conceptos>
    <#if foreignTradeFeature == "true" || cartaPorteFeature == "true">
        <cfdi:Complemento>
        <#if foreignTradeFeature == "true">
            <cce20:ComercioExterior
                MotivoTraslado="${custom.foreignTradeInfo.satReasonForTransfer}"
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
                <cce20:Receptor
                    <#if receptorRfc == 'XEXX010101000' && isFromSalesOrder == "true">NumRegIdTrib="${customer.defaulttaxreg}"</#if>>
                    <cce20:Domicilio
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
                        NoIdentificacion="${item.item}_${item.line?number + 1}"
                        <#if FTItem.satCustomsUnitCode != "99" && FTItem.satTariffItemCode!=""> FraccionArancelaria="${FTItem.satTariffItemCode}"
                        </#if><#if FTItem.satCustomsUnitCode != "" && FTItem.satCustomsUnitPrice != "" && FTItem.satCustomsQuantity != ""> CantidadAduana="${FTItem.satCustomsQuantity}"
                        </#if><#if FTItem.satCustomsUnitCode != ""> UnidadAduana="${FTItem.satCustomsUnitCode?number?string["00"]}"
                        </#if><#if FTItem.satCustomsUnitPrice != ""> ValorUnitarioAduana="${FTItem.satCustomsUnitPrice?number?string["0.000000"]}"
                        </#if><#if FTItem.satUSDCustomsAmount != ""> ValorDolares="${FTItem.satUSDCustomsAmount?number?string["0.0000"]}"
                        </#if>><#if item.type != "service" && (FTItem.manufacturer != "" || FTItem.mpn != "")>
                        <cce20:DescripcionesEspecificas<#if FTItem.manufacturer != ""> Marca="${FTItem.manufacturer}"</#if><#if FTItem.mpn != ""> NumeroSerie="${FTItem.mpn}"</#if> />
                        </#if>
                    </cce20:Mercancia>
                    </#list>
                </cce20:Mercancias>
            </cce20:ComercioExterior>
        </#if>
        <#if cartaPorteFeature == "true">
            <#setting time_zone = "GMT">
            <#assign "customerTimeZone" = custom.cartaPorteInfo.customerTimeZone >
            <cartaporte31:CartaPorte
                Version="3.1"
                IdCCP="${transaction.custbody_mcp_idccp}"
                TranspInternac = "${custom.cartaPorteInfo.internationalTransport}"
                <#if custom.cartaPorteInfo.internationalTransport == "Sí">
                    EntradaSalidaMerc = "${custom.cartaPorteInfo.entryOrExitOfGoods}"
                    ViaEntradaSalida = "01"
                    <#if custom.cartaPorteInfo.entryOrExitOfGoods == "Entrada">
                        PaisOrigenDestino = "${custom.cartaPorteInfo.originCountry}"
                    <#else>
                        PaisOrigenDestino = "${custom.cartaPorteInfo.destinationCountry}"
                    </#if>
                </#if>
                <#if custom.cartaPorteInfo.transportModeCode == "01 - Autotransporte Federal" || custom.cartaPorteInfo.transportModeCode == "04">
                    TotalDistRec = "${custom.cartaPorteInfo.totalDistanceTraveledInKm}"
                </#if>
                >
                <#if custom.cartaPorteInfo.internationalTransport == "Sí">
                    <cartaporte31:RegimenesAduaneros>
                        <cartaporte31:RegimenAduaneroCCP RegimenAduanero="${custom.cartaPorteInfo.satCustomsRegime}"/>
                    </cartaporte31:RegimenesAduaneros>
                </#if>
                <cartaporte31:Ubicaciones>
                    <#list custom.cartaPorteInfo.routes as CPRoute>
                        <cartaporte31:Ubicacion
                            <#if (custom.cartaPorteInfo.transportModeCode == "01 - Autotransporte Federal" || custom.cartaPorteInfo.transportModeCode == "04") && CPRoute.route.isOrigin == 'false'> DistanciaRecorrida = "${CPRoute.distanceTraveledInKm}"</#if>
                            <#if CPRoute.route.isOrigin == "true">
                                TipoUbicacion = "Origen"
                                RFCRemitenteDestinatario = "${companyTaxRegNumber?no_esc}"
                                <#if companyTaxRegNumber == "XEXX010101000"> <#--CP129-->
                                    NumRegIdTrib="${companyTaxRegNumber?no_esc}"
                                    <@printAttrPair attr="ResidenciaFiscal" value=CPRoute.country/>
                                </#if>
                            <#else>
                                TipoUbicacion = "Destino"
                                RFCRemitenteDestinatario = "${receptorRfc?no_esc}"
                                <#if receptorRfc == "XEXX010101000"><#--CP129-->
                                    NumRegIdTrib="${receptorRfc?no_esc}"
                                    <@printAttrPair attr="ResidenciaFiscal" value=CPRoute.country/>
                                </#if>
                            </#if>
                            <#if CPRoute.route.id != ''  && (custom.cartaPorteInfo.routes?size gt 2) >
                                IDUbicacion = "${CPRoute.route.id}"
                            </#if>
                            FechaHoraSalidaLlegada="${CPRoute.route.dateTime?remove_ending(".000Z")?datetime("yyyy-MM-dd'T'HH:mm:ss")?iso_nz(customerTimeZone)}"
                            >
                            <#if custom.cartaPorteInfo.transportModeCode != "04">
                                <cartaporte31:Domicilio
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
                        </cartaporte31:Ubicacion>
                    </#list>
                </cartaporte31:Ubicaciones>
                <cartaporte31:Mercancias
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
                        <cartaporte31:Mercancia
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
                                Unidad="${getSatUnitCode(CPMercancia.transportedGoods)}"
                            </#if>

                            Descripcion="${transaction.item[CPMercancia?index].description}"

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
                            <#if custom.cartaPorteInfo.internationalTransport == "Sí">
                                FraccionArancelaria="${CPMercancia.tariffItemCode}"
                            </#if>
                            <#if custom.cartaPorteInfo.internationalTransport == "Sí" && custom.cartaPorteInfo.entryOrExitOfGoods == "Salida"> <#-- TODO: this check is not complete yet. Pending to check if "exportación es considerada definitiva (De tipo A1)" -->
                                <#if CPMercancia.foreignTradeUUID != "">
                                    UUIDComercioExt="${CPMercancia.foreignTradeUUID}"
                                </#if>
                            </#if>
                            >
                            <#if custom.cartaPorteInfo.internationalTransport == "Sí" && custom.cartaPorteInfo.entryOrExitOfGoods == "Entrada">
                                <cartaporte31:DocumentacionAduanera TipoDocumento="${CPMercancia.satCustomsDocumentType}"
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
                                    <cartaporte31:CantidadTransporta
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
                        </cartaporte31:Mercancia>
                    </#list>
                    <cartaporte31:Autotransporte
                        <#if custom.cartaPorteInfo.goods.fleet.SCTPermit.code != "">
                            PermSCT="${custom.cartaPorteInfo.goods.fleet.SCTPermit.code}"
                        </#if>
                        <#if custom.cartaPorteInfo.goods.fleet.SCTPermitNumber != "">
                            NumPermisoSCT="${custom.cartaPorteInfo.goods.fleet.SCTPermitNumber}"
                        </#if>
                    >
                        <cartaporte31:IdentificacionVehicular
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
                        <cartaporte31:Seguros
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
                            <cartaporte31:Remolques>
                                <cartaporte31:Remolque
                                    <#if custom.cartaPorteInfo.goods.fleet.trailerType.code != "">
                                        SubTipoRem="${custom.cartaPorteInfo.goods.fleet.trailerType.code}"
                                    </#if>
                                    <#if custom.cartaPorteInfo.goods.fleet.trailerPlate != "">
                                        Placa="${custom.cartaPorteInfo.goods.fleet.trailerPlate}"
                                    </#if>
                                />
                            </cartaporte31:Remolques>
                        </#if>
                    </cartaporte31:Autotransporte>
                </cartaporte31:Mercancias>
                <cartaporte31:FiguraTransporte>
                    <#list custom.cartaPorteInfo.operators as CPOperator>
                        <cartaporte31:TiposFigura
                        <#if CPOperator.isMexican == "true">
                            RFCFigura="${CPOperator.operatorRfc}"
                        <#else >
                            NumRegIdTribFigura="${CPOperator.operatorRfc}"
                            ResidenciaFiscalFigura="${CPOperator.address.country.code}"
                        </#if>
                        NumLicencia="${CPOperator.licenseNumber}"

                        <#if CPOperator.operatorName != "">
                            NombreFigura="${CPOperator.operatorName}"
                        </#if>
                        TipoFigura="01"
                        >
                            <cartaporte31:Domicilio
                                <#if CPOperator.address.country.code == "MEX">
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
                        </cartaporte31:TiposFigura>
                    </#list>
                </cartaporte31:FiguraTransporte>
            </cartaporte31:CartaPorte>
        </#if>
        </cfdi:Complemento>
    </#if>
</cfdi:Comprobante>
