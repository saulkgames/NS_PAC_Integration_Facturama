/**
 * Copyright 2018 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};

TAF.DAO.MeasureType = function _MappingValue( key, measureName, recordType ) {
	this.id = key;
	this.key = key;
	this.recordType = recordType;
	this.name = measureName;
};
