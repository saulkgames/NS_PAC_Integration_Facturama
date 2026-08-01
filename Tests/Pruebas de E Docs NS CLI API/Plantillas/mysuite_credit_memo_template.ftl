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
<#assign customCompanyInfo = companyinformation>
</#if>
<#assign "summary" = custom.summary>
<#assign "satCodes" = custom.satcodes>
<#assign "totalAmount" = summary.subtotal - summary.totalDiscount>
<#assign "companyTaxRegNumber" = custom.companyInfo.rfc>
<#assign paymentMethod = satCodes.paymentMethod>
<#assign paymentTerm = satCodes.paymentTerm>
<#if satCodes.proofType == "I">
<#assign satProofType = "FACTURA">
<#else>
<#assign satProofType = "NOTA_DE_CREDITO">
<#if custom.relatedCfdis.types[0] == "07">
<#assign paymentTerm = "PUE">
</#if>
</#if>
<#if customer.custentity_mx_rfc == "XAXX010101000" || customer.custentity_mx_rfc == "XEXX010101000" || customer.custentity_mx_rfc == "">
<#assign domicilioFiscalReceptor = customCompanyInfo.zip>
<#else>
<#assign domicilioFiscalReceptor = custom.billaddr.customerdefaultzipcode>
</#if>
<#assign byTaxObject = summary.byTaxObject>

<#assign "foreignTradeFeature" = custom.foreignTradeInfo?has_content?string('true','false')>

