/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @description Controlador Principal: Suitelet para Generación de Facturas Globales.
 */
define([
    'N/runtime', 
    'N/file', 
    'N/encode', 
    './drt_ns_repository', 
    './drt_xml_builder', 
    './drt_pac_client'
], function (runtime, file, encode, repository, XmlFacturaBuilder, PacApiClient) {

    const execute = (context) => {
        try {
            log.audit('Iniciando Proceso Facturación Global', { governance: runtime.getCurrentScript().getRemainingUsage() });
            const scriptObj = runtime.getCurrentScript();
            
            // 1. Obtención de Parámetros
            const searchId = scriptObj.getParameter({ name: 'custscript_drt_glb_search' });
            const folderId = scriptObj.getParameter({ name: 'custscript_drt_glb_folder_' });
            const requestId = scriptObj.getParameter({ name: 'custscript_drt_glb_requestor_' });
            const usageCfdiParam = scriptObj.getParameter({ name: 'custscript_drt_glb_usagecfdi_' });
            const payMethodParam = scriptObj.getParameter({ name: 'custscript_drt_glb_paymethod_sat_' });
            const customCreateDate = scriptObj.getParameter({ name: 'custscript_drt_glb_createdate_' });
            const manualFolio = scriptObj.getParameter({ name: 'custscript_drt_glb_folio_' });
            const existingGuid = scriptObj.getParameter({ name: 'custscript_drt_glb_uuid_' });

            // 2. Extraer Registros de Facturas (Dominio)
            const rawData = repository.getInvoiceRecords(searchId);
            if (!rawData) {
                log.debug('Manejo de flujo', 'No se encontraron resultados en la búsqueda.');
                return;
            }

            // 3. Obtener metadatos de configuración
            const cfdiUsage = repository.getDataSAT('customrecord_mx_sat_cfdi_usage', usageCfdiParam);
            const payMethod = repository.getDataSAT('customrecord_mx_mapper_values', payMethodParam);
            const setupConfig = repository.getSetupCFDI(rawData.subsidiary);
            const serialInfo = manualFolio ? { id: manualFolio, serial: repository.getSerialNumber(rawData.subsidiary).serial } : repository.getSerialNumber(rawData.subsidiary);
            
            const emisionDate = repository.getFormatDateXML(customCreateDate || new Date());
            
            // 4. Mapear datos a la estructura del Builder
            const invoiceData = {
                emisor: { 
                    rfc: setupConfig.rfcemisor, 
                    razonSocial: setupConfig.razonsoc, 
                    regfiscal: setupConfig.regfiscal, 
                    cp: '64780' // Dato fijo original
                },
                receptor: { 
                    rfc: rawData.rfcrecep, 
                    nombre: rawData.entity.replace("2 ", "").replace("1 ", ""), 
                    usoCfdi: (cfdiUsage || '').split('-')[0].trim() 
                },
                comprobante: { 
                    userName: 'ADMIN', // Quemado en el original, idealmente debería venir del config
                    folio: serialInfo.serial, 
                    fechaEmision: emisionDate // Dato fijo en el original, sustituir por emisionDate si es dinámico.
                },
                totales: {
                    moneda: rawData.currency,
                    tipoCambio: rawData.exchange,
                    subtotal: rawData.subtot,
                    descuento: rawData.destot,
                    total: rawData.total,
                    formaPago: '99',
                    metodoPago: 'PPD'
                },
                conceptos: rawData.items
            };

            const pacConfig = repository.getPacConfiguration(requestId);
            let responseGuid = existingGuid;
            let idFileXml = { success: false, data: null };
            let xmlCertId = null, pdfCertId = null;

            // 5. Flujo de Generación (Solo si no existe ya un GUID)
            if (!responseGuid) {
                const xmlBuilder = new XmlFacturaBuilder(invoiceData);
                const xmlStr = xmlBuilder.build();

                // Guardar XML Request Localmente
                idFileXml = repository.saveFile(`XML_${emisionDate}`, file.Type.XMLDOC, xmlStr, 'XML Request SAT', folderId);

                // Integración PAC
                const pacClient = new PacApiClient(pacConfig);
                const pacResponse = pacClient.sendInvoice(xmlStr);
                responseGuid = pacResponse.guid;

                // Guardar respuesta cruda
                repository.saveFile(`Response_${emisionDate}`, file.Type.PLAINTEXT, pacResponse.rawResponse, 'Respuesta PAC', folderId);

                // Decodificar y guardar Certificados XML y PDF
                if (pacResponse.xmlBase64) {
                    const xmlUtf8 = encode.convert({ string: pacResponse.xmlBase64, inputEncoding: encode.Encoding.BASE_64, outputEncoding: encode.Encoding.UTF_8 });
                    const resXml = repository.saveFile(`XML_${responseGuid}`, file.Type.XMLDOC, xmlUtf8, 'XML Certificado', folderId);
                    xmlCertId = resXml.success ? resXml.data : null;
                }

                if (pacResponse.pdfBase64) {
                    const resPdf = repository.saveFile(`PDF_${responseGuid}`, file.Type.PDF, pacResponse.pdfBase64, 'PDF Certificado', folderId);
                    pdfCertId = resPdf.success ? resPdf.data : null;
                }

                // Guardar Registro Personalizado y Enviar Correo
                repository.createGlobalInvoiceResponse({
                    xmlId: xmlCertId,
                    pdfId: pdfCertId,
                    docXmlId: idFileXml.data,
                    guid: responseGuid
                });

                if (idFileXml.success) {
                    try {
                        repository.sendEmail(1729, ['facturacion@zapateriascandy.com.mx', 'iztac.amaya@disruptt.mx'], `Timbrado Intercompañia ${invoiceData.emisor.rfc}`, `Factura Global ${responseGuid}`, idFileXml.data);
                    } catch (e) { log.error('Error enviando correo', e); }
                }
            }

            // 6. Actualización de Registros de NetSuite
            const MAX_GOVERNANCE = 1000;
            for (let i = 0; i < rawData.items.length; i++) {
                if (scriptObj.getRemainingUsage() < MAX_GOVERNANCE) {
                    log.error('Gobernanza Excedida', 'El script ha llegado a su límite. Considera usar un Map/Reduce.');
                    break; // O encolar script programado aquí
                }
                repository.updateInvoiceFields(rawData.items[i].idcashsales, responseGuid);
            }

            if (serialInfo.id) {
                const currentNum = parseInt(serialInfo.serial.replace(/\D/g, '')) || 0; // Extracción genérica para el ejemplo
                repository.updateSerialNumber(serialInfo.id, currentNum);
            }

            log.audit('Proceso Finalizado Exitosamente', { guid: responseGuid });

        } catch (error) {
            log.error({ title: 'Ejecución Fallida', details: error.message || error });
        }
    };

    return { onRequest: execute };
});