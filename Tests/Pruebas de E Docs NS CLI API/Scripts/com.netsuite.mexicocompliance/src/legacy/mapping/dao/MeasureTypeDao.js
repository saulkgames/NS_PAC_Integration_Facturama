/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};

TAF.DAO.MeasureTypeDao = function _UnitTypeDao () {
	this.getList = _GetList;
	this.convertRowToObject = _ConvertRowToObject;

	this.RECORD_NAME = 'unitstype';
	this.FIELDS = {
		MEASURE_TYPE_NAME : 'name'
	};
	this.MAX_RESULTS = 1000;

	function _GetList (filters) {
		var result = {};
		try {
			var nlColumns = [
				new nlobjSearchColumn(this.FIELDS.MEASURE_TYPE_NAME),
				// new nlobjSearchColumn(this.FIELDS.UNIT_NAME),
			];

			var nlFilters = [];

			for (var key in filters) {
				var filter = filters[key];
				if (filter.length < 2 || filter[0] === undefined || filter[1] === undefined) {
					throw nlapiCreateError(
						'INVALID_PARAMETER',
						'filters[\'' + key+ '\']' +
            ' is not an array or has less than 2 entries'
					);
				}
				var filterValue = TAF.DAO.Mapping.getKeyOrRawValue(filter[1])
				nlFilters.push(new nlobjSearchFilter(key, null, filter[0], filterValue));
			}

			var search = nlapiCreateSearch(this.RECORD_NAME, nlFilters, nlColumns);
			var resultSet = search.runSearch();
			var index = 0;

			do {
				var mapper_values = resultSet.getResults(index, index + this.MAX_RESULTS);
				for (var i = 0; mapper_values && i < mapper_values.length; i++) {
					var measureType = this.convertRowToObject(mapper_values[i])
					result[TAF.DAO.Mapping.getMappingIndex(measureType)] = measureType;
				}

				index += this.MAX_RESULTS;
			} while (mapper_values && mapper_values.length >= this.MAX_RESULTS);
		} catch (ex) {
			var errorMsg = ex.getCode ? ex.getCode() + ': ' + ex.getDetails() : 'Error: ' + (ex.message ? ex.message : ex);
			nlapiLogExecution('ERROR', 'TAF.DAO.UnitTypeDao.GetList', errorMsg);
		}

		return result;
	}

	function _ConvertRowToObject (row) {
		return new TAF.DAO.MeasureType(
			row.getId(),
			row.getValue(this.FIELDS.MEASURE_TYPE_NAME),
			this.RECORD_NAME
		);
	}
};
