/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(
	[
		'N/error',
		'./constants',
	],
	function (error, constants) {

		var ScriptType = function (scriptType) {
			this.scriptType = scriptType;
		};
		ScriptType.prototype.value = function () {
			return this.scriptType;
		};
		ScriptType.prototype.isCS = function () {
			return this.scriptType === constants.SCRIPT_TYPE.CS;
		};
		ScriptType.prototype.isUE = function () {
			return this.scriptType === constants.SCRIPT_TYPE.UE;
		};
		ScriptType.prototype.isMR = function () {
			return this.scriptType === constants.SCRIPT_TYPE.MR;
		};
		ScriptType.prototype.isRL = function () {
			return this.scriptType === constants.SCRIPT_TYPE.RL;
		};
		ScriptType.prototype.isSL = function () {
			return this.scriptType === constants.SCRIPT_TYPE.SL;
		};
		ScriptType.prototype.isSS = function () {
			return this.scriptType === constants.SCRIPT_TYPE.SS;
		};

		var instance = null;

		var ScriptContext = function (scriptType, context) {
			this.scriptType = new ScriptType(scriptType);
			this.context = context;
		};

		ScriptContext.prototype.getScriptType = function () {
			return this.scriptType;
		};

		ScriptContext.prototype.getContext = function () {
			return this.context;
		};

		ScriptContext.prototype.updateContext = function (context) {
			this.context = context;
		};

		var initialize = function (scriptType,context) {
			instance = new ScriptContext(scriptType, context);
			return instance;
		};

		var getInstance = function () {
			if (!instance) {
				throw error.create({
					name: 'SCRIPT_CONTEXT_UNINITIALIZED',
					message: 'Script context must be initialized prior to its manipulation',
				});
			}
			return instance;
		};

		var destroyInstance = function () {
			instance = null;
		};

		return {
			initialize: initialize,
			getInstance: getInstance,
			destroyInstance: destroyInstance,
		};
	}
);
