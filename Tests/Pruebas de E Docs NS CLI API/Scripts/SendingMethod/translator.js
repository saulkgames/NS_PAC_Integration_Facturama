/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */


/**
 *
 * EXAMPLE USAGE :
 * define(
 * ['./translations/
 * ',],function (translator) {
 *    function pageInit () {
 *      console.log(translator.EXAMPLE_PLAIN_TEXT());
 *      console.log(translator.EXAMPLE_TEXT_WITH_INSERTED_VALUE(['inserted text into translation']));
 *    }
 *  }
 * );
 */

var currentLocale = null;

define(
	[
		'N/runtime',
		'N/error',
		'N/util',
		'./../common/mx_locales',
		'./languages/en_US',
		'./languages/es_AR',
		'./languages/pt_BR'
	],
	function (_runtime, _error, _utils, _mx_locales, _en_US, _es_AR, _pt_BR) {

		var translations = {
			en_US: _en_US,
			es_AR: _es_AR,
			pt_BR: _pt_BR,
		};

		var self = {

			translate: function (key) {
				return function (optionalValues) {

					if (self._getCurrentLocale() === null) {
						currentLocale = self._getNearestLocale(self._getCurrentUserLanguage());
					}
					if (!translations.hasOwnProperty(currentLocale)) {
						throw self._translationError(currentLocale + '.*');
					}
					if (!translations[currentLocale].hasOwnProperty(key)) {
						throw self._translationError(currentLocale + '.' + key);
					}
					var translatedString = translations[currentLocale][key];

					if (typeof optionalValues !== 'undefined' && _utils.isArray(optionalValues)) {
						optionalValues.forEach(function (value) {
							translatedString = translatedString.replace(/{.*?}/, value);
						});
					}
					return translatedString;
				};
			},
			_translationError: function (message) {
				return _error.create({
					name: 'MISSING_TRANSLATION',
					message: message,
				});
			},
			_getNearestLocale: function (locale) {
				if (_mx_locales.LOCALES.indexOf(locale) >= 0) {
					return locale;
				}

				var getLanguage = function (locale) {
					return (locale || '').substring(0, 2).toLowerCase();
				};
				var language = getLanguage(locale);
				var nearest = _mx_locales.LOCALES.filter(function (locale) {
					return getLanguage(locale) === language;
				});
				if (nearest.length > 0) {
					return nearest[0];
				}

				return _mx_locales.DEFAULT_LOCALE;
			},
			_getCurrentUserLanguage: function () {
				return _runtime.getCurrentUser().getPreference({name: 'language'});
			},
			_getCurrentLocale: function () {
				return currentLocale;
			},
		};

		return {
			WITHHOLDING: self.translate('WITHHOLDING'),
			EDIT_BUTTON: self.translate('EDIT_BUTTON'),
			CANCEL_BUTTON: self.translate('CANCEL_BUTTON'),
			TAX_TYPE: self.translate('TAX_TYPE'),
			WARNING_GENERAL_TITLE: self.translate('WARNING_GENERAL_TITLE'),
			ERROR_DATE_RANGE: self.translate('ERROR_DATE_RANGE'),
			ERROR_GENERAL_TITLE: self.translate('ERROR_GENERAL_TITLE'),
			ERROR_INVALID_OPERATION_TYPE: self.translate('ERROR_INVALID_OPERATION_TYPE'),
			ERROR_INVALID_TAX_CODES_FOREIGN:self.translate('ERROR_INVALID_TAX_CODES_FOREIGN'),
			ERROR_INVALID_TAX_CODES_LOCAL: self.translate('ERROR_INVALID_TAX_CODES_LOCAL'),
			ERROR_MISSING_MAPPING: self.translate('ERROR_MISSING_MAPPING'),
			ERROR_UNEXPECTED_SAT_ITEM_CODE_1: self.translate('ERROR_UNEXPECTED_SAT_ITEM_CODE_1'),
			ERROR_UNEXPECTED_SAT_ITEM_CODE_2: self.translate('ERROR_UNEXPECTED_SAT_ITEM_CODE_2'),
			ERROR_SUBSIDIARY_MISSING: self.translate('ERROR_SUBSIDIARY_MISSING'),
			ERROR_SUBSIDIARY_COUNTRY_MISSING: self.translate('ERROR_SUBSIDIARY_COUNTRY_MISSING'),
			ERROR_RFC_COMPANY: self.translate('ERROR_RFC_COMPANY'),
			ERROR_RFC_PERSON: self.translate('ERROR_RFC_PERSON'),
			ERROR_SAT_CODE_DUPLICATED: self.translate('ERROR_SAT_CODE_DUPLICATED'),
			EXAMPLE_PLAIN_TEXT: self.translate('EXAMPLE_PLAIN_TEXT'),
			EXAMPLE_TEXT_WITH_INSERTED_VALUE: self.translate('EXAMPLE_TEXT_WITH_INSERTED_VALUE'),
			HELP_BANK_INFO: self.translate('HELP_BANK_INFO'),
			LABEL_BANK_INFO: self.translate('LABEL_BANK_INFO'),
			LABEL_PAYMENT_METHOD: self.translate('LABEL_PAYMENT_METHOD'),
			EI_AUDIT_TRAIL_CERTIFY_SUCCESS: self.translate('EI_AUDIT_TRAIL_CERTIFY_SUCCESS'),
			ERROR_NO_ACCEPT_DIALOG_MSG: self.translate('ERROR_NO_ACCEPT_DIALOG_MSG'),
			PAC_LICENSE_AGREEMENT: self.translate('PAC_LICENSE_AGREEMENT'),
			ERROR_EI_AUDIT_TRAIL_NO_PAC: self.translate('ERROR_EI_AUDIT_TRAIL_NO_PAC'),
			ERROR_EI_AUDIT_TRAIL_NO_PAC_RESPONSE : self.translate('ERROR_EI_AUDIT_TRAIL_NO_PAC_RESPONSE'),
			ERROR_EI_AUDIT_NO_PLUGIN_IMPLEMENTATION_FOUND : self.translate('ERROR_EI_AUDIT_NO_PLUGIN_IMPLEMENTATION_FOUND'),
			ERROR_EI_SUBSIDIARY_ALREADY_IN_USE : self.translate('ERROR_EI_SUBSIDIARY_ALREADY_IN_USE'),
			ERROR_EI_ONLY_ONE_ENABLED_PAC_IS_ALLOWED : self.translate('ERROR_EI_ONLY_ONE_ENABLED_PAC_IS_ALLOWED'),
			RECOVERABILITY_PAGE_NAME : self.translate('RECOVERABILITY_PAGE_NAME'),
			RECOVERABILITY_FIELD_COMPONENT: self.translate('RECOVERABILITY_FIELD_COMPONENT'),
			RECOVERABILITY_FIELD_STATUS: self.translate('RECOVERABILITY_FIELD_STATUS'),
			RECOVERABILITY_FIELD_UPDATED_DATE: self.translate('RECOVERABILITY_FIELD_UPDATED_DATE'),
			RECOVERABILITY_FIELD_UPDATED_BY: self.translate('RECOVERABILITY_FIELD_UPDATED_BY'),
			RECOVERABILITY_ACTION: self.translate('RECOVERABILITY_ACTION'),
			RECOVERABILITY_REINSTALL: self.translate('RECOVERABILITY_REINSTALL'),
			RECOVERABILITY_DETAILS: self.translate('RECOVERABILITY_DETAILS'),
			RECOVERABILITY_CONFIRM: self.translate('RECOVERABILITY_CONFIRM'),
			RECOVERABILITY_CONFIRM_REINSTALL: self.translate('RECOVERABILITY_CONFIRM_REINSTALL'),
			RECOVERABILITY_INSTALLED: self.translate('RECOVERABILITY_INSTALLED'),
			RECOVERABILITY_REQUEST_FAILED: self.translate('RECOVERABILITY_REQUEST_FAILED'),
			RECOVERABILITY_REINSTALL_REQUEST_FAILED: self.translate('RECOVERABILITY_REINSTALL_REQUEST_FAILED'),
			RECOVERABILITY_NOT_SUPPORTED: self.translate('RECOVERABILITY_NOT_SUPPORTED'),
			RECOVERABILITY_NO_SHAREDMODULE: self.translate('RECOVERABILITY_NO_SHAREDMODULE'),
			OPERATION_TYPE_PROFESSIONAL_SERVICES: self.translate('OPERATION_TYPE_PROFESSIONAL_SERVICES'),
			OPERATION_TYPE_REAL_ESTATE_LEASING: self.translate('OPERATION_TYPE_REAL_ESTATE_LEASING'),
			OPERATION_TYPE_OTHERS: self.translate('OPERATION_TYPE_OTHERS'),
			OPERATION_TYPE_DEPRECATED: self.translate('OPERATION_TYPE_DEPRECATED'),
			OPERATION_TYPE_ASSETS_ALIENATION: self.translate('OPERATION_TYPE_ASSETS_ALIENATION'),
			OPERATION_TYPE_GOODS_SERVICES_IMPORT: self.translate('OPERATION_TYPE_GOODS_SERVICES_IMPORT'),
			OPERATION_TYPE_VIRTUAL_TRANSF_IMPORT: self.translate('OPERATION_TYPE_VIRTUAL_TRANSF_IMPORT'),
			OPERATION_TYPE_GLOBAL_OPERATIONS: self.translate('OPERATION_TYPE_GLOBAL_OPERATIONS'),
			// For a given locale, this function returns the whole translated module (example es_ES.js ).
			// The purpose of the function is to support translations in the Advanced PDF Templates.
			PDF_LABELS : function (locale) {
				return translations[locale];
			},
			_test_module: self,
		};


	}
);