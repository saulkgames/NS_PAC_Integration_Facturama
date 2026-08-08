/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([
	'./../../common/application',
	'./../../common/constants',
	'./../lib/edocumentDataProvider',
	'./validator',
	'N/record',
], function (
	application,
	constants,
	edocumentDataProvider,
	validator,
	record
) {
	'use strict';

	var self = {
		_removeDuplicatesFromArray: function (array) {
			return array = array.filter((item, index) => {
				return (array.indexOf(item) === index);
			});
		},

		_getCurrentPACRecordSubsidiaries: function (newRecord) {
			return newRecord.getValue(constants.FIELD.MX_PACINFO_SUBSIDIARY);
		},

		_getOriginalSubsidiariesInRecordPlusCurrentPACSubsidiaries: function (idOfEntity, typeOfEntity, fieldInEntity, PACSubsidiaries) {
			const oldEntity = record.load({
				type: typeOfEntity,
				id: idOfEntity,
			});
			const originalSubsidiariesInRecord = oldEntity.getValue({
				fieldId: fieldInEntity,
			});
			return self._removeDuplicatesFromArray(PACSubsidiaries.concat(originalSubsidiariesInRecord));
		},

		_updateSendingMethods: function (sendingMethods, values, isOneWorld) {
			var updateValues;
			sendingMethods.map(function (sendingMethod) {
				if (sendingMethod.channel === 'SOAP') {
					updateValues = values['soapchannel'];
				} else {
					updateValues = values['otherchannel'];
				}
				const propertyForSubsidiaryIsNotUndefined = updateValues[constants.FIELD.EI_SM_SUBSIDIARIES] !== undefined;
				if (isOneWorld && propertyForSubsidiaryIsNotUndefined) {
					updateValues[constants.FIELD.EI_SM_SUBSIDIARIES] = self._getOriginalSubsidiariesInRecordPlusCurrentPACSubsidiaries(
						sendingMethod.id,
						constants.RECORD_TYPE.EI_EDOCUMENT_SENDING_METHOD,
						constants.FIELD.EI_SM_SUBSIDIARIES,
						updateValues[constants.FIELD.EI_SM_SUBSIDIARIES]
					);
				}
				record.submitFields({
					type: constants.RECORD_TYPE.EI_EDOCUMENT_SENDING_METHOD,
					id: sendingMethod.id,
					values: updateValues,
					options: {
						enableSourcing: false,
						ignoreMandatoryFields: true,
					},
				});
			});
		},

		_updateTemplates: function (ids, values, isOneWorld) {
			ids.map(function (id) {
				const propertyForSubsidiaryIsNotUndefined = values[constants.FIELD.EI_TMPL_SUBSIDIARIES] !== undefined;
				if (isOneWorld && propertyForSubsidiaryIsNotUndefined) {
					values[constants.FIELD.EI_TMPL_SUBSIDIARIES] = self._getOriginalSubsidiariesInRecordPlusCurrentPACSubsidiaries(
						id,
						constants.RECORD_TYPE.EI_EDOCUMENT_TEMPLATE,
						constants.FIELD.EI_TMPL_SUBSIDIARIES,
						values[constants.FIELD.EI_TMPL_SUBSIDIARIES]
					);
				}
				record.submitFields({
					type: constants.RECORD_TYPE.EI_EDOCUMENT_TEMPLATE,
					id: id,
					values: values,
					options: {
						enableSourcing: false,
						ignoreMandatoryFields: true,
					},
				});
			});
		},

		_updatePackage: function (
			packageName,
			sendingMethodUpdates,
			templateUpdates,
			isOneWorld = false
		) {
			var packageIds = edocumentDataProvider.getPackageIdsByName(packageName);
			
			packageIds.map(function (packageId) {
				var sendingMethods = edocumentDataProvider.getSendingMethodIdsByPackage(
					packageId
				);
				var templates = edocumentDataProvider.getTemplateIdsByPackage(
					packageId
				);
				self._updateSendingMethods(
					sendingMethods,
					sendingMethodUpdates,
					isOneWorld
				);
				self._updateTemplates(templates, templateUpdates, isOneWorld);
			});
		},

		_updatePackageAsInactive: function (edocPackage) {
			var soapchannel = {};
			soapchannel[constants.FIELD.EI_SM_FOR_CERFIFY] = false;
			soapchannel.isinactive = true;

			var sendingMethodUpdates = {
				soapchannel: soapchannel,
				otherchannel: {
					isinactive: true,
				},
			};
			var templateUpdates = {
				isinactive: true,
			};
			self._updatePackage(edocPackage, sendingMethodUpdates, templateUpdates);
		},

		_updateOldPackagesAsInactive: function (activePackage) {
			var packagesToBeInactive = [];

			constants.AVAILABLE_PACS.map(function (pack) {
				if (activePackage === pack) {
					return;
				}
				packagesToBeInactive.push(pack);
			});
			
			packagesToBeInactive.map(function (edocPackage) {
				self._updatePackageAsInactive(edocPackage);
			});
		},

		_updatePackagesWithSubsidiaryAndCheckCertify: function (edocPackage, isOneWorld, subsidiaryIdsFromNewRecord = []) {

			var soapchannel = {
				isinactive: false,
			};
			var otherchannel = {
				isinactive: false,
			};

			var sendingMethodUpdates = {
				soapchannel: soapchannel,
				otherchannel: otherchannel,
			};
			var templateUpdates = {
				isinactive: false,
			};
			soapchannel[constants.FIELD.EI_SM_FOR_CERFIFY] = true;

			if (isOneWorld) {
				soapchannel[constants.FIELD.EI_SM_SUBSIDIARIES] = subsidiaryIdsFromNewRecord;
				otherchannel[constants.FIELD.EI_SM_SUBSIDIARIES] = subsidiaryIdsFromNewRecord;
				templateUpdates[constants.FIELD.EI_TMPL_SUBSIDIARIES] = subsidiaryIdsFromNewRecord;
			}
			self._updatePackage(edocPackage, sendingMethodUpdates, templateUpdates, isOneWorld);
		},

		updateEdocumentPackage: function (context) {
			var newRecord = context.newRecord;
			var oldRecord = context.oldRecord;
			const newRecordPackageName = newRecord
				? newRecord.getValue(constants.FIELD.MX_PACINFO_EDOC_PACKAGE)
				: null;
			const packageName = newRecordPackageName
				? newRecordPackageName
				: oldRecord.getValue(constants.FIELD.MX_PACINFO_EDOC_PACKAGE);

			const isOneWorld = application.isOneWorld();
			let subsidiariesIdsFromNewRecord = [];
			if (isOneWorld) {
				subsidiariesIdsFromNewRecord = self._getCurrentPACRecordSubsidiaries(newRecord);
			}

			switch (context.type) {
				case context.UserEventType.DELETE:
					self._handleDeleteContext(oldRecord, packageName);
					return;
				case context.UserEventType.CREATE:
					self._handleCreateContext(newRecord, packageName, isOneWorld, subsidiariesIdsFromNewRecord);
					return;
				case context.UserEventType.XEDIT:
				case context.UserEventType.EDIT:
					self._handleEditContext(
						oldRecord,
						newRecord,
						packageName,
						newRecordPackageName,
						isOneWorld,
						subsidiariesIdsFromNewRecord
					);
					return;
				default:
					return;
			}
		},

		_handleDeleteContext: (oldRecord, packageName) => {
			if (!validator.isDisabled(oldRecord) && validator.noPacsEnabledWithThatPackageName({name: packageName})) {
				self._updatePackageAsInactive(packageName);
			}
		},

		_handleCreateContext: (newRecord, packageName, isOneWorld, subsidiariesIdsFromNewRecord) => {
			if (validator.isDisabled(newRecord)) {
				return;
			}
			self._updatePackagesWithSubsidiaryAndCheckCertify(packageName, isOneWorld, subsidiariesIdsFromNewRecord);
		},

		_handleEditContext: (oldRecord, newRecord, packageName, newRecordPackageName, isOneWorld, subsidiariesIdsFromNewRecord) => {
			const oldRecordPackageName = oldRecord.getValue(constants.FIELD.MX_PACINFO_EDOC_PACKAGE);
			const packageNameHasChanged = newRecordPackageName && newRecordPackageName !== oldRecordPackageName;
			if (packageNameHasChanged
				&& validator.noPacsEnabledWithThatPackageName({name:oldRecordPackageName})) {
				self._updatePackageAsInactive(oldRecordPackageName);
			}
			if (!validator.isDisabled(oldRecord) && validator.isDisabled(newRecord) && validator.noPacsEnabledWithThatPackageName({
				name: packageNameHasChanged ? newRecordPackageName : oldRecordPackageName,
			})) {
				self._updatePackageAsInactive(packageName);
				return;
			}
			if (validator.isDisabled(newRecord)) {
				return;
			}
			self._updatePackagesWithSubsidiaryAndCheckCertify(packageName, isOneWorld, subsidiariesIdsFromNewRecord);
		},
	};

	return {
		updateEdocumentPackage: self.updateEdocumentPackage,
		_test_module : self,
	};
});
