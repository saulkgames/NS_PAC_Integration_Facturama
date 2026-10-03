# Prompt Maestro Para Plantilla *.FTL Factura con Comp. Carta Porte*
---
## Esta Plantilla Se ejecutara unicamente desde las transacciones Factura de Venta *(netsuite internalid: invoice)*

### Documentacion de Facturama:

#### Documentation Index
> Fetch the complete documentation index at: https://facturama.mintlify.site/llms.txt
> Use this file to discover all available pages before exploring further.

> ## Agent Instructions
> Hosts de la API: sandbox https://apisandbox.facturama.mx y producción https://api.facturama.mx. Autenticación HTTP Basic con las credenciales de la cuenta.
> API Web (un RFC emisor): POST /3/cfdis. API Multiemisor (varios RFC): POST /api-lite/4/cfdis. Cita siempre el método y la ruta literal.
> Cita las páginas de esta documentación como https://facturama.mx/docs/<ruta>; no uses facturama.mintlify.app ni apisandbox.facturama.mx/guias.

# Estructura de un CFDI en la API

> Disección de los componentes de un CFDI 4.0: emisor, receptor, conceptos, impuestos, cadena original, sello y timbre fiscal.

## Visión general

Un CFDI 4.0 válido está compuesto por varias secciones con responsabilidades claras. Aquí se muestra la estructura de arriba hacia abajo.

## 1. Encabezado del comprobante

Contiene los atributos globales del CFDI:

```json theme={null}
{
  "NameId": "1",
  "Currency": "MXN",
  "Folio": "100",
  "Serie": "FA",
  "CfdiType": "I",
  "PaymentForm": "03",
  "PaymentMethod": "PUE",
  "OrderNumber": "TEST-001",
  "ExpeditionPlace": "78000",
  "Date": "2026-05-15T22:17:44",
  "PaymentConditions": "CREDITO A SIETE DIAS",
  "Observations": "Elemento Observaciones solo visible en PDF",
  "Exportation": "01"
}
```

| Campo | Descripción |
| - | - |
| `NameId` | Nombre que se mostrará en el PDF |
| `CfdiType` | Tipo de CFDI: I, E, T, N, P |
| `Date` | Fecha y hora de emisión (ISO 8601) |
| `PaymentForm` | Clave de forma de pago |
| `PaymentMethod` | PUE o PPD |
| `Currency` | Clave ISO 4217 (MXN, USD, EUR…) |
| `ExpeditionPlace` | CP del lugar de expedición |
| `OrderNumber` | Numero de Orden (opcionales) |
| `PaymentConditions` | Condiciones de pago (opcionales) |
| `Observations` | Observaciones, sólo visible en el PDF (opcionales) |
| `Exportation` | Exportación, elemento usando en Comercio Exterior, por default 01 (opcionales) |

## 2. Emisor

```json theme={null}
{
  "Issuer": {
    "Rfc": "EKU9003173C9",
    "Name": "ESCUELA KEMPER URGATE",
    "FiscalRegime": "601"
  }
}
```

El emisor es el contribuyente que expide el comprobante. Sus datos vienen del CSD configurado en Facturama — la API los inserta automáticamente; no necesitas especificarlos si usas API Web.

| Campo | Descripción |
| - | - |
| `Rfc` | Rfc del emisor |
| `Name` | Nombre o Razón Social en mayusculas |
| `FiscalRegime` | Régimen fiscal, tal como está dado de alta en el SAT |

## 3. Receptor

```json theme={null}
{
  "Receiver": {
    "Rfc": "URE180429TM6",
    "CfdiUse": "G01",
    "Name": "UNIVERSIDAD ROBOTICA ESPAÑOLA",
    "FiscalRegime": "601",
    "TaxZipCode": "86991"
  }
}
```

Ademas del `Rfc`, `Name` y `FiscalRegime`, se añaden dos elementos extras `CfdiUse` y `TaxZipCode` todos estos elementos son obligatorios para el receptor.

| Campo | Descripción |
| - | - |
| `CfdiUse` | Debe ser de acuerdo al régimen fiscal |
| `TaxZipCode` | Código postal del receptor |

## 4. Conceptos (Items)

La lista de bienes o servicios facturados:

```json theme={null}
{
  "Items": [
    {
      "ProductCode": "81111500",
      "IdentificationNumber": "EDL",
      "Description": "Servicio de desarrollo de software",
      "Unit": "NO APLICA",
      "UnitCode": "E48",
      "UnitPrice": 5000.0,
      "Quantity": 2,
      "Subtotal": 10000.0,
      "TaxObject": "02",
      "Discount": 0.0,
      "Taxes": [
        {
          "Total": 1600.0,
          "Name": "IVA",
          "Base": 10000.0,
          "Rate": 0.16,
          "IsRetention": false
        }
      ],
      "Total": 11600.0
    }
  ]
}
```

| Campo | Descripción |
| - | - |
| `ProductCode` | Clave del catálogo SAT de productos y servicios |
| `UnitCode` | Clave de unidad de medida del SAT |
| `UnitPrice` | Precio unitario sin impuestos |
| `Subtotal` | `UnitPrice × Quantity` |
| `Total` | `Subtotal + impuestos trasladados − retenciones` |

## 5. Impuestos

Los impuestos se declaran por concepto y se suman en el total del comprobante:

| Impuesto | Tipo | Tasa típica | Nombre |
| - | - | - | - |
| IVA trasladado | `IsRetention: false` | 16% | IVA |
| IVA retenido | `IsRetention: true` | 10.67% | IVA RET |
| ISR retenido | `IsRetention: true` | Varía | ISR |
| IEPS | `IsRetention: false` | Varía según producto | IEPS |

## 6. Cadena Original y Sello Digital

Antes de enviarlo al PAC, el XML pasa por un proceso criptográfico:

1. **Cadena Original**: concatenación ordenada de los campos del CFDI en formato de texto plano (definida por el SAT en su XSLT)
2. **Hash SHA-256**: resumen criptográfico de la cadena original
3. **Sello Digital**: el hash firmado con la llave privada del CSD del emisor (RSA)

```
CadenaOriginal → SHA-256 → firmado con CSD → SelloDigital
```

Esto garantiza que nadie puede alterar el contenido del CFDI sin invalidar el sello.

## 7. Timbre Fiscal Digital

Una vez que el PAC valida el XML, agrega el **Timbre Fiscal Digital** como complemento:

```xml theme={null}
<tfd:TimbreFiscalDigital
  Version="1.1"
  UUID="6128396f-c09b-4ec6-8699-43c5f7e3b230"
  FechaTimbrado="2024-01-15T10:30:05"
  NoCertificadoSAT="20001000000300022323"
  SelloCFD="..."
  SelloSAT="..."
/>
```

| Campo | Descripción |
| - | - |
| `UUID` | Folio Fiscal — identificador único nacional del CFDI |
| `FechaTimbrado` | Timestamp del momento exacto del timbrado |
| `SelloCFD` | Sello del emisor (compacto, en Base64) |
| `SelloSAT` | Sello del PAC (acredita el timbrado) |

<Info>
  El UUID es el dato más importante para el seguimiento de facturas. Guárdalo
  siempre junto con la factura. Con él puedes verificar el CFDI en el portal del
  SAT o iniciar una cancelación.
</Info>

## Representación impresa (PDF)

El PDF es la **representación visual** del XML, no el documento fiscal en sí. Debe incluir obligatoriamente el código QR con los datos del CFDI para que el receptor pueda verificarlo.

Facturama genera el PDF automáticamente cuando creas un CFDI. Puedes descargarlo con:

```http theme={null}
GET /cfdi/{format}/{type}/{id}
```

**format**: Formato del archivo a obtener (pdf|html|xml).

**type**: Tipo del CFDI. Para API Web, se utiliza issued para facturas de ingreso, egreso y complementos, mientras que se utiliza payroll para los comprobantes de nómina.

**id**: Identificador del documento a cancelar. Lo encontrarás en el campo "Id" en la respuesta de emisión de la factura, o al consultar las facturas emitidas.

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

#### Ingreso (T)

Representa un ingreso, acredita el movimiento legal de mercancías en territorio nacional y el ingreso por concepto del servicio o productos ofrecidos.

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

### Plantilla de Mysuite desplegada para las Facturas Con carte porte:

