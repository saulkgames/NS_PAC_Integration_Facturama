/**
 * Copyright (c) 2018, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([],
	function () {
		var PLUS_BUTTON_TAG = '_popup_new';
		var OPEN_BUTTON_TAG = '_popup_link';
		var INPUT_TAG = 'inpt_';
		var CODE_VALUE_SEPARATOR = ' - ';
		var NEW_OPTION_VALUE = '-1';
		var BLANK_OPTION_VALUE = '';

		var self = {
			removePopupButtons: function (dropdownId) {
				self._removePopupButton(dropdownId, PLUS_BUTTON_TAG);
				self._removePopupButton(dropdownId, OPEN_BUTTON_TAG);
			},
			getNsDropdown: function (dropdownId, windowInject) {
				var windowObject = windowInject || (typeof (window) !== 'undefined' ? window : null);
				var domId = INPUT_TAG + dropdownId;
				var domElement = document.getElementsByName(domId)[0];

				if (!domElement) {
					return;
				}

				try {
					return windowObject.getDropdown(domElement); // Undocumented NS function
				} catch (error) {
					// Do nothing
				}
			},
			selectOption: function (nsDropdown, valueCode) {
				var index = self._getOptionIndex(nsDropdown, valueCode);
				nsDropdown.setIndex(index);
			},
			deleteNewOption: function (nsDropdown) {
				nsDropdown.deleteOneOption(NEW_OPTION_VALUE);
			},
			deleteBlankOption: function (nsDropdown) {
				nsDropdown.deleteOneOption(BLANK_OPTION_VALUE);
			},
			_removePopupButton: function (dropdownId, buttonTag) {
				var domId = dropdownId + buttonTag;
				var popupButton = document.getElementById(domId);
				if (popupButton) {
					popupButton.parentNode.removeChild(popupButton);
				}
			},
			_getOptionIndex: function (nsDropdown, valueCode) {
				var valueCodes = nsDropdown.getTexts().map(function (text) {
					return text.split(CODE_VALUE_SEPARATOR)[0];
				});

				return valueCodes.indexOf(valueCode);
			},
		};

		return {
			dropdown: {
				removePopupButtons: self.removePopupButtons,
				selectOption: self.selectOption,
				deleteNewOption: self.deleteNewOption,
				deleteBlankOption: self.deleteBlankOption,
				getNsDropdown: self.getNsDropdown,
			},
		};
	});