/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};


TAF.DAO.Mapping = function _Mapping(id) {
    return {
        id: id,

        category: null,
        recordType: '',
        key: '',
	    subRecordType: '',
        subKey: '',

        value: null,

        key_text: '',
        value_text: '',
        value_name: ''
    };
};

/**
 * Build index - string which consists of record type, record id and subrecord id (if any).
 * Index is unique identifier, individual values are separated by colon.
 * @param mapping - object (record) which has 'recordType', 'key' and 'subKey' (optional)
 * @returns {string} - index of format
 */
TAF.DAO.Mapping.getMappingIndex = function _GetMappingIndex(mapping) {
	var index = [
		mapping.recordType || '',
		':',
		mapping.key || '',
		':',
		mapping.subRecordType || '',
		':',
		mapping.subKey || ''
	].join('');

	return index;
}

/**
 * Get record type from an index
 * @param index - string in format 'recordType:key:subRecordType:subKey'
 * @returns {string} record type
 */
TAF.DAO.Mapping.getRecordType = function _GetRecordType(index) {
	return index.split(':')[0];
}

/**
 * Get key from an index
 * @param index - string in format 'recordType:key:subRecordType:subKey'
 * @returns {string} key (record id)
 */
TAF.DAO.Mapping.getKey = function _GetKey(index) {
	return index.split(':')[1];
}

/**
 * Get key if index is in format 'recordType:key:subKey' or returns index as is.
 * @param index - index in format 'recordType:key:subKey' or any string
 * @returns {string} key (record id) or index as it was passed into the function
 */
TAF.DAO.Mapping.getKeyOrRawValue = function _GetKeyOrRawValue(index) {
    if (typeof index === 'string' || index instanceof String) {
        var arrayOfValues = index.split(':');
        return arrayOfValues.length == 4 ? arrayOfValues[1] : index;
    }
    return index;
}

/**
 * Get sub-record type from an index
 * @param index - string in format 'recordType:key:subRecordType:subKey'
 * @returns {string} sub-record type
 */
TAF.DAO.Mapping.getSubRecordType = function _GetSubRecordType(index) {
	return index.split(':')[2];
}

/**
 * Get subKey from an index
 * @param index - string in format 'recordType:key:subRecordType:subKey'
 * @returns {string} sub-key (id of subrecord)
 */
TAF.DAO.Mapping.getSubKey = function _GetSubKey(index) {
	return index.split(':')[3];
}


