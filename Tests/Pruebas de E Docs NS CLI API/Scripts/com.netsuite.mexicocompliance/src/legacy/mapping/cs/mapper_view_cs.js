/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

var TAF = TAF ||{};
TAF.Mapper = TAF.Mapper || {};
TAF.Mapper.ViewClient = TAF.Mapper.ViewClient || {}; 

TAF.Mapper.ViewClient.saveRecord = function _saveRecord() {
    var action = nlapiGetFieldValue(ELEMENT_NAME.ACTION);
    
    switch (action) {
        case ACTION.EDIT:
            nlapiSetFieldValue(ELEMENT_NAME.ACTION, ACTION.SAVE);
            break;
        default:
            nlapiSetFieldValue(ELEMENT_NAME.ACTION, ACTION.EDIT);
            break;
    }
    
    return true;
};

// Called whenever the Category has been successfully changed
// Called whenever the Sublist values has been changed
TAF.Mapper.ViewClient.fieldChanged = function _fieldChanged(type, name, linenum) {
    var filterList = JSON.parse(nlapiGetFieldValue(ELEMENT_NAME.UI_FILTERS) || '[]');
    
    if (name == ELEMENT_NAME.TO_ID) {
        // Update mappings hidden field
        var mappings = JSON.parse(nlapiGetFieldValue(ELEMENT_NAME.MAPPINGS) || '{}');
        var fromId = nlapiGetLineItemValue(ELEMENT_NAME.SUBLIST, ELEMENT_NAME.FROM_ID, linenum);
        
        mappings[fromId] = {
            id: nlapiGetLineItemValue(ELEMENT_NAME.SUBLIST, ELEMENT_NAME.MAP_ID, linenum),
            fromId: fromId,
            toId: nlapiGetLineItemValue(ELEMENT_NAME.SUBLIST, ELEMENT_NAME.TO_ID, linenum)
        };
        
        nlapiSetFieldValue(ELEMENT_NAME.MAPPINGS, JSON.stringify(mappings));
    } else if (name == ELEMENT_NAME.CATEGORY || (filterList.indexOf(name) > -1)) {
        var params = {};
        params[ELEMENT_NAME.CATEGORY] = nlapiGetFieldValue(ELEMENT_NAME.CATEGORY);
        params[ELEMENT_NAME.ACTION] = nlapiGetFieldValue(ELEMENT_NAME.ACTION);
        
        if (filterList.length > 0){
            for (var f = 0; f < filterList.length; f++){
                var filter = filterList[f];
                params[filter] = nlapiGetFieldValue(filter);
            }
        }
        
        TAF.Mapper.ViewClient.reloadPage(params);
    }
    
    return;
};


// Called whenever the Category is changed
// Not triggered when changing Sublist values
TAF.Mapper.ViewClient.validateField = function _validateField(type, name, linenum) {
    var filterList = JSON.parse(nlapiGetFieldValue(ELEMENT_NAME.UI_FILTERS) || '[]');
    
    if (name == ELEMENT_NAME.CATEGORY || filterList.indexOf(name) > -1) {
        return TAF.Mapper.ViewClient.displayConfirmationMessage();
    }
    
    return true;
};

TAF.Mapper.ViewClient.cancel = function cancel() {
    var result = TAF.Mapper.ViewClient.displayConfirmationMessage();
    if (!result) {
        return;
    }
    
    nlapiSetFieldValue(ELEMENT_NAME.ACTION, ACTION.VIEW);
    
    var params = {};
    params[ELEMENT_NAME.ACTION] = nlapiGetFieldValue(ELEMENT_NAME.ACTION);
    
    TAF.Mapper.ViewClient.reloadPage(params);
};


TAF.Mapper.ViewClient.displayConfirmationMessage = function _displayConfirmationMessage() {
    var result = true;
    var mappings = nlapiGetFieldValue(ELEMENT_NAME.MAPPINGS);
    
    if (mappings) {
        var context = nlapiGetContext();
        var resourceMgr = new ResourceMgr(context.getPreference('LANGUAGE'));
        result = confirm(resourceMgr.GetString('MAPPER_RELOAD_WARNING_MESSAGE'));
    }
    
    return result;
    
};

TAF.Mapper.ViewClient.reloadPage = function _reloadPage(params) {
    var url = nlapiGetFieldValue(ELEMENT_NAME.URL);
    
    for (var key in params) {
        var p = '&' + key + '=' + params[key];
        url += p;
    }
    
    setWindowChanged(window, false);
    window.location = url;
};



// as per NS 20.1 thre is no supported feature to assing a help center task ID to a
// suitelet. The one used is account dependant: EDIT_SCRIPTLET_{script-internal-id}_{deployment-id}
// so we override the definition of the help center function, which will be restored when the user
// navigates to another page and the page is reloaded 

TAF.Mapper.ViewClient.pageInit = function () {
    nlPopupHelp = ( function() {
	var oldHelp = nlPopupHelp;
	return function() {
	    oldHelp('MX_FIELD_MAPPING')
	}
    })();
}

