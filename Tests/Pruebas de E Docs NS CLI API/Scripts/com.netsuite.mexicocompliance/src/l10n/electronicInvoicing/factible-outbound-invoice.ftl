<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/3" xmlns:pago10="http://www.sat.gob.mx/Pagos" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sat.gob.mx/cfd/3 http://www.sat.gob.mx/sitio_internet/cfd/3/cfdv33.xsd http://www.sat.gob.mx/Pagos http://www.sat.gob.mx/sitio_internet/cfd/Pagos/Pagos10.xsd" Version="3.3" Fecha="2018-09-20T04:00:00" Serie="NET" Folio="${transaction.tranid}" SubTotal="0" Moneda="XXX" Total="0" TipoDeComprobante="P" LugarExpedicion="85830" Certificado="" NoCertificado="" Sello="">
   <cfdi:Emisor Rfc="XEXX010101000" Nombre="UTC Fire &amp; Security America`s Corp." RegimenFiscal="621" />
   <cfdi:Receptor Rfc="XAXX010101000" Nombre="Matriz SA" UsoCFDI="P01" />
   <cfdi:Conceptos>
      <cfdi:Concepto Cantidad="1" Descripcion="Pago" ValorUnitario="0" Importe="0" ClaveProdServ="84111506" ClaveUnidad="ACT" />
   </cfdi:Conceptos>
   <cfdi:Complemento>
      <pago10:Pagos Version="1.0">
         <pago10:Pago FechaPago="2018-09-20T04:00:00" FormaDePagoP="03" MonedaP="USD" TipoCambioP="19.5781" Monto="3958.04" NumOperacion="0523" RfcEmisorCtaOrd="XEXX010101000" NomBancoOrdExt="Bank of America" RfcEmisorCtaBen="SIN9412025I4" CtaBeneficiario="044777114000005235">
            <pago10:DoctoRelacionado IdDocumento="E12F6B23-B899-4F25-A81B-5F6023C4A423" Serie="C" Folio="10946" MonedaDR="USD" MetodoDePagoDR="PPD" NumParcialidad="1" ImpSaldoAnt="3986.04" ImpPagado="3958.04" ImpSaldoInsoluto="28.00" />
         </pago10:Pago>
      </pago10:Pagos>
   </cfdi:Complemento>
</cfdi:Comprobante>