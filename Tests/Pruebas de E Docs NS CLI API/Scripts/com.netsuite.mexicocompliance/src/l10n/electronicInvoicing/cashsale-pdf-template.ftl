<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>

<#if custom.certData?has_content>
 <#assign "certData" = custom.certData>
<#else>
 <#assign "certData" = record>
</#if>
<#assign "satCodes" = custom.satcodes>

<#if custom.multiCurrencyFeature == "true">
    <#assign "currencyCode" = record.currencysymbol>
    <#assign exchangeRate = record.exchangerate?string.number>
<#else>
  <#assign "currencyCode" = "MXN">
  <#assign exchangeRate = 1>
</#if>
<#if custom.oneWorldFeature == "true">
    <#assign customCompanyInfo = record.subsidiary>
<#else>
    <#assign "customCompanyInfo" = companyinformation>
</#if>
<#if customer.isperson == "T">
    <#assign customerName = customer.firstname + ' ' + customer.lastname>
<#else>
    <#assign "customerName" = customer.companyname>
</#if>
<#assign "summary" = custom.summary>
<#assign "totalAmount" = summary.subtotal - summary.totalDiscount>
<#assign "companyTaxRegNumber" = custom.companyInfo.rfc>
<#assign currencySymbolMap = {"USD":"$","CAD":"$","EUR":"€","AED":"د.إ.‏","AFN":"؋","ALL":"Lek","AMD":"դր.","ARS":"$","AUD":"$","AZN":"ман.","BAM":"KM","BDT":"৳","BGN":"лв.","BHD":"د.ب.‏","BIF":"FBu","BND":"$","BOB":"Bs","BRL":"R$","BWP":"P","BYR":"BYR","BZD":"$","CDF":"FrCD","CHF":"CHF","CLP":"$","CNY":"CN¥","COP":"$","CRC":"₡","CVE":"CV$","CZK":"Kč","DJF":"Fdj","DKK":"kr","DOP":"RD$","DZD":"د.ج.‏","EEK":"kr","EGP":"ج.م.‏","ERN":"Nfk","ETB":"Br","GBP":"£","GEL":"GEL","GHS":"GH₵","GNF":"FG","GTQ":"Q","HKD":"$","HNL":"L","HRK":"kn","HUF":"Ft","IDR":"Rp","ILS":"₪","INR":"টকা","IQD":"د.ع.‏","IRR":"﷼","ISK":"kr","JMD":"$","JOD":"د.أ.‏","JPY":"￥","KES":"Ksh","KHR":"៛","KMF":"FC","KRW":"₩","KWD":"د.ك.‏","KZT":"тңг.","LBP":"ل.ل.‏","LKR":"SL Re","LTL":"Lt","LVL":"Ls","LYD":"د.ل.‏","MAD":"د.م.‏","MDL":"MDL","MGA":"MGA","MKD":"MKD","MMK":"K","MOP":"MOP$","MUR":"MURs","MXN":"$","MYR":"RM","MZN":"MTn","NAD":"N$","NGN":"₦","NIO":"C$","NOK":"kr","NPR":"नेरू","NZD":"$","OMR":"ر.ع.‏","PAB":"B/.","PEN":"S/.","PHP":"₱","PKR":"₨","PLN":"zł","PYG":"₲","QAR":"ر.ق.‏","RON":"RON","RSD":"дин.","RUB":"руб.","RWF":"FR","SAR":"ر.س.‏","SDG":"SDG","SEK":"kr","SGD":"$","SOS":"Ssh","SYP":"ل.س.‏","THB":"฿","TND":"د.ت.‏","TOP":"T$","TRY":"TL","TTD":"$","TWD":"NT$","TZS":"TSh","UAH":"₴","UGX":"USh","UYU":"$","UZS":"UZS","VEF":"Bs.F.","VND":"₫","XAF":"FCFA","XOF":"CFA","YER":"ر.ي.‏","ZAR":"R","ZMK":"ZK"}> 
<#function fmtc value>
    <#assign dst =  currencySymbolMap[currencyCode] + value?number?string["0.00"]>
	<#return dst>
