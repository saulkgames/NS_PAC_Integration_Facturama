/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define([
        'N/search',
        'N/record'
    ],

    function (search, record) {

        function getInputData () {
            return search.create({
                type: 'customrecord_mx_mapper_keyvalue',
                title: 'Mexico Mapping Search',
                columns: ['custrecord_mx_mapper_keyvalue_category','custrecord_mx_mapper_keyvalue_value','custrecord_mx_mapper_keyvalue_key','custrecord_mx_mapper_keyvalue_inputvalue','custrecord_mx_mapper_keyvalue_rectype','custrecord_mx_mapper_keyvalue_subkey','custrecord_mx_mapper_keyvalue_subrectype'],
                filters: []
            });
        }

        function map (context) {
            var mapping = JSON.parse(context['value']);
            var mappingColumnValues = mapping['values'];
            var recordType = mappingColumnValues['custrecord_mx_mapper_keyvalue_rectype'];
            //search checks if netsuite record from mapping exists
            var recordSearchResult = search.create({
                type: recordType,
                columns: [],
                filters: [
                    search.createFilter({
                        name: getNameOfFieldUsedAsKey(recordType),
                        join: '',
                        operator: 'is',
                        values: mappingColumnValues['custrecord_mx_mapper_keyvalue_key']
                    })
                ]
            }).run().getRange({
                start: 0,
                end: 1
            });

            //if record doesnt exist we delete the mapping
            if(recordSearchResult.length==0){
                record.delete({
                    type: 'customrecord_mx_mapper_keyvalue',
                    id:  parseInt(mapping.id),
                });
            }

            //if subrecord from given record doesnt exist we delete the mapping, this is the case for units of measure
            if(mappingColumnValues['custrecord_mx_mapper_keyvalue_subrectype']){
                var recordWithSublist = record.load({
                    type: recordSearchResult[0]['recordType'],
                    id: recordSearchResult[0]['id'],
                });
                var lineNumber = recordWithSublist.findSublistLineWithValue({
                    sublistId: mappingColumnValues['custrecord_mx_mapper_keyvalue_subrectype'],
                    fieldId: 'internalid',
                    value: mappingColumnValues['custrecord_mx_mapper_keyvalue_subkey']
                });
                if(lineNumber == -1){
                    record.delete({
                        type: 'customrecord_mx_mapper_keyvalue',
                        id:  parseInt(mapping.id),
                    });
                }
            }
        }

	    /**
	     * Returns name of field whose value is stored in 'key' column of mapping.
	     * Usually it is 'internalId' - so mapping refers to single record,
	     * but is some special cases, mapping key may refer to another column.
	     * For example, Bank Informations are grouped by 'Bank Name', see PSGLBA-2122.
	     * @param {string} recordType record type
	     * @returns {string} name of field whose value is stored in 'key' column of mapping
	     */
        function getNameOfFieldUsedAsKey (recordType){
        	switch(recordType){
		        case 'customrecord_psg_mx_bank_info': return 'custrecord_psg_mx_bank_name';
		        default: return 'internalId'
	        }
        }

        return {
            getInputData: getInputData,
            map: map
        };
    });