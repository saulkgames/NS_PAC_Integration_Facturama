/**
 * @copyright ©2024, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @NScriptType ClientScript
 */
define((function() {
    return _ = {
            4920: function(_, E, t) {
                var e;
                void 0 === (e = function() {
                    return Object.freeze({
                        DEFAULT_PAC_PDF_LOCALE: "es_ES",
                        MAPPING: {
                            CATEGORY: {
                                SAT_ACCOUNT_GROUPING: "sat_account_grouping",
                                SAT_BANK: "sat_bank",
                                SAT_PAYMENT_METHOD: "sat_payment_method",
                                SAT_UNIT_CODE: "sat_unit_code",
                                SAT_TAX_CATEGORY: "sat_tax_category"
                            }
                        },
                        PACNAME: {
                            FACTIBLE: "Solución Factible",
                            PROFACT: "ProFact",
                            MYSUITE: "mysuite"
                        },
                        AVAILABLE_PACS: ["ProFact E-Document Package", "Solución Factible E-Document Package", "MySuite E-Document Package"],
                        LIST: {
                            TAX_FACTOR_TYPE: {
                                EXEMPT: "Exento",
                                TASA: "Tasa",
                                CUOTA: "Cuota"
                            },
                            EI_STATUS: {
                                CERT_IN_PROGRESS: 20,
                                CERT_DATA_ERR: 21,
                                CERT_FAILED: 22,
                                READY_FOR_SENDING: 3,
                                READY_FOR_CERTIFICATION: 19
                            },
                            TAX_CODE: {
                                ISR: "001",
                                IVA: "002",
                                IEPS: "003"
                            }
                        },
                        ENVIRONMENT: {
                            LEGACY: 1,
                            SUITE_TAX: 2
                        },
                        FEATURE: {
                            ONE_WORLD: "subsidiaries",
                            SUITE_TAX: "tax_overhauling",
                            MULTICURRENCY: "multicurrency"
                        },
                        FIELD: {
                            ID: "id",
                            INTERNALID: "internalid",
                            IS_INACTIVE: "isinactive",
                            LABEL: "label",
                            LOCALE: "locale",
                            NAME: "name",
                            BILLING_COUNTRY: "billcountry",
                            CREATED_FROM: "createdfrom",
                            COUNTRY: "country",
                            CURRENCY: "currency",
                            CUSTOMER: "customer",
                            ENTITY: "entity",
                            FEDERAL_ID_NUMBER: "federalidnumber",
                            EMPLOYER_ID: "employerid",
                            ITEM: "item",
                            LINE: "line",
                            LINE_SEQUENCE_NUMBER: "linesequencenumber",
                            BASE_TAX_AMOUNT: "basetaxamount",
                            TAX_DETAILS_REFERENCE: "taxdetailsreference",
                            OPERATION_TYPE: "custbody_mx_operation_type",
                            RATE: "rate",
                            SUBSIDIARY: "subsidiary",
                            INCLUDE_CHILDREN: "includechildren",
                            TAX_CODE: "taxcode",
                            TAX_TYPE: "taxtype",
                            TAX_NAME: "taxname",
                            TAX_RATE: "taxrate",
                            TAX_RATE_1: "taxrate1",
                            TAX_AMOUNT: "taxamount",
                            TOTAL_AMOUNT: "total",
                            TAX_BASIS: "taxbasis",
                            FOREIGN_TOTAL: "foreigntotal",
                            FOREIGN_AMOUNT_UNPAID: "foreignamountunpaid",
                            SUBSIDIARY_IS_ELIMINATION: "iselimination",
                            SUBSIDIARY_PARENT: "parent",
                            IS_PERSON: "isperson",
                            TRANSACTION_NUMBER: "transactionnumber",
                            MAIN_LINE: "mainline",
                            NEXUS_COUNTRY: "nexuscountry",
                            TAX_REGISTRATION_NUMBER: "taxregistrationnumber",
                            TO_SUBSIDIARY: "tosubsidiary",
                            ITEM_TYPE: "itemtype",
                            ACCT_NAME: "acctname",
                            ACCT_NUMBER: "acctnumber",
                            ACCT_TYPE: "accttype",
                            MX_BANK_ACCOUNT_NUMBER: "custbody_mx_bank_acct_num",
                            MX_BANK_INFORMATION: "custbody_mx_bank_information",
                            MX_BANK_NAME: "custbody_mx_bank_name",
                            MX_CFDI_ADDENDUM: "custbody_mx_cfdi_sat_addendum",
                            MX_CFDI_USAGE: "custbody_mx_cfdi_usage",
                            MX_CFDI_SERIE: "custbody_mx_cfdi_serie",
                            MX_CFDI_FOLIO: "custbody_mx_cfdi_folio",
                            MX_CFDI_SAT_EXPORT_TYPE: "custbody_mx_cfdi_sat_export_type",
                            MX_CUSTOMER_RFC: "custbody_mx_customer_rfc",
                            MX_PAYMENT_METHOD: "custbody_mx_payment_method",
                            MX_SAT_CERTIFY_TIME_TIMESTAMP: "custbody_mx_cfdi_certify_timestamp",
                            MX_SAT_PAYMENT_METHOD: "custbody_mx_txn_sat_payment_method",
                            MX_PAYMENT_STRING_TYPE: "custbody_mx_cfdi_payment_string_type",
                            MX_SAT_PAYMENT_TERM: "custbody_mx_txn_sat_payment_term",
                            MX_SAT_UUID: "custbody_mx_cfdi_uuid",
                            MX_JOURNALENTRY_CREATEDBY: "custbody_mx_journalentry_createdby",
                            MX_JOURNALENTRY_AUTHORIZEDBY: "custbody_mx_journalentry_authorizedby",
                            MX_UUID_RECEIVED: "custbody_mx_inbound_bill_uuid",
                            EI_CFDI_SAT_SIGNATURE: "custbody_mx_cfdi_sat_signature",
                            EI_CFDI_ISSUE_DIGITAL_SIGNATURE: "custbody_mx_cfdi_signature",
                            EI_CFDI_CADENA_ORIGINAL: "custbody_mx_cfdi_cadena_original",
                            EI_CFDI_QR_CODE: "custbody_mx_cfdi_qr_code",
                            EI_TEMPLATE: "custbody_psg_ei_template",
                            EI_CFDI_SAT_SERIAL_NUMBER: "custbody_mx_cfdi_sat_serial",
                            EI_CFDI_ISSUER_SERIAL_NUMBER: "custbody_mx_cfdi_issuer_serial",
                            EI_CFDI_ISSUED_TIMESTAMP: "custbody_mx_cfdi_issue_datetime",
                            EI_GENERATED_PDF_EDOC: "custbody_edoc_generated_pdf",
                            EI_DOC_STATUS: "custbody_psg_ei_status",
                            EI_CERTIFIED_EDOCUMENT: "custbody_psg_ei_certified_edoc",
                            EI_SM_SENDING_CHANNEL: "custrecord_ei_sending_method_channel",
                            EI_SM_PACKAGE: "custrecord_psg_ei_edoc_standard",
                            EI_SM_FOR_CERFIFY: "custrecord_ei_sending_method_for_certifi",
                            EI_SM_SUBSIDIARIES: "custrecord_psg_ei_sm_subsidiary",
                            EI_TMPL_PACKAGE: "custrecord_psg_ei_template_edoc_standard",
                            EI_TMPL_SUBSIDIARIES: "custrecord_psg_ei_template_subsidiary",
                            WH_ITEMCOL_TAXCODE: "custcol_4601_witaxcode",
                            WH_ITEMCOL_TAXBASEAMOUNT: "custcol_4601_witaxbaseamount",
                            WH_ITEMCOL_TAXAMOUNT: "custcol_4601_witaxamount",
                            WH_ITEMCOL_APPLIES: "custcol_4601_witaxapplies",
                            INDUSTRY_TYPE: "custrecord_mx_sat_industry_type",
                            MX_ITR_IMPORT: "custrecord_4110_import",
                            MX_BANK_INFORMATION_ENTITY: "custrecord_psg_mx_bank_info_entity",
                            MX_PACINFO_PDFLOCALE_ISOCODE: "custrecord_mx_iso_code",
                            MX_PACINFO_TAXID: "custrecord_mx_pacinfo_taxid",
                            MX_PACINFO_URL: "custrecord_mx_pacinfo_url",
                            MX_PACINFO_USERNAME: "custrecord_mx_pacinfo_username",
                            MX_PACINFO_PASSWORD: "custrecord_mx_pacinfo_password",
                            MX_PACINFO_PASSWORD_BACKEND: "custrecord_mx_pacinfo_password_backend",
                            MX_PACINFO_EDOC_PACKAGE: "custrecord_mx_edoc_package_name",
                            MX_PACINFO_PAC_PLUGIN_IMPL: "custrecord_mx_pac_connector_pi",
                            MX_PACINFO_TMPL_INVOICE: "custrecord_mx_invoice_pdf_tmpl",
                            MX_PACINFO_TMPL_CASHSALE: "custrecord_mx_cash_sale_pdf_tmpl",
                            MX_PACINFO_TMPL_ITEMFULFILLMENT: "custrecord_mx_item_fulfillment_pdf_tmpl",
                            MX_PACINFO_TMPL_PAYMENT: "custrecord_mx_customer_payment_pdf_tmpl",
                            MX_PACINFO_TMPL_CREDITMEMO: "custrecord_mx_credit_memo_pdf_tmpl",
                            MX_PACINFO_PDF_DEFAULT_LANGUAGE: "custrecord_mx_pdf_tmpl_default_language",
                            MX_PACINFO_IMPORTANT: "custrecord_mx_pacinfo_important",
                            MX_PACINFO_I_AGREE: "custrecord_mx_pacinfo_i_agree",
                            MX_PACINFO_ENABLE: "custrecord_mx_pacinfo_enable",
                            MX_PACINFO_SUBSIDIARY: "custrecord_mx_pacinfo_subsidiary",
                            MX_PACINFO_INVOICE_SERIE: "custrecord_mx_invoice_serie",
                            MX_PACINFO_INVOICE_PREFIX: "custrecord_mx_invoice_prefix",
                            MX_PACINFO_INVOICE_SUFFIX: "custrecord_mx_invoice_suffix",
                            MX_PACINFO_CASH_SALE_SERIE: "custrecord_mx_cash_sale_serie",
                            MX_PACINFO_CASH_SALE_PREFIX: "custrecord_mx_cash_sale_prefix",
                            MX_PACINFO_CASH_SALE_SUFFIX: "custrecord_mx_cash_sale_suffix",
                            MX_PACINFO_CREDIT_MEMO_SERIE: "custrecord_mx_credit_memo_serie",
                            MX_PACINFO_CREDIT_MEMO_PREFIX: "custrecord_mx_credit_memo_prefix",
                            MX_PACINFO_CREDIT_MEMO_SUFFIX: "custrecord_mx_credit_memo_suffix",
                            MX_PACINFO_ITEM_FULFILLMENT_SERIE: "custrecord_mx_item_fulfillment_serie",
                            MX_PACINFO_ITEM_FULFILLMENT_PREFIX: "custrecord_mx_item_fulfillment_prefix",
                            MX_PACINFO_ITEM_FULFILLMENT_SUFFIX: "custrecord_mx_item_fulfillment_suffix",
                            MX_PACINFO_CUSTOMER_PAYMENT_SERIE: "custrecord_mx_customer_payment_serie",
                            MX_PACINFO_CUSTOMER_PAYMENT_PREFIX: "custrecord_mx_customer_payment_prefix",
                            MX_PACINFO_CUSTOMER_PAYMENT_SUFFIX: "custrecord_mx_customer_payment_suffix",
                            MX_SAT_ITEM_CODE_MIRROR_RECORD: "custrecord_mx_ic_mirror_record",
                            MX_SAT_UNIT_CODE_MIRROR_RECORD: "custrecord_mx_sat_mirror_record",
                            MX_SAT_UNIT_CODE_CODE: "custrecord_mx_sat_uc_code",
                            MX_SAT_ITEM_CODE_CODE: "custrecord_mx_ic_code",
                            MX_SAT_UNIT_CODE_EFFECTIVE_FROM: "custrecord_mx_sat_uc_start",
                            MX_SAT_ITEM_CODE_EFFECTIVE_FROM: "custrecord_mx_ic_start",
                            MX_SAT_UNIT_CODE_VALID_UNTIL: "custrecord_mx_sat_uc_end",
                            MX_SAT_ITEM_CODE_VALID_UNTIL: "custrecord_mx_ic_end",
                            MX_RELATED_CFDIS_RELATIONSHIP_TYPE: "custrecord_mx_rcs_rel_type",
                            MX_RELATED_CFDIS_INTERNAL_ID: "custrecord_mx_rcs_rel_cfdi",
                            MX_L10N_STATUS: "custrecord_mx_l10n_status",
                            MX_L10N_CORE_SUITEAPP: "custrecord_mx_l10n_coreapp",
                            MX_L10N_DETAILS: "custrecord_mx_l10n_details",
                            MX_L10N_FILE: "custrecord_mx_l10n_filename",
                            MX_L10N_UPDATE_FILE: "custrecord_mx_l10n_update_filename",
                            MX_BANK_INFORMATION_DN: "custpage_mx_bank_information",
                            MX_IMPORT_TAX_CODES: "custpage_mx_importtaxcodes",
                            MX_TAX_GROUPS: "custpage_mx_taxgroups",
                            MX_CUSTCOL_VENDOR: "custcol_mx_vendor",
                            MX_CUSTCOL_OPERATION_TYPE: "custcol_mx_operation_type",
                            MX_CUSTCOL_SAT_ITEM_CODE: "custcol_mx_txn_line_sat_item_code",
                            MX_CUSTCOL_SAT_TAX_OBJECT: "custcol_mx_txn_line_sat_tax_object",
                            MX_CUSTITEM_SAT_ITEM_CODE: "custitem_mx_txn_item_sat_item_code",
                            MX_CUSTITEM_SAT_ITEM_TYPE: "custitem_mx_txn_item_sat_item_type",
                            MX_CUSTENTITY_RFC: "custentity_mx_rfc",
                            MX_CUSTENTITY_SAT_INDUSTRY_TYPE: "custentity_mx_sat_industry_type",
                            MX_CFDI_PAYMENT_ID: "custbody_mx_cfdi_payment_id",
                            MX_CFDI_ISSUER_ENTITY_RFC: "custbody_mx_cfdi_issuer_entity_rfc",
                            MX_CFDI_ISSUE_BANK_NAME: "custbody_mx_cfdi_issue_bank_name",
                            MX_CFDI_PAYER_ACCOUNT: "custbody_mx_cfdi_payer_account",
                            MX_CFDI_RECIPIENT_ENTITY_RFC: "custbody_mx_cfdi_recipient_entity_rfc",
                            MX_CFDI_RECIPIENT_ACCOUNT: "custbody_mx_cfdi_recipient_account",
                            MX_CFDI_PAYMENT_CERTIFICATE: "custbody_mx_cfdi_payment_certificate",
                            MX_CFDI_PAYMENT_STRING: "custbody_mx_cfdi_payment_string",
                            MX_CFDI_PAYMENT_SIGNATURE: "custbody_mx_cfdi_payment_signature",
                            MX_CFDI_PAYMENT_STRING_TYPE: "custbody_mx_cfdi_payment_string_type",
                            MEXICO_MAPPING_VALUE_CODE: "custrecord_mx_mapper_value_inreport",
                            MX_MAPPER_VALUE_CATEGORY: "custrecord_mx_mapper_value_category",
                            MX_MAPPER_VALUE_START: "custrecord_mx_mapper_value_start",
                            MX_MAPPER_VALUE_END: "custrecord_mx_mapper_value_end",
                            MX_IC_MR_CODE: "custrecord_mx_ic_mr_code",
                            MX_IC_MR_START: "custrecord_mx_ic_mr_start",
                            MX_IC_MR_END: "custrecord_mx_ic_mr_end",
                            FT_FOREIGN_TRADE: "custbody_mft_sat_foreign_trade",
                            FT_SAT_ITEM_CODE: "custcol_mx_txn_line_sat_item_code",
                            FT_SAT_TARIFF_ITEM_CODE: "custcol_mft_sat_tariff_item_code",
                            FT_SAT_CUSTOMS_QUANTITY: "custcol_mft_customs_quantity",
                            FT_SAT_CUSTOMS_UNIT_CODE: "custcol_mft_sat_customs_unit_code",
                            FT_SAT_CUSTOMS_UNIT_PRICE: "custcol_mft_customs_unit_price",
                            FT_SAT_USD_CUSTOMS_AMOUNT: "custcol_mft_usd_customs_amount",
                            FT_SAT_TIC_CODE: "customrecord_mft_sat_tariff_item_code",
                            FT_SAT_TIC_CODE_CODE: "custrecord_mft_sat_tic_code",
                            FT_SAT_INCOTERM: "custbody_mft_sat_incoterm",
                            FT_SAT_INCOTERM_RECORD: "customrecord_mft_sat_incoterms",
                            FT_SAT_INCOTERM_CODE: "custrecord_mft_sat_inc_code",
                            FT_SAT_REASON_FOR_TRANSFER: "custbody_mft_sat_reason_for_transfer",
                            FT_SAT_REASON_FOR_TRANSFER_RECORD: "customrecord_mft_sat_reason_for_transfer",
                            FT_SAT_REASON_FOR_TRANSFER_CODE: "custrecord_mft_sat_rft_code",
                            FT_SAT_CUSTOMS_UNIT_CODE_RECORD: "customrecord_mft_sat_customs_unit_code",
                            FT_SAT_CUSTOMS_UNIT_CODE_CODE: "custrecord_mft_sat_cuc_code",
                            FT_CERTIFICATE_OF_ORIGIN: "custbody_mft_certificate_of_origin",
                            MX_SAT_REGISTERED_NAME_ENTITY: "custentity_mx_sat_registered_name",
                            MX_SAT_REGISTERED_NAME_COMPANY: "custrecord_mx_sat_registered_name",
                            MANUFACTURER: "manufacturer",
                            MPN: "mpn",
                            EXCHANGERATE: "exchangerate",
                            ADDRESSEE: "custbody_mft_addressee",
                            MCP_BILL_OF_LADING: "custbody_mcp_sat_c_carta_porte",
                            AMOUNT: "amount",
                            UNITS: "units",
                            QUANTITY: "quantity"
                        },
                        FIELD_LABEL: {
                            MX_OPERATION_TYPE_DEPRECATED: "OPERATION TYPE (DEPRECATED)"
                        },
                        FIELD_TYPE: {
                            TEXT_AREA: "textarea",
                            LONG_TEXT: "longtext",
                            SELECT: "select",
                            INLINEHTML: "INLINEHTML"
                        },
                        XML_FIELD_TYPE: {
                            TEXT: "TEXT",
                            SELECT: "SELECT"
                        },
                        FIELD_DISPLAY_TYPE: {
                            NORMAL: "NORMAL",
                            HIDDEN: "HIDDEN",
                            READONLY: "READONLY",
                            DISABLED: "DISABLED",
                            ENTRY: "ENTRY",
                            INLINE: "INLINE"
                        },
                        SUBLIST: {
                            ADDRESS: "addressbook",
                            EXPENSES: "expense",
                            ITEMS: "item",
                            SUBSIDIARIES: "submachine",
                            TAX_ITEMS: "taxitem",
                            TAX_REGISTRATION: "taxregistration",
                            TRANSLATIONS: "translations",
                            BANK_DETAILS: "recmachcustrecord_psg_mx_bank_info_entity",
                            RELATED_CFDIS: "recmachcustrecord_mx_rcs_orig_trans"
                        },
                        CONTEXT_TYPE: {
                            CREATE: "create",
                            DELETE: "delete",
                            EDIT: "edit",
                            VIEW: "view",
                            COPY: "copy",
                            XEDIT: "xedit"
                        },
                        RECORD_TYPE: {
                            ACCOUNT: "account",
                            ASSEMBLY_BUILD: "assemblybuild",
                            ASSEMBLY_UNBUILD: "assemblyunbuild",
                            BIN_TRANSFER: "bintransfer",
                            BIN_WORKSHEET: "binworksheet",
                            BLANKET_PURCHASE_ORDER: "blanketpurchaseorder",
                            CASH_REFUND: "cashrefund",
                            CASH_SALE: "cashsale",
                            CHECK: "check",
                            CONTACT: "contact",
                            CREDIT_CARD_CHARGE: "creditcardcharge",
                            CREDIT_CARD_REFUND: "creditcardrefund",
                            CREDIT_MEMO: "creditmemo",
                            CUSTOMER: "customer",
                            CUSTOMER_DEPOSIT: "customerdeposit",
                            CUSTOMER_PAYMENT: "customerpayment",
                            CUSTOMER_PAYMENT_AUTHORIZATION: "customerpaymentauthorization",
                            CUSTOMER_REFUND: "customerrefund",
                            DEPOSIT: "deposit",
                            DEPOSIT_APPLICATION: "depositapplication",
                            EMPLOYEE: "employee",
                            ESTIMATE: "estimate",
                            EXPENSE_REPORT: "expensereport",
                            FULFILLMENT_REQUEST: "fulfillmentrequest",
                            INBOUND_SHIPMENT: "inboundshipment",
                            INVENTORY_ADJUSTMENT: "inventoryadjustment",
                            INVENTORY_COST_REVALUATION: "inventorycostrevaluation",
                            INVENTORY_COUNT: "inventorycount",
                            INVENTORY_STATUS_CHANGE: "inventorystatuschange",
                            INVENTORY_TRANSFER: "inventorytransfer",
                            INVOICE: "invoice",
                            ITEM_FULFILLMENT: "itemfulfillment",
                            ITEM_RECEIPT: "itemreceipt",
                            JOURNAL_ENTRY: "journalentry",
                            LEAD: "lead",
                            OPPORTUNITY: "opportunity",
                            PARTNER: "partner",
                            PAYCHECK: "paycheck",
                            PAYCHECK_JOURNAL: "paycheckjournal",
                            PERIOD_END_JOURNAL: "periodendjournal",
                            PROSPECT: "prospect",
                            PURCHASE_CONTRACT: "purchasecontract",
                            PURCHASE_ORDER: "purchaseorder",
                            PURCHASE_REQUISITION: "purchaserequisition",
                            RETURN_AUTHORIZATION: "returnauthorization",
                            REVENUE_ARRANGEMENT: "revenuearrangement",
                            REVENUE_COMMITMENT: "revenuecommitment",
                            REVENUE_COMMITMENT_REVERSAL: "revenuecommitmentreversal",
                            SALES_ORDER: "salesorder",
                            STORE_PICKUP_FULFILLMENT: "storepickupfulfillment",
                            SUBSIDIARY: "subsidiary",
                            TAX_TYPE: "taxtype",
                            COMPANY_INFORMATION: "companyinformation",
                            TRANSFER_ORDER: "transferorder",
                            INTERCOMPANY_TRANSFER_ORDER: "intercompanytransferorder",
                            VENDOR: "vendor",
                            VENDOR_BILL: "vendorbill",
                            VENDOR_CREDIT: "vendorcredit",
                            VENDOR_PAYMENT: "vendorpayment",
                            VENDOR_RETURN_AUTHORIZATION: "vendorreturnauthorization",
                            WORK_ORDER: "workorder",
                            WORK_ORDER_CLOSE: "workorderclose",
                            WORK_ORDER_COMPLETION: "workordercompletion",
                            WORK_ORDER_ISSUE: "workorderissue",
                            ITEM_ASSEMBLY: "assemblyitem",
                            ITEM_ASSEMBLY_LOT_NUMBERED: "lotnumberedassemblyitem",
                            ITEM_ASSEMBLY_SERIALIZED: "serializedassemblyitem",
                            ITEM_GIFT: "giftcertificateitem",
                            ITEM_INVENTORY: "inventoryitem",
                            ITEM_INVENTORY_LOT_NUMBERED: "lotnumberedinventoryitem",
                            ITEM_INVENTORY_SERIALIZED: "serializedinventoryitem",
                            ITEM_KIT: "kititem",
                            ITEM_NON_INVENTORY: "noninventoryitem",
                            ITEM_OTHER_CHARGE: "otherchargeitem",
                            ITEM_SERVICE: "serviceitem",
                            TAX_GROUP: "taxgroup",
                            MX_BANK_INFORMATION: "customrecord_psg_mx_bank_info",
                            MX_PAC_CONNECTION_INFO: "customrecord_mx_pac_connect_info",
                            MX_PAC_PDF_LANGUAGE: "customrecord_mx_pdf_language",
                            MX_SAT_ITEM_CODE: "customrecord_mx_sat_item_code",
                            MX_SAT_UNIT_CODE: "customrecord_mx_sat_unit_code",
                            MX_L10N_COMPONENT: "customrecord_mx_l10n_component",
                            MX_PAYMENT_STRING_TYPE: "customrecord_mx_sat_payment_string_type",
                            MX_SAT_ITEM_CODE_MIRROR: "customrecord_mx_sat_item_code_mirror",
                            MX_SAT_UNIT_CODE_MIRROR: "customrecord_mx_mapper_values",
                            MX_SAT_EXPORT_TYPE: "customrecord_mx_sat_export_type",
                            MX_SAT_CFDI_USAGE: "customrecord_mx_sat_cfdi_usage",
                            EI_EDOCUMENT_PACKAGE: "customrecord_psg_ei_standards",
                            EI_EDOCUMENT_SENDING_METHOD: "customrecord_ei_sending_method",
                            EI_EDOCUMENT_TEMPLATE: "customrecord_psg_ei_template",
                            EP_PAYMENT_FILE_FORMAT: "customrecord_2663_payment_file_format",
                            MEXICO_MAPPING_VALUE: "customrecord_mx_mapper_values",
                            ADV_INTERCOMPANY_JOURNAL_ENTRY: "advintercompanyjournalentry",
                            MX_DEFERRED_TAX_ACCOUNTS_MAPPING: {
                                RECORD: "customrecord_mx_deferred_tax_account_map",
                                RECORD_TYPE: "custrecord_mx_tt_src_record_type",
                                COLUMN_TAX_TYPE: "custrecord_mx_tax_type",
                                COLUMN_PURCHASE_ACCOUNT: "custrecord_mx_purchase_tax_account",
                                COLUMN_SALES_ACCOUNT: "custrecord_mx_sales_tax_account"
                            },
                            WT_TAX_TYPES: {
                                RECORD: "customrecord_4601_witaxtype",
                                NAME: "custrecord_4601_wtt_name",
                                COUNTRY: "custrecord_ph4014_wtax_type_country_h",
                                SETUP: "custrecord_4601_wtt_witaxsetup"
                            },
                            WT_TAX_SETUP: {
                                RECORD: "customrecord_4601_witaxsetup",
                                NEXUS: "custrecord_4601_wts_nexus"
                            },
                            WT_TAX_GROUP: {
                                RECORD: "customrecord_4601_groupedwitaxcode",
                                GROUP_TAX_CODE: "custrecord_4601_gwtc_group",
                                ITEM_TAX_CODE: "custrecord_4601_gwtc_code"
                            },
                            WT_TAX_CODE: {
                                RECORD: "customrecord_4601_witaxcode",
                                RATE: "custrecord_4601_wtc_rate",
                                NAME: "custrecord_4601_wtc_name",
                                TYPE: "custrecord_4601_wtc_witaxtype"
                            }
                        },
                        CUSTOMTRANSACTION: {
                            MCF_EDOC_CANCEL: "customsale_mcf_edoc_cancel"
                        },
                        SHARED_MODULE: {
                            EI_UUID: "2766bbe8-12cd-42ef-801f-403e51982e90",
                            EP_UUID: "9b7c40f5-d1e0-415d-a8f7-2a853f761075",
                            MX_LOCALIZATION: "cd476cab-e846-474e-9f11-e213e69c420b"
                        },
                        OTHER: {
                            MX_ELECTRONIC_FUNDS: "mx_electronic_funds",
                            MX_SUBSIDIARY_COUNTRY_MAP: "mx_sub_country_map",
                            MEXICO_COUNTRY_CODE: "MX",
                            MEXICO_COMPLIANCE_BUNDLE_NAME: "Mexico Compliance"
                        },
                        MX_L10N_SUITAPP: {
                            ELECTRONIC_PAYMENT: "1",
                            MEXICO_LOCALIZATION: "2",
                            ELECTRONIC_INVOICING: "3"
                        },
                        MX_L10N_INSTALL_STATUS: {
                            PENDING_INSTALLATION: 1,
                            INSTALLED: 2,
                            INSTALLATION_FAILED: 3,
                            SUITE_APP_UNAVAIALBALE: 4
                        },
                        OPERATION_TYPE: {
                            PROFESSIONAL_SERVICES: "1",
                            REAL_ESTATE_LEASING: "2",
                            OTHERS: "3",
                            ASSETS_ALIENATION: "4",
                            GOODS_SERVICES_IMPORT: "5",
                            VIRTUAL_TRANSF_IMPORT: "6",
                            GLOBAL_OPERATIONS: "7"
                        },
                        SCRIPT_TYPE: {
                            CS: "CLIENT_SCRIPT",
                            UE: "USER_EVENT",
                            SS: "SCHEDULED_SCRIPT",
                            MR: "MAP_REDUCE",
                            SL: "SUITELET",
                            RL: "RESTLET"
                        },
                        SUITEQL: {
                            LIST_PLACEHOLDER: "#LIST#",
                            LIST_COLUMNS_PLACEHOLDER: /#LIST_COLUMNS#/gim,
                            CUSTOMER_ADDRESS_FIELDS: {
                                SAT_COUNTRY_CODE: "SELECT satC.custrecord_mft_sat_cnt_code AS satCountry FROM\ncustomerAddressbook AS ab,\ncustomerAddressbookEntityAddress AS ea\n,customrecord_mft_sat_countries satC\nWHERE\nab.Entity = ?\nAND ab.DefaultBilling = 'T'\nAND ab.addressbookaddress = ea.Nkey\nAND ea.country = satC.custrecord_mft_sat_cnt_ns_code\n",
                                SAT_STATE_CODE: "SELECT sat.custrecord_mft_sat_state_code AS satState\nFROM customerAddressbook AS ab,\ncustomerAddressbookEntityAddress AS ea,\ncustomrecord_mft_sat_states AS sat \nWHERE ab.Entity = ?\nAND ab.DefaultBilling = 'T'\nAND ab.addressbookaddress = ea.Nkey \nAND ea.dropdownstate= sat.custrecord_mft_sat_state_ns_code",
                                CUSTOMER_DEFAULT_BILLING_ADDRESS: "SELECT \nzip, country\nFROM customerAddressbookEntityAddress AS ea\nINNER JOIN Customer as c\nON ea.recordowner = c.defaultbillingaddress\nWHERE ea.recordowner = (SELECT defaultbillingaddress FROM Customer WHERE id = ?)"
                            },
                            SUBSIDIARY_ADDRESS_FIELDS: {
                                NOT_ENCODED_FIELDS: "SELECT ea.zip, ea.addressee, ea.custrecord_streetname AS streetname, ea.custrecord_streetnum AS streetnumber, ea.custrecord_unit AS apartment\nFROM\nsubsidiary AS s,\notherNameAddressbookEntityAddress AS ea\nWHERE\ns.id = ?\nAND s.mainaddress = ea.Nkey \n",
                                SAT_COUNTRY_CODE: "SELECT satC.custrecord_mft_sat_cnt_code AS satCountry FROM\nsubsidiary AS s,\notherNameAddressbookEntityAddress AS ea\n,customrecord_mft_sat_countries satC\nWHERE\ns.id = ?\nAND s.mainaddress = ea.Nkey \nAND ea.country = satC.custrecord_mft_sat_cnt_ns_code\n",
                                SAT_STATE_CODE: "SELECT \nsat.custrecord_mft_sat_state_code AS satState \nFROM \nsubsidiary AS s,\notherNameAddressbookEntityAddress AS ea, \ncustomrecord_mft_sat_states AS sat\nWHERE \ns.id = ?\nAND s.mainaddress = ea.Nkey \nAND sat.custrecord_mft_sat_state_ns_code = ea.dropdownstate\n",
                                SAT_INDUSTRY_TYPE_CODE: "SELECT DISTINCT \ncustrecord_mx_sat_it_code \nFROM customrecord_mx_sat_industry_type AS sit \nINNER JOIN subsidiary AS s \nON sit.id = s.custrecord_mx_sat_industry_type \nINNER JOIN memDocTransactionTemplateLine AS md \nON s.id = md.subsidiary \nWHERE md.transaction = ?"
                            },
                            CUSTOMER_FIELDS: {
                                SAT_INDUSTRY_TYPE: "SELECT cus.custentity_mx_sat_industry_type as industry_type FROM customer cus WHERE cus.id = ?"
                            },
                            SUITETAX: {
                                SALES_TAX_ITEM: {
                                    NOT_ENCODED_FIELDS: "SELECT salesTaxItem.taxtype, salesTaxItem.id FROM salesTaxItem ORDER BY salesTaxItem.id"
                                },
                                WITHHOLDING: {
                                    NOT_ENCODED_FIELDS: "SELECT tt.id FROM taxtype tt WHERE tt.doesnotaddtototal = ? AND tt.country = ?"
                                }
                            },
                            MX_MAPPER_VALUES: {
                                NOT_ENCODED_FIELDS: "SELECT custrecord_mx_mapper_value_inreport, name, id FROM customrecord_mx_mapper_values"
                            },
                            SAT: {
                                EXPORT_TYPE: {
                                    NOT_ENCODED_FIELDS: "SELECT et.custrecord_mx_sat_et_description as description, et.custrecord_mx_sat_et_code as code, et.custrecord_mx_sat_et_effective_from as effective_from, et.name, et.custrecord_mx_sat_et_valid_until as valid_until FROM customrecord_mx_sat_export_type et "
                                },
                                TAX_OBJECT: {
                                    NOT_ENCODED_FIELDS: "SELECT to.custrecord_mx_sat_to_description as description, to.custrecord_mx_sat_to_code as code, to.custrecord_mx_sat_to_effective_from as effective_from, to.name, to.custrecord_mx_sat_to_valid_until as valid_until, id FROM customrecord_mx_sat_tax_object to "
                                },
                                ITEM_CODE_MIRROR: {
                                    NOT_ENCODED_FIELDS: "SELECT custrecord_mx_ic_mr_code, id FROM customrecord_mx_sat_item_code_mirror WHERE id IN (#LIST#)"
                                },
                                PAYMENT_TERM: {
                                    NOT_ENCODED_FIELDS: "SELECT custrecord_mx_sat_pt_code, name, id FROM customrecord_mx_sat_payment_term"
                                },
                                INDUSTRY_TYPE: {
                                    NOT_ENCODED_FIELDS: "SELECT custrecord_mx_sat_it_code, name, id FROM customrecord_mx_sat_industry_type"
                                },
                                CFDI_USAGE: {
                                    NOT_ENCODED_FIELDS: "SELECT id, name, custrecord_mx_sat_cfdi_code FROM customrecord_mx_sat_cfdi_usage"
                                },
                                RELATIONSHIP_TYPE: {
                                    NOT_ENCODED_FIELDS: "SELECT id, custrecord_mx_sat_rel_type_code FROM customrecord_mx_sat_rel_type"
                                }
                            },
                            WITHHOLDING: {
                                GROUP_SEARCH: {
                                    NOT_ENCODED_FIELDS: "SELECT wtc.id, wtc.custrecord_4601_wtc_rate, wtc.custrecord_4601_wtc_name, wtc.custrecord_4601_wtc_witaxtype FROM customrecord_4601_groupedwitaxcode gwtc INNER JOIN customrecord_4601_witaxcode wtc ON gwtc.custrecord_4601_gwtc_code = wtc.id WHERE gwtc.custrecord_4601_gwtc_group = ?;"
                                }
                            },
                            CUSTOMER_PAYMENT: {
                                INVOICES_TAXES_ITEMS_DATA: "SELECT transaction.foreigntotal, transaction.custbody_mx_txn_sat_payment_term, transaction.entity, transaction.id, transaction.custbody_mx_cfdi_uuid, transaction.custbody_mx_cfdi_folio, transaction.custbody_mx_cfdi_serie, #LIST_COLUMNS# transactionLine.mainline, transactionLine.units, transactionLine.quantity, transactionLine.rate, transactionLine.linesequencenumber,transactionLine.item, transactionLine.itemtype, transactionTaxDetail.taxbasis, transactionTaxDetail.line, transactionTaxDetail.taxtype, transactionTaxDetail.taxcode, transactionTaxDetail.taxrate, transactionTaxDetail.taxamount, transactionTaxDetail.baseTaxAmount FROM transaction LEFT JOIN transactionLine on transaction.id = transactionLine.transaction LEFT JOIN transactionTaxDetail ON transactionLine.id = transactionTaxDetail.line AND transactionLine.transaction = transactionTaxDetail.transaction WHERE (#LIST#) AND (transactionLine.itemtype NOT IN ('TaxItem', 'Group', 'EndGroup', 'Discount') OR transactionLine.itemtype IS NULL)ORDER BY transaction.id, transactionLine.linesequencenumber",
                                INVOICES_DATA: "SELECT SUM(CASE WHEN payment.custbody_mx_cfdi_uuid IS NOT NULL THEN 1 ELSE 0 END) as times_paid_invoice, #LIST_COLUMNS# FROM transaction LEFT JOIN PreviousTransactionLink ptl ON ptl.previousdoc = transaction.id LEFT JOIN transaction payment ON payment.id = ptl.nextdoc WHERE transaction.id IN (#LIST#) AND ptl.linkType = 'Payment' AND payment.type =  'CustPymt'GROUP BY #LIST_COLUMNS#",
                                CURRENCY_SYMBOL: "SELECT symbol FROM currency WHERE id = ?",
                                TRANSACTION_ID_STATEMENT: "transaction.id IN (#LIST#)"
                            },
                            CREATED_FROM_TYPE: "SELECT type FROM transaction WHERE id = ?",
                            MCF_CANCELLATION: "SELECT custbody_mcf_folio_canc, custbody_mcf_serie_canc, custbody_mcf_uuid_canc, custbody_mcf_uuid_rep_canc, custbody_mcf_customer_rfc, TO_CHAR(trandate, 'yyyy') as year, r.custrecord_mcf_sat_cnl_rsn_code, r.custrecord_mcf_sat_cnl_rsn_name, tl.subsidiary FROM transaction t INNER JOIN transactionLine tl ON t.id = tl.transaction AND tl.mainline = 'T' INNER JOIN customrecord_mcf_sat_canc_reasons r ON r.id = t.custbody_mcf_canc_reason AND r.isinactive = 'F' WHERE t.recordtype = ? AND t.id = ?",
                            MCF_CANCELLATION_TEMPLATE: "SELECT transaction.custbody_psg_ei_template,\n       customrecord_psg_ei_template.name\nFROM  transaction\nINNER JOIN customrecord_psg_ei_template ON customrecord_psg_ei_template.id = transaction.custbody_psg_ei_template\nWHERE  transaction.id = ?"
                        },
                        EI_TEMPLATE_EXTENSIONS: {
                            FOREIGN_TRADE: {
                                BUNDLE_UUID: "819d14ab-9060-46f4-b6af-b800d8e114ec",
                                MODULE_NAME: "src/common/sat_foreign_trade"
                            },
                            CARTA_PORTE: {
                                BUNDLE_UUID: "3cfbfbd4-e637-11eb-ba80-0242ac130004",
                                MODULE_NAME: "src/common/sat_c_carta_porte"
                            },
                            COMPLEMENTARY_FEATURES: {
                                BUNDLE_UUID: "f6af5506-73c3-4e62-825b-05819e15ff45",
                                MODULE_NAME: "src/common/sat_complementary_features"
                            }
                        },
                        LEC_TYPES: {
                            CATEGORY: {
                                GOODS: "Goods"
                            },
                            OPERATION_TYPE: {
                                CANCEL: "Cancel"
                            }
                        }
                    })
                }.call(E, t, E, _)) || (_.exports = e)
            },
            6651: function(_, E, t) {
                var e, T;
                e = [t(4920)], void 0 === (T = function(_) {
                    return Object.freeze({
                        country: _.OTHER.MEXICO_COUNTRY_CODE,
                        fields: [{
                            id: _.FIELD.MX_CUSTITEM_SAT_ITEM_CODE,
                            type: _.XML_FIELD_TYPE.SELECT
                        }, {
                            id: _.FIELD.MX_CUSTITEM_SAT_ITEM_TYPE,
                            type: _.XML_FIELD_TYPE.SELECT
                        }, {
                            id: _.FIELD.MX_CUSTOMER_RFC,
                            type: _.XML_FIELD_TYPE.TEXT,
                            keepHiddenIn: [_.RECORD_TYPE.CASH_REFUND, _.RECORD_TYPE.CUSTOMER_DEPOSIT, _.RECORD_TYPE.CUSTOMER_REFUND, _.RECORD_TYPE.ESTIMATE, _.RECORD_TYPE.RETURN_AUTHORIZATION]
                        }, {
                            id: _.FIELD.MX_UUID_RECEIVED,
                            type: _.XML_FIELD_TYPE.TEXT,
                            keepHiddenIn: [_.RECORD_TYPE.BLANKET_PURCHASE_ORDER, _.RECORD_TYPE.CHECK, _.RECORD_TYPE.CREDIT_CARD_CHARGE, _.RECORD_TYPE.INVENTORY_STATUS_CHANGE, _.RECORD_TYPE.PURCHASE_CONTRACT, _.RECORD_TYPE.PURCHASE_REQUISITION, _.RECORD_TYPE.VENDOR_RETURN_AUTHORIZATION, _.RECORD_TYPE.PURCHASE_ORDER]
                        }, {
                            id: _.FIELD.OPERATION_TYPE,
                            type: _.XML_FIELD_TYPE.SELECT,
                            keepHiddenIn: [_.RECORD_TYPE.BLANKET_PURCHASE_ORDER, _.RECORD_TYPE.CREDIT_CARD_CHARGE, _.RECORD_TYPE.INVENTORY_STATUS_CHANGE, _.RECORD_TYPE.PURCHASE_CONTRACT, _.RECORD_TYPE.PURCHASE_REQUISITION, _.RECORD_TYPE.VENDOR_RETURN_AUTHORIZATION]
                        }, {
                            id: _.FIELD.MX_PAYMENT_METHOD,
                            type: _.XML_FIELD_TYPE.SELECT
                        }, {
                            id: _.FIELD.MX_BANK_INFORMATION,
                            type: _.XML_FIELD_TYPE.SELECT
                        }, {
                            id: _.FIELD.MX_BANK_INFORMATION_DN,
                            type: _.XML_FIELD_TYPE.SELECT
                        }, {
                            id: _.FIELD.MX_BANK_NAME,
                            type: _.XML_FIELD_TYPE.TEXT
                        }, {
                            id: _.FIELD.MX_BANK_ACCOUNT_NUMBER,
                            type: _.XML_FIELD_TYPE.TEXT
                        }, {
                            id: _.FIELD.MX_CUSTENTITY_RFC,
                            type: _.XML_FIELD_TYPE.TEXT
                        }, {
                            id: _.FIELD.MX_CUSTENTITY_SAT_INDUSTRY_TYPE,
                            type: _.XML_FIELD_TYPE.SELECT
                        }, {
                            id: _.FIELD.MX_CFDI_ADDENDUM,
                            type: _.XML_FIELD_TYPE.TEXT,
                            keepHiddenIn: [_.RECORD_TYPE.CASH_REFUND, _.RECORD_TYPE.CUSTOMER_DEPOSIT, _.RECORD_TYPE.CUSTOMER_REFUND, _.RECORD_TYPE.ESTIMATE, _.RECORD_TYPE.RETURN_AUTHORIZATION, _.RECORD_TYPE.SALES_ORDER]
                        }, {
                            id: _.FIELD.MX_SAT_CERTIFY_TIME_TIMESTAMP,
                            type: _.XML_FIELD_TYPE.TEXT,
                            keepHiddenIn: [_.RECORD_TYPE.CASH_REFUND, _.RECORD_TYPE.CUSTOMER_DEPOSIT, _.RECORD_TYPE.CUSTOMER_REFUND, _.RECORD_TYPE.ESTIMATE, _.RECORD_TYPE.RETURN_AUTHORIZATION, _.RECORD_TYPE.SALES_ORDER]
                        }, {
                            id: _.FIELD.MX_SAT_UUID,
                            type: _.XML_FIELD_TYPE.TEXT,
                            keepHiddenIn: [_.RECORD_TYPE.CASH_REFUND, _.RECORD_TYPE.CUSTOMER_DEPOSIT, _.RECORD_TYPE.CUSTOMER_REFUND, _.RECORD_TYPE.ESTIMATE, _.RECORD_TYPE.RETURN_AUTHORIZATION, _.RECORD_TYPE.SALES_ORDER]
                        }, {
                            id: _.FIELD.MX_CFDI_SERIE,
                            type: _.XML_FIELD_TYPE.TEXT,
                            keepHiddenIn: [_.RECORD_TYPE.SALES_ORDER, _.RECORD_TYPE.ESTIMATE]
                        }, {
                            id: _.FIELD.MX_CFDI_FOLIO,
                            type: _.XML_FIELD_TYPE.TEXT,
                            keepHiddenIn: [_.RECORD_TYPE.SALES_ORDER, _.RECORD_TYPE.ESTIMATE]
                        }, {
                            id: _.FIELD.MX_CFDI_SAT_EXPORT_TYPE,
                            type: _.XML_FIELD_TYPE.SELECT,
                            keepHiddenIn: [_.RECORD_TYPE.SALES_ORDER, _.RECORD_TYPE.ESTIMATE]
                        }, {
                            id: _.FIELD.MX_CFDI_USAGE,
                            type: _.XML_FIELD_TYPE.SELECT,
                            keepHiddenIn: [_.RECORD_TYPE.CASH_REFUND, _.RECORD_TYPE.ESTIMATE, _.RECORD_TYPE.RETURN_AUTHORIZATION, _.RECORD_TYPE.SALES_ORDER]
                        }, {
                            id: _.FIELD.MX_SAT_PAYMENT_TERM,
                            type: _.XML_FIELD_TYPE.SELECT,
                            keepHiddenIn: [_.RECORD_TYPE.CASH_REFUND, _.RECORD_TYPE.ESTIMATE, _.RECORD_TYPE.RETURN_AUTHORIZATION, _.RECORD_TYPE.SALES_ORDER]
                        }, {
                            id: _.FIELD.MX_SAT_PAYMENT_METHOD,
                            type: _.XML_FIELD_TYPE.SELECT,
                            keepHiddenIn: [_.RECORD_TYPE.CASH_REFUND, _.RECORD_TYPE.CUSTOMER_DEPOSIT, _.RECORD_TYPE.CUSTOMER_REFUND, _.RECORD_TYPE.ESTIMATE, _.RECORD_TYPE.OPPORTUNITY, _.RECORD_TYPE.RETURN_AUTHORIZATION, _.RECORD_TYPE.VENDOR_RETURN_AUTHORIZATION]
                        }, {
                            id: _.FIELD.MX_RELATED_CFDIS_RELATIONSHIP_TYPE,
                            type: _.XML_FIELD_TYPE.SELECT
                        }, {
                            id: _.FIELD.MX_JOURNALENTRY_AUTHORIZEDBY,
                            type: _.XML_FIELD_TYPE.SELECT,
                            keepHiddenIn: [_.RECORD_TYPE.JOURNAL_ENTRY]
                        }, {
                            id: _.FIELD.MX_JOURNALENTRY_CREATEDBY,
                            type: _.XML_FIELD_TYPE.SELECT,
                            keepHiddenIn: [_.RECORD_TYPE.JOURNAL_ENTRY]
                        }, {
                            id: _.FIELD.MX_SAT_REGISTERED_NAME_ENTITY,
                            type: _.XML_FIELD_TYPE.TEXT
                        }],
                        sublists: [_.SUBLIST.BANK_DETAILS, _.SUBLIST.RELATED_CFDIS],
                        sublistColumns: []
                    })
                }.apply(E, e)) || (_.exports = T)
            },
            7198: function(_, E, t) {
                var e, T;
                e = [t(4920), t(6651)], void 0 === (T = function(_, E) {
                    function t(_, t) {
                        E.fields.forEach((function(E) {
                            if (!(E.keepHiddenIn && E.keepHiddenIn.indexOf(_.currentRecord.type) > -1)) {
                                var e = _.currentRecord.getField({
                                    fieldId: E.id
                                });
                                e && (e.isDisplay = t)
                            }
                        })), E.sublists.forEach((function(E) {
                            var e = _.currentRecord.getSublist(E);
                            e && (e.isDisplay = t)
                        }))
                    }
                    return {
                        localizationContextEnter: function(_) {
                            t(_, !0)
                        },
                        localizationContextExit: function(_) {
                            t(_, !1)
                        }
                    }
                }.apply(E, e)) || (_.exports = T)
            }
        }, E = {},
        function t(e) {
            var T = E[e];
            if (void 0 !== T) return T.exports;
            var c = E[e] = {
                exports: {}
            };
            return _[e](c, c.exports, t), c.exports
        }(7198);
    var _, E
}));