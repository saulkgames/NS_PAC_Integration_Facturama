/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define([
	'N/log',
	'N/search',
	'./../../common/application',
	'./../../common/constants',
	'./../lib/commonDataProvider',
	'./../../translations/translator',
], function (log, search, application, constants, commonDataProvider, translator) {
	'use strict';
	/*
		inactive represents - enable checkbox field in the Pac Record
	*/
	function _agreeUnCheckErrObj () {
		return {
			result : false,
			errorName: translator.ERROR_GENERAL_TITLE(),
			errorCode : 'ERR_NO_ACCEPT_DIALOG_MSG',
			errorMessage : translator.ERROR_NO_ACCEPT_DIALOG_MSG(),
		};
	}

	function _subsidiaryAlreadyInUseErrObj () {
		return {
			result : false,
			errorName: translator.ERROR_GENERAL_TITLE(),
			errorCode : 'ERR_SUBSIDIARY_ALREADY_IN_USE',
			errorMessage : translator.ERROR_EI_SUBSIDIARY_ALREADY_IN_USE(),
		};
	}

	function _onlyOneEnabledPacIsAllowed () {
		return {
			result : false,
			errorName: translator.ERROR_GENERAL_TITLE(),
			errorCode : 'ERROR_EI_ONLY_ONE_ENABLED_PAC_IS_ALLOWED',
			errorMessage : translator.ERROR_EI_ONLY_ONE_ENABLED_PAC_IS_ALLOWED(),
		};
	}

	function validate (props) {
		var successObject = {result: true};
		
		if (props.inactive) {
			return successObject;
		}

		if (_pacHasSubsidiaries(props) && _atLeastOneSubsidiaryIsAlreadyUsedByAnotherPac(props)) {
			return _subsidiaryAlreadyInUseErrObj();
		}

		switch (props.mode) {
			case 'create':
			case 'copy':
				break;

			case 'xedit':
			case 'edit':
				if (props.oldInactive) {
					log.debug('props.oldInactive', props.oldInactive);
					break;
				}
				if (!props.iAgree) {
					log.debug('!props.iAgree', !props.iAgree);
					return _agreeUnCheckErrObj();
				}
				break;

			default:
				return successObject;
		}
      
		if (!props.iAgree) {
			return _agreeUnCheckErrObj();
		}

		if (props.name && props.isEnabled && !application.isOneWorld() && commonDataProvider.thereAreOtherPacsEnabledBesidesCurrentOne(props.id)) {
			return _onlyOneEnabledPacIsAllowed();
		}

		return successObject;
	}

	function _pacHasSubsidiaries (props) {
		return props.subsidiaries
			&& props.subsidiaries.length > 0
			&& !(props.subsidiaries.length === 1 && props.subsidiaries[0] === '');
	}

	function _atLeastOneSubsidiaryIsAlreadyUsedByAnotherPac (props) {
		var filters = [
			{
				name: constants.FIELD.MX_PACINFO_SUBSIDIARY,
				operator: search.Operator.ANYOF,
				values: props.subsidiaries,
			},
			{
				name: constants.FIELD.MX_PACINFO_ENABLE,
				operator: search.Operator.IS,
				values: 'T',
			},
		];
		if (props.id) {
			filters.push({
				name: constants.FIELD.INTERNALID,
				operator: search.Operator.NONEOF,
				values: [props.id],

			});
		}
		var columns = [
			{
				name: constants.FIELD.MX_PACINFO_EDOC_PACKAGE,
			},
		];

		var activePacSearch = search.create({
			type: constants.RECORD_TYPE.MX_PAC_CONNECTION_INFO,
			columns: columns,
			filters: filters,
		});
		var results = activePacSearch.run().getRange({start: 0, end: 1});

		return results.length > 0;
	}

	function noPacsEnabledWithThatPackageName (props) {
		var filters = [
			{
				name: constants.FIELD.MX_PACINFO_EDOC_PACKAGE,
				operator: search.Operator.IS,
				values: props.name,
			},
			{
				name: constants.FIELD.MX_PACINFO_ENABLE,
				operator: search.Operator.IS,
				values: 'T',
			},
		];
		var columns = [
			{
				name: constants.FIELD.MX_PACINFO_EDOC_PACKAGE,
			},
		];

		var activePacSearch = search.create({
			type: constants.RECORD_TYPE.MX_PAC_CONNECTION_INFO,
			columns: columns,
			filters: filters,
		});
		var results = activePacSearch.run().getRange({start: 0, end: 1});

		return results.length === 0;
	}

	function isPacEnabled (id) {
		return commonDataProvider.getPacEnableValue(id);
	}

	function isDisabled (recordObj) {
		var value = recordObj.getValue(constants.FIELD.MX_PACINFO_ENABLE);
		if (typeof value === 'string') {
			return value === 'F';
		}
		return !value;
	}

	function isIAgreed (recordObj) {
		return recordObj.getValue(constants.FIELD.MX_PACINFO_I_AGREE);
	}
  
	return {
		validate : validate,
		isPacEnabled : isPacEnabled,
		isDisabled : isDisabled,
		isIAgreed : isIAgreed,
		noPacsEnabledWithThatPackageName: noPacsEnabledWithThatPackageName,
	};
});
  