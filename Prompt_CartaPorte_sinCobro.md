# Prompt Maestro Para Plantilla *.FTL Carta Porte Sin cobro*
---
## Esta Plantilla Se ejecutara unicamente desde las transacciones Ejecucion de Orden de Venta *(netsuite internalid: itemfulfillment)*

### Documentacion de Facturama:

#### Documentation Index
> Fetch the complete documentation index at: https://facturama.mintlify.site/llms.txt
> Use this file to discover all available pages before exploring further.

#### Carta Porte
> Complemento obligatorio para el traslado de mercancías por carretera federal. Requerido desde junio 2021.

##### ¿Qué es la Carta Porte?

La Carta Porte es un complemento del CFDI que acredita el traslado legal de mercancías en territorio nacional. Es **obligatoria** para:

* Transportistas que prestan servicio de traslado de bienes
* Propietarios que transportan sus propias mercancías por carretera federal

Sin Carta Porte, las autoridades pueden detener el transporte y aplicar multas.

##### ¿Cuándo se requiere?

| Situación                              | ¿Requiere Carta Porte?  |
| -------------------------------------- | ----------------------- |
| Transporte propio en carretera federal | Sí                      |
| Servicio de flete / logística          | Sí                      |
| Traslado local (mismo municipio)       | No                      |
| Transporte aéreo o marítimo            | Sí (versión específica) |

##### Tipo de CFDI a usar

| Caso                            | CfdiType       | Descripción                            |
| ------------------------------- | -------------- | -------------------------------------- |
| Transportista presta servicio   | `I` (Ingreso)  | El cliente paga por el flete           |
| Propietario traslada sus bienes | `T` (Traslado) | Sin cobro, solo acredita el movimiento |

#### Traslado (T)

No representa un ingreso, solo acredita el movimiento legal de mercancías en territorio nacional. Siempre acompaña a la Carta Porte.

```json theme={null}
{
  "CfdiType": "T",
  "Items": [
    {
      "ProductCode": "78101800",
      "Description": "Transporte de carga por carretera",
      "IdentificationNumber": "1123",
      "UnitCode": "E48",
      "UnitPrice": 0,
      "Quantity": 1,
      "Subtotal": 0,
      "TaxObject": "01",
      "Total": 0
    }
  ],
  "Complemento": {
    "CartaPorte31": {}
  }
}
```

**Cuándo usarlo:**

* Propietario que mueve sus propias mercancías entre almacenes
* Transporte sin cobro de flete

##### Estructura básica

```json theme={null}
{
  "NameId": "36",
  "Currency": "MXN",
  "Folio": "1",
  "Serie": "CCP",
  "CfdiType": "I",
  "PaymentForm": "03",
  "PaymentMethod": "PUE",
  "OrderNumber": "TEST-001",
  "ExpeditionPlace": "78000",
  "Date": "2024-06-25T12:00:00",
  "PaymentConditions": "CARTA PORTE",
  "Observations": "Elemento Observaciones solo visible en PDF",
  "Exportation": "01",
  "Receiver": {
    "Rfc": "EKU9003173C9",
    "Name": "ESCUELA KEMPER URGATE",
    "CfdiUse": "S01",
    "FiscalRegime": "601",
    "TaxZipCode": "42501"
  },
  "Items": [
    {
      "ProductCode": "78101800",
      "IdentificationNumber": "UT421511",
      "Description": "Transporte de carga por carretera",
      "UnitCode": "H87",
      "Unit": "Pieza",
      "UnitPrice": 100.00,
      "Quantity": 1,
      "Subtotal": 100.0,
      "TaxObject": "01",
      "Total": 100.0
    }
  ],
  "Complemento": {
    "CartaPorte31": {
      "IdCCP": "CCCBCD94-870A-4332-A52A-A52AA52AA52A",
      "TranspInternac": "No",
      "TotalDistRec": "1",
      "RegistroISTMO": "Sí",
      "UbicacionPoloOrigen": "01",
      "UbicacionPoloDestino": "01",
      "Ubicaciones": [
        {
          "TipoUbicacion": "Origen",
          "IDUbicacion": "OR101010",
          "RFCRemitenteDestinatario": "EKU9003173C9",
          "NombreRemitenteDestinatario": "NombreRemitenteDestinatario1",
          "FechaHoraSalidaLlegada": "2023-08-01T00:00:00",
          "Domicilio": {
            "Calle": "Calle1",
            "NumeroExterior": "211",
            "NumeroInterior": "212",
            "Colonia": "1957",
            "Localidad": "13",
            "Referencia": "casa blanca",
            "Municipio": "011",
            "Estado": "CMX",
            "Pais": "MEX",
            "CodigoPostal": "13250"
          }
        },
        {
          "TipoUbicacion": "Destino",
          "IDUbicacion": "DE202020",
          "RFCRemitenteDestinatario": "EKU9003173C9",
          "NombreRemitenteDestinatario": "NombreRemitenteDestinatario2",
          "FechaHoraSalidaLlegada": "2023-08-01T00:00:01",
          "DistanciaRecorrida": "1",
          "Domicilio": {
            "Calle": "Calle2",
            "NumeroExterior": "214",
            "NumeroInterior": "215",
            "Colonia": "0347",
            "Localidad": "23",
            "Referencia": "casa negra",
            "Municipio": "004",
            "Estado": "COA",
            "Pais": "MEX",
            "CodigoPostal": "25350"
          }
        }
      ],
      "Mercancias": {
        "PesoBrutoTotal": "1.0",
        "UnidadPeso": "XBX",
        "NumTotalMercancias": "1",
        "LogisticaInversaRecoleccionDevolucion": "Sí",
        "Mercancia": [
          {
            "BienesTransp": "11121900",
            "Descripcion": "Accesorios de equipo de telefonía",
            "Cantidad": "1.0",
            "ClaveUnidad": "XBX",
            "MaterialPeligroso": "No",
            "PesoEnKg": "1",
            "DenominacionGenericaProd": "DenominacionGenericaProd1",
            "DenominacionDistintivaProd": "DenominacionDistintivaProd1",
            "Fabricante": "Fabricante1",
            "FechaCaducidad": "2028-01-01",
            "LoteMedicamento": "LoteMedic1",
            "RegistroSanitarioFolioAutorizacion": "RegistroSanita1",
            "CantidadTransporta": [
              {
                "Cantidad": "1",
                "IDOrigen": "OR101010",
                "IDDestino": "DE202020"
              }
            ]
          }
        ],
        "Autotransporte": {
          "PermSCT": "TPAF01",
          "NumPermisoSCT": "NumPermisoSCT1",
          "IdentificacionVehicular": {
            "ConfigVehicular": "VL",
            "PesoBrutoVehicular": "1",
            "PlacaVM": "plac892",
            "AnioModeloVM": "2020"
          },
          "Seguros": {
            "AseguraRespCivil": "AseguraRespCivil",
            "PolizaRespCivil": "123456789"
          },
          "Remolques": [
            {
              "SubTipoRem": "CTR004",
              "Placa": "VL45K98"
            }
          ]
        }
      },
      "FiguraTransporte": [
        {
          "TipoFigura": "01",
          "NombreFigura": "NombreFigura",
          "RFCFigura": "EKU9003173C9",
          "NumLicencia": "a234567890"
        }
      ]
    }
  }
}
```

##### Catálogos clave para Carta Porte

| Catálogo                    | Endpoint                                            |
| --------------------------- | --------------------------------------------------- |
| Tipos de permiso SCT        | `GET /api/catalogs/cartaporte/TipoPermiso`          |
| Configuraciones vehiculares | `GET /api/catalogs/cartaporte/ConfigAutotransporte` |
| Claves de unidad de peso    | `GET /api/catalogs/cartaporte/ClaveUnidadPeso`      |
| Bienes transportados        | `GET /api/catalogs/cartaporte/MaterialPeligroso`    |
| Claves de estado            | `GET /api/cartaporte/Estado`                        |

### Plantilla de Mysuite desplegada para las Ejecuciones:

```xml 
<?xml version="1.0" encoding="UTF-8"?>

<#setting locale = "en_US">

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

<#if customer.isperson == "T">
<#assign customerName = customer.firstname + ' ' + customer.lastname>
<#else>
<#assign "customerName" = customer.companyname>
</#if>

<#assign domicilioFiscalReceptor = customCompanyInfo.zip>
<#assign rfcReceptor = custom.companyInfo.rfc>

<#if customer.custentity_mx_sat_registered_name?has_content>
<#assign "nombreReceptor" = customer.custentity_mx_sat_registered_name>
<#else>
<#if transaction.entity?has_content>
<#assign "nombreReceptor" = transaction.entity>
<#else>
<#assign "nombreReceptor" = customCompanyInfo.custrecord_mx_sat_registered_name>
</#if>
</#if>

<#assign "summary" = custom.summary>
<#assign "satCodes" = custom.satcodes>
<#assign "companyTaxRegNumber" = custom.companyInfo.rfc>

<fx:FactDocMX
xmlns:fx="http://www.fact.com.mx/schema/fx"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
xsi:schemaLocation="http://www.fact.com.mx/schema/fx http://www.mysuitemex.com/fact/schema/fx_2010_g.xsd">
<fx:Version>8</fx:Version>
<fx:Identificacion>
<fx:CdgPaisEmisor>MX</fx:CdgPaisEmisor>
<fx:TipoDeComprobante>TRASLADO</fx:TipoDeComprobante>
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
<fx:TiempoDeEmision>${transaction.trandate?string.iso}T00:00:00</fx:TiempoDeEmision>
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
<fx:UUID>${transaction.recmachcustrecord_mx_rcs_orig_trans[cfdiIdx.index?number].custrecord_mx_rcs_uuid}</fx:UUID>
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
<fx:CdgPaisReceptor>MX</fx:CdgPaisReceptor>
<fx:RFCReceptor>${rfcReceptor}</fx:RFCReceptor>
<!--<fx:NombreReceptor>${nombreReceptor}</fx:NombreReceptor>-->
<!-- <fx:NombreReceptor><#if transaction.entity?has_content>${transaction.entity}<#else>${customCompanyInfo.custrecord_mx_sat_registered_name}</#if></fx:NombreReceptor> -->
<fx:NombreReceptor>${customCompanyInfo.custrecord_mx_sat_registered_name}</fx:NombreReceptor>
<fx:DomicilioFiscalReceptor>${domicilioFiscalReceptor}</fx:DomicilioFiscalReceptor>
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
<#assign "itemUnits" = item.unitsdisplay>
</#if>
<fx:Concepto>
<fx:Cantidad>${item.quantity?string["0.000000"]}</fx:Cantidad>
<fx:ClaveUnidad>${itemSatUnitCode}</fx:ClaveUnidad>
<#if itemUnits?has_content>
<fx:UnidadDeMedida>${itemUnits}</fx:UnidadDeMedida>
</#if>
<fx:ClaveProdServ>${itemSatCodes.itemCode}</fx:ClaveProdServ>
<fx:Codigo>${item.item}</fx:Codigo>
<fx:Descripcion>${item.description}</fx:Descripcion>
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
</fx:Opciones>
</fx:Concepto>
</#list>
</fx:Conceptos>
<fx:Totales>
<#if transaction.custbody_drt_cp_moneda?has_content && transaction.custbody_drt_cp_moneda?string == "MXN">
<fx:Moneda>XXX</fx:Moneda>
<#else>
<fx:Moneda>${currencyCode}</fx:Moneda>
<fx:TipoDeCambioVenta>${exchangeRate}</fx:TipoDeCambioVenta>
</#if>
<fx:SubTotalBruto>0</fx:SubTotalBruto>
<fx:SubTotal>0</fx:SubTotal>
<fx:Total>0</fx:Total>
<fx:TotalEnLetra>-</fx:TotalEnLetra>
</fx:Totales>

<#if transaction.custbody_drt_cp_complemento_cartaporte?has_content>

<fx:Complementos>
<#function concatCartaPorte>
<#local str = "">
<#if transaction.custbody_drt_cp_entradasalidamerc?has_content && transaction.custbody_drt_cp_transpinternac?string != "No">
<#local str += " EntradaSalidaMerc=\"">
<#local str += transaction.custbody_drt_cp_entradasalidamerc?string>
<#local str += "\"">
</#if>
<#if transaction.custbody_drt_cp_PaisOrigenDestino?has_content && transaction.custbody_drt_cp_PaisOrigenDestino?string != "MEX">
<#local str += " PaisOrigenDestino=\"">
<#local str += transaction.custbody_drt_cp_PaisOrigenDestino?string>
<#local str += "\"">
</#if>
<#if transaction.custbody_drt_cp_ViaEntradaSalida?has_content && transaction.custbody_drt_cp_transpinternac?string != "No">
<#local str += " ViaEntradaSalida=\"">
<#local str += transaction.custbody_drt_cp_ViaEntradaSalida?string>
<#local str += "\"">
</#if>
<#if transaction.custbody_drt_cp_TotalDistRec?has_content && transaction.custbody_drt_cp_tipo_transporte !="Transporte Aéreo">
<#local str += " TotalDistRec=\"">
<#local str += transaction.custbody_drt_cp_TotalDistRec?string["0.00"]>
<#local str += "\"">
</#if>
<#if transaction.custbody_drt_cp_registro_istmo?has_content && transaction.custbody_drt_cp_registro_istmo?string != "No">
<#local str += " UbicacionPoloOrigen=\"">
<#local str += transaction.custbody_drt_cp_ubicacion_polo_origen?string>
<#local str += "\"">
<#local str += " UbicacionPoloDestino=\"">
<#local str += transaction.custbody_drt_cp_ubicacion_polo_destino?string>
<#local str += "\"">
</#if>
<#return str>
</#function>
<fx:CartaPorte31 Version="3.1" IdCCP="${transaction.custbody_mcp_idccp}" TranspInternac="${transaction.custbody_drt_cp_transpinternac}"${concatCartaPorte()}>
<#if transaction.custbody_drt_cp_transpinternac?string != "No" && transaction.custbody_drt_cp_entradasalidamerc?has_content>
<fx:RegimenesAduaneros>
<fx:RegimenAduaneroCCP RegimenAduanero="${transaction.custbody_drt_cp_regimen_aduanero}"/>
</fx:RegimenesAduaneros>
</#if>

<#if transaction.custbody_drt_cp_json_ubicacion?has_content>
<#assign objUbicaciones=transaction.custbody_drt_cp_json_ubicacion?eval>
<fx:Ubicaciones>


<#list objUbicaciones as ubicacion>

<fx:Ubicacion TipoUbicacion="${ubicacion.tipoUbicacion}"<#if ubicacion.idUbicacion?has_content> IDUbicacion="${ubicacion.idUbicacion}"</#if><#if ubicacion.rfcRemitenteDestinatario?has_content> RFCRemitenteDestinatario="${ubicacion.rfcRemitenteDestinatario}"</#if><#if ubicacion.nombreRemitenteDestinatario?has_content> NombreRemitenteDestinatario="${ubicacion.nombreRemitenteDestinatario}"</#if><#if ubicacion.numRegIdTrib?has_content> NumRegIdTrib="${ubicacion.numRegIdTrib}"</#if><#if ubicacion.residenciaFiscal?has_content && ubicacion.residenciaFiscal?string != "MEX"> ResidenciaFiscal="${ubicacion.residenciaFiscal}"</#if><#if ubicacion.numEstacion?has_content> NumEstacion="${ubicacion.numEstacion}"</#if><#if ubicacion.nombreEstacion?has_content> NombreEstacion="${ubicacion.nombreEstacion}"</#if><#if ubicacion.navegacionTrafico?has_content> NavegacionTrafico="${ubicacion.navegacionTrafico}"</#if><#if ubicacion.tipoUbicacion?string == "Origen"> FechaHoraSalidaLlegada="${transaction.custbody_drt_cp_fechahora_salida?string.iso_nz}"<#else> FechaHoraSalidaLlegada="${transaction.custbody_drt_cp_fechahora_llegada?string.iso_nz}"</#if><#if ubicacion.tipoEstacion?has_content> TipoEstacion="${ubicacion.tipoEstacion}"</#if><#if ubicacion.tipoUbicacion?string != "Origen" && transaction.custbody_drt_cp_totaldistrec?has_content> DistanciaRecorrida="${transaction.custbody_drt_cp_totaldistrec?string["0.00"]}"</#if>>
<fx:Domicilio <#if ubicacion.domicilioCalle?has_content>Calle="${ubicacion.domicilioCalle}" </#if><#if ubicacion.domicilioNumExt?has_content>NumeroExterior="${ubicacion.domicilioNumExt}" </#if><#if ubicacion.domicilioNumInt?has_content>NumeroInterior="${ubicacion.domicilioNumInt}" </#if><#if ubicacion.domicilioColonia?has_content>Colonia="${ubicacion.domicilioColonia}" </#if><#if ubicacion.domicilioLocalidad?has_content>Localidad="${ubicacion.domicilioLocalidad}" </#if><#if ubicacion.domicilioReferencia?has_content>Referencia="${ubicacion.domicilioReferencia}" </#if><#if ubicacion.domicilioMunicipio?has_content>Municipio="${ubicacion.domicilioMunicipio}" </#if>Estado="${ubicacion.domicilioEstado}" Pais="${ubicacion.domicilioPais}" CodigoPostal="${ubicacion.domicilioCodigoPostal}"/>
</fx:Ubicacion>
</#list>


</fx:Ubicaciones>
</#if>

<fx:Mercancias PesoBrutoTotal="${transaction.custbody_drt_cp_pesobrutototal?string["0.000"]}" UnidadPeso="${transaction.custbody_drt_cp_clave_unidadpeso}"<#if transaction.custbody_drt_cp_pesonetototal?has_content> PesoNetoTotal="${transaction.custbody_drt_cp_pesonetototal?string["0.000"]}"</#if> NumTotalMercancias="${transaction.custbody_drt_cp_numtotalmercancias}"<#if transaction.custbody_drt_cp_cargoportasacion?has_content> CargoPorTasacion="${transaction.custbody_drt_cp_cargoportasacion?string["0.000000"]}"</#if><#if transaction.custbody_drt_cp_tipo_transporte?string == "Autotransporte Federal"> LogisticaInversaRecoleccionDevolucion="${transaction.custbody_drt_cp_logistica_inversa_rede}"</#if>>


<#list custom.items as customItem>
<#assign "item" = transaction.item[customItem.line?number]>
<#assign "taxes" = customItem.taxes>
<#assign "itemSatCodes" = satCodes.items[customItem.line?number]>
<#if customItem.type == "Group" || customItem.type == "Kit">
<#assign "itemSatUnitCode" = "H87">
<#assign "itemUnits" = "Pieza">
<#else>
<#assign "itemSatUnitCode" = (customItem.satUnitCode)!"">
<#assign "itemUnits" = item.unitsdisplay>
</#if>


<#function concatSectorCofepris>
<#local str = "">

<#if item.custcol_drt_cp_sector_cofepris?string == "01" || item.custcol_drt_cp_sector_cofepris?string == "03" && item.custcol_drt_cp_denomina_generica_prod?has_content>
<#local str += " DenominacionGenericaProd=\"">
<#local str += item.custcol_drt_cp_denomina_generica_prod?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_sector_cofepris?string == "01" || item.custcol_drt_cp_sector_cofepris?string == "03" && item.custcol_drt_cp_denomina_distinti_prod?has_content>
<#local str += " DenominacionDistintivaProd=\"">
<#local str += item.custcol_drt_cp_denomina_distinti_prod?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_sector_cofepris?string == "01" || item.custcol_drt_cp_sector_cofepris?string == "02" || item.custcol_drt_cp_sector_cofepris?string == "03" && item.custcol_drt_cp_fabricante?has_content>
<#local str += " Fabricante=\"">
<#local str += item.custcol_drt_cp_fabricante?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_sector_cofepris?string == "01" || item.custcol_drt_cp_sector_cofepris?string == "02" || item.custcol_drt_cp_sector_cofepris?string == "03" && item.custcol_drt_cp_fecha_caducidad?has_content>
<#local str += " FechaCaducidad=\"">
<#local str += item.custcol_drt_cp_fecha_caducidad?string.iso>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_sector_cofepris?string == "01" || item.custcol_drt_cp_sector_cofepris?string == "02" || item.custcol_drt_cp_sector_cofepris?string == "03" && item.custcol_drt_cp_lote_medicamento?has_content>
<#local str += " LoteMedicamento=\"">
<#local str += item.custcol_drt_cp_lote_medicamento?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_sector_cofepris?string == "01" || item.custcol_drt_cp_sector_cofepris?string == "02" || item.custcol_drt_cp_sector_cofepris?string == "03" && item.custcol_drt_cp_forma_farmaceutica?has_content>
<#local str += " FormaFarmaceutica=\"">
<#local str += item.custcol_drt_cp_forma_farmaceutica?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_sector_cofepris?string == "01" || item.custcol_drt_cp_sector_cofepris?string == "02" || item.custcol_drt_cp_sector_cofepris?string == "03" && item.custcol_drt_cp_condiciones_esp_transp?has_content>
<#local str += " CondicionesEspTransp=\"">
<#local str += item.custcol_drt_cp_condiciones_esp_transp?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_sector_cofepris?string == "01" || item.custcol_drt_cp_sector_cofepris?string == "03" && item.custcol_drt_cp_registro_sanitario_fol?has_content>
<#local str += " RegistroSanitarioFolioAutorizacion=\"">
<#local str += item.custcol_drt_cp_registro_sanitario_fol?string>
<#local str += "\"">
</#if>


<#if item.custcol_drt_cp_sector_cofepris?string == "02" || item.custcol_drt_cp_sector_cofepris?string == "05" && item.custcol_drt_cp_nom_ingrediente_activo?has_content>
<#local str += " NombreIngredienteActivo=\"">
<#local str += item.custcol_drt_cp_nom_ingrediente_activo?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_sector_cofepris?string == "02" || item.custcol_drt_cp_sector_cofepris?string == "04" && item.custcol_drt_cp_nomquimico?has_content>
<#local str += " NomQuimico=\"">
<#local str += item.custcol_drt_cp_nomquimico?string>
<#local str += "\"">
</#if>


<#if item.custcol_drt_cp_sector_cofepris?string == "04" && item.custcol_drt_cp_num_cas?has_content>
<#local str += " NumCAS=\"">
<#local str += item.custcol_drt_cp_num_cas?string>
<#local str += "\"">
</#if>


<#if item.custcol_drt_cp_sector_cofepris?string == "05" && item.custcol_drt_cp_num_reg_san_plag_cofep?has_content>
<#local str += " NumRegSanPlagCOFEPRIS=\"">
<#local str += item.custcol_drt_cp_num_reg_san_plag_cofep?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_sector_cofepris?string == "05" && item.custcol_drt_cp_datos_fabricante?has_content>
<#local str += " DatosFabricante=\"">
<#local str += item.custcol_drt_cp_datos_fabricante?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_sector_cofepris?string == "05" && item.custcol_drt_cp_datos_formulador?has_content>
<#local str += " DatosFormulador=\"">
<#local str += item.custcol_drt_cp_datos_formulador?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_sector_cofepris?string == "05" && item.custcol_drt_cp_datos_maquilador?has_content>
<#local str += " DatosMaquilador=\"">
<#local str += item.custcol_drt_cp_datos_maquilador?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_sector_cofepris?string == "05" && item.custcol_drt_cp_uso_autorizado?has_content>
<#local str += " UsoAutorizado=\"">
<#local str += item.custcol_drt_cp_uso_autorizado?string>
<#local str += "\"">
</#if>


<#if transaction.custbody_drt_cp_transpinternac?string != "No" && transaction.custbody_drt_cp_entradasalidamerc?string == "Entrada" && item.custcol_drt_cp_sector_cofepris?string == "01" || item.custcol_drt_cp_sector_cofepris?string == "02" || item.custcol_drt_cp_sector_cofepris?string == "03" && item.custcol_drt_cp_permiso_importacion?has_content>
<#local str += " PermisoImportacion=\"">
<#local str += item.custcol_drt_cp_permiso_importacion?string>
<#local str += "\"">
</#if>
<#if transaction.custbody_drt_cp_transpinternac?string != "No" && transaction.custbody_drt_cp_entradasalidamerc?string == "Entrada" && item.custcol_drt_cp_sector_cofepris?string == "01" || item.custcol_drt_cp_sector_cofepris?string == "02" || item.custcol_drt_cp_sector_cofepris?string == "04" || item.custcol_drt_cp_sector_cofepris?string == "05" && item.custcol_drt_cp_folio_impo_vucem?has_content>
<#local str += " FolioImpoVUCEM=\"">
<#local str += item.custcol_drt_cp_folio_impo_vucem?string>
<#local str += "\"">
</#if>
<#if transaction.custbody_drt_cp_transpinternac?string != "No" && transaction.custbody_drt_cp_entradasalidamerc?string == "Entrada" && item.custcol_drt_cp_sector_cofepris?string == "04" && item.custcol_drt_cp_razon_social_emp_imp?has_content>
<#local str += " RazonSocialEmpImp=\"">
<#local str += item.custcol_drt_cp_razon_social_emp_imp?string>
<#local str += "\"">
</#if>
<#if transaction.custbody_drt_cp_transpinternac?string != "No" && item.custcol_drt_cp_tipo_materia?has_content>
<#local str += " TipoMateria=\"">
<#local str += item.custcol_drt_cp_tipo_materia?string>
<#local str += "\"">
</#if>
<#if transaction.custbody_drt_cp_transpinternac?string != "No" && item.custcol_drt_cp_tipo_materia?string == "05" && item.custcol_drt_cp_descripcion_materia?has_content>
<#local str += " DescripcionMateria=\"">
<#local str += item.custcol_drt_cp_descripcion_materia?string>
<#local str += "\"">
</#if>


<#return str>
</#function>

<fx:Mercancia BienesTransp="${itemSatCodes.itemCode}"<#if item.custcol_drt_cp_ClaveSTCC?has_content> ClaveSTCC="${item.custcol_drt_cp_ClaveSTCC}"</#if> Descripcion="${item.item?replace("\"","''")}" Cantidad="${item.quantity?string["0.000000"]}" ClaveUnidad="${itemSatUnitCode}" Unidad="${item.units}"<#if item.custcol_drt_cp_dimensiones?has_content> Dimensiones="${item.custcol_drt_cp_dimensiones}"</#if><#if item.custcol_drt_cp_MaterialPeligroso> MaterialPeligroso="Si" CveMaterialPeligroso="${item.custcol_drt_cp_CveMaterialPeligroso}"</#if><#if item.custcol_drt_cp_embalaje?has_content> Embalaje="${item.custcol_drt_cp_embalaje}"</#if><#if item.custcol_drt_cp_descripembalaje?has_content> DescripEmbalaje="${item.custcol_drt_cp_descripembalaje}"</#if> PesoEnKg="${item.custcol_drt_cp_pesoenkg?string["0.000"]}"<#if item.custcol_drt_cp_valormercancia?has_content> ValorMercancia="${item.custcol_drt_cp_valormercancia}"</#if><#if item.custbody_drt_cp_moneda?has_content> Moneda="${item.custbody_drt_cp_moneda}"</#if><#if item.custcol_drt_cp_fraccionarancelaria?has_content> FraccionArancelaria="${item.custcol_drt_cp_fraccionarancelaria}"</#if><#if item.custcol_drt_cp_uuidcomercioext?has_content> UUIDComercioExt="${item.custcol_drt_cp_uuidcomercioext}"</#if> <#if item.custcol_drt_cp_sector_cofepris?has_content>SectorCOFEPRIS="${item.custcol_drt_cp_sector_cofepris}"${concatSectorCofepris()}</#if>>

<#function concatDocumentacionAduanera>
<#local str = "">

<#if item.custcol_drt_cp_tipo_documento?has_content>
<#local str += " TipoDocumento=\"">
<#local str += item.custcol_drt_cp_tipo_documento?string>
<#local str += "\"">
</#if>
<#if transaction.custbody_drt_cp_entradasalidamerc?string == "Entrada" && item.custcol_drt_cp_tipo_documento?string == "01" && item.custcol_drt_cp_num_pedimento?has_content>
<#local str += " NumPedimento=\"">
<#local str += item.custcol_drt_cp_num_pedimento?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_tipo_documento?string != "01" && item.custcol_drt_cp_ident_doc_aduanero?has_content>
<#local str += " IdentDocAduanero=\"">
<#local str += item.custcol_drt_cp_ident_doc_aduanero?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_num_pedimento?has_content && item.custcol_drt_cp_rfc_impo?has_content>
<#local str += " RFCImpo=\"">
<#local str += item.custcol_drt_cp_rfc_impo?string>
<#local str += "\"">
</#if>


<#return str>
</#function>

<#if transaction.custbody_drt_cp_transpinternac?string != "No" && transaction.custbody_drt_cp_entradasalidamerc?has_content>
<fx:DocumentacionAduanera ${concatDocumentacionAduanera()}/>
</#if>
<!--<#if item.custcol_drt_cp_pedimento?has_content>
<fx:Pedimentos Pedimento="${item.custcol_drt_cp_pedimento}"/>
</#if>-->
<#if item.custcol_drt_cp_numeroguiaidentificaci?has_content || item.custcol_drt_cp_descripguiaidentificac?has_content || item.custcol_drt_cp_pesoguiaidentificacion?has_content>
<fx:GuiasIdentificacion NumeroGuiaIdentificacion="${item.custcol_drt_cp_numeroguiaidentificaci}" DescripGuiaIdentificacion="${item.custcol_drt_cp_descripguiaidentificac}" PesoGuiaIdentificacion="${item.custcol_drt_cp_pesoguiaidentificacion?string["0.000"]}"/>
</#if>
<fx:CantidadTransporta Cantidad="${item.quantity?string["0.000000"]}" IDOrigen="${transaction.custbody_drt_cp_id_origen}" IDDestino="${transaction.custbody_drt_cp_id_destino}"<#if item.custcol_drt_cp_cvestransporte?has_content> CvesTransporte="${item.custcol_drt_cp_cvestransporte}"</#if>/>
<#if item.custcol_drt_cp_pesobruto?has_content || item.custcol_drt_cp_pesoneto?has_content || item.custcol_drt_pc_pesotara?has_content>
<#function concatNumPiezas>
<#local str = "">
<#if item.custcol_drt_cp_numpiezas?has_content>
<#local str += " NumPiezas=\"">
<#local str += item.custcol_drt_cp_numpiezas?string>
<#local str += "\"">
</#if>
<#return str>
</#function>
<#if transaction.custbody_drt_cp_tipo_transporte?has_content && transaction.custbody_drt_cp_tipo_transporte == "Transporte Marítimo">
<fx:DetalleMercancia UnidadPeso="${itemSatUnitCode}" PesoBruto="${item.custcol_drt_cp_pesobruto?string["0.000"]}" PesoNeto="${item.custcol_drt_cp_pesoneto?string["0.000"]}" PesoTara="${item.custcol_drt_pc_pesotara?string["0.000"]}" ${concatNumPiezas()}/>
</#if>
</#if>
</fx:Mercancia>
</#list>

<#if transaction.custbody_drt_cp_json_transporte?has_content && transaction.custbody_drt_cp_tipo_transporte?has_content>
<#if transaction.custbody_drt_cp_tipo_transporte =="Autotransporte Federal">
<#assign objTransporte=transaction.custbody_drt_cp_json_transporte?eval>
<#list objTransporte as transporte>

<fx:Autotransporte PermSCT="${transporte.permSCT}" NumPermisoSCT="${transporte.numPermisoSCT}">
<fx:IdentificacionVehicular ConfigVehicular="${transporte.configVehicular}" PlacaVM="${transporte.placaVM}" AnioModeloVM="${transporte.anioModeloVM}" <#if transaction.custbody_drt_cp_peso_bruto_vehicular?has_content> PesoBrutoVehicular="${transaction.custbody_drt_cp_peso_bruto_vehicular ?string["0"]}"</#if>/>
<fx:Seguros AseguraRespCivil="${transporte.aseguraRespCivil}" PolizaRespCivil="${transporte.polizaRespCivil}"/>
<#if transporte.remolques?has_content>
<fx:Remolques>
<#assign objRemolque=transporte.remolques>
<#list objRemolque as remolque>
<fx:Remolque SubTipoRem="${remolque.subTipoRem}" Placa="${remolque.placaRem}"/>
</#list>
</fx:Remolques>
</#if>
</fx:Autotransporte>

</#list>
</#if>
<#if transaction.custbody_drt_cp_tipo_transporte =="Transporte Aéreo">
<#assign objTransporte=transaction.custbody_drt_cp_json_transporte?eval>
<#list objTransporte as transporte>

<fx:TransporteAereo PermSCT="${transporte.permSCT}" NumPermisoSCT="${transporte.numPermisoSCT}"<#if transporte.matriculaAeronave?has_content> MatriculaAeronave="${transporte.matriculaAeronave}"</#if><#if transporte.nombreAseg?has_content> NombreAseg="${transporte.nombreAseg}"</#if><#if transporte.numPolizaSeguro?has_content> NumPolizaSeguro="${transporte.numPolizaSeguro}"</#if> NumeroGuia="${transporte.numeroGuia}"<#if transporte.lugarContrato?has_content> LugarContrato="${transporte.lugarContrato}"</#if> CodigoTransportista="${transporte.codigoTransportista}"<#if transporte.rfcEmbarcador?has_content> RFCEmbarcador="${transporte.rfcEmbarcador}"</#if><#if transporte.numRegIdTribEmbarc?has_content> NumRegIdTribEmbarc="${transporte.numRegIdTribEmbarc}"</#if><#if transporte.residenciaFiscalEmbarc?has_content> ResidenciaFiscalEmbarc="${transporte.residenciaFiscalEmbarc}"</#if><#if transporte.nombreEmbarcador?has_content> NombreEmbarcador="${transporte.nombreEmbarcador}"</#if>/>

</#list>
</#if>
<#if transaction.custbody_drt_cp_tipo_transporte =="Transporte Marítimo">
<#assign objTransporte=transaction.custbody_drt_cp_json_transporte?eval>
<#list objTransporte as transporte>

<fx:Autotransporte PermSCT="${transporte.permSCT}" NumPermisoSCT="${transporte.numPermisoSCT}">
<fx:IdentificacionVehicular ConfigVehicular="${transporte.configVehicular}" PlacaVM="${transporte.placaVM}" AnioModeloVM="${transporte.anioModeloVM}"/>
<fx:Seguros AseguraRespCivil="${transporte.aseguraRespCivil}" PolizaRespCivil="${transporte.polizaRespCivil}"/>
<#if transporte.remolques?has_content>
<fx:Remolques>
<#assign objRemolque=transporte.remolques>
<#list objRemolque as remolque>
<fx:Remolque SubTipoRem="${remolque.subTipoRem}" Placa="${remolque.placaRem}"/>
</#list>
</fx:Remolques>
</#if>
</fx:Autotransporte>

</#list>
</#if>
<#if transaction.custbody_drt_cp_tipo_transporte =="Transporte Ferroviario">
<#assign objTransporte=transaction.custbody_drt_cp_json_transporte?eval>
<#list objTransporte as transporte>

<fx:Autotransporte PermSCT="${transporte.permSCT}" NumPermisoSCT="${transporte.numPermisoSCT}">
<fx:IdentificacionVehicular ConfigVehicular="${transporte.configVehicular}" PlacaVM="${transporte.placaVM}" AnioModeloVM="${transporte.anioModeloVM}"/>
<fx:Seguros AseguraRespCivil="${transporte.aseguraRespCivil}" PolizaRespCivil="${transporte.polizaRespCivil}"/>
<#if transporte.remolques?has_content>
<fx:Remolques>
<#assign objRemolque=transporte.remolques>
<#list objRemolque as remolque>
<fx:Remolque SubTipoRem="${remolque.subTipoRem}" Placa="${remolque.placaRem}"/>
</#list>
</fx:Remolques>
</#if>
</fx:Autotransporte>

</#list>
</#if>
</#if>

</fx:Mercancias>

<#if transaction.custbody_drt_cp_json_figura_transporte?has_content>
<#assign objfigTransp=transaction.custbody_drt_cp_json_figura_transporte?eval>
<fx:FiguraTransporte>
<#list objfigTransp as figTransp>

<fx:TiposFigura TipoFigura="${figTransp.tipoFigura}"<#if figTransp.rfcfigura?has_content> RFCFigura="${figTransp.rfcfigura}"</#if><#if figTransp.numlicencia?has_content> NumLicencia="${figTransp.numlicencia}"</#if><#if figTransp.nombrefigura?has_content> NombreFigura="${figTransp.nombrefigura}"</#if><#if figTransp.numregidtribfigura?has_content> NumRegIdTribFigura="${figTransp.numregidtribfigura}"</#if><#if figTransp.residenciafiscalfigura?has_content && figTransp.residenciafiscalfigura?string != "MEX"> ResidenciaFiscalFigura="${figTransp.residenciafiscalfigura}"</#if>>
<!-- <#if figTransp.partetransporte?has_content>
<fx:PartesTransporte ParteTransporte="${figTransp.partetransporte}"/>
</#if> -->
<fx:Domicilio <#if figTransp.calle?has_content>Calle="${figTransp.calle}" </#if><#if figTransp.numeroexterior?has_content>NumeroExterior="${figTransp.numeroexterior}" </#if><#if figTransp.numerointerior?has_content>NumeroInterior="${figTransp.numerointerior}" </#if><#if figTransp.colonia?has_content>Colonia="${figTransp.colonia}" </#if><#if figTransp.localidad?has_content>Localidad="${figTransp.localidad}" </#if><#if figTransp.referencia?has_content>Referencia="${figTransp.referencia}" </#if><#if figTransp.municipio?has_content>Municipio="${figTransp.municipio}" </#if>Estado="${figTransp.estado}" Pais="${figTransp.residenciafiscalfigura}" CodigoPostal="${figTransp.codigopostal}"/>
</fx:TiposFigura>

</#list>
</fx:FiguraTransporte>
</#if>
</fx:CartaPorte31>
</fx:Complementos>
</#if>
</fx:FactDocMX>
```

