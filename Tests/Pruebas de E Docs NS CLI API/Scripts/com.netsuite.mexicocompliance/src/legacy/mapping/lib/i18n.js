/**
 * Copyright 2014 NetSuite Inc.  User may not copy, modify, distribute, or re-bundle or otherwise make available this code.
 */

//ResourceMgr is designed to work on server side and client side scripts.
//Be mindful of this when adding new functionality or maintaining code.
function ResourceMgr(cultureId)
{
    //Dependencies: none

    var _ResourceSet = null;
    
    this.GetString = _GetString;
    
    
    
    
    
    (function _constructor(cultureId)
    {
        _ResourceSet = _LoadResourceSet(cultureId === undefined? "en": cultureId);

    } (cultureId));





    function _LoadResourceSet(cultureId)
    {
        if (cultureId == null || cultureId === "")
        {
            throw new Error(0, "ResourceMgr::_LoadResourceSet(): Cannot Load empty or null culture Id.");
        }

        var cid = cultureId.toLowerCase();
        var allRS = _GetAvailableResourceSets();

        if (allRS[cid] !== undefined)
        {
            return allRS[cid];
        }

        var language = cid.split("_")[0];
        if (allRS[language] !== undefined)
        {
            return allRS[language];
        }

        return allRS["en"];
    }





    function _GetAvailableResourceSets()
    {
        if (_GetAvailableResourceSets.Cache == null)
        {
            _GetAvailableResourceSets.Cache = {};
            
            for (var x in TAF.Translation) {
                _GetAvailableResourceSets.Cache[TAF.Translation[x].Culture.toLowerCase()] = TAF.Translation[x];
            }
        }

        return _GetAvailableResourceSets.Cache;
    }
    _GetAvailableResourceSets.Cache = null;





    function _GetString(key, bindValues)
    {
        if (_ResourceSet != null && _ResourceSet.Strings[key] !== undefined)
        {
            return bindValues === undefined ? _ResourceSet.Strings[key] : _BindString(_ResourceSet.Strings[key], bindValues);
        }

        return "{" + key + "}";
    }





    function _BindString(str, values)
    {
        if (str == null)
        {
            return str;
        }

        if (values == null)
        {
            return str;
        }


        var bindStr = str;

        for (var m in values)
        {
            bindStr = bindStr.replace(new RegExp("\\{" + m + "\\}", "g"), values[m]);
        }

        return bindStr;
    }
}