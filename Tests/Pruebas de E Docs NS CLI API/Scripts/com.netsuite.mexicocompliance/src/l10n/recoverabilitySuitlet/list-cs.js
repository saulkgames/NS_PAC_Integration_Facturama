/**
 * @NApiVersion 2.1
 */
define([
	'N/ui/dialog',
	'N/https',
	'N/url',
	'./../../translations/translator',
], function (dialog, https, url, translator) {
 
	var SUITELET_SCRIPT_ID = 'customscript_mx_recoverability';
	var SUITELET_DEPLOYMENT_ID = 'customdeploy_mx_recover_post';
 
	var passTest = false;
	var reinstallParams = {};
	var linkObj;
	var documentObject = typeof (document) !== 'undefined' ? document : null;
 
	/**
     * Callback function for confirm dialog
     *
     * @param {Boolean} val
     */
	function confirmCallback (val) {
		if (val === true) {
			passTest = true;
			linkObj.style.display = 'none';
			reinstall();
		}
	}
 
	/**
     * Callback function for failed promises
     *
     * @param {String} reason
     */
	function failCallback (reason) {
		dialog.alert({
			title: translator.RECOVERABILITY_REQUEST_FAILED(),
			message: reason,
		});
	}

	/**
     * Update list values based on request response
     *
     * @param {Object} response
     */
	function updateValues (response) {
 
		var classValueMap = {
			'result-status': 'status',
			'result-modifieddate': 'updateddate',
			'result-modifiedby': 'updatedby',
		};
 
		var parentNode = documentObject.getElementById('localizationComponent'+reinstallParams.id);
		for (var i = 0; i < parentNode.childNodes.length; i++) {
			var className = parentNode.childNodes[i].className;
			if (classValueMap.hasOwnProperty(className)) {
				var tdNode = parentNode.childNodes[i];
				if (className === 'result-status') {
					var linkNodes = tdNode.getElementsByTagName('a');
					if (linkNodes.length > 0) {
						linkNodes[0].setAttribute('data-details', response['details']);
						linkNodes[0].innerHTML = response[classValueMap[className]];
						linkNodes[0].className = (response['errorStatus']) ? 'error-status' : '';
					}
				} else {
					tdNode.innerHTML = response[classValueMap[className]];
				}
			}
		}
	}
 
	/**
     * Callback function for https.post promise
     *
     * @param {Object} response
     */
	function processResponse (response) {
		var responseBody = JSON.parse(response.body);
		updateValues(responseBody);
		linkObj.style.display = 'inline';
	}

	/**
     * Handles 'reinstall' link click
     *
     * @param {Object} obj Reinstall link DOM object
     * @param {Object} params
     */
	function reinstall (obj, params) {
		if (params) {
			linkObj = obj;
			reinstallParams = params;
		}
		if (!passTest) {
			dialog.confirm({
				title: translator.RECOVERABILITY_CONFIRM(),
				message: translator.RECOVERABILITY_CONFIRM_REINSTALL([reinstallParams.name]),
			}).then(confirmCallback).catch(failCallback);
		} else {
			passTest = false;
 
			var requestUrl = url.resolveScript({
				scriptId: SUITELET_SCRIPT_ID,
				deploymentId: SUITELET_DEPLOYMENT_ID,
			});

			var parentNode = documentObject.getElementById('localizationComponent'+reinstallParams.id);
			var statusNodes = parentNode.getElementsByClassName('result-status');
			if (statusNodes.length > 0) {
				var statusLinks = statusNodes[0].getElementsByTagName('a');
				if (statusLinks.length > 0) {
					statusLinks[0].className = '';
					statusLinks[0].innerHTML = '...';
				}
			}
			https.post.promise({
				url: requestUrl,
				body: reinstallParams,
			}).then(processResponse).catch(failCallback);
		}
	}

	/**
     * Show dialog for details
     *
     * @param {Object} obj DOM element
     */
	function showDetails (obj) {
		var details = obj.getAttribute('data-details');
		if (details) {
			dialog.alert({
				title: translator.RECOVERABILITY_DETAILS(),
				message: details,
			});
		}
	}

	// This function is used only in unit tests. We need it to reset the internal
	// variables of the module after each test, otherwise we would get random failures.
	function reset (documentInject) {
		passTest = false;
		reinstallParams = {};
		linkObj = undefined;
		documentObject = documentInject;
	}
 
	return {
		reinstall: reinstall,
		showDetails: showDetails,
		reset: reset,
	};
});