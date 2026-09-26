# Instrucciones del proyecto para Claude Code

Este archivo viaja con el repositorio (a diferencia de la memoria persistente de Claude Code, que
vive fuera del proyecto y queda ligada a la ruta absoluta de cada máquina). Si trabajas este
proyecto desde una PC distinta, este archivo es la fuente de continuidad — la memoria local no.

## Referencias de diseño de software (obligatorio)

Toda sugerencia de código, plan de implementación o decisión de arquitectura en este proyecto debe
considerar, en la medida razonable, las enseñanzas de:

- **"The Protection of Information in Computer Systems"** (Jerome H. Saltzer y Michael D. Schroeder)
  — privilegio mínimo, fail-safe defaults, economía de mecanismo, separación de privilegio.
- **"Clean Architecture"** y **"Clean Code"** (Robert C. Martin) — separación de responsabilidades,
  capas de dominio independientes de detalles de infraestructura.
- **"Ports and Adapters" / Arquitectura Hexagonal** (Alistair Cockburn) — los adaptadores (UI,
  plantillas, I/O) no deben contener lógica de negocio; esta vive en el núcleo/dominio.
- **"Design Patterns: Elements of Reusable Object-Oriented Software"** (Gamma, Helm, Johnson,
  Vlissides — GoF).

Estas NO son reglas inmutables: no compliques el código en exceso solo por seguirlas al pie de la
letra. Pero la separación por capas específicamente debe respetarse en la mayor medida posible, sin
llegar a la obsesión de aplicarla por aplicarla.

**Cómo aplicarlo en este proyecto:** antes de decidir dónde vive una pieza de lógica, pregunta
primero "¿esto es una regla de negocio o es simplemente transformar/mostrar datos ya decididos?".

- Reglas de negocio, filtros, validaciones fiscales y cálculos van en los User Events / Map-Reduce
  y en los módulos `lib/*.js` (capa de dominio/aplicación).
- Las plantillas FreeMarker (`.ftl`) son adaptadores puros de salida: solo transportan datos que la
  capa de dominio ya decidió. Nunca deben filtrar, calcular ni decidir nada por sí mismas.
- Ejemplo concreto ya corregido en este proyecto: `facturama_customerpayment_template.ftl`
  originalmente reconstruía el arreglo `RelatedDocuments` con lógica propia (filtro PPD/PUE,
  `TaxObject` fijo); se corrigió para que solo inserte el JSON ya armado por
  `fama_payment_complement_ue.js` vía `custbody_sads_fama_cpago_payload`.

## Manejo de errores: Fail-Safe vs. Fail-Fast

Este proyecto distingue deliberadamente entre dos posturas ante un error, según el riesgo real:

- **Fail-Fast** (lanzar excepción, registrar en `sads_fama_logger`, no persistir/no timbrar) cuando
  el dato incompleto o incorrecto se enviaría al PAC sin que nadie lo note (ej. `RelatedDocuments`
  con campos vacíos o `NaN`, un `Uuid` no encontrado). Se prefiere no timbrar a timbrar mal.
- **Fail-Safe** (registrar y continuar) cuando el fallo es de un proceso secundario que no debe
  bloquear la operación principal en NetSuite (ej. un error de cálculo del Complemento de Pago no
  debe impedir que el Customer Payment se guarde).

## Verificación antes de dar por bueno un cambio

- Los scripts de este proyecto son SuiteScript (no ejecutables directamente fuera de NetSuite).
  Usa `node --check <archivo>` para validar sintaxis antes de dar un cambio por terminado.
- `suitecloud project:validate` (local y `--server` contra la cuenta) para objetos SDF antes de
  desplegar.
- **Plantillas FreeMarker (`.ftl`)**: antes de pegar cualquier cambio en NetSuite, valídalo con el
  harness local en `tools/freemarker-harness/` (`README.md` ahí tiene el uso completo). Reconstruye
  un modelo de datos JSON a partir de los XML reales de la transacción y sus registros
  relacionados, y corre `java -jar target/freemarker-harness.jar <plantilla> <modelo>`. Esto
  atrapa errores de sintaxis FreeMarker y JSON inválido con mensajes precisos, algo que el editor
  de plantillas de NetSuite no ofrece (solo dice "no es un archivo JSON/XML con formato correcto",
  sin detalle).
- No asumas que un fix funciona sin confirmación del usuario en sandbox — varias veces en este
  proyecto una hipótesis razonable resultó no ser la causa real del error. El harness local reduce
  cuántas rondas de "prueba en sandbox y repórtame el error" hacen falta, pero no las elimina: el
  motor real de NetSuite puede resolver algunos campos de forma distinta a un modelo reconstruido
  a mano.
