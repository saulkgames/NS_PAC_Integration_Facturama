/**
 * Copyright 2016 NetSuite Inc. User may not copy, modify, distribute, or
 * re-bundle or otherwise make available this code.
 */

var TAF = TAF || {};
TAF.DAO = TAF.DAO || {};

TAF.MXComplianceBankInfo = function _MXComplianceBankInfo () {
	this.id = '';
	this.key = '';
	this.recordType = '';
	this.bankName = '';
	this.getName = function _getName () { return this.bankName; };
};

TAF.DAO.MXComplianceBankInfoDao = function _GLNumberingDao () {
	this.MAX_RESULTS = 1000;
};

TAF.DAO.MXComplianceBankInfoDao.prototype.getList = function _getList (filters) {    
	try {
    	var result = {};

		var filters = [];
		var columns = [
			new nlobjSearchColumn('internalid'),
			new nlobjSearchColumn('custrecord_psg_mx_bank_info_entity'),
			new nlobjSearchColumn('custrecord_psg_mx_acct_num'),
			new nlobjSearchColumn('custrecord_psg_mx_bank_name')];        
        
		var search = nlapiCreateSearch(
			'customrecord_psg_mx_bank_info', filters, columns
		);
		var resultSet = search.runSearch();
		var index = 0;
		do {
			var rawBankInfoEntries = resultSet.getResults(
				index, index + this.MAX_RESULTS
			);
			for (var i = 0; rawBankInfoEntries && i < rawBankInfoEntries.length; i++) {
            	var bankInfoObject = this.convertRowToObject(rawBankInfoEntries[i]);
            	result[bankInfoObject.bankName] = bankInfoObject;
			}
			index += this.MAX_RESULTS;
		} while (rawBankInfoEntries && rawBankInfoEntries.length >= this.MAX_RESULTS);
	} catch (ex) {
		nlapiLogExecution(
			'ERROR', 'TAF.DAO.MXComplianceBankInfoDao.getList', ex.toString()
		);
		throw ex;
	}
    
	return result;
};


TAF.DAO.MXComplianceBankInfoDao.prototype.convertRowToObject = function _convertRowToObject (row) {
	var bankInfo = new TAF.MXComplianceBankInfo();
    
	try {
		var bankName = row.getValue('custrecord_psg_mx_bank_name');

		bankInfo.id = bankName;
		bankInfo.key = bankName;
		bankInfo.bankName = bankName;
    	bankInfo.recordType = 'customrecord_psg_mx_bank_info';
	} catch (ex) {
		nlapiLogExecution(
			'ERROR', 'TAF.DAO.MXComplianceBankInfoDao.convertRowToObject', ex.toString()
		);
		throw ex;
	}
    
	return bankInfo;
};

