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

	function Cancellation (nsQuery, nsLog) {
		this.nsQuery = nsQuery;
		this.nsLog = nsLog;
	}

	Cancellation.prototype.getCancellationInfo = function (id) {
		if (!id) {
			return;
		}
		
		this.satCfdiRelTypeCache = {};
		var results = this.nsQuery.runSuiteQL({
			query: constants.SUITEQL.MCF_CANCELLATION,
			params: [constants.CUSTOMTRANSACTION.MCF_EDOC_CANCEL, id],
			
		}).asMappedResults();

		if(results.length > 0) {
			return  {
				transaction: {
					cfdiNumber: results[0].custbody_mcf_folio_canc, 
					cfdiSeries: results[0].custbody_mcf_serie_canc, 
					cancellationReason: results[0].custrecord_mcf_sat_cnl_rsn_name, 
					cancellationReasonCode: results[0].custrecord_mcf_sat_cnl_rsn_code,
					certificationProtocol: results[0].custbody_mcf_uuid_canc,
					replaceProtocol: results[0].custbody_mcf_uuid_rep_canc,
					issuerTaxId: results[0].custbody_mcf_customer_rfc,
					year: results[0].year
				},
				subsidiary: {
					id: results[0].subsidiary
				}
			};

		}

		return {};
	};

	Cancellation.prototype.getCancellationEdocument = function (id) {
		if (!id) {
			return;
		}

		this.satCfdiRelTypeCache = {};
		var results = this.nsQuery.runSuiteQL({
			query: constants.SUITEQL.MCF_CANCELLATION_TEMPLATE,
			params: [id],

		}).asMappedResults();

		if(results.length > 0) {
			return  {
				template: results[0].custbody_psg_ei_template,
				name: results[0].name,
			};

		}

		return {};
	};

	function getInstance (nsQuery, nsLog) {
		return new Cancellation(nsQuery, nsLog);
	}

	return {
		getInstance: getInstance,
	};
});
