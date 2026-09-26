# FreeMarker Harness (local)

Herramienta de desarrollo local para renderizar y validar plantillas FreeMarker (`.ftl`) de
Electronic Invoicing/Facturama **antes** de pegarlas en NetSuite. No es parte del proyecto SDF
(`pac_facturama_integration`) ni se despliega — solo vive en el repositorio para que viaje con git
entre máquinas de trabajo.

FreeMarker es una librería Java de código abierto (Apache License 2.0) — no un ejecutable
independiente. Este harness la invoca directamente: carga una plantilla, la renderiza contra un
modelo de datos reconstruido a mano en JSON, imprime el resultado, y (por defecto) valida que ese
resultado sea JSON sintácticamente correcto, con mensaje de error y posición exacta si no lo es —
justo lo que el editor de plantillas de NetSuite no ofrece.

**Límite importante:** esto valida sintaxis FreeMarker y validez JSON del resultado. No sustituye
una prueba real en sandbox — el motor de NetSuite puede exponer tipos de dato o comportamientos
(ej. cómo resuelve exactamente un campo LIST/RECORD) que un modelo reconstruido a mano no capture
perfectamente. El objetivo es atrapar errores obvios (comas faltantes, campos mal anidados, `?number`
sobre un valor no numérico, etc.) mucho antes y con mensajes mucho más claros, no eliminar la
prueba final en sandbox.

## Requisitos

- Java 17+ y Maven (ya confirmados disponibles en este equipo).
- Acceso a internet la primera vez que se compila (Maven descarga FreeMarker y org.json de Maven Central).

## Compilar

```bash
cd tools/freemarker-harness
mvn -q package
```

Genera `target/freemarker-harness.jar` (con todas las dependencias empaquetadas).

## Usar

```bash
java -jar target/freemarker-harness.jar <plantilla.ftl> <modelo.json> [--no-validate-json]
```

Ejemplo real (Complemento de Pago, pago 2052106):

```bash
java -jar target/freemarker-harness.jar \
  "../../Tests/Pruebas de E Docs NS CLI API/Plantillas/facturama_customerpayment_template.ftl" \
  "models/customerpayment_2052106.json"
```

## El modelo de datos (`<modelo.json>`)

Es un JSON con las variables de nivel superior que la plantilla espera del hook nativo de
NetSuite — típicamente `transaction`, `customer`, `custom`, `companyinformation` (los mismos
nombres que ves en las plantillas `.ftl`). Se reconstruye a mano a partir de:

- El XML del registro de la transacción (`...&xml=t`).
- Los XML de los registros relacionados (factura, cliente, subsidiaria).
- Para `custom` (el objeto que arma el hook nativo) y para `transaction`/`customer`/
  `companyinformation`: usar `diagnostico_sonda_creditmemo_v2.ftl` (ver más abajo) como PLANTILLA
  para armar una sonda equivalente sobre el tipo de transacción que se esté reconstruyendo — NO
  usar `diagnostico_dump_contexto.ftl` (ver limitación conocida justo abajo). Como respaldo/cruce,
  sigue valiendo comparar contra los campos que referencia la plantilla MySuite equivalente (si
  existe y funciona) contra el inventario completo de campos del XML del registro real — pero
  eso cruza una integración DISTINTA (MySuite tiene su propio objeto `custom`), no es prueba
  directa de lo que arma el hook de Facturama.

## `?is_hash`/`?is_string`/`?keys` NO son confiables contra NetSuite real — usar la sonda por nombre

`diagnostico_dump_contexto.ftl` (primera versión de esta herramienta) enumera claves con `?keys` y
clasifica cada valor con `?is_hash`/`?is_string`/`?is_number`/etc. antes de imprimirlo. Funciona
correctamente contra el `DefaultObjectWrapper` de este harness (se validó con un modelo sintético),
pero **al correrla contra una transacción real en NetSuite (Nota de Crédito, 2026-09-25) devolvió
el mismo resultado ("hash sin claves enumerables o vacío") para TODO — incluida una fecha real y
varios strings simples**. Eso es imposible si esos valores fueran de verdad strings/fechas, así
que la conclusión correcta es que el object-wrapper real de NetSuite (para `transaction`,
`customer` y `custom`) no implementa esos builtins de introspección de forma compatible con
FreeMarker estándar — es un defecto de esta herramienta, no un hallazgo sobre los datos.

