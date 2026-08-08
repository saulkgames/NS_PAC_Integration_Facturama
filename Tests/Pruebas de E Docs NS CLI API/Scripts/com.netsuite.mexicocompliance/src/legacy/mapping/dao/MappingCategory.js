/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};


TAF.DAO.MappingCategory = function _MappingCategory(id) {
    return {
        id: id,
        name: '',
        dao: '',
        header: '',
        code: '',
        filters: ''
    };
};