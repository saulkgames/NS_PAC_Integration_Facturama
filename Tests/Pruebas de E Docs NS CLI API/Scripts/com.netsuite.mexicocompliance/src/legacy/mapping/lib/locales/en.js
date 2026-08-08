/**
 * Copyright © 2014, 2018, Oracle and/or its affiliates. All rights reserved.
 */

var TAF = TAF || {};
TAF.Translation = TAF.Translation || {};
 
TAF.Translation.en = TAF.Translation.en || {
	Culture: 'en',
	Strings: {
		// TAF Mapper
		MAPPER_FORM_TITLE: 'Mexico Localization Field Mapping',
		MAPPER_EDIT_BUTTON: 'Edit',
		MAPPER_CANCEL_BUTTON: 'Cancel',
		MAPPER_SUBLIST_NAME: 'Mapping',
		MAPPER_CATEGORY_LABEL: 'Category',
		MAPPER_TO_LABEL: 'Value',
		MAPPER_SAVE_SUCCESSFUL: 'Saved successfully.',
		MAPPER_SAVE_ERROR: 'Some changes were not saved. Please refresh the page.',
		MAPPER_SUCCESS: 'Confirmation',
		MAPPER_ERROR: 'Error',
		MAPPER_RELOAD_WARNING_MESSAGE: 'Data you entered on this page has not been saved and will be lost. Press OK to proceed.',

		// UI Field Labels
		TAF_MAPPING_BANK: 'Bank',
		TAF_MAPPING_PAYMENT_METHOD: 'Payment Method',
		TAF_MAPPING_ACCOUNT_TYPE: 'Account Type',
		TAF_MAPPING_ACCOUNT: 'Account',
		TAF_MAPPING_SUBSIDIARY: 'Subsidiary',
		TAF_MAPPING_TRANSACTION_TYPE: 'Transaction Type',
		TAF_MAPPING_POLICY_TYPE: 'Policy',
		TAF_MAPPING_UNIT_OF_MEASURE: 'Unit of Measure',
	    TAF_MAPPING_UNITS_TYPE: 'Units Type',
		TAF_MAPPING_TAX_CATEGORY: 'Tax Type',
		TAF_MAPPING_TAX_FACTOR_TYPE: 'Tax Code',
		TAF_MAPPING_TAX_REGION: 'Tax Code',
		TAF_MAPPING_TAX_CREDIT_TYPE: 'Tax Code',

		// Field level help
		CUSTPAGE_CATEGORY_FIELD_HELP: 'Select the field that you want to map. On the mapping tab, you can map NetSuite fields'
        + ' to SAT-defined categories by specifying a value in the right column. <br /><br /> '
        + ' For Account Grouping, you must use CSV import to map the accounts assigned to your Mexico subsidiary to the group'
        + ' codes defined by the SAT.<br /><br />'
        + ' SAT Unit Code must first be defined at Setup > Mexico Localization > Manage SAT Unit Codes.<br /><br />'
        + ' The mapped fields will be used for Electronic Invoicing or Electronic Accounting files after they are saved in the system.',
		CUSTPAGE_ACCOUNT_TYPE_FIELD_HELP: 'Select the type of account that you want to map.'
        + ' Values for the selected account will appear in the Mapping tab.',
		CUSTPAGE_SUBSIDIARY_FIELD_HELP: 'Select the subsidiary for which you want to map values.',
	    CUSTPAGE_UNITS_OF_MEASURE_FIELD_HELP: 'Select the type of units that you want to map.',

		// France SAFT
		GENERAL_LEDGER: 'General Ledger',
		
		// Spain SII
		SII_RETROACTIVE_DESCRIPTION: 'Register from first half of year',

        WITHHOLDING: 'Withholding',
	},
};
