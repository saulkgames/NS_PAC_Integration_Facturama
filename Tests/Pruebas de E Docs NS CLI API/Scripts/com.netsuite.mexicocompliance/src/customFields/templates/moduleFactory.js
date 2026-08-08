define(
	[
		'N/error',
		'../../common/application',
		'../../common/scriptContext',
		'../../common/constants',
		'./visibilityModule',
		'./valueModule',
	],
	function (
		error,
		application,
		scriptContext,
		constants,
		visibilityModule,
		valueModule
	) {

		const self = {
			composite: {
				initReferences: [],
				initModules: function () {
					this.initReferences.forEach(function (ref) {
						ref.initialize();
					}.bind(this));
				},
			},

			instantiate: function (instance, config, scriptType, context) {
				instance = (instance || self.initialize(config, scriptType, context));
				instance.scriptContext.updateContext(context);
				return instance;
			},

			initialize: function (config, scriptType, context) {
				if (!config) {
					throw error.create({
						name: 'MISSING_MODULE_CONFIGURATION',
						message: 'Config parameter is mandatory for module factory. Can not instantiate module',
					});
				}

				self._setNativeExtensions(config, scriptType, context);
				self._setExtensions(config);

				if (scriptType === constants.SCRIPT_TYPE.CS) {
					self._initScriptCS();
				} else if (scriptType === constants.SCRIPT_TYPE.UE) {
					self._initScriptUE();
				} else {
					throw error.create({
						name: 'MISSING_MODULE_CONFIGURATION',
						message: 'Unexpected script type: "' + scriptType + '" Can not instantiate module',
					});
				}

				return this.composite;
			},

			_setNativeExtensions: function (config, scriptType, context) {
				this.composite.scriptContext = scriptContext.initialize(scriptType, context);
				this.composite.values = valueModule.getConfiguredInstance(config);
				this.composite.visibility = visibilityModule.getConfiguredInstance(config);
			},

			_setExtensions: function (config) {
				if (config.extensions) {
					Object.keys(config.extensions).forEach(function (modKey) {
						if (typeof config.extensions[modKey].getInstance === 'function') {
							this.composite[modKey] = config.extensions[modKey].getInstance();
						} else if (typeof config.extensions[modKey].getConfiguredInstance === 'function') {
							this.composite[modKey] = config.extensions[modKey].getConfiguredInstance(config);
						} else {
							throw error.create({
								name: 'MODULE_EXTENSION_INCOMPATIBLE',
								message: 'Extension ' + modKey + ' does not implement a valid instantiation method. Options are: getInstance() or getConfiguredInstance(config).',
							});
						}

						if (typeof this.composite[modKey].initialize === 'function') {
							this.composite.initReferences.push(this.composite[modKey]);
						}
					}.bind(this));
				}
			},

			_initScriptCS: function () {
				this.composite.initModules();
			},

			_initScriptUE: function () {
				this.composite.initModules();
			},
		};

		return {
			initialize: self.initialize,
			instantiate: self.instantiate,
			module: self,
		};
	}
);