<fx:FactDocMX
xmlns:fx="http://www.fact.com.mx/schema/fx"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.fact.com.mx/schema/fx http://www.mysuitemex.com/fact/schema/fx_2010_g.xsd">
<fx:Version>8</fx:Version>
<fx:Identificacion>
<fx:CdgPaisEmisor>MX</fx:CdgPaisEmisor>
<fx:TipoDeComprobante>${satProofType}</fx:TipoDeComprobante>
<fx:RFCEmisor>${companyTaxRegNumber}</fx:RFCEmisor>
<fx:RazonSocialEmisor>${customCompanyInfo.custrecord_mx_sat_registered_name}</fx:RazonSocialEmisor>
<fx:Usuario>${custom.loggedUserName}</fx:Usuario>
<fx:AsignacionSolicitada>
<#if transaction.custbody_mx_cfdi_serie?has_content>
<fx:Serie>${transaction.custbody_mx_cfdi_serie}</fx:Serie>
</#if>
<#if transaction.transactionnumber?has_content>
<fx:Folio>${transaction.transactionnumber}</fx:Folio>
</#if>
<fx:TiempoDeEmision>${transaction.trandate?string.iso}T00:00:00</fx:TiempoDeEmision>
</fx:AsignacionSolicitada>
<fx:Exportacion>${satCodes.exportType}</fx:Exportacion>
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
<fx:CdgPaisReceptor>${custom.billaddr.countrycode}</fx:CdgPaisReceptor>
<fx:RFCReceptor>${customer.custentity_mx_rfc}</fx:RFCReceptor>
<#if foreignTradeFeature == "true">
<fx:TaxID>${customer.defaulttaxreg}</fx:TaxID>
</#if>
<fx:NombreReceptor>${customer.custentity_mx_sat_registered_name}</fx:NombreReceptor>
<fx:DomicilioFiscalReceptor>${domicilioFiscalReceptor}</fx:DomicilioFiscalReceptor>
<#if foreignTradeFeature == "true">
<fx:ResidenciaFiscal>${custom.foreignTradeInfo.satAddressFields.Receptor.satcountry}</fx:ResidenciaFiscal>
</#if>
<fx:RegimenFiscalReceptor>${satCodes.customerIndustryType}</fx:RegimenFiscalReceptor>
<fx:UsoCFDI>${satCodes.cfdiUsage}</fx:UsoCFDI>
</fx:Receptor>
<fx:Conceptos>
<#list custom.items as customItem>
<#assign "item" = transaction.item[customItem.line?number]>
<#assign "taxes" = customItem.taxes>
<#assign "itemSatCodes" = satCodes.items[customItem.line?number]>
<#if customItem.type == "Group" || customItem.type == "Kit">
<#assign "itemSatUnitCode" = "H87">
<#assign "itemUnits" = "Pieza">
<#else>
<#assign "itemSatUnitCode" = (customItem.satUnitCode)!"">
<#assign "itemUnits" = item.units>
</#if>
<fx:Concepto>
<fx:Cantidad>${item.quantity?string["0.000000"]}</fx:Cantidad>
<fx:ClaveUnidad>${itemSatUnitCode}</fx:ClaveUnidad>
<#if itemUnits?has_content>
<fx:UnidadDeMedida>${itemUnits}</fx:UnidadDeMedida>
</#if>
<fx:ClaveProdServ>${itemSatCodes.itemCode}</fx:ClaveProdServ>
<fx:Codigo>${item.item}</fx:Codigo>
<fx:Descripcion><#outputformat "XML">"${item.description}"</#outputformat></fx:Descripcion>
<fx:ValorUnitario>${customItem.rate?number?string["0.00"]}</fx:ValorUnitario>
<fx:Importe>${customItem.amount?number?string["0.00"]}</fx:Importe>
<fx:Descuento>${customItem.totalDiscount?number?abs?string["0.00"]}</fx:Descuento>
<fx:ObjetoImp>${itemSatCodes.taxObject}</fx:ObjetoImp>
<#if itemSatCodes.taxObject == "02">
<fx:ImpuestosSAT>
<#if taxes.taxItems?has_content>
<fx:Traslados>
<#list taxes.taxItems as customTaxItem>
<#if customTaxItem.taxFactorType == "Exento">
<fx:Traslado Base="${customTaxItem.taxBaseAmount?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" TipoFactor="${customTaxItem.taxFactorType}" />
</#if>
<#if !customTaxItem.taxFactorType?has_content || customTaxItem.taxFactorType != "Exento">
<fx:Traslado Base="${customTaxItem.taxBaseAmount?number?string["0.00"]}" Importe="${customTaxItem.taxAmount?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" TasaOCuota="${customTaxItem.taxRate?number?string["0.000000"]}" TipoFactor="${customTaxItem.taxFactorType}" />
</#if>
</#list>
</fx:Traslados>
</#if>
<#if taxes.whTaxItems?has_content>
<fx:Retenciones>
<#list taxes.whTaxItems as customTaxItem>
<fx:Retencion Base="${customTaxItem.taxBaseAmount?number?string["0.00"]}" Importe="${customTaxItem.taxAmount?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" TasaOCuota="${customTaxItem.taxRate?number?string["0.000000"]}" TipoFactor="${customTaxItem.taxFactorType}" />
</#list>
</fx:Retenciones>
</#if>
</fx:ImpuestosSAT>
</#if>
<fx:Opciones>
<#if item.custcol_mx_txn_line_sat_cust_req_num?has_content>
<fx:DatosDeImportacion>
<fx:InformacionAduanera>
<fx:NumeroDePedimento>${item.custcol_mx_txn_line_sat_cust_req_num}</fx:NumeroDePedimento>
</fx:InformacionAduanera>
</fx:DatosDeImportacion>
</#if>
<#if item.custcol_mx_txn_line_sat_cadastre_id?has_content>
<fx:CuentaPredial>${item.custcol_mx_txn_line_sat_cadastre_id}</fx:CuentaPredial>
</#if>
<#if customItem.parts?has_content>
<#list customItem.parts as part>
<#assign "partItem" = transaction.item[part.line?number]>
<#assign "partSatCodes" = satCodes.items[part.line?number]>
<fx:Parte Cantidad="${partItem.quantity?string["0.0"]}" ClaveProdServ="${partSatCodes.itemCode}" Descripcion=<#outputformat "XML">"${partItem.description}"</#outputformat> Importe="${part.amount?number?string["0.00"]}" ValorUnitario="${part.rate?number?string["0.00"]}" NoIdentificacion="${part.itemId}" Unidad="${part.satUnitCode}"/>
</#list>
</#if>
</fx:Opciones>
</fx:Concepto>
</#list>
</fx:Conceptos>
<#if summary.includesWHTaxesWNotZeroBase == "true" || summary.includesTransferTaxesWNotZeroBase == "true">
<#if summary.includesWHTaxesWNotZeroBase == "true" && summary.includesTransferTaxesWNotZeroBase == "true">
<fx:ImpuestosSAT TotalImpuestosRetenidos="${byTaxObject.totalWithHoldTaxAmt?number?string["0.00"]}" TotalImpuestosTrasladados="${byTaxObject.totalNonWithHoldTaxAmt?number?string["0.00"]}">
<#elseif summary.includesWHTaxesWNotZeroBase == "true">
<fx:ImpuestosSAT TotalImpuestosRetenidos="${byTaxObject.totalWithHoldTaxAmt?number?string["0.00"]}">
<#elseif summary.includesTransferTaxesWNotZeroBase == "true">
<fx:ImpuestosSAT TotalImpuestosTrasladados="${byTaxObject.totalNonWithHoldTaxAmt?number?string["0.00"]}">
</#if>
<#if summary.includesWHTaxesWNotZeroBase == "true">
<fx:Retenciones>
<#list summary.whTaxesWNotZeroBase as customTaxItem>
<fx:Retencion Importe="${customTaxItem.taxAmountByTaxObject?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" />
</#list>
</fx:Retenciones>
</#if>
<#if summary.includesTransferTaxesWNotZeroBase == "true">
<fx:Traslados>
<#list summary.transferTaxesWNotZeroBase as customTaxItem>
<#if !customTaxItem.taxFactorType?has_content || customTaxItem.taxFactorType != "Exento">
<fx:Traslado Base="${customTaxItem.totalTaxBaseAmount?number?string["0.00"]}" Importe="${customTaxItem.taxAmountByTaxObject?number?string["0.00"]}" Impuesto="${customTaxItem.satTaxCode}" TasaOCuota="${customTaxItem.taxRate?number?string["0.000000"]}" TipoFactor="${customTaxItem.taxFactorType}" />
</#if>
</#list>
</fx:Traslados>
</#if>
<#if summary.includesWHTaxesWNotZeroBase == "true" || summary.includesTransferTaxesWNotZeroBase == "true">
</fx:ImpuestosSAT>
</#if>
</#if>
<fx:Totales>
<fx:Moneda>${currencyCode}</fx:Moneda>
<fx:TipoDeCambioVenta>${exchangeRate}</fx:TipoDeCambioVenta>
<fx:SubTotalBruto>${summary.subtotal?number?string["0.00"]}</fx:SubTotalBruto>
<fx:SubTotal>${summary.subtotal?number?string["0.00"]}</fx:SubTotal>
<fx:Descuento>${summary.totalDiscount?number?abs?string["0.00"]}</fx:Descuento>
<fx:Total>${byTaxObject.totalAmount?number?string["0.00"]}</fx:Total>
<fx:TotalEnLetra>-</fx:TotalEnLetra>
<#if (paymentMethod!"")?has_content>
<fx:FormaDePago>${paymentMethod}</fx:FormaDePago>
</#if>
</fx:Totales>
<#if foreignTradeFeature == "true">
<fx:Complementos>
<fx:ComercioExterior11
Version="1.1"
TipoOperacion="2"
ClaveDePedimento="A1"
CertificadoOrigen="${transaction.custbody_mft_certificate_of_origin}"
<#if transaction.custbody_mft_certificate_of_origin == "1" && transaction.custbody_mft_certificate_of_origin_num!="">
NumCertificadoOrigen="${transaction.custbody_mft_certificate_of_origin_num}"
</#if>
Incoterm="${custom.foreignTradeInfo.satIncoterm}"
Subdivision="0"
<#if transaction.custbody_mft_comments != "">
Observaciones="${transaction.custbody_mft_comments}"
</#if>
TipoCambioUSD="${custom.foreignTradeInfo.xRateUSD}"
TotalUSD="${custom.foreignTradeInfo.totalUSD?number?string["0.00"]}">
<fx:Emisor>
<fx:Domicilio
<#if custom.foreignTradeInfo.satAddressFields.Emisor.satcountry == "MEX">
${getAttrPair("Calle",custom.foreignTradeInfo.satAddressFields.Emisor.streetname)}
<#else>
${getAttrPair("Calle",custom.foreignTradeInfo.satAddressFields.Emisor.address1)}
</#if>
${getAttrPair("NumeroExterior",custom.foreignTradeInfo.satAddressFields.Emisor.streetnumber)}
${getAttrPair("NumeroInterior",custom.foreignTradeInfo.satAddressFields.Emisor.apartment)}
<#if custom.foreignTradeInfo.satAddressFields.Emisor.satcountry == "MEX">
${getAttrPair("Colonia", custom.foreignTradeInfo.satAddressFields.Emisor.colonia?left_pad(4)[0..*4]?trim)}
<#else>
${getAttrPair("Colonia", custom.foreignTradeInfo.satAddressFields.Emisor.colonia)}
</#if>
<#if custom.foreignTradeInfo.satAddressFields.Emisor.satcountry == "MEX">
${getAttrPair("Localidad",custom.foreignTradeInfo.satAddressFields.Emisor.city?left_pad(2)[0..*2]?trim)}
<#else>
${getAttrPair("Localidad",custom.foreignTradeInfo.satAddressFields.Emisor.city)}
</#if>
<#if custom.foreignTradeInfo.satAddressFields.Emisor.satcountry == "MEX">
${getAttrPair("Municipio",custom.foreignTradeInfo.satAddressFields.Emisor.village?left_pad(3)[0..*3]?trim)}
<#else>
${getAttrPair("Municipio",custom.foreignTradeInfo.satAddressFields.Emisor.village)}
</#if>
${getAttrPair("Estado",custom.foreignTradeInfo.satAddressFields.Emisor.satstate)}
${getAttrPair("Pais",custom.foreignTradeInfo.satAddressFields.Emisor.satcountry)}
${getAttrPair("CodigoPostal",custom.foreignTradeInfo.satAddressFields.Emisor.zip)}
/>
</fx:Emisor>
<fx:Receptor<#if customer.custentity_mx_rfc == "XEXX010101000"> NumRegIdTrib="${customer.defaulttaxreg}"</#if>>
<fx:Domicilio
<#if custom.foreignTradeInfo.satAddressFields.Receptor.satcountry == "MEX">
${getAttrPair("Calle",custom.foreignTradeInfo.satAddressFields.Receptor.streetname)}
<#else>
${getAttrPair("Calle",custom.foreignTradeInfo.satAddressFields.Receptor.address1)}
</#if>
${getAttrPair("NumeroExterior",custom.foreignTradeInfo.satAddressFields.Receptor.streetnumber)}
${getAttrPair("NumeroInterior",custom.foreignTradeInfo.satAddressFields.Receptor.apartment)}
<#if custom.foreignTradeInfo.satAddressFields.Receptor.satcountry == "MEX">
${getAttrPair("Colonia", custom.foreignTradeInfo.satAddressFields.Receptor.colonia?left_pad(4)[0..*4]?trim)}
<#else>
${getAttrPair("Colonia", custom.foreignTradeInfo.satAddressFields.Receptor.colonia)}
</#if>
<#if custom.foreignTradeInfo.satAddressFields.Receptor.satcountry == "MEX">
${getAttrPair("Localidad",custom.foreignTradeInfo.satAddressFields.Receptor.city?left_pad(2)[0..*2]?trim)}
<#else>
${getAttrPair("Localidad",custom.foreignTradeInfo.satAddressFields.Receptor.city)}
</#if>
<#if custom.foreignTradeInfo.satAddressFields.Receptor.satcountry == "MEX">
${getAttrPair("Municipio",custom.foreignTradeInfo.satAddressFields.Receptor.village?left_pad(3)[0..*3]?trim)}
<#else>
${getAttrPair("Municipio",custom.foreignTradeInfo.satAddressFields.Receptor.village)}
</#if>
${getAttrPair("Estado",custom.foreignTradeInfo.satAddressFields.Receptor.satstate)}
${getAttrPair("Pais",custom.foreignTradeInfo.satAddressFields.Receptor.satcountry)}
${getAttrPair("CodigoPostal",custom.foreignTradeInfo.satAddressFields.Receptor.zip)}
/>
</fx:Receptor>
<#if transaction.custbody_mft_addressee?has_content && transaction.custbody_mft_addressee.entityid != transaction.entity.entityid>
<fx:Destinatario NumRegIdTrib="${transaction.custbody_mft_addressee.defaulttaxreg}" Nombre="${transaction.custbody_mft_addressee.entityid}">
<fx:Domicilio
<#if custom.foreignTradeInfo.satAddressFields.Destinatario.satcountry == "MEX">
${getAttrPair("Calle",custom.foreignTradeInfo.satAddressFields.Destinatario.streetname)}
<#else>
${getAttrPair("Calle",custom.foreignTradeInfo.satAddressFields.Destinatario.address1)}
</#if>
${getAttrPair("NumeroExterior",custom.foreignTradeInfo.satAddressFields.Destinatario.streetnumber)}
${getAttrPair("NumeroInterior",custom.foreignTradeInfo.satAddressFields.Destinatario.apartment)}
<#if custom.foreignTradeInfo.satAddressFields.Destinatario.satcountry == "MEX">
${getAttrPair("Colonia", custom.foreignTradeInfo.satAddressFields.Destinatario.colonia?left_pad(4)[0..*4]?trim)}
<#else>
${getAttrPair("Colonia", custom.foreignTradeInfo.satAddressFields.Destinatario.colonia)}
</#if>
<#if custom.foreignTradeInfo.satAddressFields.Destinatario.satcountry == "MEX">
${getAttrPair("Localidad",custom.foreignTradeInfo.satAddressFields.Destinatario.city?left_pad(2)[0..*2]?trim)}
<#else>
${getAttrPair("Localidad",custom.foreignTradeInfo.satAddressFields.Destinatario.city)}
</#if>
<#if custom.foreignTradeInfo.satAddressFields.Destinatario.satcountry == "MEX">
${getAttrPair("Municipio",custom.foreignTradeInfo.satAddressFields.Destinatario.village?left_pad(3)[0..*3]?trim)}
<#else>
${getAttrPair("Municipio",custom.foreignTradeInfo.satAddressFields.Destinatario.village)}
</#if>
${getAttrPair("Estado",custom.foreignTradeInfo.satAddressFields.Destinatario.satstate)}
${getAttrPair("Pais",custom.foreignTradeInfo.satAddressFields.Destinatario.satcountry)}
${getAttrPair("CodigoPostal",custom.foreignTradeInfo.satAddressFields.Destinatario.zip)}
/>
</fx:Destinatario>
</#if>
<fx:Mercancias>
<#list custom.foreignTradeInfo.items as FTItem>
<#assign "item" = transaction.item[FTItem.line?number]>
<fx:Mercancia
NoIdentificacion="${item.item}"
<#if FTItem.satCustomsUnitCode != "99" && FTItem.satTariffItemCode!="">
FraccionArancelaria="${FTItem.satTariffItemCode}"
</#if>
<#if FTItem.satCustomsUnitCode != "" && FTItem.satCustomsUnitPrice != "" && FTItem.satCustomsQuantity != "">
CantidadAduana="${FTItem.satCustomsQuantity}"
</#if>
<#if FTItem.satCustomsUnitCode != "">
UnidadAduana="${FTItem.satCustomsUnitCode?number?string["00"]}"
</#if>
<#if FTItem.satCustomsUnitPrice != "">
ValorUnitarioAduana="${FTItem.satCustomsUnitPrice?number?string["0.00"]}"
</#if>
<#if FTItem.satUSDCustomsAmount != "">
ValorDolares="${FTItem.satUSDCustomsAmount?number?string["0.00"]}"
</#if>>
<#if item.type != "service" && (FTItem.manufacturer != "" || FTItem.mpn != "")>
<fx:DescripcionesEspecificas<#if FTItem.manufacturer != ""> Marca="${FTItem.manufacturer}"</#if><#if FTItem.mpn != ""> NumeroSerie="${FTItem.mpn}"</#if> />
</#if>
</fx:Mercancia>
</#list>
</fx:Mercancias>
</fx:ComercioExterior11>
</fx:Complementos>
</#if>
<fx:ComprobanteEx>
<fx:TerminosDePago>
<#if (paymentTerm!"")?has_content>
<fx:MetodoDePago>${paymentTerm}</fx:MetodoDePago>
</#if>
<#if transaction.terms?has_content>
<fx:CondicionesDePago>${transaction.terms}</fx:CondicionesDePago>
</#if>
</fx:TerminosDePago>
</fx:ComprobanteEx>
</fx:FactDocMX>