/**
 * @copyright © 2018, Oracle and/or its affiliates. All rights reserved.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};

TAF.DAO.TaxCategoryDao = function _TaxCategoryDao () {

  var taxTypes_cache = {};
  var _isSuiteTax = nlapiGetContext().getSetting('FEATURE', 'TAX_OVERHAULING') === 'T';
  var _isWithholdingTaxInstaled = undefined;
  var _resourceMgr = new ResourceMgr(nlapiGetContext().getPreference('LANGUAGE'));
  var _mexicanNexuses = undefined;
  var MAX_RESULTS = 1000;

  this.getList = _GetList;
  this.convertRowToObject = _ConvertRowToObject;

  function _GetList (filters) {
    // get Core tax types
    getCoreTaxTypes(filters);
    // get Tax Types from Withholding Tax bundle
    if (!_isSuiteTax && isWithholdingTaxInstaled()) {
      getWithholdingTaxTypes(filters);
    }
    return taxTypes_cache;
  }

  function getCoreTaxTypes () {
      var nlColumns = [new nlobjSearchColumn('name')];
      var nlFilters = [new nlobjSearchFilter('country', null, 'anyof', ['MX'])];

      nlColumns[0].setSort();

      getTaxTypesFromSearch('taxtype', nlFilters, nlColumns);
  }

  function getWithholdingTaxTypes () {
    var nlColumns = [new nlobjSearchColumn('custrecord_4601_wtt_name')];
    var nlFilters = getMexicanNexusesFilter(getMexicanNexuses());

    nlColumns[0].setSort();
    getTaxTypesFromSearch('customrecord_4601_witaxtype', nlFilters, nlColumns);
  }

  function getTaxTypesFromSearch(recordType, filters, columns) {
    try {
      var search = nlapiCreateSearch(recordType, filters, columns);
      var resultSet = search.runSearch();
      var resultItem;
      var index = 0;
      do {
        var taxTypes = resultSet.getResults(index, index + MAX_RESULTS);
        for (var i = 0; taxTypes && i < taxTypes.length; i++) {
          resultItem = _ConvertRowToObject(taxTypes[i], recordType)
          
          taxTypes_cache[TAF.DAO.Mapping.getMappingIndex(resultItem)] = resultItem;
        }
        index += MAX_RESULTS;
      } while (taxTypes && taxTypes.length >= MAX_RESULTS);
    } catch(ex) {
      nlapiLogExecution('ERROR', 'TAF.TaxCategoryDao.getTaxTypesFromSearch', ex.toString());
    }
  }
  function getMexicanNexusesFilter (nexusesIds) {
    var filter = [];

    if(nexusesIds && nexusesIds.length > 0) {

      for (var i = 0; nexusesIds && i < nexusesIds.length; i++) {
        filter.push(['custrecord_4601_wtt_witaxsetup.custrecord_4601_wts_nexus', 'equalto', nexusesIds[i]]);
        filter.push('or');
      }
      filter.pop();
    }
    return filter;
  }

  function getMexicanNexuses () {
    if (_mexicanNexuses === undefined) {
      try {
        _mexicanNexuses = [];
        var nlFilters = [new nlobjSearchFilter('country', null, 'anyof', ['MX'])];
        var search = nlapiCreateSearch('nexus', nlFilters, []);
        var resultSet = search.runSearch();

        var index = 0;
        do {
          var nexuses = resultSet.getResults(index, index + MAX_RESULTS);
          for (var i = 0; nexuses && i < nexuses.length; i++) {
            _mexicanNexuses.push(nexuses[i].getId());
          }
          index += MAX_RESULTS;
        } while (nexuses && nexuses.length >= MAX_RESULTS);
      } catch(ex) {
        nlapiLogExecution('ERROR', 'TAF.TaxCategoryDao.getMexicanNexuses', ex.toString());
      }
    }
    return _mexicanNexuses;
  }

  function isWithholdingTaxInstaled() {
    if (_isWithholdingTaxInstaled === undefined) {
      _isWithholdingTaxInstaled = true;
      try {
        nlapiCreateSearch('customrecord_4601_witaxtype', [], []);
      } catch(ex) {
        _isWithholdingTaxInstaled = false;
      }
    }
    return _isWithholdingTaxInstaled;
  }

  function _ConvertRowToObject (row, recordType) {
    var obj = new TAF.TaxCategory(row.getId());
    if (recordType === 'customrecord_4601_witaxtype') {
      obj.name = row.getValue('custrecord_4601_wtt_name') + ' (' + _resourceMgr.GetString('WITHHOLDING') + ')';
    }
    else {
      obj.name = row.getValue('name');
    }
    obj.setRecordType(recordType)
    return obj;
  }
};
