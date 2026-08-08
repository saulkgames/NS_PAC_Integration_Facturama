/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};


TAF.DAO.TaxCode = function _TaxCode(id) {
    this.id = id;
    this.key = id;
    this.subKey = '';
    this.recordType = '';
    this.name = null;

    this.getId = function _GetId() { return this.id; };

    this.getName = function _GetName() { return this.name; };
    this.setName = function _SetName(value) { this.name = value; };

    this.setRecordType = function _SetRecordType (value) { this.recordType = value; };
    this.getRecordType = function _GetRecordType () { return this.recordType; };

    this.setSubKey = function _SetSubKey (value) { this.subKey = value; };
    this.getSubKey = function _GetSubKey () { return this.subKey; };
};