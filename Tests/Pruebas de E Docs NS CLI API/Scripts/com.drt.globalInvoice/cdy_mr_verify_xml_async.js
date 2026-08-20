/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/config', 'N/email', 'N/encode', 'N/file', 'N/https', 'N/record', 'N/runtime', 'N/search', 'N/task', 'N/xml'],
    /**
 * @param{config} config
 * @param{email} email
 * @param{encode} encode
 * @param{file} file
 * @param{https} https
 * @param{record} record
 * @param{runtime} runtime
 * @param{search} search
 * @param{task} task
 * @param{xml} xml
 */
    (config, email, encode, file, https, record, runtime, search, task, xml) => {
        /**
         * Defines the function that is executed at the beginning of the map/reduce process and generates the input data.
         * @param {Object} inputContext
         * @param {boolean} inputContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Object} inputContext.ObjectRef - Object that references the input data
         * @typedef {Object} ObjectRef
         * @property {string|number} ObjectRef.id - Internal ID of the record instance that contains the input data
         * @property {string} ObjectRef.type - Type of the record instance that contains the input data
         * @returns {Array|Object|Search|ObjectRef|File|Query} The input data to use in the map/reduce process
         * @since 2015.2
         */

        const getInputData = (inputContext) => {
            try {
                return getPendingXmlAsync();
                
            } catch (error) {
                log.debug('Error getInputData', error);
                return[];
            }
        }

        /**
         * Defines the function that is executed when the map entry point is triggered. This entry point is triggered automatically
         * when the associated getInputData stage is complete. This function is applied to each key-value pair in the provided
         * context.
         * @param {Object} mapContext - Data collection containing the key-value pairs to process in the map stage. This parameter
         *     is provided automatically based on the results of the getInputData stage.
         * @param {Iterator} mapContext.errors - Serialized errors that were thrown during previous attempts to execute the map
         *     function on the current key-value pair
         * @param {number} mapContext.executionNo - Number of times the map function has been executed on the current key-value
         *     pair
         * @param {boolean} mapContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} mapContext.key - Key to be processed during the map stage
         * @param {string} mapContext.value - Value to be processed during the map stage
         * @since 2015.2
         */

        const map = (mapContext) => {
            try {
                const TIME_UNIX  = Date.now();
                // const URL        = 'https://async.mysuitetest.com/factwsfront.asmx';//SANDBOX
                const URL        = 'https://async.mysuitecfdi.com/factwsfront.asmx';//PRODUCCIÓN
                let continueRetr = false;
                let verifyJsonParsed   = null;
                let verifyJsonResponse = null;
                let xmlObj       = JSON.parse(mapContext.value);
                
                // CDY - Async XML SAT
                let asyncXmlRow  = record.load({ type: 'customrecord_cdy_async_xml_sat', id: xmlObj.id});
                
                if (!asyncXmlRow) {
                    log.debug('Error', 'Registro Async XML SAT inválido o no encontrado');
                    return;
                }
                
                let factIntCoRow = record.load({ type: 'customrecord_drt_reg_facturacion_interco', id: asyncXmlRow.getValue({fieldId: 'custrecord_xml_async_reg_fact_interco'}) }) || null;
                if (!factIntCoRow) {
                    log.debug('Error', 'Registro de facturación intercompañía no válido o no encontrado');
                    return;
                }
                
                // Mexico PAC / El PAC ID donde se obtiene el RFC emisor y el user
                let pacId  = asyncXmlRow.getValue({fieldId: 'custrecord_xml_async_pac_requestor_id'}) || null;
                let pacRow = pacId ? record.load({ type: 'customrecord_mx_pac_connect_info', id: pacId }) : null;
                
                if (!pacRow) {
                    log.debug('Error', 'PAC no válido o no encontrado');
                    return;
                }

                // Setup Serial Global Invoice
                let serialId     = asyncXmlRow.getValue({fieldId: 'custrecord_xml_async_setup_serial_id'}) || null;
                let serialInvRow = serialId ? record.load({ type: 'customrecord_drt_setup_serial_gi', id: serialId }) : null;

                if (!serialInvRow) {
                    log.debug('Error', 'Registro Setup Serial Global Invoice no válido o no encontrado');
                    return;
                }
                
                const RFC_EMISOR = asyncXmlRow.getValue('custrecord_xml_async_rfc_emisor');
                const USER_NAME  = pacRow.getValue('custrecord_mx_pacinfo_username');
                const REQUESTOR  = pacRow.getValue('custrecord_mx_pacinfo_username') || '';
                const USER       = pacRow.getValue('custrecord_mx_pacinfo_username') || '';
                // log.debug('mapContext', JSON.parse(mapContext.value));
                log.debug('xmlObj', xmlObj);
                // return;
                let xmlConverVerify = getAsyncConvertVerify(xmlObj.xmlId, RFC_EMISOR, USER_NAME, REQUESTOR, USER);
                let tempId = saveFile('SOAP_verify_nat_xml'.concat(xmlObj.xmlId), file.Type.PLAINTEXT, xmlConverVerify, 'SOAP ASYNC_CONVERT_VERIFY', null, xmlObj.carpetaId);
                log.debug('Archivo SOAP xmlConverVerify', tempId);
                let headers = {
                    'Content-Type'   : 'text/xml; charset=utf-8',
                    'Content-Length' : '"' + xmlConverVerify.length + '"',
                    'SOAPAction'     : 'http://www.fact.com.mx/schema/ws/RequestTransaction',
                };
                // ASYNC_CONVERT_VERIFY
                let serviceResponse = https.post({
                    url: URL,
                    body: xmlConverVerify,
                    headers: headers
                });

                // Response ASYNC_CONVERT_VERIFY
                let responseText = serviceResponse.body;
                log.debug('responseText', JSON.stringify(responseText));
                
                let fileId = saveFile('txt_response_verify_nat_xml'.concat(xmlObj.xmlId), file.Type.PLAINTEXT, responseText, 'Respuesta sat ASYNC_CONVERT_VERIFY', null, xmlObj.carpetaId);

                log.debug('Archivo txt para respuesta ASYNC_CONVERT_VERIFY', fileId);

                let xmlVerifyResponse = xml.Parser.fromString({
                    // text: fileVerifyXml.getContents()
                    text: responseText
                });

                log.audit("xmlVerifyResponse", xmlVerifyResponse);

                // Nodo con la data general de la petición ASYNC_CONVERT_VERIFY
                let nodeResponseVerify = xmlVerifyResponse.getElementsByTagName({
                    tagName: 'Response'
                })[0];

                log.debug('nodeResponseVerify', nodeResponseVerify);
                if ( nodeResponseVerify ) {
                    let verifyCode = nodeResponseVerify.getElementsByTagName({
                        tagName: 'Code'
                    })[0].textContent;
                    log.debug('verifyCode', verifyCode);
                    // Significa que el xml está listo para ser obtenido
                    if ( verifyCode == 1 ) {
                        let nodeResponseData   = xmlVerifyResponse.getElementsByTagName({ tagName: 'ResponseData'})[0];
                        let responseData2      = nodeResponseData.getElementsByTagName({ tagName: 'ResponseData2' })[0].textContent;
                        
                        verifyJsonResponse = encode.convert({
                            string: responseData2,
                            inputEncoding: encode.Encoding.BASE_64,
                            outputEncoding: encode.Encoding.UTF_8
                        });
                        
                        // Convierte a JSON el string del responseData2
                        verifyJsonParsed = JSON.parse(verifyJsonResponse);
                        
                        log.debug('verifyJsonResponse', verifyJsonResponse);
                        asyncXmlRow.setValue({fieldId : 'custrecord_xml_status_async_naat', value: 2 });// Success
                        asyncXmlRow.setText({fieldId : 'custrecord_xml_async_verify_json_res', value: verifyJsonResponse });// JSON response
                        asyncXmlRow.setText({fieldId : 'custrecord_xml_async_document_guid', value: verifyJsonParsed.Uuid });// Document GUID
                        
                        // Se guarda el uuid de la factura timbrada 
                        factIntCoRow.setValue({fieldId: 'custrecord_drt_uuid', value: verifyJsonParsed.Uuid});

                        continueRetr = true;
                    } else {
                        asyncXmlRow.setValue({fieldId : 'custrecord_xml_status_async_naat', value: 3 });// Error
                    }
                }

                // Factura correctamente timbrada, procede a descargarse los archivos xml y PDF
                if ( continueRetr ) {
                    // ASYNC_RETRIEVE_DOCUMENT
                    let xmlRetrieveDoc      = getAsyncRetrieveDocument(xmlObj.xmlId, RFC_EMISOR, USER_NAME, REQUESTOR, USER);
                    headers['Content-Length'] = '"' + xmlRetrieveDoc.length + '"';
                    let serviceResponseRetr = https.post({
                        url: URL,
                        body: xmlRetrieveDoc,
                        headers: headers
                    });

                    // Response ASYNC_RETRIEVE_DOCUMENT
                    let responseRetrieve = serviceResponseRetr.body;
                    log.debug('responseRetrieve', JSON.stringify(responseRetrieve));
                    let fileResponseTxt = file.create({
                        name: 'txt_response_retrieve_async_doc'.concat(xmlObj.xmlId),
                        fileType: file.Type.PLAINTEXT,
                        contents: responseRetrieve,
                        description: 'Respuesta sat ASYNC_RETRIEVE_DOCUMENT',
                        encoding: 'UTF-8',
                        // folder: 504,
                        folder: xmlObj.carpetaId,
                        isOnline: true
                    });
                    let fileId = fileResponseTxt.save();

                    let xmlRetrieveResponse = xml.Parser.fromString({
                        // text: fileRetrieveXml.getContents()
                        text: responseRetrieve
                    });
                    // Nodo con la data general de la petición ASYNC_RETRIEVE_DOCUMENT
                    let nodeResponseRetrieve     = xmlRetrieveResponse.getElementsByTagName({ tagName: 'Response' })[0];
                    let nodeResponseDataRetrieve = xmlRetrieveResponse.getElementsByTagName({ tagName: 'ResponseData' })[0];
                    let identifier = null;
                    let docGuid    = null;
                    let xmlLink    = null;
                    let pdfLink    = null;
                    let xmlBase64  = null;
                    let pdfBase64  = null;
                    log.debug('nodeResponseRetrieve', nodeResponseRetrieve);
                    log.debug('nodeResponseDataRetrieve', nodeResponseDataRetrieve);
                    if ( nodeResponseRetrieve ) {
                        identifier = nodeResponseRetrieve.getElementsByTagName({ tagName: 'Identifier' })[0];
                        docGuid    = identifier.getElementsByTagName({ tagName: 'DocumentGUID' })[0].textContent;
                        
                        xmlLink     = nodeResponseDataRetrieve.getElementsByTagName({ tagName: 'ResponseData1' })[0].textContent;
                        pdfLink     = nodeResponseDataRetrieve.getElementsByTagName({ tagName: 'ResponseData3' })[0].textContent;

                        log.debug('docGuid', docGuid);
                        log.debug('xmlLink', xmlLink);
                        log.debug('pdfLink', pdfLink);
    
                        // Se guarda el XML
                        if ( xmlLink ) {
                            let xmlLinkUtf8 = encode.convert({
                                string: xmlLink,
                                inputEncoding: encode.Encoding.BASE_64,
                                outputEncoding: encode.Encoding.UTF_8
                            });
                            log.debug('xmlLinkUtf8', xmlLinkUtf8);
                            xmlBase64 = getLinkFileBase64(xmlLinkUtf8);
    
                            let xmlUTF8 = encode.convert({
                                string: xmlBase64,
                                inputEncoding: encode.Encoding.BASE_64,
                                outputEncoding: encode.Encoding.UTF_8
                            });
                           
                            let xmlFileId = saveFile('convert_nat_xml'.concat(TIME_UNIX), file.Type.XMLDOC, xmlUTF8, '', null, xmlObj.carpetaId);
                            log.debug('xmlFileId', xmlFileId);
                            // Se actualiza el registro de factura intercompañía con el xml generado
                            factIntCoRow.setValue({fieldId: 'custrecord_drt_xml_generado', value: xmlFileId});
                            
                            // asyncXmlRow
                        }
    
                        // Se guarda el PDF
                        if ( pdfLink ) {
                            let pdfLinkUtf8 = encode.convert({
                                string: pdfLink,
                                inputEncoding: encode.Encoding.BASE_64,
                                outputEncoding: encode.Encoding.UTF_8
                            });
                            pdfBase64 = getLinkFileBase64(pdfLinkUtf8);
    
                            let pdfFileId = saveFile('convert_nat_pdf'.concat(TIME_UNIX), file.Type.PDF, pdfBase64, '', null, xmlObj.carpetaId);
                            log.debug('pdfFileId', pdfFileId);
                            // Se actualiza el registro de factura intercompañía con el PDF generado
                            factIntCoRow.setValue({fieldId: 'custrecord_drt_pdf_generado', value: pdfFileId});
                        }


                        // Método para actualizar el registro Setup Serial Global Invoice
                        updateSerialGlobalInvoice(serialId);
                    }
                }

                asyncXmlRow.save();// Se actualiza el registro de CDY - Async XML SAT
                factIntCoRow.save();// Se actualiza el registro de DRT - Registro Facturación Intercompañia
            } catch (error) {
                log.debug('Error en mapContext', error);
            }
        }

        /**
         * Defines the function that is executed when the reduce entry point is triggered. This entry point is triggered
         * automatically when the associated map stage is complete. This function is applied to each group in the provided context.
         * @param {Object} reduceContext - Data collection containing the groups to process in the reduce stage. This parameter is
         *     provided automatically based on the results of the map stage.
         * @param {Iterator} reduceContext.errors - Serialized errors that were thrown during previous attempts to execute the
         *     reduce function on the current group
         * @param {number} reduceContext.executionNo - Number of times the reduce function has been executed on the current group
         * @param {boolean} reduceContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {string} reduceContext.key - Key to be processed during the reduce stage
         * @param {List<String>} reduceContext.values - All values associated with a unique key that was passed to the reduce stage
         *     for processing
         * @since 2015.2
         */
        const reduce = (reduceContext) => {

        }


        /**
         * Defines the function that is executed when the summarize entry point is triggered. This entry point is triggered
         * automatically when the associated reduce stage is complete. This function is applied to the entire result set.
         * @param {Object} summaryContext - Statistics about the execution of a map/reduce script
         * @param {number} summaryContext.concurrency - Maximum concurrency number when executing parallel tasks for the map/reduce
         *     script
         * @param {Date} summaryContext.dateCreated - The date and time when the map/reduce script began running
         * @param {boolean} summaryContext.isRestarted - Indicates whether the current invocation of this function is the first
         *     invocation (if true, the current invocation is not the first invocation and this function has been restarted)
         * @param {Iterator} summaryContext.output - Serialized keys and values that were saved as output during the reduce stage
         * @param {number} summaryContext.seconds - Total seconds elapsed when running the map/reduce script
         * @param {number} summaryContext.usage - Total number of governance usage units consumed when running the map/reduce
         *     script
         * @param {number} summaryContext.yields - Total number of yields when running the map/reduce script
         * @param {Object} summaryContext.inputSummary - Statistics about the input stage
         * @param {Object} summaryContext.mapSummary - Statistics about the map stage
         * @param {Object} summaryContext.reduceSummary - Statistics about the reduce stage
         * @since 2015.2
         */
        const summarize = (summaryContext) => {

        }

        /**
         * 
         * @param {integer} serialId 
         */
        const updateSerialGlobalInvoice = (serialId) => {
            try {
                if (!serialId) { return null; }
                let crSerial = search.lookupFields({
                    type: 'customrecord_drt_setup_serial_gi',
                    id: serialId,
                    columns: ['custrecord_drt_current']
                });
                let nextNumber = crSerial.custrecord_drt_current || 1;
                nextNumber++;
                let id = record.submitFields({
                    type: 'customrecord_drt_setup_serial_gi',
                    id: serialId,
                    values: {
                        custrecord_drt_current: nextNumber
                    }
                });
                log.debug('INFO', 'Registro Setup Serial Global Invoice actualizado exitósamente');
                return id;
            } catch (error) {
                log.debug('ERROR', 'Algo salió mal en el método updateSerialGlobalInvoice: '+error);
                return null;
            }
        }

        /**
         * Obtiene los xml pendientes de revisión
         * @returns array
         */
        const getPendingXmlAsync = () => {
            try {
                let xmlArray = [];
                let searchPendingXmlAsync = search.create({
                    type: "customrecord_cdy_async_xml_sat",
                    filters:
                    [
                    //    ["isinactive","is","F"]
                       ["custrecord_xml_status_async_naat","is",1]
                    ],
                    columns:
                    [
                        search.createColumn({
                            name: "scriptid",
                            sort: search.Sort.ASC,
                            label: "ID de script"
                        }),
                        search.createColumn({name: "internalid", label: "ID interno"}),
                        search.createColumn({name: "custrecord_xml_async_response_data_id", label: "RESPONSE DATA 1"}),
                        search.createColumn({name: "custrecord_xml_response_async_nat", label: "XML"}),
                        search.createColumn({name: "custrecord_xml_status_async_naat", label: "STATUS"}),
                        search.createColumn({name: "custrecord_xml_async_reg_fact_interco", label: "REGISTRO FACTURACIÓN INTERCOMPAÑIA ID"}),
                        search.createColumn({name: "custrecord_xml_async_document_guid", label: "DOCUMENT GUID"}),
                        search.createColumn({name: "custrecord_xml_async_folder_id", label: "Carpeta ID"}),
                    ]
                });
                searchPendingXmlAsync.run().each(function(result) {
                    let obj    = {};
                    let values = result.getAllValues();
                    log.debug('values', values);
    
                    obj.id          = Number(values.internalid[0].value);
                    obj.xmlId       = values.custrecord_xml_async_response_data_id;
                    obj.statusId    = Number(values.custrecord_xml_status_async_naat[0].value);
                    obj.regIntercId = Number(values.custrecord_xml_async_reg_fact_interco[0].value);
                    obj.uuid        = values.custrecord_xml_async_document_guid;
                    obj.carpetaId   = Number(values.custrecord_xml_async_folder_id);
                    // log.debug('Values folios busqueda', values);
                    xmlArray.push(obj);
    
                    return true;
                });
    
                return xmlArray;
            } catch (error) {
                log.debug('Error en función getPendingXmlAsync', error);
                return [];
            }
        }

        /**
         * Set xml for operation ASYNC_CONVERT_VERIFY
         */
        const getAsyncConvertVerify = (id, rfcEmisor, userName, requestor, user) => {
            let operation = 'ASYNC_CONVERT_VERIFY';

            let xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://www.fact.com.mx/schema/ws">';
            xml += '   <soapenv:Header/>';
            xml += '   <soapenv:Body>';
            xml += '      <ws:RequestTransaction>';
            xml += '         <ws:Requestor>' + requestor + '</ws:Requestor>';
            xml += '         <ws:Transaction>' + operation + '</ws:Transaction>';
            xml += '         <ws:Country>MX</ws:Country>';
            xml += '         <ws:Entity>' + rfcEmisor + '</ws:Entity>';
            xml += '         <ws:User>' + user + '</ws:User>';
            // xml += '         <ws:UserName>MX.' + rfcEmisor + '.ADMIN</ws:UserName>';
            xml += '         <ws:UserName>' + userName + '</ws:UserName>';
            xml += '         <ws:Data1>' + id + '</ws:Data1>';
            xml += '         <ws:Data2>null</ws:Data2>';
            xml += '         <ws:Data3>null</ws:Data3>';
            xml += '      </ws:RequestTransaction>';
            xml += '   </soapenv:Body>';
            xml += '</soapenv:Envelope>';

            return xml;
        }

        /**
         * Set xml for operation ASYNC_RETRIEVE_DOCUMENT
         */
        const getAsyncRetrieveDocument = (id, rfcEmisor, userName, requestor, user) => {
            let operation = 'ASYNC_RETRIEVE_DOCUMENT';

            let xml = '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://www.fact.com.mx/schema/ws">';
            xml += '   <soapenv:Header/>';
            xml += '   <soapenv:Body>';
            xml += '      <ws:RequestTransaction>';
            xml += '         <ws:Requestor>' + requestor + '</ws:Requestor>';
            xml += '         <ws:Transaction>' + operation + '</ws:Transaction>';
            xml += '         <ws:Country>MX</ws:Country>';
            xml += '         <ws:Entity>' + rfcEmisor + '</ws:Entity>';
            xml += '         <ws:User>' + user + '</ws:User>';
            // xml += '         <ws:UserName>MX.' + rfcEmisor + '.ADMIN</ws:UserName>';
            xml += '         <ws:UserName>' + userName + '</ws:UserName>';
            xml += '         <ws:Data1>' + id + '</ws:Data1>';
            xml += '         <ws:Data2>null</ws:Data2>';
            xml += '         <ws:Data3>null</ws:Data3>';
            xml += '      </ws:RequestTransaction>';
            xml += '   </soapenv:Body>';
            xml += '</soapenv:Envelope>';

            return xml;
        }

        /**
         * Obtiene la base 64 de un archivo (link público)
         * @param {string} url 
         */
        const getLinkFileBase64 = (url) => {
            try {
                // let headers = { 'Content-Type'   : 'text/xml; charset=utf-8' };
                let serviceResponse = https.get({
                    url: url,
                    // headers: headers
                });
    
                let responseText = serviceResponse.body;

                return responseText ?? null;
            } catch (error) {
                log.debug('Algo salió mal en getLinkFileBase64', error);
                return null;
            }
        }

        /**
         * 
         * @param {string} fileName 
         * @param {string} fileType 
         * @param {longText} fileContent 
         * @param {longText} fileDescription 
         * @param {string} fileEncoding 
         * @param {integer} folder 
         * @returns boolean
         */
        const saveFile = (fileName, fileType, fileContent, fileDescription, fileEncoding = file.Encoding.UTF8, folder) => {
            try {
                var fileObj = file.create({
                    name: fileName,
                    fileType: fileType,
                    contents: fileContent,
                    description: fileDescription,
                    encoding: fileEncoding,
                    folder: folder,
                    isOnline: true
                });
                return fileObj.save() || null;
   
            } catch (error) {
                log.debug('Error en saveFile', error)
            }
        }

        return {getInputData, map, reduce, summarize}

    });
