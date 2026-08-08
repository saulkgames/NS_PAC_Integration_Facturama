/**
 * Copyright (c) 2025, Oracle and/or its affiliates. All rights reserved.
 * 
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([], function() {
    var globalLecApi = null;
    
    function loadLecApi() {
        if (!globalLecApi) {
            require(["SuiteApps/com.netsuite.edoccertificationservice/src/api/ecs_api"], function(loadResponse) {
                globalLecApi = loadResponse;
            });
        }

        return globalLecApi;
    }

    function getEDocumentModel(context){
        var token = getToken();
        var lecApi = loadLecApi();
        return lecApi.externalGetEDocumentModel(context, token);
    }

    function externalSendDocument(context){
        var token = getToken();
        var lecApi = loadLecApi();
        return lecApi.externalSendDocument(context, token);
    }

    function getToken() {
        var lecApi = loadLecApi();
        return lecApi.getToken('mexico', '693a6cf4-1595-40a7-8d2c-b12f252b3be6');
    }

    return {
        getEDocumentModel: getEDocumentModel,
        externalSendDocument: externalSendDocument
    }
})