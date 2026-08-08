<?xml version="1.0"?><!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">
<pdf>
<#if custom.certData?has_content>
 <#assign "certData" = custom.certData>
<#else>
 <#assign "certData" = record>
</#if>
<#if custom.multiCurrencyFeature == "true">
    <#assign "currencyCode" = record.currencysymbol>
    <#assign exchangeRate = record.exchangerate?string.number>
<#else>
  <#assign "currencyCode" = "MXN">
  <#assign exchangeRate = 1>
</#if>
<#assign "satCodes" = custom.satcodes>
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
<#assign "companyTaxRegNumber" = custom.companyInfo.rfc>
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
	<td align="right" colspan="2"><span class="title">Itemfulfillment #${record.tranid}</span></td>
	</tr>
	<tr>
	<td align="right" colspan="2"><b>UUID:</b> <span>${certData.custbody_mx_cfdi_uuid}</span></td>
	</tr>
	<tr>
	<td align="right" colspan="2"><b>ISSUANCE: </b> ${customCompanyInfo.city}, ${certData.custbody_mx_cfdi_issue_datetime}</td>
	</tr></table>
	<table style="width: 100%; margin-top: 10px;"><tr>
	<td class="addressheader" colspan="3"><b>Ship To</b></td>
	<td class="addressheader" colspan="3"><b>Bill To</b></td>
	</tr>
	<tr>
	<td class="address" colspan="3" rowspan="2">
	<p>${record.shipaddress}</p>
	<b>Ship Via</b>
	<p>${record.shipmethod}</p>
	</td>
	<td class="address" colspan="3" rowspan="2">
	<p>${record.createdfrom.billaddress}</p>
	<b>Sales Information</b>
	<p>Sales Rep: ${record.createdfrom.salesrep}<br />Partner: ${record.createdfrom.partner}</p>
	</td>
	</tr>
	</table>
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

	
<#if custom.items?has_content>
<table class="itemtable" style="width: 100%; margin-top: 10px;"><!-- start items -->

<#list custom.items as customItem>
<#assign "item" = record.item[customItem.line?number]>

<#if customItem?index==0>
    
    <thead>
        <tr>
        <th align="center" colspan="3">Quantity</th>
        <th align="center" colspan="3">Unit</th>
        <th align="left" colspan="15">Item</th>
        </tr>
    </thead>
</#if>
<tr style="vertical-align:baseline">

		<td align="center" colspan="3" line-height="150%">${item.quantity?string["0.0"]}</td>
		<td align="center" colspan="3" line-height="150%">${customItem.unitsText}</td>
		<td align="left" colspan="15">
		<span class="itemname">${item.item}</span>
		<p>${item.description}</p>
		</td>
	</tr>
	
	
	<tr><td colspan="21" align="center"><hr /></td></tr>
</#list>
	</table>
	
</#if>
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