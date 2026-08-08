/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
if (!TAF.DAO) { TAF.DAO = {}; }

TAF.AccountTypeDao = function _AccountTypeDao() {
    this.getList = _GetList;
    this.convertRowToObject = _ConvertRowToObject;
    	
    function _GetList(filters) {
    	var result = {};
        var nlColumns = [new nlobjSearchColumn("type", null, "GROUP")];
        var nlFilters = [];
        
        for (var key in filters) {
        	var filter = filters[key];
        	if(	filter.length < 2 		|| 
				filter[0] === undefined || 
				filter[1] === undefined){
        		throw nlapiCreateError('INVALID_PARAMETER', 
					'filters[\'' + key+ '\']' + 
					' is not an array or has less than 2 entries');
        	}
	        var filterValue = TAF.DAO.Mapping.getKeyOrRawValue(filter[1])
        	nlFilters.push(new nlobjSearchFilter(key, null, filter[0], filterValue));
        }
        
        var types = nlapiSearchRecord("account", null, nlFilters, nlColumns);
        for (var i = 0; types && i < types.length; i++) {
        	var accountType = this.convertRowToObject(types[i]);
        	result[TAF.DAO.Mapping.getMappingIndex(accountType)] = accountType;
        }
        
        return result;
    };
    
    function _ConvertRowToObject(row) {
        var object = new TAF.AccountType(row.getValue("type", null, "GROUP"));
        object.setName(row.getText("type", null, "GROUP"));
	    object.setRecordType('account')
        return object;
    };
};

TAF.DAO.AccountTypeDao = TAF.AccountTypeDao;

