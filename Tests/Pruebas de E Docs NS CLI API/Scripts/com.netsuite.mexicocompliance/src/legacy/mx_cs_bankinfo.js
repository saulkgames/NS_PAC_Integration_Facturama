/**
 * @copyright © 2025, Oracle and/or its affiliates. All rights reserved.
 * 
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope Public
 */

define(["N/runtime", "N/search", "./lib/resourceManager"],
    function (runtime, search, resources) {

        function saveRecord(context) {
            return checkForDuplicates(context);
        }

        function checkForDuplicates(context) {
            const bankInfoName = context.currentRecord.getValue({ fieldId: "name" });

            if (bankInfoName) {
                const bankInfoEntity = context.currentRecord.getValue({ fieldId: "custrecord_psg_mx_bank_info_entity" });
                const bankInfoId = context.currentRecord.id;
                return searchByFilters(bankInfoEntity, bankInfoName, bankInfoId);
            }

            return true;
        }

        function searchByFilters(entity, name, id = "") {
            const filters = [
                search.createFilter({
                    name: "custrecord_psg_mx_bank_info_entity",
                    operator: search.Operator.IS,
                    values: entity
                }),
                search.createFilter({
                    name: "name",
                    operator: search.Operator.IS,
                    values: name
                })
            ];

            if (id) {
                filters.push({
                    name: "internalid",
                    operator: search.Operator.NONEOF,
                    values: id
                });
            }

            const bankInfoSearch = search.create({
                type: "customrecord_psg_mx_bank_info",
                filters: filters
            });

            const searchResult = bankInfoSearch.runPaged({ pageSize: 1 });

            if (searchResult && searchResult.count > 0) {
                reportErrorIfHaveDuplicates();
                return false;
            }

            return true;
        }

        function reportErrorIfHaveDuplicates() {
            const langCode = runtime.getCurrentUser().getPreference('language');

            let message = "";

            try {
                const resource = new resources.resourceManager(langCode);
                message = resource.GetString("MSG_DUPLICATE_BANK_INFO");
            } catch (e) {
                console.error("MX_ExpenseReport_CS Init Error", e)
            }

            alert(message);
        }

        return {
            saveRecord: saveRecord
        };
    });