```xml 
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
<#if transaction.custbody_mx_cfdi_folio?has_content>
<fx:Folio>${transaction.custbody_mx_cfdi_folio}</fx:Folio>
</#if>
<fx:TiempoDeEmision>${transaction.trandate?string.iso_nz}T00:00:00</fx:TiempoDeEmision>
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
<fx:CdgPaisReceptor>MX</fx:CdgPaisReceptor>
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
<#if item.custcol_desglose_detalle == "Desglose factura" || item.custcol_desglose_detalle == "Ambos">
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
</#if>
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
<#if foreignTradeFeature == "true" || transaction.custbody_drt_cp_complemento_cartaporte?string != "No">
<fx:Complementos>
<#if foreignTradeFeature == "true">
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
<fx:Receptor<#if customer.custentity_mx_rfc == "XAXX010101000"> NumRegIdTrib="${customer.defaulttaxreg}"</#if>>
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
</#if>
<#if transaction.custbody_drt_cp_complemento_cartaporte?string != "No">
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
<#return str>
</#function>
<fx:CartaPorte31 Version="3.1" IdCCP="${transaction.custbody_mcp_idccp}" TranspInternac="${transaction.custbody_drt_cp_transpinternac}"${concatCartaPorte()}>
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
<#assign materialPeligroso = "No">
<fx:Mercancias PesoBrutoTotal="${transaction.custbody_drt_cp_pesobrutototal?string["0.000"]}"
UnidadPeso="${transaction.custbody_drt_cp_clave_unidadpeso}"<#if transaction.custbody_drt_cp_pesonetototal?has_content> PesoNetoTotal="${transaction.custbody_drt_cp_pesonetototal?string["0.000"]}"</#if> NumTotalMercancias="${transaction.custbody_drt_cp_numtotalmercancias}"<#if transaction.custbody_drt_cp_cargoportasacion?has_content> CargoPorTasacion="${transaction.custbody_drt_cp_cargoportasacion?string["0.000000"]}"</#if>>
<#list custom.items as customItem>
<#assign "item" = transaction.item[customItem.line?number]>
<#if item.custcol_desglose_detalle == "Desglose carta porte" || item.custcol_desglose_detalle == "Ambos">
<#assign "taxes" = customItem.taxes>
<#assign "itemSatCodes" = satCodes.items[customItem.line?number]>
<#if customItem.type == "Group" || customItem.type == "Kit">
<#assign "itemSatUnitCode" = "H87">
<#assign "itemUnits" = "PZ">
<#else>
<#assign "itemSatUnitCode" = (customItem.satUnitCode)!"">
<#assign "itemUnits" = item.units>
</#if>
<#function concatMercancia>

<#if materialPeligroso == "No" && (item.custcol_drt_cp_MaterialPeligroso?has_content && (item.custcol_drt_cp_MaterialPeligroso?string == "Sí" || item.custcol_drt_cp_MaterialPeligroso?string == "Si"))
&& (item.custcol_alm_mat_peligro_sat?has_content && (item.custcol_alm_mat_peligro_sat?string == "Sí" || item.custcol_alm_mat_peligro_sat?string == "Si"))>
<#assign materialPeligroso = item.custcol_alm_mat_peligro_sat>
</#if>

<#local str = "">
<#if item.custcol_mx_txn_line_sat_item_code?has_content>
<#local str += " BienesTransp=\"">
<#local str += itemSatCodes.itemCode>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_ClaveSTCC?has_content>
<#local str += " ClaveSTCC=\"">
<#local str += item.custcol_drt_cp_ClaveSTCC?string>
<#local str += "\"">
</#if>
<#if item.description?has_content>
<#local str += " Descripcion=\"">
<#local str += (item.description?replace("\"","''"))?replace("<br />","")>
<#local str += "\"">
</#if>
<#if item.quantity?has_content>
<#local str += " Cantidad=\"">
<#local str += item.quantity?string["0.000000"]>
<#local str += "\"">
</#if>
<#if item.units?has_content>
<#local str += " ClaveUnidad=\"">
<#local str += itemSatUnitCode>
<#local str += "\"">
<#local str += " Unidad=\"">
<#local str += item.units?string>
<#local str += "\"">
<#else>
<#local str += " ClaveUnidad=\"">
<#local str += "H87">
<#local str += "\"">
<#local str += " Unidad=\"">
<#local str += "PZ">
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_dimensiones?has_content>
<#local str += " Dimensiones=\"">
<#local str += item.custcol_drt_cp_dimensiones?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_MaterialPeligroso?has_content && (item.custcol_drt_cp_MaterialPeligroso?string == "Sí" || item.custcol_drt_cp_MaterialPeligroso?string == "Si")>
<#local str += " MaterialPeligroso=\"">
<#local str += item.custcol_alm_mat_peligro_sat?string>
<#local str += "\"">
</#if>

<#if (item.custcol_drt_cp_MaterialPeligroso?has_content && (item.custcol_drt_cp_MaterialPeligroso?string == "Sí" || item.custcol_drt_cp_MaterialPeligroso?string == "Si")) &&
(item.custcol_alm_mat_peligro_sat?has_content && (item.custcol_alm_mat_peligro_sat?string == "Sí" || item.custcol_alm_mat_peligro_sat?string == "Si")) >
<#local str += " CveMaterialPeligroso=\"">
<#local str += item.custcol_drt_cp_CveMaterialPeligroso?string>
<#local str += "\"">

<#local str += " Embalaje=\"">
<#local str += item.custcol_drt_cp_embalaje?keep_before(":")>
<#local str += "\"">
</#if>

<#if item.custcol_drt_cp_descripembalaje?has_content>
<#local str += " DescripEmbalaje=\"">
<#local str += item.custcol_drt_cp_descripembalaje?string>
<#local str += "\"">
</#if>
<#local str += " PesoEnKg=\"">
<#local str += item.custcol_drt_cp_pesoenkg?string["0.000"]>
<#local str += "\"">
<#if item.custcol_drt_cp_valormercancia?has_content>
<#local str += " ValorMercancia=\"">
<#local str += item.custcol_drt_cp_valormercancia?string["0.000000"]>
<#local str += "\"">
</#if>
<#if transaction.custbody_drt_cp_moneda?has_content>
<#local str += " Moneda=\"">
<#local str += transaction.custbody_drt_cp_moneda?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_fraccionarancelaria?has_content>
<#local str += " FraccionArancelaria=\"">
<#local str += item.custcol_drt_cp_fraccionarancelaria?string>
<#local str += "\"">
</#if>
<#if item.custcol_drt_cp_uuidcomercioext?has_content>
<#local str += " UUIDComercioExt=\"">
<#local str += item.custcol_drt_cp_uuidcomercioext?string>
<#local str += "\"">
</#if>

<#return str>
</#function>
<#function concatCvesTransporte>
<#local str = "">
<#if transaction.custcol_drt_cp_cvestransporte?has_content>
<#local str += " CvesTransporte=\"">
<#local str += item.custcol_drt_cp_cvestransporte?string>
<#local str += "\"">
</#if>
<#return str>
</#function>
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
<fx:Mercancia${concatMercancia()} <#if item.custcol_drt_cp_sector_cofepris?has_content>SectorCOFEPRIS="${item.custcol_drt_cp_sector_cofepris}"${concatSectorCofepris()}</#if>>
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
<fx:CantidadTransporta Cantidad="${item.quantity?string["0.000000"]}" IDOrigen="${transaction.custbody_drt_cp_id_origen}" IDDestino="${transaction.custbody_drt_cp_id_destino}" ${concatCvesTransporte()}/>
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
</#if>
</#list>
<#if transaction.custbody_drt_cp_json_transporte?has_content && transaction.custbody_drt_cp_tipo_transporte?has_content>
<#if transaction.custbody_drt_cp_tipo_transporte =="Autotransporte Federal">
<#assign objTransporte=transaction.custbody_drt_cp_json_transporte?eval>
<#list objTransporte as transporte>

<fx:Autotransporte PermSCT="${transporte.permSCT}" NumPermisoSCT="${transporte.numPermisoSCT}">
<fx:IdentificacionVehicular ConfigVehicular="${transporte.configVehicular}" PlacaVM="${transporte.placaVM}" AnioModeloVM="${transporte.anioModeloVM}" <#if transaction.custbody_drt_cp_peso_bruto_vehicular?has_content> PesoBrutoVehicular="${transaction.custbody_drt_cp_peso_bruto_vehicular?string["0"]}"</#if>/>
<fx:Seguros AseguraRespCivil="${transporte.aseguraRespCivil}" PolizaRespCivil="${transporte.polizaRespCivil}"
<#if materialPeligroso?string == "Sí" || materialPeligroso?string == "Si">
<#if transporte.aseguraMedAmbiente?has_content> AseguraMedAmbiente="${transporte.aseguraMedAmbiente}"</#if>
<#if transporte.polizaMedAmbiente?has_content> PolizaMedAmbiente="${transporte.polizaMedAmbiente}"</#if>
</#if>
<#if transporte.aseguraCarga?has_content> AseguraCarga="${transporte.aseguraCarga}"</#if>
<#if transporte.polizaCarga?has_content> PolizaCarga="${transporte.polizaCarga}"</#if>
<#if transporte.primaSeguro?has_content> PrimaSeguro="${transporte.primaSeguro?string["0.000000"]}"</#if>/>
<#if transporte.remolques?has_content>
<fx:Remolques>
<#assign objRemolque=transporte.remolques>
<#list objRemolque as remolque>
<fx:Remolque SubTipoRem="${remolque.subTipoRem?keep_before(":")}" Placa="${remolque.placaRem}"/>
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
<fx:Seguros AseguraRespCivil="${transporte.aseguraRespCivil}" PolizaRespCivil="${transporte.polizaRespCivil}" <#if transporte.aseguraMedAmbiente?has_content> AseguraMedAmbiente="${transporte.aseguraMedAmbiente}"</#if><#if transporte.polizaMedAmbiente?has_content> PolizaMedAmbiente="${transporte.polizaMedAmbiente}"</#if><#if transporte.aseguraCarga?has_content> AseguraCarga="${transporte.aseguraCarga}"</#if><#if transporte.polizaCarga?has_content> PolizaCarga="${transporte.polizaCarga}"</#if><#if transporte.primaSeguro?has_content> PrimaSeguro="${transporte.primaSeguro?string["0.000000"]}"</#if>/>
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
<fx:Seguros AseguraRespCivil="${transporte.aseguraRespCivil}" PolizaRespCivil="${transporte.polizaRespCivil}"
<#if materialPeligroso?string == "Sí" || materialPeligroso?string == "Si">
<#if transporte.aseguraMedAmbiente?has_content> AseguraMedAmbiente="${transporte.aseguraMedAmbiente}"</#if>
<#if transporte.polizaMedAmbiente?has_content> PolizaMedAmbiente="${transporte.polizaMedAmbiente}"</#if>
</#if>
<#if transporte.aseguraCarga?has_content> AseguraCarga="${transporte.aseguraCarga}"</#if>
<#if transporte.polizaCarga?has_content> PolizaCarga="${transporte.polizaCarga}"</#if>
<#if transporte.primaSeguro?has_content> PrimaSeguro="${transporte.primaSeguro?string["0.000000"]}"</#if>/>
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
<#if figTransp.partetransporte?has_content>
<fx:PartesTransporte ParteTransporte="${figTransp.partetransporte}"/>
</#if>
<fx:Domicilio <#if figTransp.calle?has_content>Calle="${figTransp.calle}" </#if><#if figTransp.numeroexterior?has_content>NumeroExterior="${figTransp.numeroexterior}" </#if><#if figTransp.numerointerior?has_content>NumeroInterior="${figTransp.numerointerior}" </#if><#if figTransp.colonia?has_content>Colonia="${figTransp.colonia}" </#if><#if figTransp.localidad?has_content>Localidad="${figTransp.localidad}" </#if><#if figTransp.referencia?has_content>Referencia="${figTransp.referencia}" </#if><#if figTransp.municipio?has_content>Municipio="${figTransp.municipio}" </#if>Estado="${figTransp.estado}" Pais="${figTransp.residenciafiscalfigura}" CodigoPostal="${figTransp.codigopostal}"/>
</fx:TiposFigura>
</#list>
</fx:FiguraTransporte>
</#if>
</fx:CartaPorte31>
</#if>
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
```

