/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

if (!TAF) {
	var TAF = {};
}

TAF.Mapper = TAF.Mapper || {};
TAF.Mapper.View = function _View () {};

TAF.Mapper.View.prototype.getForm = function _getForm (dataView) {
	var resourceMgr = new ResourceMgr(dataView.languageId);
	var form = nlapiCreateForm(resourceMgr.GetString('MAPPER_FORM_TITLE'));

	form.setScript(CLIENT_SCRIPT.NAME);
	form = this.addHelp(dataView, resourceMgr, form);
	form = this.addMessage(dataView, resourceMgr, form);
	form = this.addButtons(dataView, resourceMgr, form);
	form = this.addCategoryComboBox(dataView, resourceMgr, form);
	form = this.addFilterComboBox(dataView, resourceMgr, form);
	form = this.addSubList(dataView, resourceMgr, form);
	form = this.addHiddenFields(dataView, form);

	return form;
};



TAF.Mapper.View.prototype.getHelpContent = function _getHelpContent (resourceMgr, isViewOnly) {
	var html = [];
	return html.join('');
};

TAF.Mapper.View.prototype.addHelp = function _addHelp (dataView, resourceMgr, form) {
	if (dataView && resourceMgr) {
		var helpContent = this.getHelpContent(resourceMgr, dataView.mode == ACTION.VIEWONLY);
		var helpField = form.addField('help', 'help', helpContent);
		helpField.setDisplayType('normal');
		helpField.setLayoutType('outsidebelow', 'startrow');
	}

	return form;
};



TAF.Mapper.View.prototype.addMessage = function _addMessage (dataView, resourceMgr, form) {
	if ((!dataView) ||
		(!dataView.message) ||
		(!dataView.message.priority) ||
		(!dataView.message.messageHeaderId) ||
		(!dataView.message.messageId)) {
		return form;
	}

	var priority = 'NLAlertDialog.TYPE_' + dataView.message.priority + '_PRIORITY';
	var message = [
		'<div id=\'div_message\'/><script>showAlertBox(\'div_message\'',
		'\'' + resourceMgr.GetString(dataView.message.messageHeaderId) + '\'',
		'\'' + resourceMgr.GetString(dataView.message.messageId) + '\'',
		priority,
		'\'' + MESSAGE_SIZE + '\', \'\', \'\', false);</script>',
	].join(',');

	var messageBox = form.addField(ELEMENT_NAME.MESSAGE, 'inlinehtml');

	messageBox.setDefaultValue(message);
	messageBox.setDisplayType('normal');
	messageBox.setLayoutType('outsideabove', 'startrow');

	return form;
};



TAF.Mapper.View.prototype.addButtons = function _addButtons (dataView, resourceMgr, form) {
	if (!dataView || !dataView.mode) {
		return form;
	}

	if (dataView.mode == ACTION.EDIT) {
		form.addSubmitButton();
		form.addButton(ELEMENT_NAME.CANCEL, resourceMgr.GetString('MAPPER_CANCEL_BUTTON'), CLIENT_SCRIPT.CANCEL_HANDLER);
	} else if (dataView.mode == ACTION.VIEW) {
		form.addSubmitButton(resourceMgr.GetString('MAPPER_EDIT_BUTTON'));
	}

	return form;
};



TAF.Mapper.View.prototype.addCategoryComboBox = function _addCategoryComboBox (dataView, resourceMgr, form) {
	if (!dataView || !dataView.mappingCategories) {
		return form;
	}

	var params = {
		elementName: ELEMENT_NAME.CATEGORY,
		uiLabel: 'MAPPER_CATEGORY_LABEL',
		lov: dataView.mappingCategories,
		resourceMgr: resourceMgr,
		form: form,
	};

	return this.addComboBox(params);
};



TAF.Mapper.View.prototype.addSubList = function _addSubList (dataView, resourceMgr, form) {
	if (!dataView || !dataView.columnHeader || !dataView.mappings) {
		return form;
	}

	var sublist = form.addSubList(ELEMENT_NAME.SUBLIST, 'list', resourceMgr.GetString('MAPPER_SUBLIST_NAME'));

	// Add the columns
	sublist.addField(ELEMENT_NAME.MAP_ID, 'text', LABEL.MAP_ID).setDisplayType('hidden');

	sublist.addField(ELEMENT_NAME.FROM_ID, 'text', LABEL.FROM_ID).setDisplayType('hidden');

	sublist.addField(ELEMENT_NAME.FROM, 'text', resourceMgr.GetString(dataView.columnHeader)).setDisplayType('readonly');

	this.addSubListValueColumn(dataView, resourceMgr, sublist);

	this.populateSubList(dataView, sublist);

	return form;
};

TAF.Mapper.View.prototype.addSubListValueColumn = function _addSubListValueColumn (dataView, resourceMgr, sublist) {
	if (!dataView || !dataView.mode || !dataView.mappingValues) {
		return sublist;
	}

	var valuesLabel = resourceMgr.GetString('MAPPER_TO_LABEL');

	if (dataView.mode == ACTION.EDIT) {
		if (Object.keys(dataView.mappingValues).length > 0) {
			this.addSubListComboBox(dataView.mappingValues, sublist, valuesLabel);
		} else {
			this.addInputText(dataView.mappingValues, sublist, valuesLabel);
		}
	} else {
		this.addSubListText(sublist, valuesLabel);
	}
};