### XML de Transaccion ItemFullFilment:
```xml

<nsResponse>
<record recordType="itemfulfillment" id="1520482" perm="4" fields="_eml_nkey_,_multibtnstate_,selectedtab,nsapiPI,nsapiSR,nsapiVF,nsapiFC,nsapiPS,nsapiVI,nsapiVD,nsapiPD,nsapiVL,nsapiRC,nsapiLI,nsapiLC,nsapiCT,nsbrowserenv,wfPI,wfSR,wfVF,wfFC,wfPS,type,id,externalid,whence,customwhence,entryformquerystring,_csrf,wfinstances,dbstrantype,bulk,createddate,lastmodifieddate,periodclosed,allownonglchanges,taxperiod,version,voided,linked,voidblockedbylinks,linkedrevrecje,linkedclosedperioddiscounts,entityname,trantypepermcheck,ntype,deletionreason,deletionreasonmemo,nluser,nlrole,nldept,nlloc,nlsub,baserecordtype,nlapiCC,entitycurrency,semail,storeorder,website,totalquantity,prevdate,ppsetbyuser,ppsetbyuservalue,pp_s,pp_e,datetoday,orderid,ordertype,ismultisubsidiary,sonum,billingtype,kcurrency,currencycode,exchangerate,usdtosubsidiaryexchangerate,isbasecurrency,subsidiary,balance,overallbalance,primarycurrency,primarycurrencyfxrate,overallunbilledorders,credlim,unbilledorders,credholdoverride,manualcredithold,credholdentity,checkcreditlimit,custbody_psg_ei_content,custbody_psg_ei_content_storage_mode,custbody_psg_ei_content_file,tranid,createdfrom,trandate,custbodydrt_employe,entity,memo,custbody_alm_date_time,custbody_pfp_horadesalida_,custbody_drt_fecha_hora_entrega,custbody_pfp_lugardeentrega_,custbody_pfp_chofer_,custbody_pfp_unidad_,custbody_pfp_tipodematerial_,custbody_pfp_otrolugardeentrega_,custbody_pfp_evidenciadesalida_,custbody_pfp_condiciondepago_,excludefromglnumbering,transactionnumber,postingperiod,partner,custbody_mcp_sat_c_carta_porte,custbody_alm_hora_retorno,custbody_pdf_salida_generado,custbody_ei_ds_txn_identifier,custbody_psg_ei_trans_edoc_standard,custbody_psg_ei_qr_string,custbody_psg_ei_template,custbody_psg_ei_status,custbody_psg_ei_template_inlinehelp,custbody_psg_ei_sending_method,custbody_edoc_gen_trans_pdf,custbody_edoc_generated_pdf,custbody_psg_ei_generated_edoc,custbody_psg_ei_certified_edoc,custbody_psg_ei_digitalsignature_label,custbody_drt_motivo_cancelacion,custbody_drt_transaccion_relacionada,custbody_drt_folio_sustitucion,custbody_psg_ei_qr_code,custbody_ei_network_id,custbody_ei_network_name,custbody_ei_network_status,custbody_ei_network_updated_date_time,custbody_sads_fama_cfdi_resp_id,custbody_mx_cfdi_cadena_original,custbody_mx_cfdi_signature,custbody_mx_cfdi_sat_signature,custbody_mx_cfdi_sat_serial,custbody_mx_cfdi_qr_code,custbody_mx_cfdi_issue_datetime,custbody_mx_cfdi_issuer_serial,custbody_mx_cfdi_certify_timestamp,custbody_mx_cfdi_usage,custbody_mx_cfdi_uuid,custbody_mx_cfdi_sat_addendum,custbody_mx_cfdi_folio,custbody_mx_cfdi_serie,custbody_mcp_international_transport,custbody_mcp_entry_or_exit_of_goods,custbody_mx_cfdi_sat_export_type,custbody_drt_custbody_mx_cfdi_qr_code,custbody_drt_custbody_mx_cfdi_sat_sign,custbody_drt_custbody_mx_cfdi_signatur,custbody_drt_mx_cfdi_cadena_original,custbody_mcp_idccp,custbody_mcp_rev_logst_colls_ret,custbody_mcp_sat_customs_regime,custbody_drt_cp_complemento_cartaporte,custbody_drt_cp_transpinternac,custbody_drt_cp_entradasalidamerc,custbody_drt_cp_viaentradasalida,custbody_drt_cp_totaldistrec,custbody_drt_cp_moneda,custbody_drt_cp_cargoportasacion,custbody_drt_cp_rfc_receptor,custbody_drt_cp_logistica_inversa_rede,custbody_drt_cp_origen,custbody_drt_cp_id_origen,custbody_drt_cp_destino,custbody_drt_cp_id_destino,custbody_drt_cp_fechahora_salida,custbody_drt_cp_fechahora_llegada,custbody_drt_cp_paisorigendestino,custbody_drt_cp_transporte,custbody_drt_cp_tipo_transporte,custbody_drt_cp_figura_transporte,custbody_drt_cp_numtotalmercancias,custbody_drt_cp_unidadpeso,custbody_drt_cp_clave_unidadpeso,custbody_drt_cp_pesobrutototal,custbody_drt_cp_pesonetototal,custbody_drt_cp_json_ubicacion,custbody_drt_cp_json_figura_transporte,custbody_drt_cp_json_transporte,custbody_drt_cp_url_string,custbody_drt_cp_regimen_aduanero,custbody_drt_cp_registro_istmo,custbody_drt_cp_ubicacion_polo_origen,custbody_drt_cp_ubicacion_polo_destino,custbody_drt_cp_url_string_2,custbody_3rd_party_billing_enabled,custbody_packship_carrier_code,custbody_package_code_defaulted,custbody_default_package_code_id,custbody_billing_account_zip,custbody_billing_account_type,custbody_billing_account_number,custbody_billing_account_country,custbody_drtpesototal,custbody_drtvolumentotal,custbody_drtvolumentotalpies,custbody_drtcantidad,custbody_wmsse_fulfill_shipcost,custbody_wmsse_transactiontype,custbody_wms_asngeneration,custbody_wms_ordertype,custbodyalm_consignatario_name,custbody_drt_cp_peso_bruto_vehicular,custbody_is_international_shipment,custbody_packship_return_cost_num,custbody_packship_print_format,custbody_packship_desc_of_goods,custbody_packship_actual_shipping_cost,shipcarrier,shipmethod,shipcompany,shipaddress,shipattention,shipaddr1,shipaddr2,shipaddr3,shipcity,shipstate,shipzip,shipcountry,shipphone,shipisresidential,custbody_shipengine_shippiing_cost,custbody_packship_enable_returns,custbody_packship_return_shipping_cost,custbody_radi_oyster_ap_memo,custbody_radi_oyster_ap_reference,custbody_radi_oyster_ap_project,companyid,islabelenabled,ordbulk,shippingcostoverridden,isfreeshippingpromo,inventorydetailuitype,shippingaddress_key,phone,srccountry,weightconversionfactor,crosssubfulfillment,shipperservicecode,prevshipmethod,recordshipmethod,carrierform,pkgweightmanuallyupdated,shippinggroupid,onsaveshipmentweight,defaultitemweight,status,statusRef,shipstatus,originalshipstatus,originalsyncshipstatus,defaultshipstage,fulfillmenthastnum,fulfillmenthaslabel,isbrowserrequest,isdynscriptingenabled,isfulfillmentedit,ignoreshippervoiderror,labellength,sendorderfulfillmentemail,baseweightunit,basedimensionunit,tranweightunit,trandimensionunit,entitytaxid,markpackship,custpage_lrcfm_datacarrier_text">
<_csrf>a4F-NUDsGn2UUDaF3V_5_ih_1q5NLzF1MU4NsGPY9cA_9k5choA1Dd04uS99fgEVnFFFD_KRokVIkIK12C9djxmau3C2r18uLH3TTNKCJGssUW55srpbf5VullR1TMpLhomcVtUQ3gCvkiTL-4J8Qnct2JtDvB2UvNpIsbBtj30=</_csrf>
<_eml_nkey_>5490848~9672~3~N</_eml_nkey_>
<balance>0.00</balance>
<basedimensionunit>cm</basedimensionunit>
<baserecordtype>itemfulfillment</baserecordtype>
<baseweightunit>kgs</baseweightunit>
<billingtype>CustInvc</billingtype>
<carrierform>ns</carrierform>
<companyid>290</companyid>
<createddate>18/07/2024 5:57 pm</createddate>
<createdfrom>1520326</createdfrom>
<credholdentity>290</credholdentity>
<credholdoverride>T</credholdoverride>
<credlim>16000000.00</credlim>
<crosssubfulfillment>F</crosssubfulfillment>
<currencycode>MXN</currencycode>
<custbody_3rd_party_billing_enabled>F</custbody_3rd_party_billing_enabled>
<custbody_alm_date_time>18/07/2024 5:21:29 PM</custbody_alm_date_time>
<custbody_drt_cp_clave_unidadpeso>KGM</custbody_drt_cp_clave_unidadpeso>
<custbody_drt_cp_complemento_cartaporte>T</custbody_drt_cp_complemento_cartaporte>
<custbody_drt_cp_destino>6</custbody_drt_cp_destino>
<custbody_drt_cp_fechahora_llegada>19/07/2024 10:30:00 AM</custbody_drt_cp_fechahora_llegada>
<custbody_drt_cp_fechahora_salida>19/07/2024 7:00:00 AM</custbody_drt_cp_fechahora_salida>
<custbody_drt_cp_figura_transporte>34</custbody_drt_cp_figura_transporte>
<custbody_drt_cp_id_destino>DE001002</custbody_drt_cp_id_destino>
<custbody_drt_cp_id_origen>OR000001</custbody_drt_cp_id_origen>
<custbody_drt_cp_json_figura_transporte>[{"tipoFigura":"01","rfcfigura":"PEGM761010262","numlicencia":"B060174134","nombrefigura":"Manuel de Jesus Perea Gaxiola","numregidtribfigura":"","residenciafiscalfigura":"MEX","partetransporte":"PT01","calle":"Av. Alemania","numeroexterior":"615","numerointerior":"","colonia":"0842","localidad":"06","referencia":"","municipio":"015","estado":"SIN","codigopostal":"81476"}]</custbody_drt_cp_json_figura_transporte>
<custbody_drt_cp_json_transporte>[{"permSCT":"TPAF01","numPermisoSCT":"2547NIVY24052012021001018","configVehicular":"C2","placaVM":"52AL5F","anioModeloVM":2019,"aseguraRespCivil":"HDI SEGUROS","polizaRespCivil":"571578765","aseguraMedAmbiente":"HDI SEGUROS","polizaMedAmbiente":"571578765","aseguraCarga":"HDI SEGUROS","polizaCarga":"571578765","primaSeguro":10000,"remolques":[]}]</custbody_drt_cp_json_transporte>
<custbody_drt_cp_json_ubicacion>[{"tipoEstacion":"","distanciaRecorrida":"0.00","tipoUbicacion":"Origen","idUbicacion":"OR000001","rfcRemitenteDestinatario":"PFP810520JX0","nombreRemitenteDestinatario":"PROVEEDORA DE FIERRO Y PERFILES","numRegIdTrib":"","residenciaFiscal":"MEX","numEstacion":"","nombreEstacion":"","navegacionTrafico":"","fechaHoraSalidaLlegada":"2024-07-19T13:00:00","domicilioCalle":"E. ZAPATA Y MORELOS","domicilioNumExt":"S/N","domicilioNumInt":"","domicilioColonia":"0833","domicilioLocalidad":"06","domicilioReferencia":"6737320622","domicilioMunicipio":"015","domicilioEstado":"SIN","domicilioPais":"MEX","domicilioCodigoPostal":"81460"},{"tipoEstacion":"","distanciaRecorrida":"0.00","tipoUbicacion":"Destino","idUbicacion":"DE001002","rfcRemitenteDestinatario":"NAC930405296","nombreRemitenteDestinatario":"NH ACEROS SA DE CV","numRegIdTrib":"","residenciaFiscal":"MEX","numEstacion":"","nombreEstacion":"","navegacionTrafico":"","fechaHoraSalidaLlegada":"2024-07-19T16:30:00","domicilioCalle":"CARRET. A CULIACANCITO PONIENTE","domicilioNumExt":"4557","domicilioNumInt":"","domicilioColonia":"0042","domicilioLocalidad":"02","domicilioReferencia":"6677895064","domicilioMunicipio":"006","domicilioEstado":"SIN","domicilioPais":"MEX","domicilioCodigoPostal":"80020"}]</custbody_drt_cp_json_ubicacion>
<custbody_drt_cp_logistica_inversa_rede>1</custbody_drt_cp_logistica_inversa_rede>
<custbody_drt_cp_moneda>1</custbody_drt_cp_moneda>
<custbody_drt_cp_numtotalmercancias>13</custbody_drt_cp_numtotalmercancias>
<custbody_drt_cp_origen>1</custbody_drt_cp_origen>
<custbody_drt_cp_peso_bruto_vehicular>19</custbody_drt_cp_peso_bruto_vehicular>
<custbody_drt_cp_pesobrutototal>5122.36</custbody_drt_cp_pesobrutototal>
<custbody_drt_cp_pesonetototal>5122.36</custbody_drt_cp_pesonetototal>
<custbody_drt_cp_rfc_receptor>NAC930405296</custbody_drt_cp_rfc_receptor>
<custbody_drt_cp_tipo_transporte>1</custbody_drt_cp_tipo_transporte>
<custbody_drt_cp_totaldistrec>120</custbody_drt_cp_totaldistrec>
<custbody_drt_cp_transpinternac>2</custbody_drt_cp_transpinternac>
<custbody_drt_cp_transporte>1</custbody_drt_cp_transporte>
<custbody_drt_cp_unidadpeso>1</custbody_drt_cp_unidadpeso>
<custbody_drt_cp_url_string>https://verificacfdi.facturaelectronica.sat.gob.mx/verificaccp/default.aspx?&IdCCP=CCCfc940-3d71-4d8e-bc00-afa4276da9ee&FechaOrig=2024-7-19T7:00:00&FechaTimb=</custbody_drt_cp_url_string>
<custbody_drt_cp_url_string_2>https://verificacfdi.facturaelectronica.sat.gob.mx/verificaccp/default.aspx?&IdCCP=CCCfc940-3d71-4d8e-bc00-afa4276da9ee&FechaOrig=2024-7-19T7:00:00&FechaTimb=</custbody_drt_cp_url_string_2>
<custbody_drt_custbody_mx_cfdi_qr_code>R0lGODdh/gH+AYAAAAAAAP///ywAAAAA/gH+AQAC/4yPqcvtD6OctNqLs968+w+G4kiW5omm6sq27gvH8kzX9o3n+s73/g8MCofEovGITCqXzKbzCY1Kp9Sq9YrNarfcrvcLDovH5LL5jAYC1uy2+w2Py+f0tlrOmmPqfLej/7YHaBcy2Cei12C4yDgo2AgZ6feTqFJZIQn3x/hoiJg5CXKpAFrKeWGaCngXl4eHqrq52OlYGGvbqqi6OzrB+6tJ+Wo5jHnL0Ei7imv6mYsMHL2mLH3c02uCHbEr6wk7y1zqHAxd/UttLi78nKINwa0LbpEcDjoeGJ9uTaHPy0rerhi/fQnozTsliiAHdwH6wTvosNk6gCgYdlNXzhtEjf8fHnYUWDCixI0iJf3DR4zdwFQXl5F0+ZFlPUIZS0ZCZ5MjD4sz2eCE1PLQN50dPHpgmDPTTxs8a8I8qnAbyIVTpaoMeRWBwRn9gvqs0XRB2IpV3yGMOdJY1g1jsVJ0i1LsWRld88WlW/ZB22x5vda5Z2/o3aJ97YaSu9bAVrzp/AJgWtgpTa6REROlKvPlZKiJ9eZFOjdGXclfaew9cJpE6oahMadd+db1YAmgOy8Wrc8x5M66wVYm1ZptVLO8BR+GPRv15+AuRltO3vw33OO4i5P+2/Om8c2ErT+nrnW5PMqNDXOHsXo14PNWLwvPrDb2e/nE6bO2zbyFc+Deyfb/n85edP+FNx5nr/kiHW0JKodfg+4JaE5vpi2oGIUjpJffT7cpOGB70Hnm4IcbvrAfgKWRZ5+E3yll3okGfqgicuDNJ6KFux1IYIrZ0RGjidpd99h2LvoIVIvT7LiUkEcmFOKMQhhFpCsFRmlkkUAmCeSIFXZYH4xVYolWjVzeAGWOXjL54H32lcmgjldWqaWaZ8Y3J39urjikbE7KuedJgb2ZUpq14dhmnVRmmZ96XyoZpGZ50rinohPCZ6ehegoFKJ4/atoonZEOx2eAGWA4pqSc9kgEm1ve+eJTh3IaJ6lrgmpqpX0u6uiSYX465o0YnbpCrOIRuqqlhfJKbKiP/2ogq7HF3pprp7aK6ieLmfon6LC/TrssiLNS+mqr1OLq6bjRojqEqsrqim0t1xIpbKna/gksms6uKy2CvZLLLbtFqFurvtk2aW295XYLsI2MOhZvsnGuhzCoYIrbLbrPFtxvvhx+67DC58KZKK0ZIgnylJdWvHDKiJp8rLkGZ9zwvRPDGzK4ZrrKF8EmkWwvtC/TzPLFKL97M8bhnjDotkAPnCbE/ha9c88uyzj10VBvmvHMV1v5c84cK711zDiXkDS9FD8NadVbM1wzq1a3HHXXZM9rdNhtuxuQzlh35/bG95ZdN9xod4ks2IJrPLfeXMN899iq0R332YgzayHgkf+/TbioCe/78cpMGy40doGKmazWaQ8td+iLY+4t6aDjK+XXZi+NN+OcHzw4vg+rvKvah7MdNOy82/65z5IDX3zgqgfsd+Gzn5y76ZlHbPPvw9PuuPCdw9q478t3n5TrNiEvM8/cB9+s88prj/vkuoMffcnJh6++SOQbjzTke699vd3oV66/1fEvWmKjX/0icj/vXSiABURd1uRXO9ZZ7H3/k1f1vhe+BAJDg/Eb3QEFaL3tES+CA2wfB3nEL4G9zoCWQyAE8ec18a0vfZoTmQVlN0MAXpCCSTnh5poWLAbCz30T/OHfhFjBvh2ugSx0nwFP6KsPMpGIKfTf/DqYOh7/kjCE7ZviE18YDSj6RnFTlJ4Ws0dD6nXshitsIg7tB0YH5o+MQzSjEWHIxRGiUYdrdGMNMxhHLLZLinXsH4mQCESinU6Q2MNU7+TYPD+2kIoirI4SVRfFP5auiouk5PkSacIdSfKDTvPkIBXIvE76kI/lU+T09qdKUY5Sja3MYuyOeLvjBRKFlYSeKRvJh1KWcpa0xOMrfxlDY7KPMW+E5TGFyajd9bKTxMxdKjE5xksu05IyvFwkIekhZarLjBqq5gTJGUQ2KhOantviM81HNW/GUmrV1GQtHzgpbV5zVIh0Z+vWycljSjOU9KynNT1my3TqE6G6bGf2zmlIgY5s/5qUM2gzkRlOBbKToCjqpjP/qdGAglSeFdXmKgHpSn7mkm+4tCgpRTrJIgZQpoqj6UVt6lEn9lOS5SQmTl+a0pjCdKZDrWlRb3rUnNazp7P8qT2BmkWhBpWoUzVqVZF6VZeCE4NNTSpU8RlVqobVqmPFallz6lSXMnWUaT0oWcEKV9ZJ9axflatY41pCPfpxrTz16lP/WkzAutWseM2jXd96WMImVquMtCJb/RrYyA4WrZCdbF3zutjLGhaznF2iOaP52axqFpuiFaxOEdtZ0tLVtG097UWXClqfVta1lC2tZGk72m2mVreb7a1qC/tbYDaRr3udbWuPa9zk2tayrP9V7mrVmgaHOhK4+ilkQXmZ0OU6BKLRhcIdQ3rduUpOvCokZHlS2t0ofHerC0ziPYWLW1TuNIwiTa93bWhSWaKWmnctr2lLtFv7PmG9jU3cFTEq0f2+U7obrK+Am0BgBLf3wMPs7zeZC0f0PpgJEc5kMB1MQAtn9LYA9u2GIYzf9/qSvCsW8YI/WQ3unhgJHc6mP/dZxoiekb4anjGNUwzQ8LpYpRTW8Rd7vIU0Ylh02X1ugR/H2AYz+MlEri2Mc1st9k6SxSNesoQrHOWPDrShTsYudbNM5S0PGbn5DDOQpztHxToWyxNpqVLX7FxmunmHY2ZpbnP8Y3X+F8/a9fD/nkm6Y/bacb63VYKS4/thJFN3n8Q9dKSvDF6OTtq6R3i0GCWd2UyP19LufSg8Q33pM9dZnIz28qJX2mJS33iij3T1LmW8E1aaV85dhjSVwSxrOM9Z1P5t9K1BfA1dD1rBI7V1m4MNQq6quNet5fKTWh1t3gY31vmdsq+/TWn9dlu9b051sb1cY1Bf2Mx+FraJ+4weWmshwp7eJaCbHE8mj5rZ8D5k8LxAb2WTuNzOrjW7uW1lvSpaof4EOMEPTm17c1rVIYa1Z/ktb26amgsBF/TA+UzoLjIUvtUeeTLdDYaOL5SOIGd2pX99bO2GW8gW5/DD6+3te1Nc5DVPdMEV/w5zD6L8Cyq3867b6PLYjhvo3/50sv/dhaKzmuV9THi7zY3wP2c83lDn+M0F/vOrnyPP8C1xgkHJ9FtKY6P5bjqyN91zs2t77rCtONpJzvC1n3rdbNa0BJWOdF5Le3yA3zimF27316Gz0G9HddAPL+Yh153ndx824imveB33fedwX3rZJ+54Fr4c4mefdumfN0+/7xbn+D63P8hueRcm3vBpzzuPDf5qwTfb7TSvutZlO/uhO/2UUsa9kUPeedP7PNvWXr7cT7ryyvN3h4svM65DD+zAWz322y288GOetwjtPeKMp+jcR6/z0B8Z87THu9CLT+a2b971apevx/Utdv8J93vbvU435HmveuQXfso3c60XYOAXf67Hem3nf7WnbiZ2fb7EdnFmdPYnfS/GgGCnf7kxW80XgRA4fiWlfB/If6dHbAfobdXHdOnHfSR4fo0ngSE4YRWoZVsngBl4fxt4XmXmgTAIgtc1gSdXgzmIYxq4gAr4cMP3dw9YgjMYZAaYevLnfZfHee4XgCaIaGqWdEz4gkAog0F4g0gYd0aogegHei3og03ogipIf7Y3hNHXcJqHgG0YfFmIbS54hEL4eFUYg+anhH3IfhZIg2Mnc8i3hFAogk/ogAanhXB4dKinhhJHdbPWcj1kY4p4iIu4b69VhpJYZHWIf9zXiJT/aInPdoI/+H/Z94iCuIp2SIRD5EWwyIGmSIWZaIWbeGc5CH2kOIjM93WlVhKG9mVpuHyquGyOeIzaN3W+l0OVmBPCCIZYuIe3SI1854m8uIzK2IzMmGEdhYkomIrilovI+HHcmGa/eGCxuIN69o2oqIn5N4rZ2IqR94rA6Irm2H20OI3g+I5Zl4zy+I/b2IvqmI6yuI4ad4qRmILiOI86yInOCJD3qI0SSXj6OIxcKHXN5YdRZ4OJqJFXSHdkaI/oZoiieIfEWIBGsH9VRmflh4jOJ3ln2H8GqXtrOAUrmXu9OH/rxoIXV5PX2JB4aHIo1nXGh5ExWY+fGI5HCZFD/5eHYYCTx6eLsDeTIwluJemT2OiUnWgGUWl+T9mEj9aTg/eROFiQW/iSVOCVIAmWIZmUWlmO21eVZ/mTXKiWHcmSZUmH1jeFofhuMimNpFeMKDmUNleUCciP2EeYTRmXLfl/8aiX1tiVeJmTERl2iWmSGGeV9Yd1WdmQGdmZGLiXZimXgWmGKLWUfPl+fkmWjXl7K8iVIPmH7liNc/lYC+mSxMeag5lz6BiHTEmOuymWItlVuKmaA7hHVil347SYwSmYw/mWfWWcydeOpjmHmYmPK9mWs6mQqUma0umdirmaz0mTMQaUrIiebwiX53iYn4ea/fiXPcedvPmYvtl+mP9Jm2gInL9Zn+9Zm2FZmLsHma4Jf+7pnGyony+pnXs2nz3Ye+MIoXrXm1O5kdNpiwn6ncVloasXoA1anhLanwcqhxuan56ZnhbloWiZoaFJJvYZkMbmhaDokJm3n5aZbTYpoykJjx/6opcZhWLonAtKoYHIojhKpLspjAQZoZH5ozxJnPzJhyXamkhKjKfpeXroi8qJlaLppNH5fTV6ojdapX0pmEnKowTqox6pnvdpokXanAOJlzqKnSPIkFuppSo6mkAKp+2Jn90Jm0Oqm2JqkUoalGMKpm46oSJaoSGqk274UWZ6pw9Zl7J5nbbJpn56oW1KpXZJpnI6fXS5pDD/apRHOqOQuHsIqqllaqik6qlqSo+g6phSKKNW2qiL+qeKyojYRqh2eqXxiasrmqYCCpj0KaukimbkeZBzGqt52qddGJ7N2oD/eapkeqwD+qoTuY++WqvG+qamaq2lGqatmpcsupxJKIPbWamYqqxMOqXguqZf6o28ap6JWprjGqxCuZmdipQX6KzwiQO7SpECWZ1u+at6uqzrKqr+Oq2zumryCqK3Wq+VGaajh6/4OJ8VC6UISa6zyKgHG4bQ+qQe267NJ6RB2qF1iqZZarHnGpvACoAuS7JxGrIJ6YQO+5oGGrFSWbBdOqkQ+3v8Cp29CiF7KrQwKZ8dKLNeGrCI/2aMCSutFzuiz/qpGQuIPjux+hqpVDu1P6u17RqNwjqG1MeyYnuohNixNJuikkq0BDiztYiw2cqlqYqu9Jqcm/SgXHupxJp/FIuymzqqVvuugWu2gAu3YKt7Jdu1C8utdwuviCm3LWuwArs+TRusiJu3GHu55+m2H/u4gBq5S/uoffuyT5uu9uqufguzJ1uIfCqlRgurjbujmgm0lNmtsMuziSuxTFu7Bfq2F7m4PNi2hRu0bEu2f4uzNkqrdUujuSq7iWu5NutGaRuqwjmsAIu6pEu3aFu6Diq1I8uxCvut31pyk5i3z6u7jOu0IJu1Fdm9BIutyKq2nxm8pyuozP97uPO7iw8rreF7kqsbv7abqsmrvSQKoEpLkv6Joep3ppW7wKpKwIaLu9RKldaZvbwbwEi7vuyqt73Ltzmquu3LveAbWiCsq/0LvOQLwF6LtUUrvSK7wZ0rfg/Mvyicvhdcwew5u8WLi3gbriWcrDZ8wq9bwyp8w/Q7vJnLsLn5uQdciiRMw9SbrzIsMaWbvwPsxD3LrJaqwVCbxPFqwQX8v93osh18tpurrkAcpURsv3TqwVEcxM8owV1MuL6bxi98xmq8w1acum5MnRr6u2OsucKLv7t7vbc7sAK8sc0LnoAsx8dLs0e8xVQcx148uOJZxpVsyD38xA5MqVJswHT/jL3IebMcusnPJ8mebLedfMVrO7BrmcegO7q9y5wP3MKTG7Ui/MmUC8r+CMvj28SM/MeObMb9ur+DjL6Fi8hQfL/AF8yZnLJFmMuEzMnAzI6jrK3y+8MU3MwwTLxhLHus+r3CXMhoXMyem8Dqm8PevMvX7Md7HMOXPM3lrJTFissma87kXLXi/Hpt/M5zDMkpi7k9GstaLLhXGbbqbMpFDJqhi8rrSb+1XNBt6coKjMAE/c3+bMyrjLzbm9H0HMoeLctTrNAuer4aDb04PL0Drc0gjc9Nys3668wXrc//zMQ567823b6+3M0pndDwvND1W88OnbvKzMpXS8s6e5vg/5zNruu8DRzQAC3NEk27N82+7jyvPt3R8rytQW2jUs26rqrSNTvMRsrVj/zBjgvWnInS2MzCEyzWyLyqZT3M4oqqcQtlO/vSemzJgarW64zHmWrXLXrQbKygPtzWSoylfa3LZA3Y1TXYhyzNVTzWbv21lT3JdczYif2Fm03VKWy6mc25d73TytvKZ723nG28kgnPih3XWSzapc3Hp+0D0HzYhV3Kpk3KtY3Zt7zEYV3Xjl204urVqYzWxJzPmn3Mvs3bXBfcuN26M6zbe02BkM2pDQ3b0X3cLv3aRr3aDRu9y83OiYzQIr3GbN3UFe29R5vcPV3H4ovB/TzdJ73PSv+dnVMtyt9tqxS9zL8c3+J91VbtreRdzfityn3s3+ZtqosdyPEc0hmMqJQseuANxkK94BMd0wZN3DPdwHS9wv/t2oor1zUN0wbm0LOM1Q4+zkO7yB+u0zwsxv1N1CMemD/N4fzs4arN0n+d23A8ntB93vzNwd49XBLuvqQt0Cb+yiJuyyON4gzub8VZ4Ppdr+sXqD5evvQj2YK8yV/r3j0Oubys5VjcrKB9x8at3Xb82e9N2ApL5mg+1A+N2jkO4jCO4aOtwRZu0XCe3Fz+5Wf+28JtwsXd5fed4ma+0rJt28392NzN16fMloFO53O7zWkd2XHO4q2N4x/94YNe5X3/Dta0jdO7Xd2JvuZSft1Tbt/UfOmNnN1lDuqnvtHjycWPvuWO6uRlPutyLuly/ufOPeFIfJxsLrq/neub7ulpHqNR3upujtSF6uX3/OkBGsKN3ea73tvRes6hjeaArsjWPOMMquYunOUqm9JvPu3LbuWeDW1GDtWjjtGxne2BPZZvHdbsreHMbOAxbtboXeTqDulj3uxHnrTrDr/ljul53cuOnu8FT93Bfu/2TPAtHsk2HuC1/pXDyue3/dVMzVgSP8SmW64WT+vzTOcez9AnDuULf+55ju0tLe8YP7bjvfEEf+ACXe1YHu6MrtUNv/DjTtOWZvLKTfGS2+4jT+Gy/57zJf3uKW/qE0/fy8vrw570Sj7Xvk7vMbvxPj/wPJ7aJM7uVA/2fm3ogk3y8Q7y4XzhSL7q5X3nTm3pOjDveJ7eGd7g/NrmEB32xZ7pqVK9qf7wP871xa3gnV30gi/kDG/zoqv2dR/B7t7bQa/32l6t+9r4KA/4VY3ond7tNf/gUT/bfZ/1Fb71mL/sg//Gzt711wbvLn/2S631oe/4Fw75Cr/2ubb6Or613g7BMo7shI74ha/pe58uoG/3oj/zJC3TQZ7faT/Cgj6/h2bZRfz69X38iy5rGQ/x6x793c3k1J/Odn79MV/U4Z/sAC7wS734rTv9gZ/5jU3zhf7U1/+64sqv7Czf/O2Pzu+v6Nn/9REu/US+/qR/5j8P/W+P8GEf8nSv/sYP5Gf+89D/9ggf9iFP9+pv/EB+5j8P/W+P8GEf8nSv/sYP5Gf+89D/9ggf9iFP9+pv/EB+5j8P/W+f5462pRyvycVP+Hnf4bw/7zcP+xAe/0Ctz9hf4s+P9qxv7bKfBCs/9+MP/1Nf512N89at82Au9qxdtkCtz9hf4s+P9qxv7bKfBCs/9+MP/1Nf512N89at82Au9qxdtkCtz9hf4s+P9qxv7bKfBCs/9+MP/1Nf512N89at82Au9qxdtkCtz9hf4s+P9qxv7bKfBCs/9+MP/1Nf512N89b/rfNgLvasXbZArc/YX+LPj/asb+3MbfBHfdRHLf2X3fQRba7WLd/Hive3zuxHLf2X3fQRba7WLd/Hive3zuxHLf2X3fQRba7WLd/Hive3zuxHLf2X3fQRba7WLd/Hive3zuxHLf2X3fQRba7WLd/Hive3zuxHLf2X3fQRba7WLd/Hive3zuxHLf2X3fQRba7WLd/Hive3zuxHLf2X3fQRba7WLd/Hive3zuxHLf2X3fQRba7WLd/Hive3zuxHLf2X3fQRba7WLd/QWOlIP6gwH/u5//EhD+TqL/6x7vuQWvaSb+tYD9+M3//QWOlIP6gwH/u5//EhD+TqL/6x7vuQ/1r2km/rWA/fjN//0FjpSD+oMB/7uf/xIQ/k6i/+se77kFr2km/rWA/fjN//0FjpSD+oMB/7uf/xIQ/k6i/+se77kFr2km/rWA/fjN//0FjpSD+oMB/7uf/xIQ/k6i/+se77kFr2km/rWA/fjN//xxr/5J7gC67L9i78lE7490r7zB3q+jzuySz2k2f4Fy/y7e33yE3qFU/3CB/mSW34Fy/y7e33yE3qFU/3CB/mSW34Fy/y7e33yE3qFU/3CB/mSW34Fy/y7e33yE3qFU/3CB/mSW34Fy/y7e33yE3qFU/3CB/mSW34Fy/y7e33yE3qFU/3CB/mSW34Fy/y7e33yP9N6hVP9wgf5klt+Bcv8u3t98hN6hVP9wgf5klt+Bcv8u3t98KP6wHf+dd+7Kaf5OQO606v6swd6vjP+sms577/6rr/6k6v6swd6vjP+sms577/6rr/6k6v6swd6vjP+sms577/6rr/6k6v6swd6vjP+sms577/6rr/6k6v6swd6vjP+sms577/6rr/6k6v6swd6vjP+sms577/6rr/6k6v6swd6vjP+sms577/6rr/6k6v6swd6vjP+sms577/6rr/6k6v6swd6vjP+sms577/6rr/6k6v6sht9Ane4Ty/85os8/sP9Ttg76U/9be++55Nxu294dIu4Dtg76U/9bf/vvueTcbtveHSLuA7YO+lP/W3vvueTcbtveHSLuA7YO+lP/W3vvueTcbtveHSLuA7YO+lP/W3vvueTcbtveHSLuA7YO+lP/W3vvueTcbtveHSLuA7YO+lP/W3vvueTcbtveHSLuA7YO+lP/W3vvueTcbtveHSLuA7YO+lP/W3vvueTcbtveHSLuA7YO+yf/hYL8Ty7/S6vqX0jve33vuqDvfEX+LmGvvhfa+2jve33vuqDvfEX+LmGvvhfa+2jve33vuqDvfEX+LmGvvhfa+2jve33vuqDvfEX+LmGvvhfa+2jve33vuqDvfEX+LmGvvhfa+2jve33vuqDvfEX+Lm/xr74X2vto73t977qg73xF/i5hr74X2vto73t977qg73xF/i5hr74X2vto73t977qg73xF/i5hr74X2vto73t977SX7rHH/+Mi/EYZ/+v67XAF/+GhvmUK/P477+qL/0l+/0ho/0FqnLP5/uz+z23X/5Tm/4SG+Ruvzz6f7Mbt/9l+/0ho/0FqnLP5/uz+z23X/5Tm/4SG+Ruvzz6f7Mbt/9l+/0ho/0FqnLP5/uz+z23X/5Tm/4SG+Ruvzz6f7Mbt/9l+/0ho/0FqnLP5/uz+z23X/5Tm/4SG+Ruvzz6f7Mbt/9l+/0ho/0FtnXWI/Xv77vQgz/tM/cUC/d+c/zj/9P2W796vIt98w+qKPf9tAO3EdP6i4e5iXu92YPqd/v4mut17JP2W796vIt98w+qKPf9tAO3EdP6i4e5iXu92YPqd/v4mut17JP2W796vIt98w+qKPf9tAO3EdP6i4e5iXu92YPqd/v4mut17JP2W796vIt98w+qKPf9tAO3EdP6i4e5iXu92YPqd/v4mut17JP2W796vIt98w+qKPf9tBO9jfO+rOP2Ai/1rp/8zqsz7M/qMiv5yb98ek/95e/73SP8AwM+2wPy8N99Kfv765/8HM//voO/Mx946w/+4iN8Gut+zevw/o8+4OK/Hpu0h+f/nN/+ftO9wjPwLDP9rD/PNxHf/r+7voHP/fjr+/Az9w3zvqzj9gIv9a6f/M6rM+zP6jIr+cm/fHpP/eXv+90j/AMDPtsD8vDffSn7++uf/BzP/76DvzMfeOsP/uIjfBrrfs3r8P6PPvlr8+9zpgnb/4FHf+/n/e2nu6db+w67P7If+u77+94avacHumGXfkqP/qaLMTwv+BvTsYqb/XWC9TGrsPuj/y3vvv+jqdmz+mRbtiVr/Kjr8lCDP8L/uZkrPJWb71Abew67P7If+u77+94avacHumGXfkqP/qaLMTwv+BvTsYqb/XWC9TGrsPuj/y3vvv+jqdmz+mRbtiVr/Kjr8lCDP8L/uZkrPJW/2+9QG3sOuz+yH/ru+/veGr2nB7phl35os79Rn/l6n36nn2XIq/qOw7sos79Rn/l6n36nn2XIq/qOw7sos79Rn/l6n36nn2XIq/qOw7sos79Rn/l6n36nn2XIq/qOw7sos79Rn/l6n36nn2XIq/qOw7sos79Rn/l6n36nn2XIq/qOw7sos79Rn/l6n36nn2XIq/qOw7sos79Rn/l6n36nn2XIq/qOw7sos79Rn/l6n36nn2XIq/qOw7sos79Rn/l6n36nn2XIq/qOw7sc+xoAt70Hx/y39/VyA/U/yLgO5D+vy7f64/6nm/5CO7Zkw/7EG6+eT/15H7ln2y9QP0vAv++A+n/6/K9/qjv+ZaP4J49+bAP4eab91NP7lf+ydYL1P8i4DuQ/r8u3+uP+p5v+Qju2ZMP+xBuvnk/9eR+5Z9svUD9LwK+A+n/6/K9/qjv+ZaP4J49+bAP4eab91NP7lf+ydYL1P8i4DuQ/r8u3+uP+p5v+Qju2ZBa/N1f4hu+4Wh/5tZL7qSP8Gu95E9f8d7/vlSO/6wf8kCO8Gu95E9f8d7/vlSO/6wf8kCO8Gu95E9f8d7/vlSO/6wf8kCO8Gu95E9f8d7/vlSO/6wf8kCO8Gu95E9f8d7/vlSO/6wf8kCO8Gu95E9f8d7/vlSO/6wf8kCO8Gu95E9f8d7/vlT/jv+sH/JAjvBrveRPX/He/75Ujv+sH/JAjvBrveRPX/He/75Ujv+sH/JAjvBwHWhCHObve/O3z+zdH+q1X/tZYL1i3/K4ztEib/6cH+bgD9eBJsRh/r43f/vM3v2hXvu1nwXWK/Ytj+scLfLmz/lhDv5wHWhCHObve/O3z+zdH+q1X/tZYL1i3/K4ztEib/6cH+bgD9eBJsRh/r43f/vM3v2hXvu1nwXWK/Ytj+scLfLmz/lhDv5wHWhCHObve/O3z+zdH+q1X/tZYL1i3/K4ztEib/6cH+bgv9Za1dc/b+6UH+tpefC4/+uazP/tHOlZLfy4/+s6D/Cxz/orj/vf/87vpq/qwo/7v67zAB/7rL/yuP/t/G76qi78uP/rOg/wsc/6K4/7387vpq/qwo/7v67zAB/7rL/yuP/t/G76qi78uP/rOg/wsc/6K4/7387vpq/qwo/7v67zAB/7rL/yuP/t/G76qi78uP/rOg/wsc/6K4/7387vpq/qwo/7v67zAB/7rL/yuP/t/G76qi78uP/rOg/wsc/6K4/7gc3a3X/j2m7vwh/YeH/rcw7mt977Ax72VG7srk/kPx/5gZ3MYn/3AQ9dF+/6RP7zkR/YySz2dx/w0HXxrk/kPx/5gZ3MYn/3AQ9dF+/6RP7zkR/YySz2dx/w0HXxrk/kPx/5gf+dzGJ/9wEPXRfv+kT+85Ef2Mks9ncf8NB18a5P5D8f+YGdzGJ/9wEPXRfv+kT+85Ef2Mks9ncf8NB18a5P5D8f+YGdzGIf9Cv/60QP1+t9//mP4MF28xov5uEt/3oN5gYV/3Wu/+I+9b+/1ucv5k+u/ZXe/VF28xov5uEt/3oN5gYV/3Wu/+I+9b+/1ucv5k+u/ZXe/VF28xov5uEt/3oN5gYV/3Wu/+I+9b+/1ucv5k+u/ZXe/VF28xov5uEt/3oN5gYV/3Wu/+I+9b+/1ucv5k+u/ZXe/VF28xov5uEt/3oN5gYV/3Wu/+I+9b/PwE3uaMhf79Iu4Po87qwt/W7/bb1i39fWW+/SLuD6PO6sLf1ubb1i39fWW+/SLuD6PO6sLf1ubb1i39fWW+/SLuD6PO6sLf1ubb1i39fWW+/SLuD6PO6sLf1ubb1i39fWW+/SLuD6PO6sLf1ubb1i39fWW+/SLuD6PO6sLf1ubb1i39fWW+/SLuD6PO6sLf1ubb1i39fWW+/SLuD6PO6sLf1ubb1i39fWW+/SLuD6PO6sLf1Rba5le+vbDvOED/+XTe22Pu7xP989f9mPz9HQzvF6bfY1bvQVz/9Ef6+0b/bzHvTcXvY5kO4fv/4uvtb+3uTxX+fAruoAj/TSH9XmWra3vu0wT/jwf9nUbuvjHv/z/93zl/34HA3tHK/XZl/jRl/x/E/090r7Zj/vQc/tZZ8D6f7x6+/ia+3vTR7/dQ7sqg7wSC/9UW2uZXvr2w7zhA//l03ttj7u8T/fPX/Zj8/R0M7xem32NV7/2x3RaJ/7wI/c3G/5Fe/9lW/4SD/0Sv/4tI/uyJ+P3M/9EA6NHZ7glx38Z07jaI/wYV/jafn2CH/yqm722P++VK7P4w6Nl6jJ8A3mdc7zTc/5Qy79Cw6Nl6jJ8A3mdc7zTc/5Qy79Cw6Nl6jJ8A3mdc7zTc/5Qy79Cw6Nl6jJ8A3mdc7zTc/5Qy79Cw6Nl6jJ8A3mdc7zTc/5Qy79Cw6Nl6jJ8A3mdf/O803P+UMu/QsOqUxv9jcP7bvv9Etf+T1/8LiP+9/O7+Yb5lv9+FGN9me+8odu9uvP++Yb5lv9+FGN9me+8odu9uvP++Yb5lv9+FGN9me+8odu9uvP++Yb5lv9+FGN9me+8odu9uvP++Yb5lv9+FGN9me+8odu9uvP++Yb5lv9+FGN9me+8odu9uvP++Yb5lv9+FGN9me+8odu9uvP++Yb5lv9+FGN9me+8odu9uvP++Yb5lv9+FGN9me+8odu9j7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz7mYz4H5mM+Zl8FAAA7</custbody_drt_custbody_mx_cfdi_qr_code>
<custbody_drt_custbody_mx_cfdi_sat_sign>RhueezSSM58X7umozyGEzdwVzn30vPqhXdcRhQY6R4/PQxaq2Sjq0/jkiWcunHSZvYL/FK7ImA2XT679kswB45NtZZ2okFCnuhokXJT7+NkzFsCLtj3seg9TykAVwq034iMLUuQclP7t+TTq4xle2ci03LmCKo0kvM95lAcFQOg4Km7+PFTZhNhR0eFvqNSva+a+zHUeATckQI57buGwriN7req4PGWe6pXfeJEywDy+/6MmD5Fz1MxwAXVadGz6BBZbK+xv4txGXMromgg7GU83++XAgkFnmqU2SFyb49DysWj6r99egx52SWuY6wPXnk8S66gZQ+/CLhJB4J394A==</custbody_drt_custbody_mx_cfdi_sat_sign>
<custbody_drt_custbody_mx_cfdi_signatur>MtTON/rRIP9se9n+jtuSs2AZXkCOOjI/5O76gg/y42B8gVaHY6smY//FC2aXr2Ppfg3Lymwr/u6tXemDCkPi0AfnbtDT9TXB1grJH/YsRPw8Ox10j/xr1lINngCQHX4fRAmSgeVEMcAFVcYFgvQjGxG8/ba3jBe6MK3zZgru86qXgRoohhyRLVcg1Ze6xlhoV+Kth4njGJgyOzixBO7ozk7oWzVWS0Tj24g2BbZq2QrjwXG6ru34WVQWWNXYVyQCi4Q4SK9dbuWCOqkg9oLoGo+acQm5ximwMdHd8+hZ4H/ReOGT0zyEi65HzOm0yAzTkUSQhmCRrVLPB5VhtvpPTA==</custbody_drt_custbody_mx_cfdi_signatur>
<custbody_drt_fecha_hora_entrega>19/07/2024 5:21:54 PM</custbody_drt_fecha_hora_entrega>
<custbody_drt_mx_cfdi_cadena_original>||1.1|81217095-bb67-49e1-8377-8d8c304329ae|2024-07-19T10:22:29|MSE090205D9A|MtTON/rRIP9se9n+jtuSs2AZXkCOOjI/5O76gg/y42B8gVaHY6smY//FC2aXr2Ppfg3Lymwr/u6tXemDCkPi0AfnbtDT9TXB1grJH/YsRPw8Ox10j/xr1lINngCQHX4fRAmSgeVEMcAFVcYFgvQjGxG8/ba3jBe6MK3zZgru86qXgRoohhyRLVcg1Ze6xlhoV+Kth4njGJgyOzixBO7ozk7oWzVWS0Tj24g2BbZq2QrjwXG6ru34WVQWWNXYVyQCi4Q4SK9dbuWCOqkg9oLoGo+acQm5ximwMdHd8+hZ4H/ReOGT0zyEi65HzOm0yAzTkUSQhmCRrVLPB5VhtvpPTA==|00001000000506109151||</custbody_drt_mx_cfdi_cadena_original>
<custbody_edoc_gen_trans_pdf>T</custbody_edoc_gen_trans_pdf>
<custbody_edoc_generated_pdf>1607519</custbody_edoc_generated_pdf>
<custbody_ei_ds_txn_identifier>F</custbody_ei_ds_txn_identifier>
<custbody_is_international_shipment>F</custbody_is_international_shipment>
<custbody_mcp_idccp>CCCfc940-3d71-4d8e-bc00-afa4276da9ee</custbody_mcp_idccp>
<custbody_mcp_international_transport>F</custbody_mcp_international_transport>
<custbody_mcp_rev_logst_colls_ret>F</custbody_mcp_rev_logst_colls_ret>
<custbody_mcp_sat_c_carta_porte>F</custbody_mcp_sat_c_carta_porte>
<custbody_mx_cfdi_cadena_original>||1.1|81217095-bb67-49e1-8377-8d8c304329ae|2024-07-19T10:22:29|MSE090205D9A|MtTON/rRIP9se9n+jtuSs2AZXkCOOjI/5O76gg/y42B8gVaHY6smY//FC2aXr2Ppfg3Lymwr/u6tXemDCkPi0AfnbtDT9TXB1grJH/YsRPw8Ox10j/xr1lINngCQHX4fRAmSgeVEMcAFVcYFgvQjGxG8/ba3jBe6MK3zZgru86qXgRoohhyRLVcg1Ze6xlhoV+Kth4njGJgyOzixBO7ozk7oWzVWS0Tj24g2BbZq2QrjwXG6ru34WVQWWNXYVyQCi4Q4SK9dbuWCOqkg9oLoGo+acQm5ximwMdHd8+hZ4H/ReOGT0zyEi65HzOm0yAzTkUSQhmCRrVLPB5VhtvpPTA==|00001000000506109151||</custbody_mx_cfdi_cadena_original>
<custbody_mx_cfdi_certify_timestamp>2024-07-19T10:22:29</custbody_mx_cfdi_certify_timestamp>
<custbody_mx_cfdi_folio>ITEMSHIP134059</custbody_mx_cfdi_folio>
<custbody_mx_cfdi_issue_datetime>19/07/2024 10:22:27 AM</custbody_mx_cfdi_issue_datetime>
<custbody_mx_cfdi_issuer_serial>00001000000505723921</custbody_mx_cfdi_issuer_serial>
<custbody_mx_cfdi_qr_code>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</custbody_mx_cfdi_qr_code>
<custbody_mx_cfdi_sat_export_type>1</custbody_mx_cfdi_sat_export_type>
<custbody_mx_cfdi_sat_serial>00001000000506109151</custbody_mx_cfdi_sat_serial>
<custbody_mx_cfdi_sat_signature>RhueezSSM58X7umozyGEzdwVzn30vPqhXdcRhQY6R4/PQxaq2Sjq0/jkiWcunHSZvYL/FK7ImA2XT679kswB45NtZZ2okFCnuhokXJT7+NkzFsCLtj3seg9TykAVwq034iMLUuQclP7t+TTq4xle2ci03LmCKo0kvM95lAcFQOg4Km7+PFTZhNhR0eFvqNSva+a+zHUeATckQI57buGwriN7req4PGWe6pXfeJEywDy+/6MmD5Fz1MxwAXVadGz6BBZbK+xv4txGXMromgg7GU83++XAgkFnmqU2SFyb49DysWj6r99egx52SWuY6wPXnk8S66gZQ+/CLhJB4J394A==</custbody_mx_cfdi_sat_signature>
<custbody_mx_cfdi_signature>MtTON/rRIP9se9n+jtuSs2AZXkCOOjI/5O76gg/y42B8gVaHY6smY//FC2aXr2Ppfg3Lymwr/u6tXemDCkPi0AfnbtDT9TXB1grJH/YsRPw8Ox10j/xr1lINngCQHX4fRAmSgeVEMcAFVcYFgvQjGxG8/ba3jBe6MK3zZgru86qXgRoohhyRLVcg1Ze6xlhoV+Kth4njGJgyOzixBO7ozk7oWzVWS0Tj24g2BbZq2QrjwXG6ru34WVQWWNXYVyQCi4Q4SK9dbuWCOqkg9oLoGo+acQm5ximwMdHd8+hZ4H/ReOGT0zyEi65HzOm0yAzTkUSQhmCRrVLPB5VhtvpPTA==</custbody_mx_cfdi_signature>
<custbody_mx_cfdi_usage>23</custbody_mx_cfdi_usage>
<custbody_mx_cfdi_uuid>81217095-bb67-49e1-8377-8d8c304329ae</custbody_mx_cfdi_uuid>
<custbody_package_code_defaulted>F</custbody_package_code_defaulted>
<custbody_packship_enable_returns>F</custbody_packship_enable_returns>
<custbody_pfp_condiciondepago_>1</custbody_pfp_condiciondepago_>
<custbody_psg_ei_certified_edoc>1607518</custbody_psg_ei_certified_edoc>
<custbody_psg_ei_content><?xml version="1.0" encoding="UTF-8"?> <fx:FactDocMX xmlns:fx="http://www.fact.com.mx/schema/fx" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.fact.com.mx/schema/fx http://www.mysuitemex.com/fact/schema/fx_2010_g.xsd"> <fx:Version>8</fx:Version> <fx:Identificacion> <fx:CdgPaisEmisor>MX</fx:CdgPaisEmisor> <fx:TipoDeComprobante>TRASLADO</fx:TipoDeComprobante> <fx:RFCEmisor>PFP810520JX0</fx:RFCEmisor> <fx:RazonSocialEmisor>PROVEEDORA DE FIERRO Y PERFILES</fx:RazonSocialEmisor> <fx:Usuario>SISTEMAS ALMETAL</fx:Usuario> <fx:AsignacionSolicitada> <fx:Folio>ITEMSHIP134059</fx:Folio> <fx:TiempoDeEmision>2024-07-18T00:00:00</fx:TiempoDeEmision> </fx:AsignacionSolicitada> <fx:Exportacion>01</fx:Exportacion> <fx:LugarExpedicion>81460</fx:LugarExpedicion> </fx:Identificacion> <fx:Emisor> <fx:RegimenFiscal> <fx:Regimen>601</fx:Regimen> </fx:RegimenFiscal> </fx:Emisor> <fx:Receptor> <fx:CdgPaisReceptor>MX</fx:CdgPaisReceptor> <fx:RFCReceptor>PFP810520JX0</fx:RFCReceptor> <!--<fx:NombreReceptor>NH ACEROS</fx:NombreReceptor>--> <!-- <fx:NombreReceptor>278 NH ACEROS SA DE CV</fx:NombreReceptor> --> <fx:NombreReceptor>PROVEEDORA DE FIERRO Y PERFILES</fx:NombreReceptor> <fx:DomicilioFiscalReceptor>81460</fx:DomicilioFiscalReceptor> <fx:RegimenFiscalReceptor>601</fx:RegimenFiscalReceptor> <fx:UsoCFDI>S01</fx:UsoCFDI> </fx:Receptor> <fx:Conceptos> <fx:Concepto> <fx:Cantidad>48.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>PZA</fx:UnidadDeMedida> <fx:ClaveProdServ>30102304</fx:ClaveProdServ> <fx:Codigo>Polin 4" x 6" x 2" Cal.14</fx:Codigo> <fx:Descripcion>Polin 4" x 6" x 2" Cal.14o</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> <fx:Concepto> <fx:Cantidad>48.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>PZA</fx:UnidadDeMedida> <fx:ClaveProdServ>30102304</fx:ClaveProdServ> <fx:Codigo>Polin 6" x 6" Cal.14</fx:Codigo> <fx:Descripcion>Polin 6" x 6" Cal.14</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> <fx:Concepto> <fx:Cantidad>50.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>PZA</fx:UnidadDeMedida> <fx:ClaveProdServ>40181800</fx:ClaveProdServ> <fx:Codigo>Perfil 3/4'' x 3/4'' Cal.20 (C075C20)</fx:Codigo> <fx:Descripcion>Perfil 3/4'' x 3/4'' Cal.20 (C075C20)</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> <fx:Concepto> <fx:Cantidad>50.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>PZA</fx:UnidadDeMedida> <fx:ClaveProdServ>30102304</fx:ClaveProdServ> <fx:Codigo>Perfil 2'' x 1'' Cal.20 (R200C20)</fx:Codigo> <fx:Descripcion>Perfil 2'' x 1'' Cal.20 (R200C20)</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> <fx:Concepto> <fx:Cantidad>20.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>Pz</fx:UnidadDeMedida> <fx:ClaveProdServ>30263600</fx:ClaveProdServ> <fx:Codigo>Solera 3/16'' x 3/4''</fx:Codigo> <fx:Descripcion>Solera 3/16'' x 3/4''</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> <fx:Concepto> <fx:Cantidad>15.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>PZA</fx:UnidadDeMedida> <fx:ClaveProdServ>40181800</fx:ClaveProdServ> <fx:Codigo>Perfil 1 1/4'' x 1 1/4'' Cal.16 (C125C16)</fx:Codigo> <fx:Descripcion>Perfil 1 1/4'' x 1 1/4'' Cal.16 (C125C16)</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> <fx:Concepto> <fx:Cantidad>84.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>PZA</fx:UnidadDeMedida> <fx:ClaveProdServ>40181800</fx:ClaveProdServ> <fx:Codigo>Perfil 1 3/4'' x 3/4'' Cal.20 (R175C20)</fx:Codigo> <fx:Descripcion>Perfil 1 3/4'' x 3/4'' Cal.20 (R175C20)</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> <fx:Concepto> <fx:Cantidad>5.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>PZA</fx:UnidadDeMedida> <fx:ClaveProdServ>40181800</fx:ClaveProdServ> <fx:Codigo>PTR 3" x 3" Cal.10 (C300C10)</fx:Codigo> <fx:Descripcion>PTR 3" x 3" Cal.10 (C300C10)</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> <fx:Concepto> <fx:Cantidad>49.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>PZA</fx:UnidadDeMedida> <fx:ClaveProdServ>40181800</fx:ClaveProdServ> <fx:Codigo>Perfil 3'' x 1 1/2'' Cal.20 (R300C20)</fx:Codigo> <fx:Descripcion>Perfil 3'' x 1 1/2'' Cal.20 (R300C20)</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> <fx:Concepto> <fx:Cantidad>27.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>PZA</fx:UnidadDeMedida> <fx:ClaveProdServ>30102304</fx:ClaveProdServ> <fx:Codigo>Perfil M600 Cal.20</fx:Codigo> <fx:Descripcion>Perfil M600 Cal.20</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> <fx:Concepto> <fx:Cantidad>10.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>Pz</fx:UnidadDeMedida> <fx:ClaveProdServ>30263600</fx:ClaveProdServ> <fx:Codigo>Solera 1/4'' x 4''</fx:Codigo> <fx:Descripcion>Solera 1/4'' x 4''</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> <fx:Concepto> <fx:Cantidad>10.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>PZA</fx:UnidadDeMedida> <fx:ClaveProdServ>30102004</fx:ClaveProdServ> <fx:Codigo>Lamina Negra 3' x 8' Cal.16</fx:Codigo> <fx:Descripcion>Lamina Negra 3' x 8' Cal.16</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> <fx:Concepto> <fx:Cantidad>12.000000</fx:Cantidad> <fx:ClaveUnidad>H87</fx:ClaveUnidad> <fx:UnidadDeMedida>PZA</fx:UnidadDeMedida> <fx:ClaveProdServ>30102004</fx:ClaveProdServ> <fx:Codigo>Lamina Negra 3' x 8' Cal.18</fx:Codigo> <fx:Descripcion>Lamina Negra 3' x 8' Cal.18</fx:Descripcion> <fx:ValorUnitario>0.00</fx:ValorUnitario> <fx:Importe>0.00</fx:Importe> <fx:ObjetoImp>01</fx:ObjetoImp> <fx:Opciones> </fx:Opciones> </fx:Concepto> </fx:Conceptos> <fx:Totales> <fx:Moneda>XXX</fx:Moneda> <fx:SubTotalBruto>0</fx:SubTotalBruto> <fx:SubTotal>0</fx:SubTotal> <fx:Total>0</fx:Total> <fx:TotalEnLetra>-</fx:TotalEnLetra> </fx:Totales> <fx:Complementos> <fx:CartaPorte31 Version="3.1" IdCCP="CCCfc940-3d71-4d8e-bc00-afa4276da9ee" TranspInternac="No" TotalDistRec="120.00"> <fx:Ubicaciones> <fx:Ubicacion TipoUbicacion="Origen" IDUbicacion="OR000001" RFCRemitenteDestinatario="PFP810520JX0" NombreRemitenteDestinatario="PROVEEDORA DE FIERRO Y PERFILES" FechaHoraSalidaLlegada="2024-07-19T07:00:00"> <fx:Domicilio Calle="E. ZAPATA Y MORELOS" NumeroExterior="S/N" Colonia="0833" Localidad="06" Referencia="6737320622" Municipio="015" Estado="SIN" Pais="MEX" CodigoPostal="81460"/> </fx:Ubicacion> <fx:Ubicacion TipoUbicacion="Destino" IDUbicacion="DE001002" RFCRemitenteDestinatario="NAC930405296" NombreRemitenteDestinatario="NH ACEROS SA DE CV" FechaHoraSalidaLlegada="2024-07-19T10:30:00" DistanciaRecorrida="120.00"> <fx:Domicilio Calle="CARRET. A CULIACANCITO PONIENTE" NumeroExterior="4557" Colonia="0042" Localidad="02" Referencia="6677895064" Municipio="006" Estado="SIN" Pais="MEX" CodigoPostal="80020"/> </fx:Ubicacion> </fx:Ubicaciones> <fx:Mercancias PesoBrutoTotal="5122.360" UnidadPeso="KGM" PesoNetoTotal="5122.360" NumTotalMercancias="13" LogisticaInversaRecoleccionDevolucion="Sí"> <fx:Mercancia BienesTransp="30102304" Descripcion="Polin 4'' x 6'' x 2'' Cal.14" Cantidad="48.000000" ClaveUnidad="H87" Unidad="7909" PesoEnKg="979.200" > <!----> <fx:CantidadTransporta Cantidad="48.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Mercancia BienesTransp="30102304" Descripcion="Polin 6'' x 6'' Cal.14" Cantidad="48.000000" ClaveUnidad="H87" Unidad="7917" PesoEnKg="1206.720" > <!----> <fx:CantidadTransporta Cantidad="48.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Mercancia BienesTransp="40181800" Descripcion="Perfil 3/4'' x 3/4'' Cal.20 (C075C20)" Cantidad="50.000000" ClaveUnidad="H87" Unidad="8270" PesoEnKg="156.000" > <!----> <fx:CantidadTransporta Cantidad="50.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Mercancia BienesTransp="30102304" Descripcion="Perfil 2'' x 1'' Cal.20 (R200C20)" Cantidad="50.000000" ClaveUnidad="H87" Unidad="8257" PesoEnKg="318.000" > <!----> <fx:CantidadTransporta Cantidad="50.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Mercancia BienesTransp="30263600" Descripcion="Solera 3/16'' x 3/4''" Cantidad="20.000000" ClaveUnidad="H87" Unidad="8555" PesoEnKg="88.000" > <!----> <fx:CantidadTransporta Cantidad="20.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Mercancia BienesTransp="40181800" Descripcion="Perfil 1 1/4'' x 1 1/4'' Cal.16 (C125C16)" Cantidad="15.000000" ClaveUnidad="H87" Unidad="8226" PesoEnKg="135.000" > <!----> <fx:CantidadTransporta Cantidad="15.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Mercancia BienesTransp="40181800" Descripcion="Perfil 1 3/4'' x 3/4'' Cal.20 (R175C20)" Cantidad="84.000000" ClaveUnidad="H87" Unidad="8231" PesoEnKg="445.200" > <!----> <fx:CantidadTransporta Cantidad="84.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Mercancia BienesTransp="40181800" Descripcion="PTR 3'' x 3'' Cal.10 (C300C10)" Cantidad="5.000000" ClaveUnidad="H87" Unidad="7883" PesoEnKg="226.800" > <!----> <fx:CantidadTransporta Cantidad="5.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Mercancia BienesTransp="40181800" Descripcion="Perfil 3'' x 1 1/2'' Cal.20 (R300C20)" Cantidad="49.000000" ClaveUnidad="H87" Unidad="8268" PesoEnKg="473.340" > <!----> <fx:CantidadTransporta Cantidad="49.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Mercancia BienesTransp="30102304" Descripcion="Perfil M600 Cal.20" Cantidad="27.000000" ClaveUnidad="H87" Unidad="8205" PesoEnKg="251.100" > <!----> <fx:CantidadTransporta Cantidad="27.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Mercancia BienesTransp="30263600" Descripcion="Solera 1/4'' x 4''" Cantidad="10.000000" ClaveUnidad="H87" Unidad="8555" PesoEnKg="309.000" > <!----> <fx:CantidadTransporta Cantidad="10.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Mercancia BienesTransp="30102004" Descripcion="Lamina Negra 3' x 8' Cal.16" Cantidad="10.000000" ClaveUnidad="H87" Unidad="7324" PesoEnKg="270.000" > <!----> <fx:CantidadTransporta Cantidad="10.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Mercancia BienesTransp="30102004" Descripcion="Lamina Negra 3' x 8' Cal.18" Cantidad="12.000000" ClaveUnidad="H87" Unidad="7325" PesoEnKg="264.000" > <!----> <fx:CantidadTransporta Cantidad="12.000000" IDOrigen="OR000001" IDDestino="DE001002"/> </fx:Mercancia> <fx:Autotransporte PermSCT="TPAF01" NumPermisoSCT="2547NIVY24052012021001018"> <fx:IdentificacionVehicular ConfigVehicular="C2" PlacaVM="52AL5F" AnioModeloVM="2019" PesoBrutoVehicular="19"/> <fx:Seguros AseguraRespCivil="HDI SEGUROS" PolizaRespCivil="571578765"/> </fx:Autotransporte> </fx:Mercancias> <fx:FiguraTransporte> <fx:TiposFigura TipoFigura="01" RFCFigura="PEGM761010262" NumLicencia="B060174134" NombreFigura="Manuel de Jesus Perea Gaxiola"> <!-- <fx:PartesTransporte ParteTransporte="PT01"/> --> <fx:Domicilio Calle="Av. Alemania" NumeroExterior="615" Colonia="0842" Localidad="06" Municipio="015" Estado="SIN" Pais="MEX" CodigoPostal="81476"/> </fx:TiposFigura> </fx:FiguraTransporte> </fx:CartaPorte31> </fx:Complementos> </fx:FactDocMX></custbody_psg_ei_content>
<custbody_psg_ei_generated_edoc><a href="/app/site/hosting/scriptlet.nl?script=90&deploy=1&compid=5490848&edocId=1520482&fileFormat=xml&doctype=outbound&type=itemfulfillment&command=preview">preview itemfulfillment_19/07/2024 10:18 AM.xml</a>&nbsp;&nbsp;<a href="/app/site/hosting/scriptlet.nl?script=90&deploy=1&compid=5490848&edocId=1520482&fileFormat=xml&doctype=outbound&type=itemfulfillment&genDate=19%2F07%2F2024+10%3A18+AM&command=download">download</a></custbody_psg_ei_generated_edoc>
<custbody_psg_ei_sending_method>5</custbody_psg_ei_sending_method>
<custbody_psg_ei_status>3</custbody_psg_ei_status>
<custbody_psg_ei_template>118</custbody_psg_ei_template>
<custbody_psg_ei_trans_edoc_standard>3</custbody_psg_ei_trans_edoc_standard>
<custbody_wmsse_transactiontype>SalesOrd</custbody_wmsse_transactiontype>
<custbodydrt_employe>9672</custbodydrt_employe>
<custpage_lrcfm_datacarrier_text>{"MX":[{"country":"MX","fields":[{"id":"custitem_mx_txn_item_sat_item_code","type":"SELECT"},{"id":"custitem_mx_txn_item_sat_item_type","type":"SELECT"},{"id":"custbody_mx_customer_rfc","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization"]},{"id":"custbody_mx_inbound_bill_uuid","type":"TEXT","keepHiddenIn":["blanketpurchaseorder","check","creditcardcharge","inventorystatuschange","purchasecontract","purchaserequisition","vendorreturnauthorization","purchaseorder"]},{"id":"custbody_mx_operation_type","type":"SELECT","keepHiddenIn":["blanketpurchaseorder","creditcardcharge","inventorystatuschange","purchasecontract","purchaserequisition","vendorreturnauthorization"]},{"id":"custbody_mx_tax_effect_vendor_cfdi","type":"CHECKBOX","keepHiddenIn":["blanketpurchaseorder","creditcardcharge","inventorystatuschange","purchasecontract","purchaserequisition","vendorreturnauthorization"]},{"id":"custbody_mx_payment_method","type":"SELECT"},{"id":"custbody_mx_bank_information","type":"SELECT"},{"id":"custpage_mx_bank_information","type":"SELECT"},{"id":"custbody_mx_bank_name","type":"TEXT"},{"id":"custbody_mx_bank_acct_num","type":"TEXT"},{"id":"custentity_mx_rfc","type":"TEXT"},{"id":"custentity_mx_sat_industry_type","type":"SELECT"},{"id":"custbody_mx_cfdi_sat_addendum","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_cfdi_certify_timestamp","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_cfdi_uuid","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_cfdi_serie","type":"TEXT","keepHiddenIn":["salesorder","estimate"]},{"id":"custbody_mx_cfdi_folio","type":"TEXT","keepHiddenIn":["salesorder","estimate"]},{"id":"custbody_mx_cfdi_sat_export_type","type":"SELECT","keepHiddenIn":["salesorder","estimate"]},{"id":"custbody_mx_cfdi_usage","type":"SELECT","keepHiddenIn":["cashrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_txn_sat_payment_term","type":"SELECT","keepHiddenIn":["cashrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_txn_sat_payment_method","type":"SELECT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","opportunity","returnauthorization","vendorreturnauthorization"]},{"id":"custrecord_mx_rcs_rel_type","type":"SELECT"},{"id":"custbody_mx_journalentry_authorizedby","type":"SELECT","keepHiddenIn":["journalentry"]},{"id":"custbody_mx_journalentry_createdby","type":"SELECT","keepHiddenIn":["journalentry"]},{"id":"custentity_mx_sat_registered_name","type":"TEXT"},{"id":"custbody_mcf_sat_months","type":"SELECT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","creditmemo","salesorder"]},{"id":"custbody_mcf_sat_recurrence","type":"SELECT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","creditmemo","salesorder"]},{"id":"custbody_mcf_sat_year","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","creditmemo","salesorder"]}],"sublists":["recmachcustrecord_psg_mx_bank_info_entity","recmachcustrecord_mx_rcs_orig_trans"],"sublistColumns":[]}]}</custpage_lrcfm_datacarrier_text>
<dbstrantype>ItemShip</dbstrantype>
<defaultitemweight>1</defaultitemweight>
<defaultshipstage>B</defaultshipstage>
<entity>290</entity>
<entitycurrency>1</entitycurrency>
<entityname>278 NH Aceros</entityname>
<entryformquerystring>id=1520482&xml=T</entryformquerystring>
<exchangerate>1</exchangerate>
<excludefromglnumbering>F</excludefromglnumbering>
<fulfillmenthaslabel>F</fulfillmenthaslabel>
<fulfillmenthastnum>F</fulfillmenthastnum>
<id>1520482</id>
<ignoreshippervoiderror>F</ignoreshippervoiderror>
<inventorydetailuitype>LOH_STRICT_VALIDATION</inventorydetailuitype>
<isbasecurrency>T</isbasecurrency>
<isbrowserrequest>T</isbrowserrequest>
<isdynscriptingenabled>F</isdynscriptingenabled>
<isfreeshippingpromo>F</isfreeshippingpromo>
<isfulfillmentedit>T</isfulfillmentedit>
<islabelenabled>F</islabelenabled>
<ismultisubsidiary>F</ismultisubsidiary>
<kcurrency>1</kcurrency>
<lastmodifieddate>19/07/2024 10:22 am</lastmodifieddate>
<linked>F</linked>
<linkedclosedperioddiscounts>F</linkedclosedperioddiscounts>
<linkedrevrecje>F</linkedrevrecje>
<manualcredithold>F</manualcredithold>
<memo>se lo llevo manuel en el kenwor 10</memo>
<nlapiCC>F</nlapiCC>
<nldept>5</nldept>
<nlloc>0</nlloc>
<nlrole>3</nlrole>
<nlsub>4</nlsub>
<nluser>9672</nluser>
<nsapiCT>1790375326617</nsapiCT>
<ntype>32</ntype>
<onsaveshipmentweight>11477.34</onsaveshipmentweight>
<ordbulk>F</ordbulk>
<orderid>1520326</orderid>
<ordertype>SalesOrd</ordertype>
<originalshipstatus>C</originalshipstatus>
<originalsyncshipstatus>C</originalsyncshipstatus>
<overallbalance>13713995.78</overallbalance>
<overallunbilledorders>0.00</overallunbilledorders>
<phone>+526677895064</phone>
<pkgweightmanuallyupdated>F</pkgweightmanuallyupdated>
<postingperiod>587</postingperiod>
<pp_e>31/07/2024</pp_e>
<pp_s>01/07/2024</pp_s>
<ppsetbyuser>F</ppsetbyuser>
<prevdate>18/07/2024</prevdate>
<primarycurrency>1.00</primarycurrency>
<primarycurrencyfxrate>1.00</primarycurrencyfxrate>
<semail>gerencianh@almetal.mx</semail>
<sendorderfulfillmentemail>T</sendorderfulfillmentemail>
<shipaddress>Almacén Culiacan<br>Carretera Culiacancito Pte. 4557 <br>Ejido Humaya, Culiacán de Rosales<br>80058 Culiacán, Sinaloa<br>México</shipaddress>
<shipcarrier>nonups</shipcarrier>
<shipcity>Culiacán</shipcity>
<shipcompany>Almacén Culiacan</shipcompany>
<shipcountry>MX</shipcountry>
<shipisresidential>F</shipisresidential>
<shipphone>+526677895064</shipphone>
<shippingaddress_key>210891</shippingaddress_key>
<shippingcostoverridden>F</shippingcostoverridden>
<shippinggroupid>1</shippinggroupid>
<shipstate>Sinaloa</shipstate>
<shipstatus>C</shipstatus>
<shipzip>80058</shipzip>
<sonum>120796</sonum>
<srccountry>MX</srccountry>
<status>Shipped</status>
<statusRef>shipped</statusRef>
<storeorder>F</storeorder>
<subsidiary>4</subsidiary>
<taxperiod>608</taxperiod>
<trandate>18/07/2024</trandate>
<trandimensionunit>cm</trandimensionunit>
<tranid>134059</tranid>
<transactionnumber>ITEMSHIP134059</transactionnumber>
<tranweightunit>kgs</tranweightunit>
<type>itemship</type>
<unbilledorders>0.00</unbilledorders>
<usdtosubsidiaryexchangerate>17.95</usdtosubsidiaryexchangerate>
<version>187</version>
<voidblockedbylinks>F</voidblockedbylinks>
<voided>F</voided>
<weightconversionfactor>2.2046</weightconversionfactor>
<wfFC>workflow_fieldchanged</wfFC>
<wfPI>workflow_pageinit</wfPI>
<wfPS>workflow_postsourcing</wfPS>
<wfSR>workflow_saverecord</wfSR>
<wfVF>workflow_validatefield</wfVF>
<machine name="item" type="list" fields="line,orderdoc,orderline,itemreceive,generateaccruals,item,itemname,quantity,unitsdisplay,location,onhand,inventorydetail,custcol_drt_cp_pesoenkg,custcol_mx_txn_line_sat_item_code,custcol_drt_cp_unidadpeso,custcol_drt_cp_pesobruto,custcol_drt_cp_pesoneto,options,custcol_drt_cp_cvematerialpeligroso,custcol_drt_cp_materialpeligroso,cseg4,cseg3,cseg2,custcol_peso_embarque_udbase,custcol_drt_cp_obj_componentes,custcol_drt_cp_rfc_impo,custcol_drt_cp_ident_doc_aduanero,custcol_drt_cp_num_pedimento,custcol_drt_cp_tipo_documento,custcol_drt_cp_descripcion_materia,custcol_drt_cp_tipo_materia,custcol_drt_cp_uso_autorizado,custcol_drt_cp_datos_maquilador,custcol_drt_cp_datos_formulador,custcol_drt_cp_datos_fabricante,custcol_drt_cp_num_reg_san_plag_cofep,custcol_drt_cp_razon_social_emp_imp,custcol_drt_cp_num_cas,custcol_drt_cp_folio_impo_vucem,custcol_drt_cp_permiso_importacion,custcol_drt_cp_registro_sanitario_fol,custcol_drt_cp_condiciones_esp_transp,custcol_drt_cp_forma_farmaceutica,custcol_drt_cp_lote_medicamento,custcol_drt_cp_fecha_caducidad,custcol_drt_cp_fabricante,custcol_drt_cp_denomina_distinti_prod,custcol_drt_cp_denomina_generica_prod,custcol_drt_cp_nomquimico,custcol_drt_cp_nom_ingrediente_activo,custcol_drt_cp_sector_cofepris,custcol_alm_mat_peligro_sat,custcol_mcp_uuid_foreign_trade_cfdi,custcol_mcp_tariff_item_code,custcol_mcp_packaging_type,custcol_mcp_packaging_description,custcol_mcp_dangerous_goods_code,custcol_mcp_dangerous_goods,custcol_wms_packcarton,custcol_drtvolumentotalpies,custcol_drtvolumenpies,custcol_drtpesototal,custcol_drtpeso,custcol_drtvolumentotal,custcol_drtvolumen,custcol_acs_venta_enteros,custcol_drt_pc_pesotara,custcol_drt_cp_numpiezas,custcol_drt_cp_cvestransporte,custcol_drt_cp_uuidcomercioext,custcol_drt_cp_fraccionarancelaria,custcol_drt_cp_valormercancia,custcol_drt_cp_descripembalaje,custcol_drt_cp_embalaje,custcol_drt_cp_dimensiones,custcol_drt_cp_clavestcc,custcoldrt_peso_teorico_oc,custcol_mx_txn_line_sat_cust_req_num,displayname,class,department,excludefromraterequest,description,custcol_mcp_weight_in_kg,itemupc,itemweight,itemtype,itemsubtype,isnoninventory,itemkey,sitemname,itemdescription,itemunitprice,itemquantity,itemfxamount,producer,manufacturername,multmanufactureaddr,manufactureraddr1,manufacturercity,manufacturerstate,manufacturerzip,countryofmanufacture,manufacturertaxid,manufacturertariff,preferencecriterion,schedulebnumber,schedulebquantity,schedulebcode,ishazmatitem,hazmatid,hazmatshippingname,hazmathazardclass,hazmatpackinggroup,hazmatitemunits,hazmatitemunitsqty,hazmattechnicalname,locweightuom,locdimuom,originalquantity,units,unitconversion,inventorydetailavail,inventorydetailreq,binitem,isserial,isnumbered,locationusesbins,itemlocationbinlist,fulfillmentbin,fulfillmentstatus,fulfillmentstatusquantity,isinvdetaildirty,inventorydetailset,kitmemberof,kitlineid,kitlevel,kitmemberquantityfactor,ignorenulllimit,invttype,itemname_selector,wavefulfillment">
<line>
<binitem>T</binitem>
<custcol_acs_venta_enteros>T</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>979.2</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>979.2</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>979.2</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>8668</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>1848</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>20.4</custcoldrt_peso_teorico_oc>
<description>Polin 4" x 6" x 2" Cal.14o</description>
<displayname>POL0406200C14</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522869</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>11128</item>
<itemdescription>Polin 4" x 6" x 2" Cal.14o</itemdescription>
<itemfxamount>19298.4</itemfxamount>
<itemkey>11128</itemkey>
<itemname>Polin 4" x 6 x 2" Cal.14</itemname>
<itemname_selector>Polin 4" x 6 x 2" Cal.14</itemname_selector>
<itemquantity>48</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>402.05</itemunitprice>
<itemweight>44.9743092</itemweight>
<kitlineid>0</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>0</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>148</onhand>
<orderdoc>1520326</orderdoc>
<orderline>1</orderline>
<originalquantity>48</originalquantity>
<producer>F</producer>
<quantity>48</quantity>
<sitemname>Polin 4" x 6 x 2" Cal.14</sitemname>
<sys_id>11532361676908879</sys_id>
<unitconversion>1</unitconversion>
<units>7909</units>
<unitsdisplay>PZA</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
<line>
<binitem>T</binitem>
<custcol_acs_venta_enteros>T</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>1206.72</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>1206.72</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>1206.72</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>8668</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>1848</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>25.14</custcoldrt_peso_teorico_oc>
<description>Polin 6" x 6" Cal.14</description>
<displayname>POL0606C14</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522870</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>11116</item>
<itemdescription>Polin 6" x 6" Cal.14</itemdescription>
<itemfxamount>23782.56</itemfxamount>
<itemkey>11116</itemkey>
<itemname>Polin 6" x 6m Cal.14</itemname>
<itemname_selector>Polin 6" x 6m Cal.14</itemname_selector>
<itemquantity>48</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>495.47</itemunitprice>
<itemweight>55.42422222</itemweight>
<kitlineid>5</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>5</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>101</onhand>
<orderdoc>1520326</orderdoc>
<orderline>2</orderline>
<originalquantity>48</originalquantity>
<producer>F</producer>
<quantity>48</quantity>
<sitemname>Polin 6" x 6m Cal.14</sitemname>
<sys_id>11532361676908880</sys_id>
<unitconversion>1</unitconversion>
<units>7917</units>
<unitsdisplay>PZA</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
<line>
<binitem>T</binitem>
<custcol_acs_venta_enteros>T</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>156</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>156</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>156</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>6938</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>2025</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>3.28</custcoldrt_peso_teorico_oc>
<description>Perfil 3/4'' x 3/4'' Cal.20 (C075C20)</description>
<displayname>PTRC075C20</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522871</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>11585</item>
<itemdescription>Perfil 3/4'' x 3/4'' Cal.20 (C075C20)</itemdescription>
<itemfxamount>3901.5</itemfxamount>
<itemkey>11585</itemkey>
<itemname>PTR 3/4" x 3/4" Cal.20 a 6.00m</itemname>
<itemname_selector>PTR 3/4" x 3/4" Cal.20 a 6.00m</itemname_selector>
<itemquantity>50</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>78.03</itemunitprice>
<itemweight>6.87842376</itemweight>
<kitlineid>10</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>10</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>332</onhand>
<orderdoc>1520326</orderdoc>
<orderline>3</orderline>
<originalquantity>50</originalquantity>
<producer>F</producer>
<quantity>50</quantity>
<sitemname>PTR 3/4" x 3/4" Cal.20 a 6.00m</sitemname>
<sys_id>11532361676908881</sys_id>
<unitconversion>1</unitconversion>
<units>8270</units>
<unitsdisplay>PZA</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
<line>
<binitem>T</binitem>
<countryofmanufacture>MX</countryofmanufacture>
<custcol_acs_venta_enteros>T</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>318</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>318</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>318</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>6938</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>1848</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>6.85</custcoldrt_peso_teorico_oc>
<description>Perfil 2'' x 1'' Cal.20 (R200C20)</description>
<displayname>PTRR200C20</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522872</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>11569</item>
<itemdescription>Perfil 2'' x 1'' Cal.20 (R200C20)</itemdescription>
<itemfxamount>7953.5</itemfxamount>
<itemkey>11569</itemkey>
<itemname>PTR 2" x 1" Cal.20 a 6.00m</itemname>
<itemname_selector>PTR 2" x 1" Cal.20 a 6.00m</itemname_selector>
<itemquantity>50</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>159.07</itemunitprice>
<itemweight>14.02140228</itemweight>
<kitlineid>15</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>15</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>194</onhand>
<orderdoc>1520326</orderdoc>
<orderline>4</orderline>
<originalquantity>50</originalquantity>
<producer>F</producer>
<quantity>50</quantity>
<sitemname>PTR 2" x 1" Cal.20 a 6.00m</sitemname>
<sys_id>11532361676908882</sys_id>
<unitconversion>1</unitconversion>
<units>8257</units>
<unitsdisplay>PZA</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
<line>
<binitem>T</binitem>
<custcol_acs_venta_enteros>F</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>88</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>88</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>88</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>6938</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>1554</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>4.33</custcoldrt_peso_teorico_oc>
<description>Solera 3/16'' x 3/4''</description>
<displayname>SOL018075</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522873</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>11469</item>
<itemdescription>Solera 3/16'' x 3/4''</itemdescription>
<itemfxamount>1874.8</itemfxamount>
<itemkey>11469</itemkey>
<itemname>Solera 3/16'' x 3/4''</itemname>
<itemname_selector>Solera 3/16'' x 3/4''</itemname_selector>
<itemquantity>20</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>93.74</itemunitprice>
<itemweight>9.54601759</itemweight>
<kitlineid>20</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>20</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>140.83756</onhand>
<orderdoc>1520326</orderdoc>
<orderline>5</orderline>
<originalquantity>20</originalquantity>
<producer>F</producer>
<quantity>20</quantity>
<sitemname>Solera 3/16'' x 3/4''</sitemname>
<sys_id>11532361676908883</sys_id>
<unitconversion>1</unitconversion>
<units>8555</units>
<unitsdisplay>Pz</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
<line>
<binitem>T</binitem>
<custcol_acs_venta_enteros>T</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>135</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>135</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>135</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>6938</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>2025</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>8.85</custcoldrt_peso_teorico_oc>
<description>Perfil 1 1/4'' x 1 1/4'' Cal.16 (C125C16)</description>
<displayname>PTRC125C16</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522874</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>11558</item>
<itemdescription>Perfil 1 1/4'' x 1 1/4'' Cal.16 (C125C16)</itemdescription>
<itemfxamount>2733</itemfxamount>
<itemkey>11558</itemkey>
<itemname>PTR 1 1/4" x 1 1/4" Cal.16 a 6.00m</itemname>
<itemname_selector>PTR 1 1/4" x 1 1/4" Cal.16 a 6.00m</itemname_selector>
<itemquantity>15</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>182.2</itemunitprice>
<itemweight>19.04794272</itemweight>
<kitlineid>25</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>25</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>157</onhand>
<orderdoc>1520326</orderdoc>
<orderline>6</orderline>
<originalquantity>15</originalquantity>
<producer>F</producer>
<quantity>15</quantity>
<sitemname>PTR 1 1/4" x 1 1/4" Cal.16 a 6.00m</sitemname>
<sys_id>11532361676908884</sys_id>
<unitconversion>1</unitconversion>
<units>8226</units>
<unitsdisplay>PZA</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
<line>
<binitem>T</binitem>
<custcol_acs_venta_enteros>T</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>445.2</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>445.2</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>445.2</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>6938</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>2025</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>5.4</custcoldrt_peso_teorico_oc>
<description>Perfil 1 3/4'' x 3/4'' Cal.20 (R175C20)</description>
<displayname>PTRR175C20</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522875</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>11562</item>
<itemdescription>Perfil 1 3/4'' x 3/4'' Cal.20 (R175C20)</itemdescription>
<itemfxamount>11135.04</itemfxamount>
<itemkey>11562</itemkey>
<itemname>PTR 1 3/4" x 3/4" Cal.20 a 6.00m</itemname>
<itemname_selector>PTR 1 3/4" x 3/4" Cal.20 a 6.00m</itemname_selector>
<itemquantity>84</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>132.56</itemunitprice>
<itemweight>11.64040944</itemweight>
<kitlineid>30</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>30</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>63</onhand>
<orderdoc>1520326</orderdoc>
<orderline>7</orderline>
<originalquantity>84</originalquantity>
<producer>F</producer>
<quantity>84</quantity>
<sitemname>PTR 1 3/4" x 3/4" Cal.20 a 6.00m</sitemname>
<sys_id>11532361676908885</sys_id>
<unitconversion>1</unitconversion>
<units>8231</units>
<unitsdisplay>PZA</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
<line>
<binitem>T</binitem>
<custcol_acs_venta_enteros>T</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>226.8</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>226.8</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>226.8</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>6938</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>2025</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>49.2</custcoldrt_peso_teorico_oc>
<description>PTR 3" x 3" Cal.10 (C300C10)</description>
<displayname>PTRC300C10</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522876</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>11225</item>
<itemdescription>PTR 3" x 3" Cal.10 (C300C10)</itemdescription>
<itemfxamount>4469.9</itemfxamount>
<itemkey>11225</itemkey>
<itemname>PTR 3" x 3" Cal.10 a 6.00m</itemname>
<itemname_selector>PTR 3" x 3" Cal.10 a 6.00m</itemname_selector>
<itemquantity>5</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>893.98</itemunitprice>
<itemweight>100.00169928</itemweight>
<kitlineid>35</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>35</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>14</onhand>
<orderdoc>1520326</orderdoc>
<orderline>8</orderline>
<originalquantity>5</originalquantity>
<producer>F</producer>
<quantity>5</quantity>
<sitemname>PTR 3" x 3" Cal.10 a 6.00m</sitemname>
<sys_id>11532361676908886</sys_id>
<unitconversion>1</unitconversion>
<units>7883</units>
<unitsdisplay>PZA</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
<line>
<binitem>T</binitem>
<custcol_acs_venta_enteros>T</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>473.34</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>473.34</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>473.34</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>6938</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>2025</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>10.02</custcoldrt_peso_teorico_oc>
<description>Perfil 3'' x 1 1/2'' Cal.20 (R300C20)</description>
<displayname>PTRR300C20</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522877</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>11583</item>
<itemdescription>Perfil 3'' x 1 1/2'' Cal.20 (R300C20)</itemdescription>
<itemfxamount>11838.89</itemfxamount>
<itemkey>11583</itemkey>
<itemname>PTR 3" x 1 1/2" Cal.20 a 6.00m</itemname>
<itemname_selector>PTR 3" x 1 1/2" Cal.20 a 6.00m</itemname_selector>
<itemquantity>49</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>241.61</itemunitprice>
<itemweight>21.29665818</itemweight>
<kitlineid>40</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>40</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>140</onhand>
<orderdoc>1520326</orderdoc>
<orderline>9</orderline>
<originalquantity>49</originalquantity>
<producer>F</producer>
<quantity>49</quantity>
<sitemname>PTR 3" x 1 1/2" Cal.20 a 6.00m</sitemname>
<sys_id>11532361676908887</sys_id>
<unitconversion>1</unitconversion>
<units>8268</units>
<unitsdisplay>PZA</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
<line>
<binitem>T</binitem>
<custcol_acs_venta_enteros>T</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>251.1</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>251.1</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>251.1</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>6938</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>1848</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>9.6</custcoldrt_peso_teorico_oc>
<description>Perfil M600 Cal.20</description>
<displayname>PR00M600C20</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522878</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>11815</item>
<itemdescription>Perfil M600 Cal.20</itemdescription>
<itemfxamount>6280.2</itemfxamount>
<itemkey>11815</itemkey>
<itemname>Perfil Negro M600 Cal.20</itemname>
<itemname_selector>Perfil Negro M600 Cal.20</itemname_selector>
<itemquantity>27</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>232.6</itemunitprice>
<itemweight>20.48094767</itemweight>
<kitlineid>45</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>45</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>80.5</onhand>
<orderdoc>1520326</orderdoc>
<orderline>10</orderline>
<originalquantity>27</originalquantity>
<producer>F</producer>
<quantity>27</quantity>
<sitemname>Perfil Negro M600 Cal.20</sitemname>
<sys_id>11532361676908888</sys_id>
<unitconversion>1</unitconversion>
<units>8205</units>
<unitsdisplay>PZA</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
<line>
<binitem>T</binitem>
<custcol_acs_venta_enteros>F</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>309</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>309</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>309</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>6938</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>1554</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>31</custcoldrt_peso_teorico_oc>
<description>Solera 1/4'' x 4''</description>
<displayname>SOL025400</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522879</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>11407</item>
<itemdescription>Solera 1/4'' x 4''</itemdescription>
<itemfxamount>7014.6</itemfxamount>
<itemkey>11407</itemkey>
<itemname>Solera 1/4'' x 4''</itemname>
<itemname_selector>Solera 1/4'' x 4''</itemname_selector>
<itemquantity>10</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>701.46</itemunitprice>
<itemweight>68.343313</itemweight>
<kitlineid>50</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>50</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>73.7504</onhand>
<orderdoc>1520326</orderdoc>
<orderline>11</orderline>
<originalquantity>10</originalquantity>
<producer>F</producer>
<quantity>10</quantity>
<sitemname>Solera 1/4'' x 4''</sitemname>
<sys_id>11532361676908889</sys_id>
<unitconversion>1</unitconversion>
<units>8555</units>
<unitsdisplay>Pz</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
<line>
<binitem>T</binitem>
<custcol_acs_venta_enteros>T</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>270</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>270</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>270</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>6938</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>1758</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>27</custcoldrt_peso_teorico_oc>
<description>Lamina Negra 3' x 8' Cal.16</description>
<displayname>LNE308C16</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522880</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>10796</item>
<itemdescription>Lamina Negra 3' x 8' Cal.16</itemdescription>
<itemfxamount>6495</itemfxamount>
<itemkey>10796</itemkey>
<itemname>Lamina Negra 3'x 8' Cal.16</itemname>
<itemname_selector>Lamina Negra 3'x 8' Cal.16</itemname_selector>
<itemquantity>10</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>649.5</itemunitprice>
<itemupc>100000010796</itemupc>
<itemweight>59.524821</itemweight>
<kitlineid>55</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>55</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>51</onhand>
<orderdoc>1520326</orderdoc>
<orderline>12</orderline>
<originalquantity>10</originalquantity>
<producer>F</producer>
<quantity>10</quantity>
<sitemname>Lamina Negra 3'x 8' Cal.16</sitemname>
<sys_id>11532361676908890</sys_id>
<unitconversion>1</unitconversion>
<units>7324</units>
<unitsdisplay>PZA</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
<line>
<binitem>T</binitem>
<custcol_acs_venta_enteros>T</custcol_acs_venta_enteros>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesobruto>264</custcol_drt_cp_pesobruto>
<custcol_drt_cp_pesoenkg>264</custcol_drt_cp_pesoenkg>
<custcol_drt_cp_pesoneto>264</custcol_drt_cp_pesoneto>
<custcol_drt_cp_unidadpeso>6938</custcol_drt_cp_unidadpeso>
<custcol_drtpesototal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtpesototal>
<custcol_drtvolumentotal>ERROR: Field 'adjustqtyby' Not Found</custcol_drtvolumentotal>
<custcol_mx_txn_line_sat_item_code>1758</custcol_mx_txn_line_sat_item_code>
<custcoldrt_peso_teorico_oc>22</custcoldrt_peso_teorico_oc>
<description>Lamina Negra 3' x 8' Cal.18</description>
<displayname>LNE308C18</displayname>
<excludefromraterequest>F</excludefromraterequest>
<fulfillmentstatusquantity>0</fulfillmentstatusquantity>
<generateaccruals>T</generateaccruals>
<ignorenulllimit>F</ignorenulllimit>
<inventorydetail>522881</inventorydetail>
<inventorydetailavail>T</inventorydetailavail>
<inventorydetailreq>T</inventorydetailreq>
<inventorydetailset>T</inventorydetailset>
<invttype>T</invttype>
<ishazmatitem>F</ishazmatitem>
<isinvdetaildirty>F</isinvdetaildirty>
<isnoninventory>F</isnoninventory>
<isnumbered>F</isnumbered>
<isserial>F</isserial>
<item>10797</item>
<itemdescription>Lamina Negra 3' x 8' Cal.18</itemdescription>
<itemfxamount>6350.64</itemfxamount>
<itemkey>10797</itemkey>
<itemname>Lamina Negra 3'x 8' Cal.18</itemname>
<itemname_selector>Lamina Negra 3'x 8' Cal.18</itemname_selector>
<itemquantity>12</itemquantity>
<itemreceive>T</itemreceive>
<itemtype>InvtPart</itemtype>
<itemunitprice>529.22</itemunitprice>
<itemupc>100000010797</itemupc>
<itemweight>48.501706</itemweight>
<kitlineid>60</kitlineid>
<kitmemberquantityfactor>0</kitmemberquantityfactor>
<line>60</line>
<location>3</location>
<locationusesbins>T</locationusesbins>
<locdimuom>cm</locdimuom>
<locweightuom>kgs</locweightuom>
<multmanufactureaddr>F</multmanufactureaddr>
<onhand>28</onhand>
<orderdoc>1520326</orderdoc>
<orderline>13</orderline>
<originalquantity>12</originalquantity>
<producer>F</producer>
<quantity>12</quantity>
<sitemname>Lamina Negra 3'x 8' Cal.18</sitemname>
<sys_id>11532361676908891</sys_id>
<unitconversion>1</unitconversion>
<units>7325</units>
<unitsdisplay>PZA</unitsdisplay>
<wavefulfillment>F</wavefulfillment>
</line>
</machine>
<machine name="package" type="edit" fields="packageweight,packagedescr,pkgTrackingNumberKey,pkgTrackingNumberUrl,packagetrackingnumber,trackingnumberkey,packagecartonnumber">
<line>
<packageweight>5206.087</packageweight>
<pkgTrackingNumberUrl>/app/common/shipping/packagetracker.nl</pkgTrackingNumberUrl>
<sys_id>11532361676959226</sys_id>
</line>
</machine>
<machine name="appliedrules" type="list" fields="creationdate,ruletypetranslation,details,transactionversion,ruletype,id,parenttransaction,externallogid,detailsurl"/>
<machine name="glimpactchanges" type="list" fields="creationdate,transactiondate,transactiontype,transactionkey,transactionnumber,transactionurl,changedby"/>
</record>
</nsResponse>
```

