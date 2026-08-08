/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 */

define(
	[
		'N/search',
		'../../common/application',
		'../../common/constants',
		'../../common/ui',
		'../../translations/translator',
	],
	function (search, application, constants, ui, translator) {

		var config = {
			unit : {
				recordType : constants.RECORD_TYPE.MX_SAT_UNIT_CODE,
				fieldIds : {
					code : constants.FIELD.MX_SAT_UNIT_CODE_CODE,
					effectiveFrom : constants.FIELD.MX_SAT_UNIT_CODE_EFFECTIVE_FROM,
					validUntil : constants.FIELD.MX_SAT_UNIT_CODE_VALID_UNTIL,
				},
			},
			item : {
				recordType : constants.RECORD_TYPE.MX_SAT_ITEM_CODE,
				fieldIds : {
					code : constants.FIELD.MX_SAT_ITEM_CODE_CODE,
					effectiveFrom : constants.FIELD.MX_SAT_ITEM_CODE_EFFECTIVE_FROM,
					validUntil : constants.FIELD.MX_SAT_ITEM_CODE_VALID_UNTIL,
				},
			},
			errorMessages : {},
		};

		function _init() {
			config.errorMessages[constants.FIELD.MX_SAT_UNIT_CODE_CODE] = translator.ERROR_SAT_CODE_DUPLICATED();
			config.errorMessages[constants.FIELD.MX_SAT_ITEM_CODE_CODE] = translator.ERROR_SAT_CODE_DUPLICATED();
		}

		var self = {
			validate : function (context, flags, pageValues) {
				_init();

				if (!self._isValidContextMode(pageValues.contextMode)) {
					return;
				}

				var configKey = flags.isUnitCode ? 'unit' : 'item';

				var errorMessages = [];
				if (!self._isCodeUnique(context, configKey, pageValues)) {
					errorMessages.push(translator.ERROR_SAT_CODE_DUPLICATED());
				}
				if (!self._areDatesValid(context, configKey)) {
					errorMessages.push(translator.ERROR_DATE_RANGE());
				}

				if (errorMessages.length === 0) {
					return true;
				}

				var errorMessage = errorMessages.join('<br/>');

				if (!flags.isClientScript) {
					throw errorMessage;
				}

				ui.showErrorBanner(translator.ERROR_GENERAL_TITLE(), errorMessage);
			},

			_isValidContextMode : function (contextMode) {
				return contextMode === constants.CONTEXT_TYPE.CREATE
					|| contextMode === constants.CONTEXT_TYPE.EDIT
					|| contextMode === constants.CONTEXT_TYPE.COPY;
			},

			_isCodeUnique: function (context, configKey, pageValues) {
				var fieldId = config[configKey].fieldIds.code;
				var record = application.getRecord(context);

				var searchQuery = search.create({
					type: config[configKey].recordType,
					filters: [
						{
							name: fieldId,
							operator: 'is',
							values: record.getValue(fieldId),
						},
					],
				}).run();

				var results = searchQuery.getRange({start: 0, end: 1});

				if (results.length === 0) {
					return true;
				}

				return pageValues.contextMode === constants.CONTEXT_TYPE.EDIT
					&& !self._fieldHasChanged(context, fieldId, pageValues.oldSatCode);
			},

			_fieldHasChanged : function (context, fieldId, oldSatCode) {
				var record = application.getRecord(context);

				if (!oldSatCode) {
					oldSatCode = context.oldRecord.getValue(fieldId);
				}

				return oldSatCode !== record.getValue(fieldId);
			},

			_areDatesValid : function (context, configKey) {
				var record = application.getRecord(context);

				var effectiveFrom = record.getValue(config[configKey].fieldIds.effectiveFrom);
				var validUntil = record.getValue(config[configKey].fieldIds.validUntil);

				if (!validUntil) {
					return true;
				}

				return validUntil >= effectiveFrom;
			},
		};

		return {
			validate : self.validate,
			_test_module: self,
		};
	}
);
