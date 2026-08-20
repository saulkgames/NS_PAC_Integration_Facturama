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
                let finalArray = [];
                let index      = Number(runtime.getCurrentScript().getParameter({ name: 'custscript_index_async_xml' }));
                let xmlAsyncArray = getSuccessXmlAsync();
                
                if ( xmlAsyncArray.length && xmlAsyncArray[index] ) {
                    // let row = record.load({ type: 'customrecord_drt_reg_facturacion_interco', id: 343});
                    let row = record.load({ type: 'customrecord_drt_reg_facturacion_interco', id: xmlAsyncArray[index].reg_interc_id});
                    let invoicesArray = row.getValue({fieldId: 'custrecord_drt_facturas'}) || [];

                    for (let c = 0; c < invoicesArray.length; c++) {
                        const element = invoicesArray[c];
                        let newObj = {
                            uuid  : xmlAsyncArray[index].uuid,
                            invId : element,
                        };
                        log.debug('newObj', newObj);
                        finalArray.push(newObj);
                    }
                   
                    return finalArray;
                } else {
                    return [];
                }

                
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
                let row = JSON.parse(mapContext.value);
                log.debug('row', row);
                // Se arma el objeto encargado de actualizar el invoice
                let objSubmit = { 
                    custbody_mx_cfdi_uuid: row.uuid,
                };
                let id = record.submitFields({
                    type: record.Type.INVOICE,
                    id: row.invId,
                    values: objSubmit,
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields: true
                    }
                });

                log.debug('INFO', 'Invoice actualizado exitósamente: '+id)
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
            try {
                const xmlAsyncArray = getSuccessXmlAsync();
                const lengthData    = xmlAsyncArray.length - 1;
                const index         = Number(runtime.getCurrentScript().getParameter({ name: 'custscript_index_async_xml' }));
                log.debug('Folios length', lengthData);
                //let index = Number(reduceContext.key);
                if ( index == xmlAsyncArray.length - 1 ) {// Ya se terminó de procesar todos los registros
                    log.debug('Proceso terminado', 'no tiene mas data por procesar');
                } else {
                    const newIndex = index + 1;
                    log.debug('Tiene más facturas por actualizar de otro registro', lengthData);
                    // log.debug('newIndex', newIndex);
                    task.create({
                        taskType: task.TaskType.MAP_REDUCE,
                        scriptId: runtime.getCurrentScript().id,
                        deploymentId: runtime.getCurrentScript().deploymentId,
                        params: {
                            custscript_index_async_xml: newIndex,
                        }
                    }).submit();
                }
            } catch (error) {
                log.debug('Error en summarize', error);
            }
        }

        /**
         * Obtiene los xml pendientes de revisión
         * @returns array
         */
        const getSuccessXmlAsync = () => {
            try {
                let xmlArray = [];
                let searchPendingXmlAsync = search.create({
                    type: "customrecord_cdy_async_xml_sat",
                    filters:
                    [
                    //    ["isinactive","is","F"]
                       ["custrecord_xml_status_async_naat","is",2]
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
                    // log.debug('values', values);
    
                    obj.id            = Number(values.internalid[0].value);
                    obj.xmlId         = values.custrecord_xml_async_response_data_id;
                    obj.statusId      = Number(values.custrecord_xml_status_async_naat[0].value);
                    obj.reg_interc_id = Number(values.custrecord_xml_async_reg_fact_interco);
                    obj.uuid          = values.custrecord_xml_async_document_guid;
                    obj.carpeta_id    = values.custrecord_xml_async_folder_id;
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

        return {getInputData, map, reduce, summarize}

    });
