/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }

TAF.Subsidiary = function _Subsidiary(id) {
	
    this.id = id;
    this.name = null;
    var legalName = null;
    var federalIdNumber = null;
    var custRecCompanyUEN = null;
    var country = null;
    var currency = null;
    var countryCode = null;
    var currencyLocale = null;
    var accountingBookCurrency = null;
    var accountingBookCurrencyText = null;
    var fiscalCalendar = null;
    var taxonomyReference = null;
    var address1 = null;
    var address2 = null;
    var address3 = null;
    var city = null;
    var state = null;
    var zip = null;

    this.getId = function _GetId() { return this.id; };
    
    this.getName = function _GetName() { return this.name; };
    this.setName = function _SetName(value) { this.name = value; };
    
    this.getLegalName = function _GetLegalName() { return legalName; };
    this.setLegalName = function _SetLegalName(value) { legalName = value; };
    
    this.getFederalIdNumber = function _GetFederalIdNumber() { return federalIdNumber; };
    this.setFederalIdNumber = function _SetFederalIdNumber(value) { federalIdNumber = value; };
    
    this.getCountry = function _GetCountry() { return country; };
    this.setCountry = function _SetCountry(value) { country = value; };
    
    this.getCountryCode = function _GetCountryCode() { return countryCode; };
    this.setCountryCode = function _SetCountryCode(value) { countryCode = value; };
    
    this.getCurrency = function _GetCurrency() { return currency; };
    this.setCurrency = function _SetCurrency(value) { currency = value; };
    
    this.getCurrencyLocale = function _GetCurrencyLocale() { return currencyLocale; };
    this.setCurrencyLocale = function _SetCurrencyLocale(value) { currencyLocale = value; };

    this.getAccountingBookCurrency = function _GetAccountingBookCurrency() { return accountingBookCurrency; };
    this.setAccountingBookCurrency = function _SetAccountingBookCurrency(value) { accountingBookCurrency = value; };

    this.getAccountingBookCurrencyText = function _GetAccountingBookCurrencyText() { return accountingBookCurrencyText; };
    this.setAccountingBookCurrencyText = function _SetAccountingBookCurrencyText(value) { accountingBookCurrencyText = value; };
    
    this.getFiscalCalendar = function _GetFiscalCalendar() { return fiscalCalendar; };
    this.setFiscalCalendar = function _SetFiscalCalendar(value) { fiscalCalendar = value; };

    this.getAddress1 = function _GetAddress1() { return address1; };
    this.setAddress1 = function _SetAddress1(value) { address1 = value; };
    
    this.getAddress2 = function _GetAddress2() { return address2; };
    this.setAddress2 = function _SetAddress2(value) { address2 = value; };
    
    this.getAddress3 = function _GetAddress3() { return address3; };
    this.setAddress3 = function _SetAddress3(value) { address3 = value; };
    
    this.getCity = function _GetCity() { return city; };
    this.setCity = function _SetCity(value) { city = value; };
    
    this.getState = function _GetState() { return state; };
    this.setState = function _SetState(value) { state = value; };
    
    this.getZip = function _GetZip() { return zip; };
    this.setZip = function _SetZip(value) { zip = value; };
};

