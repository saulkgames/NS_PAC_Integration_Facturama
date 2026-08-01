/**
 * Copyright (c) 2023, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(["N/log", "./../../common/constants"], function (log, constants) {
    var EPSILON = 2.2204460492503130808472633361816e-16;
    // The Number.EPSILON static data property (manually imported since NetSuite version does not include it)
    // represents the difference between 1 and the smallest floating point number greater than 1.
    // Doc: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON
    function roundValue(number) {
        // eslint-disable-next-line no-magic-numbers
        return Math.round((number + EPSILON) * 1000000) / 1000000;
    }

    function fetchDataOrEmptyString(value) {
        return value || "";
    }

    function fetchNumberOrZero(value) {
        return value === undefined || value === null ? 0 : value;
    }

    function AppliedTransactions(
        query,
        nsRuntime,
        nsRecord,
        commonXmlGenerator,
        SATCodes
    ) {
        this.query = query;
        this.nsRuntime = nsRuntime;
        this.nsRecord = nsRecord;
        this.invoiceRecord = this.nsRecord.create({
            type: this.nsRecord.Type.INVOICE,
            isDynamic: false,
        });
        this.commonXmlGenerator = commonXmlGenerator;
        this.SATCodes = SATCodes;
        this.currenciesCache = {};

        // This object should be formatted as
        // {tranId: [list of rows attached]}
        this.transactionsData = {};

        this.multiCurrencyFeature = this.nsRuntime.isFeatureInEffect({
            feature: constants.FEATURE.MULTICURRENCY,
        });
        this.suiteTaxFeature = this.nsRuntime.isFeatureInEffect({
            feature: constants.FEATURE.SUITE_TAX,
        });

        this.sublistsFields = {
            items: [
                constants.FIELD.ITEM,
                constants.FIELD.UNITS,
                constants.FIELD.QUANTITY,
                constants.FIELD.RATE,
                constants.FIELD.ITEM_TYPE,
                {
                    name: constants.FIELD.TAX_DETAILS_REFERENCE,
                    value: function (invoiceRecord, rowData) {
                        return (
                            invoiceRecord.getValue(constants.FIELD.ID) +
                            "_" +
                            rowData[constants.FIELD.LINE_SEQUENCE_NUMBER]
                        );
                    },
                },
            ],
            taxDetails: [
                constants.FIELD.LINE,
                constants.FIELD.TAX_TYPE,
                constants.FIELD.TAX_CODE,
                {
                    name: constants.FIELD.TAX_RATE,
                    value: function (invoiceRecord, rowData) {
                        var taxRate = parseFloat(
                            rowData[constants.FIELD.TAX_RATE]
                        );
                        return taxRate ? taxRate * 100 : 0.0;
                    },
                },
                {
                    name: constants.FIELD.TAX_DETAILS_REFERENCE,
                    value: function (invoiceRecord, rowData) {
                        return (
                            invoiceRecord.getValue(constants.FIELD.ID) +
                            "_" +
                            rowData[constants.FIELD.LINE_SEQUENCE_NUMBER]
                        );
                    },
                },
                {
                    name: constants.FIELD.TAX_AMOUNT,
                    value: function (invoiceRecord, rowData) {
                        return Math.abs(rowData[constants.FIELD.TAX_AMOUNT]);
                    },
                },
                constants.FIELD.TAX_BASIS,
            ],
        };

        this.transactionFields = [
            constants.FIELD.ENTITY,
            constants.FIELD.MX_SAT_UUID,
            constants.FIELD.MX_CFDI_FOLIO,
            constants.FIELD.MX_CFDI_SERIE,
            constants.FIELD.CURRENCY,
            constants.FIELD.EXCHANGERATE,
        ];

        if (!this.multiCurrencyFeature) {
            this.transactionFields = this.transactionFields.filter(function (
                transactionField
            ) {
                return (
                    transactionField !== constants.FIELD.CURRENCY &&
                    transactionField !== constants.FIELD.EXCHANGERATE
                );
            });
        }
    }

    AppliedTransactions.prototype._fulfillTransactionsDataFromQueryResults =
        function (pagedQueryResult) {
            var transactionsData = this.transactionsData;

            function getOrCreateTransactionObject(transactionId, data) {
                var currentTransaction = transactionsData[transactionId];
                if (!currentTransaction) {
                    transactionsData[transactionId] = {
                        items: [],
                    };
                    currentTransaction = transactionsData[transactionId];
                    currentTransaction[constants.FIELD.ID] =
                        fetchDataOrEmptyString(data[constants.FIELD.ID]);
                    currentTransaction[constants.FIELD.ENTITY] =
                        fetchDataOrEmptyString(data[constants.FIELD.ENTITY]);
                    currentTransaction[constants.FIELD.MX_CFDI_SERIE] =
                        fetchDataOrEmptyString(
                            data[constants.FIELD.MX_CFDI_SERIE]
                        );
                    currentTransaction[constants.FIELD.MX_CFDI_FOLIO] =
                        fetchDataOrEmptyString(
                            data[constants.FIELD.MX_CFDI_FOLIO]
                        );
                    currentTransaction[constants.FIELD.MX_SAT_UUID] =
                        fetchDataOrEmptyString(
                            data[constants.FIELD.MX_SAT_UUID]
                        );
                    currentTransaction[constants.FIELD.EXCHANGERATE] =
                        fetchDataOrEmptyString(
                            data[constants.FIELD.EXCHANGERATE]
                        );
                    currentTransaction[constants.FIELD.CURRENCY] =
                        fetchDataOrEmptyString(data[constants.FIELD.CURRENCY]);
                }
                return currentTransaction;
            }

            function getOrCreateItemObject(transactionObject, data) {
                var lineSequenceNumber = fetchDataOrEmptyString(
                    data[constants.FIELD.LINE_SEQUENCE_NUMBER]
                );
                var currentItem = transactionObject.items[lineSequenceNumber];
                if (!currentItem) {
                    currentItem = {
                        taxDetails: [],
                    };
                    currentItem[constants.FIELD.ITEM] = fetchDataOrEmptyString(
                        data[constants.FIELD.ITEM]
                    );
                    currentItem[constants.FIELD.RATE] = fetchDataOrEmptyString(
                        data[constants.FIELD.RATE]
                    );
                    currentItem[constants.FIELD.ITEM_TYPE] =
                        fetchDataOrEmptyString(data[constants.FIELD.ITEM_TYPE]);
                    currentItem[constants.FIELD.QUANTITY] =
                        fetchDataOrEmptyString(data[constants.FIELD.QUANTITY]);
                    currentItem[constants.FIELD.UNITS] = fetchDataOrEmptyString(
                        data[constants.FIELD.UNITS]
                    );
                    currentItem[constants.FIELD.LINE_SEQUENCE_NUMBER] =
                        lineSequenceNumber;
                    transactionObject.items[lineSequenceNumber] = currentItem;
                }
                return currentItem;
            }

            function createTaxDetailItem(data) {
                var taxDetailItem = {};
                taxDetailItem[constants.FIELD.LINE] = fetchDataOrEmptyString(
                    data[constants.FIELD.LINE]
                );
                taxDetailItem[constants.FIELD.TAX_TYPE] =
                    fetchDataOrEmptyString(data[constants.FIELD.TAX_TYPE]);
                taxDetailItem[constants.FIELD.TAX_CODE] =
                    fetchDataOrEmptyString(data[constants.FIELD.TAX_CODE]);
                taxDetailItem[constants.FIELD.TAX_RATE] = fetchNumberOrZero(
                    data[constants.FIELD.TAX_RATE]
                );
                taxDetailItem[constants.FIELD.TAX_AMOUNT] = fetchNumberOrZero(
                    data[constants.FIELD.TAX_AMOUNT]
                );
                taxDetailItem[constants.FIELD.BASE_TAX_AMOUNT] =
                    fetchNumberOrZero(data[constants.FIELD.BASE_TAX_AMOUNT]);
                taxDetailItem[constants.FIELD.TAX_BASIS] = fetchNumberOrZero(
                    data[constants.FIELD.TAX_BASIS]
                );
                taxDetailItem[constants.FIELD.LINE_SEQUENCE_NUMBER] =
                    fetchDataOrEmptyString(
                        data[constants.FIELD.LINE_SEQUENCE_NUMBER]
                    );
                return taxDetailItem;
            }
            var pagedResultIterator = pagedQueryResult.iterator();
            pagedResultIterator.each(function (pageResult) {
                var pageResults = pageResult.value.data.results;
                pageResults.forEach(function (row) {
                    var mappedRow = row.asMap();
                    var currentTransaction = getOrCreateTransactionObject(
                        mappedRow[constants.FIELD.ID],
                        mappedRow
                    );
                    if (mappedRow[constants.FIELD.MAIN_LINE] === "T") {
                        // this is the total amount
                        currentTransaction[constants.FIELD.TOTAL_AMOUNT] =
                            mappedRow[constants.FIELD.FOREIGN_TOTAL];
                    } else {
                        var currentItem = getOrCreateItemObject(
                            currentTransaction,
                            mappedRow
                        );
                        if (
                            mappedRow[constants.FIELD.TAX_CODE] !== null &&
                            mappedRow[constants.FIELD.TAX_CODE] !== ""
                        ) {
                            currentItem.taxDetails.push(
                                createTaxDetailItem(mappedRow)
                            );
                        }
                    }
                });
                return true;
            });
        };

    AppliedTransactions.prototype._getTransactionFromQueryResults = function (
        transactionId
    ) {
        // Get the list of transaction data from query
        var transactionData = this.transactionsData[transactionId];
        if (!transactionData) {
            log.error({
                title: "transactionsData[transactionId] NOT FOUND. transactionId:",
                details: transactionId,
            });
            transactionData = this._createDefaultObject();
            transactionData[constants.FIELD.ID] = transactionId;
        }
        return transactionData;
    };

    AppliedTransactions.prototype._createDefaultObject = function () {
        var defaultObject = {
            items: [],
        };
        defaultObject[constants.FIELD.ID] = 0;
        this.transactionFields.forEach(function (transactionField) {
            defaultObject[transactionField] = "";
        });
        defaultObject[constants.FIELD.TOTAL_AMOUNT] = 0;
        return defaultObject;
    };

    AppliedTransactions.prototype.getAppliedTxns = function (txnRecord) {
        function findInvoiceData(list, invoiceId) {
            for (var i = 0; i < list.length; i++) {
                if (list[i][constants.FIELD.ID] === +invoiceId) {
                    return list[i];
                }
            }
            return {};
        }

        function splitAndFormatInvoicesIds(appliedInvoicesIds) {
            const sliceSize = 999;
            var appliedInvoicesIdsSlices = [];
            for (var i = 0; i < appliedInvoicesIds.length; i += sliceSize) {
                const slice = appliedInvoicesIds.slice(i, i + sliceSize);
                appliedInvoicesIdsSlices.push(slice);
            }

            var formattedAppliedInvoicesIdsSlices = [];

            for (var i = 0; i < appliedInvoicesIdsSlices.length; i++) {
                var currentSlice = appliedInvoicesIdsSlices[i].join(",");
                currentSlice =
                    constants.SUITEQL.CUSTOMER_PAYMENT.TRANSACTION_ID_STATEMENT.replace(
                        constants.SUITEQL.LIST_PLACEHOLDER,
                        currentSlice
                    );

                formattedAppliedInvoicesIdsSlices.push(currentSlice);
            }
            return formattedAppliedInvoicesIdsSlices.join(" OR ");
        }

        var sublistId = "apply";
        var appliedTxnsCount = txnRecord.getLineCount({
            sublistId: sublistId,
        });

        var appliedTxns = [];
        var columns;
        var isApplied;
        var paidAmount = 0;
        columns = [
            "transaction.foreignAmountUnpaid",
            "transaction.foreigntotal",
            "transaction.custbody_mx_txn_sat_payment_term",
            "transaction.entity",
            "transaction.id",
            "transaction.custbody_mx_cfdi_uuid",
            "transaction.custbody_mx_cfdi_folio",
            "transaction.custbody_mx_cfdi_serie",
        ];

        if (this.multiCurrencyFeature) {
            columns.push("transaction.currency");
        }

        for (var idx = 0; idx < appliedTxnsCount; idx++) {
            var appliedTxnsItemindex = null;

            isApplied = txnRecord.getSublistValue({
                fieldId: "apply",
                sublistId: sublistId,
                line: idx,
            });

            if (!isApplied) {
                continue;
            }
            var invoiceId = txnRecord.getSublistValue({
                fieldId: "internalid",
                sublistId: sublistId,
                line: idx,
            });

            appliedTxns.forEach(function (txn, _index) {
                if (txn.id  == invoiceId) {
                    appliedTxnsItemindex = _index;
                }
            });

            paidAmount = txnRecord.getSublistValue({
                fieldId: constants.FIELD.AMOUNT,
                sublistId: sublistId,
                line: idx,
            });
            
            if (appliedTxnsItemindex == null) {

                appliedTxns.push({
                    id: invoiceId,
                    line: idx,
                    amount: paidAmount
                });

                appliedTxnsItemindex = appliedTxns.length - 1;
            } else {
                appliedTxns[appliedTxnsItemindex].amount += paidAmount;
            }
        }

        var appliedInvoicesIds = appliedTxns.map(function (appliedTxn) {
            return appliedTxn.id;
        });

        // Fetch common data for applied txns and create appliedTxns entries
        var queryResults = this.query
            .runSuiteQL({
                query: constants.SUITEQL.CUSTOMER_PAYMENT.INVOICES_DATA.replace(
                    constants.SUITEQL.LIST_COLUMNS_PLACEHOLDER,
                    columns.join(",")
                ).replace(
                    constants.SUITEQL.LIST_PLACEHOLDER,
                    appliedInvoicesIds.join(",")
                ),
            })
            .asMappedResults();

        appliedInvoicesIds.forEach(function (invoicedId, index) {
            var transactionQueryData = findInvoiceData(
                queryResults,
                invoicedId
            );
            this._fulfillAppliedTransactionObject(
                appliedTxns[index],
                transactionQueryData
            );
        }, this);

        if (this.suiteTaxFeature) {
            var additionalColumns = [];
            // Fetching currency field only if multicurrency is enabled
            if (this.multiCurrencyFeature) {
                additionalColumns.push("transaction.exchangerate");
                additionalColumns.push("transaction.currency");
                additionalColumns.push(""); // For trailing comma
            }
            // Format and split the array of invoicesIds in multiple slices, should its length be greater than 1000
            var formattedAppliedInvoicesIdsSlices =
                splitAndFormatInvoicesIds(appliedInvoicesIds);

            var queryResultsPaged = this.query.runSuiteQLPaged({
                query: constants.SUITEQL.CUSTOMER_PAYMENT.INVOICES_TAXES_ITEMS_DATA.replace(
                    constants.SUITEQL.LIST_COLUMNS_PLACEHOLDER,
                    additionalColumns.join(",")
                ).replace(
                    constants.SUITEQL.LIST_PLACEHOLDER,
                    formattedAppliedInvoicesIdsSlices
                ),
                pageSize: 1000,
            });
            // Loop through the Results and Group the data all together based on the transactionId.
            this._fulfillTransactionsDataFromQueryResults(queryResultsPaged);
        }

        appliedTxns.forEach(function (appliedTxn) {
            var invoiceRecord = this._getInvoiceRecord(appliedTxn);
            var invoiceSummary = this._getTaxSummary(invoiceRecord);
            appliedTxn.taxSummary = this._correctAmountsToRealPayments(
                invoiceSummary,
                appliedTxn.amount
            );
        }, this);

        return appliedTxns;
    };

    AppliedTransactions.prototype._getInvoiceRecord = function (
        appliedTxn
    ) {
        if (this.suiteTaxFeature) {
            this._setTransactionDataToInvoiceRecord(appliedTxn.id);
            return this.invoiceRecord;
        } else {
            return this.nsRecord.load({
                type: constants.RECORD_TYPE.INVOICE,
                id: appliedTxn.id,
                isDynamic: true,
            });
        }
    };

    AppliedTransactions.prototype._fulfillAppliedTransactionObject = function (
        appliedTxn,
        transactionData
    ) {
        // Since the FTL template renders the Serie and Folio fields in the Generated XML even though their value is ''(null),
        // we need to fulfill the data only if it's not null.
        if (transactionData[constants.FIELD.MX_CFDI_FOLIO]) {
            appliedTxn[constants.FIELD.MX_CFDI_FOLIO] =
                transactionData[constants.FIELD.MX_CFDI_FOLIO];
        }
        if (transactionData[constants.FIELD.MX_CFDI_SERIE]) {
            appliedTxn[constants.FIELD.MX_CFDI_SERIE] =
                transactionData[constants.FIELD.MX_CFDI_SERIE];
        }

        appliedTxn[constants.FIELD.MX_SAT_UUID] = fetchDataOrEmptyString(
            transactionData[constants.FIELD.MX_SAT_UUID]
        );

        appliedTxn.id = fetchDataOrEmptyString(
            transactionData[constants.FIELD.ID]
        );
        var paymentTerm = fetchDataOrEmptyString(
            transactionData[constants.FIELD.MX_SAT_PAYMENT_TERM]
        );
        appliedTxn.paymentTerm = this.SATCodes.getPaymentTerm(
            paymentTerm,
            appliedTxn.id
        );
        if (transactionData.currency) {
            appliedTxn.currencysymbol = this._getCurrencySymbol(
                transactionData.currency
            );
        }
        appliedTxn.sublistId = "apply";
        appliedTxn.order = fetchDataOrEmptyString(
            transactionData["times_paid_invoice"] + 1
        );
        var rawAmountDue = fetchDataOrEmptyString(
            transactionData[constants.FIELD.FOREIGN_AMOUNT_UNPAID]
        );
        appliedTxn.amountdue = parseFloat(rawAmountDue)
            ? parseFloat(rawAmountDue)
            : 0.0;
    };

    AppliedTransactions.prototype._getCurrencySymbol = function (id) {
        var currencyId = id + "";
        var currency = this.currenciesCache[currencyId];
        if (currency) {
            return currency.symbol;
        }
        var currenciesResults = this.query
            .runSuiteQL({
                query: constants.SUITEQL.CUSTOMER_PAYMENT.CURRENCY_SYMBOL,
                params: [currencyId],
            })
            .asMappedResults();
        if (!currenciesResults) {
            log.error({
                title: "Currency symbol query did not return any values",
                details: "Currency ID: " + currencyId,
            });
            return "";
        }

        currency = currenciesResults[0];
        this.currenciesCache[currencyId] = currency;
        return currency.symbol;
    };

    AppliedTransactions.prototype._setTransactionDataToInvoiceRecord =
        function (transactionId) {
            this._clearTransactionRecord();
            var transactionData =
                this._getTransactionFromQueryResults(transactionId);
            this._mapQueryResultToInvoice(transactionData);
        };

    AppliedTransactions.prototype._clearTransactionRecord = function () {
        if (
            this.invoiceRecord.getValue({
                fieldId: constants.FIELD.ID,
            })
        ) {
            this._clearSublistsInTransactionRecord();
            this._clearTransactionFieldsInTransactionRecord();
        }
    };

    AppliedTransactions.prototype._clearTransactionFieldsInTransactionRecord =
        function () {
            this.transactionFields
                .filter(function (value) {
                    return value !== constants.FIELD.EXCHANGERATE;
                })
                .forEach(function (field) {
                    this.invoiceRecord.setValue({
                        fieldId: field,
                        value: "",
                    });
                }, this);
        };

    AppliedTransactions.prototype._clearSublistsInTransactionRecord =
        function () {
            var itemsLength = this.invoiceRecord.getLineCount({
                sublistId: "item",
            });
            var taxDetailsLength = this.invoiceRecord.getLineCount({
                sublistId: "taxdetails",
            });
            this._removeItemsFromSublistInTransactionRecord(
                "item",
                itemsLength
            );
            this._removeItemsFromSublistInTransactionRecord(
                "taxdetails",
                taxDetailsLength
            );
        };

    AppliedTransactions.prototype._removeItemsFromSublistInTransactionRecord =
        function (sublistId, sublistLineCount) {
            for (var i = sublistLineCount - 1; i >= 0; i--) {
                this.invoiceRecord.removeLine({
                    sublistId: sublistId,
                    line: i,
                });
            }
        };

    AppliedTransactions.prototype._mapQueryResultToInvoice = function (
        transactionData
    ) {
        function addSublistLine(
            invoiceRecord,
            sublistName,
            sublistFieldList,
            sublistData,
            lineNumber
        ) {
            invoiceRecord.insertLine({
                sublistId: sublistName,
                line: lineNumber,
            });
            sublistFieldList.forEach(function (itemField) {
                var sublistFieldName =
                    typeof itemField === "object" ? itemField.name : itemField;
                var sublistFieldValue =
                    typeof itemField === "object"
                        ? itemField.value(invoiceRecord, sublistData)
                        : sublistData[itemField];
                invoiceRecord.setSublistValue({
                    sublistId: sublistName,
                    fieldId: sublistFieldName,
                    line: lineNumber,
                    value: sublistFieldValue,
                });
            });
        }

        this.invoiceRecord.setValue({
            fieldId: constants.FIELD.ID,
            value: transactionData[constants.FIELD.ID],
        });
        this.transactionFields.forEach(function (transactionField) {
            this.invoiceRecord.setValue({
                fieldId: transactionField,
                value: transactionData[transactionField],
            });
        }, this);
        transactionData.items.forEach(function (item) {
            // No need to check if null value because the forEach callback is invoked only for array indexes which have assigned values.
            // It is not invoked for empty slots in sparse arrays (like in our case).
            var itemIndex = this.invoiceRecord.getLineCount({
                sublistId: "item",
            });
            addSublistLine(
                this.invoiceRecord,
                "item",
                this.sublistsFields.items,
                item,
                itemIndex
            );

            item.taxDetails.forEach(function (taxDetail) {
                var lineNumber = this.invoiceRecord.getLineCount({
                    sublistId: "taxdetails",
                });
                addSublistLine(
                    this.invoiceRecord,
                    "taxdetails",
                    this.sublistsFields.taxDetails,
                    taxDetail,
                    lineNumber
                );
            }, this);
        }, this);
        this.invoiceRecord.setValue({
            fieldId: constants.FIELD.TOTAL_AMOUNT,
            value: transactionData[constants.FIELD.TOTAL_AMOUNT],
        });
    };

    AppliedTransactions.prototype._correctAmountsToRealPayments = function (
        summary,
        amountPaid
    ) {
        var invoiceTotalAmount = this._getInvoiceTotalAmount(summary);
        var multiplier = amountPaid / invoiceTotalAmount;
        summary.totalBaseTransfer = summary.totalBaseTransfer * multiplier;
        summary.totalBaseWithHold = summary.totalBaseWithHold * multiplier;
        summary.transfersTaxExemptedAmount =
            summary.transfersTaxExemptedAmount * multiplier;
        for (
            var whTaxIndex = 0;
            whTaxIndex < summary.whTaxes.length;
            whTaxIndex++
        ) {
            summary.whTaxes[whTaxIndex].taxAmount = roundValue(
                summary.whTaxes[whTaxIndex].totalTaxBaseAmount *
                    summary.whTaxes[whTaxIndex].taxRate *
                    multiplier
            );
            summary.whTaxes[whTaxIndex].totalTaxBaseAmount = roundValue(
                summary.whTaxes[whTaxIndex].totalTaxBaseAmount * multiplier
            );
        }
        for (
            var transferTaxIndex = 0;
            transferTaxIndex < summary.transferTaxes.length;
            transferTaxIndex++
        ) {
            summary.transferTaxes[transferTaxIndex].taxAmount = roundValue(
                summary.transferTaxes[transferTaxIndex].totalTaxBaseAmount *
                    summary.transferTaxes[transferTaxIndex].taxRate *
                    multiplier
            );
            summary.transferTaxes[transferTaxIndex].totalTaxBaseAmount =
                roundValue(
                    summary.transferTaxes[transferTaxIndex].totalTaxBaseAmount *
                        multiplier
                );
        }
        for (
            var exemptTaxesIndex = 0;
            exemptTaxesIndex < summary.exemptTaxes.length;
            exemptTaxesIndex++
        ) {
            summary.exemptTaxes[exemptTaxesIndex].taxAmount = roundValue(
                summary.exemptTaxes[exemptTaxesIndex].taxAmount * multiplier
            );
            summary.exemptTaxes[exemptTaxesIndex].totalTaxBaseAmount =
                roundValue(
                    summary.exemptTaxes[exemptTaxesIndex].totalTaxBaseAmount *
                        multiplier
                );
        }
        return summary;
    };

    AppliedTransactions.prototype._getTaxSummary = function (invoiceRecord) {
        var recordsLoaded = {};
        var relatedInvoice = {
            transactionRecord: invoiceRecord,
            pdf: true,
            isFromCustomerPayment: true,
        };
        var result = this.commonXmlGenerator.objectify(
            relatedInvoice,
            recordsLoaded
        );
        return result.summary;
    };

    AppliedTransactions.prototype._getInvoiceTotalAmount = function (summary) {
        return this.suiteTaxFeature
            ? this.invoiceRecord.getValue(constants.FIELD.TOTAL_AMOUNT)
            : summary.totalAmount;
    };

    function getInstance(
        query,
        nsRuntime,
        nsRecord,
        commonXmlGenerator,
        SATCodes
    ) {
        return new AppliedTransactions(
            query,
            nsRuntime,
            nsRecord,
            commonXmlGenerator,
            SATCodes
        );
    }

    return {
        getInstance: getInstance,
    };
});