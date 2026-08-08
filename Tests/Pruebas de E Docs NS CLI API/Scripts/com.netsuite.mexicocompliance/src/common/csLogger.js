/**
 * Logger specific for ClientScripts
 * 
 * @NApiVersion 2.1
 * @NModuleScope Public
 */
define(
	[
		'N/url',
		'N/https',
		'N/log'
	],
	function (NUrl,
		NHttps,
		log) {
		var self = {
			log: function (exception, logLevel) {
				if (!logLevel) {
					logLevel = 'error';
				}

				// TODO: This is workaround until N/internal/elasticLogger unavailable on Client Script
				log.audit('LOGGER', 'Client Script');
				var parameters = {message: JSON.stringify(exception).replace(/"/g, '\'')};
				var parameterBody = JSON.stringify(parameters);
				var scriptUrl = NUrl.resolveScript({
					scriptId: 'customscript_mx_sl_logger',
					deploymentId: 'customdeploy_mx_sl_logger',
				});

				NHttps.post({
					url: scriptUrl,
					body: parameterBody,
				});
			},
		};
		return {
			log: self.log,
			_test_module: self,
		};

	}
);