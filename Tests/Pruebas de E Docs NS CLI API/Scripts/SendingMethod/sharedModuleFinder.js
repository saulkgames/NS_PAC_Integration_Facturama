/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 * otherwise make available this code.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(
	['N/search', 'N/file', 'N/log'],
	function (search, file, log) {
		/**
    * @param params.filename {String} filename
    * @param params.uuid {String} uuid identifier where the file shared module resides
    *
    * @returns the absolute path given a filename and a uuid
    * @throws throws error in case duplicate search results are encountered or file does not exist.
    *
    */
		var moduleCache = {};

		function getSharedModule (params) {
			// search for the file record where name equals the uuid
			var uuidFiles = [];
			search.create({
				type    : 'file',
				columns : ['name', 'folder', 'url'],
				filters : [{
					name: 'name', operator : 'is', values : params.uuid,
				}],
			})
				.run()
				.each(function (result) {
					uuidFiles.push(result);
					return true;
				});
			if (uuidFiles.length !== 1) {
				return null;
			}

			var uuidFileObj = file.load({id: uuidFiles[0].id});
			return uuidFileObj.path.replace('.bin', '').replace(params.uuid, params.filename);
		}

		function getEIClassfiedInstallationFileIds () {
			var templatesFolder;
			var classifiedFileIds= {
				templateFileIds: [],
				sendingMethodFileIds : [],
			};
			search.create({
				type    : 'file',
				columns : ['folder'],
				filters : [{
					name: 'name', operator : 'is', values : 'com_netsuite_mexicocompliance_src_einvoicing_templates',
				}],
			})
				.run()
				.each(function (result) {
					templatesFolder = result;
					return false;
				});

			var templatesFolderId = templatesFolder.getValue({name : 'folder'});
        
			search.create({
				type    : 'file',
				columns : ['name','internalid'],
				filters : [{
					name: 'folder', operator : 'is', values : templatesFolderId,
				}],
			})
				.run()
				.each(function (result) {
					var fileName = result.getValue('name');					
					if (fileName.indexOf('template.json') > 0) {
						classifiedFileIds.templateFileIds.push(result.id);
					} else if (fileName.indexOf('sendingmethod.json') > 0) {
						classifiedFileIds.sendingMethodFileIds.push(result.id);
					}
					return true;
				});
			log.debug('List of Electronic Invoicing Template File Ids', JSON.stringify(classifiedFileIds));
			return classifiedFileIds;
		}
	
		function getEPClassfiedInstallationFileIds () {
			var templatesFolder;
			var classifiedFileIds= {
				templateFileIds: [],
			};
			search.create({
				type    : 'file',
				columns : ['folder'],
				filters : [{
					name: 'name', operator : 'is', values : 'd5b32943-8705-46cf-8696-e40fcb6653df',
				}],
			})
				.run()
				.each(function (result) {
					templatesFolder = result;
					return false;
				});

			var templatesFolderId = templatesFolder.getValue({name : 'folder'});

        
			search.create({
				type    : 'file',
				columns : ['name','internalid'],
				filters : [{
					name: 'folder', operator : 'is', values : templatesFolderId,
				}],
			})
				.run()
				.each(function (result) {
					var fileName = result.getValue('name');					
					if (fileName.indexOf('Banamex_Template.json') >= 0) {
						classifiedFileIds.templateFileIds.push(result.id);
					}
					if (fileName.indexOf('Santander_Template.json') >= 0) {
						classifiedFileIds.templateFileIds.push(result.id);
					}
					return true;
				});
			log.debug('List of Electronic Payments Template File Ids :', JSON.stringify(classifiedFileIds));
			return classifiedFileIds;
		}

		function getBundlePathByUUID (uuid) {
			var bundlePath = getSharedModule({
				uuid: uuid,
				filename: '',
			});

			// strip down last '/' character
			bundlePath = bundlePath.length > 0
				? bundlePath.substring(0, bundlePath.length - 1)
				: bundlePath;

			log.debug('Path of the bundle: ', bundlePath);

			return bundlePath;
		}

		/* istanbul ignore next */
		function loadModuleFromExternalBundle(bundleUuId, moduleName) {
			try {
				if (!!moduleName && !moduleCache[moduleName]) {
					var bundlePath = getBundlePathByUUID(bundleUuId);
					require([bundlePath + '/' + moduleName], function(obj) {
						moduleCache[moduleName] = obj;
					});
				}

				return moduleCache[moduleName];
			} catch (exception) {
				log.audit({
					title: 'MX-EI NOTICE',
					details: 'Could not load external module. Error was: ' + exception.message,
				});
			}
		}

		return {
			getSharedModule: getSharedModule,
			getEIClassfiedInstallationFileIds : getEIClassfiedInstallationFileIds,
			getEPClassfiedInstallationFileIds : getEPClassfiedInstallationFileIds,
			getBundlePathByUUID: getBundlePathByUUID,
			loadModuleFromExternalBundle: loadModuleFromExternalBundle,
		};
	}
);