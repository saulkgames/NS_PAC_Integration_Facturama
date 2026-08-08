/**
 * Copyright (c) 2021, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
	'./../../common/constants',
], function (constants) {
	'use strict';

	function Cfdi (nsQuery, nsLog) {
		this.nsQuery = nsQuery;
		this.nsLog = nsLog;

		this.satCfdiRelTypeCache = null;
		this.satCfdiUsageCache = null;
	}

	Cfdi.prototype.getCfdiRelationTypeInfo = function (result, txnRecord) {
		var lineCount = txnRecord.getLineCount({
			sublistId:constants.SUBLIST.RELATED_CFDIS,
		});

		var cfdiRelationsMap = {};
		var relatedCfdis = result.relatedCfdis;
		var cfdiRelType;
		var tmp;
		for (var index = 0; index < lineCount; index++) {
			cfdiRelType = this._getCfdiRelType(
				txnRecord.getSublistValue({
					sublistId: constants.SUBLIST.RELATED_CFDIS,
					fieldId: constants.FIELD.MX_RELATED_CFDIS_RELATIONSHIP_TYPE,
					line: index,
				})
			);
			tmp = cfdiRelationsMap[cfdiRelType];
			if (!tmp) {
				relatedCfdis.types.push(cfdiRelType);
				relatedCfdis.cfdis['k'+(relatedCfdis.types.length-1)] = [{index : index}];
				cfdiRelationsMap[cfdiRelType] = relatedCfdis.types.length;
			} else {
				relatedCfdis.cfdis['k'+(tmp-1)].push({index: index});
			}
		}
	};

	Cfdi.prototype.getCfdiUsage = function (id) {
		if (!id) {
			return;
		}

		var strId = id + '';

		if (!this.satCfdiUsageCache) {
			this.satCfdiUsageCache = {};

			var results = this.nsQuery.runSuiteQL({
				query: constants.SUITEQL.SAT.CFDI_USAGE.NOT_ENCODED_FIELDS,
			}).asMappedResults();

			results.forEach(function (result) {
				var id = result.id + '';
				this.satCfdiUsageCache[id] = {
					code: result.custrecord_mx_sat_cfdi_code,
					name: result.name,
				};
			}, this);
		}

		var obj = this.satCfdiUsageCache[strId];
		this.nsLog.debug('MX SAT CFDI Usage', obj);
		return obj;
	};

	Cfdi.prototype._getCfdiRelType = function (id) {
		if (!id) {
			return;
		}

		var strId = id + '';

		if (!this.satCfdiRelTypeCache) {
			this.satCfdiRelTypeCache = {};
			var results = this.nsQuery.runSuiteQL({
				query: constants.SUITEQL.SAT.RELATIONSHIP_TYPE.NOT_ENCODED_FIELDS,
			}).asMappedResults();

			results.forEach(function (result) {
				var id = result.id + '';
				this.satCfdiRelTypeCache[id] = {
					code: result.custrecord_mx_sat_rel_type_code,
				};
			}, this);
		}

		var obj = this.satCfdiRelTypeCache[strId];

		this.nsLog.debug('MX SAT Related CFDI', obj);

		return obj ? obj.code : null;
	};

	function getInstance (nsQuery, nsLog) {
		return new Cfdi(nsQuery, nsLog);
	}

	return {
		getInstance: getInstance,
	};
});
