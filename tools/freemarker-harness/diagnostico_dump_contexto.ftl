<#-- ============================================================================
     PLANTILLA DE DIAGNÓSTICO — NO ES UNA PLANTILLA DE PRODUCCIÓN.
     Vuelca recursivamente el objeto "custom" (el que arma el hook nativo de Electronic
     Invoicing para el tipo de transacción actual) como JSON, para reconstruir con datos
     reales el modelo que usa tools/freemarker-harness, en vez de inferirlo leyendo código
     fuente de una copia de referencia potencialmente desactualizada.

     USO:
     1. Pega este contenido TEMPORALMENTE en el slot de plantilla del E-Document Standard
        del tipo de transacción que se está reconstruyendo (ej. el registro
        customrecord_psg_ei_template de la plantilla FAMA de Nota de Crédito).
     2. Genera el documento electrónico contra una transacción real de ese tipo.
     3. Copia el "Documento generado" completo — es el volcado de custom en JSON.
     4. Restaura el contenido real de la plantilla antes de continuar con otra prueba.

     LIMITACIÓN CONOCIDA: "transaction"/"customer"/"companyinformation" (los objetos nativos
     del registro, a diferencia de "custom") normalmente NO son enumerables en FreeMarker —
     este dump no los va a listar solo. Para esos, seguir cruzando los campos que referencia
     la plantilla MySuite equivalente contra el XML completo del registro.
     ============================================================================ -->
<#-- NOTA TÉCNICA: FreeMarker no permite pasar un valor null/missing como argumento de macro
     (revienta ANTES de entrar al macro, no se puede atrapar adentro). Por eso todo call site
     usa "!" con un valor de respaldo — como efecto secundario, un null real y un "" real se
     ven igual en este dump ("null" en el JSON de salida). Aceptable para un diagnóstico de
     estructura; no es relevante para reconstruir el modelo del harness. -->
<#macro dump v depth=0>
<#if depth gte 8>
"...profundidad máxima alcanzada..."
<#elseif v?is_hash_ex || v?is_hash>
<#local keys = []>
<#attempt>
<#local keys = v?keys>
<#recover>
<#local keys = []>
</#attempt>
<#if keys?size == 0>
"[hash sin claves enumerables o vacío]"
<#else>
{
<#list keys as k>
"${k?json_string}": <@dump (v[k])!"" depth+1/><#if k?has_next>,</#if>
</#list>
}
</#if>
<#elseif v?is_sequence>
[
<#list v as item>
<@dump item!"" depth+1/><#if item?has_next>,</#if>
</#list>
]
<#elseif v?is_date>
"${v?string.iso}"
<#elseif v?is_boolean>
${v?c}
<#elseif v?is_number>
${v?c}
<#elseif v?is_string>
<#if v == "">
null
<#else>
"${v?json_string}"
</#if>
<#else>
"[tipo no serializable]"
</#if>
</#macro>
{
"_diagnostico": "Volcado de custom para reconstruir el modelo del harness local. Ver tools/freemarker-harness/README.md",
"custom": <@dump custom!"" />
}
