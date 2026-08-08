/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 */

define(
	[
		'../common/application',
		'../common/scriptContext',
		'../common/constants',
		'../common/ui',
		'../customRecords/taxRegistration',
		'../translations/translator',
	],
	function (
		application,
		scriptContext,
		constants,
		ui,
		taxRegistration,
		translator
	) {
		const genericRfcs = {
			foreign: 'XEXX010101000',
			nationalNonSat: 'XAXX010101000',
		};
		const sublistsThatTriggerCopy = [
			constants.SUBLIST.SUBSIDIARIES,
			constants.SUBLIST.TAX_REGISTRATION,
		];
		const chars = 'A-Z';
		const specialChars = chars + 'Ñ&';
		const validRfcFormatForCompany = new RegExp('^[' + specialChars + ']{3}[0-9]{6}[' + chars + '0-9]{3}$');
		const validRfcFormatForPerson = new RegExp('^[' + specialChars + ']{4}[0-9]{6}[' + chars + '0-9]{3}$');

		const _getErrorMessage = function (isPerson) {
			return isPerson ? translator.ERROR_RFC_PERSON() : translator.ERROR_RFC_COMPANY();
		};

		const _isValidRfc = function (rfcValue, isPerson) {
			switch (rfcValue) {
				case '':
					return true;
				case genericRfcs.foreign:
					return !isPerson;
				case genericRfcs.nationalNonSat:
					return true;
				default:
					return isPerson
						? validRfcFormatForPerson.test(rfcValue)
						: validRfcFormatForCompany.test(rfcValue);
			}
		};

		const module = function () {};

		module.isValidRfc = _isValidRfc;

		module.prototype.copyValueFromTaxRegistrationSublist = function () {
			const context = scriptContext.getInstance().getContext();
			if (context.fieldId && context.fieldId !== constants.FIELD.SUBSIDIARY) {
				return;
			}

			if (context.sublistId && sublistsThatTriggerCopy.indexOf(context.sublistId) === -1) {
				return;
			}

			if (!application.isSuiteTax() || !application.isMexico(context) || !taxRegistration.isPresent(context)) {
				return;
			}

			const record = application.getRecord(context);
			let taxRegistrationNumber = '';
			if (context.type === constants.CONTEXT_TYPE.XEDIT) {
				taxRegistrationNumber = context.oldRecord.getValue(constants.FIELD.MX_CUSTENTITY_RFC);
			} else {
				taxRegistrationNumber = taxRegistration.getFirstMexicanNumber(record);
			}

			ui.setValue({
				context: context,
				fieldId: constants.FIELD.MX_CUSTENTITY_RFC,
				value: taxRegistrationNumber,
			});
		};

		module.prototype.getDisplayType = function () {
			const context = scriptContext.getInstance().getContext();
			if (!application.isMexico(context)) {
				return constants.FIELD_DISPLAY_TYPE.HIDDEN;
			}

			if (application.isSuiteTax() && taxRegistration.isPresent(context)) {
				return constants.FIELD_DISPLAY_TYPE.DISABLED;
			}

			return constants.FIELD_DISPLAY_TYPE.NORMAL;
		};

		module.prototype.validate = function () {
			if (application.isSuiteTax()) {
				return;
			}

			const context = scriptContext.getInstance().getContext();

			const record = application.getRecord(context);
			const rfcValue = record.getValue(constants.FIELD.MX_CUSTENTITY_RFC);
			const fieldIsPerson = record.getValue(constants.FIELD.IS_PERSON);
			const isPerson = fieldIsPerson === true || fieldIsPerson === 'T' || fieldIsPerson === undefined;

			const isValid = _isValidRfc(rfcValue, isPerson);
			_uiAction(isValid, _getErrorMessage(isPerson));
			return isValid;
		};

		const _uiAction = function (isValid, message) {
			if (isValid) {
				ui.hideBannerIfShown();
			} else {
				ui.showWarningBanner(translator.WARNING_GENERAL_TITLE(), message);
			}
		};

		const getInstance = function () {
			return new module();
		};

		return {
			getInstance: getInstance,
		};
	}
);
