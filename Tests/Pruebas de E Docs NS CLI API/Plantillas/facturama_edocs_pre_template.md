# Diccionario de Datos: Integración NetSuite -> Facturama API-Lite (CFDI 4.0 PUE)

**Propósito:** Documentación técnica para el mapeo del E-Document Template en FreeMarker.
**Contexto:** Transacción de Ingreso (Invoice/Cash Sale) con Método de Pago PUE.
**Fuentes:** Guía de Llenado Anexo 20 (SAT) v4.0 y API Facturama Lite v3.

> **Notas Arquitectónicas Importantes:**
> 1. **Cálculos Automáticos:** Facturama calcula dinámicamente los nodos globales (Total, SubTotal, Descuento Global e Impuestos Globales) sumando el arreglo de "Items". Por lo tanto, NO se envían en la petición a nivel cabecera para evitar rechazos por diferencias de centavos.
> 2. **Banderas vs Arreglos:** Facturama usa booleanos (`IsRetention`, `IsQuota`) en los impuestos de línea en lugar de separar los arreglos como lo exige el XML del SAT (Traslados vs Retenciones).

---

## 1. CABECERA (Root Level)

| Propiedad (Facturama) | Equivalente SAT | Requerido | Mapeo Sugerido / Regla |
| :--- | :--- | :---: | :--- |
| `NameId` | N/A | Sí | Fijo a `1` (Identificador del diseño PDF estándar en Facturama). |
| `CfdiType` | TipoDeComprobante | Sí | Fijo a `"I"` (Ingreso). |
| `Serie` | Serie | No | `transaction.custbody_mx_cfdi_serie`. |
| `Folio` | Folio | Sí | `transaction.tranid` (De 1 a 40 caracteres). |
| `Date` | Fecha | Sí | `transaction.trandate` (Formato ISO 8601: `AAAA-MM-DDThh:mm:ss`). |
| `PaymentForm` | FormaPago | Sí | Extraer clave de `transaction.custbody_mx_txn_sat_payment_method`. **Regla PUE:** Prohibido usar "99". |
| `PaymentMethod` | MetodoPago | Sí | Fijo a `"PUE"` para este caso de uso. |
| `Currency` | Moneda | Sí | Símbolo ISO 4217, ej. `transaction.currencysymbol`. |
| `CurrencyExchangeRate`| TipoCambio | Condicional | `transaction.exchangerate`. Requerido si moneda != MXN. |
| `ExpeditionPlace` | LugarExpedicion | Sí | Código postal de emisión. Ej. `transaction.location.zip`. |
| `Exportation` | Exportacion | Sí | Fijo a `"01"` (No aplica) para ventas nacionales CFDI 4.0. |

---

## 2. NODO: EMISOR (`Issuer`)

| Propiedad (Facturama) | Equivalente SAT | Requerido | Mapeo Sugerido / Regla |
| :--- | :--- | :---: | :--- |
| `FiscalRegime` | RegimenFiscal | Sí | `transaction.subsidiary.custrecord_mx_sat_industry_type` (Extraer solo la clave, ej. "601"). |
| `Rfc` | Rfc | Sí | `transaction.subsidiary.taxidnumber`. |
| `Name` | Nombre | Sí | `transaction.subsidiary.legalname?json_string`. (Obligatorio en CFDI 4.0). |

---

## 3. NODO: RECEPTOR (`Receiver`)

| Propiedad (Facturama) | Equivalente SAT | Requerido | Mapeo Sugerido / Regla |
| :--- | :--- | :---: | :--- |
| `Rfc` | Rfc | Sí | `transaction.customer.custentity_mx_rfc`. |
| `Name` | Nombre | Sí | `transaction.customer.companyname?json_string`. |
| `TaxZipCode` | DomicilioFiscalReceptor| Sí | `transaction.customer.billzip`. Obligatorio CFDI 4.0. |
| `FiscalRegime` | RegimenFiscalReceptor| Sí | `transaction.customer.custentity_mx_sat_industry_type` (Solo clave). Obligatorio CFDI 4.0. |
| `CfdiUse` | UsoCFDI | Sí | `transaction.custbody_mx_cfdi_usage` (Extraer solo la clave, ej. "G03"). |

---

## 4. NODO: CONCEPTOS (`Items` - Arreglo)

*Se debe iterar sobre las líneas de la transacción (ej. `<#list custom.items as item>`)*.

| Propiedad (Facturama) | Equivalente SAT | Requerido | Mapeo Sugerido / Regla |
| :--- | :--- | :---: | :--- |
| `ProductCode` | ClaveProdServ | Sí | `item.custcol_mx_txn_line_sat_item_code` (8 dígitos SAT). |
| `IdentificationNumber`| NoIdentificacion| No | SKU Interno. Ej. `item.itemid`. |
| `Description` | Descripcion | Sí | `item.description?json_string`. Escapar siempre las comillas. |
| `UnitCode` | ClaveUnidad | Sí | Clave SAT (ej. "H87"). |
| `Unit` | Unidad | No | Descripción de la unidad (ej. "Pieza"). |
| `Quantity` | Cantidad | Sí | `item.quantity`. Máximo 6 decimales. |
| `UnitPrice` | ValorUnitario | Sí | Precio unitario sin impuestos. Ej. `item.rate`. |
| `Subtotal` | Importe | Sí | `Quantity` * `UnitPrice`. |
| `Discount` | Descuento | No | Si aplica, debe ser <= `Subtotal`. Si no hay, omitir o enviar `0.0`. |
| `TaxObject` | ObjetoImp | Sí | Obligatorio CFDI 4.0. Usualmente fijo a `"02"` (Sí objeto de impuesto). |

---

## 5. NODO: IMPUESTOS DE LÍNEA (`Items.Taxes` - Arreglo)

*Sub-nodo obligatorio si `TaxObject` es "02"*.

| Propiedad (Facturama) | Equivalente SAT | Requerido | Mapeo Sugerido / Regla |
| :--- | :--- | :---: | :--- |
| `Name` | Impuesto | Sí | Facturama requiere texto descriptivo (ej. `"IVA"`, `"IEPS"`). El motor de Facturama lo traduce a la clave "002" del SAT. |
| `Base` | Base | Sí | Monto gravable (Usualmente `Subtotal` - `Discount`). |
| `Rate` | TasaOCuota | Sí | Tasa en decimal. Ej. `0.16`. |
| `Total` | Importe | Sí | Monto calculado del impuesto (`Base` * `Rate`). |
| `IsRetention` | TipoFactor / Ext | Sí | Booleano. `false` para IVA trasladado estándar. |
| `IsQuota` | TipoFactor / Ext | Sí | Booleano. `false` si es Tasa. `true` si es Cuota. |