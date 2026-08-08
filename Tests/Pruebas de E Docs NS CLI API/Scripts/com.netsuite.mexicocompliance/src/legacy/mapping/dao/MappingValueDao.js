/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};

TAF.MappingValueDao = function _MappingValueDao() {
	this.getList = _GetList;
	this.getDefaultValue = _GetDefaultValue;
	this.convertRowToObject = _ConvertRowToObject;

	this.RECORD_NAME = 'customrecord_mx_mapper_values';
	this.FIELDS = {
        NAME            : 'name',
        CATEGORY        : 'custrecord_mx_mapper_value_category',
        INREPORT        : 'custrecord_mx_mapper_value_inreport',
        ISDEFAULT       : 'custrecord_mx_mapper_value_isdefault'
	};

	this.MAX_RESULTS = 1000; 

	function _GetList(filters) {
		var result = {};
		try {
			var nlColumns = [
				new nlobjSearchColumn(this.FIELDS.NAME),
				new nlobjSearchColumn(this.FIELDS.CATEGORY),
				new nlobjSearchColumn(this.FIELDS.INREPORT),
				new nlobjSearchColumn(this.FIELDS.ISDEFAULT)
			];

			var nlFilters = [];

			for (var key in filters) {
				var filter = filters[key];

				if (filter.length < 2 ||
					filter[0] === undefined ||
					filter[1] === undefined) {
					throw nlapiCreateError('INVALID_PARAMETER',
						'filters[\'' + key + '\']' +
						' is not an array or has less than 2 entries');
				}
				nlFilters.push(new nlobjSearchFilter(key, null, filter[0], filter[1]));
			}

			var search = nlapiCreateSearch(this.RECORD_NAME, nlFilters, nlColumns);
			var resultSet = search.runSearch();
			var index = 0;

			do {
				var mapper_values = resultSet.getResults(index, index + this.MAX_RESULTS);
				var mapper_value;

				for (var i = 0; mapper_values && i < mapper_values.length; i++) {
					mapper_value = mapper_values[i];
					
					result[mapper_value.getId()] = this.convertRowToObject(mapper_value);
				}

				index += this.MAX_RESULTS;
			} while (mapper_values && mapper_values.length >= this.MAX_RESULTS);
		} catch (ex) {
			var errorMsg = ex.getCode ? ex.getCode() + ': ' + ex.getDetails() : 'Error: ' + (ex.message ? ex.message : ex);
			nlapiLogExecution('ERROR', 'TAF.DAO.MappingValueDao.GetList', errorMsg);
		}

		return result;
	}

	function _GetDefaultValue(category) {
		var nlColumns = [
			new nlobjSearchColumn(this.FIELDS.NAME),
			new nlobjSearchColumn(this.FIELDS.CATEGORY),
			new nlobjSearchColumn(this.FIELDS.INREPORT),
			new nlobjSearchColumn(this.FIELDS.ISDEFAULT)
		];

		var nlFilter = [
			new nlobjSearchFilter(this.FIELDS.CATEGORY, null, 'anyof', category),
			new nlobjSearchFilter(this.FIELDS.ISDEFAULT, null, 'is', 'T')
		];
		var mapper_values = nlapiSearchRecord(this.RECORD_NAME, null, nlFilter, nlColumns);

		return mapper_values ? this.convertRowToObject(mapper_values[0]) : null;
	}

	function _ConvertRowToObject(row) {
		var obj = new TAF.DAO.MappingValue(row.getId());
		// todo: modify the account grouping name creation
		obj.name = row.getValue(this.FIELDS.NAME);
		obj.category = row.getValue(this.FIELDS.CATEGORY);
		obj.inreport = row.getValue(this.FIELDS.INREPORT);
		obj.isdefault = row.getValue(this.FIELDS.ISDEFAULT);
		return obj;
	}
};





TAF.DAO.MappingValueDao = TAF.MappingValueDao;