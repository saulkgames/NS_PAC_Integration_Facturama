/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }





TAF.Account = function _Account (id) {
	this.id = id;
	this.key = id;
	this.recordType = '';
	this.name = '';
	this.accountNumber = '';
	this.subsidiary = '';
	this.accountType = '';
	this.accountDescription = '';
	this.bankNumber = '';
	this.localizedName = '';
	this.localizedNumber = '';

	var is_one_world = true;
	this.isOneWorld = function _IsOneWorld (value) { is_one_world = value; };

	var account_id = id;
	this.getAccountId = function _GetAccountId () { return account_id; };

	this.setAccountName = function _SetAccountName (value) { this.name = value; };
	this.getAccountName = function _GetAccountName () { return this.name; };

	this.setAccountNumber = function _SetAccountNumber (value) { this.accountNumber = value; };
	this.getAccountNumber = function _GetAccountNumber (value) { return this.accountNumber; };

	this.setSubsidiary = function _SetSubsidiary (value) { this.subsidiary = value; };
	this.getSubsidiary = function _GetSubsidiary () { return this.subsidiary; };
    
	this.setType = function _SetType (value){ this.accountType = value; };
	this.getType = function _GetType () { return this.accountType; };
    
	this.setDescription = function _SetDescription (value) { this.accountDescription = value; };
	this.getDescription = function _GetDescription () { return this.accountDescription; };

	this.setLocalizedName = function _SetLocalizedName (value) { this.localizedName = value; };
	this.getLocalizedName = function _GetLocalizedName () { return this.localizedName; };
    
	this.setLocalizedNumber = function _SetLocalizedNumber (value) { this.localizedNumber = value; };
	this.getLocalizedNumber = function _GetLocalizedNumber () { return this.localizedNumber; };

	this.setRecordType = function _SetRecordType (value) { this.recordType = value; };
	this.getRecordType = function _GetRecordType () { return this.recordType; };
};

