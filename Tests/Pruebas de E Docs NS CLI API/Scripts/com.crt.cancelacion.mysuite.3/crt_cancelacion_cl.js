/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope Public
 */
define( [ 'N/url', 'N/record', 'N/search', 'N/https', 'N/ui/message', 'N/currentRecord','N/log' ],
    function( url, record, search, https, uimessage, currentRecord ,log) {

        function pageInit(){ }
		
		function mainCacelacion(param_id_field) {
            try{
                log.audit({title:'mainCacelacion param_id_field',details:JSON.stringify(param_id_field)});
                var transacId = currentRecord.get().id;
                var recordType = currentRecord.get().type;

                var urlSuitelet = url.resolveScript({ scriptId: 'customscript_crt_cancelacion_su', deploymentId: 'customdeploy_crt_cancelacion_su' });

				
				var params = {transacId: transacId, recordType: recordType, requestStatus: param_id_field=='custbody_drt_crt_verificacion_cancel'};
                var responseBody = JSON.parse( https.post({ url: urlSuitelet, body: JSON.stringify(params) }).body );

                if(responseBody.success){
                    var value=true;
                    if(responseBody.message){
                        successMessage(responseBody.message);
                        if(param_id_field=='custbody_drt_crt_verificacion_cancel'){
                            value=responseBody.message;
                        }
                    }else{
                        successMessage('Solicitud de Cancelacion Enviada');
                    }
                    log.audit({title:'value',details:JSON.stringify(value)});
                    var objUpdate={};
                    objUpdate[param_id_field]=value;
                    log.audit({title:'objUpdate',details:JSON.stringify(objUpdate)});
                    record.submitFields({type: recordType, id: transacId, values: objUpdate, options:{ignoreMandatoryFields: true} });

                    window.location.reload();
                }
                else{
                    errorMessage(responseBody.message);
                }

            }
            catch(error){
                log.error('Main Error', error);
                errorMessage(error.message);
            }
		}

        function solicitaCancelacion(){
			mainCacelacion('custbody_crt_sol_cancel');
        }
		
        function verificaCancelacion(){
			mainCacelacion('custbody_drt_crt_verificacion_cancel');
        }

        function successMessage(message){
            uimessage.create({ type: uimessage.Type.CONFIRMATION, title: 'Success', message: message }).show({ duration: 8000 });
        }

        function errorMessage(message){
            uimessage.create({ type: uimessage.Type.ERROR, title: 'Warning', message: message }).show({ duration: 8000 });
        }

        return {
           pageInit: pageInit,
           solicitaCancelacion: solicitaCancelacion,
		   verificaCancelacion: verificaCancelacion
        };
});
