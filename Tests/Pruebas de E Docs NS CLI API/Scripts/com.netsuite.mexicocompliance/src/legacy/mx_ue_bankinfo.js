/**
 * @copyright © 2025, Oracle and/or its affiliates. All rights reserved.
 * 
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

define(["N/log", "N/runtime", "N/search", "N/error", "./lib/resourceManager"],
    function (log, runtime, search, error, resources) {

        function beforeSubmit(context) {
            if (runtime.executionContext === runtime.ContextType.USER_INTERFACE) {
                if (context.type === context.UserEventType.EDIT || context.type === context.UserEventType.CREATE) {
                    checkForDuplicates(context);
                }
            }
        }

        function checkForDuplicates(context) {
            const bankInfoName = context.newRecord.getValue({ fieldId: "name" });

            if (bankInfoName) {
                const bankInfoEntity = context.newRecord.getValue({ fieldId: "custrecord_psg_mx_bank_info_entity" });
                const bankInfoId = context.newRecord.id;
                searchByFilters(bankInfoEntity, bankInfoName, bankInfoId);
            }
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
            }
        }

        function reportErrorIfHaveDuplicates() {
            const langCode = runtime.getCurrentUser().getPreference('language');

            let message = "";

            try {
                const resource = new resources.resourceManager(langCode);
                message = resource.GetString("MSG_DUPLICATE_BANK_INFO");
            } catch (e) {
                log.error("MX_ExpenseReport_CS Init Error", e)
            }

            throw error.create({
                name: "DUPLICATE_BANK_INFO",
                message: message,
                notifyOff: false
            });
        }

        return {
            beforeSubmit: beforeSubmit
        }
    });