/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(
	[
		'./../../common/constants'
	],
	function (constants) {
		'use strict';

		function CustGenerationDataSource (commonXmlGenerator, customerPaymentXmlGenerator) {
			this.commonXmlGenerator = commonXmlGenerator;
			this.customerPaymentXmlGenerator = customerPaymentXmlGenerator;
		}

		CustGenerationDataSource.prototype.createCustomDataObject = function (obj, recordsLoaded) {
			var txnRecord = obj.transactionRecord;

			if (txnRecord.type === constants.RECORD_TYPE.CUSTOMER_PAYMENT) {
				return this.customerPaymentXmlGenerator.objectify(obj, recordsLoaded);
			}

			return this.commonXmlGenerator.objectify(obj, recordsLoaded);
		};


		function getInstance (commonXmlGenerator, customerPaymentXmlGenerator) {
			return new CustGenerationDataSource(commonXmlGenerator, customerPaymentXmlGenerator);
		}

		return {
			getInstance: getInstance,
		};
	}
);
