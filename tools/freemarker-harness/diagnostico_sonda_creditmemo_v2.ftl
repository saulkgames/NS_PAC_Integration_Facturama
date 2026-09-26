<#-- ============================================================================
     SONDA DIRIGIDA v2 — NO ES UNA PLANTILLA DE PRODUCCIÓN.
     La v1 (diagnostico_sonda_creditmemo.ftl) usaba ?is_hash/?keys para clasificar e
     imprimir cada valor. Contra un modelo JSON sintético (harness local) funciona,
     pero contra el binding real de NetSuite devolvió "[hash sin claves enumerables o
     vacío]" para TODOS los campos por igual — incluida una fecha y varios strings
     simples, lo cual es imposible si esos campos realmente fueran strings/fechas.
     Conclusión: el object-wrapper real de NetSuite no clasifica los valores igual que
     el DefaultObjectWrapper de FreeMarker contra el que se probó la v1 — ?is_hash/
     ?is_string/?keys no son confiables aquí. Ninguna plantilla que sí funciona hoy en
     este proyecto (facturama_edocs_template.ftl, facturama_customerpayment_template.ftl)
     usa esos builtins — solo interpolación directa (${...}), ?has_content, ?number,
     ?string(...). Esta v2 hace lo mismo: sin introspección de tipo, solo acceso directo
     con "!" como valor de respaldo, y <#attempt>/<#recover> por línea para que un campo
     que no existe o revienta no tumbe el resto.

     USO: igual que las anteriores — pegar temporalmente en el slot de plantilla de
     Nota de Crédito, generar contra la transacción real, copiar el resultado completo,
     restaurar la plantilla real después.
     ============================================================================ -->
{
"_diagnostico": "Sonda v2 - interpolacion directa, sin ?is_hash/?keys. Ver tools/freemarker-harness/README.md",

"custom.multiCurrencyFeature": "<#attempt>${custom.multiCurrencyFeature!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.oneWorldFeature": "<#attempt>${custom.oneWorldFeature!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.loggedUserName": "<#attempt>${custom.loggedUserName!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.companyInfo.rfc": "<#attempt>${custom.companyInfo.rfc!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.billaddr.customerdefaultzipcode": "<#attempt>${custom.billaddr.customerdefaultzipcode!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.billaddr.countrycode": "<#attempt>${custom.billaddr.countrycode!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",

"custom.satcodes.paymentMethod": "<#attempt>${custom.satcodes.paymentMethod!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.satcodes.paymentTerm": "<#attempt>${custom.satcodes.paymentTerm!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.satcodes.proofType": "<#attempt>${custom.satcodes.proofType!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.satcodes.industryType": "<#attempt>${custom.satcodes.industryType!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.satcodes.customerIndustryType": "<#attempt>${custom.satcodes.customerIndustryType!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.satcodes.cfdiUsage": "<#attempt>${custom.satcodes.cfdiUsage!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.satcodes.exportType": "<#attempt>${custom.satcodes.exportType!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",

"custom.relatedCfdis.types[0]": "<#attempt>${custom.relatedCfdis.types[0]!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.relatedCfdis.cfdis.k0[0].index": "<#attempt>${custom.relatedCfdis.cfdis["k0"][0].index!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",

"custom.items[0].line": "<#attempt>${custom.items[0].line!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.items[0].type": "<#attempt>${custom.items[0].type!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.items[0].satUnitCode": "<#attempt>${custom.items[0].satUnitCode!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.items[0].amount": "<#attempt>${custom.items[0].amount!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.items[0].rate": "<#attempt>${custom.items[0].rate!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.items[0].totalDiscount": "<#attempt>${custom.items[0].totalDiscount!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.items[0].taxes.taxItems[0].taxBaseAmount": "<#attempt>${custom.items[0].taxes.taxItems[0].taxBaseAmount!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.items[0].taxes.taxItems[0].taxAmount": "<#attempt>${custom.items[0].taxes.taxItems[0].taxAmount!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.items[0].taxes.taxItems[0].taxRate": "<#attempt>${custom.items[0].taxes.taxItems[0].taxRate!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.items[0].taxes.taxItems[0].satTaxCode": "<#attempt>${custom.items[0].taxes.taxItems[0].satTaxCode!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.items[0].taxes.taxItems[0].taxFactorType": "<#attempt>${custom.items[0].taxes.taxItems[0].taxFactorType!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.satcodes.items[0].itemCode": "<#attempt>${custom.satcodes.items[0].itemCode!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"custom.satcodes.items[0].taxObject": "<#attempt>${custom.satcodes.items[0].taxObject!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",

"custom.items.size (cuenta lineas)": "<#attempt>${custom.items?size?c}<#recover>[ERROR: ${.error}]</#attempt>",

"transaction.tranid": "<#attempt>${transaction.tranid!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.transactionnumber": "<#attempt>${transaction.transactionnumber!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.trandate (iso)": "<#attempt>${transaction.trandate?string.iso}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.currencysymbol": "<#attempt>${transaction.currencysymbol!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.exchangerate": "<#attempt>${transaction.exchangerate?c}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.custbody_mx_cfdi_serie": "<#attempt>${transaction.custbody_mx_cfdi_serie!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.terms": "<#attempt>${transaction.terms!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.subsidiary.zip": "<#attempt>${transaction.subsidiary.zip!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.subsidiary.custrecord_mx_sat_registered_name": "<#attempt>${transaction.subsidiary.custrecord_mx_sat_registered_name!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.subsidiary.custrecord_alm_subsidiaria_rfc": "<#attempt>${transaction.subsidiary.custrecord_alm_subsidiaria_rfc!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.recmachcustrecord_mx_rcs_orig_trans[0].custrecord_mx_rcs_uuid": "<#attempt>${transaction.recmachcustrecord_mx_rcs_orig_trans[0].custrecord_mx_rcs_uuid!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.item[0].item": "<#attempt>${transaction.item[0].item!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.item[0].quantity": "<#attempt>${transaction.item[0].quantity!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.item[0].units": "<#attempt>${transaction.item[0].units!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"transaction.item[0].custcol_pfp_codigoarticulo_": "<#attempt>${transaction.item[0].custcol_pfp_codigoarticulo_!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",

"customer.custentity_mx_rfc": "<#attempt>${customer.custentity_mx_rfc!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"customer.custentity_mx_sat_registered_name": "<#attempt>${customer.custentity_mx_sat_registered_name!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>",
"customer.custentity_mx_sat_industry_type": "<#attempt>${customer.custentity_mx_sat_industry_type!"(vacio o inexistente)"}<#recover>[ERROR: ${.error}]</#attempt>"
}
