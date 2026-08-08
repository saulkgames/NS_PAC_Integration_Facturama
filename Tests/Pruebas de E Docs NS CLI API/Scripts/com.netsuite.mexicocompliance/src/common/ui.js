/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define(
	[
		'N/log',
		'N/ui/message',
		'./constants',
		'../common/scriptContext',
	],
	function (
		log,
		uiMessage,
		constants,
		scriptContext
	) {
		var banner = {
			messageObject : undefined,
			messageString : undefined,
		};
		var self = {
			/**
			 * Adds a field to a form, and then returns the field.
			 *
			 * @param {Object} params
			 * @param {Object} params.form serverWidgetForm to add the field to
			 * @param {string} params.fieldId ID of the field
			 * @param {string} params.type The field type for the field. Use the serverWidget.FieldType enum to define the field type.
			 * @param {string} [params.label] The label for this field
			 * @param {string} [params.helpText] The help text for this field
			 * @param {number | Date | string | array | boolean true | false} [params.value] The default value of the field
			 * @param {boolean} [params.hidden] Whether the field is hidden or not
			 *
			 * @returns {Field}
			 */
			addField: function (params) {
				if (!params.label) {
					params.label = ' ';
				}

				var field = params.form.addField({
					id: params.fieldId,
					type: params.type,
					label: params.label,
				});

				if (params.helpText) {
					field.setHelpText({help: params.helpText});
				}

				if (params.value) {
					field.defaultValue = params.value;
				}

				if (params.hidden) {
					field.updateDisplayType({
						displayType: constants.FIELD_DISPLAY_TYPE.HIDDEN,
					});
				}

				return field;
			},

			addSelectOption: function (params) {
				if (typeof params.field.addSelectOption === 'function') {
					params.field.addSelectOption(params.option);
				}
				if (typeof params.field.insertSelectOption === 'function') {
					params.field.insertSelectOption(params.option);
				}
			},

			/**
			 * Returns a field, given the context
			 *
			 * @param {Object} params
			 * @param {Object} params.context ScriptContext, that contains Record (current or new), or context form, that contains the field
			 * @param {string} params.fieldId id of the field
			 * @param {string} [params.sublistId] id of the sublist
			 * @param {Object} [params.context.form] Context form, that contains the field
			 * @param {Object} [params.context.currentRecord] Record that contains the field
			 *
			 * @returns {Field}
			 */
			getField: function (params) {
				var fieldContainer;

				if (typeof(params.context.form) !== 'undefined') {
					fieldContainer = params.context.form;
					if (params.sublistId) {
						fieldContainer = fieldContainer.getSublist({id: params.sublistId});
						if (fieldContainer === null) {
							return null;
						}
					}
					return fieldContainer.getField({id: params.fieldId});
				}

				if (typeof(params.context.currentRecord) !== 'undefined') {
					fieldContainer = params.context.currentRecord;
					if (params.sublistId) {
						fieldContainer = fieldContainer.getSublist({sublistId: params.sublistId});
					}
					return fieldContainer.getField({fieldId: params.fieldId});
				}
			},
			// TODO: This is not really a UI function. Like most of the functions here are not purely UI
			/**
			 * Returns a field value, given the context
			 *
			 * @param {Object} params
			 * @param {Object} params.context ScriptContext, that contains Record (current or new), or context form, that contains the field
			 * @param {string} params.fieldId id of the field
			 * @param {Object} [params.context.form] Context form, that contains the field
			 * @param {Object} [params.context.currentRecord] Record that contains the field
			 *
			 * @returns {number | Date | string | array | boolean true | false}
			 * Checkbox fields return values of T or F. If you include checkbox field return values in scripts, be sure to use T and F, instead of boolean values, true and false.
			 */
			getValue: function (params) {
				var record = params.context.currentRecord || params.context.newRecord;

				if (!record) {
					throw {
						name: 'NULL_RECORD',
						details: 'Attempted to retrieve ' + params.fieldId + ' value from a null record.',
					};
				}

				return record.getValue({
					fieldId: params.fieldId,
				});
			},
			/**
			 * Sets a field value, given the context
			 *
			 * @param {Object} params
			 * @param {Object} params.context ScriptContext, that contains Record (current or new), or context form, that contains the field
			 * @param {string} params.fieldId id of the field
			 * @param {string} params.value value of the field
			 * @returns {currentRecord.CurrentRecord} 
			 */
			setValue: function (params) {
				var record = params.context.currentRecord || params.context.newRecord;

				if (!record) {
					throw {
						name: 'NULL_RECORD',
						details: 'Attempted to set ' + params.fieldId + ' value of a null record.',
					};
				}

				return record.setValue({
					fieldId: params.fieldId,
					value: params.value,
					ignoreFieldChange: true,
					fireSyncSlaving : false,
				});
			},
			/**
			 * Changes the display type of a field
			 *
			 * In SS2.0 there is no unified way to set the display type across different script types
			 * also, the way of doing it for ClientScript is not documented, so it's likely to change,
			 * and better to do it from a centralized place
			 *
			 * @param {Object} params
			 // * @param {Field} params.field
			 * @param {string} params.fieldId id of the field
			 * @param {string} [params.sublistId] id of the sublist, that contains the field
			 * @param {string} params.displayType the desired display type (See: serverWidget.FieldDisplayType, constants.FIELD_DISPLAY_TYPE)
			 *
			 * @returns {void}
			 */
			setFieldDisplay: function (params) {
				var field = self.getField({
					context: params.context,
					fieldId: params.fieldId,
					sublistId: params.sublistId,
				});

				if (field === null) {
					return;
				}

				// Prevents error, when field does not exist. When the field does not exist, an empty dummy Field object
				// is returned and there is no obvious way to differentiate with a normal one. It contains all
				// properties and functions, but when a value is being retrieved or a function is called, an error is
				// produced.
				try {
					// serverWidget field implementation
					// UserEvent Scripts
					if (typeof(field.updateDisplayType) === 'function') {
						field.updateDisplayType({displayType: params.displayType});
						return;
					}

					// record field implementation
					// Client Scripts
					switch (params.displayType) {
						case constants.FIELD_DISPLAY_TYPE.NORMAL:
							// field.isVisible = true;
							field.isDisplay = true;
							field.isDisabled = false;
							return;
						case constants.FIELD_DISPLAY_TYPE.HIDDEN:
							// field.isVisible = false;
							field.isDisplay = false;
							field.isDisabled = false;
							return;
						case constants.FIELD_DISPLAY_TYPE.DISABLED:
							field.isDisplay = true;
							field.isDisabled = true;
							return;
					}

					throw {
						name: 'NotImplementedError',
						message: 'Display type "' + params.displayType + '" not implemented in this context',
					};
				}
				catch (e) {
					if (e.name === 'NotImplementedError') {
						throw e.message;
					}
				}
			},
			/**
			 * Changes the display type of a sublist
			 *
			 * @param {string} params.context
			 * @param {string} params.sublistId
			 * @param {string} params.displayType
			 **/
			setSublistDisplay: function (params) {
				var container = params.context.form || params.context.currentRecord;
				var sublist = container.getSublist(params.sublistId);
				if (sublist) {
					sublist.displayType = params.displayType;
				} else {
					log.debug('Sublist not found', 'Context does not contain sublist with id: ' + params.sublistId);
				}
			},

			hideBannerIfShown:  function () {
				if (banner.messageString) {
					banner.messageObject.hide();
					banner.messageObject = undefined;
					banner.messageString = undefined;
				}
			},

			showErrorBanner : function (title, message) {
				self._showBanner(title, message, uiMessage.Type.ERROR);
			},
			
			showWarningBanner : function (title, message) {
				self._showBanner(title, message, uiMessage.Type.WARNING);
			},

			_showBanner : function (title, message, bannerType) {
				if (banner.messageString === message) {
					return;
				}

				if (banner.messageObject) {
					banner.messageObject.hide();
				}

				banner.messageString = message;
				banner.messageObject = uiMessage.create({
					title: title,
					message: banner.messageString,
					type: bannerType,
				});
				if (scriptContext && scriptContext.getInstance().getScriptType().isUE()) {
					scriptContext.getInstance().getContext().form.addPageInitMessage(banner.messageObject);
				} else {
					banner.messageObject.show();
				}
			},
		};

		return {
			addField: self.addField,
			getField: self.getField,
			getValue: self.getValue,
			setValue: self.setValue,
			addSelectOption: self.addSelectOption,
			setFieldDisplay: self.setFieldDisplay,
			setSublistDisplay: self.setSublistDisplay,
			showErrorBanner: self.showErrorBanner,
			showWarningBanner: self.showWarningBanner,
			hideBannerIfShown: self.hideBannerIfShown,
			_test_module: self,
			_test_banner: banner,
		};
	}
);