</#function>
<head>
	<link name="NotoSans" type="font" subtype="truetype" src="${nsfont.NotoSans_Regular}" src-bold="${nsfont.NotoSans_Bold}" src-italic="${nsfont.NotoSans_Italic}" src-bolditalic="${nsfont.NotoSans_BoldItalic}" bytes="2" />
	<#if .locale == "zh_CN">
		<link name="NotoSansCJKsc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKsc_Regular}" src-bold="${nsfont.NotoSansCJKsc_Bold}" bytes="2" />
	<#elseif .locale == "zh_TW">
		<link name="NotoSansCJKtc" type="font" subtype="opentype" src="${nsfont.NotoSansCJKtc_Regular}" src-bold="${nsfont.NotoSansCJKtc_Bold}" bytes="2" />
	<#elseif .locale == "ja_JP">
		<link name="NotoSansCJKjp" type="font" subtype="opentype" src="${nsfont.NotoSansCJKjp_Regular}" src-bold="${nsfont.NotoSansCJKjp_Bold}" bytes="2" />
	<#elseif .locale == "ko_KR">
		<link name="NotoSansCJKkr" type="font" subtype="opentype" src="${nsfont.NotoSansCJKkr_Regular}" src-bold="${nsfont.NotoSansCJKkr_Bold}" bytes="2" />
	<#elseif .locale == "th_TH">
		<link name="NotoSansThai" type="font" subtype="opentype" src="${nsfont.NotoSansThai_Regular}" src-bold="${nsfont.NotoSansThai_Bold}" bytes="2" />
	</#if>
    <style type="text/css">* {
		<#if .locale == "zh_CN">
			font-family: NotoSans, NotoSansCJKsc, sans-serif;
		<#elseif .locale == "zh_TW">
			font-family: NotoSans, NotoSansCJKtc, sans-serif;
		<#elseif .locale == "ja_JP">
			font-family: NotoSans, NotoSansCJKjp, sans-serif;
		<#elseif .locale == "ko_KR">
			font-family: NotoSans, NotoSansCJKkr, sans-serif;
		<#elseif .locale == "th_TH">
			font-family: NotoSans, NotoSansThai, sans-serif;
		<#else>
			font-family: NotoSans, sans-serif;
		</#if>
		}
		table {
			font-size: 9pt;
			table-layout: fixed;
		}
        th {
            font-weight: bold;
            font-size: 8pt;
            vertical-align: middle;
            padding: 5px 6px 3px;
            background-color: #e3e3e3;
            color: #333333;
        }
        td {
            padding: 4px 6px;
        }
		td p { align:left }
        b {
            font-weight: bold;
            color: #333333;
        }
        table.header td {
            padding: 0px;
            font-size: 10pt;
        }
        table.footer td {
            padding: 0px;
            font-size: 8pt;
        }
        table.itemtable th {
            padding-bottom: 10px;
            padding-top: 10px;
        }
        table.body td {
            padding-top: 2px;
        }
        table.total {
            page-break-inside: avoid;
        }
        tr.totalrow {
            background-color: #e3e3e3;
            line-height: 200%;
        }
        td.totalboxtop {
            font-size: 12pt;
            background-color: #e3e3e3;
        }
        td.addressheader {
            font-size: 8pt;
            padding-top: 6px;
            padding-bottom: 2px;
        }
        td.address {
            padding-top: 0px;
        }
        td.totalboxmid {
            font-size: 28pt;
            padding-top: 20px;
            background-color: #e3e3e3;
        }
        td.totalboxbot {
            background-color: #e3e3e3;
            font-weight: bold;
        }
        span.title {
            font-size: 28pt;
        }
        span.number {
            font-size: 16pt;
        }
        span.itemname {
            font-weight: bold;
            line-height: 150%;
        }
        hr {
            width: 100%;
            color: #d3d3d3;
            background-color: #d3d3d3;
            height: 1px;
        }
