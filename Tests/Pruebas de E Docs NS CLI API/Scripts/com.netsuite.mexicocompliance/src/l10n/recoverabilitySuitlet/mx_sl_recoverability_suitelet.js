/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope Public
 */
 
define([
	'N/log',
	'N/record',
	'N/render',
	'N/ui/serverWidget',
	'N/search',
	'N/file',
	'N/https',
	'./../../common/constants',
	'./../../electronicInvoicing/installation/EIComponents',	
	'./../../electronicPayments/installation/EPComponents',
	'./../../translations/translator',
], function (log, record, render, serverWidget, search, file, https,constants, EIComponents, EPComponents, translator) {
 
	var TEMPLATE_FILE = 'mx_suitelet-html.ftl';
	var CLIENT_SCRIPT_FILE = 'list-cs.js';
	var CUSTOM_RECORD_TYPE = constants.RECORD_TYPE.MX_L10N_COMPONENT;
	var CUSTOM_RECORD_FIELDS = {
		status: constants.FIELD.MX_L10N_STATUS,
		targetSuiteApp: constants.FIELD.MX_L10N_CORE_SUITEAPP,
		details: constants.FIELD.MX_L10N_DETAILS,
		templateFileId : constants.FIELD.MX_L10N_FILE,
		updateTemplateFileId : constants.FIELD.MX_L10N_UPDATE_FILE,
	};
	var FORM_TITLE = () => translator.RECOVERABILITY_PAGE_NAME();
	
	function searchByName (recordType,searchName) {

		var filters = [];
		var ids = [];

		filters.push({
			name: 'name',
			operator: search.Operator.IS,
			values: [searchName],
		});

		try {
			var nameSearch = search.create({
				type : recordType,
				filters : filters,
			});
		} catch (error) {
			log.error('Error: No Electronic Payments  Bundle installed', error);
			return ids;
		}
		
		nameSearch.run().each(function (result) {
			ids.push(result.id);
			return true;
		});

		return ids;
	}

	function isTemplateCreated (sourceapp,name) {
		var objs = [];
		if (sourceapp === constants.MX_L10N_SUITAPP.ELECTRONIC_PAYMENT) {
			objs = searchByName(constants.RECORD_TYPE.EP_PAYMENT_FILE_FORMAT,name);
		}
		return objs.length > 0;
	}
 
	/**
     * Search the file cabinet for path of specified file
     *
     * @param {String} name
     * @returns {Object}
     */
	function getFilePath (name) {
 
		var fileResult;
 
		var fileSearch = search.create({
			type: 'file',
			filters: ['name', search.Operator.IS, name],
		});
 
		fileSearch.run().each(function (result) {
			var fileObj = file.load({
				id: result.id,
			});
 
			fileResult = {
				id: result.id,
				path: fileObj.path,
			};
		});
 
		return fileResult;
	}
 
 
	/**
     * Create a form response to populate suitelet with components list
     *
     * @param {Object} context Script context
     */
	function createForm (context) {
 
		var resultFiles = {
			templateFile: getFilePath(TEMPLATE_FILE),
			csFile: getFilePath(CLIENT_SCRIPT_FILE),
		};
 
		var templateFile = file.load({
			id: resultFiles.templateFile.id,
		});
		var freeMarkerTemplate = templateFile.getContents();
 
		var myForm = serverWidget.createForm({
			title: FORM_TITLE(),
		});
 
		myForm.clientScriptModulePath = resultFiles.csFile.path;
 
		var mySearch = search.create({
			type: CUSTOM_RECORD_TYPE,
			columns: [
				'lastmodified',
				'lastmodifiedby',
				'name',
				'internalid',
				CUSTOM_RECORD_FIELDS.status,
				CUSTOM_RECORD_FIELDS.details,
				CUSTOM_RECORD_FIELDS.targetSuiteApp,
			],
		});
 
		var templateData = {
			pageHeaderLabels: {},
			targets: [],
			results: [],
			csFilePath: resultFiles.csFile.path,
		};

		templateData.pageHeaderLabels = {
			LABEL_COMPONENT : translator.RECOVERABILITY_FIELD_COMPONENT(),
			LABEL_STATUS : translator.RECOVERABILITY_FIELD_STATUS(),
			LABEL_UPDATEDATE : translator.RECOVERABILITY_FIELD_UPDATED_DATE(),
			LABEL_UPDATEDBY : translator.RECOVERABILITY_FIELD_UPDATED_BY(),
			LABEL_ACTION : translator.RECOVERABILITY_ACTION(),
		};

		mySearch.run().each(function (result) {
 
			var target = result.getText({
				name: CUSTOM_RECORD_FIELDS.targetSuiteApp,
			});
 
			if (templateData.targets.indexOf(target) < 0) {
				templateData.targets.push(target);
			}
 
			templateData.results.push({
				name: result.getValue('name'),
				id: result.id,
				status: result.getText(CUSTOM_RECORD_FIELDS.status),
				errorStatus: ([constants.MX_L10N_INSTALL_STATUS.INSTALLATION_FAILED, constants.MX_L10N_INSTALL_STATUS.SUITE_APP_UNAVAIALBALE].indexOf(result.getValue(CUSTOM_RECORD_FIELDS.status)) >= 0), // If Status is "Installation Failed" or "SuiteApp Unavailable"
				details: result.getValue(CUSTOM_RECORD_FIELDS.details),
				modifiedby: result.getText('lastmodifiedby'),
				modifieddate: result.getValue('lastmodified'),
				target: target,
			});			
   
			return true;
		});

		var myField = myForm.addField({
			id: 'html',
			type: serverWidget.FieldType.INLINEHTML,
			label: 'html',
		});
 
		var myRenderer = render.create();
		myRenderer.templateContent = freeMarkerTemplate;

		myRenderer.addCustomDataSource({
			alias: 'templateData',
			format: render.DataSource.OBJECT,
			data:  templateData,
		});
 
		var fieldValue = myRenderer.renderAsString();
		myField.defaultValue = fieldValue;
 
 
		context.response.writePage({
			pageObject: myForm,
		});
	}
 
	function getFileIdForRequiredStage (l10nComponent) {
		var installFileId = l10nComponent[CUSTOM_RECORD_FIELDS.templateFileId][0].value;
		var updateFileId = l10nComponent[CUSTOM_RECORD_FIELDS.updateTemplateFileId][0].value;
		var templateName = l10nComponent['name'];
		var targetAppId = l10nComponent[CUSTOM_RECORD_FIELDS.targetSuiteApp][0].value;
		if (isTemplateCreated(targetAppId,templateName)) {
			return updateFileId;
		} else {
			return installFileId;
		}
	}

	/**
     * Handle POST request for component reinstallation
     *
     * @param {Object} context Script context
     */
	function handlePOSTRequest (context) {

		var upsertResult = null;
		var l10nComponent = search.lookupFields({
			type: CUSTOM_RECORD_TYPE,
			id : context.request.parameters.id,
			columns: ['name',CUSTOM_RECORD_FIELDS.templateFileId ,CUSTOM_RECORD_FIELDS.updateTemplateFileId,CUSTOM_RECORD_FIELDS.targetSuiteApp],
		});

		var fileId = getFileIdForRequiredStage(l10nComponent);
		var targetAppId = l10nComponent[CUSTOM_RECORD_FIELDS.targetSuiteApp][0].value; // Electronic Payments =1, Mexico Localization=2 ,Electronic Invoicing=3

		switch (targetAppId) {
			case constants.MX_L10N_SUITAPP.ELECTRONIC_PAYMENT:
				upsertResult = EPComponents.createTemplates([fileId],[context.request.parameters.id]);
				break;

			case constants.MX_L10N_SUITAPP.ELECTRONIC_INVOICING:				
				upsertResult = EIComponents.createTemplates([fileId],[context.request.parameters.id]);				
				break;
							
			default:
				break;
		}

		var componentRecord = record.load({
			type: CUSTOM_RECORD_TYPE,
			id: context.request.parameters.id,
		});	

		var postResponse = {};
		postResponse.result = upsertResult ? (upsertResult.result === 1 ? 'SUCCESS': 'FAILED') : 'FAILED';
		postResponse.status = upsertResult ? componentRecord.getText(CUSTOM_RECORD_FIELDS.status) : translator.RECOVERABILITY_REQUEST_FAILED();
		postResponse.errorStatus = upsertResult ? (upsertResult.result !== 1) : true;
		postResponse.details = upsertResult ? componentRecord.getValue(CUSTOM_RECORD_FIELDS.details) : translator.RECOVERABILITY_NO_SHAREDMODULE();
		postResponse.updateddate = componentRecord.getText('lastmodified');
		postResponse.updatedby = componentRecord.getText('lastmodifiedby');

		log.debug('===postResponse=====',JSON.stringify(postResponse));
		context.response.write({
			output: JSON.stringify(postResponse),
		});
	}
 
	function onRequest (context) {
		if (context.request.method === https.Method.POST) {
			handlePOSTRequest(context);
		} else {
			createForm(context);
		}
	}
	return {
		onRequest: onRequest,		
	}; 
});