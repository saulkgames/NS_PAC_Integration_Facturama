/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 */
var en = en || {
	Culture: 'en',
	Strings: {
		FORM_TITLE: 'Mexico Validation Tool',

		ACCESS_DENIED_SUITETAX_ENABLED: 'You cannot use the Mexico Validation Tool if the SuiteTax feature is enabled in your account.',

		LABEL_SUBLIST: 'Results',
		LABEL_SUBSIDIARY: 'Subsidiary',
		LABEL_PERIOD: 'Period',
		LABEL_RECORD_TYPE: 'Record Type',
		LABEL_RUN: 'Run',
		LABEL_BANK_INFO: 'Bank Information',

		HELP_BANK_INFO: 'Select the payee\'s bank information record to use for this transaction. This field is used for Mexico Compliance.',

		TYPE_ALL: '(all)',
		TYPE_VENDOR_BILL: 'Vendor Bill',
		TYPE_VENDOR_CREDIT: 'Vendor Credit',
		TYPE_EXPENSE_REPORT: 'Expense Report',
		TYPE_CHECK: 'Cheque',
		TYPE_VENDOR: 'Vendor',
		TYPE_EMPLOYEE: 'Employee',
		TYPE_CUSTOMER: 'Customer',
		TYPE_PARTNER: 'Partner',
		TYPE_CONTACT: 'Contact',

		COL_RECORD_TYPE: 'Record Type',
		COL_NAME: 'Name',
		COL_RULE: 'Rule',

		VDR_RFC_REQUIRED: 'Vendor record must have an RFC number.',
		VDR_RFC_VALID_IND: 'Vendor individual RFC must have a valid format.',
		VDR_RFC_VALID_COMP: 'Vendor company RFC must have a valid format.',
		EMP_RFC_REQUIRED: 'Employee record must have an RFC number.',
		EMP_RFC_VALID_IND: 'Employee individual RFC must have a valid format.',
		CUS_RFC_REQUIRED: 'Customer record must have an RFC number.',
		CUS_RFC_VALID_IND: 'Customer individual RFC must have a valid format.',
		CUS_RFC_VALID_COMP: 'Customer company RFC must have a valid format.',
		PRT_RFC_REQUIRED: 'Partner record must have an RFC number.',
		PRT_RFC_VALID_IND: 'Partner individual RFC must have a valid format.',
		PRT_RFC_VALID_COMP: 'Partner company RFC must have a valid format.',
		CON_RFC_REQUIRED: 'Contact record must have an RFC number.',
		CON_RFC_VALID_IND: 'Contact individual must have a valid format.',
		VBL_OPTYPE_REQUIRED: 'Vendor Bills must specify an operation type.',
		CHK_OPTYPE_REQUIRED: 'Checks must specify an operation type.',
		VCR_OPTYPE_REQUIRED: 'Vendor Credits must specify an operation type.',
		XRP_OPTYPE_REQUIRED: 'Expense Reports must specify an operation type.',
		XRP_MISSING_VENDOR: 'All lines on expense reports must specify the vendor names.',
		XRP_INVALID_OPTYPE: 'The operation type Real Estate Leasing should not be used when selecting a foreign vendor. See the lines with the following reference numbers: {INVALID_OPTYPES}',
		TRN_TC_IMPORT: 'Foreign vendors should not use local tax codes.',
		TRN_TC_LOCAL: 'Local vendors should not use import tax codes.',
		TRN_EMPTC_IMPORT: 'Foreign employees should not use local tax codes.',
		TRN_EMPTC_LOCAL: 'Local employees should not use import tax codes.',
		TRN_CUSTC_IMPORT: 'Foreign customers should not use local tax codes.',
		TRN_CUSTC_LOCAL: 'Local customers should not use import tax codes.',

		MSG_RFC_FORMAT_INDV: 'The RFC number must be in the format required for Mexico ({RFC_FORMAT}).',
		MSG_RFC_FORMAT_COMP: 'The RFC number must be in the format required for Mexico ({RFC_FORMAT}). Alternatively you can use the generic RFC number for foreign entities: XEXX-010101-000.',
		MSG_LOCAL_INVALID_TAXCODES: 'Mexico - Local vendor should not use an import tax code ({TAXCODES}).\nContinue saving?',
		MSG_FOREIGN_INVALID_TAXCODES: 'Mexico - Foreign vendor should not use non-import tax code ({TAXCODES}).\nContinue saving?',
		MSG_DUPLICATE_BANK_INFO: 'The name of this bank information record is already in use. Please change the bank information name and save the record again.',
		MSG_INVALID_OPERATION_TYPE: 'The operation type Real Estate Leasing should not be used when selecting a foreign vendor. Continue with the selection?',

		OPERATION_TYPE_DEPRECATED: 'Operation Type (Deprecated)',
		OPERATION_TYPE_PROFESSIONAL_SERVICES: 'Professional Services',
		OPERATION_TYPE_REAL_ESTATE_LEASING: 'Real Estate Leasing',
		OPERATION_TYPE_OTHERS: 'Others',
	},
};