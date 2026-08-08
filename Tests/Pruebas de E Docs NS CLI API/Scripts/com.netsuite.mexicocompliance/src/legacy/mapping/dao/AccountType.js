/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }


TAF.AccountType = function _AccountType(id) {
    this.id = id;
    this.getId = function _GetId() { return this.id; };

	this.key = id;
	this.getKey = function _GetKey() { return this.key; };

	this.name = null;
    this.getName = function _GetName() { return this.name; };
    this.setName = function _SetName(value) { this.name = value; };

	this.recordType = '';
	this.setRecordType = function _SetRecordType (value) { this.recordType = value; };
	this.getRecordType = function _GetRecordType () { return this.recordType; };
};