</style>
</head>
<body header-height="10%"  padding="0.5in 0.5in 0.5in 0.5in" size="Letter">
	<table class="header" style="width: 100%;"><tr>
	<td rowspan="3">
		 <span class="nameandaddress">
		 ${companyInformation.companyName}</span>
		 <br />
		 <span class="nameandaddress">${companyInformation.addressText}</span>
	</td>
	<td align="right" colspan="2"><span class="title">Outbound Cash Sale #${record.tranid}</span></td>
	</tr>
	<tr>
	<td align="right" colspan="2"><b>UUID:</b> <span>${certData.custbody_mx_cfdi_uuid}</span></td>
	</tr>
	<tr>
	<td align="right" colspan="2"><b>ISSUANCE: </b> ${customCompanyInfo.city}, ${certData.custbody_mx_cfdi_issue_datetime}</td>
	</tr></table>
	<table style="width: 100%; margin-top: 10px;"><tr>
	<td class="addressheader" colspan="3"><b>${record.shipaddress@label}</b></td>
	<td class="addressheader" colspan="3"><b>${record.billaddress@label}</b></td>
	<td class="totalboxtop" colspan="5"><b>${record.total@label?upper_case}</b></td>
	</tr>
	<tr>
	<td class="address" colspan="3" rowspan="2">
	<p>${record.shipaddress}</p>
	<b>Ship Via</b>
	<p>${record.shipmethod}</p>
	</td>
	<td class="address" colspan="3" rowspan="2">
	<p>${record.billaddress}</p>
	<b>Sales Information</b>
	<p>Sales Rep: ${record.salesrep}<br />Partner: ${record.partner}</p>
	</td>
	<td align="right" class="totalboxmid" colspan="5">${fmtc(summary.totalAmount)}</td>
	</tr>
	<tr>
	<td align="right" class="totalboxbot" colspan="5"><b>${record.trandate@label}:</b> ${record.trandate}</td>
	</tr></table>
<table style="width:100%; margin-top: 10px;">
<thead>
	<tr>
	<th align="left" scope="col">Customer Information</th>
	<td style="width:1%"></td>
	<th align="left" scope="col">Issuer Information</th>
	</tr>
</thead><tr>
	<td>
	<table style="width:100%;"><tr>
		<td>${customerName}</td>
		</tr>
		<tr>
		<td><b>RFC:</b> ${customer.custentity_mx_rfc}</td>
		</tr>
		<tr>
		<td><b>CFDI USAGE:</b> ${record.custbody_mx_cfdi_usage}</td>
		</tr>
		<tr>
		<td>&nbsp;</td>
		</tr>
		<tr>
		<td>&nbsp;</td>
		</tr></table>
	</td>
	<td style="width:1%"></td>
	<td>
	<table style="width:100%;"><tr>
		<td>${companyinformation.companyname}</td>
		</tr>
		<tr>
		<td>${customCompanyInfo.legalname}</td>
		</tr>
		<tr>
		<td><b>RFC:</b> ${companyTaxRegNumber}</td>
		</tr>
		<tr>
		<td><b>INDUSTRY TYPE: </b> ${satCodes.industryTypeName}</td>
		</tr>
		<tr>
		<td><b>CSD SERIAL NUMBER:</b> ${certData.custbody_mx_cfdi_issuer_serial}</td>
		</tr></table>
	</td>
	</tr></table>
<table class="body" style="width: 100%; margin-top: 10px;"><tr>
	<th align="left">Sales Order #</th>
	<th align="left">Payment Method</th>
	<th align="left">Payment Terms</th>
	<th align="left">${record.terms@label}</th>
	<th>Currency</th>
	</tr>
	<tr>
	<td>${record.createdfrom.tranid}</td>
	<td>${record.custbody_mx_txn_sat_payment_method}</td>
	<td>${record.custbody_mx_txn_sat_payment_term}</td>
	<td>${record.terms}</td>
	<td>${currencyCode}</td>
	</tr></table>
	
