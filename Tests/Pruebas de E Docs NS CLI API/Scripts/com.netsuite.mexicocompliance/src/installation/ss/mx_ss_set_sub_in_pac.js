/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 *@NApiVersion 2.1
 *@NScriptType ScheduledScript
 */

define(
	['N/record', './../../common/application', './../../electronicInvoicing/lib/commonDataProvider', './../../common/constants'],
	function (record, application, commonDataProvider, constants) {

		const logTitle = 'selectAllMexicanSubsidiariesInEnabledPAC';

		const execute = function (context) {
			if (application.isOneWorld()) {
				log.audit(logTitle, 'Starting configuration of mexican subsidiaries for enabled PAC');
				_selectAllMexicanSubsidiariesInEnabledPAC();
			} else {
				log.audit(logTitle, 'The account is not OneWorld so no subsidiaries selection is needed in PAC');
			}
		};

		var _selectAllMexicanSubsidiariesInEnabledPAC = function () {

			const activePacsIds = commonDataProvider.getActivePacConnectionIds();
			const mexicanSubsidiariesIds = commonDataProvider.getSubsidiaryIdsByCountry('MX');
			if (activePacsIds.length === 1 && mexicanSubsidiariesIds.length > 0) {
				const activePac = record.load({
					type: constants.RECORD_TYPE.MX_PAC_CONNECTION_INFO,
					id: activePacsIds[0],
					isDynamic: false,
				});
				activePac.setValue({
					fieldId: constants.FIELD.MX_PACINFO_SUBSIDIARY,
					value: mexicanSubsidiariesIds,
				});
				const modifiedPacId = activePac.save({
					enableSourcing: false,
					ignoreMandatoryFields: true,
				});
				log.audit(logTitle, 'All Mexican subsidiaries were selected in enabled PAC with id:' + modifiedPacId);
			} else {
				log.audit(logTitle, 'Subsidiaries could not be automatically selected because either there is no PAC enabled or there are no Mexican subsidiaries configured in this account');
			}

		};

		return {
			execute: execute,
		};
	}
);