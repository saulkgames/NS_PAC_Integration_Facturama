/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */
if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};

TAF.SubsidiaryDao = function _SubsidiaryDao() {
	this.getCountryList=  _GetCountryList;
    this.getList = _GetList;
    this.getSubsidiaryInfo = _GetSubsidiaryInfo;
    this.convertRowToObject = _ConvertRowToObject;
    
    var context = nlapiGetContext();
    this.isMulticurrency = context.getFeature('MULTICURRENCY');
    this.isMultiBook = context.getFeature('MULTIBOOK');
    this.isMultipleCalendar = context.getSetting('FEATURE', 'MULTIPLECALENDARS') == 'T';
    this.isForeignCurrency = context.getFeature('FOREIGNCURRENCYMANAGEMENT');
    
    this.RECORD_NAME = 'subsidiary';
    this.FIELDS = {
        NAME            : 'name',
        NAMENOHIERARCHY : 'namenohierarchy',
        ISINACTIVE      : 'isinactive',
        ISELIMINATION   : 'iselimination',
        LEGALNAME       : 'legalname',
        TAXIDNUM        : 'taxidnum',
        VATNUMBER       : 'federalidnumber',
        COUNTRY         : 'country',
        CURRENCY        : 'currency',
        ACCOUNTINGBOOK  : 'accountingbook',
        ACCOUNTINGBOOKCURRENCY: 'accountingbookcurrency',
        CALENDAR: 'fiscalcalendar',
        ADDRESS1: 'address1',
        ADDRESS2: 'address2',
        CITY: 'city',
        STATE: 'state',
        ZIP: 'zip'
    };
    
    function _GetList(filters) {
        var result = {};
        var nlColumns = [
           new nlobjSearchColumn(this.FIELDS.NAMENOHIERARCHY),
           new nlobjSearchColumn(this.FIELDS.ISINACTIVE),
           new nlobjSearchColumn(this.FIELDS.ISELIMINATION),
           new nlobjSearchColumn(this.FIELDS.LEGALNAME),
           new nlobjSearchColumn(this.FIELDS.TAXIDNUM),
           new nlobjSearchColumn(this.FIELDS.COUNTRY),
           new nlobjSearchColumn(this.FIELDS.ADDRESS1),
           new nlobjSearchColumn(this.FIELDS.ADDRESS2),
           new nlobjSearchColumn(this.FIELDS.CITY),
           new nlobjSearchColumn(this.FIELDS.STATE),
           new nlobjSearchColumn(this.FIELDS.ZIP)
        ];
        
        var nlFilters = [];
        
        if (this.isMulticurrency) {
            nlColumns.push(new nlobjSearchColumn(this.FIELDS.CURRENCY));
        }
        
        if (this.isMultipleCalendar) {
            nlColumns.push(new nlobjSearchColumn(this.FIELDS.CALENDAR));
        }
        
        if (this.isMultiBook && this.isForeignCurrency && filters && filters.accountingbook) {
            nlColumns.push(new nlobjSearchColumn(this.FIELDS.ACCOUNTINGBOOKCURRENCY));
        }
        
        for (var key in filters) {
            filter = filters[key];
            if(  filter.length < 2 || 
                filter[0] === undefined || 
                filter[1] === undefined){
                throw nlapiCreateError('INVALID_PARAMETER', 
                    'filters[\'' + key+ '\']' + 
                    ' is not an array or has less than 2 entries');
            }
            nlFilters.push(new nlobjSearchFilter(key, null, filter[0], filter[1]));
        }
        
        var subsidiaries = nlapiSearchRecord(this.RECORD_NAME, null, nlFilters, nlColumns);
        for (var i = 0; subsidiaries && i < subsidiaries.length; i++) {
            var subsidiary = subsidiaries[i];
            result[subsidiary.getId()] = this.convertRowToObject(subsidiary);
        }
        
        return result;
    }
    
    function _ConvertRowToObject(row) {
        var object = new TAF.Subsidiary(row.getId());
        object.setName(row.getValue(this.FIELDS.NAMENOHIERARCHY));
        object.setLegalName(row.getValue(this.FIELDS.LEGALNAME));
        object.setFederalIdNumber(row.getValue(this.FIELDS.TAXIDNUM));
        object.setCountry(row.getText(this.FIELDS.COUNTRY));
        object.setCountryCode(row.getValue(this.FIELDS.COUNTRY));
        
        if (this.isMultiBook && this.isForeignCurrency) {
            object.setAccountingBookCurrency(row.getValue(this.FIELDS.ACCOUNTINGBOOKCURRENCY));
            object.setAccountingBookCurrencyText(row.getText(this.FIELDS.ACCOUNTINGBOOKCURRENCY));
        }
        
        if (this.isMulticurrency) {
            object.setCurrency(row.getValue(this.FIELDS.CURRENCY));
        }
        
        if (this.isMultipleCalendar) {
            object.setFiscalCalendar(row.getValue(this.FIELDS.CALENDAR));
        }

        object.setAddress1(row.getValue(this.FIELDS.ADDRESS1));
        object.setAddress2(row.getValue(this.FIELDS.ADDRESS2));
        object.setCity(row.getValue(this.FIELDS.CITY));
        object.setState(row.getValue(this.FIELDS.STATE));
        object.setZip(row.getValue(this.FIELDS.ZIP));

        return object;
    }
    
    function _GetSubsidiaryInfo(params) {
        if(!params) {
            throw nlapiCreateError('MISSING_PARAMETER', 'Params should not be null or undefined');
        }
        
        if(!params.subsidiary) {
            throw nlapiCreateError('INVALID_PARAMETER', 'Params should contain subsidiary string');
        }
        
        var filters = {
            iselimination: ['is', 'F'],
            isinactive: ['is', 'F']
        };
        if (params.bookId) {
            filters.accountingbook = ['is', params.bookId];
        }
        var subsidiaryList = this.getList(filters);
        return  (subsidiaryList && subsidiaryList[params.subsidiary]) ?
            subsidiaryList[params.subsidiary]: null;
    }
    
    function _GetCountryList(){
    	var result = {};
    	var subsidiaries = nlapiSearchRecord(this.RECORD_NAME, null, null, [new nlobjSearchColumn('country')]);
        for (var i = 0; subsidiaries && i < subsidiaries.length; i++) {
        	var subsidiary = subsidiaries[i];
            result[subsidiary.getId()] = subsidiary.getValue(this.FIELDS.COUNTRY);
        }
        return result;
    }
};

