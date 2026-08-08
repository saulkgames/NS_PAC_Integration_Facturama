/**
 * Copyright (c) 2021, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([], function () {
	'use strict';

	function queryExecution (query) {
		this.query = query;
	}

	queryExecution.prototype.getObjectByQuery = function (queryOptions) {
		var queryResults = this.query.runSuiteQL(queryOptions).asMappedResults();
		if (!queryResults || queryResults.length === 0) {
			return {};
		}
		Object.keys(queryResults[0]).forEach(function (key) {
			if (queryResults[0][key] === null) {
				queryResults[0][key] = undefined;
			}
		});
		return queryResults[0];
	};

	function getInstance (query) {
		return new queryExecution(query);
	}

	return {
		getInstance: getInstance,
	};
});