Ninguna plantilla que funciona hoy en este proyecto (`facturama_edocs_template.ftl`,
`facturama_customerpayment_template.ftl`) usa `?is_hash`/`?is_string`/`?keys` — todas acceden por
nombre directo (`${custom.satcodes.paymentMethod}`, `?has_content`, `?number`, `[idx]`). Por eso
la sonda correcta es `diagnostico_sonda_creditmemo_v2.ftl`: sin ningún builtin de introspección,
solo interpolación directa `${ruta.especifica!"(vacío o inexistente)"}` envuelta en
`<#attempt>/<#recover>` línea por línea (para que un campo inexistente no tumbe el resto). Es una
lista de rutas CONOCIDAS/ESPERADAS (las que ya usan las plantillas probadas), no una enumeración —
hay que copiar el archivo y ajustar la lista de rutas al tipo de transacción que se esté probando.

Uso (igual para `diagnostico_sonda_creditmemo_v2.ftl` que para la v1, ya desaconsejada):
1. Pegar su contenido TEMPORALMENTE en el slot de plantilla del E-Document Standard del tipo de
   transacción que se está reconstruyendo.
2. Generar el documento electrónico contra una transacción real de ese tipo.
3. Copiar el "Documento generado" completo.
4. Restaurar el contenido real de la plantilla.

Para representar una fecha real de FreeMarker (no un string plano — necesario para que
`?string.iso` / `?string("yyyy-MM-dd")` funcionen), usar la convención:

```json
{ "__date__": "yyyy-MM-dd" }
```
o
```json
{ "__date__": "yyyy-MM-dd HH:mm:ss" }
```

## Límite fundamental: un modelo autoconsistente no prueba que corresponda a la realidad

Encontrado construyendo Carta Porte (2026-09-25). La plantilla leía dos campos (`PesoEnKg`,
`MaterialPeligroso`) desde una propiedad inventada en `custom.items[]` que MySuite — la única
fuente probada de qué expone realmente el hook — nunca usa; MySuite lee esos dos campos directo de
`item.custcol_drt_cp_*` (el sublist nativo). El harness no atrapó el error porque el modelo de
prueba se construyó con el mismo nombre inventado en ambos lados (plantilla y modelo), así que
"pasaba" la validación local sin decir nada sobre si ese nombre existe de verdad en NetSuite.

Esto es distinto a los demás límites documentados aquí (que son sobre CÓMO se comporta FreeMarker):
este es sobre QUÉ objeto expone cada campo. La única defensa es disciplina al reconstruir el
modelo, no una corrección de la herramienta: para cada campo nuevo, hay que confirmar explícitamente
en la plantilla MySuite de referencia (o en otra plantilla ya probada de este proyecto) si ese campo
se lee de `custom.items[]`/`custom.*` (construido por el hook) o de `transaction.item[]`/`custcol_*`
(sublist nativo) — nunca asumir por conveniencia solo porque el patrón "encaja" con otros campos que
sí vienen de `custom.items[]`.

## Limitación conocida: los números en el modelo deben ir como *string*

Encontrado construyendo la plantilla de Nota de Crédito (2026-09-25). El `?number` de FreeMarker
revienta con `Can't convert this string to number: "1,137.85"` cuando el valor de origen en el
modelo JSON ya es un número (ej. `"amount": 1137.85`) — **solo funciona sobre un valor que llega
como string** (ej. `"amount": "1137.85"`). Esto no es un capricho del harness: así es como NetSuite
expone en la práctica los campos de sublista y los campos calculados por el hook nativo (`amount`,
`rate`, `quantity`, `taxAmount`, `taxBaseAmount`, `taxRate`, y cualquier índice `.line`/`.index`
usado para indexar un arreglo) — por eso la plantilla ya probada en producción (`facturama_edocs_
template.ftl`) aplica `?number` a todos esos campos sin problema contra NetSuite real.

**Regla práctica al reconstruir un modelo:** todo campo que la plantilla vaya a pasar por `?number`
o `?string(patrón)` debe escribirse entre comillas en el JSON del modelo, aunque sea numérico. Los
campos de cabecera que la plantilla compara con `==` en vez de convertir (ej. `transaction.
exchangerate == 1`) sí deben quedar como número real — mezclar los dos casos en el mismo campo no
aplica aquí porque cada campo solo se usa de una forma en la plantilla.

