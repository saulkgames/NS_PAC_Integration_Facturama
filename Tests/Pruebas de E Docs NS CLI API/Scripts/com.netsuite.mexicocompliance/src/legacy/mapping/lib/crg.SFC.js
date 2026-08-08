/**
 * Copyright © 2014, 2017, Oracle and/or its affiliates. All rights reserved.
 */

var SFC = SFC || (new function _SFC()
{
    //Singleton
    if (_SFC.Instance !== undefined)
    {
        return _SFC.Instance;
    }
    _SFC.Instance = this;


    //Dependencies
    //var SuiteScript = System.Components.Use("SuiteScript");
    var SuiteScript = function(){ return this; }();


    //Interface
    this.Context = new __ContextMgr();
    this.Utilities = new __Utilities();
    this.Transactions = new __TransactionMgr();
    this.Subsidiaries = new __SubsidiaryMgr();
    this.TaxPeriods = new __TaxPeriodMgr();
    this.PostingPeriods = new __PostingPeriodMgr();
    this.Periods = new __PeriodMgr();
    this.TaxCodes = new __TaxCodeMgr();
    this.TaxGroups = new __TaxGroupMgr();
    this.Accounts = new __AccountMgr();
    this.Registry = new __RegistryMgr();
    this.Application = _Application;


    var CONTEXT = _SFC.Instance.Context.GetContext();
    var IS_ONEWORLD = _SFC.Instance.Context.IsOneWorld();
    var IS_MULTIBOOK = _SFC.Instance.Context.IsMultiBook();
    var IS_MULTIPLE_CALENDAR = _SFC.Instance.Context.IsMultipleCalendar();









    function __ContextMgr()
    {
        //Singleton
        if (__ContextMgr.Instance !== undefined)
        {
            return __ContextMgr.Instance;
        }
        __ContextMgr.Instance = this;


        var CONTEXT = SuiteScript.nlapiGetContext();
        var COMPANY_INFO = SuiteScript.nlapiLoadConfiguration("companyinformation");
        var IS_ONEWORLD = CONTEXT.getSetting("FEATURE", "SUBSIDIARIES") == "T";
        var IS_ADVTAX = CONTEXT.getFeature("advtaxengine");
        var IS_MULTIBOOK = CONTEXT.getFeature('MULTIBOOK');
        var IS_MULTIPLE_CALENDAR = CONTEXT.getSetting('FEATURE', 'MULTIPLECALENDARS') == 'T';


        this.Company = new _CompanyMgr();

        this.GetContext = function _GetContext() { return CONTEXT; };
        this.GetCompanyInfo = function _GetCompanyInfo() { return COMPANY_INFO; };
        this.IsOneWorld = function _IsOneWorld() { return IS_ONEWORLD; };
        this.IsAdvancedTax = function _IsAdvancedTax() { return IS_ADVTAX; };
        this.IsMultiBook = function _IsMultiBook() { return IS_MULTIBOOK; };
        this.IsMultipleCalendar = function _IsMultipleCalendar() { return IS_MULTIPLE_CALENDAR; };
        this.GetRemainingUsage = function _GetRemainingUsage() { return CONTEXT.getRemainingUsage(); };
        this.GetTaxCountryCodes = _GetTaxCountryCodes;
        this.GetNetSuiteEdition = _GetNetSuiteEdition;





        function _GetTaxCountryCodes()
        {
            if (!IS_ADVTAX)
            {
                return [COMPANY_INFO.getFieldValue("country")]
            }

            var filters = [
                new SuiteScript.nlobjSearchFilter("isinactive", null, "is", "F")
            ];

            var columns = [
                new SuiteScript.nlobjSearchColumn("country", null, "GROUP")
            ];

            var sr = SuiteScript.nlapiSearchRecord('salestaxitem', null, filters, columns);
            if (sr == null)
            {
                return [COMPANY_INFO.getFieldValue("country")]
            }

            var countryCodes = [];
            for (var i = 0; i < sr.length; ++i)
            {
                countryCodes.push(sr[i].getValue("country", null, "GROUP"));
            }

            return countryCodes;
        }





        function _CompanyMgr()
        {
            this.GetLegalName = _GetLegalName;
            this.GetCountryCode = _GetCountryCode;
            this.GetName = _GetName;





            function _GetLegalName()
            {
                return COMPANY_INFO.getFieldValue("legalname");
            }





            function _GetCountryCode()
            {
                return COMPANY_INFO.getFieldValue("country");
            }





            function _GetName(subId)
            {
                var name = "";
                if (IS_ONEWORLD)
                {
                    if (subId == null)
                    {
                        return null;
                    }

                    var subsidiary = new _Subsidiary(subId, false);
                    name = subsidiary.NameNoHeirarchy;

                    if (name == "Parent Company")
                    {
                        name = COMPANY_INFO.getFieldValue("companyname");
                    }
                }
                else
                {
                    name = COMPANY_INFO.getFieldValue("companyname");
                }

                return name == null ? "" : name;
            }
        }
        
        
        
        
        
        function _GetNetSuiteEdition()
        {
            if (IS_ONEWORLD)
            {
                _NetSuiteEdition = COMPANY_INFO.getFieldValue("edition")||"XX";
            }
            else
            {
                var countryCode = COMPANY_INFO.getFieldValue("country");
                _NetSuiteEdition = "|AU|CA|JP|UK|US|".indexOf("|" + countryCode + "|") == -1 ? "XX" : countryCode;
            }

            return _NetSuiteEdition;
        }
    }  //__ContextMgr










    function __TransactionMgr()
    {
        //Singleton
        if (__TransactionMgr.Instance !== undefined)
        {
            return __TransactionMgr.Instance;
        }
        __TransactionMgr.Instance = this;
        
        
        var TYPES = {
            build: { Id: "assemblyitem", Key: "Build", Name: "Assembly Build" },
            unbuild: { Id: "assemblyunbuild", Key: "Unbuild", Name: "Assembly Unbuild" },
            vendbill: { Id: "vendorbill", Key: "VendBill", Name: "Bill" },
            vendcard: { Id: undefined, Key: "VendCard", Name: "Bill CCard" },
            vendcred: { Id: "vendorcredit", Key: "VendCred", Name: "Bill Credit" },
            vendpymt: { Id: "vendorpayment", Key: "VendPymt", Name: "Bill Payment" },
            binwksht: { Id: "binworksheet", Key: "BinWksht", Name: "Bin Worksheet" },
            bintrnfr: { Id: "bintransfer", Key: "BinTrnfr", Name: "Bin Transfer" },
            cardrfnd: { Id: undefined, Key: "CardRfnd", Name: "CCard Refund" },
            cashrfnd: { Id: "cashrefund", Key: "CashRfnd", Name: "Cash Refund" },
            cashsale: { Id: "cashsale", Key: "CashSale", Name: "Cash Sale" },
            check: { Id: "check", Key: "Check", Name: "Cheque" },
            commissn: { Id: undefined, Key: "Commissn", Name: "Commission" },
            cardchrg: { Id: undefined, Key: "CardChrg", Name: "Credit Card" },
            custcred: { Id: "creditmemo", Key: "CustCred", Name: "Credit Memo" },
            fxreval: { Id: undefined, Key: "FxReval", Name: "Currency Revaluation" },
            custdep: { Id: "customerdeposit", Key: "CustDep", Name: "Customer Deposit" },
            custrfnd: { Id: "customerrefund", Key: "CustRfnd", Name: "Customer Refund" },
            deposit: { Id: undefined, Key: "Deposit", Name: "Deposit" },
            depappl: { Id: "depositapplication", Key: "DepAppl", Name: "Deposit Application" },
            estimate: { Id: "estimate", Key: "Estimate", Name: "Estimate" },
            exprept: { Id: "expensereport", Key: "ExpRept", Name: "Expense Report" },
            invadjst: { Id: "inventoryadjustment", Key: "InvAdjst", Name: "Inventory Adjustment" },
            invdistr: { Id: undefined, Key: "InvDistr", Name: "Inventory Distribution" },
            invtrnfr: { Id: "inventorytransfer", Key: "InvTrnfr", Name: "Inventory Transfer" },
            invwksht: { Id: undefined, Key: "InvWksht", Name: "Inventory Worksheet" },
            custinvc: { Id: "invoice", Key: "CustInvc", Name: "Invoice" },
            itemship: { Id: "itemfulfillment", Key: "ItemShip", Name: "Item Fulfillment" },
            itemrcpt: { Id: "itemreceipt", Key: "ItemRcpt", Name: "Item Receipt" },
            journal: { Id: "journalentry", Key: "Journal", Name: "Journal" },
            liaadjst: { Id: undefined, Key: "LiaAdjst", Name: "Liability Adjustment" },
            opprtnty: { Id: "opportunity", Key: "Opprtnty", Name: "Opportunity" },
            paycheck: { Id: undefined, Key: "Paycheck", Name: "Paycheck" },
            custpymt: { Id: "customerpayment", Key: "CustPymt", Name: "Customer Payment" },
            ytdadjst: { Id: undefined, Key: "YtdAdjst", Name: "Payroll Adjustment" },
            liabpymt: { Id: undefined, Key: "LiabPymt", Name: "Payroll Liability Check" },
            purchord: { Id: "purchaseorder", Key: "PurchOrd", Name: "Purchase Order" },
            rtnauth: { Id: "returnauthorization", Key: "RtnAuth", Name: "Return Authorization" },
            salesord: { Id: "salesorder", Key: "SalesOrd", Name: "Sales Order" },
            taxpymt: { Id: undefined, Key: "TaxPymt", Name: "Sales Tax Payment" },
            custchrg: { Id: undefined, Key: "CustChrg", Name: "Statement Charge" },
            taxliab: { Id: undefined, Key: "TaxLiab", Name: "Tax Liability Cheque" },
            transfer: { Id: undefined, Key: "Transfer", Name: "Transfer" },
            vendauth: { Id: "vendorreturnauthorization", Key: "VendAuth", Name: "Vendor Return Authorization" },
            workord: { Id: "workorder", Key: "WorkOrd", Name: "Work Order" }
        };

        var TYPES_BY_ID = null;


        this.GetTypeName = _GetTypeName;
        this.GetTypeId = _GetTypeId;
        this.GetTypeKey = _GetTypeKey;
        this.GetType = _GetType;





        function _GetTypeName(idOrKey)
        {
            if (idOrKey == null || idOrKey == "")
            {
                return undefined;
            }


            var k = idOrKey.toLowerCase();

            if (TYPES[k] !== undefined)
            {
                return TYPES[k].Name;
            }


            var types = _GetTypesById();
            if (types[k] !== undefined)
            {
                return types[k].Name;
            }

            return undefined;
        }





        function _GetTypeId(key)
        {
            if (key == null || key == "")
            {
                return undefined;
            }

            var k = key.toLowerCase();

            return TYPES[k] === undefined ? undefined : TYPES[k].Id;
        }





        function _GetTypeKey(id)
        {
            if (id == null || id == "")
            {
                return undefined;
            }

            var types = _GetTypesById();

            return types[id] === undefined ? undefined : types[id].Key;
        }





        function _GetTypesById()
        {
            if (TYPES_BY_ID == null)
            {
                TYPES_BY_ID = {};
                for (var i in TYPES)
                {
                    if (TYPES[i].Id !== undefined)
                    {
                        TYPES_BY_ID[TYPES[i].Id] = TYPES[i];
                    }
                }
            }

            return TYPES_BY_ID;
        }
        
        
        
        
        
        function _GetType(id)
        {
            var filters = [new SuiteScript.nlobjSearchFilter("internalid", null, "is", id)];
            var columns = [new SuiteScript.nlobjSearchColumn("type")];

            var rs = SuiteScript.nlapiSearchRecord("transaction", null, filters, columns);
            return (rs == null)? undefined : rs[0].getValue("type");
        }
    }  //__TransactionMgr










    function __Utilities()
    {
        this.Tree = _Tree;
        this.TreeNode = _TreeNode;
        this.BitArray = _BitArray;
        this.RenderTemplate = _RenderTemplate;
        this.FormatCurrency = _FormatCurrency;
        this.FormatGDPdUDate = _FormatGDPdUDate;
        this.ReportColumn = _ReportColumn;
        this.Constants = new _Constants();

        function _RenderTemplate(template, ds){
            var content = template;
            for (var i in ds) {
                var pattern = new RegExp("{" + i + "}", "g");
                content = content.replace(pattern, String(ds[i]).replace(/\$/gm, "$$$"));
            }
            return content;
        }

        
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
                    throw nlapiCreateError("__Utilities.Tree", "__Utilities.Tree: Node cannot have null Id");
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
                    throw nlapiCreateError("__Utilities.BitArray", "__Utilities.BitArray: Count [" + length + "] out of range.");
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
                    throw nlapiCreateError("__Utilities.BitArray", "__Utilities.BitArray: Index [" + index + "] out of range.");
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
                    throw nlapiCreateError("__Utilities.BitArray", "__Utilities.BitArray: Index [" + index + "] out of range.");
                }

                var p = index % _BYTE_SIZE;
                var i = Math.floor(index / _BYTE_SIZE);

                _Bytes[i] = value ? (_Bytes[i] | Math.pow(2, p)) : (_Bytes[i] & ~Math.pow(2, p));
            }

        }  //End of _BitArray
        
        
        function _FormatCurrency(value, thousand, decimal) 
        {
            if( !value || value == null) {
                value = 0;
            }
            
            var num = Math.abs(parseFloat(value, 10)).toFixed(2);
            
            var sign = value < 0 ? '-' : '';
            var whole_part = num.substr(0, num.indexOf('.'));
            var decimal_part = num.substr(num.indexOf('.') + 1, 2);
            
            var formatted_whole = [];
            var whole_length = whole_part.length;
            for (var i = 0; i < whole_length; i++) {
                formatted_whole.push(whole_part[i]);
                
                if ((whole_length - i - 1)%3 == 0 && i != whole_length - 1) {
                    formatted_whole.push((thousand != null) ?  thousand : ',');
                }
            }
            
            return sign + formatted_whole.join('') + ((decimal != null) ?  decimal : '.') + decimal_part;
        }
        
        
        function _FormatGDPdUDate(dateString)
        {
            var rawTrandate = SuiteScript.nlapiStringToDate(dateString);
            var day = (rawTrandate.getDate() < 10 ? '0' : '') + (rawTrandate.getDate());
            var month = (rawTrandate.getMonth() < 9 ? '0' : '') + (rawTrandate.getMonth()+1);
            
            return day + '.' + month + '.' + rawTrandate.getFullYear();
        }
        function _ReportColumn(colObj, type, descriptor) {
            
            if(typeof colObj === 'object' && colObj.columnName){
                this.name = colObj.columnName;
                if(colObj.columnDesc){
                    this.desc = colObj.columnDesc;
                }
            }
            else{
                this.name = colObj;
            }
            
            this.type = type;
            this.format = null;
            this.accuracy = null;
            
            if (type == 'Date') {
                this.format = descriptor;
            } else if (type == 'Numeric') {
                this.accuracy = descriptor;
            }
        }
        
        
        function _Constants() {
            this.ALPHANUMERIC = 'AlphaNumeric';
            this.DATE = 'Date';
            this.DATEFORMAT = 'DD.MM.YYYY';
            this.NUMERIC = 'Numeric';
            this.NUMERICACCURACY = 2;
            this.DECIMALSYMBOL = ',';
            this.DIGITGROUPINGSYMBOL = '.';
            this.COLUMNDELIMITER = '\t'; 
        }
    }  //__Utilities










    
    function _Subsidiary()
    {
        var _Id = null;
        this.GetId = function() { return _Id; };
        this.SetId = function(value) { _Id = value; };

        var _Name = null;
        this.GetName = function() { return _Name; };
        this.SetName = function(value) { _Name = value == null ? "" : value; };

        var _CompleteName = null;
        this.GetCompleteName = function() { return _CompleteName; };
        this.SetCompleteName = function(value) { _CompleteName = value == null ? "" : value; };

        var _CountryCode = null;
        this.GetCountryCode = function() { return _CountryCode; };
        this.SetCountryCode = function(value) { _CountryCode = value == null ? "" : value; };
        
        var _CountryName = null;
        this.GetCountryName = function() { return _CountryName; };
        this.SetCountryName = function(value) { _CountryName = value == null ? "" : value; };

        var _VRN = null;
        this.GetVRN = function() { return _VRN; };
        this.SetVRN = function(value) { _VRN = value == null ? "" : value; };

        var _LegalName = null;
        this.GetLegalName = function() { return _LegalName; };
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

        var _CurrencyId = null;
        this.GetCurrencyId = function() { return _CurrencyId; };
        this.SetCurrencyId = function(value) { _CurrencyId = value == null ? "" : value; };

        var _ParentObj = null;
        this.SetParent = function _SetParent(obj) { _ParentObj = obj; };
        this.GetParent = function _GetParent() { return _ParentObj; };
        
        var _FiscalCalendar = null;
        this.SetFiscalCalendar = function _SetFiscalCalendar(value) { _FiscalCalendar = value; };
        this.GetFiscalCalendar = function _GetFiscalCalendar() { return _FiscalCalendar; };

        var _Children = [];
        this.AddChild = function _AddChild(obj) { _Children.push(obj); };
        this.GetChildren = _GetChildren;
        this.GetDescendants = _GetDescendants;

        var _Rec = null;
        this.SetRecordSource = function(rec) { _Rec = rec; };
        this.GetFieldValue = _GetFieldValue;

        function _GetFieldValue(fieldName)
        {
            if (_Rec == null)
            {
                _Rec = SuiteScript.nlapiLoadRecord("subsidiary", _Id);
            }

            return (_Rec == null) ? null : _Rec.getFieldValue(fieldName);
        }





        function _GetChildren()  //this is called internally by _GetDescendants()
        {
            return _Children;
        }





        function _GetDescendants()
        {
            var desc = [];
            var children = _GetChildren();

            desc = desc.concat(children);

            for (var i = 0; i < children.length; i++)
            {
                desc = desc.concat(children[i].GetDescendants());
            }

            return desc;
        }

    }  //_Subsidiary











    function __SubsidiaryMgr()
    {
        //Singleton
        if (__SubsidiaryMgr.Instance !== undefined)
        {
            return __SubsidiaryMgr.Instance;
        }
        __SubsidiaryMgr.Instance = this;
        
        
        
        var _SubsCache = null;  //Cache all subsidiary records
        var _SubsRoot = null;

        this.TryLoad = _TryLoad;
        this.Load = _Load;
        this.LoadAll = _LoadAll;
        this.LoadRoot = function _LoadRoot() { _GetSubsCache(); return _SubsRoot; };
        this.LoadChildrenOf = _LoadChildrenOf;
        this.LoadDescendantsOf = _LoadDescendantsOf;


        this.ClearCache = function() {
            _SubsCache = null;
        };


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
            if (!IS_ONEWORLD)
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
                throw SuiteScript.nlapiCreateError("__SubsidiaryMgr", "__SubsidiaryMgr: Unable to load Id[" + id + "].");
            }

            return sub;
        }





        function _LoadAll()
        {
            _SubsCache = {};
            _SubsByHierarchyName = {};
            _SubsRoot = null;

            if (!IS_ONEWORLD)
            {
                return [];
            }

            //Exclude inactive subsidiaries
            var filters = [
                new SuiteScript.nlobjSearchFilter("isinactive", null, "is", "F")
            ];

            var columns = [
                new SuiteScript.nlobjSearchColumn('formulanumeric').setFormula('NVL({parent}, -999999)').setSort(),
                new SuiteScript.nlobjSearchColumn("namenohierarchy").setSort(),
                new SuiteScript.nlobjSearchColumn("name"),
                new SuiteScript.nlobjSearchColumn("country"),
                new SuiteScript.nlobjSearchColumn("legalname"),
                new SuiteScript.nlobjSearchColumn("zip"),
                new SuiteScript.nlobjSearchColumn("phone"),
                new SuiteScript.nlobjSearchColumn("state"),
                new SuiteScript.nlobjSearchColumn("city"),
                new SuiteScript.nlobjSearchColumn("address1"),
                new SuiteScript.nlobjSearchColumn("address2"),
                new SuiteScript.nlobjSearchColumn("address3"),
                new SuiteScript.nlobjSearchColumn("currency"),
                new SuiteScript.nlobjSearchColumn("fax"),
                new SuiteScript.nlobjSearchColumn("email"),
                new SuiteScript.nlobjSearchColumn("url"),
                new SuiteScript.nlobjSearchColumn("taxidnum"),
                new SuiteScript.nlobjSearchColumn('parent'),
            ];
            
            if (IS_MULTIPLE_CALENDAR) {
                columns.push(new nlobjSearchColumn('fiscalcalendar'));
            }

            var rs = SuiteScript.nlapiSearchRecord("subsidiary", null, filters, columns);
            if (rs == null)
            {
                return [];
            }

            var parentchild = [];
            
            for (var i = 0; i < rs.length; ++i) {
                //Cache by Id
                var objSub = _RowToObject(rs[i]);
                _SubsCache[rs[i].getId()] = objSub;
                
                /////////////////////////////////////////////////////
                var parent = rs[i].getValue('parent');
                var is_root = parent == null || parent == '';
                
                if (is_root) {
                    _SubsRoot = objSub;
                } else {
                    var objParent = _SubsCache[parent];

                    if(objParent){
                        objSub.SetParent(objParent);
                        objParent.AddChild(objSub);
                    }else{ //will only happen if internal ID of parent > child's
                        parentchild.push({parent:parent, child:objSub});
                    }
                }
            }
            
           //will only happen if internal ID of parent > child's
            for(var d = 0; d < parentchild.length; ++d){
                objParent = _SubsCache[parentchild[d].parent];
                
                parentchild[d].child.SetParent(objParent);
                objParent.AddChild(parentchild[d].child);
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
            var sub = new _Subsidiary();

            sub.SetId(row.getId());
            sub.SetName(row.getValue("namenohierarchy"));
            sub.SetCompleteName(row.getValue("name"));
            sub.SetCountryCode(row.getValue("country"));
            sub.SetCountryName(row.getText("country"));
            sub.SetLegalName(row.getValue("legalname"));
            sub.SetPostalCode(row.getValue("zip"));
            sub.SetPhoneNumber(row.getValue("phone"));
            sub.SetState(row.getValue("state"));
            sub.SetCity(row.getValue("city"));
            sub.SetAddress1(row.getValue("address1"));
            sub.SetAddress2(row.getValue("address2"));
            sub.SetAddress3(row.getValue("address3"));
            sub.SetCurrencyCode(row.getText("currency"));  //getValue on currency returns internal id
            sub.SetCurrencyId(row.getValue("currency"));  //getValue on currency returns internal id
            sub.SetFaxNumber(row.getValue("fax"));
            sub.SetEmail(row.getValue("email"));
            sub.SetWebsite(row.getValue("url"));
            sub.SetVRN(row.getValue("taxidnum"));
            sub.SetFiscalCalendar(row.getValue('fiscalcalendar'));

            return sub;
        }

    }  //__SubsidiaryMgr
    
    
    
    
    
    
    
    
    
    
    function _Period(manager)
    {
        this.manager = manager;
        
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

            return this.manager.TryLoad(_ParentId);
        }





        function _GetChildren()
        {
            return this.manager.LoadChildrenOf(_Id);
        }





        function _GetDescendants()
        {
            return this.manager.LoadDescendantsOf(_Id);
        }
    }
    
    
    
    
    
    
    
    
    
    
    
    function __TaxPeriodMgr()
    {
        //Singleton
        if (__TaxPeriodMgr.Instance !== undefined)
        {
            return __TaxPeriodMgr.Instance;
        }
        __TaxPeriodMgr.Instance = this;
        
        
        var _Cache = {};
        var _Tree = new _SFC.Instance.Utilities.Tree();  //Stores hierarchy info

        this.TryLoad = _TryLoad;
        this.Load = _Load;
        this.LoadAll = _LoadAll;
        this.GetRootPeriod = _GetRootPeriod;
        this.LoadChildrenOf = _LoadChildrenOf;
        this.LoadDescendantsOf = _LoadDescendantsOf;
        this.LoadCoveredPeriods = _LoadCoveredPeriods;
        this.GetCoveredPeriodIds = _GetCoveredPeriodIds;

        this.ClearCache = function() {
            _LoadAll.IsLoaded = false;
            _Cache = {};
        };



        function _GetSearchColumns()  //__TaxPeriodMgr
        {
            var columns = [
                new SuiteScript.nlobjSearchColumn("periodname"),
                new SuiteScript.nlobjSearchColumn("startdate"),
                new SuiteScript.nlobjSearchColumn("enddate"),
                new SuiteScript.nlobjSearchColumn("isinactive"),
                new SuiteScript.nlobjSearchColumn("allclosed"),
                new SuiteScript.nlobjSearchColumn("isadjust"),
                new SuiteScript.nlobjSearchColumn("isyear"),
                new SuiteScript.nlobjSearchColumn("isquarter"),
                new SuiteScript.nlobjSearchColumn("parent")
            ];

            columns[1].setSort(true);

            return columns;
        }





        function _SearchPeriod(id)  //__TaxPeriodMgr
        {
            var filters = [
                new SuiteScript.nlobjSearchFilter("internalid", null, "is", id)
            ];

            var sr = SuiteScript.nlapiSearchRecord("taxperiod", null, filters, _GetSearchColumns());
            if (sr == null)
            {
                return null;
            }

            //For inactive periods, register in Cache but not in Tree
            _Cache[id] = _CreateInstanceFromSearchRow(sr[0]);

            return _Cache[id];
        }





        function _TryLoad(id)  //__TaxPeriodMgr
        {
            _LoadAll();

            return _Cache[id] === undefined ? null : _Cache[id];
        }





        function _Load(id)  //__TaxPeriodMgr
        {
            var sub = _TryLoad(id);
            if (sub == null)
            {
                throw SuiteScript.nlapiCreateError("__TaxPeriodMgr", "__TaxPeriodMgr: Unable to load Id[" + id + "].");
            }

            return sub;
        }





        function _LoadAll()  //__TaxPeriodMgr
        {
            if (!_LoadAll.IsLoaded)
            {
                _Tree = new _SFC.Instance.Utilities.Tree();

                var filters = null;

                //TODO: Load all periods using search object
                var sr = SuiteScript.nlapiSearchRecord("taxperiod", null, filters, _GetSearchColumns());
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

        }; _LoadAll.IsLoaded = false;





        function _LoadChildrenOf(id)  //__TaxPeriodMgr
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





        function _LoadDescendantsOf(id)  //__TaxPeriodMgr
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





        function _GetRootPeriod() //__TaxPeriodMgr
        {
            _LoadAll();

            return _Tree.GetRootNode();
        }





        function _GetCoveredPeriodIds(startPeriodId, endPeriodId)  //__TaxPeriodMgr
        {
            var startPeriod = _Load(startPeriodId);
            var endPeriod = _Load(endPeriodId);

            var uniquePeriods = {};
            uniquePeriods[startPeriodId] = true;
            uniquePeriods[endPeriodId] = true;

            var filters = [
                new SuiteScript.nlobjSearchFilter("isinactive", null, "is", "F"),
                new SuiteScript.nlobjSearchFilter("startdate", null, "onorafter", startPeriod.GetStartDate()),
                new SuiteScript.nlobjSearchFilter("enddate", null, "onorbefore", endPeriod.GetEndDate())
            ];

            var columns = null;   //[new nlobjSearchColumn("startdate")];

            var sr = SuiteScript.nlapiSearchRecord("taxperiod", null, filters, columns);
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





        function _LoadCoveredPeriods(startPeriodId, endPeriodId)  //__TaxPeriodMgr
        {
            var periods = [];
            var ids = _GetCoveredPeriodIds(startPeriodId, endPeriodId);

            for (var i = 0; i < ids.length; ++i)
            {
                periods.push(_Load(ids[i]));
            }

            return periods;
        }





        function _CreateInstanceFromSearchRow(row)  //__TaxPeriodMgr
        {
            var instance = new _Period(_SFC.Instance.TaxPeriods);

            instance.SetId(row.getId());
            instance.SetName(row.getValue("periodname"));
            instance.SetStartDate(SuiteScript.nlapiStringToDate(row.getValue("startdate")));
            instance.SetEndDate(SuiteScript.nlapiStringToDate(row.getValue("enddate")));
            instance.SetActive(row.getValue("isinactive") != "T");
            instance.SetClosed(row.getValue("allclosed") == "T");
            instance.SetType(row.getValue("isadjust") == "T" ? "adjustment" : row.getValue("isyear") == "T" ? "year" : row.getValue("isquarter") == "T" ? "quarter" : "month");
            instance.SetParentId(row.getValue("parent"));

            return instance;
        }

    }  //__TaxPeriodMgr
    
    
    
    
    
    
    
    
    
    
    function __PostingPeriodMgr()
    {
        //Singleton
        if (__PostingPeriodMgr.Instance !== undefined)
        {
            return __PostingPeriodMgr.Instance;
        }
        __PostingPeriodMgr.Instance = this;
        
        
        var _Cache = {};
        var _Tree = new _SFC.Instance.Utilities.Tree();  //Stores hierarchy info

        this.TryLoad = _TryLoad;
        this.Load = _Load;
        this.LoadAll = _LoadAll;
        this.GetRootPeriod = _GetRootPeriod;
        this.LoadChildrenOf = _LoadChildrenOf;
        this.LoadDescendantsOf = _LoadDescendantsOf;
        this.LoadCoveredPeriods = _LoadCoveredPeriods;
        this.GetCoveredPeriodIds = _GetCoveredPeriodIds;
        this.GetPeriodIdsBeforePeriod = _GetPeriodIdsBeforePeriod;
        this.GetCoveredMonths = _GetCoveredMonths;
        
        this.ClearCache = function() {
            _LoadAll.IsLoaded = false;
            _Cache = {};
        };





        function _GetSearchColumns()  //__PostingPeriodMgr
        {
            var columns = [
                new SuiteScript.nlobjSearchColumn("periodname"),
                new SuiteScript.nlobjSearchColumn("startdate"),
                new SuiteScript.nlobjSearchColumn("enddate"),
                new SuiteScript.nlobjSearchColumn("isinactive"),
                new SuiteScript.nlobjSearchColumn("isadjust"),
                new SuiteScript.nlobjSearchColumn("isyear"),
                new SuiteScript.nlobjSearchColumn("isquarter"),
                new SuiteScript.nlobjSearchColumn("parent")
            ];

            columns[1].setSort(true);

            return columns;
        }





        function _SearchPeriod(id)  //__PostingPeriodMgr
        {
            var filters = [
                new SuiteScript.nlobjSearchFilter("internalid", null, "is", id)
            ];

            var sr = SuiteScript.nlapiSearchRecord("accountingperiod", null, filters, _GetSearchColumns());
            if (sr == null)
            {
                return null;
            }

            //For inactive periods, register in Cache but not in Tree
            _Cache[id] = _CreateInstanceFromSearchRow(sr[0]);

            return _Cache[id];
        }





        function _TryLoad(id)  //__PostingPeriodMgr
        {
            _LoadAll();

            return _Cache[id] === undefined ? null : _Cache[id];
        }





        function _Load(id)  //__PostingPeriodMgr
        {
            var sub = _TryLoad(id);
            if (sub == null)
            {
                throw SuiteScript.nlapiCreateError("__PostingPeriodMgr", "__PostingPeriodMgr: Unable to load Id[" + id + "].");
            }

            return sub;
        }





        function _LoadAll()  //__PostingPeriodMgr
        {
            if (!_LoadAll.IsLoaded)
            {
                _Tree = new _SFC.Instance.Utilities.Tree();

                var filters = null;

                //TODO: Load all periods using search object
                var sr = SuiteScript.nlapiSearchRecord("accountingperiod", null, filters, _GetSearchColumns());
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

        }; _LoadAll.IsLoaded = false;





        function _LoadChildrenOf(id)  //__PostingPeriodMgr
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





        function _LoadDescendantsOf(id)  //__PostingPeriodMgr
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





        function _GetRootPeriod()  //__PostingPeriodMgr
        {
            _LoadAll();

            return _Tree.GetRootNode();
        }





        function _GetCoveredPeriodIds(startPeriodId, endPeriodId)  //__PostingPeriodMgr
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
        
        
        function _GetPeriodIdsBeforePeriod(periodId) {
            var period = _Load(periodId);
            
            var filters = [
               new nlobjSearchFilter('isinactive', null, 'is', 'F'),
               new nlobjSearchFilter('enddate', null, 'before', period.GetStartDate())
            ];
            var searchResults = nlapiSearchRecord('accountingperiod', null, filters);
            if (searchResults == null) {
                return [];
            }
            
            var periodIdList = [];
            for (var i = 0; i < searchResults.length; i++) {
                periodIdList.push(searchResults[i].getId());
            }
            
            periodIdList.sort(function(left, right) { return (left - right); });
            
            return periodIdList;
        }
        
        
        function _GetCoveredMonths(startPeriodId, endPeriodId) {
            var startDate = _Load(startPeriodId).GetStartDate();
            var endDate = _Load(endPeriodId).GetEndDate();
            
            var filters = [
                new nlobjSearchFilter('isinactive', null, 'is', 'F'),
                new nlobjSearchFilter('startdate', null, 'onorafter', startDate),
                new nlobjSearchFilter('enddate', null, 'onorbefore', endDate),
                new nlobjSearchFilter('isquarter', null, 'is', 'F'),
                new nlobjSearchFilter('isyear', null, 'is', 'F')
            ];  
            var columns = [
                new nlobjSearchColumn('periodname'),
                new nlobjSearchColumn('startdate').setSort()
                ];
            var searchResults = nlapiSearchRecord('accountingperiod', null, filters, columns);
            if (searchResults == null) {
                return [];
            }
            
            var periodList = [];
            for (var i = 0; i < searchResults.length; i++) {
                var period = {
                    id : searchResults[i].getId(),
                    name : searchResults[i].getValue('periodname')
                };
                periodList.push(period);
            }
            
            return periodList;
        }
        


        function _LoadCoveredPeriods(startPeriodId, endPeriodId)  //__PostingPeriodMgr
        {
            var periods = [];
            var ids = _GetCoveredPeriodIds(startPeriodId, endPeriodId);

            for (var i = 0; i < ids.length; ++i)
            {
                periods.push(_Load(ids[i]));
            }

            return periods;
        }





        function _CreateInstanceFromSearchRow(row)  //__PostingPeriodMgr
        {
            var instance = new _Period(_SFC.Instance.PostingPeriods);

            instance.SetId(row.getId());
            instance.SetName(row.getValue("periodname"));
            instance.SetStartDate(nlapiStringToDate(row.getValue("startdate")));
            instance.SetEndDate(nlapiStringToDate(row.getValue("enddate")));
            instance.SetActive(row.getValue("isinactive") != "T");
            instance.SetType(row.getValue("isadjust") == "T" ? "adjustment" : row.getValue("isyear") == "T" ? "year" : row.getValue("isquarter") == "T" ? "quarter" : "month");
            instance.SetParentId(row.getValue("parent"));

            return instance;
        }

    }  //__PostingPeriodMgr
    
    
    
    
    
    
    
    
    
    
    function __PeriodMgr()
    {
        //Singleton
        if (__PeriodMgr.Instance !== undefined)
        {
            return __PeriodMgr.Instance;
        }
        __PeriodMgr.Instance = this;
        
        
        this.GetPeriodType = _GetPeriodType;
        this.TryLoad = _TryLoad;
        this.Load = _Load;





        function _GetPeriodType(id)
        {
            
            return _SFC.Instance.TaxPeriods.TryLoad(id) == null ? "accountingperiod" : "taxperiod";
        }





        function _GetMgr(id)
        {
            var periodType = _GetPeriodType(id);

            return periodType == "taxperiod" ? _SFC.Instance.TaxPeriods : _SFC.Instance.PostingPeriods;
        }






        function _TryLoad(id)
        {
            var mgr = _GetMgr(id);

            return mgr.TryLoad(id);
        }






        function _Load(id)
        {
            var mgr = _GetMgr(id);

            return mgr.Load(id);
        }

    }  //__PeriodMgr
    
    
    
    
    
    
    
    
    
    
    function _TaxCode(rec)
    {
        var _BitMask = new _SFC.Instance.Utilities.BitArray(8);

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
        
        var _ExemptionReason = null;
        this.GetExemptionReason = function() { return _ExemptionReason; };
        this.SetExemptionReason = function(value) { _ExemptionReason = value; };

        var _ParentId = null;
        var _Parent = undefined;  //Implement lazy loading of parent.  Load only when GetParent() or GetNotionalRate() is called.
        //_Parent = null - for taxcodes w/o parent
        //_Parent = undefined - unloaded parent
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
    }  //_TaxCode
    
    
    
    
    
    
    
    
    
    
    function __TaxCodeMgr()
    {
        //Singleton
        if (__TaxCodeMgr.Instance !== undefined)
        {
            return __TaxCodeMgr.Instance;
        }
        __TaxCodeMgr.Instance = this;
        
        
        //Private attributes
        var _Cache = {};  //Cache all tax code records

        //Public methods
        this.TryLoad = _TryLoad;
        this.Load = _Load;
        this.LoadAllByCountry = _LoadAllByCountry;
        this.Definitions = _Definitions;
        this.CreateInstanceFromRecord = _CreateInstanceFromRecord;





        function _TryLoad(id, isForced)
        {
            if (isForced == undefined)
                isForced = false;

            if (isForced || _Cache[id] == undefined)
            {
                try
                {
                    _Load(id, isForced)
                }
                catch (e)
                {
                    return null;
                }
            }

            return _Cache[id];
        }





        function _Load(id, isForced)
        {
            if (isForced == undefined)
                isForced = false;

            if (isForced || _Cache[id] == undefined)
            {
                var rec = SuiteScript.nlapiLoadRecord("salestaxitem", id);

                _Cache[id] = _CreateInstanceFromRecord(rec);
            }

            return _Cache[id];
        }





        function _LoadAllByCountry(countryCode)
        {
            if (!_SFC.Instance.Context.IsAdvancedTax() && countryCode != _SFC.Instance.Context.Company.GetCountryCode())
                return [];

            //Include inactive
            var filters = _SFC.Instance.Context.IsAdvancedTax() ? [new SuiteScript.nlobjSearchFilter("country", null, "is", countryCode)] : null;
            var rs = SuiteScript.nlapiSearchRecord("salestaxitem", null, filters, null);
            if (rs == null)
                return [];

            var entities = [];
            for (var i = 0; i < rs.length; ++i)
            {
                var entity = _TryLoad(rs[i].getId());
                if (entity != null)
                    entities.push(entity);
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
            var countryCode = _SFC.Instance.Context.IsAdvancedTax() ? rec.getFieldValue("nexuscountry") : _SFC.Instance.Context.Company.GetCountryCode();

            var instance = new _TaxCode(rec);

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
            instance.SetExemptionReason(rec.getFieldText("custrecord_tax_exemption_reason"));

            //Set parent (if any)
            var parentId = rec.getFieldValue("parent");
            if (parentId != null)
                instance.SetParentId(parentId);

            return instance;
        }





        function _Definitions(definitions)
        {
            var _CountryCode = definitions.CountryCode;
            this.CountryCode = _CountryCode;

            var _Defs = definitions.TaxCodeDefs;
            this.GetEntries = function() { return _Defs; };

            //Public methods
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
            };


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
            };
        }
        
    }  //__TaxCodeMgr
    
    
    
    
    
    
    
    
    
    
    function __TaxGroupMgr()
    {
        //Singleton
        if (__TaxGroupMgr.Instance !== undefined)
        {
            return __TaxGroupMgr.Instance;
        }
        __TaxGroupMgr.Instance = this;
        
        
        //Private attributes
        var _Cache = {};  //Cache all tax group records
        

        //Public methods
        this.TryLoad = _TryLoad;
        this.Load = _Load;
        this.CreateInstanceFromRecord = _CreateInstanceFromRecord;





        function _TryLoad(id)
        {
            if (_Cache[id] != undefined)
            {
                return _Cache[id];
            }
            
            try
            {
                return _Load(id)
            }
            catch (e)
            {
                return null;
            }
        }





        function _Load(id)
        {
            if (_Cache[id] != undefined)
            {
                return _Cache[id];
            }
            
            var rec = SuiteScript.nlapiLoadRecord("taxgroup", id);

            _Cache[id] = _CreateInstanceFromRecord(rec);

            return _Cache[id];
        }





        function _CreateInstanceFromRecord(rec)
        {
            var sRate = rec.getFieldValue("rate");
            var rate = (sRate == null || sRate == "" || isNaN(parseFloat(sRate))) ? 0.0 : parseFloat(sRate);

            var instance = new _TaxGroup(rec);

            instance.SetId(rec.getId());
            instance.SetName(rec.getFieldValue("itemid"));
            instance.SetRate(rate);

            var taxCodeCount = rec.getLineItemCount("taxitem");

            for (var i = 1; i <= taxCodeCount; ++i)
            {
                var taxCodeId = rec.getLineItemValue("taxitem", "taxname", i);
                var objTaxCode = _SFC.Instance.TaxCodes.TryLoad(taxCodeId);

                if (objTaxCode != null)
                {
                    instance.AddTaxCode(objTaxCode);
                }
            }

            return instance;
        }
    }  //__TaxGroupMgr
    
    
    
    
    
    
    
    
    
    
    function __AccountMgr()
    {
        //Singleton
        if (__AccountMgr.Instance !== undefined)
        {
            return __AccountMgr.Instance;
        }
        __AccountMgr.Instance = this;
    
    
        //Private attributes
        var _Cache = {};  //Cache all account records

        //Public methods
        this.Load = _Load;


        function _Load(id, isForced)
        {
            if (isForced == undefined)
            {
                isForced = false;
            }

            if (isForced || _Cache[id] == undefined)
            {
                var rec = SuiteScript.nlapiLoadRecord("account", id);
                _Cache[id] = new _Account(rec);
            }

            return _Cache[id];
        };
    }  //__AccountMgr
    
    
    
    
    
    
    
    
    
    
    function __RegistryMgr()
    {
        //Singleton
        if (__RegistryMgr.Instance !== undefined)
        {
            return __RegistryMgr.Instance;
        }
        __RegistryMgr.Instance = this;
        
    
        var _Cache = {};  //Lazy load

        //Public methods
        this.IsInstalled = _IsInstalled;





        function _IsInstalled(guid)
        {
            if (_Cache[guid] != undefined)
                return _Cache[guid];

            var filters = [
                new SuiteScript.nlobjSearchFilter("name", null, "is", guid)
            ];
            var columns = null;
            var rs = SuiteScript.nlapiSearchRecord("file", null, filters, columns);

            _Cache[guid] = rs != null;

            return _Cache[guid];
        }
    }
    
    
    
    
    
    
    
    
    
    
    function _Address()
    {
        var _Line1 = "";
        this.GetLine1 = function() { return _Line1 };
        this.SetLine1 = function(value) { _Line1 = value == null ? "" : value; };

        var _Line2 = "";
        this.GetLine2 = function() { return _Line2 };
        this.SetLine2 = function(value) { _Line2 = value == null ? "" : value; };


        this.GetFull = function(lineSeparator)
        {
            //Set default line separator
            if (!lineSeparator)
                lineSeparator = ", ";

            return _Line1 + (_Line1 != "" && _Line2 != "" ? lineSeparator : "") + _Line2;
        };
    }
    
    
    
    
    
    
    
    
    
    
    function _TaxGroup(rec)
    {
        var _RecordObj = rec;
        this.GetFieldValue = function(fieldName) { return _RecordObj.getFieldValue(fieldName); };

        var _Id = null;
        this.GetId = function() { return _Id; };
        this.SetId = function(value) { _Id = value; };

        var _Name = null;
        this.GetName = function _GetName() { return _Name; };
        this.SetName = function _SetName(value) { _Name = (value == null) ? "" : value.toString(); };

        var _Rate = null;
        this.GetRate = function _GetRate() { return _Rate; };
        this.SetRate = function _SetRate(value) { _Rate = value; };

        var _TaxCodes = [];
        this.AddTaxCode = _AddTaxCode;
        this.GetTaxCodes = function _GetTaxCodes() { return _TaxCodes; };



        function _AddTaxCode(objTaxCode)
        {
            _TaxCodes.push(objTaxCode);
        }
    }
    
    
    
    
    
    
    
    
    
    
    function _Account(rec)
    {
        var _RecordObj = rec;

        this.GetId = function() { return _RecordObj.getId(); };
        this.GetName = function() { return _RecordObj.getFieldValue("acctname"); };
        this.GetNumber = function() { return _RecordObj.getFieldValue("acctnumber"); };
        this.GetType = function() { return _RecordObj.getFieldValue("accttype"); };
    }
    
    
    
    
    
    
    
    
    
    
    function _Application(appGuid, nsRequest)
    {
        this.Context = CONTEXT;
        this.Params = InitParams(nsRequest);
        this.IsOneWorld = IS_ONEWORLD;
        this.IsMultiBook = IS_MULTIBOOK;
        var _AppGuid = appGuid;
        var _AppFolderId = null;

        this.GetAppFolderId = GetAppFolderId;
        this.GetFileId = GetFileId;
        this.GetFileContent = GetFileContent;
        this.LoadCurrentUser = LoadCurrentUser;





        function GetAppFolderId()
        {
            if (_AppFolderId == null)  //Lazy load folder id
            {
                //Find folder id using GUID file
                var filters = [new SuiteScript.nlobjSearchFilter("name", null, "is", _AppGuid)];
                var columns = [new SuiteScript.nlobjSearchColumn("folder")];
                var rs = SuiteScript.nlapiSearchRecord("file", null, filters, columns);
                _AppFolderId = rs[0].getValue("folder");
            }

            return _AppFolderId;
        }





        function GetFileId(fileName, isErrorWhenNotFound)
        {
            //Find file internalid using filename and folder id
            filters = [
            new SuiteScript.nlobjSearchFilter("name", null, "is", fileName),
            new SuiteScript.nlobjSearchFilter("folder", null, "is", GetAppFolderId())];

            var rs = SuiteScript.nlapiSearchRecord("file", null, filters);

            if (rs == null)
            {
                if (isErrorWhenNotFound)
                {
                    throw SuiteScript.nlapiCreateError("GST101A UI", "File not found (" + fileName + ")");
                }
                else
                {
                    return null;
                }
            }

            return rs[0].getId();
        }





        function GetFileContent(fileName, isErrorWhenNotFound)
        {
            var fileId = GetFileId(fileName, isErrorWhenNotFound);

            var file = SuiteScript.nlapiLoadFile(fileId);

            return file.getValue();
        }





        function LoadCurrentUser()
        {
            return {
                Id: CONTEXT.getUser(),
                Name: CONTEXT.getName()
            };
        }





        function InitParams(nsRequest)
        {
            var allParams = nsRequest == null ? [] : nsRequest.getAllParameters();
            var params = {};

            for (var i in allParams)
            {
                params[i] = allParams[i];
            }

            return params;
        }
    }  //_Application
    
} ());  //_SFC
