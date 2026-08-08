/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};


TAF.DAO.MappingValue = function _MappingValue(id) {
    return {
        id: id,
        name: '',
        category: '',
        inreport: '',
        isdefault : ''
    };
};
