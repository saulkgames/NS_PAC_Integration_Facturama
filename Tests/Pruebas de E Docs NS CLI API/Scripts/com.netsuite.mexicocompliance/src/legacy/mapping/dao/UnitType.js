/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};

TAF.DAO.UnitType = function _MappingValue ( recordType, key, subRecordType, subkey, name ) {
	return {
		recordType: recordType,
		key: key,
		subRecordType: subRecordType,
		subKey: subkey,
		name: name,
	};
};
