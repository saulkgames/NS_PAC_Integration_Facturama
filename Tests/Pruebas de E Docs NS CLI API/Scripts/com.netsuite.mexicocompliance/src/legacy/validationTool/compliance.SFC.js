var SFC = SFC || new (function __SFC()
{
    var _Scripting = new __Scripting();
    var _Utilities = new __Utilities();
    var _Context = new __Context();
    var _System = new __System();
    this.Scripting = _Scripting;
    this.Utilities = _Utilities;
    this.Context = _Context;
    this.System = _System;
    //=========================================================================

    function __Scripting()
    {
        var NS_CONTEXT = nlapiGetContext();
        var IS_ONEWORLD = NS_CONTEXT.getSetting("FEATURE", "SUBSIDIARIES") == "T";
        this.IsOneWorld = IS_ONEWORLD;
        this.Application = _Application;

        function _Application(appGuid, nsRequest)
        {
            var APP_GUID = appGuid;
            var NS_REQUEST = nsRequest;
            var _Params = _InitParams();
            this.Params = _Params;
            this.GetFileId = _GetFileId;
            this.GetFileContent = _GetFileContent;

            function _InitParams()
            {
                if (NS_REQUEST == null)
                {
                    return {};
                }
                var params = {};
                var allParams = NS_REQUEST.getAllParameters();
                for (var i in allParams)
                {
                    //nlapiLogExecution("DEBUG", i, allParams[i]);
                    params[i] = allParams[i];
                }
                return params;
            }

            function _GetAppFolderId()
            {
                if (_GetAppFolderId.FolderId == null)  //Lazy load folder id
                {
                    var filters = [
                    new nlobjSearchFilter("name", null, "is", APP_GUID)  //Find folder id using GUID file
                ];
                    var columns = [
                    new nlobjSearchColumn("folder")
                ];
                    var sr = nlapiSearchRecord("file", null, filters, columns);
                    _GetAppFolderId.FolderId = sr[0].getValue("folder");
                }
                return _GetAppFolderId.FolderId;
            };
            _GetAppFolderId.FolderId = null;

            function _GetFileId(fileName)
            {
                var filters = [  //Find file internalid using filename and folder id
                new nlobjSearchFilter("name", null, "is", fileName),
                new nlobjSearchFilter("folder", null, "is", _GetAppFolderId())
            ];
                var columns = null;
                var sr = nlapiSearchRecord("file", null, filters, columns);
                return sr == null ? null : rs[0].getId();
            }

            function _GetFileContent(fileName)
            {
                var fileId = _GetFileId(fileName);
                var file = nlapiLoadFile(fileId);
                return file.getValue();
            }

        }
    } //End of __Scripting

    //=========================================================================
    function __Utilities()
    {
        this.Tree = _Tree;
        this.TreeNode = _TreeNode;
        this.BitArray = _BitArray;

        function _TreeNode(id, obj)
        {
            var _Id = id;
            this.GetId = function _GetId() { return _Id == "_root_" ? null : _Id; }
            var _Object = obj;
            this.GetObject = function _GetObject() { return _Object; }
            this.SetObject = function _SetObject(value) { _Object = value; }
            var _Parent = null;
            this.GetParent = function _GetParent() { return _Parent; }
            this.SetParent = function _SetParent(value) { _Parent = value; }
            var _Children = {};
            this.GetChildren = _GetChildren;
            this.AddChild = _AddChild;
            this.RemoveChild = _RemoveChild;
            this.FindChild = _FindChild;
            this.Find = _Find;
            this.GetDescendants = _GetDescendants;

            function _AddChild(childNode)
            {
                if (_Children[childNode.GetId()] === undefined)
                {
                    _Children[childNode.GetId()] = childNode;
                }
            }

            function _RemoveChild(childNode)
            {
                if (_Children[childNode.GetId()] !== undefined)
                {
                    _Children[childNode.GetId()] = undefined;
                    delete _Children[childNode.GetId()];
                }
            }

            function _FindChild(childId)
            {
                return _Children[childId] === undefined ? null : _Children[childId];
            }

            function _Find(id)
            {
                if (_Id == id)
                {
                    return this;
                }
                for (var i in _Children)
                {
                    var n = _Children[i].Find(id);
                    if (n != null)
                    {
                        return n;
                    }
                }
                return null;
            }

            function _GetChildren()
            {
                var aChildren = [];
                for (var i in _Children)
                {
                    aChildren.push(_Children[i]);
                }
                return aChildren;
            }

            function _GetDescendants()
            {
                var descendants = [];
                for (var i in _Children)
                {
                    descendants.push(_Children[i]);
                    descendants = descendants.concat(_Children[i].GetDescendants());
                }
                return descendants;
            }

        }

        function _Tree()
        {
            var ROOT_ID = "_root_";
            var _Root = new _TreeNode(ROOT_ID, null);
            this.AddNode = _AddNode;
            this.FindNode = _FindNode;
            this.GetRootNode = _GetRootNode;
            function _AddNode(id, parentId, obj)
            {
                if (id == null)
                {
                    throw nlapiCreateError("Utilities.Tree: Node cannot have null Id");
                }
                var node = _Root.FindChild(id);  //node may have been added previously as parent node
                if (node == null)
                {
                    node = new _TreeNode(id, obj);
                }
                else
                {
                    node.SetObject(obj);
                    _Root.RemoveChild(node);
                }
                var parentNode = _Root.Find(parentId);
                if (parentNode == null)  //Child node created before parent node?
                {
                    parentNode = new _TreeNode(parentId, null);  //Create temporary node for parent and assign to _Root
                    _RelateNodes(parentNode, _Root);
                }
                _RelateNodes(node, parentNode);
                return node;
            }

            function _FindNode(id)
            {
                return _Root.Find(id);
            }

            function _GetRootNode()
            {
                return _Root;
            }

            function _RelateNodes(childNode, parentNode)
            {
                childNode.SetParent(parentNode);
                parentNode.AddChild(childNode);
            }

        }

        function _BitArray(length)  //length : The number of bit values.
        {
            var _BYTE_SIZE = 32;
            var _Bytes = [];
            var _BitCount = 0;  //The number of elements (bits) contained in the BitArray;
            this.Count = function() { return _BitCount; }
            this.Get = _Get;
            this.Set = _Set;
            (function _constructor(length)
            {
                if (length < 1)
                {
                    throw nlapiCreateError("_Utilities.BitArray", "_Utilities.BitArray: Count [" + length + "] out of range.");
                }
                //Allocate integers to contain bit count
                var x = Math.floor((length - 1) / _BYTE_SIZE);
                _Bytes = [];
                for (var i = 0; i <= x; ++i)
                {
                    _Bytes.push(0);
                }
                _BitCount = length;
            })(length);

            //Gets the value of the bit at a specifice position in the BitArray.
            // index : The zero based index of the value to get.
            function _Get(index)
            {
                if (index < 0 || index > _Bytes.length * _BYTE_SIZE)
                {
                    throw nlapiCreateError("_Utilities.BitArray", "_Utilities.BitArray: Index [" + index + "] out of range.");
                }
                var p = index % _BYTE_SIZE;
                var i = Math.floor(index / _BYTE_SIZE);
                return _Bytes[i] & Math.pow(2, p) ? true : false;
            }

            //Sets the bit at a specific position in the BitArray to the specified value.
            // index : The zero based index of the bit to set.
            // value : The boolean value to assign to the bit.
            function _Set(index, value)
            {
                if (index < 0 || index > _Bytes.length * _BYTE_SIZE)
                {
                    throw nlapiCreateError("_Utilities.BitArray", "_Utilities.BitArray: Index [" + index + "] out of range.");
                }
                var p = index % _BYTE_SIZE;
                var i = Math.floor(index / _BYTE_SIZE);
                _Bytes[i] = value ? (_Bytes[i] | Math.pow(2, p)) : (_Bytes[i] & ~Math.pow(2, p));
            }

        }  //End of _BitArray
    } //End of __Utilities

    //=========================================================================
    function __Context()
    {
        var _nlContext = null;  //Lazy load
        var _Cache = {};  //Cache all subsidiary records
        this.Company = new _CompanyMgr();
        this.IsAdvancedTax = function() { return _GetNLContext().getFeature("advtaxengine"); };
        this.GetRemainingUsage = function() { return _GetNLContext().getRemainingUsage(); };

        function _GetNLContext()
        {
            if (_nlContext == null)
            {
                _nlContext = nlapiGetContext();
            }
            return _nlContext;
        }

        function _CompanyMgr()
        {
            this.GetLegalName = function() { return nlapiLoadConfiguration("companyinformation").getFieldValue("legalname"); };
            this.GetCountryCode = function() { return nlapiLoadConfiguration("companyinformation").getFieldValue("country"); };
            this.GetName = _GetName;
            function _GetName(subId)
            {
                var name = "";
                if (_Scripting.IsOneWorld)
                {
                    if (subId == null)
                        return null;
                    var subsidiary = _System.Subsidiary(subId, false);
                    name = subsidiary.NameNoHeirarchy;
                    if (name == "Parent Company")
                        name = nlapiLoadConfiguration("companyinformation").getFieldValue("companyname");
                }
                else
                {
                    name = nlapiLoadConfiguration("companyinformation").getFieldValue("companyname");
                }
                return name == null ? "" : name;
            }
        }

    }  //End of __Context

    //=============================================================================
    function __System()
    {
        this.Subsidiary = _Subsidiary;
        this.Period = _Period;
        this.TaxCode = _TaxCode;
        this.Account = _Account;
        this.Triggers = _Triggers;
        this.SubsidiaryMgr = _SubsidiaryMgr;
        this.PeriodMgr = _PostingPeriodMgr;
        this.TaxPeriodMgr = _TaxPeriodMgr;
        this.TaxCodeMgr = _TaxCodeMgr;
        this.TransactionMgr = _TransactionMgr;
        this.AccountMgr = _AccountMgr;
        this.RegistryMgr = _BundleRegistry;

        function _Subsidiary()
        {
            var _Id = null;
            this.GetId = function() { return _Id };
            this.SetId = function(value) { _Id = value; };
            var _Name = null;
            this.GetName = function() { return _Name };
            this.SetName = function(value) { _Name = value == null ? "" : value; };
            var _CountryCode = null;
            this.GetCountryCode = function() { return _CountryCode };
            this.SetCountryCode = function(value) { _CountryCode = value == null ? "" : value; };
            var _VRN = null;
            this.GetVRN = function() { return _VRN };
            this.SetVRN = function(value) { _VRN = value == null ? "" : value; };
            var _LegalName = null;
            this.GetLegalName = function() { return _LegalName };
            this.SetLegalName = function(value) { _LegalName = value == null ? "" : value; };
            var _Address1 = null;
            this.GetAddress1 = function() { return _Address1; };
            this.SetAddress1 = function(value) { _Address1 = value == null ? "" : value; };
            var _Address2 = null;
            this.GetAddress2 = function() { return _Address2; };
            this.SetAddress2 = function(value) { _Address2 = value == null ? "" : value; };
            var _Address3 = null;
            this.GetAddress3 = function() { return _Address3; };
            this.SetAddress3 = function(value) { _Address3 = value == null ? "" : value; };
            var _PostalCode = null;
            this.GetPostalCode = function() { return _PostalCode; };
            this.SetPostalCode = function(value) { _PostalCode = value == null ? "" : value; };
            var _PhoneNumber = null;
            this.GetPhoneNumber = function() { return _PhoneNumber; };
            this.SetPhoneNumber = function(value) { _PhoneNumber = value == null ? "" : value; };
            var _FaxNumber = null;
            this.GetFaxNumber = function() { return _FaxNumber; };
            this.SetFaxNumber = function(value) { _FaxNumber = value == null ? "" : value; };
            var _Email = null;
            this.GetEmail = function() { return _Email; };
            this.SetEmail = function(value) { _Email = value == null ? "" : value; };
            var _Website = null;
            this.GetWebsite = function() { return _Website; };
            this.SetWebsite = function(value) { _Website = value == null ? "" : value; };
            var _State = null;
            this.GetState = function() { return _State; };
            this.SetState = function(value) { _State = value == null ? "" : value; };
            var _City = null;
            this.GetCity = function() { return _City; };
            this.SetCity = function(value) { _City = value == null ? "" : value; };
            var _CurrencyCode = null;
            this.GetCurrencyCode = function() { return _CurrencyCode; };
            this.SetCurrencyCode = function(value) { _CurrencyCode = value == null ? "" : value; };
            var _ParentId = null;
            this.SetParentId = function(value) { _ParentId = value; };
            this.GetParent = _GetParent;
            this.GetChildren = _GetChildren;
            this.GetDescendants = _GetDescendants;
            var _Rec = null;
            this.SetRecordSource = function(rec) { _Rec = rec; };
            this.GetFieldValue = function(fieldName) { return (_Rec == null) ? null : _Rec.getFieldValue(fieldName); };

            function _GetParent()
            {
                if (_ParentId == null)
                    return null;
                return _System.Subsidiaries.TryLoad(_ParentId);
            }

            function _GetChildren()
            {
                return _System.Subsidiaries.LoadChildrenOf(_Id);
            }

            function _GetDescendants()
            {
                return _System.Subsidiaries.LoadDescendantsOf(_Id);
            }

        }

        function _SubsidiaryMgr()
        {
            var _SubsCache = null;  //Cache all subsidiary records
            var _SubsByHierarchyName = {};  //Stores hierarchy info
            var _SubsRoot = null;
            this.TryLoad = _TryLoad;
            this.Load = _Load;
            this.LoadAll = _LoadAll;
            this.LoadRoot = function _LoadRoot() { _GetSubsCache(); return _SubsRoot; };
            this.LoadChildrenOf = _LoadChildrenOf;
            this.LoadDescendantsOf = _LoadDescendantsOf;

            function _GetSubsCache()
            {
                if (_SubsCache == null)
                {
                    _LoadAll();
                }
                return _SubsCache;
            }

            //Try to load subsidiary with given id.  If not found, or fails to load, return null.
            function _TryLoad(id)
            {
                if (!_Scripting.IsOneWorld)
                {
                    return null;
                }
                var cache = _GetSubsCache();
                return cache[id] == undefined ? null : cache[id];
            }

            //Load subsidiary with given id.  If does not exist, or fails to load, throw an error.
            function _Load(id)
            {
                var sub = _TryLoad(id);
                if (sub == null)
                {
                    throw nlapiCreateError("_System.Subsidiaries", "_System.Subsidiaries: Unable to load Id[" + id + "].");
                }
                return sub;
            }

            function _LoadAll()
            {
                _SubsCache = {};
                _SubsByHierarchyName = {};
                _SubsRoot = null;
                if (!_Scripting.IsOneWorld)
                {
                    return;
                }
                //Exclude inactive subsidiaries
                var filters = [
                    new nlobjSearchFilter("isinactive", null, "is", "F")
                ];
                var columns = [
                new nlobjSearchColumn("name"),
                new nlobjSearchColumn("namenohierarchy"),
                new nlobjSearchColumn("country"),
                new nlobjSearchColumn("legalname"),
                new nlobjSearchColumn("zip"),
                new nlobjSearchColumn("phone"),
                new nlobjSearchColumn("state"),
                new nlobjSearchColumn("city"),
                new nlobjSearchColumn("address1"),
                new nlobjSearchColumn("address2"),
                new nlobjSearchColumn("address3"),
                new nlobjSearchColumn("currency"),
                new nlobjSearchColumn("fax"),
                new nlobjSearchColumn("email"),
                new nlobjSearchColumn("url"),
                new nlobjSearchColumn("taxidnum")
            ];
                columns[0];  //It's essential to sort by hierarchical name
                var rs = nlapiSearchRecord("subsidiary", null, filters, columns);
                if (rs == null)
                {
                    return [];
                }
                for (var i = 0; i < rs.length; ++i)
                {
                    //Cache by Id
                    var objSub = _RowToObject(rs[i])
                    _SubsCache[rs[i].getId()] = objSub;
                    //Cache by hierarchical name
                    var hName = rs[i].getValue("name");
                    _SubsByHierarchyName[hName] = objSub;
                    //Set Root subsidiary
                    if (i == 0)
                    {
                        _SubsRoot = objSub;
                    }
                    //Relate child to parent and vice versa
                    var index = hName.lastIndexOf(" : ");
                    if (index != -1)  //is sub a child?
                    {
                        //Parent should have been created before any child since result is sorted by hierarchy name
                        var parentName = hName.substring(0, index);
                        var objParent = _SubsByHierarchyName[parentName] == null ? _SubsRoot : _SubsByHierarchyName[parentName];
                        objSub.SetParent(objParent);
                        objParent.AddChild(objSub);
                    }
                }
                return _SubsCache;
            }

            //Return an array of the immediate subsidiary children of the given sub id
            function _LoadChildrenOf(id)
            {
                var sub = _TryLoad(id);
                if (sub == null)
                {
                    return [];
                }
                return sub.GetChildren();
            }

            function _LoadDescendantsOf(id)
            {
                var sub = _TryLoad(id);
                if (sub == null)
                {
                    return [];
                }
                return sub.GetDescendants();
            }

            // No need to access "parent" to recreate hierarchy.  Use "name" (with hierarchy) instead
            function _RowToObject(row)
            {
                var sub = new _System.Subsidiary();
                sub.SetId(row.getId());
                sub.SetName(row.getValue("namenohierarchy"));
                sub.SetCountryCode(row.getValue("country"));
                sub.SetLegalName(row.getValue("legalname"));
                sub.SetPostalCode(row.getValue("zip"));
                sub.SetPhoneNumber(row.getValue("phone"));
                sub.SetState(row.getValue("state"));
                sub.SetCity(row.getValue("city"));
                sub.SetAddress1(row.getValue("address1"));
                sub.SetAddress2(row.getValue("address2"));
                sub.SetAddress3(row.getValue("address3"));
                sub.SetCurrencyCode(row.getText("currency"));  //getValue on currency returns internal id
                sub.SetFaxNumber(row.getValue("fax"));
                sub.SetEmail(row.getValue("email"));
                sub.SetWebsite(row.getValue("url"));
                sub.SetVRN(row.getValue("taxidnum"));
                return sub;
            }

        }

        function _Period()
        {
            var _Id = null;
            this.GetId = function() { return _Id; }
            this.SetId = function(value) { _Id = value; }
            var _Name = null;
            this.GetName = function() { return _Name; }
            this.SetName = function(value) { _Name = value; }
            var _StartDate = null;
            this.GetStartDate = function() { return _StartDate; }
            this.SetStartDate = function(value) { _StartDate = value; }
            var _EndDate = null;
            this.GetEndDate = function() { return _EndDate; }
            this.SetEndDate = function(value) { _EndDate = value; }
            var _Type = null;  //"year", "quarter", "month", "adjustment"
            this.GetType = function() { return _Type; }
            this.SetType = function(value) { _Type = value; }
            var _IsActive = null;
            this.IsActive = function() { return _IsActive; }
            this.SetActive = function(value) { _IsActive = value; }
            var _IsClosed = null;
            this.IsClosed = function() { return _IsClosed; }
            this.SetClosed = function(value) { _IsClosed = value; }
            var _ParentId = null;
            this.SetParentId = function(value) { _ParentId = value; };
            this.GetParent = _GetParent;
            this.GetChildren = _GetChildren;
            this.GetDescendants = _GetDescendants;

            function _GetParent()
            {
                if (_ParentId == null)
                    return null;
                return _TaxPeriodMgr.TryLoad(_ParentId);
            }

            function _GetChildren()
            {
                return _TaxPeriodMgr.LoadChildrenOf(_Id);
            }

            function _GetDescendants()
            {
                return _TaxPeriodMgr.LoadDescendantsOf(_Id);
            }

        }

        function _TaxPeriodMgr()
        {
            var _Cache = {};  //Cache all tax period records
            var _Tree = new _Utilities.Tree();  //Stores hierarchy info
            this.TryLoad = _TryLoad;
            this.Load = _Load;
            this.LoadAll = _LoadAll;
            this.LoadChildrenOf = _LoadChildrenOf;
            this.LoadDescendantsOf = _LoadDescendantsOf;

            function _GetSearchColumns()
            {
                return [
                    new nlobjSearchColumn("periodname"),
                    new nlobjSearchColumn("startdate"),
                    new nlobjSearchColumn("enddate"),
                    new nlobjSearchColumn("isinactive"),
                    new nlobjSearchColumn("allclosed"),
                    new nlobjSearchColumn("isadjust"),
                    new nlobjSearchColumn("isyear"),
                    new nlobjSearchColumn("isquarter"),
                    new nlobjSearchColumn("parent")
                ];
            }

            function _TryLoad(id)
            {
                if (_Cache[id] == undefined)
                {
                    var rec = null;
                    try
                    {
                        rec = nlapiLoadRecord("taxperiod", id);
                    }
                    catch (e)
                    {
                        return null;
                    }
                    _Cache[id] = _CreateInstanceFromRecord(rec);
                }
                return _Cache[id];
            }

            function _Load(id)
            {
                var sub = _TryLoad(id);
                if (sub == null)
                {
                    throw nlapiCreateError("_System.TaxPeriods", "_System.TaxPeriods: Unable to load Id[" + id + "].");
                }
                return sub;
            }

            function _LoadAll()
            {
                var filters = [new nlobjSearchFilter("isinactive", null, "is", "F")];  //Exclude inactive tax periods
                var rs = nlapiSearchRecord("taxperiod", null, filters, _GetSearchColumns());
                if (rs == null)
                {
                    return;
                }
                var all = [];
                for (var i = 0; i < rs.length; ++i)
                {
                    var id = rs[i].getId();
                    if (_Cache[id] == undefined)
                    {
                        _Cache[id] = _CreateInstanceFromSearchRow(rs[i]);
                    }
                    var parentId = parseInt(rs[i].getValue("parent"), 10);
                    _Tree.AddNode(id, (isNaN(parentId) ? null : parentId), _Cache[id]);
                    all.push(_Cache[id]);
                }
                return all;
            }

            function _LoadChildrenOf(id)
            {
                _LoadAll();
                var n = _Tree.FindNode(id);
                if (n == null)
                {
                    return [];
                }
                var children = [];
                var nodes = n.GetChildren();
                for (var i in nodes)
                {
                    children.push(nodes[i].GetObject());
                }
                return children;
            }

            function _LoadDescendantsOf(id)
            {
                _LoadAll();
                var n = _Tree.FindNode(id);
                if (n == null)
                {
                    return [];
                }
                var descendants = [];
                var nodes = n.GetDescendants();
                for (var i in nodes)
                {
                    descendants.push(nodes[i].GetObject());
                }
                return descendants;
            }

            function _CreateInstanceFromRecord(rec)
            {
                var instance = new _System.Period();
                instance.SetId(rec.getId());
                instance.SetName(rec.getFieldValue("periodname"));
                instance.SetStartDate(nlapiStringToDate(rec.getFieldValue("startdate")));
                instance.SetEndDate(nlapiStringToDate(rec.getFieldValue("enddate")));
                instance.SetActive(rec.getFieldValue("isinactive") != "T");
                instance.SetClosed(rec.getFieldValue("allclosed") == "T");
                instance.SetType(rec.getFieldValue("isadjust") == "T" ? "adjustment" : rec.getFieldValue("isyear") == "T" ? "year" : rec.getFieldValue("isquarter") == "T" ? "quarter" : "month");
                instance.SetParentId(rec.getFieldValue("parent"));
                return instance;
            }

            function _CreateInstanceFromSearchRow(row)
            {
                var instance = new _System.Period();
                instance.SetId(row.getId());
                instance.SetName(row.getValue("periodname"));
                instance.SetStartDate(nlapiStringToDate(row.getValue("startdate")));
                instance.SetEndDate(nlapiStringToDate(row.getValue("enddate")));
                instance.SetActive(row.getValue("isinactive") != "T");
                instance.SetClosed(row.getValue("allclosed") == "T");
                instance.SetType(row.getValue("isadjust") == "T" ? "adjustment" : row.getValue("isyear") == "T" ? "year" : row.getValue("isquarter") == "T" ? "quarter" : "month");
                instance.SetParentId(row.getValue("parent"));
                return instance;
            }

        }

        function _PostingPeriodMgr()
        {
            var _Cache = {};
            var _Tree = null;
            this.TryLoad = _TryLoad;
            this.Load = _Load;
            this.LoadAll = _LoadAll;
            this.GetRootPeriod = _GetRootPeriod;
            this.LoadChildrenOf = _LoadChildrenOf;
            this.LoadDescendantsOf = _LoadDescendantsOf;
            this.LoadCoveredPeriods = _LoadCoveredPeriods;
            this.GetCoveredPeriodIds = _GetCoveredPeriodIds;

            function _GetSearchColumns()
            {
                var columns = [
                    new nlobjSearchColumn("periodname"),
                    new nlobjSearchColumn("startdate"),
                    new nlobjSearchColumn("enddate"),
                    new nlobjSearchColumn("isinactive"),
                    new nlobjSearchColumn("isadjust"),
                    new nlobjSearchColumn("isyear"),
                    new nlobjSearchColumn("isquarter"),
                    new nlobjSearchColumn("parent")
                ];
                columns[1].setSort(true);
                return columns;
            }

            function _SearchPeriod(id)
            {
                var filters = [
                    new nlobjSearchFilter("internalid", null, "is", id)
                ];
                var sr = nlapiSearchRecord("accountingperiod", null, filters, _GetSearchColumns());
                if (sr == null)
                {
                    return null;
                }
                //For inactive periods, register in Cache but not in Tree
                _Cache[id] = _CreateInstanceFromSearchRow(sr[0]);
                return _Cache[id];
            }

            function _TryLoad(id)
            {
                //Should load any period by id even inactive ones
                //Refer to cache but don't _LoadAll if hasn't been called yet
                if (_Cache[id] !== undefined)
                {
                    return _Cache[id];
                }
                return _SearchPeriod(id);
            }

            function _Load(id)
            {
                var sub = _TryLoad(id);
                if (sub == null)
                {
                    throw nlapiCreateError("_System.PostingPeriods", "_System.PostingPeriods: Unable to load Id[" + id + "].");
                }
                return sub;
            }

            function _LoadAll() //PostingPeriodMgr
            {
                if (!_LoadAll.IsLoaded)
                {
                    _Tree = new _Utilities.Tree();
                    var filters = [
                        new nlobjSearchFilter("isinactive", null, "is", "F")  //Exclude inactive records
                    ];
                    //TODO: Load all periods using search object
                    var sr = nlapiSearchRecord("accountingperiod", null, filters, _GetSearchColumns());
                    if (sr == null)
                    {
                        return _Cache;
                    }
                    for (var i = 0; i < sr.length; ++i)
                    {
                        var id = sr[i].getId();
                        if (_Cache[id] === undefined)
                        {
                            _Cache[id] = _CreateInstanceFromSearchRow(sr[i]);
                        }
                        var parentId = parseInt(sr[i].getValue("parent"), 10);
                        _Tree.AddNode(id, isNaN(parentId) ? null : parentId, _Cache[id]);
                    }
                    _LoadAll.IsLoaded = true;
                }
                return _Cache;
            };
            _LoadAll.IsLoaded = false;

            function _LoadChildrenOf(id)
            {
                _LoadAll();  //Ensure tree is populated
                var n = _Tree.FindNode(id);
                if (n == null)
                {
                    return null;
                }
                var children = [];
                var nodes = n.GetChildren();
                for (var i in nodes)  //Convert to array
                {
                    children.push(nodes[i].GetObject());
                }
                return children;
            }

            function _LoadDescendantsOf(id)
            {
                _LoadAll();  //Ensure tree is populated
                var n = _Tree.FindNode(id);
                if (n == null)
                {
                    return null;
                }
                var descendants = [];
                var nodes = n.GetDescendants();
                for (var i in nodes)
                {
                    descendants.push(nodes[i].GetObject());
                }
                return descendants;
            }

            function _GetRootPeriod()
            {
                _LoadAll();
                return _Tree.GetRootNode();
            }

            function _GetCoveredPeriodIds(startPeriodId, endPeriodId)
            {
                var startPeriod = _Load(startPeriodId);
                var endPeriod = _Load(endPeriodId);
                var uniquePeriods = {};
                uniquePeriods[startPeriodId] = true;
                uniquePeriods[endPeriodId] = true;
                var filters = [
                    new nlobjSearchFilter("isinactive", null, "is", "F"),
                    new nlobjSearchFilter("startdate", null, "onorafter", startPeriod.GetStartDate()),
                    new nlobjSearchFilter("enddate", null, "onorbefore", endPeriod.GetEndDate())
                ];
                var columns = null;   //[new nlobjSearchColumn("startdate")];
                var sr = nlapiSearchRecord("accountingperiod", null, filters, columns);
                if (sr != null)
                {
                    for (var i = 0; i < sr.length; ++i)
                    {
                        uniquePeriods[sr[i].getId()] = true;
                    }
                }
                //Convert to array
                var ids = [];
                for (var j in uniquePeriods)
                {
                    ids.push(j);
                }
                ids.sort(function(lhs, rhs) { return (lhs - rhs); });
                return ids;
            }

            function _LoadCoveredPeriods(startPeriodId, endPeriodId)
            {
                var periods = [];
                var ids = _GetCoveredPeriodIds(startPeriodId, endPeriodId);
                for (var i = 0; i < ids.length; ++i)
                {
                    periods.push(_Load(ids[i]));
                }
                return periods;
            }

            function _CreateInstanceFromSearchRow(row)
            {
                var instance = new _System.Period();
                instance.SetId(row.getId());
                instance.SetName(row.getValue("periodname"));
                instance.SetStartDate(nlapiStringToDate(row.getValue("startdate")));
                instance.SetEndDate(nlapiStringToDate(row.getValue("enddate")));
                instance.SetActive(row.getValue("isinactive") != "T");
                instance.SetType(row.getValue("isadjust") == "T" ? "adjustment" : row.getValue("isyear") == "T" ? "year" : row.getValue("isquarter") == "T" ? "quarter" : "month");
                instance.SetParentId(row.getValue("parent"));
                return instance;
            }

        }

        function _TaxCode(rec)
        {
            var _BitMask = new _Utilities.BitArray(8);
            var _RecordObj = rec;
            this.GetFieldValue = function(fieldName) { return _RecordObj.getFieldValue(fieldName); };
            var _Id = null;
            this.GetId = function() { return _Id; };
            this.SetId = function(value) { _Id = value; };
            var _Name = null;
            this.GetName = function() { return _Name; };
            this.SetName = function(value) { _Name = (value == null) ? "" : value.toString(); };
            var _Description = "";
            this.GetDescription = function() { return _Description; };
            this.SetDescription = function(value) { _Description = (value == null) ? "" : value.toString(); };
            var _CountryCode = null;
            this.GetCountryCode = function() { return _CountryCode; };
            this.SetCountryCode = function(value) { _CountryCode = value; };
            var _Rate = null;
            this.GetRate = function() { return _Rate; };
            this.SetRate = function(value) { _Rate = value; };
            var _ParentId = null;
            var _Parent = undefined;  //Implement lazy loading of parent.  Load only when GetParent() or GetNotionalRate() is called.
            this.SetParentId = function(value) { if (value != _ParentId) { _ParentId = value; _Parent = undefined; } };
            this.GetParentId = function() { return _ParentId; };
            this.GetParent = function() { if (_ParentId != null && _Parent == undefined) { _Parent = _TryLoad(_ParentId); } return _Parent; };
            this.GetNotionalRate = function() { return (this.GetParent() == null) ? null : _Parent.GetRate(); };
            this.IsForSales = function() { return _BitMask.Get(0) };
            this.SetForSales = function(value) { _BitMask.Set(0, value); };
            this.IsForPurchase = function() { return _BitMask.Get(1) };
            this.SetForPurchase = function(value) { _BitMask.Set(1, value); };
            this.IsService = function() { return _BitMask.Get(2) };
            this.SetService = function(value) { _BitMask.Set(2, value); };
            this.IsExempt = function() { return _BitMask.Get(3) };
            this.SetExempt = function(value) { _BitMask.Set(3, value); };
            this.IsForExport = function() { return _BitMask.Get(4) };
            this.SetForExport = function(value) { _BitMask.Set(4, value); };
            this.IsExcluded = function() { return _BitMask.Get(5) };
            this.SetExcluded = function(value) { _BitMask.Set(5, value); };
            this.IsReverseCharge = function() { return _BitMask.Get(6) };
            this.SetReverseCharge = function(value) { _BitMask.Set(6, value); };
            this.IsEC = function() { return _BitMask.Get(7) };
            this.SetEC = function(value) { _BitMask.Set(7, value); };
        }

        function _TaxCodeMgr()
        {
            var _Cache = {};  //Cache all tax code records
            this.TryLoad = _TryLoad;
            this.Load = _Load;
            this.LoadAllByCountry = _LoadAllByCountry;
            this.Definitions = _Definitions;
            this.CreateInstanceFromRecord = _CreateInstanceFromRecord;

            function _TryLoad(id)
            {
                if (_Cache[id] == undefined)
                {
                    try
                    {
                        _Load(id);
                    }
                    catch (e)
                    {
                        return null;
                    }
                }
                return _Cache[id];
            }

            function _Load(id)
            {
                if (_Cache[id] == undefined)
                {
                    var rec = nlapiLoadRecord("salestaxitem", id);
                    _Cache[id] = _CreateInstanceFromRecord(rec);
                }
                return _Cache[id];
            }

            function _LoadAllByCountry(countryCode)
            {
                if (!_Context.IsAdvancedTax() && countryCode != _Context.Company.GetCountryCode())
                {
                    return [];
                }
                //Include inactive
                var filters = _Context.IsAdvancedTax() ? [new nlobjSearchFilter("country", null, "is", countryCode)] : null;
                var rs = nlapiSearchRecord("salestaxitem", null, filters, null);
                if (rs == null)
                {
                    return [];
                }
                var entities = [];
                for (var i = 0; i < rs.length; ++i)
                {
                    var entity = _TryLoad(rs[i].getId());
                    if (entity != null)
                    {
                        entities.push(entity);
                    }
                }
                return entities;
            }

            // "exempt" is available only when loading a record, not as a search column
            // "service" is available only when loading a record, not as a search column
            // "parent" is available only when searching, not when loading
            function _CreateInstanceFromRecord(rec)
            {
                var a = rec.getFieldValue("available");
                var sRate = rec.getFieldValue("rate");
                var rate = (sRate == null || sRate == "" || isNaN(parseFloat(sRate))) ? 0.0 : parseFloat(sRate);
                var countryCode = _Context.IsAdvancedTax() ? rec.getFieldValue("nexuscountry") : _Context.Company.GetCountryCode();
                var instance = new _System.TaxCode(rec);
                instance.SetId(rec.getId());
                instance.SetName(rec.getFieldValue("itemid"));
                instance.SetDescription(rec.getFieldValue("description"));
                instance.SetRate(rate);
                instance.SetForSales(a == "BOTH" || a == "SALE");
                instance.SetForPurchase(a == "BOTH" || a == "PURCHASE");
                instance.SetService(rec.getFieldValue("service") == "T");
                instance.SetExempt(rec.getFieldValue("exempt") == "T");
                instance.SetForExport(rec.getFieldValue("export") == "T");
                instance.SetExcluded(rec.getFieldValue("excludefromtaxreports") == "T");
                instance.SetReverseCharge(rec.getFieldValue("reversecharge") == "T");
                instance.SetEC(rec.getFieldValue("eccode") == "T");
                instance.SetCountryCode(countryCode);
                //Set parent (if any)
                var parentId = rec.getFieldValue("parent");
                if (parentId != null)
                {
                    instance.SetParentId(parentId);
                }
                return instance;
            }

            function _Definitions(definitions)
            {
                var _CountryCode = definitions.CountryCode;
                this.CountryCode = _CountryCode;
                var _Defs = definitions.TaxCodeDefs;
                this.GetEntries = function() { return _Defs; };
                this.GetTypeOf = _GetTypeOf;
                this.IsAnyOf = _IsAnyOf;
                function _GetTypeOf(taxcode)
                {
                    for (var i in _Defs)
                    {
                        if (_Defs[i](taxcode))
                            return i;
                    }
                    return undefined;
                }
                function _IsAnyOf(taxcode, filters)
                {
                    var type = _GetTypeOf(taxcode);
                    if (!type)
                        return false;
                    for (var i = 0; i < filters.length; ++i)
                    {
                        if (filters[i] == type)
                            return true;
                    }
                    return false;
                }
            }

        }  //End of _TaxCodeMgr

        function _Account(rec)
        {
            var _RecordObj = rec;
            this.GetId = function() { return _RecordObj.getId(); };
            this.GetName = function() { return _RecordObj.getFieldValue("acctname"); };
            this.GetNumber = function() { return _RecordObj.getFieldValue("acctnumber"); };
            this.GetType = function() { return _RecordObj.getFieldValue("accttype"); };
        }  //End of _Account

        function _AccountMgr()
        {
            var _Cache = {};  //Cache all account records
            this.Load = _Load;
            function _Load(id)
            {
                if (_Cache[id] == undefined)
                {
                    var rec = nlapiLoadRecord("account", id);
                    _Cache[id] = new _System.Account(rec);
                }
                return _Cache[id];
            }
        }  //End of _AccountMgr

        function _TransactionMgr()
        {
            this.GetType = _GetType;
            function _GetType(id)
            {
                var filters = [new nlobjSearchFilter("internalid", null, "is", id)];
                var columns = [new nlobjSearchColumn("type")];
                var rs = nlapiSearchRecord("transaction", null, filters, columns);
                return rs == null ? undefined : rs[0].getValue("type");
            }
        }  //End of _TransactionMgr

        function _BundleRegistry()
        {
            var _Cache = {};  //Lazy load
            this.IsInstalled = _IsInstalled;
            function _IsInstalled(guid)
            {
                if (_Cache[guid] !== undefined)
                {
                    return _Cache[guid];
                }
                var filters = [
                new nlobjSearchFilter("name", null, "is", guid)
            ];
                var columns = null;
                var rs = nlapiSearchRecord("file", null, filters, columns);
                _Cache[guid] = rs != null;
                return _Cache[guid];
            }
        }

        // Encapsulates user event scripts
        function _Triggers()
        {
            this.OnBeforeLoad = function _OnBeforeLoad() { };
            this.OnBeforeSubmit = function _OnBeforeSubmit() { };
            this.OnAfterSubmit = function _OnAfterSubmit() { };
        }
        _Triggers.IsRelevant = function _IsRelevant() { return false; };  // Static class level attribute
    } //End of __System
})();
