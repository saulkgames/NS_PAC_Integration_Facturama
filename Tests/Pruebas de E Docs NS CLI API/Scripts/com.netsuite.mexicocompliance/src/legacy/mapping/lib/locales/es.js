/**
 * Copyright © 2014, 2018, Oracle and/or its affiliates. All rights reserved.
 */

var TAF = TAF || {};
TAF.Translation = TAF.Translation || {};

TAF.Translation.es = TAF.Translation.es || {
	Culture: 'es',
	Strings: {
		// TAF Mapper
		MAPPER_FORM_TITLE: 'Asignación de campos de archivos de auditoría',
		MAPPER_EDIT_BUTTON: 'Editar',
		MAPPER_CANCEL_BUTTON: 'Cancelar',
		MAPPER_SUBLIST_NAME: 'Asignación',
		MAPPER_CATEGORY_LABEL: 'Categoría',
		MAPPER_TO_LABEL: 'Valor',
		MAPPER_SAVE_SUCCESSFUL: 'Se guardó correctamente.',
		MAPPER_SAVE_ERROR: 'Algunos cambios no se guardaron. Vuelva a cargar la página.',
		MAPPER_SUCCESS: 'Confirmación',
		MAPPER_ERROR: 'Error',
		MAPPER_RELOAD_WARNING_MESSAGE: 'Los datos que ingresó en esta página no se guardaron y se perderán. Presione OK para seguir.',

		// UI Field Labels
		TAF_MAPPING_BANK: 'Banco',
		TAF_MAPPING_PAYMENT_METHOD: 'Forma de pago',
		TAF_MAPPING_ACCOUNT_TYPE: 'Tipo de cuenta',
		TAF_MAPPING_ACCOUNT: 'Cuenta',
		TAF_MAPPING_SUBSIDIARY: 'Subsidiaria',
		TAF_MAPPING_TRANSACTION_TYPE: 'Tipo de transacción',
		TAF_MAPPING_POLICY_TYPE: 'Política',
		TAF_MAPPING_UNIT_OF_MEASURE: 'Unidades de medida',
		TAF_MAPPING_UNITS_TYPE: 'Tipo de unidades',
		TAF_MAPPING_TAX_CATEGORY: 'Tipo de impuesto',
		TAF_MAPPING_TAX_FACTOR_TYPE: 'Código de impuesto',
		TAF_MAPPING_TAX_REGION: 'Código de impuesto',
		TAF_MAPPING_TAX_CREDIT_TYPE: 'Código de impuesto',


		// Field level help
		CUSTPAGE_CATEGORY_FIELD_HELP: 'Seleccione el campo que desea asignar. En la ficha de asignación, puede asignar campos de NetSuite a categorías definidas por el SAT si especifica un valor en la columna derecha.  <br /><br />'
                                      + ' Para Agrupar cuentas, debe usar una importación CSV para asignar las cuentas asignadas a su subsidiaria de México a fin de agrupar códigos definidos por el SAT.  <br /><br />'
                                      + '  El Código de unidad del SAT debe definirse primero en Configuración > Mexico Localization > Administrar Códigos de unidad del SAT.  <br /><br />'
                                      + '  Los campos asignados se usarán para archivos de Facturación electrónica o Contabilidad electrónica después de guardarlos en el sistema.',
		CUSTPAGE_ACCOUNT_TYPE_FIELD_HELP: 'Seleccione el tipo de cuenta que desea asignar. Los valores para la cuenta seleccionada aparecerán en la ficha Asignación.',
		CUSTPAGE_SUBSIDIARY_FIELD_HELP: 'Seleccione la subsidiaria para la que desea asignar valores.',
		CUSTPAGE_UNITS_OF_MEASURE_FIELD_HELP: 'Seleccione el tipo de unidades que desea asignar.',
		GENERAL_LEDGER: 'Libro mayor',
		SII_RETROACTIVE_DESCRIPTION: 'Registro de la primera mitad del año',

        WITHHOLDING: 'Retención',
	},

};