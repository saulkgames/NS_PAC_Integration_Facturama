/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */

define(
	[
		'N/log',
		'N/runtime',
		'../lib/mx_sl_task_summary',
		'../../model/mx_model_taf_mapping_category',
		'../../model/mx_model_taf_mapping_keyvalue',
		'../../model/mx_model_taf_mapping_value',
		'../../model/mx_model_mapping_category',
		'../../model/mx_model_mapping_keyvalue',
		'../../model/mx_model_mapping_value',
		'../../model/mx_model_bank_information',
	],
	function (log, runtime, taskSummary, TafCategory, TafKeyvalue, TafValue, MxCategory, MxKeyvalue, MxValue, BankInformation) {
		var config = {
			categories: {
				taf: {
					ACCOUNT_GROUPING: 'MX_ACCOUNT_GROUPING',
					BANK: 'MX_BANK',
					PAYMENTMETHOD: 'MX_PAYMENTMETHOD',
				},
				mx: {
					ACCOUNT_GROUPING: 'MX_ACCOUNT_GROUPING',
					BANK: 'MX_BANK',
					PAYMENTMETHOD: 'MX_PAYMENTMETHOD',
				},
			},
			records: {
				mx: {
					ACCOUNT_GROUPING: 'account',
					BANK: 'account',
					BANK_INFORMATION: 'customrecord_psg_mx_bank_info',
					PAYMENTMETHOD: 'paymentmethod',
				},
			},
		};

		var tafCategoryModel = new TafCategory();
		var tafKeyvalueModel = new TafKeyvalue();
		var tafValueModel = new TafValue();
		var mxCategoryModel = new MxCategory();
		var mxKeyvalueModel = new MxKeyvalue();
		var mxValueModel = new MxValue();
		var mxBankInformationModel = new BankInformation();

		// TAF

		function getTafCategories () {
			return tafCategoryModel.findDynamic({
				columns: ['id', 'code'],
				filters: [
					[tafCategoryModel.columns.code, 'is', config.categories.taf.ACCOUNT_GROUPING],
					'or', [tafCategoryModel.columns.code, 'is', config.categories.taf.BANK],
					'or', [tafCategoryModel.columns.code, 'is', config.categories.taf.PAYMENTMETHOD],
				],
			});
		}

		function getTafCategoryMapById (tafCategories) {
			var tafCategoryMap = {};

			tafCategories.forEach(function (tafCategory) {
				tafCategoryMap[tafCategory.id] = tafCategory;
			});

			return tafCategoryMap;
		}

		function getTafKeyvalues (tafCategoryIds) {
			return tafKeyvalueModel.findDynamic({
				columns: ['id', 'category', 'key', 'value'],
				filters: [tafKeyvalueModel.columns.category, 'anyOf', tafCategoryIds],
				searchCount: 0, // magic value to hopefuly search for all values?
			});
		}

		function getTafValues (tafCategoryIds) {
			return tafValueModel.findDynamic({
				columns: ['id', 'category', 'code'],
				filters: [tafValueModel.columns.category, 'anyOf', tafCategoryIds],
				searchCount: 0, // magic value to hopefuly search for all values?
			});
		}

		function getTafValueMapById (tafValues) {
			var tafValueMap = {};

			for (var index in tafValues) {
				var tafValue = tafValues[index];

				tafValueMap[tafValue.id] = tafValue;
			}

			return tafValueMap;
		}

		// MX

		function getMxCategories () {
			return mxCategoryModel.findDynamic({
				columns: ['id', 'code'],
				filters: [
					[mxCategoryModel.columns.code, 'is', config.categories.mx.ACCOUNT_GROUPING],
					'or', [mxCategoryModel.columns.code, 'is', config.categories.mx.BANK],
					'or', [mxCategoryModel.columns.code, 'is', config.categories.mx.PAYMENTMETHOD],
				],
			});
		}

		function getMxCategoryMapByCode (mxCategories) {
			var mxCategoryMap = {};

			mxCategories.forEach(function (mxCategory) {
				mxCategoryMap[mxCategory.code] = mxCategory;
			});

			return mxCategoryMap;
		}

		function getMxValues (mxCategoryIds) {
			return mxValueModel.findDynamic({
				columns: ['id', 'category', 'code'],
				filters: [mxValueModel.columns.category, 'anyOf', mxCategoryIds],
				searchCount: 0, // magic value to hopefuly search for all values?
			});
		}

		function getMxValueMapByCategoryAndCode (mxValues) {
			var mxValueMap = {};

			for (var index in mxValues) {
				var mxValue = mxValues[index];
				var mxCategoryId = mxValue.category;

				if (!mxValueMap[mxCategoryId]) {
					mxValueMap[mxCategoryId] = {};
				}

				mxValueMap[mxCategoryId][mxValue.code] = mxValue;
			}

			return mxValueMap;
		}

		// migration
		// migration is basically same for all 3 types, but can be changed in future

		function migrateAccountGrouping (mapObject) {
			var tafKeyvalue = mapObject.tafKeyvalue;
			var mxCategory = mapObject.mxCategory;
			var mxValue = mapObject.mxValue;

			// get mx kvs
			var mxKeyvalues = mxKeyvalueModel.findDynamic({
				columns: ['id', 'category', 'rectype', 'subrectype', 'key', 'subkey'],
				filters: [
					[mxKeyvalueModel.columns.category, 'is', mxCategory.id],
					'and',
					[mxKeyvalueModel.columns.key, 'is', tafKeyvalue.key],
				],
				searchCount: 1, // only one result needed
			});

			if (mxKeyvalues && mxKeyvalues.length > 0) {
				// update old value
				var mxKeyvalue = mxKeyvalues[0];
				mxKeyvalue.value = mxValue.id;

				mxKeyvalueModel.save(mxKeyvalue);
			} else {
				// create new mapping in MX
				mxKeyvalueModel.save({
					category: mxCategory.id,
					rectype: config.records.mx.ACCOUNT_GROUPING,
					key: tafKeyvalue.key,
					value: mxValue.id,
				});
			}
		}

		function migrateBank (mapObject) {
			var tafKeyvalue = mapObject.tafKeyvalue;
			var mxCategory = mapObject.mxCategory;
			var mxValue = mapObject.mxValue;

			// detect rectype of keyvalue (bank or bank information) depending on bank information presence
			var bankInformationRecords = mxBankInformationModel.findDynamic({
				columns: ['id', 'name'],
				filters: [
					[mxBankInformationModel.columns.bankName, 'is', tafKeyvalue.key],
				],
				searchCount: 1, // only one entry needed
			});
			var isBankInformation = bankInformationRecords && bankInformationRecords.length > 0;
			var mxKeyvalueRectype = isBankInformation ? config.records.mx.BANK_INFORMATION : config.records.mx.BANK;

			// get mx kvs
			var mxKeyvalues = mxKeyvalueModel.findDynamic({
				columns: ['id', 'category', 'rectype', 'subrectype', 'key', 'subkey'],
				filters: [
					[mxKeyvalueModel.columns.rectype, 'is', mxKeyvalueRectype],
					'and',
					[mxKeyvalueModel.columns.category, 'is', mxCategory.id],
					'and',
					[mxKeyvalueModel.columns.key, 'is', tafKeyvalue.key],
				],
				searchCount: 1, // only one needed
			});
			
			if (mxKeyvalues && mxKeyvalues.length > 0) {
				// update old value
				var mxKeyvalue = mxKeyvalues[0];
				mxKeyvalue.value = mxValue.id;

				mxKeyvalueModel.save(mxKeyvalue);
			} else {
				// create new mapping in MX
				mxKeyvalueModel.save({
					category: mxCategory.id,
					rectype: mxKeyvalueRectype,
					key: tafKeyvalue.key,
					value: mxValue.id,
				});
			}
		}

		function migratePaymentMethod (mapObject) {
			var tafKeyvalue = mapObject.tafKeyvalue;
			var mxCategory = mapObject.mxCategory;
			var mxValue = mapObject.mxValue;

			// get mx kvs
			var mxKeyvalues = mxKeyvalueModel.findDynamic({
				columns: ['id', 'category', 'rectype', 'subrectype', 'key', 'subkey'],
				filters: [
					[mxKeyvalueModel.columns.category, 'is', mxCategory.id],
					'and',
					[mxKeyvalueModel.columns.key, 'is', tafKeyvalue.key],
				],
				searchCount: 1, // only one needed
			});

			if (mxKeyvalues && mxKeyvalues.length > 0) {
				// update old value
				var mxKeyvalue = mxKeyvalues[0];
				mxKeyvalue.value = mxValue.id;

				mxKeyvalueModel.save(mxKeyvalue);
			} else {
				// create new mapping in MX
				mxKeyvalueModel.save({
					category: mxCategory.id,
					rectype: config.records.mx.PAYMENTMETHOD,
					key: tafKeyvalue.key,
					value: mxValue.id,
				});
			}
		}

		// map phase
		function migrateTafKeyvalueToMx (mapContext) {
			var mapObject = JSON.parse(mapContext.value);
			log.debug('Migrating ' + mapContext.value, mapObject);

			switch (mapObject.mxCategory.code) {
				case config.categories.mx.ACCOUNT_GROUPING:
					migrateAccountGrouping(mapObject);
					break;
				case config.categories.mx.BANK:
					migrateBank(mapObject);
					break;
				case config.categories.mx.PAYMENTMETHOD:
					migratePaymentMethod(mapObject);
					break;
			}
		}

		// getInputData phase
		function getMigrationData () {
			// 3 searches
			var tafCategories;
			try {
				tafCategories = getTafCategories();
			} catch (e) {
				// TAF probably not present
				log.error('TAF probably not installed. Mapping will not be migrated.', e);
				return [];
			}
			var tafCategoryIds = tafCategories.map(function (tafCategory) {return tafCategory.id;});
			var tafCategoryMap = getTafCategoryMapById(tafCategories);
			var tafValueMap = getTafValueMapById(getTafValues(tafCategoryIds));
			var tafKeyvalues = getTafKeyvalues(tafCategoryIds);
			
			// 2 searches
			var mxCategories = getMxCategories();
			var mxCategoryIds = mxCategories.map(function (mxCategory) {return mxCategory.id;});
			var mxCategoryMap = getMxCategoryMapByCode(mxCategories);
			var mxValueMap = getMxValueMapByCategoryAndCode(getMxValues(mxCategoryIds));

			// iterate through taf keyvalues
			return tafKeyvalues
				.map(function (tafKeyvalue) {
					var tafCategory = tafCategoryMap[tafKeyvalue.category];

					if (!tafCategory) {
						return null;
					}

					var mxCategory = mxCategoryMap[tafCategory.code];
					var mxCategoryValues = mxValueMap[mxCategory.id];
					var tafValue = tafValueMap[tafKeyvalue.value];

					if (!tafValue || !mxCategory || !tafCategory || !mxCategoryValues) {
						log.error('Failed to migrate mapping', {tafCategory: tafCategory, tafValue: tafValue, mxCategory: mxCategory});
						return null;
					}

					return {
						// cat
						// tafCategory: tafCategory,
						mxCategory: mxCategory,
						// kv + v
						// tafValue: tafValue,
						tafKeyvalue: tafKeyvalue,
						mxValue: mxCategoryValues[tafValue.code],
						// no mxKv, it should be added in map
					};
				})
				.filter(function (mapObject) {
					// filter out failed mappings (value will be null)
					return mapObject !== null;
				});
		}

		// eslint-disable-next-line no-unused-vars
		function summarize (summary)
		{
			taskSummary.createSummaryRecord('Migrate TAF Mappings',runtime.getCurrentScript().id);
		}
		return {
			summarize: summarize,
			getInputData: getMigrationData,
			map: migrateTafKeyvalueToMx,
		};
	}
);