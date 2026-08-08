/* istanbul ignore next */
define(
	[
		'../templates/moduleFactory',
		'../../common/constants',
	],
	function (
		ModuleFactory,
		constants
	) {
		var config = {
			fieldIds: [
				{
					id: constants.FIELD.MX_CUSTITEM_SAT_ITEM_CODE,
				},
				{
					id: constants.FIELD.MX_CUSTITEM_SAT_ITEM_TYPE,
				}
			],
			recordTypes: [constants.RECORD_TYPE.ITEM_ASSEMBLY,
				constants.RECORD_TYPE.ITEM_ASSEMBLY_LOT_NUMBERED,
				constants.RECORD_TYPE.ITEM_ASSEMBLY_SERIALIZED,
				constants.RECORD_TYPE.ITEM_GIFT,
				constants.RECORD_TYPE.ITEM_INVENTORY,
				constants.RECORD_TYPE.ITEM_INVENTORY_LOT_NUMBERED,
				constants.RECORD_TYPE.ITEM_INVENTORY_SERIALIZED,
				constants.RECORD_TYPE.ITEM_KIT,
				constants.RECORD_TYPE.ITEM_NON_INVENTORY,
				constants.RECORD_TYPE.ITEM_OTHER_CHARGE,
				constants.RECORD_TYPE.ITEM_SERVICE,
			],
			contextFieldIds: [constants.FIELD.SUBSIDIARY, constants.FIELD.INCLUDE_CHILDREN],
		};
		var instance;

		return {
			getInstance: function (scriptType, context) {
				instance = ModuleFactory.instantiate(instance, config, scriptType, context);
				return instance;
			},
			destroyInstance: function () {
				instance = null;
			},
		};
	}
);