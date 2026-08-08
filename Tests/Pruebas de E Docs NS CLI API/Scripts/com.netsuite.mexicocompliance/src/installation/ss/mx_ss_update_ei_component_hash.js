/**
 *    Copyright (c) 2022, Oracle and/or its affiliates. All rights reserved.
 */

/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define([
	'N/record',
	'N/query',
	'N/log',
	'./../../common/constants',
],
function (Record, Query, Log, constants) {

	function execute () {
		var fixEntities = function (recordType, columnIdentifier, wrongIdentifiers) {
			Log.debug('Fixing type ', recordType);
			var entities = Query.runSuiteQL({
				query: `SELECT id, ${columnIdentifier} FROM ${recordType}`,
			}).asMappedResults();

			var wrongEntities = [];
			var wellFormedEntities = [];
			entities.forEach(function (entity) {
				var identifierValue = entity[columnIdentifier];
				if (identifierValue == null) {
					return;
				}
				// We are looking for entity that belongs to our fixed list
				if (wrongIdentifiers.indexOf(identifierValue) !== -1) {
					wrongEntities.push(entity);
				} else if (identifierValue.indexOf('E') === -1) {
					wellFormedEntities.push(entity);
				}
			});

			wrongEntities.forEach(function (wrongEntity) {
				if (wellFormedEntities.findIndex(function (wfe) {
					return +wfe[columnIdentifier] === +wrongEntity[columnIdentifier];
				}) !== -1) {
					return;
				}
				var entityToBeFixed = Record.load({
					type: recordType,
					id: wrongEntity['id'],
				});
				entityToBeFixed.setValue(columnIdentifier, (+wrongEntity[columnIdentifier]).toString());
				Log.debug('Fixing entity ', entityToBeFixed.getValue('id'), entityToBeFixed.getValue(columnIdentifier));
				try {
					entityToBeFixed.save();
				} catch (err) {
					Log.error(`Error while fixing entity ${entityToBeFixed.getValue('id')} of type ${recordType}`, err);
				}
			});
		};
		/*
		We want to fix only records related to MXL Bundle, that's why we have the list of identifiers for each type of entity.
		We need to fix Packages first because they are required by Template and Sending method; if we do not update those first,
		sending method and/or template would be attached to a new packages created at the moment.
		*/
		var stuff = [
			{
				recordType: constants.RECORD_TYPE.EI_EDOCUMENT_PACKAGE,
				columnIdentifier: 'custrecord_psg_ei_package_identifier',
				wrongIdentifiers: [
					'3.77379697E8',
					'1.612088029E9',
					'1.09932024E9',
				],
			},
			{
				recordType: constants.RECORD_TYPE.EI_EDOCUMENT_TEMPLATE,
				columnIdentifier: 'custrecord_psg_ei_identifier',
				wrongIdentifiers: [
					'1.185293823E9',
					'-1.20760315E9',
					'-1.271204218E9',
					'-1.065933358E9',
					'-7.01265601E8',
					'-1.821650262E9',
					'1.515964415E9',
					'9.7371365E8',
					'-1.174373818E9',
					'-2.28080918E8',
					'-5.2946281E7',
					'1.612857119E9',
					'-2.065839918E9',
					'3.73825702E8',
					'-1.91289016E9',
					'-1.737755523E9',
				],
			},
			{
				recordType: constants.RECORD_TYPE.EI_EDOCUMENT_SENDING_METHOD,
				columnIdentifier: 'custrecord_psg_ei_identifier_sm',
				wrongIdentifiers: [
					'3.6667424E8',
					'-1.042293288E9',
					'5.05069374E8',
				],
			},
		];

		stuff.forEach(function (_stuff) {
			fixEntities(_stuff.recordType, _stuff.columnIdentifier, _stuff.wrongIdentifiers);
		});
	}

	return {
		execute: execute,
	};

});
