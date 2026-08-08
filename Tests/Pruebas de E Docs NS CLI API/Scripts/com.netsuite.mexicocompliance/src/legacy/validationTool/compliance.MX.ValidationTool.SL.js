/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 */
// Hook
function main (nsRequest, nsResponse) {new ValidationToolForm(nsRequest, nsResponse).Run();}

function ValidationToolForm (nsRequest, nsResponse) {
	var CONTEXT = nlapiGetContext();
	var IS_ONEWORLD = CONTEXT.getSetting('FEATURE', 'SUBSIDIARIES') == 'T';
	var APP = new SFC.Scripting.Application('0ff667bf-1663-447e-b23c-5282653a6bca', nsRequest);
	var _Request = nsRequest;
	var _Response = nsResponse;
	var _ResMgr = new ResourceMgr(CONTEXT.getPreference('LANGUAGE'));
	this.Run = _Run;

	function _Run () {
		if (CONTEXT.getFeature('tax_overhauling')) {
			throw _ResMgr.GetString('ACCESS_DENIED_SUITETAX_ENABLED');
		}

		var action = _GetFormAction();
		if (action === 'RUN_VALIDATION') {
			_ShowForm(_RunValidation());
		}
		else if (action === 'RUN_VALIDATION_PAGING') {
			_SetAppParamsFromSublistName(); // must call before _GetValidation() when paging
			_ShowForm(_RunValidation());
		}
		else if (action === 'SHOW_FORM') {
			_ShowForm();
		}
	}

	function _GetFormAction () {
		if (APP.Params.submitted === 'T') {
			return 'RUN_VALIDATION';
		}
		if (APP.Params.machine != null && APP.Params.machine != '') // Result paging
		{
			return 'RUN_VALIDATION_PAGING';
		}
		return 'SHOW_FORM';
	}

	function _GetValidationParams () {
		var params = {};
		if (IS_ONEWORLD) {
			var subId = _GetSubId();
			if (subId == '') {
				var subIds = [];
				var mxSubs = _GetMexicoSubs();
				for (var i = 0; i < mxSubs.length; ++i) {
					subIds.push(mxSubs[i].Id);
				}
				params.SubIds = subIds;
			}
			else {
				params.SubIds = [subId];
			}
		}
		var periodId = _GetPeriodId();
		params.Period = periodId == '' ? null : (new SFC.System.PeriodMgr()).Load(periodId);
		return params;
	}

	function _SetAppParamsFromSublistName () {
		// Paging uses a different internal form in the UI and does not pass form parameters.
		// As workaround we embed the params on the sublist name: custpage_rs_<entity>_<subid>_<periodid>
		if (APP.Params.machine == null || APP.Params.machine == '') {
			return;
		}
		var a = APP.Params.machine.split('_'); // We only have one sublist so machine will always refer to it
		APP.Params.entity = a[2];
		APP.Params.subid = a[3];
		APP.Params.periodid = a[4];
	}

	function _RunValidation () {
		var validations = _GetValidations();
		var searchResult = [];
		var params = _GetValidationParams();
		for (var i = 0; i < validations.length; ++i) {
			var vResult = validations[i].Run(params);
			for (var j = 0; j < vResult.length; ++j) {
				var affectedLines = vResult[j].Lines ? vResult[j].Lines : '';
				var sublistRow = {
					id: vResult[j].Id,
					entity: vResult[j].Type,
					name: _CreateLink(vResult[j].Name, vResult[j].Link),
					rule: _ResMgr.GetString(vResult[j].RuleId, affectedLines),
				};
				searchResult.push(sublistRow);
			}
		}
		// Sort by transaction internal id
		searchResult.sort(SortByTranId);
		return searchResult;
	}

	function SortByTranId (a, b) {
		return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
	}

	function _CreateLink (text, url) {
		return '<a class="dottedlink" href="' + url + '" target="fldUrlWindow">' + text + '</a>';
	}

	function _GetValidations () {
		var entityType = _GetEntityType();
		var mx = new MX_Validation();
		if (entityType == 'all') {
			return [
				new mx.Vendor(),
				new mx.Employee(),
				new mx.Customer(),
				new mx.Partner(),
				new mx.Contact(),
				new mx.VendorBill(),
				new mx.VendorCredit(),
				new mx.ExpenseReport(),
				new mx.Check(),
			];
		}
		var entityValidation = {
			vendor: mx.Vendor,
			employee: mx.Employee,
			customer: mx.Customer,
			partner: mx.Partner,
			contact: mx.Contact,
			vendorbill: mx.VendorBill,
			vendorcredit: mx.VendorCredit,
			expensereport: mx.ExpenseReport,
			check: mx.Check,
		};
		return [new entityValidation[entityType]()];
	}

	function _ShowForm (searchResult) {
		var nsForm = nlapiCreateForm(_ResMgr.GetString('FORM_TITLE'));
		nsForm.setScript('customscript_mx_validation_tool_cs');
		_AddEntityCombobox(nsForm);
		if (IS_ONEWORLD) {
			_AddSubsidiaryCombobox(nsForm);
		}
		_AddPeriodCombobox(nsForm);
		var btnSubmit = nsForm.addSubmitButton(_ResMgr.GetString('LABEL_RUN'));
		var list = nsForm.addSubList(_GetSubListName(), 'staticlist', _ResMgr.GetString('LABEL_RUN'));
		list.addField('entity', 'text', _ResMgr.GetString('COL_RECORD_TYPE'));
		// list.addField("id", "text", "Id");
		list.addField('name', 'text', _ResMgr.GetString('COL_NAME'));
		list.addField('rule', 'text', _ResMgr.GetString('COL_RULE'));
		if (searchResult != null) {
			list.setLineItemValues(searchResult);
		}
		_Response.writePage(nsForm);
	}

	function _AddEntityCombobox (nsForm) {
		var cboEntity = nsForm.addField('entity', 'select', _ResMgr.GetString('LABEL_RECORD_TYPE'));
		cboEntity.setLayoutType('outsideabove');
		cboEntity.addSelectOption('all', _ResMgr.GetString('TYPE_ALL'));
		cboEntity.addSelectOption('vendorbill', _ResMgr.GetString('TYPE_VENDOR_BILL'));
		cboEntity.addSelectOption('vendorcredit', _ResMgr.GetString('TYPE_VENDOR_CREDIT'));
		cboEntity.addSelectOption('expensereport', _ResMgr.GetString('TYPE_EXPENSE_REPORT'));
		cboEntity.addSelectOption('check', _ResMgr.GetString('TYPE_CHECK'));
		cboEntity.addSelectOption('vendor', _ResMgr.GetString('TYPE_VENDOR'));
		cboEntity.addSelectOption('employee', _ResMgr.GetString('TYPE_EMPLOYEE'));
		cboEntity.addSelectOption('customer', _ResMgr.GetString('TYPE_CUSTOMER'));
		cboEntity.addSelectOption('partner', _ResMgr.GetString('TYPE_PARTNER'));
		cboEntity.addSelectOption('contact', _ResMgr.GetString('TYPE_CONTACT'));
		cboEntity.setDefaultValue(_GetEntityType());
	}

	function _AddSubsidiaryCombobox (nsForm) {
		var cboSubs = nsForm.addField('subid', 'select', _ResMgr.GetString('LABEL_SUBSIDIARY'));
		cboSubs.setLayoutType('outsideabove');
		cboSubs.addSelectOption('', _ResMgr.GetString('TYPE_ALL'));
		var mxSubs = _GetMexicoSubs();
		for (var i = 0; i < mxSubs.length; ++i) {
			cboSubs.addSelectOption(mxSubs[i].Id, mxSubs[i].Name);
		}
		cboSubs.setDefaultValue(_GetSubId());
	}

	function _AddPeriodCombobox (nsForm) {
		var cboPeriod = nsForm.addField('periodid', 'select', _ResMgr.GetString('LABEL_PERIOD'));
		cboPeriod.setLayoutType('outsideabove');
		cboPeriod.addSelectOption('', _ResMgr.GetString('TYPE_ALL'));
		var periodMgr = new SFC.System.PeriodMgr();
		var periodRoot = periodMgr.GetRootPeriod();
		_AddPeriodOption(periodRoot, cboPeriod);
		cboPeriod.setDisplaySize(180);
		cboPeriod.setDefaultValue(_GetPeriodId());
	}

	function _AddPeriodOption (node, cbo, prefix) {
		prefix = prefix === undefined ? '' : prefix;
		var objPeriod = node.GetObject();
		if (objPeriod != null) {
			if (objPeriod.GetEndDate() <= new Date()) // Display past periods only
			{
				cbo.addSelectOption(objPeriod.GetId(), prefix + objPeriod.GetName());
			}
		}
		var children = node.GetChildren();
		for (var i = 0; i < children.length; ++i) {
			_AddPeriodOption(children[i], cbo, objPeriod == null ? '' : prefix + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;');
		}
	}

	function _GetMexicoSubs () {
		if (!IS_ONEWORLD) {
			return [];
		}
		if (_GetMexicoSubs.Cache == null) {
			var filters = [
				new nlobjSearchFilter('country', null, 'is', 'MX'),
			];
			var columns = [
				new nlobjSearchColumn('name'),
			];
			var sr = nlapiSearchRecord('subsidiary', null, filters, columns);
			if (sr == null) {
				_GetMexicoSubs.Cache = [];
			}
			var subs = [];
			for (var i = 0; i < sr.length; ++i) {
				subs.push({Id: sr[i].getId(), Name: sr[i].getValue('name')});
			}
			_GetMexicoSubs.Cache = subs;
		}
		return _GetMexicoSubs.Cache;
	}
	_GetMexicoSubs.Cache = null;

	function _GetEntityType () {
		return APP.Params.entity == null ? 'all' : APP.Params.entity;
	}

	function _GetSubId () {
		return APP.Params.subid == null ? '' : APP.Params.subid;
	}

	function _GetPeriodId () {
		return APP.Params.periodid == null ? '' : APP.Params.periodid;
	}

	function _GetSubListName () {
		var name = ['custpage_rs'];
		name.push(_GetEntityType());
		name.push(_GetSubId());
		name.push(_GetPeriodId());
		return name.join('_');
	}

}

function MX_Validation () {
	var CONTEXT = nlapiGetContext();
	var IS_ONEWORLD = CONTEXT.getSetting('FEATURE', 'SUBSIDIARIES') == 'T';
	var FORMULA_COMPANY_RFC = 'REGEXP_INSTR(UPPER({custentity_mx_rfc}), \'^XEXX[ |\-]{0,1}010101[ |\-]{0,1}000$|^[A-Z&\u00D1]{3}[ |\-]{0,1}\\d{6}[ |\-]{0,1}[0-9A-Z&\u00D1]{3}$\')';
	var FORMULA_INDIVIDUAL_RFC = 'REGEXP_INSTR(UPPER({custentity_mx_rfc}), \'^[A-Z&\u00D1]{4}[ |\-]{0,1}\\d{6}[ |\-]{0,1}[0-9A-Z&\u00D1]{3}$\')';
	var _ResMgr = new ResourceMgr(CONTEXT.getPreference('LANGUAGE'));
	this.Vendor = _Vendor;
	this.Employee = _Employee;
	this.Customer = _Customer;
	this.Partner = _Partner;
	this.Contact = _Contact;
	this.VendorBill = _VendorBill;
	this.VendorCredit = _VendorCredit;
	this.ExpenseReport = _ExpenseReport;
	this.Check = _Check;

	function _Vendor () {
		var VENDOR_RULE = {
			RFC_REQUIRED: 'VDR_RFC_REQUIRED',
			RFC_VALID_INDIVIDUAL: 'VDR_RFC_VALID_IND',
			RFC_VALID_COMPANY: 'VDR_RFC_VALID_COMP',
		};
		this.Run = _Run;

		function _Run (params) {
			var result = [];
			_SearchEmptyRFC(params, result);
			_SearchInvalidIndividualRFC(params, result);
			_SearchInvalidCompanyRFC(params, result);
			return result;
		}

		function _ToObj (recId, recName, ruleId) {
			return {
				Type: _ResMgr.GetString('TYPE_VENDOR'),
				Id: parseInt(recId, 10),
				Name: recName,
				RuleId: ruleId,
				Link: nlapiResolveURL('RECORD', 'vendor', recId, 'EDIT') + '&whence=',
			};
		}

		function _SearchEmptyRFC (params, result) {
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isempty'),
				new nlobjSearchFilter('isdefaultbilling', null, 'is', 'T'),
				new nlobjSearchFilter('country', null, 'is', 'MX'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('entityid'),
			];
			var sr = nlapiSearchRecord('vendor', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				result.push(_ToObj(sr[i].getId(), sr[i].getValue('entityid'), VENDOR_RULE.RFC_REQUIRED));
			}
		}

		function _SearchInvalidIndividualRFC (params, result) {
			// Search all vendors with type = person and RFC NOT VALID for individuals
			var formulaSearchFilter = new nlobjSearchFilter('formulanumeric', null, 'equalto', 0);
			formulaSearchFilter.setFormula(FORMULA_INDIVIDUAL_RFC);
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isnotempty'),
				new nlobjSearchFilter('isperson', null, 'is', 'T'),
				formulaSearchFilter,
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('entityid'),
			];
			var sr = nlapiSearchRecord('vendor', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				result.push(_ToObj(sr[i].getId(), sr[i].getValue('entityid'), VENDOR_RULE.RFC_VALID_INDIVIDUAL));
			}
		}

		function _SearchInvalidCompanyRFC (params, result) {
			// Search all vendors with type = company and RFC NOT VALID for company
			var formulaSearchFilter = new nlobjSearchFilter('formulanumeric', null, 'equalto', 0);
			formulaSearchFilter.setFormula(FORMULA_COMPANY_RFC);
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isnotempty'),
				new nlobjSearchFilter('isperson', null, 'is', 'F'),
				formulaSearchFilter,
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('entityid'),
			];
			var sr = nlapiSearchRecord('vendor', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				result.push(_ToObj(sr[i].getId(), sr[i].getValue('entityid'), VENDOR_RULE.RFC_VALID_COMPANY));
			}
		}
	}

	function _Employee () {
		var EMPLOYEE_RULE = {
			RFC_REQUIRED: 'EMP_RFC_REQUIRED',
			RFC_VALID_INDIVIDUAL: 'EMP_RFC_VALID_IND',
		};
		this.Run = _Run;
		function _Run (params) {
			var result = [];
			_SearchEmptyRFC(params, result);
			_SearchInvalidIndividualRFC(params, result);
			return result;
		}

		function _ToObj (recId, recName, ruleId) {
			return {
				Type: _ResMgr.GetString('TYPE_EMPLOYEE'),
				Id: parseInt(recId, 10),
				Name: recName,
				RuleId: ruleId,
				Link: nlapiResolveURL('RECORD', 'employee', recId, 'EDIT') + '&whence=',
			};
		}

		function _SearchEmptyRFC (params, result) {
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isempty'),
				new nlobjSearchFilter('isdefaultshipping', null, 'is', 'T'),
				new nlobjSearchFilter('country', null, 'is', 'MX'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('entityid'),
			];
			var sr = nlapiSearchRecord('employee', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				result.push(_ToObj(sr[i].getId(), sr[i].getValue('entityid'), EMPLOYEE_RULE.RFC_REQUIRED));
			}
		}

		function _SearchInvalidIndividualRFC (params, result) {
			var formulaSearchFilter = new nlobjSearchFilter('formulanumeric', null, 'equalto', 0);
			formulaSearchFilter.setFormula(FORMULA_INDIVIDUAL_RFC);
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isnotempty'),
				formulaSearchFilter,
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('entityid'),
			];
			var sr = nlapiSearchRecord('employee', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				result.push(_ToObj(sr[i].getId(), sr[i].getValue('entityid'), EMPLOYEE_RULE.RFC_VALID_INDIVIDUAL));
			}
		}
	}

	function _Customer () {
		var CUSTOMER_RULE = {
			RFC_REQUIRED: 'CUS_RFC_REQUIRED',
			RFC_VALID_INDIVIDUAL: 'CUS_RFC_VALID_IND',
			RFC_VALID_COMPANY: 'CUS_RFC_VALID_COMP',
		};
		this.Run = _Run;

		function _Run (params) {
			var result = [];
			_SearchEmptyRFC(params, result);
			_SearchInvalidIndividualRFC(params, result);
			_SearchInvalidCompanyRFC(params, result);
			return result;
		}

		function _ToObj (recId, recName, ruleId) {
			return {
				Type: _ResMgr.GetString('TYPE_CUSTOMER'),
				Id: parseInt(recId, 10),
				Name: recName,
				RuleId: ruleId,
				Link: nlapiResolveURL('RECORD', 'customer', recId, 'EDIT') + '&whence=',
			};
		}

		function _SearchEmptyRFC (params, result) {
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isempty'),
				new nlobjSearchFilter('isdefaultbilling', null, 'is', 'T'),
				new nlobjSearchFilter('country', null, 'is', 'MX'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('isperson'),
				new nlobjSearchColumn('firstname'),
				new nlobjSearchColumn('lastname'),
				new nlobjSearchColumn('companyname'),
			];
			var sr = nlapiSearchRecord('customer', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var name = sr[i].getValue('isperson') == 'T'
					? _IsNull(sr[i].getValue('firstname'), '') + ' ' + _IsNull(sr[i].getValue('lastname'), '')
					: _IsNull(sr[i].getValue('companyname'), 'null');
				result.push(_ToObj(sr[i].getId(), name, CUSTOMER_RULE.RFC_REQUIRED));
			}
		}

		function _SearchInvalidIndividualRFC (params, result) {
			var formulaSearchFilter = new nlobjSearchFilter('formulanumeric', null, 'equalto', 0);
			formulaSearchFilter.setFormula(FORMULA_INDIVIDUAL_RFC);
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isnotempty'),
				new nlobjSearchFilter('isperson', null, 'is', 'T'),
				formulaSearchFilter,
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('isperson'),
				new nlobjSearchColumn('firstname'),
				new nlobjSearchColumn('lastname'),
				new nlobjSearchColumn('companyname'),
			];
			var sr = nlapiSearchRecord('customer', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var name = sr[i].getValue('isperson') == 'T'
					? _IsNull(sr[i].getValue('firstname'), '') + ' ' + _IsNull(sr[i].getValue('lastname'), '')
					: _IsNull(sr[i].getValue('companyname'), 'null');
				result.push(_ToObj(sr[i].getId(), name, CUSTOMER_RULE.RFC_VALID_INDIVIDUAL));
			}
		}

		function _SearchInvalidCompanyRFC (params, result) {
			var formulaSearchFilter = new nlobjSearchFilter('formulanumeric', null, 'equalto', 0);
			formulaSearchFilter.setFormula(FORMULA_COMPANY_RFC);
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isnotempty'),
				new nlobjSearchFilter('isperson', null, 'is', 'F'),
				formulaSearchFilter,
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('isperson'),
				new nlobjSearchColumn('firstname'),
				new nlobjSearchColumn('lastname'),
				new nlobjSearchColumn('companyname'),
			];
			var sr = nlapiSearchRecord('customer', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var name = sr[i].getValue('isperson') == 'T'
					? _IsNull(sr[i].getValue('firstname'), '') + ' ' + _IsNull(sr[i].getValue('lastname'), '')
					: _IsNull(sr[i].getValue('companyname'), 'null');
				result.push(_ToObj(sr[i].getId(), name, CUSTOMER_RULE.RFC_VALID_COMPANY));
			}
		}

		function _IsNull (value, nullValue) {
			if (value == null || value == '') {
				return nullValue;
			}
			return value;
		}

	}

	function _Partner () {
		var PARTNER_RULE = {
			RFC_REQUIRED: 'PRT_RFC_REQUIRED',
			RFC_VALID_INDIVIDUAL: 'PRT_RFC_VALID_IND',
			RFC_VALID_COMPANY: 'PRT_RFC_VALID_COMP',
		};
		this.Run = _Run;

		function _Run (params) {
			var result = [];
			_SearchEmptyRFC(params, result);
			_SearchInvalidIndividualRFC(params, result);
			_SearchInvalidCompanyRFC(params, result);
			return result;
		}

		function _ToObj (recId, recName, ruleId) {
			return {
				Type: _ResMgr.GetString('TYPE_PARTNER'),
				Id: parseInt(recId, 10),
				Name: recName,
				RuleId: ruleId,
				Link: nlapiResolveURL('RECORD', 'partner', recId, 'EDIT') + '&whence=',
			};
		}

		function _SearchEmptyRFC (params, result) {
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isempty'),
				new nlobjSearchFilter('isdefaultbilling', null, 'is', 'T'),
				new nlobjSearchFilter('country', null, 'is', 'MX'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('internalid'),
				new nlobjSearchColumn('isperson'),
				new nlobjSearchColumn('firstname'),
				new nlobjSearchColumn('lastname'),
				new nlobjSearchColumn('companyname'),
			];

			var partners = _SearchWrapper('partner', filters, columns);
			var keys = Object.keys(partners);

			if (keys.length < 1) {
				return;
			}

			for (var i in keys) {
				var name = partners[keys[i]]['isperson'] == 'T' ? partners[keys[i]]['firstname'] + ' ' + partners[keys[i]]['lastname'] : partners[keys[i]]['companyname'];
				result.push(_ToObj(partners[keys[i]]['internalid'], name, PARTNER_RULE.RFC_REQUIRED));
			}
		}

		function _SearchInvalidIndividualRFC (params, result) {
			var formulaSearchFilter = new nlobjSearchFilter('formulanumeric', null, 'equalto', 0);
			formulaSearchFilter.setFormula(FORMULA_INDIVIDUAL_RFC);
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isnotempty'),
				new nlobjSearchFilter('isperson', null, 'is', 'T'),
				formulaSearchFilter,
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('internalid'),
				new nlobjSearchColumn('firstname'),
				new nlobjSearchColumn('lastname'),
			];

			var partners = _SearchWrapper('partner', filters, columns);
			var keys = Object.keys(partners);

			if (keys.length < 1) {
				return;
			}

			for (var i in keys) {
				result.push(_ToObj(partners[keys[i]]['internalid'], partners[keys[i]]['firstname'] + ' ' + partners[keys[i]]['lastname'], PARTNER_RULE.RFC_VALID_INDIVIDUAL));
			}
		}

		function _SearchInvalidCompanyRFC (params, result) {
			var formulaSearchFilter = new nlobjSearchFilter('formulanumeric', null, 'equalto', 0);
			formulaSearchFilter.setFormula(FORMULA_COMPANY_RFC);
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isnotempty'),
				new nlobjSearchFilter('isperson', null, 'is', 'F'),
				formulaSearchFilter,
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('internalid'),
				new nlobjSearchColumn('companyname'),
			];

			var partners = _SearchWrapper('partner', filters, columns);
			var keys = Object.keys(partners);

			if (keys.length < 1) {
				return;
			}

			for (var i in keys) {
				result.push(_ToObj(partners[keys[i]]['internalid'], partners[keys[i]]['companyname'], PARTNER_RULE.RFC_VALID_COMPANY));
			}
		}
	}

	function _Contact () {
		var CONTACT_RULE = {
			RFC_REQUIRED: 'CON_RFC_REQUIRED',
			RFC_VALID_INDIVIDUAL: 'CON_RFC_VALID_IND',
		};
		this.Run = _Run;
		function _Run (params) {
			var result = [];
			_SearchEmptyRFC(params, result);
			_SearchInvalidIndividualRFC(params, result);
			return result;
		}

		function _ToObj (recId, recName, ruleId) {
			return {
				Type: _ResMgr.GetString('TYPE_CONTACT'),
				Id: parseInt(recId, 10),
				Name: recName,
				RuleId: ruleId,
				Link: nlapiResolveURL('RECORD', 'contact', recId, 'EDIT') + '&whence=',
			};
		}

		function _SearchEmptyRFC (params, result) {
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isempty'),
				new nlobjSearchFilter('isdefaultbilling', null, 'is', 'T'),
				new nlobjSearchFilter('country', null, 'is', 'MX'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('internalid'),
				new nlobjSearchColumn('entityid'),
			];

			var contacts = _SearchWrapper('contact', filters, columns);
			var keys = Object.keys(contacts);

			if (keys.length < 1) {
				return;
			}

			for (var i in keys) {
				result.push(_ToObj(contacts[keys[i]]['internalid'], contacts[keys[i]]['entityid'], CONTACT_RULE.RFC_REQUIRED));
			}
		}

		function _SearchInvalidIndividualRFC (params, result) {
			var formulaSearchFilter = new nlobjSearchFilter('formulanumeric', null, 'equalto', 0);
			formulaSearchFilter.setFormula(FORMULA_INDIVIDUAL_RFC);
			var filters = [
				new nlobjSearchFilter('custentity_mx_rfc', null, 'isnotempty'),
				formulaSearchFilter,
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			var columns = [
				new nlobjSearchColumn('internalid'),
				new nlobjSearchColumn('entityid'),
			];

			var contacts = _SearchWrapper('contact', filters, columns);
			var keys = Object.keys(contacts);

			if (keys.length < 1) {
				return;
			}

			for (var i in keys) {
				result.push(_ToObj(contacts[keys[i]]['internalid'], contacts[keys[i]]['entityid'], CONTACT_RULE.RFC_VALID_INDIVIDUAL));
			}
		}
	}

	function _Check () {
		/*
		Check payee can be vendor or employee or other entities.
		For validation purposes, only vendor and employee are checked.
		*/
		var RULE = {
			OPTYPE_REQUIRED: 'CHK_OPTYPE_REQUIRED',
			TAXCODE_VALID_IMPORT: 'TRN_TC_IMPORT',
			TAXCODE_VALID_LOCAL: 'TRN_TC_LOCAL',
			TAXCODE_VALID_IMPORT_EMP: 'TRN_EMPTC_IMPORT',
			TAXCODE_VALID_LOCAL_EMP: 'TRN_EMPTC_LOCAL',
			TAXCODE_VALID_IMPORT_CUS: 'TRN_CUSTC_IMPORT',
			TAXCODE_VALID_LOCAL_CUS: 'TRN_CUSTC_LOCAL',
		};
		this.Run = _Run;

		function _Run (params) {
			var result = [];
			_SearchEmptyOperationType(params, result);
			_SearchVendorInvalidImportTaxCodes(params, result);
			_SearchVendorInvalidLocalTaxCodes(params, result);
			_SearchVendorInvalidImportTaxCodesWithNoAddress(params, result);
			_SearchEmployeeInvalidImportTaxCodes(params, result);
			_SearchEmployeeInvalidLocalTaxCodes(params, result);
			_SearchEmployeeInvalidImportTaxCodesWithNoAddress(params, result);
			// _SearchCustomerInvalidImportTaxCodes(params, result);
			// _SearchCustomerInvalidLocalTaxCodes(params, result);
			// _SearchCustomerInvalidImportTaxCodesWithNoAddress(params, result)
			return result;
		}

		function _ToObj (recId, recName, ruleId) {
			return {
				Type: _ResMgr.GetString('TYPE_CHECK'),
				Id: parseInt(recId, 10),
				Name: recName,
				RuleId: ruleId,
				Link: nlapiResolveURL('RECORD', 'check', recId, 'EDIT') + '&whence=',
			};
		}

		function _SearchEmptyOperationType (params, result) {
			var filters = [
				new nlobjSearchFilter('custbody_mx_operation_type', null, 'is', '@NONE@'),
				new nlobjSearchFilter('mainline', null, 'is', 'T'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var sr = nlapiSearchRecord('check', null, filters, null);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var tranName = 'Cheque #' + sr[i].getId();
				result.push(_ToObj(sr[i].getId(), tranName, RULE.OPTYPE_REQUIRED));
			}
		}

		function _SearchVendorInvalidImportTaxCodes (params, result) {
			var importTIDs = _GetImportTaxIds();
			if (importTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('taxitem', null, 'anyof', importTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
				new nlobjSearchFilter('internalid', 'vendor', 'noneof', '@NONE@'),
				new nlobjSearchFilter('isdefaultbilling', 'vendor', 'is', 'T'),
				new nlobjSearchFilter('country', 'vendor', 'is', 'MX'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP').setSort(true),
			];
			var sr = nlapiSearchRecord('check', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Cheque #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_LOCAL));
			}
		}

		function _SearchVendorInvalidLocalTaxCodes (params, result) {
			var localTIDs = _GetLocalTaxIds();
			if (localTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('taxitem', null, 'anyof', localTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
				new nlobjSearchFilter('internalid', 'vendor', 'noneof', '@NONE@'),
				new nlobjSearchFilter('isdefaultbilling', 'vendor', 'is', 'T'),
				new nlobjSearchFilter('country', 'vendor', 'noneof', ['MX', '@NONE@']),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP').setSort(true),
			];
			var sr = nlapiSearchRecord('check', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Cheque #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_IMPORT));
			}
		}

		function _SearchVendorInvalidImportTaxCodesWithNoAddress (params, result) {
			var importTIDs = _GetImportTaxIds();
			if (importTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('taxitem', null, 'anyof', importTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
				new nlobjSearchFilter('internalid', 'vendor', 'noneof', '@NONE@'),
				new nlobjSearchFilter('address', 'vendor', 'isempty'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP').setSort(true),
			];
			var sr = nlapiSearchRecord('check', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Cheque #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_LOCAL));
			}
		}

		function _SearchEmployeeInvalidImportTaxCodes (params, result) {
			var importTIDs = _GetImportTaxIds();
			if (importTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('taxitem', null, 'anyof', importTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
				new nlobjSearchFilter('internalid', 'employee', 'noneof', '@NONE@'),
				new nlobjSearchFilter('isdefaultshipping', 'employee', 'is', 'T'),
				new nlobjSearchFilter('country', 'employee', 'is', 'MX'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP').setSort(true),
			];
			var sr = nlapiSearchRecord('check', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Cheque #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_LOCAL_EMP));
			}
		}

		function _SearchEmployeeInvalidLocalTaxCodes (params, result) {
			var localTIDs = _GetLocalTaxIds();
			if (localTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('taxitem', null, 'anyof', localTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
				new nlobjSearchFilter('internalid', 'employee', 'noneof', '@NONE@'),
				new nlobjSearchFilter('isdefaultshipping', 'employee', 'is', 'T'),
				new nlobjSearchFilter('country', 'employee', 'noneof', ['MX', '@NONE@']),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP').setSort(true),
			];
			var sr = nlapiSearchRecord('check', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Cheque #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_IMPORT_EMP));
			}
		}

		function _SearchEmployeeInvalidImportTaxCodesWithNoAddress (params, result) {
			var importTIDs = _GetImportTaxIds();
			if (importTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('taxitem', null, 'anyof', importTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
				new nlobjSearchFilter('internalid', 'employee', 'noneof', '@NONE@'),
				new nlobjSearchFilter('address', 'employee', 'isempty'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP').setSort(true),
			];
			var sr = nlapiSearchRecord('check', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Cheque #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_LOCAL_EMP));
			}
		}

		function _SearchCustomerInvalidImportTaxCodes (params, result) {
			var importTIDs = _GetImportTaxIds();
			if (importTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('taxitem', null, 'anyof', importTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
				new nlobjSearchFilter('internalid', 'customer', 'noneof', '@NONE@'),
				new nlobjSearchFilter('isdefaultbilling', 'customer', 'is', 'T'),
				new nlobjSearchFilter('country', 'customer', 'is', 'MX'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP').setSort(true),
			];
			var sr = nlapiSearchRecord('check', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Cheque #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_LOCAL_CUS));
			}
		}

		function _SearchCustomerInvalidLocalTaxCodes (params, result) {
			var localTIDs = _GetLocalTaxIds();
			if (localTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('taxitem', null, 'anyof', localTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
				new nlobjSearchFilter('internalid', 'customer', 'noneof', '@NONE@'),
				new nlobjSearchFilter('isdefaultbilling', 'customer', 'is', 'T'),
				new nlobjSearchFilter('country', 'customer', 'noneof', ['MX', '@NONE@']),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP').setSort(true),
			];
			var sr = nlapiSearchRecord('check', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Cheque #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_IMPORT_CUS));
			}
		}

		function _SearchCustomerInvalidImportTaxCodesWithNoAddress (params, result) {
			var importTIDs = _GetImportTaxIds();
			if (importTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('taxitem', null, 'anyof', importTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
				new nlobjSearchFilter('internalid', 'customer', 'noneof', '@NONE@'),
				new nlobjSearchFilter('address', 'customer', 'isempty'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP').setSort(true),
			];
			var sr = nlapiSearchRecord('check', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Cheque #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_LOCAL_CUS));
			}
		}
	}

	function _VendorBill () {
		var RULE = {
			OPTYPE_REQUIRED: 'VBL_OPTYPE_REQUIRED',
			TAXCODE_VALID_IMPORT: 'TRN_TC_IMPORT',
			TAXCODE_VALID_LOCAL: 'TRN_TC_LOCAL',
		};
		this.Run = _Run;

		function _Run (params) {
			var result = [];
			_SearchEmptyOperationType(params, result);
			_SearchInvalidImportTaxCodesByBillingCountry(params, result);
			_SearchInvalidLocalTaxCodesByBillingCountry(params, result);
			_SearchInvalidImportTaxCodesByNoAddress(params, result);
			return result;
		}

		function _ToObj (recId, recName, ruleId) {
			return {
				Type: _ResMgr.GetString('TYPE_VENDOR_BILL'),
				Id: parseInt(recId, 10),
				Name: recName,
				RuleId: ruleId,
				Link: nlapiResolveURL('RECORD', 'vendorbill', recId, 'EDIT') + '&whence=',
			};
		}

		function _SearchEmptyOperationType (params, result) {
			var filters = [
				new nlobjSearchFilter('custbody_mx_operation_type', null, 'is', '@NONE@'),
				new nlobjSearchFilter('mainline', null, 'is', 'T'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var sr = nlapiSearchRecord('vendorbill', null, filters, null);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var tranName = 'Bill #' + sr[i].getId();
				result.push(_ToObj(sr[i].getId(), tranName, RULE.OPTYPE_REQUIRED));
			}
		}

		function _SearchInvalidImportTaxCodesByBillingCountry (params, result) {
			// RULE: Local vendors should not use import tax codes.
			var importTIDs = _GetImportTaxIds();
			if (importTIDs.length == 0) // account has no import tax codes or groups?
			{
				return;
			}
			var filters = [
				new nlobjSearchFilter('isdefaultbilling', 'vendor', 'is', 'T'),
				new nlobjSearchFilter('country', 'vendor', 'is', 'MX'),
				new nlobjSearchFilter('taxitem', null, 'anyof', importTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP'),
			];
			var sr = nlapiSearchRecord('vendorbill', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Bill #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_LOCAL));
			}
		}

		function _SearchInvalidLocalTaxCodesByBillingCountry (params, result) {
			// RULE: Foreign vendors should not use local tax codes.
			var localTIDs = _GetLocalTaxIds();
			if (localTIDs.length == 0) // account has no local tax codes or groups?
			{
				return;
			}
			var filters = [
				new nlobjSearchFilter('isdefaultbilling', 'vendor', 'is', 'T'),
				new nlobjSearchFilter('country', 'vendor', 'noneof', ['MX', '@NONE@']),
				new nlobjSearchFilter('taxitem', null, 'anyof', localTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP'),
			];
			var sr = nlapiSearchRecord('vendorbill', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Bill #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_IMPORT));
			}
		}

		function _SearchInvalidImportTaxCodesByNoAddress (params, result) {
			var importTIDs = _GetImportTaxIds();
			if (importTIDs.length == 0) // account has no import tax codes or groups?
			{
				return;
			}
			var filters = [
				new nlobjSearchFilter('address', 'vendor', 'isempty'),
				new nlobjSearchFilter('taxitem', null, 'anyof', importTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP'),
			];
			var sr = nlapiSearchRecord('vendorbill', null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Bill #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_LOCAL));
			}
		}

	}

	function _VendorCredit () {
		var RECORD = {
			ID: 'vendorcredit',
			NAME: _ResMgr.GetString('TYPE_VENDOR_CREDIT'),
		};
		var RULE = {
			OPTYPE_REQUIRED: 'VCR_OPTYPE_REQUIRED',
			TAXCODE_VALID_IMPORT: 'TRN_TC_IMPORT',
			TAXCODE_VALID_LOCAL: 'TRN_TC_LOCAL',
		};
		this.Run = _Run;

		function _Run (params) {
			var result = [];
			_SearchEmptyOperationType(params, result);
			_SearchInvalidImportTaxCodesByBillingCountry(params, result);
			_SearchInvalidLocalTaxCodesByBillingCountry(params, result);
			_SearchInvalidImportTaxCodesByNoAddress(params, result);
			return result;
		}

		function _ToObj (recId, recName, ruleId) {
			return {
				Type: RECORD.NAME,
				Id: parseInt(recId, 10),
				Name: recName,
				RuleId: ruleId,
				Link: nlapiResolveURL('RECORD', RECORD.ID, recId, 'EDIT') + '&whence=',
			};
		}

		function _SearchEmptyOperationType (params, result) {
			var filters = [
				new nlobjSearchFilter('custbody_mx_operation_type', null, 'is', '@NONE@'),
				new nlobjSearchFilter('mainline', null, 'is', 'T'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var sr = nlapiSearchRecord(RECORD.ID, null, filters, null);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var tranName = 'Bill Credit #' + sr[i].getId();
				result.push(_ToObj(sr[i].getId(), tranName, RULE.OPTYPE_REQUIRED));
			}
		}

		function _SearchInvalidImportTaxCodesByBillingCountry (params, result) {
			var importTIDs = _GetImportTaxIds();
			if (importTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('isdefaultbilling', 'vendor', 'is', 'T'),
				new nlobjSearchFilter('country', 'vendor', 'is', 'MX'),
				new nlobjSearchFilter('taxitem', null, 'anyof', importTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP'),
			];
			var sr = nlapiSearchRecord(RECORD.ID, null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Bill Credit #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_LOCAL));
			}
		}

		function _SearchInvalidLocalTaxCodesByBillingCountry (params, result) {
			var localTIDs = _GetLocalTaxIds();
			if (localTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('isdefaultbilling', 'vendor', 'is', 'T'),
				new nlobjSearchFilter('country', 'vendor', 'noneof', ['MX', '@NONE@']),
				new nlobjSearchFilter('taxitem', null, 'anyof', localTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP'),
			];
			var sr = nlapiSearchRecord(RECORD.ID, null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Bill Credit #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_IMPORT));
			}
		}

		function _SearchInvalidImportTaxCodesByNoAddress (params, result) {
			var importTIDs = _GetImportTaxIds();
			if (importTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('address', 'vendor', 'isempty'),
				new nlobjSearchFilter('taxitem', null, 'anyof', importTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP'),
			];
			var sr = nlapiSearchRecord(RECORD.ID, null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Bill Credit #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_LOCAL));
			}
		}

	}

	function _ExpenseReport () {
		var RECORD = {
			ID: 'expensereport',
			NAME: _ResMgr.GetString('TYPE_EXPENSE_REPORT'),
		};
		var RULE = {
			OPTYPE_REQUIRED: 'XRP_OPTYPE_REQUIRED',
			TAXCODE_VALID_IMPORT: 'TRN_EMPTC_IMPORT',
			TAXCODE_VALID_LOCAL: 'TRN_EMPTC_LOCAL',
			VENDOR_MISSING: 'XRP_MISSING_VENDOR',
			OPTYPE_INVALID: 'XRP_INVALID_OPTYPE',
		};
		this.Run = _Run;

		function _Run (params) {
			var result = [];
			_SearchEmptyOperationType(params, result);
			_SearchInvalidLineLevelOperationType(params, result);
			_SearchInvalidImportTaxCodesByBillingCountry(params, result);
			_SearchInvalidLocalTaxCodesByBillingCountry(params, result);
			_SearchInvalidImportTaxCodesByNoAddress(params, result);
			_SearchNoVendor(params, result);
			return result;
		}

		function _ToObj (recId, recName, ruleId, lines) {
			return {
				Type: RECORD.NAME,
				Id: parseInt(recId, 10),
				Name: recName,
				RuleId: ruleId,
				Link: nlapiResolveURL('RECORD', RECORD.ID, recId, 'EDIT') + '&whence=',
				Lines: lines,
			};
		}

		function _SearchEmptyOperationType (params, result) {

			var columns = [
				new nlobjSearchColumn('internalid'),
			];

			var filters = [
				new nlobjSearchFilter('custbody_mx_operation_type', null, 'is', '@NONE@'),
				new nlobjSearchFilter('custcol_mx_operation_type', null, 'is', '@NONE@'),
				new nlobjSearchFilter('mainline', null, 'is', 'F'),
				new nlobjSearchFilter('taxline', null, 'is', 'F'),
			];

			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);

			var expenseReports = _SearchWrapper(RECORD.ID, filters, columns);
			var expenseReportIds = [];
			var keys = Object.keys(expenseReports);
			for (var i = 0; i < keys.length; i++) {
				var expenseId = expenseReports[keys[i]]['internalid'];
				if (expenseReportIds.indexOf(expenseId) < 0) {
					expenseReportIds.push(expenseId);
				}
			}

			for (var i = 0; i < expenseReportIds.length; ++i) {
				var tranName = 'Expense Report #' + expenseReportIds[i];
				result.push(_ToObj(expenseReportIds[i], tranName, RULE.OPTYPE_REQUIRED));
			}

		}

		function _SearchInvalidLineLevelOperationType (params, result) {
			var filters = [
				new nlobjSearchFilter('custbody_mx_invalid_operation_types', null, 'isnot', ''),
				new nlobjSearchFilter('mainline', null, 'is', 'T'),
			];
			var columns = [
				new nlobjSearchColumn('internalid'),
				new nlobjSearchColumn('custbody_mx_invalid_operation_types'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);

			var expenseReports = _SearchWrapper(RECORD.ID, filters, columns);
			var keys = Object.keys(expenseReports);

			for (var i = 0; i < keys.length; ++i) {
				var invalidOpTypes = expenseReports[keys[i]]['custbody_mx_invalid_operation_types'];
				var tranName = 'Expense Report #' + expenseReports[keys[i]]['internalid'];
				result.push(_ToObj(expenseReports[keys[i]]['internalid'], tranName, RULE.OPTYPE_INVALID, {INVALID_OPTYPES: invalidOpTypes}));
			}
		}

		function _SearchInvalidImportTaxCodesByBillingCountry (params, result) {
			var importTIDs = _GetImportTaxIds();
			if (importTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('isdefaultbilling', 'employee', 'is', 'T'),
				new nlobjSearchFilter('country', 'employee', 'is', 'MX'),
				new nlobjSearchFilter('taxitem', null, 'anyof', importTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP'),
			];
			var sr = nlapiSearchRecord(RECORD.ID, null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Expense Report #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_LOCAL));
			}
		}

		function _SearchInvalidLocalTaxCodesByBillingCountry (params, result) {
			var localTIDs = _GetLocalTaxIds();
			if (localTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('isdefaultbilling', 'employee', 'is', 'T'),
				new nlobjSearchFilter('country', 'employee', 'noneof', ['MX', '@NONE@']),
				new nlobjSearchFilter('taxitem', null, 'anyof', localTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP'),
			];
			var sr = nlapiSearchRecord(RECORD.ID, null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Expense Report #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_IMPORT));
			}
		}

		function _SearchInvalidImportTaxCodesByNoAddress (params, result) {
			var importTIDs = _GetImportTaxIds();
			if (importTIDs.length == 0) {
				return;
			}
			var filters = [
				new nlobjSearchFilter('address', 'employee', 'isempty'),
				new nlobjSearchFilter('taxitem', null, 'anyof', importTIDs),
				new nlobjSearchFilter('taxrate', null, 'greaterthan', 0),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'GROUP'),
			];
			var sr = nlapiSearchRecord(RECORD.ID, null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var iid = sr[i].getValue('internalid', null, 'GROUP');
				var tranName = 'Expense Report #' + iid;
				result.push(_ToObj(iid, tranName, RULE.TAXCODE_VALID_LOCAL));
			}
		}

		function _SearchNoVendor (params, result) {
			var filters = [
				new nlobjSearchFilter('mainline', null, 'is', 'F'),
				new nlobjSearchFilter('taxline', null, 'is', 'F'),
			];
			_AddSubsidiaryFilter(filters, params.SubIds);
			_AddTransactionPeriodFilter(filters, params.Period);
			var columns = [
				new nlobjSearchColumn('internalid', null, 'group'),
				new nlobjSearchColumn('custcol_mx_vendor', null, 'group'),
			];
			var sr = nlapiSearchRecord(RECORD.ID, null, filters, columns);
			if (sr == null) {
				return;
			}
			for (var i = 0; i < sr.length; ++i) {
				var vendorColumnValue = sr[i].getValue('custcol_mx_vendor', null, 'group');
				if (vendorColumnValue == '') {
					var iid = sr[i].getValue('internalid', null, 'group');
					var tranName = 'Expense Report #' + iid;
					result.push(_ToObj(iid, tranName, RULE.VENDOR_MISSING));
				}
			}
		}

	}

	function _GetImportTaxCodes () {
		if (_GetImportTaxCodes.Cache == null) {
			_GetImportTaxCodes.Cache = [];
			var filters = [
				new nlobjSearchFilter('custrecord_4110_import', null, 'is', 'T'),
			];
			if (IS_ONEWORLD) {
				filters.push(new nlobjSearchFilter('country', null, 'is', 'MX'));
			}
			var columns = null;
			var sr = nlapiSearchRecord('salestaxitem', null, filters, columns);
			if (sr != null) {
				for (var i = 0; i < sr.length; ++i) {
					_GetImportTaxCodes.Cache.push(sr[i].getId());
				}
			}
		}
		return _GetImportTaxCodes.Cache;
	}
	_GetImportTaxCodes.Cache = null;

	function _GetLocalTaxCodes () {
		if (_GetLocalTaxCodes.Cache == null) {
			_GetLocalTaxCodes.Cache = [];
			var filters = [
				new nlobjSearchFilter('custrecord_4110_import', null, 'is', 'F'),
			];
			if (IS_ONEWORLD) {
				filters.push(new nlobjSearchFilter('country', null, 'is', 'MX'));
			}
			var columns = null;
			var sr = nlapiSearchRecord('salestaxitem', null, filters, columns);
			if (sr != null) {
				for (var i = 0; i < sr.length; ++i) {
					_GetLocalTaxCodes.Cache.push(sr[i].getId());
				}
			}
		}
		return _GetLocalTaxCodes.Cache;
	}
	_GetLocalTaxCodes.Cache = null;

	function _IsImportTaxcode (taxCodeId) {
		var importTaxCodes = _GetImportTaxCodes();
		for (var i = 0; i < importTaxCodes.length; ++i) {
			if (importTaxCodes[i] == taxCodeId) {
				return true;
			}
		}
		return false;
	}

	function _GetMexicoTaxGroups () {
		if (_GetMexicoTaxGroups.Cache == null) {
			var filters = null;
			if (IS_ONEWORLD) {
				filters = [new nlobjSearchFilter('country', null, 'is', 'MX')];
			}
			var columns = null;
			var sr = nlapiSearchRecord('taxgroup', null, filters, columns);
			if (sr == null) {
				return _GetMexicoTaxGroups.Cache = {};
			}
			var taxGroups = {};
			for (var i = 0; i < sr.length; ++i) {
				var taxGroup = {HasLocal: false, HasImport: false};
				var id = sr[i].getId();
				var rec = nlapiLoadRecord('taxgroup', id);
				var taxCodeCount = rec.getLineItemCount('taxitem');
				for (var j = 1; j <= taxCodeCount; ++j) {
					var taxCodeId = rec.getLineItemValue('taxitem', 'taxname', j);
					if (taxCodeId != null) {
						var taxRate = parseFloat(rec.getLineItemValue('taxitem', 'rate', j));
						if (!isNaN(taxRate) && taxRate > 0) {
							if (_IsImportTaxcode(taxCodeId)) {
								taxGroup.HasImport = true;
							}
							else {
								taxGroup.HasLocal = true;
							}
							if (taxGroup.HasImport && taxGroup.HasLocal) // No point going through all tax codes.
							{
								break;
							}
						}
					}
				}
				taxGroups[id] = taxGroup;
			}
			_GetMexicoTaxGroups.Cache = taxGroups;
		}
		return _GetMexicoTaxGroups.Cache;
	}
	_GetMexicoTaxGroups.Cache = null;

	function _GetImportTaxGroups () {
		var taxGroups = _GetMexicoTaxGroups();
		var tg = [];
		for (var i in taxGroups) {
			if (taxGroups[i].HasImport && !taxGroups[i].HasLocal) {
				tg.push(i);
			}
		}
		return tg;
	}

	function _GetLocalTaxGroups () {
		var taxGroups = _GetMexicoTaxGroups();
		var tg = [];
		for (var i in taxGroups) {
			if (taxGroups[i].HasLocal && !taxGroups[i].HasImport) {
				tg.push(i);
			}
		}
		return tg;
	}

	function _GetImportTaxIds () {
		// Get import tax codes
		var taxCodes = _GetImportTaxCodes();
		var taxGroups = _GetImportTaxGroups();
		return taxCodes.concat(taxGroups);
	}

	function _GetLocalTaxIds () {
		// Get import tax codes
		var taxCodes = _GetLocalTaxCodes();
		var taxGroups = _GetLocalTaxGroups();
		return taxCodes.concat(taxGroups);
	}

	function _AddTransactionPeriodFilter (filters, objPeriod, joinTable) {
		if (objPeriod == null) {
			return;
		}
		if (joinTable === undefined) {
			joinTable = null;
		}
		if (objPeriod.GetStartDate() != null) {
			filters.push(new nlobjSearchFilter('trandate', joinTable, 'onorafter', objPeriod.GetStartDate()));
		}
		if (objPeriod.GetEndDate() != null) {
			filters.push(new nlobjSearchFilter('trandate', joinTable, 'onorbefore', objPeriod.GetEndDate()));
		}
	}

	function _AddSubsidiaryFilter (filters, subIds, joinTable) {
		if (joinTable === undefined) {
			joinTable = null;
		}
		if (IS_ONEWORLD && subIds != null && subIds.length > 0) {
			filters.push(new nlobjSearchFilter('subsidiary', joinTable, 'anyof', subIds));
		}
	}

	function _SearchWrapper (record, filters, columns) {
		var search = nlapiCreateSearch(record, filters, columns);
		var searchResult = search.runSearch();
		var result = {};
		var start = 0;
		var batchResult = [];

		do {
			batchResult = searchResult.getResults(start, start + 1000);
			for (var i = start; i < batchResult.length + start; i++) {
				result[i] = {};
				for (var j = 0; j < columns.length; j++) {
					var columnName = columns[j].getName();
					result[i][columnName] = batchResult[i].getValue(columnName);
				}
			}
			start += 1000;
		} while (batchResult.length > 0);

		return result;
	}

}
