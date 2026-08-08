/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) { var TAF = {}; }
TAF.DAO = TAF.DAO || {};

TAF.DAO.UnitTypeDao = function _UnitTypeDao () {
	this.getList = _GetList;
	this.convertRowToObject = _ConvertRowToObject;

	this.RECORD_NAME = 'unitstype';
	this.SUBRECORD_NAME = 'uom' //Subrecord of MeasureType record, which holds individual Unit Types
	this.FIELDS = {
		MEASURE_TYPE_NAME : 'name',
		UNIT_TYPE_NAME : 'unitname',
		UNIT_TYPE_ID : 'internalid',
	};
	this.MAX_RESULTS = 1000;

	function _GetList (filters) {
		var result = {};

		try {
			var nlColumns = [
				new nlobjSearchColumn(this.FIELDS.MEASURE_TYPE_NAME),
			];

			var nlFilters = [];

			//Validate filters and put them to 'nlFilters'
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
					var subrecords = this.convertRowToObject(mapper_values[i]);
					// Merge new UnitTypes into result map
					Object.keys(subrecords).forEach(function(key) { result[key] = subrecords[key]; });
				}

				index += this.MAX_RESULTS;
			} while (mapper_values && mapper_values.length >= this.MAX_RESULTS);
		} catch (ex) {
			var errorMsg = ex.getCode ? ex.getCode() + ': ' + ex.getDetails() : 'Error: ' + (ex.message ? ex.message : ex);
			nlapiLogExecution('ERROR', 'TAF.DAO.UnitTypeDao.GetList', errorMsg);
		}

		return result;
	}

	/**
	 *
	 * @param row - search result which represents Measure Type (e.q. length, weight, etc)
	 * @returns {Map} - Map of Unit Types belonging to given Measure Type (e.q. kilometers, meters, etc.).
	 * Keys are in the format: <MeasureTypeId><Delimiter><SubrecordId>
	 * @private
	 */
	function _ConvertRowToObject (row) {
		var record = nlapiLoadRecord(this.RECORD_NAME, row.getId())
		var lines = record.getLineItemCount(this.SUBRECORD_NAME)

		var results = {}

		for (var line = 1; line < lines+1; line++){
			var subKey = record.getLineItemValue(this.SUBRECORD_NAME, this.FIELDS.UNIT_TYPE_ID, line)
			var subrecordName = record.getLineItemValue(this.SUBRECORD_NAME, this.FIELDS.UNIT_TYPE_NAME, line)

			var subrecord = new TAF.DAO.UnitType(
				this.RECORD_NAME,
				row.getId(),
				this.SUBRECORD_NAME,
				subKey,
				subrecordName
			);

			var extendedId = TAF.DAO.Mapping.getMappingIndex(subrecord);
			results[extendedId] = subrecord
		}

		return results
	}
};
