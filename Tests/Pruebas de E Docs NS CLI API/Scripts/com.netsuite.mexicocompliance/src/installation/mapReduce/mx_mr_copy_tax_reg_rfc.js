/**
 *    Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 */

/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */

define([
	'N/log',
	'N/record',
	'N/runtime',
	'../lib/mx_sl_task_summary',
	'../../common/constants',
	'../../common/application',
	'../../common/application',
	'../../customFields/rfcField',
	'../../customRecords/taxRegistration',
	'../../model/mx_model_entity',
], function (log, Record, runtime, taskSummary, Constants, Application, application, RfcField, TaxRegistration, Entity) {
	const config = {
		entities: {
			CUSTOMER: 'CustJob',
			VENDOR: 'Vendor',
			PARTNER: 'Partner',
		},
	};

	const EntityModel = new Entity();

	function getRecordByEntityType (entityType) {
		switch (entityType) {
			case config.entities.VENDOR:
				return Constants.RECORD_TYPE.VENDOR;
			case config.entities.PARTNER:
				return Constants.RECORD_TYPE.PARTNER;
			case config.entities.CUSTOMER:
				return Constants.RECORD_TYPE.CUSTOMER;
			default:
				throw 'entity type ' + entityType + ' cannot be migrated';
		}
	}

	function isRecordInMexicoContext (record) {
		const isMexicoContext = application.isMexico({
			contextRecord: record,
		});

		log.debug('Mexico Context Decided to be', 'Is Mexican: ' + isMexicoContext + ' for record: ' + JSON.stringify(record));

		return isMexicoContext;
	}

	function migratePersonEntityRecord (record) {
		if (!record || !isRecordInMexicoContext(record)) {
			// no record or mexico context, do not migrate
			return;
		}

		// find tax number with Mexico country
		const taxNumber = TaxRegistration.getFirstMexicanNumber(record);

		if (taxNumber) {
			// save rfc field
			record.setValue({
				fieldId: Constants.FIELD.MX_CUSTENTITY_RFC,
				value: taxNumber,
			});
			record.save();
		} else {
			log.debug('rfc field "' + taxNumber + '" is not valid');
		}
	}

	function mapEntity (context) {
		const entity = JSON.parse(context.value);

		try {
			migratePersonEntityRecord(Record.load({
				type: getRecordByEntityType(entity.type),
				id: entity.id,
			}));
		} catch (e) {
			log.error('error while migrating', {entity: entity, error: e});
		}
	}

	function listEntities () {
		if (!Application.isSuiteTax()) {
			// migration should not run for non-suitetax account
			log.debug('SuiteTax is not activated. No entities data passed on for processing');
			return [];
		}

		const entities = EntityModel.findDynamic({
			columns: ['id', 'entityId', 'type'],
			filters: [
				[EntityModel.columns.type, 'anyOf', [config.entities.CUSTOMER, config.entities.PARTNER, config.entities.VENDOR]],
			],
		});

		if (entities && entities.length > 0) {
			// return all entity objects
			log.debug('Entities count to migrate:', entities.length);
			return entities;
		}


		log.debug('No entities fount. No data passed on for processing');
		return [];
	}

	function summarize () {
		taskSummary.createSummaryRecord('Migrate Tax Registration RFC', runtime.getCurrentScript().id);
	}

	return {
		getInputData: listEntities,
		map: mapEntity,
		summarize: summarize,
	};
});
