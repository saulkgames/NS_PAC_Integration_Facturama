/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */
/**
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */
define([
	'./../../electronicInvoicing/installation/EIComponents',
	'./../../electronicPayments/installation/EPComponents',
], function (electronicInvoicingComponents, electronicPaymentsComponents) {

	function execute () {
		electronicInvoicingComponents.install();
		electronicPaymentsComponents.install();
	}

	return {
		execute: execute,
	};
});
