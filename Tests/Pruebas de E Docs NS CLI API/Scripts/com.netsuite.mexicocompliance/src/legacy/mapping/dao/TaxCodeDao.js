/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};

TAF.DAO.TaxCodeDao = function _TaxCodeDao () {
    this.getList = _GetList;
    this.convertRowToObject = _ConvertRowToObject;

    function _GetList (filters) {
        var result = {};
        var nlColumns = [new nlobjSearchColumn('name')];
        var nlFilters = [new nlobjSearchFilter('country', null, 'anyof', ['MX'])];

        for (var key in filters) {
            var filter = filters[key];
            if(	filter.length < 2 || filter[0] === undefined || filter[1] === undefined) {
                throw nlapiCreateError(
                    'INVALID_PARAMETER',
                    'filters[\'' + key+ '\']' +
                    ' is not an array or has less than 2 entries'
                );
            }
            nlFilters.push(new nlobjSearchFilter(key, null, filter[0], filter[1]));
        }

        var tax_code = nlapiSearchRecord('salestaxitem', null, nlFilters, nlColumns);

        for (var i = 0; tax_code && i < tax_code.length; i++) {
            var taxCode = tax_code[i];
            result[taxCode.getId()] = this.convertRowToObject(taxCode);
        }

        return result;
    }

    function _ConvertRowToObject (row) {
        var obj = new TAF.DAO.TaxCode(row.getId());
        obj.name = row.getValue('name');
        obj.recordType = 'salestaxitem';
        return obj;
    }
};