### XML Certificado de la transaccion generado con la plantilla de MySuite:

```xml
<fx:FactDocMX xmlns:fx="http://www.fact.com.mx/schema/fx" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.fact.com.mx/schema/fx http://www.mysuitemex.com/fact/schema/fx_2010_g.xsd">
<fx:Version>8</fx:Version>
<fx:Identificacion>
<fx:CdgPaisEmisor>MX</fx:CdgPaisEmisor>
<fx:TipoDeComprobante>TRASLADO</fx:TipoDeComprobante>
<fx:RFCEmisor>PFP810520JX0</fx:RFCEmisor>
<fx:RazonSocialEmisor>PROVEEDORA DE FIERRO Y PERFILES</fx:RazonSocialEmisor>
<fx:Usuario>SISTEMAS ALMETAL</fx:Usuario>
<fx:AsignacionSolicitada>
<fx:Folio>ITEMSHIP134059</fx:Folio>
<fx:TiempoDeEmision>2024-07-18T00:00:00</fx:TiempoDeEmision>
</fx:AsignacionSolicitada>
<fx:Exportacion>01</fx:Exportacion>
<fx:LugarExpedicion>81460</fx:LugarExpedicion>
</fx:Identificacion>
<fx:Emisor>
<fx:RegimenFiscal>
<fx:Regimen>601</fx:Regimen>
</fx:RegimenFiscal>
</fx:Emisor>
<fx:Receptor>
<fx:CdgPaisReceptor>MX</fx:CdgPaisReceptor>
<fx:RFCReceptor>PFP810520JX0</fx:RFCReceptor>
<!-- <fx:NombreReceptor>NH ACEROS</fx:NombreReceptor> -->
<!--  <fx:NombreReceptor>278 NH ACEROS SA DE CV</fx:NombreReceptor>  -->
<fx:NombreReceptor>PROVEEDORA DE FIERRO Y PERFILES</fx:NombreReceptor>
<fx:DomicilioFiscalReceptor>81460</fx:DomicilioFiscalReceptor>
<fx:RegimenFiscalReceptor>601</fx:RegimenFiscalReceptor>
<fx:UsoCFDI>S01</fx:UsoCFDI>
</fx:Receptor>
<fx:Conceptos>
<fx:Concepto>
<fx:Cantidad>48.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>PZA</fx:UnidadDeMedida>
<fx:ClaveProdServ>30102304</fx:ClaveProdServ>
<fx:Codigo>Polin 4" x 6" x 2" Cal.14</fx:Codigo>
<fx:Descripcion>Polin 4" x 6" x 2" Cal.14o</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
<fx:Concepto>
<fx:Cantidad>48.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>PZA</fx:UnidadDeMedida>
<fx:ClaveProdServ>30102304</fx:ClaveProdServ>
<fx:Codigo>Polin 6" x 6" Cal.14</fx:Codigo>
<fx:Descripcion>Polin 6" x 6" Cal.14</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
<fx:Concepto>
<fx:Cantidad>50.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>PZA</fx:UnidadDeMedida>
<fx:ClaveProdServ>40181800</fx:ClaveProdServ>
<fx:Codigo>Perfil 3/4'' x 3/4'' Cal.20 (C075C20)</fx:Codigo>
<fx:Descripcion>Perfil 3/4'' x 3/4'' Cal.20 (C075C20)</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
<fx:Concepto>
<fx:Cantidad>50.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>PZA</fx:UnidadDeMedida>
<fx:ClaveProdServ>30102304</fx:ClaveProdServ>
<fx:Codigo>Perfil 2'' x 1'' Cal.20 (R200C20)</fx:Codigo>
<fx:Descripcion>Perfil 2'' x 1'' Cal.20 (R200C20)</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
<fx:Concepto>
<fx:Cantidad>20.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>Pz</fx:UnidadDeMedida>
<fx:ClaveProdServ>30263600</fx:ClaveProdServ>
<fx:Codigo>Solera 3/16'' x 3/4''</fx:Codigo>
<fx:Descripcion>Solera 3/16'' x 3/4''</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
<fx:Concepto>
<fx:Cantidad>15.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>PZA</fx:UnidadDeMedida>
<fx:ClaveProdServ>40181800</fx:ClaveProdServ>
<fx:Codigo>Perfil 1 1/4'' x 1 1/4'' Cal.16 (C125C16)</fx:Codigo>
<fx:Descripcion>Perfil 1 1/4'' x 1 1/4'' Cal.16 (C125C16)</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
<fx:Concepto>
<fx:Cantidad>84.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>PZA</fx:UnidadDeMedida>
<fx:ClaveProdServ>40181800</fx:ClaveProdServ>
<fx:Codigo>Perfil 1 3/4'' x 3/4'' Cal.20 (R175C20)</fx:Codigo>
<fx:Descripcion>Perfil 1 3/4'' x 3/4'' Cal.20 (R175C20)</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
<fx:Concepto>
<fx:Cantidad>5.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>PZA</fx:UnidadDeMedida>
<fx:ClaveProdServ>40181800</fx:ClaveProdServ>
<fx:Codigo>PTR 3" x 3" Cal.10 (C300C10)</fx:Codigo>
<fx:Descripcion>PTR 3" x 3" Cal.10 (C300C10)</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
<fx:Concepto>
<fx:Cantidad>49.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>PZA</fx:UnidadDeMedida>
<fx:ClaveProdServ>40181800</fx:ClaveProdServ>
<fx:Codigo>Perfil 3'' x 1 1/2'' Cal.20 (R300C20)</fx:Codigo>
<fx:Descripcion>Perfil 3'' x 1 1/2'' Cal.20 (R300C20)</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
<fx:Concepto>
<fx:Cantidad>27.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>PZA</fx:UnidadDeMedida>
<fx:ClaveProdServ>30102304</fx:ClaveProdServ>
<fx:Codigo>Perfil M600 Cal.20</fx:Codigo>
<fx:Descripcion>Perfil M600 Cal.20</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
<fx:Concepto>
<fx:Cantidad>10.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>Pz</fx:UnidadDeMedida>
<fx:ClaveProdServ>30263600</fx:ClaveProdServ>
<fx:Codigo>Solera 1/4'' x 4''</fx:Codigo>
<fx:Descripcion>Solera 1/4'' x 4''</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
<fx:Concepto>
<fx:Cantidad>10.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>PZA</fx:UnidadDeMedida>
<fx:ClaveProdServ>30102004</fx:ClaveProdServ>
<fx:Codigo>Lamina Negra 3' x 8' Cal.16</fx:Codigo>
<fx:Descripcion>Lamina Negra 3' x 8' Cal.16</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
<fx:Concepto>
<fx:Cantidad>12.000000</fx:Cantidad>
<fx:ClaveUnidad>H87</fx:ClaveUnidad>
<fx:UnidadDeMedida>PZA</fx:UnidadDeMedida>
<fx:ClaveProdServ>30102004</fx:ClaveProdServ>
<fx:Codigo>Lamina Negra 3' x 8' Cal.18</fx:Codigo>
<fx:Descripcion>Lamina Negra 3' x 8' Cal.18</fx:Descripcion>
<fx:ValorUnitario>0.00</fx:ValorUnitario>
<fx:Importe>0.00</fx:Importe>
<fx:ObjetoImp>01</fx:ObjetoImp>
<fx:Opciones> </fx:Opciones>
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
<fx:CartaPorte31 Version="3.1" IdCCP="CCCfc940-3d71-4d8e-bc00-afa4276da9ee" TranspInternac="No" TotalDistRec="120.00">
<fx:Ubicaciones>
<fx:Ubicacion TipoUbicacion="Origen" IDUbicacion="OR000001" RFCRemitenteDestinatario="PFP810520JX0" NombreRemitenteDestinatario="PROVEEDORA DE FIERRO Y PERFILES" FechaHoraSalidaLlegada="2024-07-19T07:00:00">
<fx:Domicilio Calle="E. ZAPATA Y MORELOS" NumeroExterior="S/N" Colonia="0833" Localidad="06" Referencia="6737320622" Municipio="015" Estado="SIN" Pais="MEX" CodigoPostal="81460"/>
</fx:Ubicacion>
<fx:Ubicacion TipoUbicacion="Destino" IDUbicacion="DE001002" RFCRemitenteDestinatario="NAC930405296" NombreRemitenteDestinatario="NH ACEROS SA DE CV" FechaHoraSalidaLlegada="2024-07-19T10:30:00" DistanciaRecorrida="120.00">
<fx:Domicilio Calle="CARRET. A CULIACANCITO PONIENTE" NumeroExterior="4557" Colonia="0042" Localidad="02" Referencia="6677895064" Municipio="006" Estado="SIN" Pais="MEX" CodigoPostal="80020"/>
</fx:Ubicacion>
</fx:Ubicaciones>
<fx:Mercancias PesoBrutoTotal="5122.360" UnidadPeso="KGM" PesoNetoTotal="5122.360" NumTotalMercancias="13" LogisticaInversaRecoleccionDevolucion="Sí">
<fx:Mercancia BienesTransp="30102304" Descripcion="Polin 4'' x 6'' x 2'' Cal.14" Cantidad="48.000000" ClaveUnidad="H87" Unidad="7909" PesoEnKg="979.200">
<!--  -->
<fx:CantidadTransporta Cantidad="48.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Mercancia BienesTransp="30102304" Descripcion="Polin 6'' x 6'' Cal.14" Cantidad="48.000000" ClaveUnidad="H87" Unidad="7917" PesoEnKg="1206.720">
<!--  -->
<fx:CantidadTransporta Cantidad="48.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Mercancia BienesTransp="40181800" Descripcion="Perfil 3/4'' x 3/4'' Cal.20 (C075C20)" Cantidad="50.000000" ClaveUnidad="H87" Unidad="8270" PesoEnKg="156.000">
<!--  -->
<fx:CantidadTransporta Cantidad="50.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Mercancia BienesTransp="30102304" Descripcion="Perfil 2'' x 1'' Cal.20 (R200C20)" Cantidad="50.000000" ClaveUnidad="H87" Unidad="8257" PesoEnKg="318.000">
<!--  -->
<fx:CantidadTransporta Cantidad="50.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Mercancia BienesTransp="30263600" Descripcion="Solera 3/16'' x 3/4''" Cantidad="20.000000" ClaveUnidad="H87" Unidad="8555" PesoEnKg="88.000">
<!--  -->
<fx:CantidadTransporta Cantidad="20.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Mercancia BienesTransp="40181800" Descripcion="Perfil 1 1/4'' x 1 1/4'' Cal.16 (C125C16)" Cantidad="15.000000" ClaveUnidad="H87" Unidad="8226" PesoEnKg="135.000">
<!--  -->
<fx:CantidadTransporta Cantidad="15.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Mercancia BienesTransp="40181800" Descripcion="Perfil 1 3/4'' x 3/4'' Cal.20 (R175C20)" Cantidad="84.000000" ClaveUnidad="H87" Unidad="8231" PesoEnKg="445.200">
<!--  -->
<fx:CantidadTransporta Cantidad="84.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Mercancia BienesTransp="40181800" Descripcion="PTR 3'' x 3'' Cal.10 (C300C10)" Cantidad="5.000000" ClaveUnidad="H87" Unidad="7883" PesoEnKg="226.800">
<!--  -->
<fx:CantidadTransporta Cantidad="5.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Mercancia BienesTransp="40181800" Descripcion="Perfil 3'' x 1 1/2'' Cal.20 (R300C20)" Cantidad="49.000000" ClaveUnidad="H87" Unidad="8268" PesoEnKg="473.340">
<!--  -->
<fx:CantidadTransporta Cantidad="49.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Mercancia BienesTransp="30102304" Descripcion="Perfil M600 Cal.20" Cantidad="27.000000" ClaveUnidad="H87" Unidad="8205" PesoEnKg="251.100">
<!--  -->
<fx:CantidadTransporta Cantidad="27.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Mercancia BienesTransp="30263600" Descripcion="Solera 1/4'' x 4''" Cantidad="10.000000" ClaveUnidad="H87" Unidad="8555" PesoEnKg="309.000">
<!--  -->
<fx:CantidadTransporta Cantidad="10.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Mercancia BienesTransp="30102004" Descripcion="Lamina Negra 3' x 8' Cal.16" Cantidad="10.000000" ClaveUnidad="H87" Unidad="7324" PesoEnKg="270.000">
<!--  -->
<fx:CantidadTransporta Cantidad="10.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Mercancia BienesTransp="30102004" Descripcion="Lamina Negra 3' x 8' Cal.18" Cantidad="12.000000" ClaveUnidad="H87" Unidad="7325" PesoEnKg="264.000">
<!--  -->
<fx:CantidadTransporta Cantidad="12.000000" IDOrigen="OR000001" IDDestino="DE001002"/>
</fx:Mercancia>
<fx:Autotransporte PermSCT="TPAF01" NumPermisoSCT="2547NIVY24052012021001018">
<fx:IdentificacionVehicular ConfigVehicular="C2" PlacaVM="52AL5F" AnioModeloVM="2019" PesoBrutoVehicular="19"/>
<fx:Seguros AseguraRespCivil="HDI SEGUROS" PolizaRespCivil="571578765"/>
</fx:Autotransporte>
</fx:Mercancias>
<fx:FiguraTransporte>
<fx:TiposFigura TipoFigura="01" RFCFigura="PEGM761010262" NumLicencia="B060174134" NombreFigura="Manuel de Jesus Perea Gaxiola">
<!--  
<fx:PartesTransporte ParteTransporte="PT01"/>
  -->
<fx:Domicilio Calle="Av. Alemania" NumeroExterior="615" Colonia="0842" Localidad="06" Municipio="015" Estado="SIN" Pais="MEX" CodigoPostal="81476"/>
</fx:TiposFigura>
</fx:FiguraTransporte>
</fx:CartaPorte31>
</fx:Complementos>
</fx:FactDocMX>
```

