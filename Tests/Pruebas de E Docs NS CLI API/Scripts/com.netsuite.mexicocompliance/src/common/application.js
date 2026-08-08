/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * This Module is responsible for the status of the app/bundle
 *    Mexico Context - determines whether the Mexico Localization features will apply or not (only apply
 *                     when mexico context is true)
 *    Import / Domestic transaction type - only relevant for transaction screens
 *    getEnvironment - determines whether SuiteTax or legacy flows will be uses
 *    isOneWorld - determines whether the Single Instance or One World flows will be used
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(
	[
		'N/runtime',
		'N/search',
		'N/error',
		'N/log',
		'N/recordContext',
		'./constants',
		'../translations/translator',
	],
	function (
		runtime,
		search,
		error,
		log,
		recordContext,
		constants,
		translator
	) {
		const self = {
			getRecord: function (context) {
				// Client script context uses currentRecord. User Event script context uses newRecord
				return context.contextRecord || context.currentRecord || context.newRecord;
			},

			/**
			 *
			 * Returns record type, given the context
			 *
			 * @param context
			 * @returns {string}
			 */
			getRecordType: function (context) {
				var record = self.getRecord(context);
				return record.type;
			},

			/**
			 * Returns true if execution is in Create mode
			 *
			 * @param {Object} context Script context
			 * @returns {boolean}
			 */
			isCreateMode: function (context) {
				return (self.getContextMode(context) === constants.CONTEXT_TYPE.CREATE);
			},

			/**
			 * Returns true if execution is in View mode
			 *
			 * @param {Object} context Script context
			 * @returns {boolean}
			 */
			isViewMode: function (context) {
				return (self.getContextMode(context) === constants.CONTEXT_TYPE.VIEW);
			},

			/**
			 * Returns true if execution is in Edit mode
			 *
			 * @param {Object} context Script context
			 * @returns {boolean}
			 */
			isEditMode: function (context) {
				return (self.getContextMode(context) === constants.CONTEXT_TYPE.EDIT);
			},

			/**
			 * Returns true if execution is in XEdit mode
			 *
			 * @param {Object} context Script context
			 * @returns {boolean}
			 */
			isXEditMode: function (context) {
				return (self.getContextMode(context) === constants.CONTEXT_TYPE.XEDIT);
			},

			/**
			 * Returns true if execution is in Delete mode
			 *
			 * @param {Object} context Script context
			 * @returns {boolean}
			 */
			isDeleteMode: function (context) {
				return (self.getContextMode(context) === constants.CONTEXT_TYPE.DELETE);
			},

			/**
			 * Returns true if execution is in Copy mode
			 *
			 * @param {Object} context Script context
			 * @returns {boolean}
			 */
			isCopyMode: function (context) {
				return (self.getContextMode(context) === constants.CONTEXT_TYPE.COPY);
			},

			/**
			 * Returns true if the transaction is import
			 *
			 * @param record
			 */
			isTransactionImport: function (record) {
				// NOTE in SuiteTax the transaction has an explicit import/export/communitary status
				// which we ignore. We use the same logic both in SuiteTax and Legacy (which doesn't
				// have such concept) :

				// we use the vendor to decide whether the transaction is import or domestic
				return !self.isEntityLocal(record);
			},

			isEntityLocal: function (record) {
				const entityId = record.getValue({fieldId: constants.FIELD.ENTITY});

				if (!entityId) {
					return true; // Default when no vendor is selected
				}

				const countryCode = self.getEntityCountry(entityId);
				if (!countryCode) {
					return true; // Default vendor bill country is not set
				}

				return countryCode === constants.OTHER.MEXICO_COUNTRY_CODE;
			},

			getEntityCountry: function (vendorId) {
				try {
					const results = search.lookupFields({
						type: search.Type.ENTITY,
						id: vendorId,
						columns: constants.FIELD.BILLING_COUNTRY,
					});

					if (!results || !results.billcountry) {
						return null;
					}

					// Dark Magic Warning: the first billing address returned is always the default billing
					// even thought the default property is not used in the query !
					return results.billcountry.length > 0 ? results.billcountry[0].value : null;
				} catch (e) {
					// this catch validation is because of AMEX customer has no search permission on their roles
					// which generates an error after the entity is changed on the form
					if (e.name === 'INSUFFICIENT_PERMISSION') {
						return null;
					} else {
						throw (e);
					}
				}
			},

			isOneWorld: function () {
				return runtime.isFeatureInEffect({feature: constants.FEATURE.ONE_WORLD});
			},

			getEnvironment: function () {
				return self._isSuiteTaxEnabled()
					? constants.ENVIRONMENT.SUITE_TAX
					: constants.ENVIRONMENT.LEGACY;
			},

			isSuiteTax: function () {
				return self.getEnvironment() === constants.ENVIRONMENT.SUITE_TAX;
			},

			isWithholdingTaxBundleInstalled: function () {
				var isWithholdingTaxInstalled = true;

				try {
					search.create({type: constants.RECORD_TYPE.WT_TAX_TYPES.RECORD});
				} catch (ex) {
					if (ex.name === 'INVALID_RCRD_TYPE') {
						isWithholdingTaxInstalled = false;
					}
				}

				return isWithholdingTaxInstalled;
			},

			_isSuiteTaxEnabled: function () {
				return runtime.isFeatureInEffect({feature: constants.FEATURE.SUITE_TAX});
			},

			// Client scripts use Mode (scriptContext.mode: copy, create, edit)
			// User event scripts use Type (look context.UserEventType for a list)
			getContextMode: function (context) {
				return context.type || context.mode;
			},

			// var isVatEngineEnabled = function () {
			//     return runtime.isFeatureInEffect({feature: constants.FEATURE.VAT_ENGINE});
			// };

			getCurrentUserSubsidiaryId: function () {
				const user = runtime.getCurrentUser();

				if (!user.subsidiary) {
					throw error.create({
						name: 'SUBSIDIARY_MISSING',
						message: translator.ERROR_SUBSIDIARY_MISSING(),
					});
				}

				return user.subsidiary;
			},

			isMexico: function (context) {
				if (!self.isOneWorld()) {
					return true;
				}
				const countryContext = self.getCountryContext(context);
				return countryContext.includes(constants.OTHER.MEXICO_COUNTRY_CODE);
			},

			getCountryContext: function (context) {
				var countryContext = [];
				try {
					if (self.isDeleteMode(context)) {
						const subsidiaryId = runtime.getCurrentUser().subsidiary;
						if (!subsidiaryId) {
							return [];
						}
						countryContext = recordContext.getContext({
							recordType: constants.RECORD_TYPE.SUBSIDIARY,
							recordId: subsidiaryId.toString(),
							contextTypes: [recordContext.ContextType.LOCALIZATION],
						}).localization;
						log.debug('countryContext :: in if(subsidiaryId) :: ', countryContext);
					}
					else {
						countryContext = recordContext.getContext({
							record: self.getRecord(context),
							contextTypes: [recordContext.ContextType.LOCALIZATION],
						}).localization;
						log.debug('countryContext :: in if :: ', countryContext);
					}
					if (typeof countryContext === 'string') {
						countryContext = [countryContext];
					}
					// the copy created because on User Event the result is an array without includes and indexOf methods
					if (typeof countryContext.includes !== 'function') {
						countryContext = Array.from(countryContext);
						log.debug('countryContext. Copy created', countryContext);
					}

				} catch (err) {
					log.error({
						title: 'LRCFM - GET COUNTRY CONTEXT',
						details: err,
					});
				}
				return countryContext;
			},
		};

		return {
			isEntityLocal: self.isEntityLocal,
			isOneWorld: self.isOneWorld,
			isSuiteTax: self.isSuiteTax,
			isWithholdingTaxBundleInstalled: self.isWithholdingTaxBundleInstalled,
			isCreateMode: self.isCreateMode,
			isViewMode: self.isViewMode,
			isEditMode: self.isEditMode,
			isXEditMode: self.isXEditMode,
			isDeleteMode: self.isDeleteMode,
			isCopyMode: self.isCopyMode,
			getCurrentUserSubsidiaryId: self.getCurrentUserSubsidiaryId,
			isTransactionImport: self.isTransactionImport,
			getEntityCountry: self.getEntityCountry,
			getEnvironment: self.getEnvironment,
			getContextMode: self.getContextMode,
			getRecordType: self.getRecordType,
			getRecord: self.getRecord,
			getCountryContext: self.getCountryContext,
			isMexico: self.isMexico,
			_test_module: self,
		};
	}
);
