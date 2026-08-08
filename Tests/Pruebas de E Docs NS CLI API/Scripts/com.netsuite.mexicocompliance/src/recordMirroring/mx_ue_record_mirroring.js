/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope Public
 */

define(
	[
		'N/record',
		'../model/mx_model_mapping_category',
		'../common/constants',
	],
	function (record, mappingCategoryMod, constants) {

		var self = {
			MAPPINGS: {
				// ITEM CODE
				customrecord_mx_sat_item_code: {
					SOURCE: {
						FIELDS: {
							CODE: 'custrecord_mx_ic_code',
							START_DATE: 'custrecord_mx_ic_start',
							END_DATE: 'custrecord_mx_ic_end',
							MIRROR_RECORD: 'custrecord_mx_ic_mirror_record',
						},
					},
					TARGET: {
						RECORD: 'customrecord_mx_sat_item_code_mirror',
						FIELDS: {
							CODE: 'custrecord_mx_ic_mr_code',
							START_DATE: 'custrecord_mx_ic_mr_start',
							END_DATE: 'custrecord_mx_ic_mr_end',
							CATEGORY: null,
						},
					},
					CODE: null,
				},
				// UNIT CODE
				customrecord_mx_sat_unit_code: {
					SOURCE: {
						FIELDS: {
							CODE: 'custrecord_mx_sat_uc_code',
							START_DATE: 'custrecord_mx_sat_uc_start',
							END_DATE: 'custrecord_mx_sat_uc_end',
							MIRROR_RECORD: 'custrecord_mx_sat_mirror_record',
						},
					},
					TARGET: {
						RECORD: 'customrecord_mx_mapper_values',
						FIELDS: {
							CODE: 'custrecord_mx_mapper_value_inreport',
							START_DATE: 'custrecord_mx_mapper_value_start',
							END_DATE: 'custrecord_mx_mapper_value_end',
							CATEGORY: 'custrecord_mx_mapper_value_category',
						},
					},
					CODE: 'MX_UNIT_CODE',
				},
			},
			/**
			 * Used as static variables to store temporarily the source record's record type, and code field value
			 */
			_recordType: null,
			_code: null,

			beforeSubmit: function (context) {
				var sourceRecord = context.newRecord;
				self._recordType = sourceRecord.type;
				var targetRecord;

				switch (context.type) {
					case constants.CONTEXT_TYPE.CREATE:
						targetRecord = record.create({type: self._getMapping().TARGET.RECORD});
						var storedId = targetRecord.save({ignoreMandatoryFields: true});
						sourceRecord.setValue(self._getMapping().SOURCE.FIELDS.MIRROR_RECORD, storedId);
						break;

					case constants.CONTEXT_TYPE.DELETE:
						self._deleteMirrorRecord(context);
				}
			},
			afterSubmit: function (context) {
				if (context.type === constants.CONTEXT_TYPE.DELETE) {
					return;
				}

				self._recordType = (context.oldRecord || context.newRecord).type;
				var sourceRecord = (context.type === constants.CONTEXT_TYPE.XEDIT)
					? self._getInlineEditSourceRecord(context)
					: context.newRecord;

				var targetRecordId = sourceRecord.getValue(self._getMapping().SOURCE.FIELDS.MIRROR_RECORD);
				var targetRecord = record.load({
					type: self._getMapping().TARGET.RECORD,
					id: targetRecordId,
				});

				if (targetRecord) {
					var translations = self._getTranslations(sourceRecord);
					self._copyFieldValues(sourceRecord, targetRecord);
					self._setTranslations(translations, targetRecord);
				}

				targetRecord.save();
			},

			/**
			 * In inline editing, newRecord only contains the changed field. For that reason, it is required to
			 * use oldRecord as a base and update the changed field.
			 *
			 * @param context
			 * @private
			 */
			_getInlineEditSourceRecord: function (context) {
				var sourceRecord = context.oldRecord;
				// This solves a lazy loading issue
				var modRecord = JSON.parse(JSON.stringify(context.newRecord));

				var allFields = self._getMapping().SOURCE.FIELDS;
				allFields[constants.FIELD.NAME] = constants.FIELD.NAME;
				allFields[constants.FIELD.IS_INACTIVE] = constants.FIELD.IS_INACTIVE;

				// Update the changed field
				for (var i in allFields) {
					var fieldName = allFields[i];
					if (modRecord.fields.hasOwnProperty(fieldName)) {
						sourceRecord.setValue(
							fieldName,
							modRecord.fields[fieldName]
						);
					}
				}

				return sourceRecord;
			},

			// Returns the mapping for current source record to be mirrored
			_getMapping: function () {
				return self.MAPPINGS[self._recordType];
			},

			_deleteMirrorRecord: function (context) {
				var sourceRecord = context.oldRecord;
				var targetRecordId = sourceRecord.getValue(self._getMapping().SOURCE.FIELDS.MIRROR_RECORD);
				if (targetRecordId) {
					record.delete({
						type: self._getMapping().TARGET.RECORD,
						id: targetRecordId,
					});
				}
			},

			// TODO: this method has been mocked out from the unit test.
			// We must investigate why we cannot mock "new mappingCategoryMod()"
			_getCategoryId: function () {
				var mappingCategory = new mappingCategoryMod();
				return mappingCategory.findDynamic({
					columns: ['id'],
					filters: [mappingCategory.columns.code, 'is', self._getMapping().CODE],
				})[0].id;
			},

			_getTranslations: function (record) {
				var translations = {};
				var lineCount = record.getLineCount({
					sublistId: constants.SUBLIST.TRANSLATIONS,
				});

				for (var i = 0; i < lineCount; i++) {
					var translationText = record.getSublistValue({
						sublistId: constants.SUBLIST.TRANSLATIONS,
						fieldId: constants.FIELD.LABEL,
						line: i,
					});

					var locale = record.getSublistValue({
						sublistId: constants.SUBLIST.TRANSLATIONS,
						fieldId: constants.FIELD.LOCALE,
						line: i,
					});

					translations[locale] = translationText;
				}

				return translations;
			},

			_copyFieldValues: function (sourceRecord, targetRecord) {
				var categoryFieldName = self._getMapping().TARGET.FIELDS.CATEGORY;
				if (categoryFieldName) {
					targetRecord.setValue(
						categoryFieldName,
						self._getCategoryId()
					);
				}

				var name = sourceRecord.getValue({fieldId: constants.FIELD.NAME});
				self._code = sourceRecord.getValue({fieldId: self._getMapping().SOURCE.FIELDS.CODE});
				var compositeName = self._code + ' - ' + name;
				var isInactive = sourceRecord.getValue({fieldId: constants.FIELD.IS_INACTIVE});
				isInactive = isInactive === true || isInactive === 'T';

				targetRecord.setValue(
					constants.FIELD.NAME,
					compositeName
				);
				targetRecord.setValue(
					constants.FIELD.IS_INACTIVE,
					isInactive
				);
				targetRecord.setValue(
					self._getMapping().TARGET.FIELDS.CODE,
					self._code
				);
				targetRecord.setValue(
					self._getMapping().TARGET.FIELDS.START_DATE,
					sourceRecord.getValue({fieldId: self._getMapping().SOURCE.FIELDS.START_DATE})
				);
				targetRecord.setValue(
					self._getMapping().TARGET.FIELDS.END_DATE,
					sourceRecord.getValue({fieldId: self._getMapping().SOURCE.FIELDS.END_DATE})
				);
			},

			_setTranslations: function (translations, record) {
				var lineCount = record.getLineCount({
					sublistId: constants.SUBLIST.TRANSLATIONS,
				});

				for (var i = 0; i < lineCount; i++) {
					var currentLocale = record.getSublistValue({
						sublistId: constants.SUBLIST.TRANSLATIONS,
						fieldId: constants.FIELD.LOCALE,
						line: i,
					});
					var currentTranslation = translations[currentLocale];
					if (currentTranslation) {
						var compositeValue = self._code + ' - ' + currentTranslation;
						record.setSublistValue({
							sublistId: constants.SUBLIST.TRANSLATIONS,
							fieldId: constants.FIELD.LABEL,
							line: i,
							value: compositeValue,
						});
					}
				}
			},
		};

		return {
			beforeSubmit: self.beforeSubmit,
			afterSubmit: self.afterSubmit,
			module: self,
		};
	}
);
