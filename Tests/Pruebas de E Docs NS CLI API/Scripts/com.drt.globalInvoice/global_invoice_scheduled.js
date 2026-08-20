/******************************************************************
 * * DisrupTT * DisrupTT Developers *
 * ****************************************************************
 * Date: 2021
 * Script name: Global Invoice Scheduled
 * Script id: customscript_drt_global_invoice_schedule
 * Deployment id:
 * Applied to:
 * File: global_invoice_scheduled.js
 ******************************************************************/
/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
 define(['N/search', 'N/record', 'N/format', 'N/runtime', 'N/https', 'N/xml', 'N/encode', 'N/config', 'N/task', 'N/xml', 'N/email', 'N/file'],
 function (search, record, format, runtime, https, xml, encode, config, task, xml, email, file) {

	 const CONST_ARR_CHART = ['&', '"', '<', '>', "'", '´'];
	 //const OPERATION = '';
	 const OPERATION = 'CONVERT_NATIVE_XML';
	 //const OPERATION = 'ASYNC_CONVERT_NATIVE_XML';
	 //const OPERATION = 'ASYNC_CONVERT_VERIFY';
	 var jsonData = null;

	 var objUpdate = {
		 custrecord_drt_prf_generado: '',
		 custrecord_drt_xml_generado: '',
		 custrecord_drt_documento_xml: '',
		 custrecord_drt_status: '',
		}

		/**		
		* Set xml for operation ASYNC_CONVERT_NATIVE_XML
		*/
				
		function getAsyncConvertNativeXml(xmlStrB64, rfcEmisor, id, requestor, userName, user, operation = 'ASYNC_CONVERT_NATIVE_XML') {
		var xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://www.fact.com.mx/schema/ws">';
		xml += ' <soapenv:Header/>';
		xml += ' <soapenv:Body>';
		xml += ' <ws:RequestTransaction>';
		xml += ' <ws:Requestor>' + requestor + '</ws:Requestor>';
		xml += ' <ws:Transaction>' + operation + '</ws:Transaction>';
		xml += ' <ws:Country>MX</ws:Country>';
		xml += ' <ws:Entity>' + rfcEmisor + '</ws:Entity>';
		// xml += ' <ws:Entity>XAXX010101000</ws:Entity>';
		xml += ' <ws:User>' + user + '</ws:User>';
		xml += ' <ws:UserName>MX' + rfcEmisor + 'ADMIN</ws:UserName>';
		// xml += ' <ws:UserName>' + userName + '</ws:UserName>';
		xml += ' <ws:Data1> ' + xmlStrB64 + ' </ws:Data1>';
		xml += ' <ws:Data2>'+id+'</ws:Data2>';
		xml += ' <ws:Data3></ws:Data3>';
		xml += ' </ws:RequestTransaction>';
		xml += ' </soapenv:Body>';
		xml += '</soapenv:Envelope>';
		return xml;
		}
		/**
		* Save a customrecord_cdy_async_xml_sat record
		* @param {JSON} obj
		*/
		function saveAsyncXmlSatRecord(obj) {
		try {
		var registro = record.create({type: "customrecord_cdy_async_xml_sat"});
		registro.setText({fieldId:'custrecord_xml_async_response_data_id', text: obj.id});// UUID/ID de la petición
		registro.setText({fieldId:'custrecord_xml_async_folder_id', text: Number(obj.folder)});// ID de la carpeta donde se guardará posteriormente los archivos xml y pdf
		registro.setValue({fieldId:'custrecord_xml_async_reg_fact_interco', value: Number(obj.reg_fact_id)});// ID del registro de facturación intercompañía
		registro.setValue({fieldId:'custrecord_xml_async_setup_serial_id', value: Number(obj.set_ser_id)});// ID del registro de setup serial ID
		registro.setValue({fieldId:'custrecord_xml_status_async_naat', value: 1});// Status (Pendiente)
		registro.setText({fieldId:'custrecord_xml_async_rfc_emisor', text: obj.rfc_emisor});// RFC Emisor
		registro.setText({fieldId:'custrecord_xml_response_async_nat', text: obj.xml});// Respuesta XML
		registro.setValue({fieldId:'custrecord_xml_async_pac_requestor_id', value: Number(obj.pac_id)});// PAC con el que factura
		return registro.save();
		} catch (error) {
		log.debug('Error en saveAsyncXmlSatRecord', error);
		return null;
		} 
	 }

	 function getSerialNumber(id) {
		 var schResult = '';

		 if (id === null) {
			 return 'GEN-1000000001';
		 }
		 var source = 'customrecord_drt_setup_serial_gi';
		 var afilters = [{
			 name: 'custrecord_drt_num_subsidiary',
			 operator: search.Operator.ANYOF,
			 values: id
		 }];
		 var acolumns = ['custrecord_drt_prefix', 'custrecord_drt_suffix', 'custrecord_drt_current', 'custrecord_drt_initial'];

		 //BÚSQUEDA GUARDADA: Facturación Global - Scheduled
		 var schRecord = search.create({
			 type: source,
			 filters: afilters,
			 columns: acolumns
		 }).run().each(function (result) {
			 if (result.getValue('custrecord_drt_prefix')) {
				 schResult += result.getValue('custrecord_drt_prefix');
			 }
			 if (result.getValue('custrecord_drt_suffix')) {
				 schResult += result.getValue('custrecord_drt_suffix');
			 }
			 if (parseInt(result.getValue('custrecord_drt_current')) == 0) {
				 schResult += result.getValue('custrecord_drt_initial').toString();
			 } else {
				 schResult += (result.getValue('custrecord_drt_current') || 1).toString();
			 }
			 schResult = {
				 serial: schResult,
				 id: result.id
			 };
		 });
		 return schResult;
	 }

	 function getDataSAT(type, id) {

		 var fieldName = 'name';
		 /*if (type == 'customrecord_mx_mapper_values') {
			 fieldName = 'custrecord_mx_mapper_value_inreport';
		 }*/
		 // 1 unidad
		 var result = search.lookupFields({
			 type: type,
			 id: id,
			 columns: [fieldName]
		 });
		 return result.name;
	 }

	 function getFormatDateXML(d) {
		d = new Date(d);
		 if (!d) {
			 return '';
		 }
		 var dd = (d.getDate() + 100).toString().substr(1, 2);
		 var MM = (d.getMonth() + 101).toString().substr(1, 2);
		 var yy = d.getFullYear();
		 var hh = (parseInt(d.getHours()) + 100).toString().substr(1, 2);
		 var mm = (parseInt(d.getMinutes()) + 100).toString().substr(1, 2);
		 var ss = (parseInt(d.getSeconds()) + 100).toString().substr(1, 2);

		 return yy + '-' + MM + '-' + dd + 'T' + hh + ':' + mm + ':' + ss;
	 }

	 function getSetupCFDI(idsub) {
		 var result = null;
		 // 0 units
		 var SUBSIDIARIES = runtime.isFeatureInEffect({
			 feature: 'SUBSIDIARIES'
		 });

		 if (SUBSIDIARIES && idsub) {
			 // Configuracion de la subsidiaria
			 // 5 Units
			 var subsidiary = record.load({
				 type: 'subsidiary',
				 id: idsub
			 });

			 result = {
				 rfcemisor: subsidiary.getValue('federalidnumber') || 'XAXX010101000',
				 regfiscal: subsidiary.getText('custrecord_mx_sat_industry_type').split('-')[0] || '',
				 razonsoc: subsidiary.getValue('custrecord_mx_sat_registered_name'),
				 codigoPostalEmisor: subsidiary.getValue('custrecord_drt_cod_postal_emisor'),
			 };

		 } else if (!SUBSIDIARIES) {
			 // Configuracion de la compania
			 // 10 unidades
			 var configRecObj = config.load({
				 type: config.Type.COMPANY_INFORMATION
			 });

			 result = {
				 rfcemisor: configRecObj.getValue('employerid') || '',
				 regfiscal: configRecObj.getText('custrecord_mx_sat_industry_type').split('-')[0] || '',
				 razonsoc: configRecObj.getValue('legalname'),
				 codigoPostalEmisor: configRecObj.getValue('custrecord_drt_cod_postal_emisor'),
			 };
		 }
		 return result;
	 }

	 function getXMLHead(userName) {
		 // Obtengo el folio de la factura
		 if (!jsonData.idsetfol) {
			 //var idsetfol = getSerialNumber(jsonData.subsidiary);
			 jsonData.idsetfol = runtime.getCurrentScript().getParameter('custscript_drt_glb_registro_facturacion')
		 }

		 let periodicidad = runtime.getCurrentScript().getParameter('custscript_drt_glb_periodicidad');
		 let meses = runtime.getCurrentScript().getParameter('custscript_drt_glb_meses');
		 let anio = runtime.getCurrentScript().getParameter('custscript_drt_glb_anio');

		 const periodicidadLookup = search.lookupFields({
			type: 'customrecord_mcf_sat_recurrence',
			id: periodicidad,
			columns: ['custrecord_mcf_sat_recurrence_code']
		 });

		 const mesesLookup = search.lookupFields({
			type: 'customrecord_mcf_sat_months',
			id: meses,
			columns: ['custrecord_mcf_sat_months_code']
		 });

		 log.debug("informacion global", "periodicidad: "+ periodicidad + " | meses: "+ meses + " | anio: "+ anio);

		 var customerLookUp = search.lookupFields({
			 type: record.Type.CUSTOMER,
			 id: jsonData.entityId,
			 columns: ['custentity_mx_sat_industry_type','custentity_mx_sat_registered_name','shipzip']
		 });

		 jsonData.industriaCustomer = customerLookUp.custentity_mx_sat_industry_type[0].text.split(" ")[0];
		 jsonData.nombreRegistradoCustomer = customerLookUp.custentity_mx_sat_registered_name;
		 jsonData.codigoPostalCustomer = customerLookUp.shipzip;

		 var xmlDoc = '';
		 xmlDoc += '<?xml version="1.0" encoding="UTF-8"?>';
		 xmlDoc += '<fx:FactDocMX ';
		 xmlDoc += 'xmlns:fx="http://www.fact.com.mx/schema/fx" ';
		 xmlDoc += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
		 xmlDoc += 'xsi:schemaLocation="http://www.fact.com.mx/schema/fx http://www.mysuitemex.com/fact/schema/fx_2010_g.xsd">';
		 xmlDoc += '  <fx:Version>8</fx:Version>';
		 xmlDoc += '  <fx:Identificacion>';
		 xmlDoc += '    <fx:CdgPaisEmisor>MX</fx:CdgPaisEmisor>';
		 xmlDoc += '    <fx:TipoDeComprobante>FACTURA</fx:TipoDeComprobante>';
		 xmlDoc += '    <fx:RFCEmisor>' + jsonData.rfcemisor + '</fx:RFCEmisor>';
		 // xmlDoc += '    <fx:RFCEmisor>XAXX010101000</fx:RFCEmisor>';
		 //xmlDoc += ' <fx:RazonSocialEmisor>JIMENEZ ESTRADA SALAS A A</fx:RazonSocialEmisor>';
		 xmlDoc += '    <fx:RazonSocialEmisor>' + jsonData.razonsoc + '</fx:RazonSocialEmisor>'; //Esto es original
		 xmlDoc += '    <fx:Usuario>' + userName + '</fx:Usuario>';
		 xmlDoc += '    <fx:AsignacionSolicitada>';
		 xmlDoc += '      <fx:Folio>' + jsonData.idsetfol + '</fx:Folio>';
		 xmlDoc += '      <fx:TiempoDeEmision>' + jsonData.today + '</fx:TiempoDeEmision>'; // 2020-11-11T00:00:00
		 //xmlDoc += '      <fx:TiempoDeEmision>2022-01-30T00:00:00</fx:TiempoDeEmision>'; // 2020-11-11T00:00:00
		 xmlDoc += '    </fx:AsignacionSolicitada>';
		 xmlDoc += '	<fx:Exportacion>'+jsonData.exportType+'</fx:Exportacion>'
		 xmlDoc += '    <fx:LugarExpedicion>' + jsonData.codigoPostalEmisor + '</fx:LugarExpedicion>';
		 xmlDoc += '  </fx:Identificacion>';
		 if(jsonData.rfcrecep == "XAXX010101000" && jsonData.nombreRegistradoCustomer == "PUBLICO EN GENERAL"){
			xmlDoc += '  <fx:InformacionGlobal>';
			xmlDoc += '  <fx:Periodicidad>' + periodicidadLookup.custrecord_mcf_sat_recurrence_code + '</fx:Periodicidad>';
			xmlDoc += '  <fx:Meses>' + mesesLookup.custrecord_mcf_sat_months_code + '</fx:Meses>';
			xmlDoc += '  <fx:Año>' + anio + '</fx:Año>';
			xmlDoc += '  </fx:InformacionGlobal>';
		 }		 
		 xmlDoc += '  <fx:Emisor>';
		 xmlDoc += '    <fx:RegimenFiscal>';
		 xmlDoc += '      <fx:Regimen>' + jsonData.regfiscal.split('-')[0].trim() + '</fx:Regimen>'; //601
		 xmlDoc += '    </fx:RegimenFiscal>';
		 xmlDoc += '  </fx:Emisor>';
		 xmlDoc += '  <fx:Receptor>';
		 xmlDoc += '    <fx:CdgPaisReceptor>MX</fx:CdgPaisReceptor>';
		 xmlDoc += '    <fx:RFCReceptor>' + jsonData.rfcrecep + '</fx:RFCReceptor>';
		 //xmlDoc += '    <fx:NombreReceptor>' + jsonData.entity.replace("2 ", "").replace("1 ", "") + '</fx:NombreReceptor>';
		 //xmlDoc += '    <fx:NombreReceptor>JIMENEZ ESTRADA SALAS A A</fx:NombreReceptor>';
		 xmlDoc += '    <fx:NombreReceptor>'+jsonData.nombreRegistradoCustomer+'</fx:NombreReceptor>';
		 // xmlDoc += '    <fx:NombreReceptor>PUBLICO EN GENERAL</fx:NombreReceptor>';
		 //xmlDoc += '    <fx:DomicilioFiscalReceptor>01030</fx:DomicilioFiscalReceptor>'; //Esto es nuevo
		 xmlDoc += '    <fx:DomicilioFiscalReceptor>'+jsonData.codigoPostalCustomer+'</fx:DomicilioFiscalReceptor>'; //Esto es nuevo
		 xmlDoc += '	   <fx:RegimenFiscalReceptor>'+jsonData.industriaCustomer+'</fx:RegimenFiscalReceptor>'; //Esto es nuevo
		 xmlDoc += '    <fx:UsoCFDI>' + jsonData.cfdi.split('-')[0].trim() + '</fx:UsoCFDI>'; //P01
		 xmlDoc += '  </fx:Receptor>';
		 xmlDoc += '  <fx:Conceptos>';

		 var totTaxAmount = 0;
		 var totBase = 0; //Esto es nuevo

		 for (var i = 0; i < jsonData.items.length; i++) {

			 var codeItem = jsonData.items[i].itemid;
			 var nameItem = jsonData.items[i].name;

			 for (var t = 0; t < CONST_ARR_CHART.length; t++) {
				 if (nameItem.indexOf(CONST_ARR_CHART[t]) >= 0) {
					 nameItem = xml.escape({
						 xmlText: nameItem
					 });
					 break;
				 }
			 }

			 for (var t = 0; t < CONST_ARR_CHART.length; t++) {
				 if (codeItem.indexOf(CONST_ARR_CHART[t]) >= 0) {
					 codeItem = xml.escape({
						 xmlText: codeItem
					 });
					 break;
				 }
			 }



			 xmlDoc += '    <fx:Concepto>';
			 xmlDoc += '      <fx:Cantidad>' + jsonData.items[i].quantity + '</fx:Cantidad>';
			 xmlDoc += '      <fx:ClaveUnidad>' + jsonData.items[i].ClaveUnidad + '</fx:ClaveUnidad>';
			 xmlDoc += '      <fx:UnidadDeMedida>' + jsonData.items[i].unit + '</fx:UnidadDeMedida>';
			 xmlDoc += '      <fx:ClaveProdServ>' + jsonData.items[i].ClaveProdServ + '</fx:ClaveProdServ>';
			 xmlDoc += '      <fx:Codigo>' + codeItem + '</fx:Codigo>';
			 xmlDoc += '      <fx:Descripcion>' + nameItem + '</fx:Descripcion>';
			 xmlDoc += '      <fx:ValorUnitario>' + jsonData.items[i].rate + '</fx:ValorUnitario>';
			 xmlDoc += '      <fx:Importe>' + jsonData.items[i].amount + '</fx:Importe>';
			 xmlDoc += '      <fx:Descuento>' + jsonData.items[i].discount + '</fx:Descuento>';
			 xmlDoc += '      <fx:ObjetoImp>'+jsonData.items[i].taxObj+'</fx:ObjetoImp>';
			 //xmlDoc += '      <fx:ObjetoImp>02</fx:ObjetoImp>';
			 xmlDoc += '      <fx:ImpuestosSAT>';
			 xmlDoc += '        <fx:Traslados>';
              var ImporteImp =0
			  var amount = jsonData.items[i].amount;
			  amount = parseFloat(amount).toFixed(2);
			  
			 if (jsonData.items[i].taxcodeid == 307) {
				 xmlDoc += '          <fx:Traslado Base="' + amount + '" Impuesto="002" TipoFactor="Exento" />';
			 } else {
                ImporteImp=  parseFloat(amount) * parseFloat(jsonData.items[i].taxrate) ;
                ImporteImp =  ImporteImp.toFixed(2);
				 xmlDoc += '          <fx:Traslado Base="' + amount + '" Importe="' + ImporteImp + '" Impuesto="002" TasaOCuota="' + jsonData.items[i].taxrate + '" TipoFactor="Tasa" />';
			 }
			 xmlDoc += '        </fx:Traslados>';
			 xmlDoc += '      </fx:ImpuestosSAT>';
			 xmlDoc += '    </fx:Concepto>';
			 totTaxAmount += parseFloat(ImporteImp);
			 totBase +=parseInt(Math.round(parseFloat(amount)*100)) ; //Esto es nuevo
		 }
        totBase= totBase/100;
       var strTotBase  = totBase.toFixed(2)
		 xmlDoc += '  </fx:Conceptos>';
		 xmlDoc += '  <fx:ImpuestosSAT TotalImpuestosTrasladados="' + totTaxAmount.toFixed(2) + '">';
		 xmlDoc += '    <fx:Traslados>';
		 xmlDoc += '      <fx:Traslado Base="' + totBase.toFixed(2) + '" Importe="' + totTaxAmount.toFixed(2) + '" Impuesto="002" TasaOCuota="' + jsonData.items[0].taxrate + '" TipoFactor="Tasa" />'; //Esto es nuevo solo Base
		 xmlDoc += '    </fx:Traslados>';
		 xmlDoc += '  </fx:ImpuestosSAT>';
		 xmlDoc += '  <fx:Totales>';
		 xmlDoc += '    <fx:Moneda>' + jsonData.currency + '</fx:Moneda>';
		 xmlDoc += '    <fx:TipoDeCambioVenta>' + jsonData.exchange + '</fx:TipoDeCambioVenta>';
		 xmlDoc += '    <fx:SubTotalBruto>' + strTotBase+ '</fx:SubTotalBruto>';
		 xmlDoc += '    <fx:SubTotal>' + strTotBase + '</fx:SubTotal>';
		 xmlDoc += '    <fx:Descuento>' + jsonData.destot + '</fx:Descuento>';
		 xmlDoc += '    <fx:Total>' + (totBase + totTaxAmount - parseFloat(jsonData.destot) ).toFixed(2) + '</fx:Total>';
		 xmlDoc += '    <fx:TotalEnLetra>-</fx:TotalEnLetra>';
		 xmlDoc += '    <fx:FormaDePago>' + jsonData.payform.split(' ')[0].trim() + '</fx:FormaDePago>';
		 xmlDoc += '  </fx:Totales>';
		 xmlDoc += '  <fx:ComprobanteEx>';
		 xmlDoc += '    <fx:TerminosDePago>';
		 //xmlDoc += '      <fx:MetodoDePago>PPD</fx:MetodoDePago>';
		 xmlDoc += '      <fx:MetodoDePago>'+ jsonData.paymeth.split(' ')[0].trim() +'</fx:MetodoDePago>';
		 xmlDoc += '    </fx:TerminosDePago>';
		 xmlDoc += '  </fx:ComprobanteEx>';
		 xmlDoc += '</fx:FactDocMX>';
		 return xmlDoc;
	 }

	 function getAllRecords() {
		log.audit('Remaining Usage init getAllRecords', runtime.getCurrentScript().getRemainingUsage()); 

		 var rangini = 0;
		 var rangend = 1000;
		 var subtot = 0;
		 var taxtot = 0;
		 var total = 0;
		 var destot = 0;
		 var isentry = true;
		 
		 var today = runtime.getCurrentScript().getParameter('custscript_drt_glb_today') || null;
		 if (!today) {
			 today = new Date();
			 today = format.format({
				 value: today,
				 type: format.Type.DATE
			 });
		 } else {
			 today = format.format({
				 value: today,
				 type: format.Type.DATE
			 });
		 }

		 var idRecFacturacion = runtime.getCurrentScript().getParameter('custscript_drt_glb_registro_facturacion') || null;
		 log.audit("idRecFacturacion", idRecFacturacion);
		 var facturacionInterco = record.load({
			type: "customrecord_drt_reg_facturacion_interco",
			id: idRecFacturacion,
		});	

		 var idInterno = runtime.getCurrentScript().getParameter('custscript_drt_glb_id_facturas') || null;
		 var text = idInterno;

		 var idInternoArray = text.split("");
		 log.audit("idInternoArray: "+idInternoArray.length, idInternoArray);

		 var satNombreRegistrado = runtime.getCurrentScript().getParameter('custscript_drt_glb_cliente') || null;
		 log.audit("satNombreRegistrado: ", satNombreRegistrado);

		 if(satNombreRegistrado === "PUBLICO EN GENERAL"){
			var sourceId = runtime.getCurrentScript().getParameter('custscript_drt_glb_search_agrupada');
			log.audit("sourceId", sourceId);
   
			// cargo la busqueda guardada
			var searchRecord = search.load({
			   id: sourceId
		   });
		   log.audit("searchRecord", searchRecord);
			 var filters = searchRecord.filters;
			 var afilterOne = search.createFilter({
				 name: 'internalid',
				 operator: search.Operator.ANYOF,
				 values: idInternoArray
			 });
   
			 filters.push(afilterOne);
			 log.audit("filters", filters); 
   
			//var schResultRange = search.run().getRange({
			var schResultRange = searchRecord.run().getRange({
				start: rangini,
				end: rangend
			});
			log.audit('schResultRange count: '+ schResultRange.length, schResultRange);
   
			var trasladoImporte = 0;
			let idCashsalesArray = [];
   
			do {
				schResultRange.forEach(function (row) {
					
				   subsidiary = row.getValue({name: "subsidiary", summary: "GROUP"});				
				   amount = parseFloat(row.getValue({name: "amount", summary: "SUM"})).toFixed(2);				
					
   
					subtot += parseFloat(row.getValue({name: "amount", summary: "SUM"}));
					taxtot += parseFloat(row.getValue({name: "taxamount", summary: "SUM"}));
					total += parseFloat(row.getValue({name: "grossamount", summary: "SUM"}));
   
					idCashsalesArray.push(row.id);
					
				   
					trasladoImporte += Number(row.getValue({name: "taxamount", summary: "SUM"}));

					if (isentry == true) {
						jsonData = {
							subsidiary: row.getValue({
								name: "subsidiary",
								summary: "GROUP"
							 }),
							trandate: row.getValue({
								name: "trandate",
								summary: "GROUP"
							 }),
							tranid: row.getValue({
								name: "tranid",
								summary: "GROUP"
							 }),
							entity: row.getText({
								name: "entity",
								summary: "GROUP"
							 }),
							entityId: row.getValue({
								name: "entity",
								summary: "GROUP"
							 }),
							// rfcrecep: 'XAXX010101000', 
							rfcrecep: row.getValue({
								name: "custbody_mx_customer_rfc",
								summary: "GROUP"
							 }),
							currency: 'MXN',
							exchange: parseInt(row.getValue({
								name: "exchangerate",
								summary: "GROUP"
							 })),
							exportType: (row.getText({
								name: "custbody_mx_cfdi_sat_export_type",
								summary: "GROUP"
							 })||"01").split(' ')[0],
							satNombreRegistrado : "PUBLICO EN GENERAL",
							subtot: 0,
							taxtot: 0,
							total: 0,
							destot: 0,
							cfdi: '',
							payform: '',
							paymeth: '',
							rfcemisor: '',
							today: '',
							regfiscal: '',
							idsetfol: '',
							proceso : 2,
							items: [{
								itemid : row.getValue({
									name: "tranid",
									summary: "GROUP",
								}),
								name : "VENTA",
								quantity : 1,
								unit : "ACTIVIDAD",				
								taxrate: '0.160000',
								rate: parseFloat(row.getValue({
									name: "amount",
									summary: "SUM"
								 })).toFixed(2),
								taxamt: parseFloat(row.getValue({
									name: "taxamount",
									summary: "SUM"
								 })).toFixed(2),
								amount: parseFloat(row.getValue({
									name: "amount",
									summary: "SUM"
								 })).toFixed(2),
								discount: parseFloat(row.getValue({
									name: "discountamount",
									summary: "SUM"
								 }) || 0).toFixed(2),
								idcashsales: row.getValue({
									name: "internalid",
									summary: "GROUP",
								 }),
								tipoTransaccion: row.getValue({
									name: "type",
									summary: "GROUP"
								 }),
								ClaveUnidad: "ACT", //item.custitem_drt_nc_unidades_medida;
								ClaveProdServ: "01010101", //item.custitem_mx_txn_item_sat_item_code;
								taxObj: "02", //custcol_mx_txn_line_sat_tax_object;
							}]
						};
						isentry = false;
   
					} else {
						jsonData.items.push({
							itemid : row.getValue({
								name: "tranid",
								summary: "GROUP",
							}),
							name : "VENTA",
							quantity : 1,
							unit : "ACTIVIDAD",				
							taxrate: '0.160000',
							rate: parseFloat(row.getValue({
								name: "amount",
								summary: "SUM"
							})).toFixed(2),
							taxamt: parseFloat(row.getValue({
								name: "taxamount",
								summary: "SUM"
							})).toFixed(2),
							amount: parseFloat(row.getValue({
								name: "amount",
								summary: "SUM"
							})).toFixed(2),
							discount: parseFloat(row.getValue({
								name: "discountamount",
								summary: "SUM"
							}) || 0).toFixed(2),
							idcashsales: row.getValue({
								name: "internalid",
								summary: "GROUP",
							 }),
							tipoTransaccion: row.getValue({
								name: "type",
								summary: "GROUP"
							}),
							ClaveUnidad: "ACT", //item.custitem_drt_nc_unidades_medida;
							ClaveProdServ: "01010101", //item.custitem_mx_txn_item_sat_item_code;
							taxObj: "02", //custcol_mx_txn_line_sat_tax_object;
						});
					}
   
				});
				rangini = rangend;
				rangend += 1000;
				schResultRange = searchRecord.run().getRange({
					start: rangini,
					end: rangend
				});
   
			} while (schResultRange.length > 0);
		 } else {
			var sourceId = runtime.getCurrentScript().getParameter('custscript_drt_glb_search');
			log.audit("sourceId", sourceId);
   
			// cargo la busqueda guardada
			var searchRecord = search.load({
			   id: sourceId
		   });
		   log.audit("searchRecord", searchRecord);
			 var filters = searchRecord.filters;
			 var afilterOne = search.createFilter({
				 name: 'internalid',
				 operator: search.Operator.ANYOF,
				 values: idInternoArray
			 });
   
			 log.audit("afilterOne", afilterOne);
			 filters.push(afilterOne);
			 log.audit("filters", filters); 
   
			//var schResultRange = search.run().getRange({
			var schResultRange = searchRecord.run().getRange({
				start: rangini,
				end: rangend
			});
			log.audit('schResultRange', schResultRange.length);
   
			var trasladoImporte = 0;
			let idCashsalesArray = [];
   
			do {
				schResultRange.forEach(function (row) {

					var itemtype = row.getValue({
						name: 'type',
						join: 'item'
					}).toLowerCase();
					var itemCodeSAT = row.getText('custcol_mx_txn_line_sat_item_code');
   
					subtot += parseFloat(row.getValue('amount'));
					taxtot += parseFloat(row.getValue('taxamount'));
					total += parseFloat(row.getValue('grossamount'));
   
					idCashsalesArray.push(row.id);
					
				   
					trasladoImporte += Number(row.getValue('taxamount'));
   
					if (isentry == true) {
						jsonData = {
						   proceso : 1,
							subsidiary: row.getValue('subsidiary'),
							trandate: row.getValue('trandate'),
							tranid: row.getValue('tranid'),
							entity: row.getText('entity'),
							entityId: row.getValue('entity'),
							// rfcrecep: 'XAXX010101000', 
							rfcrecep: row.getValue('custbody_mx_customer_rfc'),
							currency: 'MXN',
							exchange: parseInt(row.getValue('exchangerate')),
							exportType: (row.getText('custbody_mx_cfdi_sat_export_type')||"01").split(' ')[0],
							satNombreRegistrado : row.getValue({name: "custentity_mx_sat_registered_name", join: "customer"}),
							subtot: 0,
							taxtot: 0,
							total: 0,
							destot: 0,
							cfdi: '',
							payform: '',
							paymeth: '',
							rfcemisor: '',
							today: '',
							regfiscal: '',
							idsetfol: '',
							items: [{
								itemid: row.getValue({
									name: "salesdescription",
									join: "item"
								}) || "", //row.getText('item'),
								name: row.getValue({
									name: 'salesdescription',
									join: 'item'
								}) || row.getValue({
									name: "salesdescription",
									join: "item"
								}),
								quantity: row.getValue('quantityuom'),
								unit: row.getValue('unit'),
								taxcodeid: row.getValue('taxcode'),
								taxcode: row.getText('taxcode'),
								taxrate: '0.160000',
								rate: parseFloat(row.getValue({
								   name: "formulanumeric",
								   formula: "{amount}/{quantityuom}"
							   })).toFixed(2),
								taxamt: parseFloat(row.getValue('taxamount')).toFixed(2),
								amount: parseFloat(row.getValue('amount')).toFixed(2),
								discount: parseFloat(row.getValue('discountamount') || 0).toFixed(2),
								satcode: itemCodeSAT,
								idcashsales: row.id,
								tipoTransaccion: row.getValue('type'),
								nombreTransaccion: row.getValue('transactionname'),
								type: row.type,
								ClaveUnidad: (row.getText({
									name: "custitem_drt_nc_unidades_medida",
									join: "item"
								}) || "E48").split(' ')[0],
								ClaveProdServ: (row.getText({
									name: "custitem_mx_txn_item_sat_item_code",
									join: "item"
								}) || "..").split(' ')[0],
								taxObj: (row.getText('custcol_mx_txn_line_sat_tax_object')||"02").split(' ')[0],
							}]
						};
						isentry = false;
   
					} else {
						jsonData.items.push({
							itemid: row.getValue({
								name: "salesdescription",
								join: "item"
							}) || "", //row.getText('item'),
							name: row.getValue({
								name: 'salesdescription',
								join: 'item'
							}) || row.getValue({
								name: "salesdescription",
								join: "item"
							}),
							quantity: row.getValue('quantityuom'),
							unit: row.getValue('unit'),
							taxcodeid: row.getValue('taxcode'),
							taxcode: row.getText('taxcode'),
							taxrate: '0.160000',
							rate: parseFloat(row.getValue({
							   name: "formulanumeric",
							   formula: "{amount}/{quantityuom}"
							})).toFixed(2),
							taxamt: parseFloat(row.getValue('taxamount')).toFixed(2),
							amount: parseFloat(row.getValue('amount')).toFixed(2),
							discount: parseFloat(row.getValue('discountamount') || 0).toFixed(2),
							satcode: itemCodeSAT,
							idcashsales: row.id,
							tipoTransaccion: row.getValue('type'),
							nombreTransaccion: row.getValue('transactionname'),
							type: row.type,
							ClaveUnidad: (row.getText({
								name: "custitem_drt_nc_unidades_medida",
								join: "item"
							}) || "E48").split(' ')[0],
							ClaveProdServ: (row.getText({
								name: "custitem_mx_txn_item_sat_item_code",
								join: "item"
							}) || "..").split(' ')[0],
							taxObj: (row.getText('custcol_mx_txn_line_sat_tax_object')||"02").split(' ')[0],
						});
					}
   
				});
				rangini = rangend;
				rangend += 1000;
				schResultRange = searchRecord.run().getRange({
					start: rangini,
					end: rangend
				});
   
			} while (schResultRange.length > 0);
		 }

		 

		 if (jsonData) {
			 jsonData.subtot = subtot.toFixed(2);
			 jsonData.taxtot = taxtot.toFixed(2);
			 jsonData.total = ((total + taxtot) - destot).toFixed(2);
			 jsonData.destot = destot.toFixed(2);
		 }
/*
		 if(jsonData.satNombreRegistrado === "PUBLICO EN GENERAL"){
			log.debug("subtot", subtot);
			let subtotFinal = trunc(subtot, 2);
			log.debug("subtotFinal", subtotFinal);
			jsonData.proceso = 2,
			jsonData.items = [{
				itemid : "VENTAa",
				name : "VENTA",
				quantity : 1,
				unit : "ACTIVIDAD",
				// taxcodeid
				// taxcode
				taxrate : '0.160000',
				rate : subtotFinal,
				taxamt : trasladoImporte.toFixed(2),
				amount : subtotFinal,
				discount : "0.00", //duro
				// satcode
				idcashsales : idCashsalesArray,
				tipoTransaccion : "CashSale", //duro
				// nombreTransaccion : No se requiere
				ClaveUnidad : "ACT", //item.custitem_drt_nc_unidades_medida;
				ClaveProdServ : "01010101", //item.custitem_mx_txn_item_sat_item_code;
				taxObj : "02", //custcol_mx_txn_line_sat_tax_object;
			}]
		 }*/

		 log.audit('Remaining Usage', runtime.getCurrentScript().getRemainingUsage());
	 }

	 function trunc (x, posiciones = 0) {
		var s = x.toString()
		var l = s.length
		var decimalLength = s.indexOf('.') + 1
	  
		if (l - decimalLength <= posiciones){
		  return x
		}
		var isNeg  = x < 0
		var decimal =  x % 1
		var entera  = isNeg ? Math.ceil(x) : Math.floor(x)
		var decimalFormated = Math.floor(
		  Math.abs(decimal) * Math.pow(10, posiciones)
		)
		var finalNum = entera + ((decimalFormated / Math.pow(10, posiciones))*(isNeg ? -1 : 1))
		
		return finalNum
	  }
	  
	 

	 function createFileXML(xml) {

		 var date = new Date();
		 date = getFormatDateXML(date);

		 var fileObj = file.create({
			 name: 'XML' + date,
			 fileType: file.Type.XMLDOC,
			 contents: xml,
			 description: 'XML SAT',
			 encoding: file.Encoding.UTF8,
			 folder: runtime.getCurrentScript().getParameter('custscript_drt_glb_folder'),
			 isOnline: true
		 });
		 var fileId = fileObj.save();
		 log.audit({
			 title: 'fileId',
			 details: JSON.stringify(fileId)
		 });
		 return fileId;
	 }

	 function createFile(param_name, param_fileType, param_contents, param_description, param_encoding, param_folder) {
		 try {
			 log.audit({
				 title: 'createFile',
				 details: ' param_name: ' + JSON.stringify(param_name) +
					 ' param_fileType: ' + JSON.stringify(param_fileType) +
					 ' param_contents: ' + JSON.stringify(param_contents) +
					 ' param_description: ' + JSON.stringify(param_description) +
					 ' param_encoding: ' + JSON.stringify(param_encoding) +
					 ' param_folder: ' + JSON.stringify(param_folder)
			 });
			 var respuesta = {
				 success: false,
				 data: '',
				 error: []
			 };


			 var fileObj = file.create({
				 name: param_name,
				 fileType: param_fileType,
				 contents: param_contents,
				 description: param_description,
				 encoding: param_encoding,
				 folder: param_folder,
				 isOnline: true
			 });
			 respuesta.data = fileObj.save() || '';
			 respuesta.success = respuesta.data != '';

		 } catch (error) {
			 respuesta.error.push(JSON.stringify(error));
			 log.error({
				 title: 'error createFile',
				 details: JSON.stringify(error)
			 });
		 } finally {
			 log.emergency({
				 title: 'respuesta createFile',
				 details: JSON.stringify(respuesta)
			 });
			 return respuesta;
		 }
	 }

	 function execute(context) {


		 try {
			 log.audit('Remaining Usage init execute', runtime.getCurrentScript().getRemainingUsage());
			 var test = false;
			 log.audit({
				title: 'execute 4',
				details: JSON.stringify(context)
			});
			// obtengo la transaccion 
			var getData = getAllRecords();
			log.audit('getData', getData);
			// informacion obtenida guardarla en un custom 

			 if (!jsonData) {
				 log.debug('Message', 'No se encontraron resultados en la busqueda.');
				 return;
			 }
			 var resultGUID = runtime.getCurrentScript().getParameter('custscript_drt_glb_uuid') || null;
			 if (runtime.getCurrentScript().getParameter('custscript_drt_glb_folio')) {
				 jsonData.idsetfol = runtime.getCurrentScript().getParameter('custscript_drt_glb_folio');
			 }

			 log.debug('resultGUID', resultGUID);

			 jsonData.cfdi = getDataSAT('customrecord_mx_sat_cfdi_usage', runtime.getCurrentScript().getParameter('custscript_drt_glb_usagecfdi'));
			 //jsonData.payform = '99'; //runtime.getCurrentScript().getParameter('custscript_drt_glb_payform_sat');
			 //jsonData.payform = runtime.getCurrentScript().getParameter('custscript_drt_glb_payform_sat');
			 jsonData.payform = getDataSAT('customrecord_mx_mapper_values', runtime.getCurrentScript().getParameter('custscript_drt_glb_payform_sat'));
			 //jsonData.paymeth = getDataSAT('customrecord_mx_mapper_values', runtime.getCurrentScript().getParameter('custscript_drt_glb_paymethod_sat'));
			 jsonData.paymeth = getDataSAT('customrecord_mx_sat_payment_term', runtime.getCurrentScript().getParameter('custscript_drt_glb_paymethod_sat'));
			 // formateo la fecha de registro
			 var today = new Date();
			 if (runtime.getCurrentScript().getParameter('custscript_drt_glb_createdate')) {
				 today = runtime.getCurrentScript().getParameter('custscript_drt_glb_createdate');
			 }
			 log.debug("today", today);
			 jsonData.today = getFormatDateXML(today);

			 log.debug("jsonData.today", jsonData.today);

			 var setupConfig = getSetupCFDI(jsonData.subsidiary);
			 if (setupConfig) {
				 jsonData.rfcemisor = setupConfig.rfcemisor;
				 jsonData.regfiscal = setupConfig.regfiscal;
				 jsonData.razonsoc = setupConfig.razonsoc;
				 jsonData.codigoPostalEmisor = setupConfig.codigoPostalEmisor;
			 }
			 // Cargo la configuracion del PAC
			 var mySuiteConfig = record.load({
				 type: 'customrecord_mx_pac_connect_info',
				 id: runtime.getCurrentScript().getParameter('custscript_drt_glb_requestor')
			 });
			 log.audit("mySuiteConfig", mySuiteConfig);
			 var url = mySuiteConfig.getValue('custrecord_mx_pacinfo_url') || '';
			 log.audit({
				 title: 'url',
				 details: JSON.stringify(url)
			 });
			 
			 // URL para proceso asyncrono (masivo)
			 //var urlAsync = 'https://async.mysuitetest.com/factwsfront.asmx'; //SANDBOX
			 var urlAsync = 'https://async.mysuitecfdi.com/factwsfront.asmx'; //PRODUCCION
             
			 //  URL para proceso syncrono (normal)
			 //var urlSync = 'https://www.mysuitetest.com/mx.com.fact.wsfront/FactWSFront.asmx'; //SANDBOX
			 var urlSync = 'https://www.mysuitecfdi.com/mx.com.fact.wsfront/FactWSFront.asmx'; //PRODUCC

			 var idFiscal = mySuiteConfig.getValue('custrecord_mx_pacinfo_taxid') || '';
			 
			 var userName = mySuiteConfig.getValue('custrecord_mx_pacinfo_username')
			 var requestor = mySuiteConfig.getValue('custrecord_mx_pacinfo_username') || '';
			 var user = mySuiteConfig.getValue('custrecord_mx_pacinfo_username') || '';

			 log.audit({
				 title: 'jsonData',
				 details: JSON.stringify(jsonData)
			 });
			 var articulos = jsonData.items;
			 log.audit("articulos", articulos);
			 var conteoArticulos = articulos.length;

/*				if(conteoArticulos <= 1265){
				 OPERATION = 'CONVERT_NATIVE_XML';
				 log.debug("CONVERT_NATIVE_XML", conteoArticulos);
			 } else {
				 OPERATION = 'ASYNC_CONVERT_NATIVE_XML';
				 log.debug("ASYNC_CONVERT_NATIVE_XML", conteoArticulos);
			 }*/
			 
			 if (!resultGUID) {
				 // armo el xml
				 var xmlStr = getXMLHead(userName);
				 var date = new Date();
				 date = getFormatDateXML(date);

				 var idFileXML = createFile(
					 'XML__' + date,
					 file.Type.XMLDOC,
					 xmlStr,
					 'XML SAT',
					 file.Encoding.UTF8,
					 runtime.getCurrentScript().getParameter('custscript_drt_glb_folder')
				 );
				 
				 // Se carga el xml recién creado
				 var createdXml = file.load({
					id: idFileXML.data
				});
				// Si pesa más de 1 mb, debe enviarse por ASYNC_CONVERT_NATIVE_XML
				// Caso contrario, se usará la operación CONVERT_NATIVE_XML
				if ( createdXml.size >= 1000000 ) {
					log.debug('INFO', 'El archivo debe enviarse de forma asíncrona');
					var identifier = Date.now();// ID único por cada petición del asíncrona
					var operation = 'ASYNC_CONVERT_NATIVE_XML';
					// convertir el xml a base 64
					var xmlStrB64 = encode.convert({
						string: createdXml.getContents(),
						// string: xmlStr,
						inputEncoding: encode.Encoding.UTF_8,
						outputEncoding: encode.Encoding.BASE_64
					});
					
					var xmlConverNative = getAsyncConvertNativeXml(xmlStrB64, jsonData.rfcemisor, identifier, requestor, userName, user, operation);
					var headers = {
						'Content-Type' : 'text/xml; charset=utf-8',
						'Content-Length' : '"' + xmlConverNative.length + '"',
						'SOAPAction' : 'http://www.fact.com.mx/schema/ws/RequestTransaction',
					};
					// ASYNC_CONVERT_NATIVE_XML
					var serviceResponse = https.post({
						url: urlAsync,
						body: xmlConverNative,
						headers: headers
					});
					// Response ASYNC_CONVERT_NATIVE_XML
					var responseText = serviceResponse.body;
					log.debug('responseText', JSON.stringify(responseText));
					var fileResponseTxt = file.create({
						name: 'txt_response_convert_nat_xml'.concat(identifier),
						fileType: file.Type.PLAINTEXT,
						contents: responseText,
						description: 'Respuesta sat ASYNC_CONVERT_NATIVE_XML',
						encoding: 'UTF-8',
						// folder: 504,
						folder: runtime.getCurrentScript().getParameter('custscript_drt_glb_folder'),
						isOnline: true
					});
					fileResponseTxt.save();
					// Se obtienen los parámetros de la respuesta de la solicitud asíncrona
					var xmlResponse = xml.Parser.fromString({
						text: responseText
					});
					log.audit("xmlResponse", xmlResponse);
					// Nodo con la data general de la petición
					var nodeResponse = xmlResponse.getElementsByTagName({
						tagName: 'Response'
					})[0];
					// Nodo con el ID de la solicitud
					var nodeResponseData = xmlResponse.getElementsByTagName({
						tagName: 'ResponseData'
					})[0];
					log.audit("nodeResponse", nodeResponse);
					log.audit("nodeResponseData", nodeResponseData);
					// Significa que si hay respuesta positiva del SAT
					if ( nodeResponse && nodeResponseData) {
						var xmlObj = {};
						var id = nodeResponseData.getElementsByTagName({
							tagName: 'ResponseData1'
						})[0];
						var code = nodeResponse.getElementsByTagName({
							tagName: 'Code'
						})[0];
						// Se obtiene el código de error
						var codeId = (code && code.textContent ? code.textContent : null);
						if ( codeId == null ) {// Error en petición asíncrona
							log.audit('FALLA_DE_VALIDACION_SAT', 'Ocurrió un error al enviar la petición asyncrona del SAT.');
							objUpdate.custrecord_drt_status = 'Ocurrió un error al enviar la petición asyncrona del SAT.';
							return;
						} else if ( codeId == 1 ) {// Petición exitosa pero pendiente de procesar
							log.debug('id', id.textContent);
							log.debug('codeId', codeId);
							let serial = getSerialNumber(jsonData.subsidiary);
							xmlObj['id'] = id.textContent;
							// xmlObj['xml'] = xmlResponse;
							xmlObj['xml'] = responseText;// Respuesta directa del SAT
							xmlObj['code'] = codeId;
							xmlObj['status'] = 1;
							xmlObj['folder'] = runtime.getCurrentScript().getParameter('custscript_drt_glb_folder');
							xmlObj['pac_id'] = runtime.getCurrentScript().getParameter('custscript_drt_glb_requestor') || null;
							xmlObj['rfc_emisor'] = jsonData.rfcemisor;
							xmlObj['set_ser_id'] = serial.id;
							xmlObj['reg_fact_id'] = runtime.getCurrentScript().getParameter('custscript_drt_glb_registro_facturacion') || null;
							var recordAsynxXmlId = saveAsyncXmlSatRecord(xmlObj);
							objUpdate.custrecord_drt_documento_xml = idFileXML.data;// Se almacena el ID del documento XML generado
							objUpdate.custrecord_drt_status = "SUCCESS";
							log.debug('recordAsynxXmlId', recordAsynxXmlId);
						} else {// Error en datos de la petición (3196)
							log.debug('Error', 'Algo salió mal en la respuesta del SAT, ID de registro duplicado');
							objUpdate.custrecord_drt_status = id;// En este caso, id retorna un mensaje de error
							return;
						}
					} else {
						objUpdate.custrecord_drt_status = 'Ocurrió un error al enviar la petición asyncrona del SAT.';
						log.debug('Error', 'Algo salió mal en la respuesta del SAT y no procede a guardarse el registro');
						return;
					}
				} else {// Código de legado 

				 // var idFileXML = createFileXML(xmlStr);
				 log.debug("idFileXML", idFileXML);

				 log.audit({
					 title: 'xmlStr',
					 details: JSON.stringify(xmlStr)
				 });
				 // convertir el xml a base 64
				 var xmlStrB64 = encode.convert({
					 string: xmlStr,
					 inputEncoding: encode.Encoding.UTF_8,
					 outputEncoding: encode.Encoding.BASE_64
				 });
				 // Envio el xml
				 var req = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://www.fact.com.mx/schema/ws">';
				 req += '   <soapenv:Header/>';
				 req += '   <soapenv:Body>';
				 req += '      <ws:RequestTransaction>';
				 req += '         <ws:Requestor>' + requestor + '</ws:Requestor>';
				 req += '         <ws:Transaction>' + OPERATION + '</ws:Transaction>';
				 req += '         <ws:Country>MX</ws:Country>';
				 req += '         <ws:Entity>' + jsonData.rfcemisor + '</ws:Entity>';
				 // req += '         <ws:Entity>XAXX010101000</ws:Entity>';
				 req += '         <ws:User>' + user + '</ws:User>';
				 req += '         <ws:UserName>' + userName + '</ws:UserName>';
				 req += '         <ws:Data1> ' + xmlStrB64 + ' </ws:Data1>';
				 req += '         <ws:Data2>PDF XML</ws:Data2>';
				 req += '         <ws:Data3></ws:Data3>';
				 req += '      </ws:RequestTransaction>';
				 req += '   </soapenv:Body>';
				 req += '</soapenv:Envelope>';

				 var headers = {
					 'Content-Type': 'text/xml; charset=utf-8',
					 'Content-Length': '"' + req.length + '"',
					 'SOAPAction': 'http://www.fact.com.mx/schema/ws/RequestTransaction',
				 };

				 log.audit({
					 title: 'url',
					 details: JSON.stringify(url)
				 });
				 log.audit({
					 title: 'req',
					 details: JSON.stringify(req)
				 });
				 log.audit({
					 title: 'headers',
					 details: JSON.stringify(headers)
				 });

				 if (!test) {
					 var serviceResponse = https.post({
						 url: urlSync,
						 body: req,
						 headers: headers
					 });
					 // Obtengo el resultado
					 var responseText = serviceResponse.body;
					 log.audit({
						 title: 'responseText',
						 details: JSON.stringify(responseText)
					 });

					 var resp = createFile(
						 'serviceResponse ' + date,
						 file.Type.PLAINTEXT,
						 responseText,
						 'Respuesta SAT',
						 file.Encoding.UTF8,
						 runtime.getCurrentScript().getParameter('custscript_drt_glb_folder')
					 );

					 var xml_response = xml.Parser.fromString({
						 text: responseText
					 });
					 log.audit("xml_response", xml_response);

					 var nodeResponse = xml_response.getElementsByTagName({
						 tagName: 'Response'
					 })[0];
					 log.audit("nodeResponse", nodeResponse);
					 // verifico el resultado de la solicitud
					 var result = nodeResponse.getElementsByTagName({
						 tagName: 'Result'
					 })[0].textContent;
					 log.audit("resultado", result);

					 if (result == 'false') {
						 var description = nodeResponse.getElementsByTagName({
							 tagName: 'Data'
						 })[0].textContent;

						 log.audit('FALLA_DE_VALIDACION_SAT', description);

						 objUpdate.custrecord_drt_status = description;

						 return;
					 } else {

						 // proceso de forma correcta
						 resultGUID = nodeResponse.getElementsByTagName({
							 tagName: 'DocumentGUID'
						 })[0].textContent;

						 var responseData1 = xml_response.getElementsByTagName({
							 tagName: 'ResponseData1'
						 })[0].textContent;

						 var responseData2 = xml_response.getElementsByTagName({
							 tagName: 'ResponseData3'
						 })[0].textContent;

						 var newRecord = record.create({
							 type: 'customrecord_drt_global_invoice_response',
							 isDynamic: true
						 });
						 // Agrego el registro personalizado
						  
						 //newRecord.setValue({
						 //	fieldId: 'custrecord_drt_json_data',
						 //	value: JSON.stringify(jsonData)
						 //});
						 //newRecord.setValue({
						 //	fieldId: 'custrecord_drt_base64_xml',
						 //	value: responseData1
						 //}); 
						 
						 var resp = {};
						 var resppdf = {};
						 if (responseData1) {// Se guarda el XML timbrado
							 resp = createFile(
								 "XML_"+resultGUID,
								 file.Type.XMLDOC,
								 encode.convert({
									 string: responseData1,
									 inputEncoding: encode.Encoding.BASE_64,
									 outputEncoding: encode.Encoding.UTF_8
								 }),
								 'XML Certificado',
								 file.Encoding.UTF8,
								 runtime.getCurrentScript().getParameter('custscript_drt_glb_folder')
							 ) || '';
						 }
						 if (responseData2) {// Se guarda el PDF timbrado
							 resppdf = createFile(
								 "PDF_"+resultGUID,
								 file.Type.PDF,
								 responseData2,
								 'PFD Certificado',
								 file.Encoding.UTF8,
								 runtime.getCurrentScript().getParameter('custscript_drt_glb_folder')
							 ) || '';
						 }

						 //newRecord.setValue({fieldId: 'custrecord_drt_base64_pdf', value: responseData2});
						 if (resp.success) {
							 newRecord.setValue({
								 fieldId: 'custrecord_drt_xml_sat',
								 value: resp.data
							 });
						 }
						 if (resppdf.success) {
							 newRecord.setValue({
								 fieldId: 'custrecord_drt_pdf_sat',
								 value: resppdf.data
							 });
						 }
						 if (idFileXML.success) {
							 newRecord.setValue({
								 fieldId: 'custrecord_drt_doc_xml',
								 value: idFileXML.data
							 });
						 }
						 newRecord.setValue({
							 fieldId: 'custrecord_drt_guid',
							 value: resultGUID
						 });
						 var recordId = newRecord.save({
							 enableSourcing: true,
							 ignoreMandatoryFields: true
						 });

						 log.debug("recordId: ", recordId);

					 }
				 }
			 
			 if (!test) {

				//var idRegistroFacturacion = runtime.getCurrentScript().getParameter('custscript_drt_glb_registro_facturacion') || null;
				 objUpdate.custrecord_drt_xml_generado = resp.data;
				 objUpdate.custrecord_drt_pdf_generado = resppdf.data;
				 objUpdate.custrecord_drt_documento_xml = idFileXML.data;
				 objUpdate.custrecord_drt_status = "SUCCESS";
				 objUpdate.custrecord_drt_uuid = resultGUID;
				 // Actualizo las transaaciones con los datos de la factura global
				 var objSubmit = {
					custbody_mx_cfdi_uuid: resultGUID,
					//  custbody_drt_registro_factura_global: idRegistroFacturacion,
					//  custbody_drt_psg_ei_generated_edoc: idFileXML.data,
					custbody_psg_ei_certified_edoc: resp.data,
					custbody_edoc_generated_pdf: resppdf.data,
					//  custbody_psg_ei_status: 3,
					 // custbody_mx_cfdi_usage: value1,
					 // custbody_mx_txn_sat_payment_method: value2,
					 // custbody_mx_txn_sat_payment_term: value3,
				 };
				 if (resp.success) {
					 newRecord.setValue({
						 fieldId: 'custrecord_drt_xml_sat',
						 value: resp.data
					 });
				 }
				 if (resppdf.success) {
					 newRecord.setValue({
						 fieldId: 'custrecord_drt_pdf_sat',
						 value: resp.data
					 });
				 }
				 if (idFileXML.success) {
					 newRecord.setValue({
						 fieldId: 'custrecord_drt_doc_xml',
						 value: idFileXML.data
					 });
				 }

				 //if(jsonData.proceso != 3){
					for (var i = 0; i < jsonData.items.length; i++) {

						if (runtime.getCurrentScript().getRemainingUsage() <= 3000 && (i + 1) < jsonData.items.length) {
							var status = task.create({
								taskType: task.TaskType.SCHEDULED_SCRIPT,
								scriptId: runtime.getCurrentScript().id,
								deploymentId: runtime.getCurrentScript().deploymentId,
								params: {
									custscript_drt_glb_uuid: resultGUID,
									custscript_drt_glb_folio: jsonData.idsetfol
								}
							});
							if (status == 'QUEUED') {
								return;
							}
						}
						// var value1 = runtime.getCurrentScript().getParameter('custscript_drt_glb_usagecfdi');
						// var value2 = runtime.getCurrentScript().getParameter('custscript_drt_glb_payform_sat');
						// var value3 = runtime.getCurrentScript().getParameter('custscript_drt_glb_paymethod_sat');
   
						if(jsonData.items[i].tipoTransaccion == "Invoice"){
						   var tipoTransaccion = record.Type.INVOICE;
						} else if(jsonData.items[i].tipoTransaccion == "CashSale"){
						   var tipoTransaccion = record.Type.CASH_SALE;
						}
   
						var id = record.submitFields({
							type: tipoTransaccion,
							id: jsonData.items[i].idcashsales,
							values: objSubmit,
							options: {
								enableSourcing: true,
								ignoreMandatoryFields: true
							}
						});
						log.debug({
							title: 'id',
							details: JSON.stringify(id)
						});
   
					}
				 //}
				 


				 // actualizo el numero de serie
				 if (!!jsonData.idsetfol) {
					try {
						var crSerial = search.lookupFields({
							type: 'customrecord_drt_setup_serial_gi',
							id: jsonData.idsetfol,
							columns: ['custrecord_drt_current']
						});
						var nextNumber = crSerial.custrecord_drt_current || 1;
						nextNumber++;
						var id = record.submitFields({
							type: 'customrecord_drt_setup_serial_gi',
							id: jsonData.idsetfol,
							values: {
								custrecord_drt_current: nextNumber
							}
						});
					} catch (error) {
						log.error("Error idsetfol", error);
					}
				 }
			 }
			}
		}

			 log.audit('Remaining Usage end execute', runtime.getCurrentScript().getRemainingUsage());
			 log.audit('Proceso Finalizado...');
			 
		 } catch (err) {
			 log.error({
				 title: 'err',
				 details: JSON.stringify(err)
			 });
		 } finally {
			log.audit("FINALLY"); 
			 //Actualizo el CustomRecord con los Documentos y Estado final del proceso
			 var idRegistroFacturacion = runtime.getCurrentScript().getParameter('custscript_drt_glb_registro_facturacion') || null;
			 var id = record.submitFields({
				 id: idRegistroFacturacion,
				 type: "customrecord_drt_reg_facturacion_interco",
				 values: objUpdate,
			 });
			 log.audit({
				title: 'id',
				details: JSON.stringify(id)
			}); 
			 log.debug("*****TERMINO*****", "*****TERMINO***** y actualizo el registro: "+id);
		 }
	 }

	 return {
		 execute: execute
	 };
 });