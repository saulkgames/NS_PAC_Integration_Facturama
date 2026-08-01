/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 * This is a generic file that handles Invoices, Item Fulfillments, Cash Sales and Credit Memos, since they
 * all can be handled the same way. If at any point we need to implement a specific feature for any of them,
 * we can extract it into a separate file (like customerPayment.js, in the same directory).
 */

define(
	[
		'./../../../common/constants',
		'./../../../common/logger'
	],
	function (constants, logger) {
		function CommonXmlGenerator (
			cfdi,
			customItems,
			nsSearch,
			nsRuntime,
			rfc,
			SATCodes,
			sharedModuleFinder,
			summary,
			whTax,
			log,
			query
		) {
			this.cfdi = cfdi;
			this.customItems = customItems;
			this.nsSearch = nsSearch;
			this.nsRuntime = nsRuntime;
			this.rfc = rfc;
			this.SATCodes = SATCodes;
			this.sharedModuleFinder = sharedModuleFinder;
			this.summaryModule = summary;
			this.whTax = whTax;
			this.log = log;
			this.query = query;
		}

		CommonXmlGenerator.prototype.objectify = function (obj, recordsLoaded) {
			var txnRecord = obj.transactionRecord;

			var multiCurrencyFeature = this.nsRuntime.isFeatureInEffect({ feature: constants.FEATURE.MULTICURRENCY });
			var oneWorldFeature = this.nsRuntime.isFeatureInEffect({ feature: constants.FEATURE.ONE_WORLD });
			var suiteTaxFeature = this.nsRuntime.isFeatureInEffect({ feature: constants.FEATURE.SUITE_TAX });
			var suiteTaxWithholdingTaxTypes = [];

			if (suiteTaxFeature) {
				suiteTaxWithholdingTaxTypes = this.whTax.getSuiteTaxTypes();
			}
			
			var result = {
				suiteTaxFeature: suiteTaxFeature,
				suiteTaxWithholdingTaxTypes: suiteTaxWithholdingTaxTypes,
				multiCurrencyFeature: multiCurrencyFeature,
				oneWorldFeature: oneWorldFeature,
				items: [],
				cfdiRelations : {},
				companyInfo: {},
				satCodesDao : this.SATCodes,
				itemIdUnitTypeMap : {},
				relatedCfdis : {
					types : [],
					cfdis : {},
				},
				billaddr : {},
				industryTypeFromTransfOrder: {},
				loggedUserName : this.nsRuntime.getCurrentUser().name,
				isFromCustomerPayment: obj.isFromCustomerPayment,
			};
			var lineCount = this._getLineCount(txnRecord);
			this.customItems.addCustomItems(result, txnRecord, lineCount);
			if (!obj.isFromCustomerPayment) {
				this._addBillAddress(result, txnRecord, obj.pdf);
				this._addIndustryTypeFromTransferOder(result, txnRecord, obj.pdf);
				this.rfc.addCompanyRfc(result, txnRecord, recordsLoaded);
				this.cfdi.getCfdiRelationTypeInfo(result, txnRecord, obj.pdf, this._isCreditMemo(txnRecord));
				result.satCodesDao.getTransactionLevelSatCodes(txnRecord);
				this._addCustomerIndustryType(result, txnRecord);
				this._getUnitTypesForAllItemsInOneCall(result);
			}
			var summary = {
				totalWithHoldTaxAmt: 0.0,
				totalNonWithHoldTaxAmt: 0.0,
				totalTaxAmt: 0.0,
				discountOnTotal: 0.0,
				includeTransfers : true,
				includeWithHolding : true,
			};
			var discounttotal = txnRecord.getValue('discounttotal');
			summary.bodyDiscount = discounttotal ? Math.abs(discounttotal) : 0.0;
			result.summary = summary;
			this._attachSatMappingData(result);
			result.satcodes = this.SATCodes.getJson();
			result.satCodesDao = null;
			this.summaryModule.summarize(result);

			if (!result.isFromCustomerPayment) {
				this._extendResultObject(result, txnRecord);f
			}

			delete result.isFromCustomerPayment;
			logger.logLargeText('Custom Datasource result: ',JSON.stringify(result), false);
			return result;
		};

		CommonXmlGenerator.prototype._extendResultObject = function (result, txnRecord) {
			Object.keys(constants.EI_TEMPLATE_EXTENSIONS).forEach( function (extension) {
				var templateExtensionModule = this.sharedModuleFinder.loadModuleFromExternalBundle(
					constants.EI_TEMPLATE_EXTENSIONS[extension].BUNDLE_UUID,
					constants.EI_TEMPLATE_EXTENSIONS[extension].MODULE_NAME
				);
				if (templateExtensionModule) {
					var templateExtension = templateExtensionModule.getExtraData(txnRecord);
					Object.keys(templateExtension).forEach(function (key) {
						result[key] = templateExtension[key];
					});
				}
			}, this)
		};

		CommonXmlGenerator.prototype._getLineCount = function (txnRecord) {
			return txnRecord.getLineCount({
				sublistId: 'item',
			});
		};

		CommonXmlGenerator.prototype._addBillAddress = function (result,txnRecord,isPdf) {
			var recordObj;
			if (isPdf) {
				recordObj = txnRecord;
			} else {
				recordObj = txnRecord.getRecord();
			}
			if (this._isItemFulfillment(recordObj) && this._isTransferOrder(recordObj)) {
				return;
			}

			var customerID = recordObj.getValue({ fieldId: constants.FIELD.ENTITY });
			var defaultBillingAddressForCustomer = this.query.runSuiteQL({
				query: constants.SUITEQL.CUSTOMER_ADDRESS_FIELDS.CUSTOMER_DEFAULT_BILLING_ADDRESS,
				params: [customerID],
			}).asMappedResults();

			var billaddr = result.billaddr;
			billaddr.customerdefaultzipcode = (!defaultBillingAddressForCustomer.length || !defaultBillingAddressForCustomer[0].zip) ? '' : defaultBillingAddressForCustomer[0].zip;
			billaddr.countrycode = (!defaultBillingAddressForCustomer.length || !defaultBillingAddressForCustomer[0].country) ? '' : defaultBillingAddressForCustomer[0].country;
		};

		CommonXmlGenerator.prototype._addIndustryTypeFromTransferOder = function (result,txnRecord,isPdf) {
			var recordObj;
			if (isPdf) {
				recordObj = txnRecord;
			} else {
				recordObj = txnRecord.getRecord();
			}

			if (!this._isTransferOrder(recordObj)) {
				return;
			}

			var industryTypeFromTransfOrder = result.industryTypeFromTransfOrder;

			const transactionId = recordObj.getValue({ fieldId: 'id' });
			var queryResults = this.query.runSuiteQL({
				query: constants.SUITEQL.SUBSIDIARY_ADDRESS_FIELDS.SAT_INDUSTRY_TYPE_CODE,
				params: [transactionId],
			});

			industryTypeFromTransfOrder.code = queryResults != null ? queryResults.results[0].values[0] : '';
		};

		CommonXmlGenerator.prototype._getUnitTypesForAllItemsInOneCall = function (result) {
			var itemIds = [];
			var itemIdMap = result.itemIdUnitTypeMap;
			result.items.map(function (item) {
				itemIds.push(item.itemId);
				item.parts.map(function (part) {
					itemIds.push(part.itemId);
				});
			});
			var unitTypeSearch = this.nsSearch.create({
				type: 'item',
				filters:[['internalid','anyof',itemIds]],
				columns : ['unitstype'],
			});

			unitTypeSearch.run().each(function (result) {
				itemIdMap['k'+result.id] = result.getValue('unitstype');
				return true;
			});
		};

		CommonXmlGenerator.prototype._attachSatMappingData = function (result) {
			var itemIdUnitTypeMap = result.itemIdUnitTypeMap;
			var log = this.log;

			function _pushForSatTaxDetails (item) {
				_pushItemPartSatTaxDetails(item);
				result.satCodesDao.pushForLineSatUnitCode(item.units);
				item.taxes.taxItems.map(function (taxLine) {
					result.satCodesDao.pushForLineSatTaxCode(taxLine.taxType);
					result.satCodesDao.pushForLineSatTaxFactorType(taxLine.taxCode);

				});
				item.taxes.whTaxItems.map(function (taxLine) {
					result.satCodesDao.pushForLineSatTaxCode(taxLine.taxType,true);
				});
			}

			function _pushItemPartSatTaxDetails (item) {
				if (item.parts) {
					item.parts.map(function (part) {
						_pushForSatTaxDetails(part);
					});
				}
			}

			function _setSatCodesForItems (items) {
				if (!items) {
					return;
				}
				var satCodes = result.satCodesDao.getJson();
				var mappingObj;

				items.map(function (item) {
					_setSatCodesForItems(item.parts);
					// SAT Unit Codes are not necessary for Payment (and itemIdUnitTypeMap is not populated in payment).
					if (!result.isFromCustomerPayment) {
						mappingObj = satCodes.unitCodes['k'+itemIdUnitTypeMap['k'+item.itemId]+'_'+item.units];
						item.satUnitCode = mappingObj?mappingObj.code:'';
						item.unitsComplete = mappingObj?mappingObj.name:'';
						log.debug({
							title: 'SATCodes.UnitCodes',
							details: JSON.stringify(satCodes.unitCodes),
						});
						log.debug({
							title: 'SATCodes.UnitCodes index key',
							details: 'k'+itemIdUnitTypeMap['k'+item.itemId]+'_'+item.units,
						});
						log.debug({
							title: 'SATCodes.UnitCodes mapping object',
							details: JSON.stringify(mappingObj),
						});
					}
					item.taxes.taxItems.map(function (taxLine) {
						if (result.suiteTaxFeature) {
							mappingObj = satCodes.taxFactorTypes[taxLine.satTaxCodeKey];
							taxLine.taxFactorType = mappingObj?mappingObj.code:'';
						} else {
							taxLine.taxFactorType = taxLine.exempt? constants.LIST.TAX_FACTOR_TYPE.EXEMPT : constants.LIST.TAX_FACTOR_TYPE.TASA;
						}

						mappingObj = satCodes.taxTypes['k'+taxLine.taxType];
						taxLine.satTaxCode = mappingObj?mappingObj.code:'';
					});
					item.taxes.whTaxItems.map(function (taxLine) {
						taxLine.taxFactorType = constants.LIST.TAX_FACTOR_TYPE.TASA;
						mappingObj = satCodes.whTaxTypes['k'+taxLine.taxType];
						taxLine.satTaxCode = mappingObj?mappingObj.code:'';
					});
				});
			}

			result.items.map(function (item) {
				_pushForSatTaxDetails(item);
			});

			result.satCodesDao.fetchSatTaxFactorTypeForAllPushed();
			result.satCodesDao.fetchSatTaxCodesForAllPushed();
			result.satCodesDao.fetchSatUnitCodesForAllPushed();

			this.log.debug('Processed SAT Mapping result :', result);
			_setSatCodesForItems(result.items);
		};

		CommonXmlGenerator.prototype._isItemFulfillment = function (txnRecord) {
			return txnRecord.type === constants.RECORD_TYPE.ITEM_FULFILLMENT;
		};

		CommonXmlGenerator.prototype._isTransferOrder = function (txnRecord) {
			return txnRecord.getValue({ fieldId: 'ordertype' }) === 'TrnfrOrd';
		};

		CommonXmlGenerator.prototype._isCreditMemo = function (txnRecord) {
			return txnRecord.type === constants.RECORD_TYPE.CREDIT_MEMO;
		};

		CommonXmlGenerator.prototype._addCustomerIndustryType = function (result, txnrecord) {
			const customerId = txnrecord.getValue(constants.FIELD.ENTITY);
			if (!customerId) {
				return;
			}

			var queryResults = this.query.runSuiteQL({
				query: constants.SUITEQL.CUSTOMER_FIELDS.SAT_INDUSTRY_TYPE,
				params: [customerId],
			}).asMappedResults();
			if (!queryResults || queryResults.length === 0) {
				return;
			}

			var customer = queryResults[0];

			result.satCodesDao.getCustomerIndustryType(customer.industry_type);
		};

		function getInstance (
			cfdi,
			customItems,
			nsSearch,
			nsRuntime,
			rfc,
			SATCodes,
			sharedModuleFinder,
			summary,
			whTax,
			log,
			query
		) {
			return new CommonXmlGenerator(
				cfdi,
				customItems,
				nsSearch,
				nsRuntime,
				rfc,
				SATCodes,
				sharedModuleFinder,
				summary,
				whTax,
				log,
				query
			);
		}

		return {
			getInstance: getInstance,
		};
	}
);
