/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

/*
TODO: remove all the code related to AccountNumber, LocalizedNumber, LocalizedName, Description and also has_account_numbering and hasAccountingContext variables. Then remove unused methods from Account.js.
Fields mentioned above are not necessary because NetSuite populates 'name' field with correct combination of localized number and localized name. Mapping tool displays only content of 'name' field.
 */

if (!TAF) { var TAF = {}; }

TAF.AccountDao = function _AccountDao () {
	var object_cache = {};
	var is_one_world = nlapiGetContext().getSetting('FEATURE', 'SUBSIDIARIES') === 'T';
	var has_account_numbering = nlapiLoadConfiguration('accountingpreferences').getFieldValue('ACCOUNTNUMBERS') == 'T';
	var MAX_RESULTS = 1000;
	var hasAccountingContext = !!(is_one_world && nlapiGetContext().getPreference('ACCOUNTING_CONTEXT'));
    
	this.getList = _GetList;
    
	function _GetList (filters) {
		populateCache(filters);
		return object_cache;
	}


	function populateCache (filters) {
		getAccounts(filters);
	}

    
	function getAccounts (filters) {
		try {
			var columns = [
				new nlobjSearchColumn('internalid'),
				new nlobjSearchColumn('name'),
				new nlobjSearchColumn('type'),
				new nlobjSearchColumn('description'),
			];
            
			if (is_one_world) {
				columns.push(new nlobjSearchColumn('subsidiary'));
			}
            
			if (has_account_numbering) {
				columns.push(new nlobjSearchColumn('number'));
			}
            
			if (hasAccountingContext) {
				columns.push(new nlobjSearchColumn('localizedname'));

				if(has_account_numbering) {
					columns.push(new nlobjSearchColumn('localizednumber'));
				}
                
				if(filters.hasOwnProperty('accountingcontext')) {
					filters.accountingcontext[1] = filters.accountingcontext[1] || '@NONE@'; 
                    
					var language = nlapiGetContext().getPreference('LANGUAGE');
					var srchFilter = [ new nlobjSearchFilter('locale', null, 'is', language) ];
					var rs = nlapiSearchRecord('account', null, srchFilter,null);
					if(!rs) {
						language = '@NONE@';
					}
					filters.locale = ['is',language];
				}
			} else if(!hasAccountingContext) {
				delete filters.accountingcontext;
			}

			columns[0].setSort();
            
			var _filters = [];
            
			for (var key in filters) {
				var filterValue = TAF.DAO.Mapping.getKeyOrRawValue(filters[key][1])
				_filters.push(new nlobjSearchFilter(key, null, filters[key][0], filterValue));
			}
            
			var search = nlapiCreateSearch('account', _filters, columns);
			var resultSet = search.runSearch();
			var index = 0;
			do {
				var accounts = resultSet.getResults(index, index + MAX_RESULTS);
				for (var i = 0; accounts && i < accounts.length; i++) {
					var account = convertRowToObject(accounts[i])
					object_cache[TAF.DAO.Mapping.getMappingIndex(account)] = account;
				}
				index += MAX_RESULTS;
			} while (accounts && accounts.length >= MAX_RESULTS);
		} catch (ex) {
			nlapiLogExecution('ERROR', 'TAF.AccountDao.getAccounts', ex.toString());
		}
	}

	function convertRowToObject (row) {
		var object = new TAF.Account(row.getId());
        
		object.isOneWorld(is_one_world);
		object.setAccountName(row.getValue('name'));
		object.setType(row.getValue('type'));
		object.setDescription(row.getValue('description'));
		object.setRecordType('account')
		if(hasAccountingContext) {
			object.setLocalizedName(row.getValue('localizedname').trim());
		}
        
		if (has_account_numbering) {
			object.setAccountNumber(row.getValue('number'));
			if(hasAccountingContext) {
				object.setLocalizedNumber(row.getValue('localizednumber'));
			}
		}
        
		if (is_one_world) {
			object.setSubsidiary(row.getValue('subsidiary'));
		}
        
		return object;
	}
};


TAF.DAO = TAF.DAO || {};
TAF.DAO.AccountDao = TAF.AccountDao;