Relacionado: interpolar un número sin `?c` (ej. `${subTotal}` en vez de `${subTotal?c}`) usa el
formato de número del locale activo — con `<#setting locale = "en_US">` eso agrega separador de
miles (`1,319.91`), lo cual no es un número JSON válido. Usar siempre `?c` (o un `?string` con
patrón explícito) al interpolar un número dentro de un JSON de salida.

## `transaction.item[N]` / `satCodes.items[N]` se indexan por el campo `line`, no por posición

Encontrado construyendo la plantilla de Carta Porte / Traslado (2026-09-25). El campo `line` de una
línea de sublista en NetSuite NO es siempre 0,1,2,3... — cuando hay líneas de kit de por medio,
salta de 5 en 5 (0,5,10,15...) para dejar hueco a los componentes. Todas las plantillas de este
proyecto indexan `transaction.item[customItem.line?number]` y `satCodes.items[customItem.line?
number]` usando ESE número de línea, no la posición secuencial dentro del arreglo.

Si el modelo del harness se arma como un arreglo JSON secuencial normal (`[item0, item1, item2,
...]`), esos índices apuntan a la línea equivocada en cuanto el `line` real no es consecutivo. Para
que la indexación del harness coincida con el comportamiento real, el arreglo del modelo debe ser
disperso: tantas posiciones como el `line` más alto más 1, con `null` en los huecos y el objeto real
solo en la posición que coincide con su propio valor de `line` (ver `models/traslado_1520482.json`
para un ejemplo con 61 posiciones y solo 13 pobladas).

## `(expr)!"" ?has_content` con espacio no hace lo que parece

Encontrado en la misma plantilla de Traslado. `<#if (ubicacion.campo)!"" ?has_content>` — con un
espacio antes de `?has_content` — NO aplica el builtin sobre `(ubicacion.campo)!""` como parece a
simple vista. FreeMarker lo parsea como `(ubicacion.campo) ! ("" ?has_content)`, es decir,
`?has_content` se pega al literal `""` del lado derecho del operador de valor por defecto (`!`), no
a la expresión completa. Si `ubicacion.campo` sí tiene valor, el `<#if>` termina evaluando ese
STRING directamente (no el booleano esperado), y revienta con "Expected a boolean, but this has
evaluated to a string".

Corrección: envolver toda la expresión con el `!` en un paréntesis adicional antes de encadenar el
builtin: `((ubicacion.campo)!"")?has_content`. Sin espacio entre `!""` y `?has_content` también
evita el problema, pero el paréntesis extra es más legible y más difícil de repetir por error.

## Flujo de trabajo para una plantilla nueva (ej. Notas de Crédito)

1. El usuario aporta: el ejemplo de JSON esperado por Facturama para ese tipo de documento, la
   plantilla MySuite equivalente que se va a reemplazar (si existe y funciona), y los XML de la
   transacción y sus registros relacionados.
2. Se reconstruye el objeto de datos (`custom`, `transaction`, `customer`, etc.) que el hook nativo
   del PlugIn de origen de datos (`MX PI Generate XML for PAC Certification`) armaría para ese tipo
   de transacción, como un archivo `models/<nombre>.json`.
3. Se diseña la plantilla `.ftl` (adaptador puro — sin lógica de negocio, ver `CLAUDE.md`).
4. Se valida localmente con este harness, iterando hasta que renderice y el JSON sea válido.
5. Solo entonces se copia a NetSuite para la prueba real contra un registro de sandbox.

## Archivos de este directorio

```
pom.xml                                          Definición Maven (FreeMarker 2.3.34, org.json)
src/main/java/mx/almetal/fama/harness/
  FreemarkerHarness.java                         Punto de entrada
models/                                          Modelos de datos JSON reconstruidos, por transacción de prueba
diagnostico_dump_contexto.ftl                    Enumeración por ?keys — NO usar (ver limitación arriba)
diagnostico_sonda_creditmemo.ftl                 Primer intento de sonda dirigida — todavía usaba ?is_hash, NO usar
diagnostico_sonda_creditmemo_v2.ftl              Sonda dirigida — línea de trabajo abandonada (2026-09-25, decisión
                                                  del usuario): reconstruir el modelo cruzando la plantilla MySuite
                                                  equivalente contra el XML real fue suficiente en la práctica: no
                                                  hace falta volcar el objeto del hook para las plantillas siguientes.
```