<#if custom.items?has_content>
<table class="itemtable" style="width: 100%; margin-top: 10px;"><!-- start items -->
<#list custom.items as customItem><#if customItem?index==0>
<#assign "item" = record.item[customItem.line?number]>
<thead>
	<tr>
	<th align="center" colspan="3">Quantity</th>
	<th align="center" colspan="3">Unit</th>
	<th colspan="15">Item Description</th>
	<th align="right" colspan="4">Unit Rate</th>
	<th align="right" colspan="4">Discount</th>
	<th align="right" colspan="4">Amount</th>
	</tr>
</thead>
</#if><tr style="vertical-align:baseline">
    <#assign "taxes" = customItem.taxes>

		<td align="center" colspan="3" line-height="150%">${item.quantity?string["0.0"]}</td>
		<td align="center" colspan="3" line-height="150%">${item.units}</td>
		<td colspan="15">
		<span class="itemname">${item.item}</span>
		<p>${item.description}</p>
		</td>
		<td align="right" colspan="4">${fmtc(customItem.rate)}</td>
		<td align="right" colspan="4">${fmtc(customItem.totalDiscount)}</td>
		<td align="right" colspan="4">${fmtc(customItem.amount)}</td>
	</tr>
	<#if customItem.parts?has_content>
		<tr>
			<td align="center" colspan="3" line-height="150%"></td>
			<td align="center" colspan="3" line-height="150%"></td>
			<td colspan="15"><span class="itemname">Parts</span></td>
			<td align="right" colspan="4"></td>
			<td align="right" colspan="4"></td>
			<td align="right" colspan="4"></td>
		</tr>
		<#list customItem.parts as part>
		
		<#assign "partItem" = record.item[part.line?number]>
		<tr>
			<td align="center" colspan="3" line-height="150%">${partItem.quantity?string["0.0"]}</td>
			<td align="center" colspan="3" line-height="150%">${partItem.units}</td>
			<td colspan="15">${partItem.item}</td>
			<td align="right" colspan="4">${fmtc(part.rate)}</td>
			<td align="right" colspan="4">${fmtc(part.totalDiscount)}</td>
			<td align="right" colspan="4">${fmtc(part.amount)}</td>
		</tr>
		</#list>
	</#if>	 
	<tr>
		<td align="center" colspan="3" line-height="150%"></td>
		<td align="center" colspan="3" line-height="150%"></td>
		<td colspan="15">
			<#if taxes.taxItems?has_content>
	<table class="itemtable" align="center" style="width:100%">
	<thead>
		<tr>
			<th colspan="5" scope="col" align="center">TRANSFERS</th>
		</tr>
	</thead><tr>
		<td>Base</td>
		<td>Tax</td>
		<td>Factor</td>
		<td>Rate</td>
		<td>Amount</td>
		</tr>
		<#list taxes.taxItems as customTaxItem>
		<tr>

		<td>${customTaxItem.taxBaseAmount?number?string["0.00"]}</td>
		<td>${customTaxItem.satTaxCode}</td>
		<td>${customTaxItem.taxFactorType}</td>
		<td>${customTaxItem.taxRate?number?string["0.000"]}</td>
		<td>${customTaxItem.taxAmount?number?string["0.00"]}</td>
		</tr>
		</#list>
		</table>
		</#if>
		&nbsp;

	<#if taxes.whTaxItems?has_content>
		<table class="itemtable" align="center" style="width:100%">
		<thead>
			<tr>
			<th colspan="5" scope="col" align="center">WITHHOLDING</th>
			</tr>
	</thead><tr>
		<td>Base</td>
		<td>Tax</td>
		<td>Factor</td>
		<td>Rate</td>
		<td>Amount</td>
		</tr>
		<#list taxes.whTaxItems as customWhTaxItem>
		<tr>

		<td>${customWhTaxItem.taxBaseAmount?number?string["0.00"]}</td>
		<td>${customWhTaxItem.satTaxCode}</td>
		<td>${customWhTaxItem.taxFactorType}</td>
		<td>${customWhTaxItem.taxRate?number?string["0.000"]}</td>
		<td>${customWhTaxItem.taxAmount?number?string["0.00"]}</td>
		</tr>
		</#list>
		</table>
	 </#if>

	
		
		</td>
		<td align="right" colspan="4"></td>
		<td align="right" colspan="4"></td>
		<td align="right" colspan="4"></td>
	</tr>
	
	<tr><td colspan="33" align="center"><hr /></td></tr>
	</#list><!-- end items -->
	</table>
	
