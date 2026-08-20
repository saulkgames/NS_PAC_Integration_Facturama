/**
*@NApiVersion 2.1
*@NScriptType Suitelet
*@NModuleScope Public
*/

define(['N/search', 'N/record', 'N/format', 'N/runtime', 'N/https', 'N/xml', 'N/encode', 'N/config', 'N/task', 'N/xml', 'N/email', 'N/file'],
 function (search, record, format, runtime, https, xml, encode, config, task, xml, email, file) {

		const CONST_ARR_CHART = ['&', '"', '<', '>', "'", '´'];
		//const OPERATION = 'CONVERT_NATIVE_XML';
		const OPERATION = 'ASYNC_CONVERT_VERIFY';
		var jsonData = null;

		function getSerialNumber(id) {
			log.audit("getSerialNumber(id)", id);
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
			log.audit("afilters", afilters);
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
			log.audit("schRecord", schRecord);
			return schResult;
		}

		function getDataSAT(type, id) {

			var fieldName = 'name';
			if (type == 'customrecord_mx_sat_payment_term') {
				fieldName = 'custrecord_mx_sat_pt_code';
			}
			// 1 unidad
			var result = search.lookupFields({
				type: type,
				id: id,
				columns: [fieldName]
			});
			return result.name;
		}

		function getFormatDateXML(d) {
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
					razonsoc: subsidiary.getValue('name')
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
					razonsoc: configRecObj.getValue('legalname')
				};
			}
			return result;
		}

		function getXMLHead(userName) {
			log.audit("getXMLHead(userName)");
			// Obtengo el folio de la factura
			if (!jsonData.idsetfol) {
				var idsetfol = getSerialNumber(jsonData.subsidiary);
				jsonData.idsetfol = idsetfol.id;
				log.audit("idsetfol", idsetfol);
			}

			var xmlDoc = '';
			xmlDoc += '<?xml version="1.0" encoding="UTF-8"?>';
			xmlDoc += '<fx:FactDocMX ';
			xmlDoc += 'xmlns:fx="http://www.fact.com.mx/schema/fx" ';
			xmlDoc += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
			xmlDoc += 'xsi:schemaLocation="http://www.fact.com.mx/schema/fx http://www.mysuitemex.com/fact/schema/fx_2010_f.xsd">';
			xmlDoc += '  <fx:Version>7</fx:Version>';
			xmlDoc += '  <fx:Identificacion>';
			xmlDoc += '    <fx:CdgPaisEmisor>MX</fx:CdgPaisEmisor>';
			xmlDoc += '    <fx:TipoDeComprobante>FACTURA</fx:TipoDeComprobante>';
			xmlDoc += '    <fx:RFCEmisor>' + jsonData.rfcemisor + '</fx:RFCEmisor>';
			// xmlDoc += '    <fx:RFCEmisor>XAXX010101000</fx:RFCEmisor>';
			xmlDoc += '    <fx:RazonSocialEmisor>' + jsonData.razonsoc + '</fx:RazonSocialEmisor>';
			xmlDoc += '    <fx:Usuario>' + userName + '</fx:Usuario>';
			xmlDoc += '    <fx:AsignacionSolicitada>';
			xmlDoc += '      <fx:Folio>' + idsetfol.serial + '</fx:Folio>';
			//xmlDoc += '      <fx:TiempoDeEmision>' + jsonData.today + '</fx:TiempoDeEmision>'; // 2020-11-11T00:00:00
			xmlDoc += '      <fx:TiempoDeEmision>2022-02-01T00:00:00</fx:TiempoDeEmision>'; // 2020-11-11T00:00:00
			xmlDoc += '    </fx:AsignacionSolicitada>';
			xmlDoc += '    <fx:LugarExpedicion>64780</fx:LugarExpedicion>';
			xmlDoc += '  </fx:Identificacion>';
			xmlDoc += '  <fx:Emisor>';
			xmlDoc += '    <fx:RegimenFiscal>';
			xmlDoc += '      <fx:Regimen>' + jsonData.regfiscal.split('-')[0].trim() + '</fx:Regimen>'; //601
			xmlDoc += '    </fx:RegimenFiscal>';
			xmlDoc += '  </fx:Emisor>';
			xmlDoc += '  <fx:Receptor>';
			xmlDoc += '    <fx:CdgPaisReceptor>MX</fx:CdgPaisReceptor>';
			xmlDoc += '    <fx:RFCReceptor>' + jsonData.rfcrecep + '</fx:RFCReceptor>';
			xmlDoc += '    <fx:NombreReceptor>' + jsonData.entity.replace("2 ", "").replace("1 ", "") + '</fx:NombreReceptor>';
			// xmlDoc += '    <fx:NombreReceptor>PUBLICO EN GENERAL</fx:NombreReceptor>';
			xmlDoc += '    <fx:UsoCFDI>' + jsonData.cfdi.split('-')[0].trim() + '</fx:UsoCFDI>'; //P01
			xmlDoc += '  </fx:Receptor>';
			xmlDoc += '  <fx:Conceptos>';

			var totTaxAmount = 0;
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
				xmlDoc += '      <fx:ImpuestosSAT>';
				xmlDoc += '        <fx:Traslados>';
				if (jsonData.items[i].taxcodeid == 307) {
					xmlDoc += '          <fx:Traslado Base="' + jsonData.items[i].amount + '" Impuesto="002" TipoFactor="Exento" />';
				} else {
					xmlDoc += '          <fx:Traslado Base="' + jsonData.items[i].amount + '" Importe="' + jsonData.items[i].taxamt + '" Impuesto="002" TasaOCuota="' + jsonData.items[i].taxrate + '" TipoFactor="Tasa" />';
				}
				xmlDoc += '        </fx:Traslados>';
				xmlDoc += '      </fx:ImpuestosSAT>';
				xmlDoc += '    </fx:Concepto>';
				totTaxAmount += parseFloat(jsonData.items[i].taxamt);
			}

			xmlDoc += '  </fx:Conceptos>';
			xmlDoc += '  <fx:ImpuestosSAT TotalImpuestosTrasladados="' + totTaxAmount.toFixed(2) + '">';
			xmlDoc += '    <fx:Traslados>';
			xmlDoc += '      <fx:Traslado Importe="' + totTaxAmount.toFixed(2) + '" Impuesto="002" TasaOCuota="' + jsonData.items[0].taxrate + '" TipoFactor="Tasa" />';
			xmlDoc += '    </fx:Traslados>';
			xmlDoc += '  </fx:ImpuestosSAT>';
			xmlDoc += '  <fx:Totales>';
			xmlDoc += '    <fx:Moneda>' + jsonData.currency + '</fx:Moneda>';
			xmlDoc += '    <fx:TipoDeCambioVenta>' + jsonData.exchange + '</fx:TipoDeCambioVenta>';
			xmlDoc += '    <fx:SubTotalBruto>' + jsonData.subtot + '</fx:SubTotalBruto>';
			xmlDoc += '    <fx:SubTotal>' + jsonData.subtot + '</fx:SubTotal>';
			xmlDoc += '    <fx:Descuento>' + jsonData.destot + '</fx:Descuento>';
			xmlDoc += '    <fx:Total>' + jsonData.total + '</fx:Total>';
			xmlDoc += '    <fx:TotalEnLetra>-</fx:TotalEnLetra>';
			xmlDoc += '    <fx:FormaDePago>' + jsonData.payform + '</fx:FormaDePago>';
			xmlDoc += '  </fx:Totales>';
			xmlDoc += '  <fx:ComprobanteEx>';
			xmlDoc += '    <fx:TerminosDePago>';
			xmlDoc += '      <fx:MetodoDePago>PPD</fx:MetodoDePago>';
			xmlDoc += '    </fx:TerminosDePago>';
			xmlDoc += '  </fx:ComprobanteEx>';
			xmlDoc += '</fx:FactDocMX>';

			return xmlDoc;
		}

		// function getAllRecords() {
		function getAllRecords() {
			log.audit('Remaining Usage init getAllRecords', runtime.getCurrentScript().getRemainingUsage());
			/*var rangini = 0;
			var rangend = 1000;
			var subtot = 0;
			var taxtot = 0;
			var total = 0;
			var destot = 0;
			var isentry = true;
			var sourceId = runtime.getCurrentScript().getParameter('custscript_drt_glb_search');
			log.audit("sourceId", sourceId);
			// cargo la busqueda guardada
			var searchRecord = search.load({
				id: sourceId
			});
			log.audit("searchRecord", searchRecord);

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
			}*/

			// var filters = searchRecord.filters;
			// var afilterOne = search.createFilter({
			// 	name: 'trandate',
			// 	operator: search.Operator.WITHIN,
			// 	values: [today, today]
			// });
			// filters.push(afilterOne);

			var schResultRange = searchRecord.run().getRange({
				start: rangini,
				end: rangend
			});
			log.audit('schResultRange', schResultRange.length);
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

					if (isentry == true) {
						jsonData = {
							subsidiary: row.getValue('subsidiary'),
							trandate: row.getValue('trandate'),
							tranid: row.getValue('tranid'),
							entity: row.getText('entity'),
							// rfcrecep: 'XAXX010101000', 
							rfcrecep: row.getValue('custbody_mx_customer_rfc'),
							currency: 'MXN',
							exchange: parseInt(row.getValue('exchangerate')),
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
									name: "custitem_dtt_skuproducteca",
									join: "item"
								}) || "", //row.getText('item'),
								name: row.getValue({
									name: 'salesdescription',
									join: 'item'
								}) || row.getValue({
									name: "custitem_dtt_skuproducteca",
									join: "item"
								}),
								quantity: row.getValue('quantity'),
								unit: row.getValue('unit'),
								taxcodeid: row.getValue('taxcode'),
								taxcode: row.getText('taxcode'),
								taxrate: '0.160000',
								rate: parseFloat(row.getValue('rate')).toFixed(2),
								taxamt: parseFloat(row.getValue('taxamount')).toFixed(2),
								amount: parseFloat(row.getValue('amount')).toFixed(2),
								discount: parseFloat(row.getValue('discountamount') || 0).toFixed(2),
								satcode: itemCodeSAT,
								idcashsales: row.id,
								type: row.type,
								ClaveUnidad: (row.getValue({
									name: "custitem_drt_nc_units_2",
									join: "item"
								}) || ";").split(';')[1],
								ClaveProdServ: (row.getValue({
									name: "custitem_drt_nc_units_2",
									join: "item"
								}) || ";").split(';')[0]

							}]
						};
						isentry = false;

					} else {
						jsonData.items.push({
							itemid: row.getValue({
								name: "custitem_dtt_skuproducteca",
								join: "item"
							}) || "", //row.getText('item'),
							name: row.getValue({
								name: 'salesdescription',
								join: 'item'
							}) || row.getValue({
								name: "custitem_dtt_skuproducteca",
								join: "item"
							}),
							quantity: row.getValue('quantity'),
							unit: row.getValue('unit'),
							taxcodeid: row.getValue('taxcode'),
							taxcode: row.getText('taxcode'),
							taxrate: '0.160000',
							rate: parseFloat(row.getValue('rate')).toFixed(2),
							taxamt: parseFloat(row.getValue('taxamount')).toFixed(2),
							amount: parseFloat(row.getValue('amount')).toFixed(2),
							discount: parseFloat(row.getValue('discountamount') || 0).toFixed(2),
							satcode: itemCodeSAT,
							idcashsales: row.id,
							type: row.type,
							ClaveUnidad: (row.getValue({
								name: "custitem_drt_nc_units_2",
								join: "item"
							}) || ";").split(';')[1],
							ClaveProdServ: (row.getValue({
								name: "custitem_drt_nc_units_2",
								join: "item"
							}) || ";").split(';')[0]
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

			if (jsonData) {
				jsonData.subtot = subtot.toFixed(2);
				jsonData.taxtot = taxtot.toFixed(2);
				jsonData.total = ((total + taxtot) - destot).toFixed(2);
				jsonData.destot = destot.toFixed(2);
			}
			log.audit('Remaining Usage', runtime.getCurrentScript().getRemainingUsage());
		}

		/*function createFileXML(xml) {

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
		}*/

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
				var parametros = context.request.parameters;
				log.audit("parametros", parametros);

				var facturas = parametros.idFactura;
				log.audit("facturas", facturas);

				// obtengo la transaccion
				var getData = getAllRecords();
				log.audit('getData', getData);
				// informacion obtenida guardarla en un custom

				if (!jsonData) {
					log.debug('Message', 'No se encontraron resultados en la busqueda.');
					return;
				}
				var resultGUID = runtime.getCurrentScript().getParameter('custscript_drt_glb_uuid_') || null;
				if (runtime.getCurrentScript().getParameter('custscript_drt_glb_folio_')) {
					jsonData.idsetfol = runtime.getCurrentScript().getParameter('custscript_drt_glb_folio_');
				}

				log.debug('resultGUID', resultGUID);


				jsonData.cfdi = getDataSAT('customrecord_mx_sat_cfdi_usage', runtime.getCurrentScript().getParameter('custscript_drt_glb_usagecfdi_'));
				jsonData.payform = '99'; //runtime.getCurrentScript().getParameter('custscript_drt_glb_payform_sat');
				
				jsonData.paymeth = getDataSAT('customrecord_mx_mapper_values', runtime.getCurrentScript().getParameter('custscript_drt_glb_paymethod_sat_'));
				// formateo la fecha de registro
				var today = new Date();
				if (runtime.getCurrentScript().getParameter('custscript_drt_glb_createdate_')) {
					today = runtime.getCurrentScript().getParameter('custscript_drt_glb_createdate_');
				}
				jsonData.today = getFormatDateXML(today);

				var setupConfig = getSetupCFDI(jsonData.subsidiary);
				if (setupConfig) {
					jsonData.rfcemisor = setupConfig.rfcemisor;
					jsonData.regfiscal = setupConfig.regfiscal;
					jsonData.razonsoc = setupConfig.razonsoc;
				}
				// Cargo la configuracion del PAC
				var mySuiteConfig = record.load({
					type: 'customrecord_mx_pac_connect_info',
					id: runtime.getCurrentScript().getParameter('custscript_drt_glb_requestor_')
				});
				var url = mySuiteConfig.getValue('custrecord_mx_pacinfo_url') || '';
				log.audit({
					title: 'url',
					details: JSON.stringify(url)
				});
				// var url = 'https://www.mysuitetest.com/mx.com.fact.wsfront/FactWSFront.asmx';
				// URL para utilizar el servicio Asíncrono
				url = 'https://async.mysuitetest.com/factwsfront.asmx';
				var idFiscal = mySuiteConfig.getValue('custrecord_mx_pacinfo_taxid') || '';
				// var userName = 'ADMIN'; 
				// var requestor = '0c320b03-d4f1-47bc-9fb4-77995f9bf33e'; 
				// var user = '0c320b03-d4f1-47bc-9fb4-77995f9bf33e'; 
				var userName = mySuiteConfig.getValue('custrecord_mx_pacinfo_username')
				var requestor = mySuiteConfig.getValue('custrecord_mx_pacinfo_username') || '';
				var user = mySuiteConfig.getValue('custrecord_mx_pacinfo_username') || '';

				log.audit({
					title: 'jsonData',
					details: JSON.stringify(jsonData)
				});
				
				if (!resultGUID) {
					// armo el xml
					log.audit("!resultGUID");
					var xmlStr = getXMLHead(userName);
					log.audit("xmlStr", xmlStr);
					var date = new Date();
					log.audit("date", date);
					date = getFormatDateXML(date);

					var idFileXML = createFile(
						'XML' + date,
						file.Type.XMLDOC,
						xmlStr,
						'XML SAT',
						file.Encoding.UTF8,
						runtime.getCurrentScript().getParameter('custscript_drt_glb_folder_')
					);
					log.audit("idFileXML doc", idFileXML);
					// var idFileXML = createFileXML(xmlStr);
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
							url: url,
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
							runtime.getCurrentScript().getParameter('custscript_drt_glb_folder_')
						);
						log.audit("resp", resp);

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
						log.audit("resultt", result);

						if (result == 'false') {
							var description = nodeResponse.getElementsByTagName({
								tagName: 'Data'
							})[0].textContent;

							log.audit('FALLA_DE_VALIDACION_SAT', description);
							return;
						} else {

							// proceso de forma correcta
							resultGUID = nodeResponse.getElementsByTagName({
								tagName: 'DocumentGUID'
							})[0].textContent;

							var responseData1 = xml_response.getElementsByTagName({
								tagName: 'ResponseData1'
							})[0].textContent;
							log.audit("responseData1", responseData1);

							var responseData2 = xml_response.getElementsByTagName({
								tagName: 'ResponseData3'
							})[0].textContent;
							log.audit("responseData2", responseData2);

							var newRecord = record.create({
								type: 'customrecord_drt_global_invoice_response',
								isDynamic: true
							});
							log.audit("newRecord", newRecord);

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
							if (responseData1) {
								log.audit("if responseData1");
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
									runtime.getCurrentScript().getParameter('custscript_drt_glb_folder_')
								) || '';
								log.audit("if responseData1 fin XML", resp);
							}

							if (responseData2) {
								log.audit("if responseData2");
								resppdf = createFile(
									"PDF_"+resultGUID,
									file.Type.PDF,
									responseData2,
									'PFD Certificado',
									file.Encoding.UTF8,
									runtime.getCurrentScript().getParameter('custscript_drt_glb_folder_')
								) || '';
								log.audit("if responseData2 fin PDF", resppdf);
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
									value: resp.data
								});
							}
							if (idFileXML.success) {
								newRecord.setValue({
									fieldId: 'custrecord_drt_doc_xml',
									value: idFileXML.data
								});
								try {
									email.send({
										//author: 1729,
										author: 1729,
										recipients: ['facturacion@zapateriascandy.com.mx', 'iztac.amaya@disruptt.mx'],
										subject: 'Timbrado Intercompañia ' + jsonData.rfcemisor,
										body: 'Factura Global ' + resultGUID,
										attachments: [file.load({
											id: idFileXML.data
										})],

									});
									log.audit("email success")
								} catch (error) {
									log.error({
										title: 'error email',
										details: JSON.stringify(error)
									});
								}
							}
							newRecord.setValue({
								fieldId: 'custrecord_drt_guid',
								value: resultGUID
							});
							var recordId = newRecord.save({
								enableSourcing: true,
								ignoreMandatoryFields: true
							});

						}
					}
				}
				
				if (!test) {
					log.audit("!test, !test");
					// Actualizo las transaaciones con los datos de la factura global
					var objSubmit = {
						custbody_mx_cfdi_uuid: resultGUID,
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
					for (var i = 0; i < jsonData.items.length; i++) {

						/*if (runtime.getCurrentScript().getRemainingUsage() <= 3000 && (i + 1) < jsonData.items.length) {
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
						}*/
						// var value1 = runtime.getCurrentScript().getParameter('custscript_drt_glb_usagecfdi');
						// var value2 = runtime.getCurrentScript().getParameter('custscript_drt_glb_payform_sat');
						// var value3 = runtime.getCurrentScript().getParameter('custscript_drt_glb_paymethod_sat');

						var id = record.submitFields({
							type: record.Type.INVOICE,
							id: jsonData.items[i].idcashsales,
							values: objSubmit,
							options: {
								enableSourcing: true,
								ignoreMandatoryFields: true
							}
						});
						log.audit({
							title: 'id',
							details: JSON.stringify(id)
						});

					}
					// actualizo el numero de serie
					if (jsonData.idsetfol) {
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
					}
				}
				log.audit('Remaining Usage end execute', runtime.getCurrentScript().getRemainingUsage());
				log.audit('Proceso Finalizado...');
				
			} catch (err) {
				log.error({
					title: 'err',
					details: JSON.stringify(err)
				});
			}
		}

		return {
			onRequest: execute
		};
	});