TAF.Mapper.View.prototype.addInputText = function _addInputText (valueList, sublist, label) {
	var inputText = sublist.addField(ELEMENT_NAME.TO_ID, 'textarea', label);
	inputText.setDisplayType('entry');
	inputText.setDisplaySize(60, 1);
};

TAF.Mapper.View.prototype.addSubListComboBox = function _addSubListComboBox (valueList, sublist, label) {
	if (!valueList || !label) {
		return sublist;
	}

	var comboBox = sublist.addField(ELEMENT_NAME.TO_ID, 'select', label).setDisplayType('entry');

	comboBox.setDisplaySize(300);
	comboBox.addSelectOption('', '');

	var sortedValue = this.sortObjectByField(valueList, 'value');

	for (var j = 0; j < sortedValue.length; ++j) {
		var data = sortedValue[j];
		comboBox.addSelectOption(data.id, data.name);
	}
};



TAF.Mapper.View.prototype.sortObjectByField = function _sortObjectByField (unsortedObj, sortedBy) {
	if (!unsortedObj || !sortedBy) {
		return [];
	}

	var sortable = [];
	var isStringSort = null;
	for ( var sorted in unsortedObj) {
		sortable.push(unsortedObj[sorted]);
		isStringSort = isStringSort || isNaN(unsortedObj[sorted][sortedBy]);
	}

	if (isStringSort) {
		sortable.sort(function (a, b) {
	    var nameA = a[sortedBy];
	    var nameB = b[sortedBy];
	    if(!nameA){
				return nameB ? -1: 0;
	    }

	    return nameA.localeCompare(nameB);
		});
	} else {
		sortable.sort(function (a, b) {
	    return a[sortedBy] - b[sortedBy];
		});
	}

	return sortable;
};



TAF.Mapper.View.prototype.addSubListText = function _addSubListText (sublist, label) {
	sublist.addField(ELEMENT_NAME.TO, 'text', label).setDisplayType('readonly');
};



TAF.Mapper.View.prototype.populateSubList = function _populateSubList (dataView, sublist) {
	if (!dataView || !dataView.mappings || !dataView.mode) {
		return sublist;
	}

	var lines = [];

	for (var id in dataView.mappings) {
		var map = dataView.mappings[id];
		var line = {};
		line[ELEMENT_NAME.MAP_ID] = map.id;
		line[ELEMENT_NAME.FROM] = map.from;
		line[ELEMENT_NAME.FROM_ID] = map.fromId;

		if (dataView.mode == ACTION.EDIT) {
			line[ELEMENT_NAME.TO_ID] = map.toId;
		} else {
			line[ELEMENT_NAME.TO] = map.toDesc;
		}

		lines.push(line);
	}

	sublist.setLineItemValues(lines);
};



TAF.Mapper.View.prototype.addHiddenFields = function _addHiddenFields (dataView, form) {
	if (!dataView || !dataView.mode || !dataView.uiFilters) {
		return form;
	}

	var url = nlapiResolveURL('SUITELET', SUITELET.NAME, SUITELET.DEPLOYMENT);

	form.addField(ELEMENT_NAME.URL, 'text', LABEL.URL).setDisplayType('hidden').setDefaultValue(url);

	form.addField(ELEMENT_NAME.MAPPINGS, 'longtext', LABEL.MAPPINGS).setDisplayType('hidden');

	form.addField(ELEMENT_NAME.ACTION, 'text', LABEL.ACTION).setDisplayType('hidden').setDefaultValue(dataView.mode);

	form.addField(ELEMENT_NAME.UI_FILTERS, 'longtext', LABEL.UI_FILTERS).setDisplayType('hidden').setDefaultValue(dataView.uiFilters);

	return form;
};

TAF.Mapper.View.prototype.addFilterComboBox = function _addFilterComboBox (dataView, resourceMgr, form) {
	if (!dataView || !dataView.mappingFilters) {
		return form;
	}

	for (var f in dataView.mappingFilters) {
		var params = {
			elementName: 'custpage_' + dataView.mappingFilters[f].name.toLowerCase(),
			uiLabel: dataView.mappingFilters[f].label,
			lov: dataView.mappingFilters[f].lov,
			resourceMgr: resourceMgr,
			form: form,
		};
		this.addComboBox(params);
	}

	return form;
};

TAF.Mapper.View.prototype.addComboBox = function _addCategoryComboBox (params) {
	var comboBox = params.form.addField(params.elementName, 'select', params.resourceMgr.GetString(params.uiLabel));

	for (var id in params.lov) {
		var value = params.lov[id];
		comboBox.addSelectOption(id, value.name, value.isSelected || false);
	}

    var helpText = ''
    switch(params.elementName){
        case 'custpage_category': helpText =  params.resourceMgr.GetString('CUSTPAGE_CATEGORY_FIELD_HELP');
            break;
        case 'custpage_account_type': helpText = params.resourceMgr.GetString('CUSTPAGE_ACCOUNT_TYPE_FIELD_HELP');
            break;
        case 'custpage_subsidiary': helpText = params.resourceMgr.GetString('CUSTPAGE_SUBSIDIARY_FIELD_HELP');
            break;
	    case 'custpage_units_of_measure': helpText = params.resourceMgr.GetString('CUSTPAGE_UNITS_OF_MEASURE_FIELD_HELP');
		    break;
        default : helpText = "";
    }
    comboBox.setHelpText(helpText, true);

	return params.form;
};