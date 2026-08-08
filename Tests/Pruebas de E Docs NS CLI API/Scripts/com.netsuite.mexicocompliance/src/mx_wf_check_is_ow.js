/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.1
 * @NScriptType workflowactionscript
 */
define(
	['./common/application'],

	function (application) {

		/**
		 * Definition of the Suitelet script trigger point.
		 *
		 * @param {Object} context
		 * @param {Record} context.newRecord - New record
		 * @param {Record} context.oldRecord - Old record
		 * @Since 2016.1
		 */
		function onAction (context) {
			return application.isOneWorld() ? 'T' : 'F';
		}

		return {
			onAction: onAction,
		};
	}
);