</#if>
<table class="total" style="width: 100%; margin-top: 10px;"><tr>
	<td colspan="3">&nbsp;</td>
	<td align="right" colspan="2"><b>${record.subtotal@label}</b></td>
	<td align="right">${fmtc(summary.subtotal)}</td>
	</tr>
	<tr>
	<td colspan="3">&nbsp;</td>
	<td align="right" colspan="2">Discount</td>
	<td align="right">${fmtc(summary.totalDiscount)}</td>
	</tr>
	<tr>
	<td colspan="3">&nbsp;</td>
	<td align="right" colspan="2">Total Withholding Taxes</td>
	<td align="right">${fmtc(summary.totalWithHoldTaxAmt)}</td>
	</tr>
	<tr>
	<td colspan="3">&nbsp;</td>
	<td align="right" colspan="2">Total Transfer Taxes</td>
	<td align="right">${fmtc(summary.totalNonWithHoldTaxAmt)}</td>
	</tr>
	<tr>
	<td colspan="3">&nbsp;</td>
	<td align="right" colspan="2"><b>${record.taxtotal@label}</b></td>
	<td align="right">${fmtc(summary.totalTaxSum)}</td>
	</tr>
	<tr class="totalrow">
	<td background-color="#ffffff" colspan="3">&nbsp;</td>
	<td align="right" colspan="2"><b>${record.total@label}</b></td>
	<td align="right">${fmtc(summary.totalAmount)}</td>
	</tr></table>
&nbsp;
<table class="signatures" style="width: 100%; margin-top: 10px;"><tr>
	<td><b>Original String</b>
	<p>${certData.custbody_mx_cfdi_cadena_original}</p>
	</td>
	</tr>
	<tr>
	<td>&nbsp;</td>
	</tr>
	<tr>
	<td><b>CFDI Signature</b>
	<p>${certData.custbody_mx_cfdi_signature}</p>
	</td>
	</tr>
	<tr>
	<td>&nbsp;</td>
	</tr>
	<tr>
	<td><b>SAT Signature</b>
	<p>${certData.custbody_mx_cfdi_sat_signature}</p>
	</td>
	</tr>
	<tr>
	<td>&nbsp;</td>
	</tr></table>
&nbsp;
<table class="certification" style="width: 100%; margin-top: 10px;">
<thead>
	<tr>
	<th scope="col">Certification Timestamp</th>
	<th scope="col">SAT Serial Number</th>
	<th scope="col">PAC RFC</th>
	</tr>
</thead><tr>
	<td>${certData.custbody_mx_cfdi_certify_timestamp}</td>
	<td>${certData.custbody_mx_cfdi_sat_serial}</td>
	<td>${custom.pacRfc}</td>
	</tr></table>
&nbsp;
<table align="center" style="width: 100%; margin-top: 10px;"><tr>
     <#assign qrcodeImage = "data:image/png;base64, " + certData.custbody_mx_cfdi_qr_code >
	<td align="center">
	<img style="width: 100px;height:100px" src="${qrcodeImage}" /></td>
	</tr>
	<tr>
	<td align="center"><b>This document is a printed representation of a CFDI</b></td>
	</tr></table>
</body>
</pdf>