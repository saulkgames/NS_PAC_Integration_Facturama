/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};

TAF.PaymentMethodDao = function _PaymentMethodDao () {
	this.getList = _GetList;
	this.convertRowToObject = _ConvertRowToObject;

	function _GetList (filters) {
		var result = {};
		var nlColumns = [new nlobjSearchColumn('name')];
		var nlFilters = [];

		for (var key in filters) {
			var filter = filters[key];
			if(	filter.length < 2 || filter[0] === undefined || filter[1] === undefined) {
				throw nlapiCreateError(
					'INVALID_PARAMETER',
					'filters[\'' + key+ '\']' +
					' is not an array or has less than 2 entries'
				);
			}

			var filterValue = TAF.DAO.Mapping.getKeyOrRawValue(filter[1])
			nlFilters.push(new nlobjSearchFilter(key, null, filter[0], filterValue));
		}

		var payment_methods = nlapiSearchRecord('paymentmethod', null, nlFilters, nlColumns);

		for (var i = 0; payment_methods && i < payment_methods.length; i++) {
			var paymentMethod = this.convertRowToObject(payment_methods[i]);
			result[TAF.DAO.Mapping.getMappingIndex(paymentMethod)] = paymentMethod;
		}

		return result;
	}

	function _ConvertRowToObject (row) {
		var obj = new TAF.DAO.PaymentMethod(row.getId());
		obj.name = row.getValue('name');
		obj.recordType = 'paymentmethod';
		return obj;
	}
};

TAF.DAO.PaymentMethodDao = TAF.PaymentMethodDao;