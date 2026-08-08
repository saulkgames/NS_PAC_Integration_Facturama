/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 */
//ResourceMgr is designed to work on server side and client side scripts.
//Be mindful of this when adding new functionality or maintaining code.
function ResourceMgr(cultureId) {
    //Dependencies: none
    var _ResourceSet = null;
    this.GetString = _GetString;

    (function _constructor(cultureId) {
        _ResourceSet = _LoadResourceSet(cultureId === undefined ? "en" : cultureId);
    }(cultureId));

    function _LoadResourceSet(cultureId) {
        if (cultureId == null || cultureId === "") {
            throw new Error(0, "ResourceMgr::_LoadResourceSet(): Cannot Load empty or null culture Id.");
        }
        var cid = cultureId.toLowerCase();
        var allRS = _GetAvailableResourceSets();
        if (allRS[cid] !== undefined) {
            return allRS[cid];
        }
        var language = cid.split("_")[0];
        if (allRS[language] !== undefined) {
            return allRS[language];
        }
        return allRS["en"];
    }

    function _GetAvailableResourceSets() {
        if (_GetAvailableResourceSets.Cache == null) {
            _GetAvailableResourceSets.Cache = {};
            (function (cache)  //Scan global namespace
            {
                for (var x in this)  //"this" refers to global object in an anonymous function
                {
                    try {
                        if (this[x] != null &&
                            typeof (this[x]) != "boolean" && typeof (this[x]) != "string" && typeof (this[x]) != "number" &&  //not primitive type?
                            typeof (this[x].Culture) == "string") // Changed checking from using "in" operator because IE passes other data with "unknown" type)
                        {
                            cache[this[x].Culture.toLowerCase()] = this[x];
                        }
                    } catch (e) {
                        nlapiLogExecution('ERROR', e.message, "Failed to access property '" + x + "'");
                    }
                }
            }(_GetAvailableResourceSets.Cache));
        }
        return _GetAvailableResourceSets.Cache;
    }

    _GetAvailableResourceSets.Cache = null;

    function _GetString(key, bindValues) {
        if (_ResourceSet != null && _ResourceSet.Strings[key] !== undefined) {
            return bindValues === undefined ? _ResourceSet.Strings[key] : _BindString(_ResourceSet.Strings[key], bindValues);
        }
        return "{" + key + "}";
    }

    function _BindString(str, values) {
        if (str == null) {
            return str;
        }
        if (values == null) {
            return str;
        }
        var bindStr = str;
        for (var m in values) {
            bindStr = bindStr.replace(new RegExp("\\{" + m + "\\}", "g"), values[m]);
        }
        return bindStr;
    }
}