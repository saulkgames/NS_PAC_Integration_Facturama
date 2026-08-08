/* istanbul ignore next */
define(
	['N/search', 'N/record', 'N/error'],

	function (search, record, error) {


		var model = function () {
			this.recordName = '';

			this.searchFrom = 0;
			this.searchCount = 1000;

			this.shouldIgnoreMandatoryFields = false;

			this.error = error;
			this.record = record;
			this.search = search;

			this.columns = {};
		};

		model.prototype._search = function (input) {

			if (!this.recordName) {
				throw this.error.create({
					name: 'RECORDNAME_MISSING',
					message: 'Recordname is missing',
				});
			}

			var search = this.search.create({
				type: this.recordName,
				columns: input.columns,
				filters: input.filters,
			});


			var searchResult = search.run().getRange({
				start: input.searchFrom,
				end: input.searchFrom + input.searchCount,
			});

			return searchResult;
		};

		model.prototype._searchPaged = function (input) {

			if (!this.recordName) {
				throw this.error.create({
					name: 'RECORDNAME_MISSING',
					message: 'Recordname is missing',
				});
			}

			var search = this.search.create({
				type: this.recordName,
				columns: input.columns,
				filters: input.filters,
			});


			var searchResult = search.runPaged({
				pageSize: 1000,
			});

			if (searchResult.length === 0) {
				return false;
			}

			var result = [];

			for (var key in searchResult.pageRanges) {

				var index = searchResult.pageRanges[key].index;
				var fetch = searchResult.fetch({
					index: index,
				});
				var page = fetch.data;
				for (var pagekey in page) {
					result = result.concat(page[pagekey]);
				}
			}

			return result;
		};

		model.prototype.lookupDynamic = function (input) {
			var columns = [];
			var id = input.id;

			for (var key in input.columns) {
				var column = input.columns[key];
				var colname = (typeof column == 'string') ? column : column.name;

				if (this.columns[colname]) {

					columns.push(this.columns[colname]);
				}
			}


			var lookupData = this.search.lookupFields({
				type: this.recordName,
				columns: columns,
				id: id,
			});

			var output = {};

			for (var colkey in this.columns) {
				error;
				if (lookupData[this.columns[colkey]]) {
					output[colkey] = lookupData[this.columns[colkey]];
				}
			}

			return output;
		};

		model.prototype.findDynamic = function (input) {
			var result;

			// optional params (paging override)
			var searchFrom = input.searchFrom ? input.searchFrom : this.searchFrom;
			var searchCount = input.searchCount !== undefined ? input.searchCount : this.searchCount;

			var columns = [];
			var filters = [];

			if (input.filters && input.filters.length > 0) {
				filters.push(input.filters);
			}

			for (var key in input.columns) {
				var column = input.columns[key];
				var colname = (typeof column == 'string') ? column : column.name;

				if (this.columns[colname]) {
					columns.push(this.columns[colname]);
				}
			}

			for (var key in input.order) {
				var ordcol = input.order[key];
				if (this.columns[ordcol.name]) {
					var sort;
					switch (ordcol.sort) {
						case 'desc' :
							sort = this.search.Sort.DESC;
							break;

						case 'asc' :
						default :
							sort = this.search.Sort.ASC;
							break;
					}

					var column = {
						name: this.columns[ordcol.name],
						sort: sort,
					};

					columns.push(column);
				}
			}

			var search = [];
			if (searchCount === 0 || searchCount > 1000) {
				search = this._searchPaged({
					filters: filters,
					columns: columns,
				});
			} else {
				search = this._search({
					filters: filters,
					columns: columns,
					searchFrom: searchFrom,
					searchCount: searchCount,
				});
			}

			result = this._format({
				search: search,
				columns: input.columns,
			});

			return result;
		};

		model.prototype._format = function (input) {
			var results = [];

			if (input.search.length > 0) {
				for (var key in input.search) {

					var line = {};
					var searchresult = input.search[key];

					for (var colkey in input.columns) {
						var column = input.columns[colkey];
						var colname = (typeof column == 'string') ? column : column.name;

						if (this.columns[colname]) {

							var columnArr = this.columns[colname].split('.');

							var result = '';


							var resultFunction = 'getValue';
							if (typeof column == 'object' && column.gettext) {
								resultFunction = 'getText';
							}


							if (columnArr.length === 1) {
								result = searchresult[resultFunction](columnArr[0]);
							}
							else {
								result = searchresult[resultFunction]({
									name: columnArr[1],
									join: columnArr[0],
								});
							}

							if ((typeof column == 'object') && column.callback && (typeof column.callback == 'function')) {
								result = column.callback(result);
							}

							line[colname] = result;
						}
					}

					results.push(line);
				}
			}

			return results;
		};

		model.prototype.save = function (object) {
			var internalid;
			if (object.id) {
				internalid = this._update(object);
			} else {
				internalid = this._create(object);
			}

			return internalid;
		};

		model.prototype.delete = function (input) {
			this.record.delete({
				type: this.recordName,
				id: input.id,
			});
		};

		model.prototype._update = function (object) {
			var record = this.record.load({
				type: this.recordName,
				id: object.id,
			});

			this._setRecordValues({
				record: record,
				object: object,
			});

			var internalid = record.save({
				ignoreMandatoryFields: this.shouldIgnoreMandatoryFields,
			});
			return internalid;
		};

		model.prototype._create = function (object) {
			var record = this.record.create({
				type: this.recordName,
			});

			this._setRecordValues({
				record: record,
				object: object,
			});

			var internalid = record.save({
				ignoreMandatoryFields: this.shouldIgnoreMandatoryFields,
			});
			return internalid;
		};

		model.prototype._setRecordValues = function (input) {
			for (var key in input.object) {
				if (this.columns[key] && this.columns[key] !== 'internalid') {
					input.record.setValue(this.columns[key], input.object[key]);
				}
			}
		};

		var functions = {
			extends: function (child, parent) {
				var helpClass = function () {
				};
				helpClass.prototype = parent.prototype;
				child.prototype = new helpClass();
				child._superClass = parent.prototype;
				child.prototype.constructor = child;
			},
		};

		return {
			model: model,
			extends: functions.extends,
		};

	}
);