### XML de Transaccion Invoice con Complemento carta porte:
```xml
<nsResponse>
<record recordType="invoice" id="2037222" perm="4" fields="_eml_nkey_,_multibtnstate_,selectedtab,nsapiPI,nsapiSR,nsapiVF,nsapiFC,nsapiPS,nsapiVI,nsapiVD,nsapiPD,nsapiVL,nsapiRC,nsapiLI,nsapiLC,nsapiCT,nsbrowserenv,wfPI,wfSR,wfVF,wfFC,wfPS,type,id,externalid,whence,customwhence,entryformquerystring,_csrf,wfinstances,dbstrantype,bulk,createddate,lastmodifieddate,periodclosed,allownonglchanges,taxperiod,version,voided,linked,voidblockedbylinks,linkedrevrecje,linkedclosedperioddiscounts,entityname,trantypepermcheck,ntype,deletionreason,deletionreasonmemo,nluser,nlrole,nldept,nlloc,nlsub,baserecordtype,nlapiCC,nexus,warnnexuschange,nexus_country,entitynexus,extraurlparams,taxamountoverride,taxamount2override,isonlinetransaction,companyid,partnerid,source,sourcesystem,synceventfield,originator,website,oldrevenuecommitment,iseitf81on,entityfieldname,currencyname,currencysymbol,currencyprecision,isbasecurrency,origexchangerate,origcurrency,edition,tobeprinted,tobeemailed,email,tobefaxed,fax,message,billattention,billaddressee,billphone,billaddr1,billaddr2,billaddr3,billcity,billstate,billzip,billcountry,billoverride,billingaddress_key,billingaddress,billisresidential,shipisresidential,shipattention,shipaddressee,shipphone,shipaddr1,shipaddr2,shipaddr3,shipcity,shipstate,shipzip,shipcountry,shipoverride,shippingaddress_key,shippingaddress,recordcreatedby,recordcreateddate,prevdate,ppsetbyuser,ppsetbyuservalue,pp_s,pp_e,overallbalance,primarycurrency,primarycurrencyfxrate,overallunbilledorders,credlim,credholdoverride,manualcredithold,credholdentity,checkcreditlimit,weekendpreference,persistedterms,terms,unbilledorders,balance,oncredithold,billaddress,userestimatedpaymentdate,userestimatesource,isinstallment,duedays,mindays,datedriven,discdays,discpct,installmentcount,errornotificationsfield,warningnotificationsfield,noticenotificationsfield,doshippingrecalc,fedexservicename,hasfedexfreightservice,itemshippingcostfxrate,account,exchangerate,currency,vatregnum,totalcostestimate,estgrossprofit,estgrossprofitpercent,previousopportunity,prevrep,custcurrep,discountitem,discountrate,custbody_drt_cp_peso_bruto_vehicular,custbody_numtotalmercs_alm,discountastotal,discountistaxable,disctax1,disctax1amt,checkcommitted,paymentcustomdata,custbody_drt_cp_complemento_cartaporte,custbody_drt_cp_transpinternac,custbody_drt_cp_entradasalidamerc,custbody_drt_cp_viaentradasalida,custbody_drt_cp_totaldistrec,custbody_drt_cp_figura_transporte,custbody_drt_cp_transporte,custbody_drt_cp_pesobrutototal,custbody_drt_cp_unidadpeso,custbody_drt_cp_pesonetototal,custbody_drt_cp_numtotalmercancias,custbody_drt_cp_cargoportasacion,custbody_drt_cp_moneda,custbody_drt_cp_rfc_receptor,custbody_drt_cp_clave_unidadpeso,custbody_drt_cp_tipo_transporte,custbody_drt_cp_json_ubicacion,custbody_drt_cp_json_figura_transporte,custbody_drt_cp_json_transporte,custbody_drt_cp_paisorigendestino,custbody_drt_cp_origen,custbody_drt_cp_destino,custbody_drt_cp_id_destino,custbody_drt_cp_id_origen,custbody_drt_cp_fechahora_salida,custbody_drt_cp_fechahora_llegada,custbody_drt_cp_url_string,custbody_drt_cp_logistica_inversa_rede,custbody_establishment_code,custbody_wmsse_printpickticket,custbody_wmsse_ordertype,custbody_transaction_region,custbody_nexus_notc,custbody_delivery_terms,custbody_notc,custbody_4110_customregnum,custbody_mode_of_transport,custbody_regime_code_of_supply,custbody_date_of_taxable_supply,custbody_refno_originvoice,custbody_counterparty_vat,custbody_doc_num_summ_invoice,custbody_sii_spcl_scheme_code_sales,custbody_sii_property_location,custbody_sii_land_register,custbody_sii_exempt_details,custbody_sii_intra_txn_type,custbody_sii_orig_invoice,custbody_sii_external_reference,custbody_sii_correction_type,custbody_sii_operation_date,custbody_sii_is_third_party,custbody_sii_article_72_73,custbody_sii_not_reported_in_time,custbody_sii_article_61d,custbody_sii_registration_status,custbody_sii_registration_code,custbody_sii_registration_msg,custbody_sii_issued_inv_type,custbody_radi_oyster_ap_memo,custbody_radi_oyster_ap_reference,custbody_radi_oyster_ap_project,custbody_10184_customer_entity_bank,custbody_curr_user_discount_limit,custbody_country_of_origin,custbody_ei_ds_txn_identifier,custbody_psg_ei_trans_edoc_standard,custbody_psg_ei_qr_string,custbody_psg_ei_template,custbody_psg_ei_status,custbody_psg_ei_template_inlinehelp,custbody_psg_ei_sending_method,custbody_psg_ei_inbound_edocument,custbody_edoc_gen_trans_pdf,custbody_edoc_generated_pdf,custbody_psg_ei_generated_edoc,custbody_psg_ei_certified_edoc,custbody_psg_ei_digitalsignature_label,custbody_crt_sol_cancel,custbody_drt_crt_verificacion_cancel,custbody_drt_tipo_cambio_uuid,custbody_drt_motivo_cancelacion,custbody_drt_transaccion_relacionada,custbody_drt_folio_sustitucion,custbody_psg_ei_qr_code,custbody_ei_network_id,custbody_ei_network_name,custbody_ei_network_status,custbody_ei_network_updated_date_time,custbody_sads_fama_cfdi_resp_id,custbody_sads_edocuments_package,custbody_mx_cfdi_cadena_original,custbody_mx_cfdi_signature,custbody_mx_cfdi_sat_signature,custbody_mx_cfdi_sat_serial,custbody_mx_cfdi_qr_code,custbody_mx_cfdi_issue_datetime,custbody_mx_cfdi_issuer_serial,custbody_mx_cfdi_certify_timestamp,custbody_mx_cfdi_usage,custbody_mx_cfdi_uuid,custbody_mx_txn_sat_payment_method,custbody_mx_txn_sat_payment_term,custbody_mx_cfdi_sat_addendum,custbody_mx_cfdi_folio,custbody_mx_cfdi_serie,custbody_mx_cfdi_sat_export_type,custbody_mcf_sat_months,custbody_mcf_sat_recurrence,custbody_mcf_sat_year,custbody_drt_uuid_relacionado,custbody_drt_uuid_relacionado_2,custbody_mcp_idccp,custbody_mcp_rev_logst_colls_ret,custbody_alm_tarjeta_numero,custbody_alm_tarjeta_autorizacion,custbody_alm_pago_numdeposito,custbody_sads_fama_req_id,custbody_sads_fama_tax_object,custbody_regime_code,custbody_report_timestamp,custbody_shipcentral_rma_tobeemail,custbody_sii_code_issued_inv,custbody_validated_addresses_data,fob,shipdate,shipcarrier,shipmethod,trackingnumbers,linkedtrackingnumbers,returntrackingnumbers,shipaddress,custbody_wmsse_freightterms,custbody_wmsse_signiturerequired,custbody_wmsse_thirdpartyaccountnumber,custbody_wmsse_saturdaydelivery,custbody_wmsse_codflag,custbody_shipcentral_sat_del,custbody_packship_process_on_if,custbody_estimated_tax_amount,custbody_shipcentral_returnservice,custbody_4601_appliesto,custbody_psg_ei_content,custbody_ph4185_bstyle,custbody_ph4014_wtax_wamt,custbody_ph4014_wtax_rate,custbody_ph4014_wtax_code,custbody_ph4014_wtax_bamt,tranid,entity,trandate,startdate,enddate,postingperiod,duedate,amountremaining,discountdate,discountamount,amountpaid,otherrefnum,memo,transactionnumber,custbody_document_date,salesrep,opportunity,saleseffectivedate,createdfrom,leadsource,partner,contribpct,custbody_pfp_chofer_,department,class,location,subsidiary,custbody_alm_date_time,custbody_pfp_condiciondepago_,custbody_amount_words,custbody_mx_customer_rfc,custbody_drt_fecha_hora_entrega,intercotransaction,excludefromglnumbering,intercostatus,custbody_mcp_sat_c_carta_porte,custbody_wms_atlas_reason_for_return,custbody_estado_orden_venta,custbody_serie_aph,custbody_15699_exclude_from_ep_process,custbody_freigth_service_terms,custbody_4601_doc_ref_id,custbody_sang_hidden_surcharge_config,custbody_packship_ship_groups_data,custbody_itr_nexus,custbody_4601_pymnt_ref_id,custbody_4601_entitytype,custbody_4601_entitydefaultwitaxcode,custbody_drt_nc_identificador_novacaja,custbody_drt_nc_requiere_factura,custbody_drt_nc_conexion,custbody_drt_nc_tipo_venta,custbody_drt_nc_entrega_mercancia,custbody_drt_nc_informacion_envio,custbody_mx_journalentry_createdby,custbody_drt_nc_total_efectivo,custbody_drt_nc_total_credito,custbody_drt_nc_total_debito,custbody_drt_cs_xml,custbody_drtpesototal,custbody_drtvolumentotal,custbody_drtvolumentotalpies,custbody_drtcantidad,custbodydrt,custbody_packship_so_packinstructions,custbody_drt_serie_lote_obj,custbodyalm_consignatario_name,custbody_alm_consignation_adress,custbody_drt_hasinvoice,custbody_drt_hasfulfillment,custbody9,custbody_drt_tran_cuadre_caja,custbody_shipcentral_rma_returnreason,custbody_whoutlet_relationship,custbody_curr_cust_discount_limit,custbody_cust_serv_lvl,custbody_customer_level_service_rec,origtotal2,subtotal,discounttotal,taxtotal,total,amountremainingtotalbox,origtotal,balreadyrefunded,emailaddr,iteminventorydetailhidden,partnerstotal,canhavestackable,semail,storeorder,status,statusRef,finchrg,tranline0_department,tranline0_class,tranline0_location,sendorderfulfillmentemail,customerpayment,custpage_taf_subsidiarycache,custpage_itr_nexus,custpage_cs_msgs,custpage_lrcfm_datacarrier_text,custpage_4601_enablelookuptrans,custpage_4601_resobj,custpage_cs_msgs_wht,custpage_4601_witaxcodesasjson,custpage_4601_witaxgroupsasjson,custpage_4601_witaxsetupsasjson,custpage_4601_witaxtype,custpage_4601_appliesto,custpage_4601_witaxcode,custpage_4601_witaxrate,custpage_4601_witaxbaseamount,custpage_4601_witaxamount,syncpartnerteams">
<_csrf>CzRenl8FqWwwaWLqwR54JnKVdmyLJW7GvuqN4FTpaJAld9GPfec6iaH7t5J6vRSpcnDZobBnFMhxD-mY2cHb3JWTxMdlJKGNkfmqBTYlSHt2yUy_gP8TykSyWF9vj3uC6zoL7fY65vxOSJYgHk2HmUGcBlYIdAO6ihIOQLSRVRE=</_csrf>
<_eml_nkey_>5490848_SB1~9672~3~N</_eml_nkey_>
<account>122</account>
<amountpaid>0.00</amountpaid>
<amountremaining>81355.68</amountremaining>
<amountremainingtotalbox>81355.68</amountremainingtotalbox>
<balance>151774.56</balance>
<balreadyrefunded>F</balreadyrefunded>
<baserecordtype>invoice</baserecordtype>
<billaddress>PAPAS SELECTAS RIO FUERTE<br>AV. LOS ANGELES 1000 BOD 178<br>MERCADO DE ABASTOS ESTRELLA <br>66482 SAN NICOLAS DE LOS GARZA, NL<br>México</billaddress>
<billaddressee>PAPAS SELECTAS RIO FUERTE</billaddressee>
<billcity>SAN NICOLAS DE LOS GARZA</billcity>
<billcountry>MX</billcountry>
<billingaddress>218952</billingaddress>
<billingaddress_key>218952</billingaddress_key>
<billisresidential>F</billisresidential>
<billoverride>F</billoverride>
<billstate>NL</billstate>
<billzip>66482</billzip>
<canhavestackable>F</canhavestackable>
<checkcommitted>F</checkcommitted>
<companyid>14378</companyid>
<createddate>07/03/2026 2:36 PM</createddate>
<credholdentity>14378</credholdentity>
<credholdoverride>F</credholdoverride>
<credlim>0.00</credlim>
<currency>1</currency>
<currencyname>MXN</currencyname>
<currencyprecision>2</currencyprecision>
<currencysymbol>MXN</currencysymbol>
<custbody9>F</custbody9>
<custbody_15699_exclude_from_ep_process>F</custbody_15699_exclude_from_ep_process>
<custbody_4601_appliesto>T</custbody_4601_appliesto>
<custbody_4601_entitytype>2</custbody_4601_entitytype>
<custbody_alm_consignation_adress>PAPAS SELECTAS RIO FUERTE<br>AV. LOS ANGELES 1000 BOD 178<br>MERCADO DE ABASTOS ESTRELLA <br>66482 SAN NICOLAS DE LOS GARZA, NL<br>México</custbody_alm_consignation_adress>
<custbody_alm_date_time>07/03/2026 2:33:56 PM</custbody_alm_date_time>
<custbody_amount_words>Ochenta Y Un Mil Trescientos Cincuenta Y Cinco Pesos 68/100</custbody_amount_words>
<custbody_crt_sol_cancel>F</custbody_crt_sol_cancel>
<custbody_drt_cp_clave_unidadpeso>KGM</custbody_drt_cp_clave_unidadpeso>
<custbody_drt_cp_complemento_cartaporte>T</custbody_drt_cp_complemento_cartaporte>
<custbody_drt_cp_destino>412</custbody_drt_cp_destino>
<custbody_drt_cp_fechahora_llegada>09/03/2026 1:00:00 PM</custbody_drt_cp_fechahora_llegada>
<custbody_drt_cp_fechahora_salida>07/03/2026 1:00:00 PM</custbody_drt_cp_fechahora_salida>
<custbody_drt_cp_figura_transporte>25</custbody_drt_cp_figura_transporte>
<custbody_drt_cp_figura_transporte>27</custbody_drt_cp_figura_transporte>
<custbody_drt_cp_figura_transporte>28</custbody_drt_cp_figura_transporte>
<custbody_drt_cp_id_destino>DE000500</custbody_drt_cp_id_destino>
<custbody_drt_cp_id_origen>OR000503</custbody_drt_cp_id_origen>
<custbody_drt_cp_json_figura_transporte>[{"tipoFigura":"01","rfcfigura":"CASA861008F54","numlicencia":"SIN0106502","nombrefigura":"ASAEL ALEXI CASTRO SANCHEZ","numregidtribfigura":"","residenciafiscalfigura":"MEX","partetransporte":"","calle":"SAN NICOLAS","numeroexterior":"916","numerointerior":"","colonia":"","localidad":"","referencia":"","municipio":"015","estado":"SIN","codigopostal":"81475"},{"tipoFigura":"02","rfcfigura":"NIVY7912153B3","numlicencia":"","nombrefigura":"YEIKO ELIZABETH NISHIMOTO VELARDE","numregidtribfigura":"","residenciafiscalfigura":"MEX","partetransporte":"PT03","calle":"SIVERIO TRUEBA","numeroexterior":"355","numerointerior":"","colonia":"0824","localidad":"06","referencia":"","municipio":"015","estado":"SIN","codigopostal":"81430"},{"tipoFigura":"02","rfcfigura":"NIVY7912153B3","numlicencia":"","nombrefigura":"YEIKO ELIZABETH NISHIMOTO VELARDE","numregidtribfigura":"","residenciafiscalfigura":"MEX","partetransporte":"PT04","calle":"SIVERIO TRUEBA","numeroexterior":"355","numerointerior":"","colonia":"0824","localidad":"06","referencia":"","municipio":"015","estado":"SIN","codigopostal":"81430"}]</custbody_drt_cp_json_figura_transporte>
<custbody_drt_cp_json_transporte>[{"permSCT":"TPAF01","numPermisoSCT":"2547NIVY24052012021001012","configVehicular":"T3S3","placaVM":"815EY4","anioModeloVM":2014,"aseguraRespCivil":"HDI SEGUROS","polizaRespCivil":"571872211","aseguraMedAmbiente":"HDI SEGUROS","polizaMedAmbiente":"571787621","aseguraCarga":"HDI SEGUROS","polizaCarga":"571787621","primaSeguro":100000,"remolques":[{"subTipoRem":"CTR018: Jaula","placaRem":"139XA5"},{"subTipoRem":"CTR018: Jaula","placaRem":"51TX3R"}]}]</custbody_drt_cp_json_transporte>
<custbody_drt_cp_json_ubicacion>[{"tipoEstacion":"","distanciaRecorrida":"0.00","tipoUbicacion":"Origen","idUbicacion":"OR000503","rfcRemitenteDestinatario":"GAG140605LX6","nombreRemitenteDestinatario":"GONFER AGRICOLA","numRegIdTrib":"","residenciaFiscal":"MEX","numEstacion":"","nombreEstacion":"","navegacionTrafico":"","fechaHoraSalidaLlegada":"2026-03-07T19:00:00","domicilioCalle":"LOPEZ MATEOS","domicilioNumExt":"2472","domicilioNumInt":"","domicilioColonia":"0680","domicilioLocalidad":"","domicilioReferencia":"","domicilioMunicipio":"001","domicilioEstado":"SIN","domicilioPais":"MEX","domicilioCodigoPostal":"81210"},{"tipoEstacion":"","distanciaRecorrida":"0.00","tipoUbicacion":"Destino","idUbicacion":"DE000500","rfcRemitenteDestinatario":"PSR920309CS2","nombreRemitenteDestinatario":"PAPAS SELECTAS RIO FUERTE","numRegIdTrib":"","residenciaFiscal":"MEX","numEstacion":"","nombreEstacion":"","navegacionTrafico":"","fechaHoraSalidaLlegada":"2026-03-09T19:00:00","domicilioCalle":"AV LOS ANGELES","domicilioNumExt":"1000","domicilioNumInt":"BOD 178","domicilioColonia":"1303","domicilioLocalidad":"","domicilioReferencia":"","domicilioMunicipio":"046","domicilioEstado":"NLE","domicilioPais":"MEX","domicilioCodigoPostal":"66482"}]</custbody_drt_cp_json_ubicacion>
<custbody_drt_cp_numtotalmercancias>1</custbody_drt_cp_numtotalmercancias>
<custbody_drt_cp_origen>405</custbody_drt_cp_origen>
<custbody_drt_cp_paisorigendestino>1</custbody_drt_cp_paisorigendestino>
<custbody_drt_cp_peso_bruto_vehicular>54</custbody_drt_cp_peso_bruto_vehicular>
<custbody_drt_cp_pesobrutototal>34.59</custbody_drt_cp_pesobrutototal>
<custbody_drt_cp_pesonetototal>34.59</custbody_drt_cp_pesonetototal>
<custbody_drt_cp_rfc_receptor>PSR920309CS2</custbody_drt_cp_rfc_receptor>
<custbody_drt_cp_tipo_transporte>1</custbody_drt_cp_tipo_transporte>
<custbody_drt_cp_totaldistrec>1300</custbody_drt_cp_totaldistrec>
<custbody_drt_cp_transpinternac>2</custbody_drt_cp_transpinternac>
<custbody_drt_cp_transporte>33</custbody_drt_cp_transporte>
<custbody_drt_cp_unidadpeso>1</custbody_drt_cp_unidadpeso>
<custbody_drt_cp_url_string>https://verificacfdi.facturaelectronica.sat.gob.mx/verificaccp/default.aspx?&IdCCP=CCCb63da-f1d4-4831-858e-22a2461a5d1c&FechaOrig=2026-3-7T13:00:00&FechaTimb=</custbody_drt_cp_url_string>
<custbody_drt_hasfulfillment>F</custbody_drt_hasfulfillment>
<custbody_drt_hasinvoice>F</custbody_drt_hasinvoice>
<custbody_drt_nc_requiere_factura>F</custbody_drt_nc_requiere_factura>
<custbody_drt_serie_lote_obj>{}</custbody_drt_serie_lote_obj>
<custbody_edoc_gen_trans_pdf>T</custbody_edoc_gen_trans_pdf>
<custbody_edoc_generated_pdf>3153566</custbody_edoc_generated_pdf>
<custbody_ei_ds_txn_identifier>F</custbody_ei_ds_txn_identifier>
<custbody_mcp_idccp>CCCb63da-f1d4-4831-858e-22a2461a5d1c</custbody_mcp_idccp>
<custbody_mcp_rev_logst_colls_ret>F</custbody_mcp_rev_logst_colls_ret>
<custbody_mcp_sat_c_carta_porte>F</custbody_mcp_sat_c_carta_porte>
<custbody_mx_cfdi_cadena_original>Borrado por que no aporta para la creacion de la plantilla</custbody_mx_cfdi_cadena_original>
<custbody_mx_cfdi_certify_timestamp>2026-03-19T10:15:21</custbody_mx_cfdi_certify_timestamp>
<custbody_mx_cfdi_folio>155670</custbody_mx_cfdi_folio>
<custbody_mx_cfdi_issue_datetime>19/03/2026 10:15:20 AM</custbody_mx_cfdi_issue_datetime>
<custbody_mx_cfdi_issuer_serial>00001000000714650955</custbody_mx_cfdi_issuer_serial>
<custbody_mx_cfdi_qr_code>Borrado por que no aporta para la creacion de la plantilla</custbody_mx_cfdi_qr_code>
<custbody_mx_cfdi_sat_export_type>1</custbody_mx_cfdi_sat_export_type>
<custbody_mx_cfdi_sat_serial>00001000000711327115</custbody_mx_cfdi_sat_serial>
<custbody_mx_cfdi_sat_signature>Borrado por que no aporta para la creacion de la plantilla</custbody_mx_cfdi_sat_signature>
<custbody_mx_cfdi_signature>Borrado por que no aporta para la creacion de la plantilla</custbody_mx_cfdi_signature>
<custbody_mx_cfdi_usage>3</custbody_mx_cfdi_usage>
<custbody_mx_cfdi_uuid>b56d98c9-24d1-4f0f-a12b-fbbb3fc75a62</custbody_mx_cfdi_uuid>
<custbody_mx_customer_rfc>PSR920309CS2</custbody_mx_customer_rfc>
<custbody_mx_journalentry_createdby>14276</custbody_mx_journalentry_createdby>
<custbody_mx_txn_sat_payment_method>28</custbody_mx_txn_sat_payment_method>
<custbody_mx_txn_sat_payment_term>4</custbody_mx_txn_sat_payment_term>
<custbody_numtotalmercs_alm>0</custbody_numtotalmercs_alm>
<custbody_packship_process_on_if>F</custbody_packship_process_on_if>
<custbody_pfp_condiciondepago_>1</custbody_pfp_condiciondepago_>
<custbody_psg_ei_certified_edoc>3153565</custbody_psg_ei_certified_edoc>
<custbody_psg_ei_content><?xml version="1.0" encoding="UTF-8"?> <fx:FactDocMX xmlns:fx="http://www.fact.com.mx/schema/fx" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.fact.com.mx/schema/fx http://www.mysuitemex.com/fact/schema/fx_2010_g.xsd"> <fx:Version>8</fx:Version> <fx:Identificacion> <fx:CdgPaisEmisor>MX</fx:CdgPaisEmisor> <fx:TipoDeComprobante>FACTURA</fx:TipoDeComprobante> <fx:RFCEmisor>NIVY7912153B3</fx:RFCEmisor> <fx:RazonSocialEmisor>YEIKO ELIZABETH NISHIMOTO VELARDE</fx:RazonSocialEmisor> <fx:Usuario>Cinthia Campos V</fx:Usuario> <fx:AsignacionSolicitada> <fx:Folio>155670</fx:Folio> <fx:TiempoDeEmision>2026-03-19T00:00:00</fx:TiempoDeEmision> </fx:AsignacionSolicitada> <fx:Exportacion>01</fx:Exportacion> <fx:LugarExpedicion>81430</fx:LugarExpedicion> </fx:Identificacion> <fx:Emisor> <fx:RegimenFiscal> <fx:Regimen>612</fx:Regimen> </fx:RegimenFiscal> </fx:Emisor> <fx:Receptor> <fx:CdgPaisReceptor>MX</fx:CdgPaisReceptor> <fx:RFCReceptor>PSR920309CS2</fx:RFCReceptor> <fx:NombreReceptor>PAPAS SELECTAS RIO FUERTE</fx:NombreReceptor> <fx:DomicilioFiscalReceptor>66482</fx:DomicilioFiscalReceptor> <fx:RegimenFiscalReceptor>601</fx:RegimenFiscalReceptor> <fx:UsoCFDI>G03</fx:UsoCFDI> </fx:Receptor> <fx:Conceptos> <fx:Concepto> <fx:Cantidad>34.590000</fx:Cantidad> <fx:ClaveUnidad>E48</fx:ClaveUnidad> <fx:UnidadDeMedida>SERV</fx:UnidadDeMedida> <fx:ClaveProdServ>78101800</fx:ClaveProdServ> <fx:Codigo>Flete Yeiko</fx:Codigo> <fx:Descripcion>"Servicio de flete"</fx:Descripcion> <fx:ValorUnitario>2100.00</fx:ValorUnitario> <fx:Importe>72639.00</fx:Importe> <fx:Descuento>0.00</fx:Descuento> <fx:ObjetoImp>02</fx:ObjetoImp> <fx:ImpuestosSAT> <fx:Traslados> <fx:Traslado Base="72639.00" Importe="11622.24" Impuesto="002" TasaOCuota="0.160000" TipoFactor="Tasa" /> </fx:Traslados> <fx:Retenciones> <fx:Retencion Base="72639.00" Importe="2905.56" Impuesto="002" TasaOCuota="0.040000" TipoFactor="Tasa" /> </fx:Retenciones> </fx:ImpuestosSAT> <fx:Opciones> </fx:Opciones> </fx:Concepto> </fx:Conceptos> <fx:ImpuestosSAT TotalImpuestosRetenidos="2905.56" TotalImpuestosTrasladados="11622.24"> <fx:Retenciones> <fx:Retencion Importe="2905.56" Impuesto="002" /> </fx:Retenciones> <fx:Traslados> <fx:Traslado Base="72639.00" Importe="11622.24" Impuesto="002" TasaOCuota="0.160000" TipoFactor="Tasa" /> </fx:Traslados> </fx:ImpuestosSAT> <fx:Totales> <fx:Moneda>MXN</fx:Moneda> <fx:TipoDeCambioVenta>1</fx:TipoDeCambioVenta> <fx:SubTotalBruto>72639.00</fx:SubTotalBruto> <fx:SubTotal>72639.00</fx:SubTotal> <fx:Descuento>0.00</fx:Descuento> <fx:Total>81355.68</fx:Total> <fx:TotalEnLetra>-</fx:TotalEnLetra> <fx:FormaDePago>99</fx:FormaDePago> </fx:Totales> <fx:Complementos> <fx:CartaPorte31 Version="3.1" IdCCP="CCCb63da-f1d4-4831-858e-22a2461a5d1c" TranspInternac="No" TotalDistRec="1300.00"> <fx:Ubicaciones> <fx:Ubicacion TipoUbicacion="Origen" IDUbicacion="OR000503" RFCRemitenteDestinatario="GAG140605LX6" NombreRemitenteDestinatario="GONFER AGRICOLA" FechaHoraSalidaLlegada="2026-03-07T13:00:00"> <fx:Domicilio Calle="LOPEZ MATEOS" NumeroExterior="2472" Colonia="0680" Municipio="001" Estado="SIN" Pais="MEX" CodigoPostal="81210"/> </fx:Ubicacion> <fx:Ubicacion TipoUbicacion="Destino" IDUbicacion="DE000500" RFCRemitenteDestinatario="PSR920309CS2" NombreRemitenteDestinatario="PAPAS SELECTAS RIO FUERTE" FechaHoraSalidaLlegada="2026-03-09T13:00:00" DistanciaRecorrida="1300.00"> <fx:Domicilio Calle="AV LOS ANGELES" NumeroExterior="1000" NumeroInterior="BOD 178" Colonia="1303" Municipio="046" Estado="NLE" Pais="MEX" CodigoPostal="66482"/> </fx:Ubicacion> </fx:Ubicaciones> <fx:Mercancias PesoBrutoTotal="34.590" UnidadPeso="KGM" PesoNetoTotal="34.590" NumTotalMercancias="1"> <fx:Mercancia BienesTransp="50405700" Descripcion="Papas" Cantidad="34.590000" ClaveUnidad="KGM" Unidad="Kg" PesoEnKg="34.590" > <!----> <fx:CantidadTransporta Cantidad="34.590000" IDOrigen="OR000503" IDDestino="DE000500" /> </fx:Mercancia> <fx:Autotransporte PermSCT="TPAF01" NumPermisoSCT="2547NIVY24052012021001012"> <fx:IdentificacionVehicular ConfigVehicular="T3S3" PlacaVM="815EY4" AnioModeloVM="2014" PesoBrutoVehicular="54"/> <fx:Seguros AseguraRespCivil="HDI SEGUROS" PolizaRespCivil="571872211" AseguraCarga="HDI SEGUROS" PolizaCarga="571787621" PrimaSeguro="100000.000000"/> <fx:Remolques> <fx:Remolque SubTipoRem="CTR018" Placa="139XA5"/> <fx:Remolque SubTipoRem="CTR018" Placa="51TX3R"/> </fx:Remolques> </fx:Autotransporte> </fx:Mercancias> <fx:FiguraTransporte> <fx:TiposFigura TipoFigura="01" RFCFigura="CASA861008F54" NumLicencia="SIN0106502" NombreFigura="ASAEL ALEXI CASTRO SANCHEZ"> <fx:Domicilio Calle="SAN NICOLAS" NumeroExterior="916" Municipio="015" Estado="SIN" Pais="MEX" CodigoPostal="81475"/> </fx:TiposFigura> <fx:TiposFigura TipoFigura="02" RFCFigura="NIVY7912153B3" NombreFigura="YEIKO ELIZABETH NISHIMOTO VELARDE"> <fx:PartesTransporte ParteTransporte="PT03"/> <fx:Domicilio Calle="SIVERIO TRUEBA" NumeroExterior="355" Colonia="0824" Localidad="06" Municipio="015" Estado="SIN" Pais="MEX" CodigoPostal="81430"/> </fx:TiposFigura> <fx:TiposFigura TipoFigura="02" RFCFigura="NIVY7912153B3" NombreFigura="YEIKO ELIZABETH NISHIMOTO VELARDE"> <fx:PartesTransporte ParteTransporte="PT04"/> <fx:Domicilio Calle="SIVERIO TRUEBA" NumeroExterior="355" Colonia="0824" Localidad="06" Municipio="015" Estado="SIN" Pais="MEX" CodigoPostal="81430"/> </fx:TiposFigura> </fx:FiguraTransporte> </fx:CartaPorte31> </fx:Complementos> <fx:ComprobanteEx> <fx:TerminosDePago> <fx:MetodoDePago>PPD</fx:MetodoDePago> <fx:CondicionesDePago>30 Días</fx:CondicionesDePago> </fx:TerminosDePago> </fx:ComprobanteEx> </fx:FactDocMX></custbody_psg_ei_content>
<custbody_psg_ei_generated_edoc><a href="/app/site/hosting/scriptlet.nl?script=90&deploy=1&compid=5490848_SB1&edocId=2037222&fileFormat=xml&doctype=outbound&type=invoice&command=preview">preview invoice_19/03/2026 10:15 AM.xml</a>&nbsp;&nbsp;<a href="/app/site/hosting/scriptlet.nl?script=90&deploy=1&compid=5490848_SB1&edocId=2037222&fileFormat=xml&doctype=outbound&type=invoice&genDate=19%2F03%2F2026+10%3A15+AM&command=download">download</a></custbody_psg_ei_generated_edoc>
<custbody_psg_ei_sending_method>5</custbody_psg_ei_sending_method>
<custbody_psg_ei_status>1</custbody_psg_ei_status>
<custbody_psg_ei_template>119</custbody_psg_ei_template>
<custbody_report_timestamp>7/3/2026 12:33:51</custbody_report_timestamp>
<custbody_sads_fama_tax_object>02</custbody_sads_fama_tax_object>
<custbody_shipcentral_rma_tobeemail>F</custbody_shipcentral_rma_tobeemail>
<custbody_shipcentral_sat_del>F</custbody_shipcentral_sat_del>
<custbody_sii_article_61d>F</custbody_sii_article_61d>
<custbody_sii_article_72_73>F</custbody_sii_article_72_73>
<custbody_sii_is_third_party>F</custbody_sii_is_third_party>
<custbody_sii_not_reported_in_time>F</custbody_sii_not_reported_in_time>
<custbody_wmsse_codflag>F</custbody_wmsse_codflag>
<custbody_wmsse_printpickticket>F</custbody_wmsse_printpickticket>
<custbody_wmsse_saturdaydelivery>F</custbody_wmsse_saturdaydelivery>
<custbody_wmsse_signiturerequired>F</custbody_wmsse_signiturerequired>
<custcurrep>14276</custcurrep>
<custpage_4601_appliesto>T</custpage_4601_appliesto>
<custpage_4601_enablelookuptrans>true</custpage_4601_enablelookuptrans>
<custpage_4601_witaxamount>2905.56</custpage_4601_witaxamount>
<custpage_4601_witaxbaseamount>72639.0</custpage_4601_witaxbaseamount>
<custpage_4601_witaxcode>18</custpage_4601_witaxcode>
<custpage_4601_witaxcodesasjson>[{"id":"21","name":"ISR Por Intereses","rate":20,"percentageofbase":100,"witaxtype":"12","witaxtype_text":"12","witaxtypename":"ISR Por Intereses","witaxbase":"amount","istaxgroup":false,"subsidiaries":["4","10"],"subsidiaries_text":"21","includechildsubs":false},{"id":"20","name":"FLETES","rate":4,"percentageofbase":100,"witaxtype":"3","witaxtype_text":"3","witaxtypename":"IVA Fletes","witaxbase":"amount","istaxgroup":false,"subsidiaries":["4","10"],"subsidiaries_text":"20","includechildsubs":false},{"id":"18","name":"IVA Servicio Fletes","rate":4,"percentageofbase":100,"witaxtype":"3","witaxtype_text":"3","witaxtypename":"IVA Fletes","witaxbase":"amount","istaxgroup":false,"subsidiaries":["1"],"subsidiaries_text":"18","includechildsubs":true}]</custpage_4601_witaxcodesasjson>
<custpage_4601_witaxgroupsasjson>[{"id":"17","witaxcodes":[{"TaxGroupId":"17","TaxCode":"16","TaxRate":0.0125,"TaxBasis":100,"TaxType":"11"},{"TaxGroupId":"17","TaxCode":"2","TaxRate":0.10666700000000001,"TaxBasis":100,"TaxType":"5"}]},{"id":"6","witaxcodes":[{"TaxGroupId":"6","TaxCode":"1","TaxRate":0.1,"TaxBasis":100,"TaxType":"1"},{"TaxGroupId":"6","TaxCode":"2","TaxRate":0.10666700000000001,"TaxBasis":100,"TaxType":"5"}]},{"id":"7","witaxcodes":[{"TaxGroupId":"7","TaxCode":"3","TaxRate":0.1,"TaxBasis":100,"TaxType":"2"},{"TaxGroupId":"7","TaxCode":"4","TaxRate":0.10666700000000001,"TaxBasis":100,"TaxType":"6"}]},{"id":"13","witaxcodes":[{"TaxGroupId":"13","TaxCode":"11","TaxRate":0.1067,"TaxBasis":100,"TaxType":"8"},{"TaxGroupId":"13","TaxCode":"10","TaxRate":0.1,"TaxBasis":100,"TaxType":"9"}]},{"id":"14","witaxcodes":[{"TaxGroupId":"14","TaxCode":"10","TaxRate":0.1,"TaxBasis":100,"TaxType":"9"},{"TaxGroupId":"14","TaxCode":"9","TaxRate":0.1067,"TaxBasis":100,"TaxType":"10"}]}]</custpage_4601_witaxgroupsasjson>
<custpage_4601_witaxrate>4.0</custpage_4601_witaxrate>
<custpage_4601_witaxsetupsasjson>{"id":"1","saletaxpoint":"onaccrual","purctaxpoint":"onaccrual","autoapply":false}</custpage_4601_witaxsetupsasjson>
<custpage_4601_witaxtype>sale</custpage_4601_witaxtype>
<custpage_cs_msgs>{"ERR_FIELD_TAXREPORTING_COUNTERPARTYVAT_VALUE":"Enter a valid VAT number in the Partner ID field on the Tax Reporting subtab.","ERR_FIELD_COUNTERPARTYVAT_VALUE":"Enter a valid VAT number in the Partner ID field."}</custpage_cs_msgs>
<custpage_cs_msgs_wht>{"ERR_INVALID_DISCOUNT_ON_ACCRUAL":"La aplicación de descuentos en la transacción no se admite cuando el punto de impuesto de retención está configurado como En acumulación.","INFO_ADDRESS_CHANGE_ERROR_MESSAGE":"{INFO_ADDRESS_CHANGE_ERROR_MESSAGE}"}</custpage_cs_msgs_wht>
<custpage_itr_nexus>MX</custpage_itr_nexus>
<custpage_lrcfm_datacarrier_text>Borrado por que no aporta para la creacion de la plantilla</custpage_lrcfm_datacarrier_text>
<custpage_taf_subsidiarycache>{"1":"MX","3":"MX","6":"MX","5":"MX","12":"MX","7":"MX","8":"MX","9":"MX","2":"MX","11":"MX","4":"MX","10":"MX"}</custpage_taf_subsidiarycache>
<datedriven>F</datedriven>
<dbstrantype>CustInvc</dbstrantype>
<duedate>18/04/2026</duedate>
<duedays>30</duedays>
<edition>XX</edition>
<email>contabilidad1@riosfuerte.com.mx</email>
<emailaddr>contabilidad1@riosfuerte.com.mx</emailaddr>
<entity>14378</entity>
<entityfieldname>entity</entityfieldname>
<entityname>11851 PAPAS SELECTAS RIO FUERTE</entityname>
<entitynexus>1</entitynexus>
<entryformquerystring>id=2037222&xml=t</entryformquerystring>
<estgrossprofit>69733.44</estgrossprofit>
<estgrossprofitpercent>100.0%</estgrossprofitpercent>
<exchangerate>1.00</exchangerate>
<excludefromglnumbering>F</excludefromglnumbering>
<finchrg>F</finchrg>
<hasfedexfreightservice>F</hasfedexfreightservice>
<id>2037222</id>
<installmentcount>0</installmentcount>
<isbasecurrency>T</isbasecurrency>
<iseitf81on>F</iseitf81on>
<isinstallment>F</isinstallment>
<isonlinetransaction>F</isonlinetransaction>
<iteminventorydetailhidden>T</iteminventorydetailhidden>
<itemshippingcostfxrate>1</itemshippingcostfxrate>
<lastmodifieddate>23/09/2026 8:31 PM</lastmodifieddate>
<linked>F</linked>
<linkedclosedperioddiscounts>F</linkedclosedperioddiscounts>
<linkedrevrecje>F</linkedrevrecje>
<manualcredithold>F</manualcredithold>
<memo>Clave de viaje: 26GOAG04, ticket de bascula 483253, peso de bascula: 34590, chofer: Asael Alexi Castro Sanchez, recibido: 08 marzo 2026</memo>
<mindays>0</mindays>
<nexus>1</nexus>
<nexus_country>MX</nexus_country>
<nlapiCC>F</nlapiCC>
<nldept>5</nldept>
<nlloc>0</nlloc>
<nlrole>3</nlrole>
<nlsub>4</nlsub>
<nluser>9672</nluser>
<nsapiCT>1790708814742</nsapiCT>
<nsapiFC>dispatchFieldChanged</nsapiFC>
<ntype>7</ntype>
<oldrevenuecommitment>F</oldrevenuecommitment>
<oncredithold>(En espera)</oncredithold>
<origcurrency>1</origcurrency>
<origexchangerate>1.00</origexchangerate>
<origtotal>81355.68</origtotal>
<origtotal2>81355.68</origtotal2>
<overallbalance>151774.56</overallbalance>
<overallunbilledorders>0.00</overallunbilledorders>
<persistedterms>2</persistedterms>
<postingperiod>671</postingperiod>
<pp_e>31/03/2026</pp_e>
<pp_s>01/03/2026</pp_s>
<ppsetbyuser>F</ppsetbyuser>
<prevdate>19/03/2026</prevdate>
<prevrep>14276</prevrep>
<primarycurrency>1.00</primarycurrency>
<primarycurrencyfxrate>1.00</primarycurrencyfxrate>
<recordcreatedby>14276</recordcreatedby>
<recordcreateddate>03/07/2026 12:36:58</recordcreateddate>
<saleseffectivedate>19/03/2026</saleseffectivedate>
<salesrep>14276</salesrep>
<semail>contabilidad1@riosfuerte.com.mx</semail>
<sendorderfulfillmentemail>T</sendorderfulfillmentemail>
<shipaddress>PAPAS SELECTAS RIO FUERTE<br>AV. LOS ANGELES 1000 BOD 178<br>MERCADO DE ABASTOS ESTRELLA <br>66482 SAN NICOLAS DE LOS GARZA, NL<br>México</shipaddress>
<shipaddressee>PAPAS SELECTAS RIO FUERTE</shipaddressee>
<shipcarrier>nonups</shipcarrier>
<shipcity>SAN NICOLAS DE LOS GARZA</shipcity>
<shipcountry>MX</shipcountry>
<shipdate>07/03/2026</shipdate>
<shipisresidential>F</shipisresidential>
<shipoverride>F</shipoverride>
<shippingaddress>218952</shippingaddress>
<shippingaddress_key>218952</shippingaddress_key>
<shipstate>NL</shipstate>
<shipzip>66482</shipzip>
<status>Abierta</status>
<statusRef>open</statusRef>
<storeorder>F</storeorder>
<subsidiary>10</subsidiary>
<subtotal>69733.44</subtotal>
<syncpartnerteams>F</syncpartnerteams>
<taxperiod>653</taxperiod>
<taxtotal>11622.24</taxtotal>
<terms>2</terms>
<tobeemailed>F</tobeemailed>
<tobefaxed>F</tobefaxed>
<tobeprinted>F</tobeprinted>
<total>81355.68</total>
<totalcostestimate>0.00</totalcostestimate>
<trandate>19/03/2026</trandate>
<tranid>1564559</tranid>
<transactionnumber>155670</transactionnumber>
<type>custinvc</type>
<unbilledorders>0.00</unbilledorders>
<version>18</version>
<voidblockedbylinks>F</voidblockedbylinks>
<voided>F</voided>
<warnnexuschange>F</warnnexuschange>
<weekendpreference>ASIS</weekendpreference>
<wfFC>workflow_fieldchanged</wfFC>
<wfPI>workflow_pageinit</wfPI>
<wfPS>workflow_postsourcing</wfPS>
<wfSR>workflow_saverecord</wfSR>
<wfVF>workflow_validatefield</wfVF>
<machine name="item" type="edit" fields="item,olditemid,description,quantity,custcol_drt_cp_pesoenkg,units,unitslist,unitconversionrate,price,custcol_drt_rate_backup,custcol_drt_rate_block,rate,rateschedule,marginal,oqpbucket,custcol_pfpdescuento_,amount,amounthasbeenset,netamount,taxcode,taxrate1,tax1amt,grossamt,custcol_mx_txn_line_sat_tax_object,custcol_desglose_detalle,custcol_4601_witaxapplies,custcol_drt_cp_materialpeligroso,custcol_drt_cp_embalaje,custcol_mx_txn_line_sat_item_code,options,custcol_4601_witaxbamt_exp,custcol_4601_witaxamt_exp,custcol_4601_witaxline_exp,custcol_4601_witaxcode_exp,custcol_4601_witaxrate_exp,custcol_drt_sobre_cargo,custcol_drt_preciocompra,custcol_drt_tipo_unidad,custcol_drt_cp_cvematerialpeligroso,custcoldrt_cant,custcol_alm_mat_peligro_sat,custcol_margen_estandar,custcol_precio_sin_margen,custcol_margen_minimo_item,custcol_mergn_desc_solicitado,custcol_margen_aplicado,custcol_maxdiscount_margin_percent,custcol_sang_monto_sobrecargo_apli,custcol_sang_item_solicitar_corte,custcolalm_margen_de_venta,custcol_alm_precio_final,custcol_alm_precio_integrado,custcol_country_of_origin_code,custcol_country_of_origin_name,cseg2,cseg3,cseg4,custcol_nature_of_transaction_codes,custcol_pfp_codigoarticulo_,custcol_sang_hidden_item_largo,custcol_statistical_value_base_curr,custcol_2663_companyname,custcol_2663_firstname,custcol_2663_isperson,custcol_2663_lastname,custcol_4601_itemdefaultwitaxcode,custcol_4601_witaxamount,custcol_4601_witaxbaseamount,custcol_4601_witaxcode,custcol_4601_witaxline,custcol_4601_witaxrate,custcol_9572_cr_entitybank_format,custcol_9572_cr_entitybank_sub,custcol_9572_custref_file_format,account,line,lineuniquekey,discline,printitems,ingroup,includegroupwrapper,groupsetup,itemtype,itemsubtype,isnoninventory,fulfillable,mandatorytaxcode,id,isposting,minqty,matrixtype,linenumber,historyurl,history,custpage_4601_witaxcode,custpage_4601_witaxrate,custpage_4601_witaxbaseamount,custpage_4601_witaxamount">
<line>
<account>54</account>
<amount>72639.00</amount>
<amounthasbeenset>F</amounthasbeenset>
<custcol_4601_witaxamount>2905.56</custcol_4601_witaxamount>
<custcol_4601_witaxapplies>T</custcol_4601_witaxapplies>
<custcol_4601_witaxbaseamount>-72639.00</custcol_4601_witaxbaseamount>
<custcol_4601_witaxcode>18</custcol_4601_witaxcode>
<custcol_4601_witaxrate>4.0%</custcol_4601_witaxrate>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_desglose_detalle>1</custcol_desglose_detalle>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_rate_backup>2100</custcol_drt_rate_backup>
<custcol_drt_rate_block>2100</custcol_drt_rate_block>
<custcol_drt_sobre_cargo>T</custcol_drt_sobre_cargo>
<custcol_drt_tipo_unidad>1732</custcol_drt_tipo_unidad>
<custcol_mx_txn_line_sat_item_code>3990</custcol_mx_txn_line_sat_item_code>
<custcol_mx_txn_line_sat_tax_object>2</custcol_mx_txn_line_sat_tax_object>
<custcol_pfp_codigoarticulo_>Flete</custcol_pfp_codigoarticulo_>
<custcol_pfpdescuento_>0.0%</custcol_pfpdescuento_>
<custcol_statistical_value_base_curr>0.00</custcol_statistical_value_base_curr>
<custpage_4601_witaxbaseamount>72639.0</custpage_4601_witaxbaseamount>
<custpage_4601_witaxcode>18</custpage_4601_witaxcode>
<custpage_4601_witaxrate>4.0%</custpage_4601_witaxrate>
<description>Servicio de flete</description>
<fulfillable>F</fulfillable>
<grossamt>84261.24</grossamt>
<history>Historial</history>
<historyurl>/app/accounting/transactions/history.nl?id=2037222</historyurl>
<id>2037222_1</id>
<includegroupwrapper>F</includegroupwrapper>
<isnoninventory>F</isnoninventory>
<isposting>T</isposting>
<item>10551</item>
<item_display>Flete Yeiko</item_display>
<itemsubtype>Sale</itemsubtype>
<itemtype>NonInvtPart</itemtype>
<line>1</line>
<lineuniquekey>12709933</lineuniquekey>
<mandatorytaxcode>T</mandatorytaxcode>
<marginal>F</marginal>
<olditemid>10551</olditemid>
<price>1</price>
<price_display>Precio base</price_display>
<printitems>F</printitems>
<quantity>34.59</quantity>
<rate>2100.00</rate>
<rateschedule>0</rateschedule>
<rateschedule>10.00</rateschedule>
<sys_id>11865847946724079</sys_id>
<tax1amt>11622.24</tax1amt>
<taxcode>6</taxcode>
<taxcode_display>IVA_MX MERCANCIAS:IVA 16% Mercancias</taxcode_display>
<taxrate1>16.0%</taxrate1>
<unitconversionrate>1</unitconversionrate>
<units>4730</units>
<units_display>SERV</units_display>
<unitslist>4730</unitslist>
</line>
<line>
<account>54</account>
<amount>0.00</amount>
<amounthasbeenset>F</amounthasbeenset>
<custcol_4601_witaxapplies>F</custcol_4601_witaxapplies>
<custcol_alm_mat_peligro_sat>F</custcol_alm_mat_peligro_sat>
<custcol_desglose_detalle>2</custcol_desglose_detalle>
<custcol_drt_cp_materialpeligroso>F</custcol_drt_cp_materialpeligroso>
<custcol_drt_cp_pesoenkg>34.59</custcol_drt_cp_pesoenkg>
<custcol_drt_rate_backup>0</custcol_drt_rate_backup>
<custcol_drt_rate_block>0</custcol_drt_rate_block>
<custcol_drt_sobre_cargo>T</custcol_drt_sobre_cargo>
<custcol_drt_tipo_unidad>1730</custcol_drt_tipo_unidad>
<custcol_mx_txn_line_sat_item_code>3999</custcol_mx_txn_line_sat_item_code>
<custcol_mx_txn_line_sat_tax_object>2</custcol_mx_txn_line_sat_tax_object>
<custcol_pfp_codigoarticulo_>Papas</custcol_pfp_codigoarticulo_>
<custcol_pfpdescuento_>0.0%</custcol_pfpdescuento_>
<custcol_statistical_value_base_curr>0.00</custcol_statistical_value_base_curr>
<description>Papas</description>
<fulfillable>T</fulfillable>
<grossamt>0.00</grossamt>
<history>Historial</history>
<historyurl>/app/accounting/transactions/history.nl?id=2037222</historyurl>
<id>2037222_2</id>
<includegroupwrapper>F</includegroupwrapper>
<isnoninventory>F</isnoninventory>
<isposting>T</isposting>
<item>10709</item>
<item_display>Papas</item_display>
<itemsubtype>Sale</itemsubtype>
<itemtype>NonInvtPart</itemtype>
<line>2</line>
<lineuniquekey>12709934</lineuniquekey>
<mandatorytaxcode>T</mandatorytaxcode>
<marginal>F</marginal>
<netamount>2905.56</netamount>
<olditemid>10709</olditemid>
<price>1</price>
<price_display>Precio base</price_display>
<printitems>F</printitems>
<quantity>34.59</quantity>
<rate>0.00</rate>
<rateschedule>0</rateschedule>
<rateschedule>0.00</rateschedule>
<sys_id>11865847946724080</sys_id>
<tax1amt>0.00</tax1amt>
<taxcode>6</taxcode>
<taxcode_display>IVA_MX MERCANCIAS:IVA 16% Mercancias</taxcode_display>
<taxrate1>16.0%</taxrate1>
<unitconversionrate>1</unitconversionrate>
<units>4728</units>
<units_display>Kg</units_display>
<unitslist>4728</unitslist>
<unitslist>8643</unitslist>
</line>
<line>
<account>382</account>
<amount>-2905.56</amount>
<amounthasbeenset>F</amounthasbeenset>
<custcol_4601_witaxapplies>F</custcol_4601_witaxapplies>
<custcol_4601_witaxline>T</custcol_4601_witaxline>
<custcol_4601_witaxline_exp>T</custcol_4601_witaxline_exp>
<custcol_drt_sobre_cargo>T</custcol_drt_sobre_cargo>
<custcol_mx_txn_line_sat_tax_object>2</custcol_mx_txn_line_sat_tax_object>
<custcol_pfpdescuento_>0.0%</custcol_pfpdescuento_>
<custcol_statistical_value_base_curr>0.00</custcol_statistical_value_base_curr>
<description>Retención de IVA Fletes</description>
<discline>2</discline>
<fulfillable>F</fulfillable>
<grossamt>-2905.56</grossamt>
<history>Historial</history>
<historyurl>/app/accounting/transactions/history.nl?id=2037222</historyurl>
<id>2037222_14</id>
<includegroupwrapper>F</includegroupwrapper>
<isnoninventory>F</isnoninventory>
<isposting>T</isposting>
<item>20</item>
<item_display>Retencion IVA Fletes (v.2)</item_display>
<itemtype>Discount</itemtype>
<line>14</line>
<lineuniquekey>12780650</lineuniquekey>
<mandatorytaxcode>F</mandatorytaxcode>
<marginal>F</marginal>
<netamount>0.00</netamount>
<olditemid>20</olditemid>
<price>1</price>
<price_display>Precio base</price_display>
<printitems>F</printitems>
<rate>-2905.56</rate>
<sys_id>11865847946724081</sys_id>
<tax1amt>0.00</tax1amt>
<taxcode>5</taxcode>
<taxcode_display>IVA_MX MERCANCIAS:No objeto</taxcode_display>
<taxrate1>0.0%</taxrate1>
</line>
</machine>
<machine name="partners" type="edit" fields="partner,id,transaction,partnerrole,isprimary,contribution,iscontributionuserdefined"/>
<machine name="transformations" type="list" fields="id,trandate,linkurl,type,tranid,amountDoc"/>
<machine name="appliedrules" type="list" fields="creationdate,ruletypetranslation,details,transactionversion,ruletype,id,parenttransaction,externallogid,detailsurl"/>
<machine name="links" type="list" fields="id,trandate,linkurl,type,tranid,status,total"/>
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
<fx:TipoDeComprobante>FACTURA</fx:TipoDeComprobante>
<fx:RFCEmisor>NIVY7912153B3</fx:RFCEmisor>
<fx:RazonSocialEmisor>YEIKO ELIZABETH NISHIMOTO VELARDE</fx:RazonSocialEmisor>
<fx:Usuario>Cinthia Campos V</fx:Usuario>
<fx:AsignacionSolicitada>
<fx:Folio>155670</fx:Folio>
<fx:TiempoDeEmision>2026-03-19T00:00:00</fx:TiempoDeEmision>
</fx:AsignacionSolicitada>
<fx:Exportacion>01</fx:Exportacion>
<fx:LugarExpedicion>81430</fx:LugarExpedicion>
</fx:Identificacion>
<fx:Emisor>
<fx:RegimenFiscal>
<fx:Regimen>612</fx:Regimen>
</fx:RegimenFiscal>
</fx:Emisor>
<fx:Receptor>
<fx:CdgPaisReceptor>MX</fx:CdgPaisReceptor>
<fx:RFCReceptor>PSR920309CS2</fx:RFCReceptor>
<fx:NombreReceptor>PAPAS SELECTAS RIO FUERTE</fx:NombreReceptor>
<fx:DomicilioFiscalReceptor>66482</fx:DomicilioFiscalReceptor>
<fx:RegimenFiscalReceptor>601</fx:RegimenFiscalReceptor>
<fx:UsoCFDI>G03</fx:UsoCFDI>
</fx:Receptor>
<fx:Conceptos>
<fx:Concepto>
<fx:Cantidad>34.590000</fx:Cantidad>
<fx:ClaveUnidad>E48</fx:ClaveUnidad>
<fx:UnidadDeMedida>SERV</fx:UnidadDeMedida>
<fx:ClaveProdServ>78101800</fx:ClaveProdServ>
<fx:Codigo>Flete Yeiko</fx:Codigo>
<fx:Descripcion>"Servicio de flete"</fx:Descripcion>
<fx:ValorUnitario>2100.00</fx:ValorUnitario>
<fx:Importe>72639.00</fx:Importe>
<fx:Descuento>0.00</fx:Descuento>
<fx:ObjetoImp>02</fx:ObjetoImp>
<fx:ImpuestosSAT>
<fx:Traslados>
<fx:Traslado Base="72639.00" Importe="11622.24" Impuesto="002" TasaOCuota="0.160000" TipoFactor="Tasa"/>
</fx:Traslados>
<fx:Retenciones>
<fx:Retencion Base="72639.00" Importe="2905.56" Impuesto="002" TasaOCuota="0.040000" TipoFactor="Tasa"/>
</fx:Retenciones>
</fx:ImpuestosSAT>
<fx:Opciones> </fx:Opciones>
</fx:Concepto>
</fx:Conceptos>
<fx:ImpuestosSAT TotalImpuestosRetenidos="2905.56" TotalImpuestosTrasladados="11622.24">
<fx:Retenciones>
<fx:Retencion Importe="2905.56" Impuesto="002"/>
</fx:Retenciones>
<fx:Traslados>
<fx:Traslado Base="72639.00" Importe="11622.24" Impuesto="002" TasaOCuota="0.160000" TipoFactor="Tasa"/>
</fx:Traslados>
</fx:ImpuestosSAT>
<fx:Totales>
<fx:Moneda>MXN</fx:Moneda>
<fx:TipoDeCambioVenta>1</fx:TipoDeCambioVenta>
<fx:SubTotalBruto>72639.00</fx:SubTotalBruto>
<fx:SubTotal>72639.00</fx:SubTotal>
<fx:Descuento>0.00</fx:Descuento>
<fx:Total>81355.68</fx:Total>
<fx:TotalEnLetra>-</fx:TotalEnLetra>
<fx:FormaDePago>99</fx:FormaDePago>
</fx:Totales>
<fx:Complementos>
<fx:CartaPorte31 Version="3.1" IdCCP="CCCb63da-f1d4-4831-858e-22a2461a5d1c" TranspInternac="No" TotalDistRec="1300.00">
<fx:Ubicaciones>
<fx:Ubicacion TipoUbicacion="Origen" IDUbicacion="OR000503" RFCRemitenteDestinatario="GAG140605LX6" NombreRemitenteDestinatario="GONFER AGRICOLA" FechaHoraSalidaLlegada="2026-03-07T13:00:00">
<fx:Domicilio Calle="LOPEZ MATEOS" NumeroExterior="2472" Colonia="0680" Municipio="001" Estado="SIN" Pais="MEX" CodigoPostal="81210"/>
</fx:Ubicacion>
<fx:Ubicacion TipoUbicacion="Destino" IDUbicacion="DE000500" RFCRemitenteDestinatario="PSR920309CS2" NombreRemitenteDestinatario="PAPAS SELECTAS RIO FUERTE" FechaHoraSalidaLlegada="2026-03-09T13:00:00" DistanciaRecorrida="1300.00">
<fx:Domicilio Calle="AV LOS ANGELES" NumeroExterior="1000" NumeroInterior="BOD 178" Colonia="1303" Municipio="046" Estado="NLE" Pais="MEX" CodigoPostal="66482"/>
</fx:Ubicacion>
</fx:Ubicaciones>
<fx:Mercancias PesoBrutoTotal="34.590" UnidadPeso="KGM" PesoNetoTotal="34.590" NumTotalMercancias="1">
<fx:Mercancia BienesTransp="50405700" Descripcion="Papas" Cantidad="34.590000" ClaveUnidad="KGM" Unidad="Kg" PesoEnKg="34.590">
<!--  -->
<fx:CantidadTransporta Cantidad="34.590000" IDOrigen="OR000503" IDDestino="DE000500"/>
</fx:Mercancia>
<fx:Autotransporte PermSCT="TPAF01" NumPermisoSCT="2547NIVY24052012021001012">
<fx:IdentificacionVehicular ConfigVehicular="T3S3" PlacaVM="815EY4" AnioModeloVM="2014" PesoBrutoVehicular="54"/>
<fx:Seguros AseguraRespCivil="HDI SEGUROS" PolizaRespCivil="571872211" AseguraCarga="HDI SEGUROS" PolizaCarga="571787621" PrimaSeguro="100000.000000"/>
<fx:Remolques>
<fx:Remolque SubTipoRem="CTR018" Placa="139XA5"/>
<fx:Remolque SubTipoRem="CTR018" Placa="51TX3R"/>
</fx:Remolques>
</fx:Autotransporte>
</fx:Mercancias>
<fx:FiguraTransporte>
<fx:TiposFigura TipoFigura="01" RFCFigura="CASA861008F54" NumLicencia="SIN0106502" NombreFigura="ASAEL ALEXI CASTRO SANCHEZ">
<fx:Domicilio Calle="SAN NICOLAS" NumeroExterior="916" Municipio="015" Estado="SIN" Pais="MEX" CodigoPostal="81475"/>
</fx:TiposFigura>
<fx:TiposFigura TipoFigura="02" RFCFigura="NIVY7912153B3" NombreFigura="YEIKO ELIZABETH NISHIMOTO VELARDE">
<fx:PartesTransporte ParteTransporte="PT03"/>
<fx:Domicilio Calle="SIVERIO TRUEBA" NumeroExterior="355" Colonia="0824" Localidad="06" Municipio="015" Estado="SIN" Pais="MEX" CodigoPostal="81430"/>
</fx:TiposFigura>
<fx:TiposFigura TipoFigura="02" RFCFigura="NIVY7912153B3" NombreFigura="YEIKO ELIZABETH NISHIMOTO VELARDE">
<fx:PartesTransporte ParteTransporte="PT04"/>
<fx:Domicilio Calle="SIVERIO TRUEBA" NumeroExterior="355" Colonia="0824" Localidad="06" Municipio="015" Estado="SIN" Pais="MEX" CodigoPostal="81430"/>
</fx:TiposFigura>
</fx:FiguraTransporte>
</fx:CartaPorte31>
</fx:Complementos>
<fx:ComprobanteEx>
<fx:TerminosDePago>
<fx:MetodoDePago>PPD</fx:MetodoDePago>
<fx:CondicionesDePago>30 Días</fx:CondicionesDePago>
</fx:TerminosDePago>
</fx:ComprobanteEx>
</fx:FactDocMX>
```

### XML de Cliente Relacionado al ItemFullFillment:

```xml

```

### XMl de Subsidiaria relacionado al ItemFullFillment:

```xml

```