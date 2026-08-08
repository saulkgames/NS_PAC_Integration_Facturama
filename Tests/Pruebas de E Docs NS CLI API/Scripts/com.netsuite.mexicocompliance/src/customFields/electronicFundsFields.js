/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 *
 */
define(
	[
		'N/error',
		'N/query',
		'N/runtime',
		'N/log',
		'../common/scriptContext',
		'../common/application',
		'../common/constants',
		'../common/ui',
	],
	function (
		error,
		query,
		runtime,
		log,
		scriptContext,
		application,
		constants,
		ui
	) {
		const fields = [
			constants.FIELD.MX_CFDI_PAYMENT_ID,
			constants.FIELD.MX_CFDI_ISSUER_ENTITY_RFC,
			constants.FIELD.MX_CFDI_ISSUE_BANK_NAME,
			constants.FIELD.MX_CFDI_PAYER_ACCOUNT,
			constants.FIELD.MX_CFDI_RECIPIENT_ENTITY_RFC,
			constants.FIELD.MX_CFDI_RECIPIENT_ACCOUNT,
			constants.FIELD.MX_CFDI_PAYMENT_CERTIFICATE,
			constants.FIELD.MX_CFDI_PAYMENT_STRING,
			constants.FIELD.MX_CFDI_PAYMENT_SIGNATURE,
			constants.FIELD.MX_CFDI_PAYMENT_STRING_TYPE,
		];
		const satPaymentMethodCodes = ['02', '03', '04', '05', '06', '28', '29'];

		const ElectronicFundsFields = function () {
			this.map = null;
		};

		ElectronicFundsFields.prototype.isInSession = function () {
			return !!this._getSessionValue();
		};

		ElectronicFundsFields.prototype._getSessionValue = function () {
			const mapJson = runtime.getCurrentSession().get({
				name: constants.OTHER.MX_ELECTRONIC_FUNDS,
			});

			return !!mapJson ? JSON.parse(mapJson) : null;
		};

		ElectronicFundsFields.prototype.fetchFromSession = function () {
			this.map = this._getSessionValue();

			if (!this.map) {
				throw error.create({
					name: 'UNABLE_TO_LOAD_ELECTRONIC_FUNDS_FIELDS',
					message: 'Attempted to retrieve value of electronic funds fields from session variable failed. The fields were probably not initialized before attempted usage or the current session has expired.',
				});
			}
		};

		ElectronicFundsFields.prototype.get = function () {
			if (this.map) {
				return this.map;
			}

			this.fetchFromSession();

			return this.map;
		};

		ElectronicFundsFields.prototype.refreshSession = function () {
			const satPaymentMethodQuery = query.create({
				type: constants.RECORD_TYPE.MEXICO_MAPPING_VALUE,
			});

			satPaymentMethodQuery.columns = [
				satPaymentMethodQuery.createColumn({
					fieldId: constants.FIELD.ID,
				}),
				satPaymentMethodQuery.createColumn({
					fieldId: constants.FIELD.MEXICO_MAPPING_VALUE_CODE,
				}),
			];

			const codeCondition = satPaymentMethodQuery.createCondition({
				fieldId: constants.FIELD.MEXICO_MAPPING_VALUE_CODE,
				operator: query.Operator.ANY_OF,
				values: satPaymentMethodCodes,
			});
			satPaymentMethodQuery.condition = satPaymentMethodQuery.and(codeCondition);

			runtime.getCurrentSession().set({
				name: constants.OTHER.MX_ELECTRONIC_FUNDS,
				value: JSON.stringify(satPaymentMethodQuery.run().results),
			});
		};

		ElectronicFundsFields.prototype.getDisplayType = function () {
			const context = scriptContext.getInstance().getContext();
			if (scriptContext.getInstance().getScriptType().isUE()
				&& !application.isViewMode(context)) {
				return constants.FIELD_DISPLAY_TYPE.NORMAL;
			}

			if (!application.isMexico(context)) {
				return constants.FIELD_DISPLAY_TYPE.HIDDEN;
			}

			let satPaymentMethodCode;
			try {
				satPaymentMethodCode = this._getSatPaymentMethodCode(context);
			} catch (exception) {
				return constants.FIELD_DISPLAY_TYPE.NORMAL;
			}

			return satPaymentMethodCodes.indexOf(satPaymentMethodCode) !== -1
				? constants.FIELD_DISPLAY_TYPE.NORMAL
				: constants.FIELD_DISPLAY_TYPE.HIDDEN;
		};

		ElectronicFundsFields.prototype.updateVisibility = function (context) {
			const displayType = this.getDisplayType();
			fields.forEach(function (fieldId) {
				ui.setFieldDisplay({
					context: context,
					fieldId: fieldId,
					displayType: displayType,
				});
			});
		};

		ElectronicFundsFields.prototype.clearFields = function () {
			const context = scriptContext.getInstance().getContext();

			if (application.isXEditMode(context)) {
				return;
			}

			let satPaymentMethodCode = '';
			try {
				satPaymentMethodCode = this._getSatPaymentMethodCode(context);
			} catch (exception) {
				satPaymentMethodCode = [];
				log.error('ELECTRONIC_FUNDS_FIELDS_ERROR', exception);
			}

			if (satPaymentMethodCodes.indexOf(satPaymentMethodCode) === -1) {
				fields.forEach(function (fieldId) {
					ui.setValue({
						context: context,
						fieldId: fieldId,
						value: '',
					});
				});
			}
		};

		ElectronicFundsFields.prototype._getSatPaymentMethodCode = function (context) {
			const satPaymentMethodId = application.getRecord(context).getValue({fieldId: constants.FIELD.MX_SAT_PAYMENT_METHOD});
			const satPaymentMethods = this.get();

			for (let i=0; i<satPaymentMethods.length; i++) {
				if (String(satPaymentMethods[i].values[0]) === String(satPaymentMethodId)) {
					return satPaymentMethods[i].values[1];
				}
			}

			return undefined;
		};

		const getInstance = function () {
			return new ElectronicFundsFields();
		};

		return {
			getInstance: getInstance,
		};
	}
);
