/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 */

define(
	[
		'../common/application',
		'../common/constants',
	],
	function (application, constants) {

		var self = {
			getFirstMexicanNumber : function (record) {
				var lineCount = record.getLineCount({
					sublistId : constants.SUBLIST.TAX_REGISTRATION,
				});
				var country;

				for (var i=0; i<lineCount; i++) {
					country = record.getSublistValue({
						sublistId: constants.SUBLIST.TAX_REGISTRATION,
						fieldId : constants.FIELD.NEXUS_COUNTRY,
						line : i,
					});
					if (country === constants.OTHER.MEXICO_COUNTRY_CODE) {
						return record.getSublistValue({
							sublistId: constants.SUBLIST.TAX_REGISTRATION,
							fieldId : constants.FIELD.TAX_REGISTRATION_NUMBER,
							line : i,
						});
					}
				}

				return '';
			},

			isPresent : function (context) {
				var record = application.getRecord(context);
				var sublist = record.getSublist({sublistId: constants.SUBLIST.TAX_REGISTRATION});
				return sublist !== null;
			},
		};

		return {
			getFirstMexicanNumber : self.getFirstMexicanNumber,
			isPresent : self.isPresent,
		};
	}
);
