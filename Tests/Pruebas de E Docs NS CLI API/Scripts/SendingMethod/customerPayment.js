/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 */

define(
	[
		'N/log',
		'./../../../common/constants',
		'./../appliedTransactions',
	],
	function (log, constants, appliedTransactions) {

		function CustomerPaymentXmlGenerator (
			cfdi,
			rfc, 
			SATCodes, 
			nsRuntime,
			nsSearch,
			nsRecord, 
			commonXmlGenerator, 
			query
		) {
			this.cfdi = cfdi;
			this.rfc = rfc;
			this.SATCodes = SATCodes;
			this.nsRuntime = nsRuntime;

			this.nsSearch = nsSearch;
			this.nsRecord = nsRecord;
			this.commonXmlGenerator = commonXmlGenerator;
			this.query = query;

			this.suiteTaxFeature = this.nsRuntime.isFeatureInEffect({ feature: constants.FEATURE.SUITE_TAX });
			this.multiCurrencyFeature = this.nsRuntime.isFeatureInEffect({ feature: constants.FEATURE.MULTICURRENCY });
			this.appliedTxnsInstance = appliedTransactions.getInstance(this.query, this.nsRuntime, this.nsRecord, this.commonXmlGenerator,this.SATCodes);
		}

		CustomerPaymentXmlGenerator.prototype.objectify = function (obj, recordsLoaded) {
			var txnRecord = obj.transactionRecord;
			var multiCurrencyFeature = this.multiCurrencyFeature;
			var oneWorldFeature = this.nsRuntime.isFeatureInEffect({ feature: constants.FEATURE.ONE_WORLD });
			var suiteTaxFeature = this.suiteTaxFeature;

			var result = {
				suiteTaxFeature: suiteTaxFeature,
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
				loggedUserName : this.nsRuntime.getCurrentUser().name,
				billaddr : {},
			};
			result.appliedTxns = this.appliedTxnsInstance.getAppliedTxns(txnRecord);

			this.rfc.addCompanyRfc(result,txnRecord,recordsLoaded);
			this.cfdi.getCfdiRelationTypeInfo(result, txnRecord);
			var paymentMethodId = txnRecord.getValue(constants.FIELD.MX_SAT_PAYMENT_METHOD);
			var paymentStringTypeId = txnRecord.getValue(constants.FIELD.MX_PAYMENT_STRING_TYPE);
			this.SATCodes.getPaymentMethod(paymentMethodId);
			this.SATCodes.getPaymentStringTypeCode(paymentStringTypeId);
			this._groupTaxes(result);
			this._addBillAddress(result,txnRecord,obj.pdf);

			result.satcodes = result.satCodesDao.getJson();
			result.satCodesDao = null;
			log.debug({
				title: 'Customer Payment DataSource result:',
				details: JSON.stringify(result),
			});
			log.debug({
				title: 'Governance data FINAL',
				details: this.nsRuntime.getCurrentScript().getRemainingUsage(),
			});
			return result;
		};

		CustomerPaymentXmlGenerator.prototype._groupTaxes = function (payment) {
			payment.accumWhTaxes = [];
			payment.accumTransferTaxes = [];
			/*
			NOTE: we are setting accumExemptTaxes as an array, and in a real case scenario it should have 0 or 1 element only.
				However, in customer payment templates, we are accessing this variable as if it is a simple object
				(we don't iterate over it, we simply do accumExemptTaxes.property). With 1 element in the list,
				the template is properly generated with expected data; with 2 or more elements, information related to
				accumulated exempt taxes are empty (certification fails).
				We decided to leave it as it is since in a correct case scenario accumExemptTaxes will have only 0 or 1 entry.
			 */
			payment.accumExemptTaxes = [];

			const partialWhTaxes = {};
			const partialTransferTaxes = {};
			const partialExemptTaxes = {};

			payment.appliedTxns.forEach(function (txn) {
				// Sum withholding taxes, grouped by SAT tax code.
				txn.taxSummary.whTaxes.forEach(function (whTaxLine) {
					if (!partialWhTaxes[whTaxLine.satTaxCode]) {
						partialWhTaxes[whTaxLine.satTaxCode] = {
							Id: whTaxLine.satTaxCode,
							satTaxCode: whTaxLine.satTaxCode, // Impuesto
							taxAmount: 0,
							taxFactorType: whTaxLine.taxFactorType,
						};
						payment.accumWhTaxes.push(partialWhTaxes[whTaxLine.satTaxCode]);
					}

					partialWhTaxes[whTaxLine.satTaxCode].taxAmount += whTaxLine.taxAmount; // The sum of all "ImporteDR"
				});

				// Sum transfer taxes, grouped by SAT tax code, tax rate and tax factor type.
				txn.taxSummary.transferTaxes.forEach(function (transferTaxLine) {
					const id = transferTaxLine.satTaxCode + '-' + transferTaxLine.taxRate + '-' + transferTaxLine.taxFactorType;
					if (!partialTransferTaxes[id]) {
						partialTransferTaxes[id] = {
							Id: id,
							satTaxCode: transferTaxLine.satTaxCode, // Impuesto
							taxRate: transferTaxLine.taxRate, // Tasa o cuota
							taxFactorType: transferTaxLine.taxFactorType, // Tipo factor
							taxAmount: 0,
							taxSummary: 0,
						};
						payment.accumTransferTaxes.push(partialTransferTaxes[id]);
					}

					partialTransferTaxes[id].taxAmount += transferTaxLine.taxAmount; // The sum of all "ImporteDR"
					partialTransferTaxes[id].taxSummary += transferTaxLine.totalTaxBaseAmount; // The sum of all "BaseDR"
				});

				txn.taxSummary.exemptTaxes.forEach(function (exemptTaxLine) {
					const id = exemptTaxLine.satTaxCode + '-' + exemptTaxLine.taxRate + '-' + exemptTaxLine.taxFactorType;
					if (!partialExemptTaxes[id]) {
						partialExemptTaxes[id] = {
							taxFactorType: constants.LIST.TAX_FACTOR_TYPE.EXEMPT,
							satTaxCode: '002',
							taxAmount: 0,
							taxSummary: 0,
						};
						payment.accumExemptTaxes.push(partialExemptTaxes[id]);
					}
					partialExemptTaxes[id].taxAmount += exemptTaxLine.taxAmount; // The sum of all "ImporteDR"
					partialExemptTaxes[id].taxSummary += exemptTaxLine.totalTaxBaseAmount; // The sum of all "BaseDR"
				});
			});


			this._computeTotales(payment);
		};

		CustomerPaymentXmlGenerator.prototype._addBillAddress = function (result,txnRecord,isPdf) {
			var recordObj;
			if (isPdf) {
				recordObj = txnRecord;
			} else {
				recordObj = txnRecord.getRecord();
			}

			var customerID = recordObj.getValue({ fieldId: constants.FIELD.CUSTOMER });
			var defaultBillingAddressForCustomer = this.query.runSuiteQL({
				query: constants.SUITEQL.CUSTOMER_ADDRESS_FIELDS.CUSTOMER_DEFAULT_BILLING_ADDRESS,
				params: [customerID],
			}).asMappedResults();

			var billaddr = result.billaddr;
			billaddr.customerdefaultzipcode = (!defaultBillingAddressForCustomer.length || !defaultBillingAddressForCustomer[0].zip) ? '' : defaultBillingAddressForCustomer[0].zip;
		};

		CustomerPaymentXmlGenerator.prototype._computeTotales = function (payment) {
			// This data is only used in the Sol.Factible template
			function taxPred (t, taxCode, factorType, taxRate/* optional*/) {
				return t.satTaxCode === taxCode
					&& t.taxFactorType === factorType
					&& (taxRate == null || parseFloat(t.taxRate) === taxRate);
			}
			var totalRetencionesISR = payment.accumWhTaxes.filter(function (t) { return taxPred(t, constants.LIST.TAX_CODE.ISR, constants.LIST.TAX_FACTOR_TYPE.TASA); });
			var totalRetencionesIVA = payment.accumWhTaxes.filter(function (t) { return taxPred(t, constants.LIST.TAX_CODE.IVA, constants.LIST.TAX_FACTOR_TYPE.TASA); });
			var totalRetencionesIEPS = payment.accumWhTaxes.filter(function (t) { return taxPred(t, constants.LIST.TAX_CODE.IEPS, constants.LIST.TAX_FACTOR_TYPE.TASA); });

			// eslint-disable-next-line no-magic-numbers
			var totalTrasladosIVA16 = payment.accumTransferTaxes.filter(function (t) { return taxPred(t, constants.LIST.TAX_CODE.IVA, constants.LIST.TAX_FACTOR_TYPE.TASA, 0.16); });
			// eslint-disable-next-line no-magic-numbers
			var totalTrasladosIVA8 = payment.accumTransferTaxes.filter(function (t) { return taxPred(t, constants.LIST.TAX_CODE.IVA, constants.LIST.TAX_FACTOR_TYPE.TASA, 0.08); });
			var totalTrasladosIVA0 = payment.accumTransferTaxes.filter(function (t) { return taxPred(t, constants.LIST.TAX_CODE.IVA, constants.LIST.TAX_FACTOR_TYPE.TASA, 0.0); });
			var totalExentoTransferTaxes = payment.accumExemptTaxes.filter(function (t) { return taxPred(t, constants.LIST.TAX_CODE.IVA, constants.LIST.TAX_FACTOR_TYPE.EXEMPT); });

			if (totalRetencionesISR.length) {
				payment.totalRetencionesISR = totalRetencionesISR[0].taxAmount;
			}
			if (totalRetencionesIVA.length) {
				payment.totalRetencionesIVA = totalRetencionesIVA[0].taxAmount;
			}
			if (totalRetencionesIEPS.length) {
				payment.totalRetencionesIEPS = totalRetencionesIEPS[0].taxAmount;
			}

			if (totalTrasladosIVA16.length) {
				payment.totalTrasladosBaseIVA16 = totalTrasladosIVA16[0].taxSummary;
				payment.totalTrasladosImpuestoIVA16 = totalTrasladosIVA16[0].taxAmount;
			}
			if (totalTrasladosIVA8.length) {
				payment.totalTrasladosBaseIVA8 = totalTrasladosIVA8[0].taxSummary;
				payment.totalTrasladosImpuestoIVA8 = totalTrasladosIVA8[0].taxAmount;
			}
			if (totalTrasladosIVA0.length) {
				payment.totalTrasladosBaseIVA0 = totalTrasladosIVA0[0].taxSummary;
				payment.totalTrasladosImpuestoIVA0 = totalTrasladosIVA0[0].taxAmount;
			}
			if (totalExentoTransferTaxes.length) {
				payment.totalTrasladosBaseIVAExento = totalExentoTransferTaxes[0].taxSummary;
			}
		};

		function getInstance (cfdi, rfc, SATCodes, nsRuntime, nsSearch, nsRecord, commonXmlGenerator, query) {
			return new CustomerPaymentXmlGenerator(cfdi, rfc, SATCodes, nsRuntime, nsSearch, nsRecord, commonXmlGenerator, query);
		}

		return {
			getInstance: getInstance,
		};
	}
);