TAF.DAO.SubsidiaryDao = TAF.SubsidiaryDao;

TAF.DAO.Subsidiary = function _Subsidiary(id) {
    return {
        id : id,
        name : '',
        legalName : '',
        vatNumber : '',
        uen       : '',
        brn       : '',
        country   : '',
        currency  : '',
        countryCode     : ''
    };
};

TAF.DAO.SubsidiaryDao.prototype.getSubsidiaryById = function _getSubsidiaryById(id) {
    var sub = {};
    try {
        var searchObject = nlapiLoadRecord('subsidiary', id);
        sub = this.convertRecordToObject(searchObject);
    } catch (ex) {
        nlapiLogExecution('ERROR', 'TAF.DAO.SubsidiaryDao.getSubsidiaryById', ex.toString());
        throw nlapiCreateError('SEARCH_ERROR', 'Error in TAF.DAO.SubsidiaryDao.getSubsidiaryById');
    } 
    return sub;
};

TAF.DAO.SubsidiaryDao.prototype.convertRecordToObject = function _convertRecordToObject(searchObject) {    
    var sub = new TAF.DAO.Subsidiary(searchObject.getId() || '');
    sub.name            = searchObject.getFieldValue(this.FIELDS.NAME) || '';
    sub.legalName       = searchObject.getFieldValue(this.FIELDS.LEGALNAME) || '';
    sub.vatNumber       = searchObject.getFieldValue(this.FIELDS.VATNUMBER) || '';
    sub.country         = searchObject.getFieldText(this.FIELDS.COUNTRY) || '';
    sub.countryCode     = searchObject.getFieldValue(this.FIELDS.COUNTRY) || '';
    if (this.isMulticurrency) {
        sub.currency       = searchObject.getFieldValue(this.FIELDS.CURRENCY) || '';
    }
    if (this.isMultipleCalendar) {
        sub.fiscalCalendar = searchObject.getFieldValue(this.FIELDS.CALENDAR) || '';
    }
    return sub;
};
