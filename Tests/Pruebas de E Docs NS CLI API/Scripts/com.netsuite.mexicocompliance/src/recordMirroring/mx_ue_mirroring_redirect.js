/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 *
 *  SAT Item Code mirror is used for showing the concatenated "code - name" to the user in dropdown menus, but
 *  when selectin editing or adding new values in the dropdown we need to redirect to the actual record, not
 *  the mirror, the one which is used to enter the values separating code and name.
 *
 *  This module's responsibility is to handle the redirect from the mirror to the original record on creation
 *  and editing.
 *
 */

define(
	[
		'../common/constants',
		'../common/application',
		'N/search',
		'N/redirect',
		'N/error',
		'../translations/translator',
	],
	function (constants, application, search, redirect, error, translator) {

		var self = {
			beforeLoad: function (context) {

				var satItemCodeMirrorRecord = application.getRecord(context);
				var satItemCodeMirrorId = satItemCodeMirrorRecord.getValue('id');
				var satItemCodeId = null;
				var isEditMode = false;

				/* when selecting new from the mirror dropdown there will be no id */
				if (satItemCodeMirrorId) {
					satItemCodeId = self._getSatItemCodeIdFromMirrorId(satItemCodeMirrorId);
				}

				/* 	we don't need to control edit mode neither for the new nor the view options
					since by default when we don't pass ID it goes to edit and when we do it goes to view
					*however* since the mirror record must be allowed to be UI accessible (otherwise it
					doesn't reach the redirct) the user can also click on EDIT in the actual mirror record list
					it is for this reason that we control here the edit mode, to offer consistency in that scenario
					otherwise, when the user clicks on edit the mirror record is redirected to view the original
				 */
				if (application.isEditMode(context) || application.isCreateMode(context)) {
					isEditMode = true;
				}

				/* redirects to the record with corresponding id or new one if id = null */
				redirect.toRecord({
					type: constants.RECORD_TYPE.MX_SAT_ITEM_CODE ,
					id: satItemCodeId,
					isEditMode: isEditMode,
				});
			},
			_getSatItemCodeIdFromMirrorId: function (satItemCodeMirrorId) {
				var mySearch = search.create({
					type: constants.RECORD_TYPE.MX_SAT_ITEM_CODE,
					columns: ['internalid'],
					filters: [
						{
							name: constants.FIELD.MX_SAT_ITEM_CODE_MIRROR_RECORD,
							operator: 'is',
							values: satItemCodeMirrorId,
						},
					],
				});

				var resultSet = mySearch.run();
				var results = [];

				resultSet.each(function (row) {
					var result = {
						id: row.getValue({
							name: 'internalid',
						}),
					};
					results.push(result);
				});

				if (results.length === 1) {
					return results[0].id;
				}

				throw error.create({
					name: 'UNEXPECTED_SAT_ITEM_CODE',
					message: translator.ERROR_UNEXPECTED_SAT_ITEM_CODE_1() + satItemCodeMirrorId
						+ translator.ERROR_UNEXPECTED_SAT_ITEM_CODE_2(),
				});
			},
		};

		return {
			beforeLoad: self.beforeLoad,
			_test_module: self,
		};
	}
);
