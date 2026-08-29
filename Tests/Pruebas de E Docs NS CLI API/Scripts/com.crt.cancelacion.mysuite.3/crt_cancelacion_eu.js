/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 *@NModuleScope Public
*/


define( [ 'N/error', 'N/file', 'N/runtime', 'N/search', 'N/https', 'N/record', 'N/format' ],
    function( error, file, runtime, search, https, record, format ) {

        function displayButton( context ) {

            try{
                if( context.type != 'view' ){ return; }

                var invoice   = context.newRecord;
                var uuid      = invoice.getValue({ fieldId: 'custbody_mx_cfdi_uuid' });
                var year      = invoice.getValue({ fieldId: 'custbody_mx_cfdi_certify_timestamp' });
                var solCancel = invoice.getValue({ fieldId: 'custbody_crt_sol_cancel' });
                log.audit({title:'invoice',details:JSON.stringify(invoice)});
                log.audit({title:'uuid',details:JSON.stringify(uuid)});
                log.audit({title:'year',details:JSON.stringify(year)});
                log.audit({title:'solCancel',details:JSON.stringify(solCancel)});
                
                if(uuid && year ){
                    context.form.clientScriptFileId = search.create({
                        type   : 'clientscript',
                        filters: [ ['scriptid', 'is', 'customscript_crt_cancelacion_cl'] ],
                        columns: ['scriptfile']
                    }).run().getRange({ start: 0, end: 1 })[0].getValue({name: 'scriptfile'});

                    log.audit({title:'script',details:search.create({type   : 'clientscript',filters: [ ['scriptid', 'is', 'customscript_crt_cancelacion_cl'] ],columns: ['scriptfile']}).run().getRange({ start: 0, end: 1 })[0].getValue({name: 'scriptfile'})});
					if (!solCancel) {
						context.form.addButton({ id : 'custpage_sol_cancelacion', label : 'Cancelar CFDI', functionName:  'solicitaCancelacion' });
					}
					else {
						context.form.addButton({ id : 'custpage_check_cancelacion', label : 'Verificar Cancelación', functionName:  'verificaCancelacion' });
					}
                }
            }
            catch( ex ){
                log.error('mainError', ex );
            }
        }

        function extraeUUID(context) {

    		if (context.type != 'create' && context.type != 'edit'){ return; }

    		try{
    			var invoice = context.newRecord;

                var uuid   = invoice.getValue({ fieldId: 'custbody_mx_cfdi_uuid' });
                var year   = invoice.getValue({ fieldId: 'custbody_crt_cert_year' });
                var fileId = invoice.getValue({ fieldId: 'custbody_psg_ei_certified_edoc' });

                if( !fileId || uuid || year ){ return; }

                var fileObj    = file.load({ id: fileId });
                var xmlContent = fileObj.getContents();

                var uuidLocation = xmlContent.indexOf('UUID=');//b046ff9b-d6a7-4433-9094-94ad83d6b5ab
                var yearLocation = xmlContent.indexOf('FechaTimbrado=');//4

                var uuid          = xmlContent.slice(uuidLocation + 6, uuidLocation + 42);
                var fechaTimbrado = xmlContent.slice(yearLocation + 15, yearLocation + 19);

                log.audit('uuid', uuid);
                log.audit('fechaTimbrado', fechaTimbrado);

                invoice.setValue({fieldId: 'custbody_crt_uuid', value: uuid});
                invoice.setValue({fieldId: 'custbody_crt_cert_year', value: fechaTimbrado});

    		}catch(ex){
    			log.debug('Main Error', ex);
    		}

    	}

        return {
            beforeLoad: displayButton,
            //beforeSubmit: extraeUUID,
        };
    });
