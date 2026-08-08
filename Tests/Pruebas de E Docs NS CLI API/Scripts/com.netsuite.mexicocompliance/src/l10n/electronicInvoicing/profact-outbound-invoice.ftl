<?xml version="1.0" encoding="utf-8"?>
<cfdi:Comprobante
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xmlns:cfdi="http://www.sat.gob.mx/cfd/3" xsi:schemaLocation="http://www.sat.gob.mx/cfd/3 http://www.sat.gob.mx/sitio_internet/cfd/3/cfdv33.xsd" 
    Fecha="2018-09-26T01:00:00" 
    Folio="${transaction.tranid}" 
    FormaPago="03" 
    LugarExpedicion="53100" MetodoPago="PUE" 
    Moneda="MXN" SubTotal="9900.00" TipoDeComprobante="I" Total="11484.00" Version="3.3">
    <cfdi:Emisor Nombre="Proveedores de FacturaciÃ³n ElectrÃ³nica y Software, S.A. de C.V." RegimenFiscal="601" Rfc="AAA010101AAA" />
    <cfdi:Receptor Nombre="ALMACENADORA INTER-AMERICANA S.A. DE C.V." Rfc="AAA010101AAA" UsoCFDI="P01" />
    <cfdi:Conceptos>
        <cfdi:Concepto Cantidad="18000" ClaveProdServ="84111506" ClaveUnidad="E48" Descripcion="Timbra CFDI paquete de timbres fiscales" Importe="9900.000000" ValorUnitario="0.550000">
            <cfdi:Impuestos>
                <cfdi:Traslados>
                    <cfdi:Traslado Base="9900.000000" Importe="1584.000000" Impuesto="002" TasaOCuota="0.160000" TipoFactor="Tasa" />
                </cfdi:Traslados>
            </cfdi:Impuestos>
        </cfdi:Concepto>
    </cfdi:Conceptos>
    <cfdi:Impuestos TotalImpuestosTrasladados="1584.00">
        <cfdi:Traslados>
            <cfdi:Traslado Importe="1584.00" Impuesto="002" TasaOCuota="0.160000" TipoFactor="Tasa" />
        </cfdi:Traslados>
    </cfdi:Impuestos>
</cfdi:Comprobante>
