/**
 * Copyright © 2014, 2018, Oracle and/or its affiliates. All rights reserved.
 */

var TAF = TAF || {};
TAF.Translation = TAF.Translation || {};
 
TAF.Translation.fr = TAF.Translation.fr || {
	Culture: 'fr',
	Strings: {
		MAPPER_FORM_TITLE: 'Mexico Localization Mappage de champ',
		MAPPER_EDIT_BUTTON: 'Modifier',
		MAPPER_CANCEL_BUTTON: 'Annuler',
		MAPPER_SUBLIST_NAME: 'Mappage',
		MAPPER_CATEGORY_LABEL: 'Catégorie',
		MAPPER_TO_LABEL: 'Valeur',
		MAPPER_SAVE_SUCCESSFUL: 'Enregistré avec succès.',
		MAPPER_SAVE_ERROR: 'Certaines modifications n’ont pas été sauvegardées. Veuillez actualiser la page.',
		MAPPER_SUCCESS: 'Confirmation',
		MAPPER_ERROR: 'Erreur',
		MAPPER_RELOAD_WARNING_MESSAGE: 'Les données que vous avez entrées sur cette page n’ont pas été sauvegardées et vont être perdues. Appuyez sur OK pour continuer.',
		TAF_MAPPING_BANK: 'Banque',
		TAF_MAPPING_PAYMENT_METHOD: 'Mode de paiement',
		TAF_MAPPING_ACCOUNT_TYPE: 'Type de compte',
		TAF_MAPPING_ACCOUNT: 'Compte',
		TAF_MAPPING_SUBSIDIARY: 'Filiale',
		TAF_MAPPING_TRANSACTION_TYPE: 'Type de transaction',
		TAF_MAPPING_POLICY_TYPE: 'Politique',
		TAF_MAPPING_UNIT_OF_MEASURE: 'Unité de mesure',
		TAF_MAPPING_UNITS_TYPE: 'Type d’unités',
		TAF_MAPPING_TAX_CATEGORY: 'Type d’impôt',
		TAF_MAPPING_TAX_FACTOR_TYPE: 'Code fiscal',
		CUSTPAGE_CATEGORY_FIELD_HELP: 'Sélectionnez le champ que vous voulez mapper. Dans l’onglet Mappage vous pouvez mapper les champs NetSuite aux catégories définies par le SAT en indiquant une valeur dans la colonne de droite.<br /><br />Pour le regroupement de comptes, vous devez utiliser une importation CSV pour mapper les comptes attribués à votre filiale mexicaine aux codes de groupe définis par le SAT.<br /><br />Le code d’unité SAT doit d’abord être défini sur Configuration > Mexico Localization > Gérer les codes d’unités SAT.<br /><br />Les champs mappés seront utilisés pour les fichiers de facturation électronique ou de comptabilité électronique après avoir été enregistrés dans le système.',
		CUSTPAGE_ACCOUNT_TYPE_FIELD_HELP: 'Sélectionnez le type de compte que vous voulez mapper. Les valeurs associées au compte sélectionné apparaîtront dans l’onglet Mappage.',
		CUSTPAGE_SUBSIDIARY_FIELD_HELP: 'Sélectionnez la filiale pour laquelle vous voulez mapper les valeurs.',
		CUSTPAGE_UNITS_OF_MEASURE_FIELD_HELP: 'Sélectionnez le type d’unités que vous voulez mapper.',
		GENERAL_LEDGER: 'Grand livre général',
		SII_RETROACTIVE_DESCRIPTION: 'Registre du premier semestre',
        WITHHOLDING: 'Retenues',
	},
};