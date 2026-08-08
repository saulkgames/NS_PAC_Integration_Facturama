/* istanbul ignore next */
define(
	[
		'./templates/moduleFactory',
		'../common/constants',
	],
	function (ModuleFactory, constants) {
		const config = {
			recordTypes: [constants.RECORD_TYPE.SUBSIDIARY],
		};
		let instance;

		return {
			getInstance: function (scriptType, context) {
				return ModuleFactory.instantiate(instance, config, scriptType, context);
			},
			destroyInstance: function () {
				instance = null;
			},
		};
	}
);