### XML de Cliente Relacionado al ItemFullFillment:

```xml
This XML file does not appear to have any style information associated with it. The document tree is shown below.
<nsResponse>
<record recordType="customer" id="290" perm="4" fields="_eml_nkey_,isautogeneratedrepresentingentity,_multibtnstate_,selectedtab,nsapiPI,nsapiSR,nsapiVF,nsapiFC,nsapiPS,nsapiVI,nsapiVD,nsapiPD,nsapiVL,nsapiRC,nsapiLI,nsapiLC,nsapiCT,nsbrowserenv,wfPI,wfSR,wfVF,wfFC,wfPS,type,id,externalid,whence,customwhence,entryformquerystring,_csrf,wfinstances,isindividual,entityid,custentity_mx_rfc,salutation,firstname,middlename,lastname,title,companyname,salesrep,image,partner,contribpct,comments,custentitydrt_descuieno_maxcustomoe,custentity_drt_sed_email_invoice,custentity_drt_sed_email_customerpayment,phone,altphone,mobilephone,homephone,fax,defaultaddress,email,altemail,url,custentity_wmsse_asn_required,custentity_mx_sat_registered_name,custentity_mx_sat_industry_type,custentity_drt_nc_mx_cfdi_usage,defaultorderpriority,category,entitystatus,subsidiary,representingsubsidiary,custentity_radi_oyster_ap_clabe,custentity_2663_email_address_notif,custentity_coordenada_cliente,entitynumber,entitytitle,version,nluser,nlrole,nldept,nlloc,nlsub,baserecordtype,hasshipping,otherrelationships,ntype,nameorig,initiallyOverrideAllowed,language,numberformat,negativenumberformat,emailpreference,printoncheckas,sendtransactionsvia,shipcomplete,shippingcarrier,shippingitem,alcoholrecipienttype,accountnumber,receivablesaccount,startdate,enddate,reminderdays,pricelevel,currency,terms,creditlimit,creditholdoverride,vatregnumber,taxfractionunit,taxrounding,custpage_defaultwitaxfield,custpage_wht_apply_as,custentity_sii_id_type,custentity_sii_id,custentity_tax_reg_no,taxitem,resalenumber,balance,depositbalance,overduebalance,unbilledorders,daysoverdue,custentity_dic,custentity_ico,custentity_4599_sg_uen,custentity_my_brn,custentity_4601_defaultwitaxcode,custentity_wht_je_apply_as,custentity_sang_clasi_cliente_ventas,aging,aging1,aging2,aging3,aging4,origcurrency,polymorphcontainscreditlimit,currencyprecision,endbeforestart,ccmachineidx,receivablesacctpref,intercoreceivablesacctpref,accesstabchanged,giveaccesschanged,giveaccess,assignedwebsite,accessrole,emailloginkey,accesshelp,loginas,stagename,emailtransactions,printtransactions,faxtransactions,isperson,freeformstatepref,sessioncountry,defaultaddressee,defaultaddrbook,billattention,billaddressee,billaddr1,billaddr2,billaddr3,billcity,billstate,billzip,billcountry,hasbillingaddress,shipattention,shipaddressee,shipaddr1,shipaddr2,shipaddr3,shipcity,shipstate,shipzip,shipcountry,hasshippingaddress,currid,submitnext_t,submitnext_y,partnerstotal,unsubscribe,globalsubscriptionstatus,estimatedbudget,isbudgetapproved,salesreadiness,buyingreason,buyingtimeframe,territory,leadsource,weblead,sourcewebsite,campaigncategory,campaignevent,custentity_link_name_lsa,custentity_date_lsa,custentity_link_lsa,custentity_radi_oyster_ap_rfc,custentity_ph4185_bstyle,custentity_tax_contact_last,custentity_tax_contact_first,custentity_tax_contact_middle,custentity_tax_contact,custentity_psg_ei_entity_edoc_standard,custentity_edoc_gen_trans_pdf,custentity_psg_ei_auto_select_temp_sm,custentity_psg_ei_peppol_id,custentity_edoc_sender_domain,custentity_edoc_use_sender_list,custentity_edoc_ws_id,custentity_edoc_ws_sender,custentity_psg_ei_email_template,custentity_2663_direct_debit,custentity_9572_ddcust_entitybank_sub,custentity_9572_ddcust_entitybnkformat,custentity_9572_dd_file_format,custentity_2663_customer_refund,custentity_9572_refundcust_entitybnk_sub,custentity_9572_refcust_entitybnkformat,custentity_9572_custref_file_format,custentity_drt_nc_send_custom,custentity_drt_nc_desglose_ieps,custentity_drt_nc_identificador_novacaja,custentity_drt_nc_conexion,custentity_drt_sin_credito,custentity_packship_customer_packinstruc,custentity_maxdiscount_margin_percent,custentity_custrec_service_level,custentity_9997_dd_file_format,dateclosed,lastsaledate,origsubstatus,lastmodifieddate,datecreated,isinactive,edition,origbinactive,origgiveaccess,origaccessrole,haschildren,hasparent,shipping_country,isjob,stage,propagateactivity,invalidemaildiv,emailval,custpage_itr_subsidiarycache,custpage_cs_msgs,custpage_taf_subsidiarycache,custpage_taf_subcountrycount,custpage_lsa_vis,custpage_lrcfm_datacarrier_text,custpage_2663_translate_msgs,syncpartnerteams">
<_csrf>a4F-NUDsGn2UUDaF3V_5_ih_1q5NLzF1MU4NsGPY9cA_9k5choA1Dd04uS99fgEVnFFFD_KRokVIkIK12C9djxmau3C2r18uLH3TTNKCJGssUW55srpbf5VullR1TMpLhomcVtUQ3gCvkiTL-4J8Qnct2JtDvB2UvNpIsbBtj30=</_csrf>
<_eml_nkey_>5490848~9672~3~N</_eml_nkey_>
<accessrole>14</accessrole>
<accesstabchanged>F</accesstabchanged>
<aging>0.00</aging>
<aging1>27171.69</aging1>
<aging2>15515.28</aging2>
<aging3>75691.14</aging3>
<aging4>13595617.67</aging4>
<alcoholrecipienttype>CONSUMER</alcoholrecipienttype>
<balance>13713995.78</balance>
<baserecordtype>customer</baserecordtype>
<billaddressee>NH ACEROS</billaddressee>
<billcity>EJIDO HUMAYA</billcity>
<billcountry>MX</billcountry>
<billstate>SIN</billstate>
<billzip>80058</billzip>
<category>3</category>
<companyname>NH Aceros</companyname>
<creditholdoverride>OFF</creditholdoverride>
<creditlimit>16000000.00</creditlimit>
<currency>1</currency>
<currencyprecision>2</currencyprecision>
<currid>290</currid>
<custentity_2663_customer_refund>F</custentity_2663_customer_refund>
<custentity_2663_direct_debit>F</custentity_2663_direct_debit>
<custentity_drt_nc_desglose_ieps>F</custentity_drt_nc_desglose_ieps>
<custentity_drt_nc_mx_cfdi_usage>1</custentity_drt_nc_mx_cfdi_usage>
<custentity_drt_nc_send_custom>F</custentity_drt_nc_send_custom>
<custentity_drt_sed_email_customerpayment>gerencianh@almetal.mx</custentity_drt_sed_email_customerpayment>
<custentity_drt_sed_email_invoice>gerencianh@almetal.mx</custentity_drt_sed_email_invoice>
<custentity_drt_sin_credito>F</custentity_drt_sin_credito>
<custentity_edoc_gen_trans_pdf>T</custentity_edoc_gen_trans_pdf>
<custentity_edoc_use_sender_list>F</custentity_edoc_use_sender_list>
<custentity_mx_rfc>NAC930405296</custentity_mx_rfc>
<custentity_mx_sat_industry_type>1</custentity_mx_sat_industry_type>
<custentity_mx_sat_registered_name>NH ACEROS</custentity_mx_sat_registered_name>
<custentity_psg_ei_auto_select_temp_sm>T</custentity_psg_ei_auto_select_temp_sm>
<custentity_psg_ei_entity_edoc_standard>3</custentity_psg_ei_entity_edoc_standard>
<custentity_radi_oyster_ap_rfc>NAC930405296</custentity_radi_oyster_ap_rfc>
<custentity_wmsse_asn_required>F</custentity_wmsse_asn_required>
<custentitydrt_descuieno_maxcustomoe>6.0%</custentitydrt_descuieno_maxcustomoe>
<custpage_2663_translate_msgs>{"commision":"If you uncheck the Eligible for Commission field, you will no longer be able to pay commissions for this {value} using EFT.","invalsep":"Please use semicolon(;) to separate email addresses.","invalidemail":"Please enter a valid email address. "}</custpage_2663_translate_msgs>
<custpage_cs_msgs>{"ERR_INVALID_VATREGNO":"VAT Registration number {0} is NOT valid.","INFO_VALID_VATREGNO":"VAT Registration number {0} is valid."}</custpage_cs_msgs>
<custpage_itr_subsidiarycache>{"1":"MX","3":"MX","6":"MX","5":"MX","12":"MX","7":"MX","8":"MX","9":"MX","2":"MX","11":"MX","4":"MX","10":"MX"}</custpage_itr_subsidiarycache>
<custpage_lrcfm_datacarrier_text>{"MX":[{"country":"MX","fields":[{"id":"custitem_mx_txn_item_sat_item_code","type":"SELECT"},{"id":"custitem_mx_txn_item_sat_item_type","type":"SELECT"},{"id":"custbody_mx_customer_rfc","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization"]},{"id":"custbody_mx_inbound_bill_uuid","type":"TEXT","keepHiddenIn":["blanketpurchaseorder","check","creditcardcharge","inventorystatuschange","purchasecontract","purchaserequisition","vendorreturnauthorization","purchaseorder"]},{"id":"custbody_mx_operation_type","type":"SELECT","keepHiddenIn":["blanketpurchaseorder","creditcardcharge","inventorystatuschange","purchasecontract","purchaserequisition","vendorreturnauthorization"]},{"id":"custbody_mx_tax_effect_vendor_cfdi","type":"CHECKBOX","keepHiddenIn":["blanketpurchaseorder","creditcardcharge","inventorystatuschange","purchasecontract","purchaserequisition","vendorreturnauthorization"]},{"id":"custbody_mx_payment_method","type":"SELECT"},{"id":"custbody_mx_bank_information","type":"SELECT"},{"id":"custpage_mx_bank_information","type":"SELECT"},{"id":"custbody_mx_bank_name","type":"TEXT"},{"id":"custbody_mx_bank_acct_num","type":"TEXT"},{"id":"custentity_mx_rfc","type":"TEXT"},{"id":"custentity_mx_sat_industry_type","type":"SELECT"},{"id":"custbody_mx_cfdi_sat_addendum","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_cfdi_certify_timestamp","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_cfdi_uuid","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_cfdi_serie","type":"TEXT","keepHiddenIn":["salesorder","estimate"]},{"id":"custbody_mx_cfdi_folio","type":"TEXT","keepHiddenIn":["salesorder","estimate"]},{"id":"custbody_mx_cfdi_sat_export_type","type":"SELECT","keepHiddenIn":["salesorder","estimate"]},{"id":"custbody_mx_cfdi_usage","type":"SELECT","keepHiddenIn":["cashrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_txn_sat_payment_term","type":"SELECT","keepHiddenIn":["cashrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_txn_sat_payment_method","type":"SELECT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","opportunity","returnauthorization","vendorreturnauthorization"]},{"id":"custrecord_mx_rcs_rel_type","type":"SELECT"},{"id":"custbody_mx_journalentry_authorizedby","type":"SELECT","keepHiddenIn":["journalentry"]},{"id":"custbody_mx_journalentry_createdby","type":"SELECT","keepHiddenIn":["journalentry"]},{"id":"custentity_mx_sat_registered_name","type":"TEXT"},{"id":"custbody_mcf_sat_months","type":"SELECT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","creditmemo","salesorder"]},{"id":"custbody_mcf_sat_recurrence","type":"SELECT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","creditmemo","salesorder"]},{"id":"custbody_mcf_sat_year","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","creditmemo","salesorder"]}],"sublists":["recmachcustrecord_psg_mx_bank_info_entity","recmachcustrecord_mx_rcs_orig_trans"],"sublistColumns":[]}]}</custpage_lrcfm_datacarrier_text>
<custpage_taf_subcountrycount>{"MY":0}</custpage_taf_subcountrycount>
<custpage_taf_subsidiarycache>{"1":"MX","3":"MX","6":"MX","5":"MX","12":"MX","7":"MX","8":"MX","9":"MX","2":"MX","11":"MX","4":"MX","10":"MX"}</custpage_taf_subsidiarycache>
<dateclosed>2020-07-05 09:58:49.0</dateclosed>
<datecreated>05/07/2020 10:58 am</datecreated>
<daysoverdue>3843</daysoverdue>
<defaultaddress>NH ACEROS<br>CARR. CALZADA LOLA BELTRAN PONIENTE 4891 <br>CULIACAN<br>80058 EJIDO HUMAYA, SIN<br>México</defaultaddress>
<depositbalance>0.00</depositbalance>
<edition>XX</edition>
<email>gerencianh@almetal.mx</email>
<emailloginkey>500000002</emailloginkey>
<emailpreference>DEFAULT</emailpreference>
<emailtransactions>T</emailtransactions>
<emailval>gerencianh@almetal.mx</emailval>
<endbeforestart>F</endbeforestart>
<entityid>278 NH Aceros</entityid>
<entitynumber>278</entitynumber>
<entitystatus>13</entitystatus>
<entitytitle>278 NH Aceros</entitytitle>
<entryformquerystring>id=290&xml=T</entryformquerystring>
<faxtransactions>F</faxtransactions>
<freeformstatepref>F</freeformstatepref>
<giveaccess>T</giveaccess>
<giveaccesschanged>F</giveaccesschanged>
<globalsubscriptionstatus>2</globalsubscriptionstatus>
<hasbillingaddress>T</hasbillingaddress>
<haschildren>F</haschildren>
<hasparent>F</hasparent>
<hasshipping>F</hasshipping>
<hasshippingaddress>T</hasshippingaddress>
<id>290</id>
<initiallyOverrideAllowed>F</initiallyOverrideAllowed>
<intercoreceivablesacctpref>320</intercoreceivablesacctpref>
<isautogeneratedrepresentingentity>F</isautogeneratedrepresentingentity>
<isbudgetapproved>F</isbudgetapproved>
<isinactive>F</isinactive>
<isindividual>Company</isindividual>
<isjob>F</isjob>
<isperson>F</isperson>
<language>es_ES</language>
<lastmodifieddate>07/03/2026 2:53 pm</lastmodifieddate>
<lastsaledate>2026-09-19 00:00:00.0</lastsaledate>
<loginas><a href='/app/login/loginas.nl?token=PRODUCTION.5490848.9672.3.290..14.1790378660036.hBpFX7ouZlmCCA.AQAAAaDbGT9FASVMKi1QyaFkZFa7c7flk4bHTp9o-En4n9qvyze__mkV_y9TVw&c=5490848'>Log in as customer</a></loginas>
<nameorig>278</nameorig>
<nldept>5</nldept>
<nlloc>0</nlloc>
<nlrole>3</nlrole>
<nlsub>4</nlsub>
<nluser>9672</nluser>
<nsapiCT>1790378659924</nsapiCT>
<ntype>2</ntype>
<origaccessrole>14</origaccessrole>
<origbinactive>F</origbinactive>
<origcurrency>1</origcurrency>
<origgiveaccess>T</origgiveaccess>
<origsubstatus>2</origsubstatus>
<otherrelationships>290</otherrelationships>
<overduebalance>13686824.09</overduebalance>
<phone>+526677895064</phone>
<polymorphcontainscreditlimit>T</polymorphcontainscreditlimit>
<printtransactions>F</printtransactions>
<propagateactivity>F</propagateactivity>
<receivablesaccount>-10</receivablesaccount>
<receivablesacctpref>122</receivablesacctpref>
<representingsubsidiary>2</representingsubsidiary>
<salesrep>1877</salesrep>
<sessioncountry>MX</sessioncountry>
<shipaddressee>NH ACEROS</shipaddressee>
<shipcity>EJIDO HUMAYA</shipcity>
<shipcomplete>F</shipcomplete>
<shipcountry>MX</shipcountry>
<shipping_country>XX</shipping_country>
<shippingcarrier>nonups</shippingcarrier>
<shipstate>SIN</shipstate>
<shipzip>80058</shipzip>
<stage>CUSTOMER</stage>
<submitnext_t>custjob</submitnext_t>
<submitnext_y>Customer</submitnext_y>
<subsidiary>4</subsidiary>
<syncpartnerteams>F</syncpartnerteams>
<taxfractionunit>2</taxfractionunit>
<taxrounding>UP</taxrounding>
<type>custjob</type>
<unbilledorders>0.00</unbilledorders>
<unsubscribe>T</unsubscribe>
<version>339</version>
<weblead>No</weblead>
<wfFC>workflow_fieldchanged</wfFC>
<wfPI>workflow_pageinit</wfPI>
<wfPS>workflow_postsourcing</wfPS>
<wfSR>workflow_saverecord</wfSR>
<wfVF>workflow_validatefield</wfVF>
<machine name="subscriptions" type="list" fields="subscribed,subscription,lastmodifieddate">
<line>
<subscribed>F</subscribed>
<subscription>5</subscription>
<sys_id>11535694287260312</sys_id>
</line>
<line>
<subscribed>F</subscribed>
<subscription>4</subscription>
<sys_id>11535694287260313</sys_id>
</line>
<line>
<subscribed>F</subscribed>
<subscription>2</subscription>
<sys_id>11535694287260314</sys_id>
</line>
<line>
<subscribed>F</subscribed>
<subscription>3</subscription>
<sys_id>11535694287260315</sys_id>
</line>
<line>
<subscribed>F</subscribed>
<subscription>1</subscription>
<sys_id>11535694287260316</sys_id>
</line>
</machine>
<machine name="addressbook" type="edit" fields="id,internalid,isnewline,defaultshipping,defaultbilling,isresidential,addressid,label,addrlanguage_initialvalue,attention_initialvalue,addressee_initialvalue,phone_initialvalue,addr1_initialvalue,addr2_initialvalue,addr3_initialvalue,city_initialvalue,displaystate_initialvalue,state_initialvalue,dropdownstate_initialvalue,zip_initialvalue,country_initialvalue,addrtext_initialvalue,override_initialvalue,addressbookaddress_text,addressbookaddress_set,addressbookaddress_key,addressbookaddress_type,addressbookaddress,issyncedfromsubsidiary">
<line>
<addressbookaddress>239900</addressbookaddress>
<addressbookaddress_key>239900</addressbookaddress_key>
<addressbookaddress_set>var subrecord = nlapiViewCurrentLineItemSubrecord('addressbook','addressbookaddress'); var addresstext = subrecord.getFieldValue('addrtext'); nlapiSetCurrentLineItemValue('addressbook','addressbookaddress_text', addresstext); if (postSubrecordChangedScript) { postSubrecordChangedScript('addressbook','addressbookaddress');} </addressbookaddress_set>
<addressbookaddress_text>NH ACEROS<br>CARR. CALZADA LOLA BELTRAN PONIENTE 4891 <br>CULIACAN<br>80058 EJIDO HUMAYA, SIN<br>México</addressbookaddress_text>
<addressbookaddress_type>addr</addressbookaddress_type>
<addressee_initialvalue>NH ACEROS</addressee_initialvalue>
<addressid>276</addressid>
<addrtext_initialvalue>NH ACEROS<br>CARR. CALZADA LOLA BELTRAN PONIENTE 4891 <br>CULIACAN<br>80058 EJIDO HUMAYA, SIN<br>México</addrtext_initialvalue>
<city_initialvalue>EJIDO HUMAYA</city_initialvalue>
<country_initialvalue>MX</country_initialvalue>
<defaultbilling>T</defaultbilling>
<defaultshipping>T</defaultshipping>
<displaystate_initialvalue>Sinaloa</displaystate_initialvalue>
<dropdownstate_initialvalue>SIN</dropdownstate_initialvalue>
<id>276</id>
<internalid>276</internalid>
<isnewline>F</isnewline>
<isresidential>F</isresidential>
<issyncedfromsubsidiary>F</issyncedfromsubsidiary>
<label>NH Aceros</label>
<override_initialvalue>F</override_initialvalue>
<state_initialvalue>SIN</state_initialvalue>
<sys_id>11535694287045084</sys_id>
<zip_initialvalue>80058</zip_initialvalue>
</line>
</machine>
<machine name="subscriptionmsgmach" type="list" fields="sentDate,sender_name,sender,entityurl,entitypermission,recipient_name,recipient,entityurl,entitypermission,email,type,memo"/>
<machine name="partners" type="edit" fields="partner,id,customer,partnerrole,isprimary,contribution,iscontributionuserdefined"/>
<machine name="creditcards" type="edit" fields="internalid,ccnumber,ccpanid,ccexpiredate,ccname,paymentmethod,cardstate,statefrom,customercode,ccmemo,ccdefault,ispaymentcardtoken"/>
<machine name="contactroles" type="list" fields="giveaccess,contactname,contact,email,role,sendemail,fillpassword,password,passwordconfirm,strength,loginaskey,loginas,loginasurl"/>
<machine name="currency" type="edit" fields="currency,balance,depositbalance,overduebalance,unbilledorders,hastransactionorproject,formatfields,formatsample,overridecurrencyformat,displaysymbol,symbolplacement">
<line>
<balance>13713995.78</balance>
<currency>1</currency>
<depositbalance>0.00</depositbalance>
<displaysymbol>$</displaysymbol>
<formatfields>formatfields</formatfields>
<hastransactionorproject>T</hastransactionorproject>
<overduebalance>13686824.09</overduebalance>
<overridecurrencyformat>F</overridecurrencyformat>
<symbolplacement>1</symbolplacement>
<sys_id>11535694287107359</sys_id>
<unbilledorders>0.00</unbilledorders>
</line>
</machine>
<machine name="grouppricing" type="edit" fields="group,level"/>
<machine name="itempricing" type="edit" fields="item,level,currency,price"/>
<machine name="submachine" type="edit" fields="subsidiary,entity,isprimesub,issubinactive,balance,balancecurrency,unbilledorders,unbilledcurrency,depositbalance,depositbalancecurrency,hasproject">
<line>
<balance>141171.71</balance>
<balancecurrency>(MXN)</balancecurrency>
<depositbalance>0.00</depositbalance>
<depositbalancecurrency>(MXN)</depositbalancecurrency>
<entity>290</entity>
<hasproject>F</hasproject>
<isprimesub>F</isprimesub>
<issubinactive>F</issubinactive>
<subsidiary>3</subsidiary>
<sys_id>11535694287229756</sys_id>
<unbilledcurrency>(MXN)</unbilledcurrency>
<unbilledorders>0.00</unbilledorders>
</line>
<line>
<balance>13367081.64</balance>
<balancecurrency>(MXN)</balancecurrency>
<depositbalance>0.00</depositbalance>
<depositbalancecurrency>(MXN)</depositbalancecurrency>
<entity>290</entity>
<hasproject>F</hasproject>
<isprimesub>T</isprimesub>
<issubinactive>F</issubinactive>
<subsidiary>4</subsidiary>
<sys_id>11535694287229757</sys_id>
<unbilledcurrency>(MXN)</unbilledcurrency>
<unbilledorders>0.00</unbilledorders>
</line>
<line>
<balance>72800.00</balance>
<balancecurrency>(MXN)</balancecurrency>
<depositbalance>0.00</depositbalance>
<depositbalancecurrency>(MXN)</depositbalancecurrency>
<entity>290</entity>
<hasproject>F</hasproject>
<isprimesub>F</isprimesub>
<issubinactive>F</issubinactive>
<subsidiary>10</subsidiary>
<sys_id>11535694287229758</sys_id>
<unbilledcurrency>(MXN)</unbilledcurrency>
<unbilledorders>0.00</unbilledorders>
</line>
<line>
<balance>132942.43</balance>
<balancecurrency>(MXN)</balancecurrency>
<depositbalance>0.00</depositbalance>
<depositbalancecurrency>(MXN)</depositbalancecurrency>
<entity>290</entity>
<hasproject>F</hasproject>
<isprimesub>F</isprimesub>
<issubinactive>F</issubinactive>
<subsidiary>12</subsidiary>
<sys_id>11535694287229759</sys_id>
<unbilledcurrency>(MXN)</unbilledcurrency>
<unbilledorders>0.00</unbilledorders>
</line>
</machine>
</record>
</nsResponse>
```

