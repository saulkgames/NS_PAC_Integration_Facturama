<#-- ============================================================================
     SONDA DIRIGIDA — NO ES UNA PLANTILLA DE PRODUCCIÓN.
     A diferencia de diagnostico_dump_contexto.ftl (que ENUMERA claves con ?keys),
     esta plantilla accede por NOMBRE a cada campo que facturama_creditmemo_template.ftl
     y facturama_edocs_template.ftl asumen que existe. Sirve para el caso en que
     "custom?keys" no enumera (hash no-enumerable) pero los campos individuales SÍ
     responden a acceso directo — que es como las plantillas reales los usan siempre,
     nunca por enumeración.

     USO: igual que diagnostico_dump_contexto.ftl — pegar temporalmente en el slot de
     plantilla E-Document de Nota de Crédito, generar contra la transacción real, copiar
     el resultado completo, restaurar la plantilla real después.
     ============================================================================ -->
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
"_diagnostico": "Sonda dirigida por nombre (no por enumeracion). Ver tools/freemarker-harness/README.md",

"custom.multiCurrencyFeature": <#attempt><@dump custom.multiCurrencyFeature!"" /><#recover>"[ERROR]"</#attempt>,
"custom.oneWorldFeature": <#attempt><@dump custom.oneWorldFeature!"" /><#recover>"[ERROR]"</#attempt>,
"custom.loggedUserName": <#attempt><@dump custom.loggedUserName!"" /><#recover>"[ERROR]"</#attempt>,
"custom.companyInfo": <#attempt><@dump custom.companyInfo!"" /><#recover>"[ERROR]"</#attempt>,
"custom.companyInfo.rfc": <#attempt><@dump custom.companyInfo.rfc!"" /><#recover>"[ERROR]"</#attempt>,
"custom.billaddr": <#attempt><@dump custom.billaddr!"" /><#recover>"[ERROR]"</#attempt>,

"custom.satcodes": <#attempt><@dump custom.satcodes!"" /><#recover>"[ERROR]"</#attempt>,
"custom.satcodes.paymentMethod": <#attempt><@dump custom.satcodes.paymentMethod!"" /><#recover>"[ERROR]"</#attempt>,
"custom.satcodes.paymentTerm": <#attempt><@dump custom.satcodes.paymentTerm!"" /><#recover>"[ERROR]"</#attempt>,
"custom.satcodes.proofType": <#attempt><@dump custom.satcodes.proofType!"" /><#recover>"[ERROR]"</#attempt>,
"custom.satcodes.industryType": <#attempt><@dump custom.satcodes.industryType!"" /><#recover>"[ERROR]"</#attempt>,
"custom.satcodes.customerIndustryType": <#attempt><@dump custom.satcodes.customerIndustryType!"" /><#recover>"[ERROR]"</#attempt>,
"custom.satcodes.cfdiUsage": <#attempt><@dump custom.satcodes.cfdiUsage!"" /><#recover>"[ERROR]"</#attempt>,
"custom.satcodes.exportType": <#attempt><@dump custom.satcodes.exportType!"" /><#recover>"[ERROR]"</#attempt>,
"custom.satcodes.items": <#attempt><@dump custom.satcodes.items!"" /><#recover>"[ERROR]"</#attempt>,

"custom.relatedCfdis": <#attempt><@dump custom.relatedCfdis!"" /><#recover>"[ERROR]"</#attempt>,
"custom.relatedCfdis.types": <#attempt><@dump custom.relatedCfdis.types!"" /><#recover>"[ERROR]"</#attempt>,
"custom.relatedCfdis.cfdis.k0": <#attempt><@dump custom.relatedCfdis.cfdis["k0"]!"" /><#recover>"[ERROR]"</#attempt>,

"custom.items": <#attempt><@dump custom.items!"" /><#recover>"[ERROR]"</#attempt>,

"custom.summary": <#attempt><@dump custom.summary!"" /><#recover>"[ERROR]"</#attempt>,

"transaction.tranid": <#attempt><@dump transaction.tranid!"" /><#recover>"[ERROR]"</#attempt>,
"transaction.transactionnumber": <#attempt><@dump transaction.transactionnumber!"" /><#recover>"[ERROR]"</#attempt>,
"transaction.trandate": <#attempt><@dump transaction.trandate!"" /><#recover>"[ERROR]"</#attempt>,
"transaction.currencysymbol": <#attempt><@dump transaction.currencysymbol!"" /><#recover>"[ERROR]"</#attempt>,
"transaction.exchangerate": <#attempt><@dump transaction.exchangerate!"" /><#recover>"[ERROR]"</#attempt>,
"transaction.custbody_mx_cfdi_serie": <#attempt><@dump transaction.custbody_mx_cfdi_serie!"" /><#recover>"[ERROR]"</#attempt>,
"transaction.terms": <#attempt><@dump transaction.terms!"" /><#recover>"[ERROR]"</#attempt>,
"transaction.subsidiary.zip": <#attempt><@dump transaction.subsidiary.zip!"" /><#recover>"[ERROR]"</#attempt>,
"transaction.subsidiary.custrecord_mx_sat_registered_name": <#attempt><@dump transaction.subsidiary.custrecord_mx_sat_registered_name!"" /><#recover>"[ERROR]"</#attempt>,
"transaction.recmachcustrecord_mx_rcs_orig_trans": <#attempt><@dump transaction.recmachcustrecord_mx_rcs_orig_trans!"" /><#recover>"[ERROR]"</#attempt>,
"transaction.item": <#attempt><@dump transaction.item!"" /><#recover>"[ERROR]"</#attempt>,

"customer.custentity_mx_rfc": <#attempt><@dump customer.custentity_mx_rfc!"" /><#recover>"[ERROR]"</#attempt>,
"customer.custentity_mx_sat_registered_name": <#attempt><@dump customer.custentity_mx_sat_registered_name!"" /><#recover>"[ERROR]"</#attempt>,
"customer.custentity_mx_sat_industry_type": <#attempt><@dump customer.custentity_mx_sat_industry_type!"" /><#recover>"[ERROR]"</#attempt>

}