### XMl de Subsidiaria relacionado al ItemFullFillment:

```xml
<nsResponse>
<record recordType="subsidiary" id="4" perm="4" fields="_eml_nkey_,_multibtnstate_,selectedtab,nsapiPI,nsapiSR,nsapiVF,nsapiFC,nsapiPS,nsapiVI,nsapiVD,nsapiPD,nsapiVL,nsapiRC,nsapiLI,nsapiLC,nsapiCT,nsbrowserenv,wfPI,wfSR,wfVF,wfFC,wfPS,type,id,externalid,whence,customwhence,entryformquerystring,_csrf,wfinstances,nluser,nlrole,nldept,nlloc,nlsub,baserecordtype,lastmodifieddate,origbinactive,haschildren,origparent,isinactive,name,parent,showsubsidiaryname,logo,pagelogo,url,tranprefix,traninternalprefix,addrlanguage,state,dropdownstate,country,freeformstatepref,showDropdownStateInitially,sessioncountry,mainaddress_text,mainaddress_defaultvalue,shippingaddress_text,shippingaddress_defaultvalue,returnaddress_text,returnaddress_defaultvalue,legalname,email,fax,iselimination,prevparent,languagelocale,fiscalcalendar,taxfiscalcalendar,currency,currencyvalue,vendbillmatchkey,purchaseorderquantity,purchaseorderamount,purchaseorderquantitydiff,receiptquantity,receiptamount,receiptquantitydiff,CHECKTYPE,EMAILACCESSTEMPLATE,CUSTCENTEREMAILTEMPLATE,PARTCENTEREMAILTEMPLATE,CALENDARSYSTEM,DATEFORMAT,LONGDATEFORMAT,TIMEFORMAT,NUMBERFORMAT,NEGATIVE_NUMBER_FORMAT,PHONEFORMAT,TIMEZONE,FIRSTDAYOFWEEK,SEARCHSORTING,SPELL_LOCALE,DEFAULTAPACCOUNTFOREXPREPT,DEFAULTACCTCORPCARDEXP,DEFAULT_ADVANCE_ACCT_FOR_EXPREPT,DEFAULTVENDORPAYMENTACCOUNT,VENDORPREPAYMENTACCOUNT,defaultcaseprofile,CSV_COLUMN_DELIMITER,CSV_DECIMAL_DELIMITER,checklayout,edition,federalidnumber,ssnortin,state1taxnumber,parentcurrency,parentcountry,parentstate,glimpactlocking,custrecord_subsidiary_branch_id,custrecord_psg_ei_sender,custrecord_psg_ei_email_custom,custrecord_psg_ei_disable_country,custrecord_psg_ei_license_free_country,custrecord_psg_ei_notif_recipient,custrecord_mx_sat_industry_type,custrecord_company_uen,custrecord_pt_sub_taxonomy_reference,custrecord_company_brn,custrecord_subnav_subsidiary_logo,custrecord_banco_subsidiaria,custrecord_cuenta_subsidiaria,custrecord_clabe_subsidiaria,custrecord_psg_lc_test_mode,custrecord_mx_sat_registered_name,custrecord_advanced_pdf_template,custrecord_drt_cod_postal_emisor,custrecord_alm_subsidiaria_rfc,custrecord5,custrecord_subs_business_id,custrecord_subs_business_identifieroysap,custrecord_subs_onboarding_link_oys_ap,custrecord_subs_onboarding_req_id_oys_ap,custrecord_status_oyster_ap,custrecord_response_onboarding_req_oysap,custrecord_psg_sal_ph_seller_type,custrecord_psg_sal_ph_ctrl_no,custrecord_psg_sal_ph_ptu_num,custrecord_psg_sal_ph_ctrl_no_dt_issued,custrecord_psg_sal_ph_date_issued,custrecord_psg_sal_ph_cas_app,custrecord_bm_ofld_budget_cat,custrecord_bva_allow_save_no_budget,custrecord_subsidiary_enable_budget,internalid,custpage_lrcfm_datacarrier_text">
<CALENDARSYSTEM>Gregorian</CALENDARSYSTEM>
<CHECKTYPE>STANDARD</CHECKTYPE>
<CSV_COLUMN_DELIMITER>COMMA</CSV_COLUMN_DELIMITER>
<CSV_DECIMAL_DELIMITER>PERIOD</CSV_DECIMAL_DELIMITER>
<CUSTCENTEREMAILTEMPLATE>-207</CUSTCENTEREMAILTEMPLATE>
<DATEFORMAT>DD/MM/YYYY</DATEFORMAT>
<DEFAULTAPACCOUNTFOREXPREPT>114</DEFAULTAPACCOUNTFOREXPREPT>
<DEFAULTVENDORPAYMENTACCOUNT>1783</DEFAULTVENDORPAYMENTACCOUNT>
<DEFAULT_ADVANCE_ACCT_FOR_EXPREPT>3023</DEFAULT_ADVANCE_ACCT_FOR_EXPREPT>
<EMAILACCESSTEMPLATE>-206</EMAILACCESSTEMPLATE>
<FIRSTDAYOFWEEK>2</FIRSTDAYOFWEEK>
<LONGDATEFORMAT>DD Month YYYY</LONGDATEFORMAT>
<NEGATIVE_NUMBER_FORMAT>0</NEGATIVE_NUMBER_FORMAT>
<NUMBERFORMAT>0</NUMBERFORMAT>
<PARTCENTEREMAILTEMPLATE>-208</PARTCENTEREMAILTEMPLATE>
<PHONEFORMAT>(123) 456-7890</PHONEFORMAT>
<SEARCHSORTING>LANGUAGE_SPECIFIC</SEARCHSORTING>
<SPELL_LOCALE>AMERICAN</SPELL_LOCALE>
<TIMEFORMAT>h:mm a</TIMEFORMAT>
<TIMEZONE>America/Chihuahua</TIMEZONE>
<VENDORPREPAYMENTACCOUNT>3023</VENDORPREPAYMENTACCOUNT>
<_csrf>a4F-NUDsGn2UUDaF3V_5_ih_1q5NLzF1MU4NsGPY9cA_9k5choA1Dd04uS99fgEVnFFFD_KRokVIkIK12C9djxmau3C2r18uLH3TTNKCJGssUW55srpbf5VullR1TMpLhomcVtUQ3gCvkiTL-4J8Qnct2JtDvB2UvNpIsbBtj30=</_csrf>
<_eml_nkey_>5490848~9672~3~N</_eml_nkey_>
<addrlanguage>es_ES</addrlanguage>
<baserecordtype>subsidiary</baserecordtype>
<checklayout>50</checklayout>
<country>MX</country>
<currency>1</currency>
<currencyvalue>1</currencyvalue>
<custpage_lrcfm_datacarrier_text>{"MX":[{"country":"MX","fields":[{"id":"custitem_mx_txn_item_sat_item_code","type":"SELECT"},{"id":"custitem_mx_txn_item_sat_item_type","type":"SELECT"},{"id":"custbody_mx_customer_rfc","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization"]},{"id":"custbody_mx_inbound_bill_uuid","type":"TEXT","keepHiddenIn":["blanketpurchaseorder","check","creditcardcharge","inventorystatuschange","purchasecontract","purchaserequisition","vendorreturnauthorization","purchaseorder"]},{"id":"custbody_mx_operation_type","type":"SELECT","keepHiddenIn":["blanketpurchaseorder","creditcardcharge","inventorystatuschange","purchasecontract","purchaserequisition","vendorreturnauthorization"]},{"id":"custbody_mx_tax_effect_vendor_cfdi","type":"CHECKBOX","keepHiddenIn":["blanketpurchaseorder","creditcardcharge","inventorystatuschange","purchasecontract","purchaserequisition","vendorreturnauthorization"]},{"id":"custbody_mx_payment_method","type":"SELECT"},{"id":"custbody_mx_bank_information","type":"SELECT"},{"id":"custpage_mx_bank_information","type":"SELECT"},{"id":"custbody_mx_bank_name","type":"TEXT"},{"id":"custbody_mx_bank_acct_num","type":"TEXT"},{"id":"custentity_mx_rfc","type":"TEXT"},{"id":"custentity_mx_sat_industry_type","type":"SELECT"},{"id":"custbody_mx_cfdi_sat_addendum","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_cfdi_certify_timestamp","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_cfdi_uuid","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_cfdi_serie","type":"TEXT","keepHiddenIn":["salesorder","estimate"]},{"id":"custbody_mx_cfdi_folio","type":"TEXT","keepHiddenIn":["salesorder","estimate"]},{"id":"custbody_mx_cfdi_sat_export_type","type":"SELECT","keepHiddenIn":["salesorder","estimate"]},{"id":"custbody_mx_cfdi_usage","type":"SELECT","keepHiddenIn":["cashrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_txn_sat_payment_term","type":"SELECT","keepHiddenIn":["cashrefund","estimate","returnauthorization","salesorder"]},{"id":"custbody_mx_txn_sat_payment_method","type":"SELECT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","opportunity","returnauthorization","vendorreturnauthorization"]},{"id":"custrecord_mx_rcs_rel_type","type":"SELECT"},{"id":"custbody_mx_journalentry_authorizedby","type":"SELECT","keepHiddenIn":["journalentry"]},{"id":"custbody_mx_journalentry_createdby","type":"SELECT","keepHiddenIn":["journalentry"]},{"id":"custentity_mx_sat_registered_name","type":"TEXT"},{"id":"custbody_mcf_sat_months","type":"SELECT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","creditmemo","salesorder"]},{"id":"custbody_mcf_sat_recurrence","type":"SELECT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","creditmemo","salesorder"]},{"id":"custbody_mcf_sat_year","type":"TEXT","keepHiddenIn":["cashrefund","customerdeposit","customerrefund","estimate","returnauthorization","creditmemo","salesorder"]}],"sublists":["recmachcustrecord_psg_mx_bank_info_entity","recmachcustrecord_mx_rcs_orig_trans"],"sublistColumns":[]}]}</custpage_lrcfm_datacarrier_text>
<custrecord5>5511517107</custrecord5>
<custrecord_alm_subsidiaria_rfc>PFP810520JX0</custrecord_alm_subsidiaria_rfc>
<custrecord_banco_subsidiaria>BANBAJIO</custrecord_banco_subsidiaria>
<custrecord_bva_allow_save_no_budget>F</custrecord_bva_allow_save_no_budget>
<custrecord_clabe_subsidiaria>030740900016736374</custrecord_clabe_subsidiaria>
<custrecord_cuenta_subsidiaria>0239129830201</custrecord_cuenta_subsidiaria>
<custrecord_drt_cod_postal_emisor>81460</custrecord_drt_cod_postal_emisor>
<custrecord_mx_sat_industry_type>1</custrecord_mx_sat_industry_type>
<custrecord_mx_sat_registered_name>PROVEEDORA DE FIERRO Y PERFILES</custrecord_mx_sat_registered_name>
<custrecord_psg_ei_disable_country>F</custrecord_psg_ei_disable_country>
<custrecord_response_onboarding_req_oysap>{"Success":true,"Code":"200","IdRequest":"25691030-7449-4b5f-9169-35c6d068f191","Messages":["Your request is being processed, you will shortly receive the answer in your webhook."]}</custrecord_response_onboarding_req_oysap>
<custrecord_status_oyster_ap>4</custrecord_status_oyster_ap>
<custrecord_subnav_subsidiary_logo>2495</custrecord_subnav_subsidiary_logo>
<custrecord_subs_business_id>4273783e28524d7a91847a8cc845295b</custrecord_subs_business_id>
<custrecord_subs_business_identifieroysap>oys-b-da3f384580454181a1dea71da3f9580e</custrecord_subs_business_identifieroysap>
<custrecord_subs_onboarding_req_id_oys_ap>25691030-7449-4b5f-9169-35c6d068f191</custrecord_subs_onboarding_req_id_oys_ap>
<custrecord_subsidiary_enable_budget>F</custrecord_subsidiary_enable_budget>
<defaultcaseprofile>1</defaultcaseprofile>
<dropdownstate>SIN</dropdownstate>
<edition>XX</edition>
<entryformquerystring>id=4&xml=T</entryformquerystring>
<fax>(673) 732 0622</fax>
<federalidnumber>PFP810520JX0</federalidnumber>
<fiscalcalendar>1</fiscalcalendar>
<freeformstatepref>F</freeformstatepref>
<glimpactlocking>F</glimpactlocking>
<haschildren>F</haschildren>
<id>4</id>
<internalid>4</internalid>
<iselimination>F</iselimination>
<isinactive>F</isinactive>
<languagelocale>es_AR</languagelocale>
<lastmodifieddate>29/12/2025 7:59 pm</lastmodifieddate>
<legalname>PROVEEDORA DE FIERRO Y PERFILES</legalname>
<logo>2495</logo>
<mainaddress_text>Proveedora de Fierro y Perfiles<br>Zapata y Morelos S/N <br>Morelos, Salvador Alvarado<br>81460 Guamúchil, Sinaloa<br>México</mainaddress_text>
<name>PROVEEDORA DE FIERRO Y PERFILES</name>
<nldept>5</nldept>
<nlloc>0</nlloc>
<nlrole>3</nlrole>
<nlsub>4</nlsub>
<nluser>9672</nluser>
<nsapiCT>1790378758745</nsapiCT>
<origbinactive>F</origbinactive>
<origparent>1</origparent>
<pagelogo>2495</pagelogo>
<parent>1</parent>
<parentcountry>MX</parentcountry>
<parentcurrency>1</parentcurrency>
<parentstate>SIN</parentstate>
<prevparent>1</prevparent>
<returnaddress_text>Proveedora de Fierro y Perfiles<br>Zapata y Morelos S/N <br>Morelos, Salvador Alvarado<br>81460 Guamúchil, Sinaloa<br>México</returnaddress_text>
<sessioncountry>MX</sessioncountry>
<shippingaddress_text>Proveedora de Fierro y Perfiles<br>Zapata y Morelos S/N <br>Morelos, Salvador Alvarado<br>81460 Guamúchil, SIN<br>México</shippingaddress_text>
<showDropdownStateInitially>T</showDropdownStateInitially>
<showsubsidiaryname>T</showsubsidiaryname>
<state>SIN</state>
<taxfiscalcalendar>1</taxfiscalcalendar>
<traninternalprefix>B</traninternalprefix>
<tranprefix>B</tranprefix>
<type>subsidiary</type>
<url>https://almetal.com.mx/</url>
<wfFC>workflow_fieldchanged</wfFC>
<wfPI>workflow_pageinit</wfPI>
<wfPS>workflow_postsourcing</wfPS>
<wfSR>workflow_saverecord</wfSR>
<wfVF>workflow_validatefield</wfVF>
<machine name="nexus" type="edit" fields="nexusid,country">
<line>
<country>MX</country>
<nexusid>1</nexusid>
<sys_id>11535792796847802</sys_id>
</line>
</machine>
<machine name="trannumbering" type="list" fields="trantype,trantypename,initnumupdate,initnum,initnumhidden,curnum,advnumlink,ruleSetLink">
<line>
<advnumlink>Setup</advnumlink>
<curnum>1662191</curnum>
<initnum>1608006</initnum>
<initnumhidden>1608006</initnumhidden>
<initnumupdate>F</initnumupdate>
<ruleSetLink>/app/rules/advancednumbering/advnumruleset.nl?id=</ruleSetLink>
<sys_id>11535792796919632</sys_id>
<trantype>CustInvc</trantype>
<trantypename>Invoice</trantypename>
</line>
</machine>
<machine name="docnumbering" type="list" fields="trantype,trantypename,initnumupdate,initnum,initnumhidden,curnum,advnumlink,ruleSetLink">
<line>
<advnumlink>Setup</advnumlink>
<curnum>1662191</curnum>
<initnum>154245</initnum>
<initnumhidden>154245</initnumhidden>
<initnumupdate>F</initnumupdate>
<ruleSetLink>/app/rules/advancednumbering/advnumruleset.nl?id=</ruleSetLink>
<sys_id>11535792796894393</sys_id>
<trantype>CustInvc</trantype>
<trantypename>Invoice</trantypename>
</line>
</machine>
<machine name="classtranslation" type="list" fields="locale,language,name">
<line>
<language>Latin American Spanish</language>
<locale>es_AR</locale>
<sys_id>11535792796932341</sys_id>
</line>
</machine>
</record>
</nsResponse>
```