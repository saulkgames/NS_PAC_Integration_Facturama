/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 */


define([], function () {

	var translation = {};

	translation['WITHHOLDING'] = 'Tilbageholdelse';
	translation['EDIT_BUTTON'] = 'Rediger';
	translation['CANCEL_BUTTON'] = 'Annuller';
	translation['TAX_TYPE'] = 'Skattetype';
	translation['EXAMPLE_PLAIN_TEXT'] = 'Engelsk tekst';
	translation['EXAMPLE_TEXT_WITH_INSERTED_VALUE'] = 'Skattesatshistorik ({tax_code_name})';
	translation['LABEL_BANK_INFO'] = 'Bankoplysninger';
	translation['LABEL_PAYMENT_METHOD'] = 'Betalingsmetode';
	translation['HELP_BANK_INFO'] = 'Vælg betalingsmodtagers bankoplysninger til brug for denne transaktion. Dette felt bruges til Mexico Localization.';
	translation['ERROR_DATE_RANGE'] = 'Gyldig indtil-datoen skal ligge senere end Gælder fra-datoen';
	translation['ERROR_GENERAL_TITLE'] = 'Valideringsfejl';
	translation['ERROR_MISSING_MAPPING'] = 'Mapning for posttypen {record_type} mangler.';
	translation['ERROR_SUBSIDIARY_COUNTRY_MISSING'] = 'Intet land fundet for datterselskab med ID';
	translation['ERROR_SUBSIDIARY_MISSING'] = 'Intet land fundet for datterselskab for post eller bruger';
	translation['ERROR_UNEXPECTED_SAT_ITEM_CODE_1'] = 'SAT-varekode med kode';
	translation['ERROR_UNEXPECTED_SAT_ITEM_CODE_2'] = 'ikke fundet';
	translation['ERROR_RFC_COMPANY'] = 'RFC-nummeret skal være i det format, der kræves for Mexico (XXX000000XXX). Alternativt kan du bruge det generiske RFC-nummer til udenlandske enheder: XEXX010101000.';
	translation['ERROR_RFC_PERSON'] = 'RFC-nummeret skal være i det format, der kræves af Mexico (XXXX000000XXX).';
	translation['ERROR_SAT_CODE_DUPLICATED'] = 'Du kan ikke indtaste denne kode, da den allerede er blevet brugt i en anden post.';
	translation['EI_AUDIT_TRAIL_CERTIFY_SUCCESS'] = 'E-dokumentet er certificeret';
	translation['ERROR_EI_AUDIT_TRAIL_NO_PAC'] = 'Ingen aktiv PAC-forbindelse fundet.';
	translation['ERROR_EI_AUDIT_TRAIL_NO_PAC_RESPONSE'] = 'Forbindelse til PAC forsøgt, men der var ingen respons fra PAC';
	translation['ERROR_EI_AUDIT_NO_PLUGIN_IMPLEMENTATION_FOUND'] = 'Kan ikke oprette forbindelse til PAC, da der ikke blev fundet en gyldig plugin-implementering';
	translation['ERROR_EI_SUBSIDIARY_ALREADY_IN_USE'] = 'At least one of the selected subsidiaries is already configured on another enabled PAC. Make sure that you assign a subsidiary to one enabled PAC only.';
	translation['ERROR_EI_ONLY_ONE_ENABLED_PAC_IS_ALLOWED'] = 'This PAC cannot be enabled because there is already an enabled PAC in your account. To enable this PAC, disable the currently enabled one and try again.';
	translation['ERROR_UNIQUE_PAC_VIOLATE_BANNER_TITLE'] = 'Der er en aktiv PAC-forbindelse';
	translation['ERROR_NO_ACCEPT_DIALOG_MSG'] = 'Du skal læse og acceptere den vigtige meddelelse, før du gemmer.';
	translation['PAC_LICENSE_AGREEMENT'] = 'Ved at vælge en certificeringstjenesteudbyder i denne applikation giver du Oracle + NetSuite tilladelse til at overføre information direkte til denne PAC-certificeringstjenesteudbyder. Før du aktiverer overførsel af oplysninger, skal du sørge for, at du har opnået alle nødvendige tilladelser og udført eventuelle nødvendige aftaler direkte hos PAC-certificeringstjenesteudbyderen.';
	translation['WARNING_GENERAL_TITLE'] = 'Valideringsadvarsel';
	translation['ERROR_INVALID_OPERATION_TYPE'] = 'Driftstypen Leasing af fast ejendom bør ikke bruges, når du vælger en udenlandsk leverandør. Vil du fortsætte med dette valg?';
	translation['ERROR_INVALID_TAX_CODES_FOREIGN'] = 'Mexico – Udenlandsk leverandør skal ikke bruge en ikke-import-skattekode ({tax_codes}).Vil du fortsætte med at gemme?';
	translation['ERROR_INVALID_TAX_CODES_LOCAL'] = 'Mexico – Lokal leverandør skal ikke bruge en import-skattekode ({tax_codes}).Vil du fortsætte med at gemme?';
    translation['UUID_PDF'] = 'UUID';
    translation['RFC_PDF'] = 'RFC';
	translation['CFDI_USAGE_PDF'] = 'CFDI-brug';
	translation['INDUSTRY_TYPE_PDF'] = 'BRANCHETYPE';
	translation['CSD_SERIAL_NUMBER_PDF'] = 'CSD-serienummer';
	translation['PAYMENT_METHOD_PDF'] = 'SAT-betalingsmetode';
	translation['PAYMENT_TERMS_PDF'] = 'SAT-betalingsperiode';
	translation['TAX_PDF'] = 'Skat';
	translation['FACTOR_PDF'] = 'Faktor';
	translation['ORIGINAL_STRING_PDF'] = 'Original streng';
	translation['CFDI_SIGNATURE_PDF'] = 'CFDI-underskrift';
	translation['SAT_SIGNATURE_PDF'] = 'SAT-underskrift';
	translation['CERTIFICATION_TIMESTAMP_PDF'] = 'Certificeringstidsstempel';
	translation['SAT_SERIAL_NUMBER_PDF'] = 'SAT-serienummer';
	translation['AMOUNT_PDF'] = 'Beløb';
	translation['AMOUNT_DUE_PDF'] = 'Forfaldsbeløb';
	translation['PAID_AMOUNT_PDF'] = 'Betalt beløb';
	translation['ISSUANCE_PDF'] = 'UDSTEDELSE';
	translation['CUSTOMER_INFO_PDF'] = 'Kundeinformation';
	translation['RECEIVER_INFO_PDF'] = 'Modtageroplysninger';
	translation['ISSUER_INFO_PDF'] = 'Udstederinformation';
	translation['TRANSFERS_PDF'] = 'OVERFØRSLER';
	translation['WITHHOLDING_PDF'] = 'TILBAGEHOLDELSE';
	translation['TOTAL_WITHHODLING_TAXES_PDF'] = 'Totalt tilbageholdt skat';
	translation['TOTAL_TRANSFER_TAXES_PDF'] = 'Total overførselsskat';
	translation['PAC_RFC_PDF'] = 'PAC RFC';
	translation['RELATED_CFDIS_PDF'] = 'Relaterede CFDI\'er';
	translation['INVOICE_PDF'] = 'Faktura';
	translation['SALES_ORDER_PDF'] = 'Salgsordre';
	translation['SHIP_TO_PDF'] = 'Afsend til';
	translation['BILL_TO_PDF'] = 'Fakturér til';
	translation['SHIP_VIA_PDF'] = 'Afsend via';
	translation['SALES_REP_PDF'] = 'Sælger';
	translation['PARTNER_PDF'] = 'Partner';
	translation['DUE_DATE_PDF'] = 'Forfaldsdato';
	translation['TERMS_PDF'] = 'Vilkår';
	translation['CURRENCY_PDF'] = 'Valuta';
	translation['QUANTITY_PDF'] = 'Antal';
	translation['UNIT_PDF'] = 'Enheder';
	translation['ITEM_DESCRIPTION_PDF'] = 'Varebeskrivelse';
	translation['DESCRIPTION_PDF'] = 'Beskrivelse';
	translation['UNIT_RATE_PDF'] = 'Enhedspris';
	translation['DISCOUNT_PDF'] = 'Rabat';
	translation['SALES_INFO_PDF'] = 'Salgsoplysninger';
	translation['SUBTOTAL_PDF'] = 'Subtotal';
	translation['TAX_TOTAL_PDF'] = 'Skat total';
	translation['TOTAL_PDF'] = 'Total';
	translation['PREVIOUS_AMOUNT_PDF'] = 'Forrige beløb';
	translation['PARTS_PDF'] = 'Dele';
	translation['BASE_PDF'] = 'Grundlag';
	translation['RATE_PDF'] = 'Sats';
	translation['SERIE_PDF'] = 'SERIE';
	translation['FOLIO_PDF'] = 'FOLIO';
	translation['TRANSACTION_TYPE_CASH_SALE_PDF'] = 'I - Ingreso';
	translation['TRANSACTION_TYPE_INVOICE_PDF'] = 'I - Ingreso';
	translation['TRANSACTION_TYPE_CREDIT_MEMO_PDF'] = 'E - Egreso';
	translation['TRANSACTION_TYPE_PAYMENT_PDF'] = 'P - Pago';
	translation['TRANSACTION_TYPE_ITEM_FULFILMENT_PDF'] = 'T - Traslado';
	translation['FOOTER_PDF'] = 'Dette dokument er en trykt udgave af en CFDI';
	translation['RECOVERABILITY_PAGE_NAME'] = 'Mexico Localization Komponenter';
	translation['RECOVERABILITY_FIELD_COMPONENT'] = 'Komponentnavn';
	translation['RECOVERABILITY_FIELD_STATUS'] = 'Status';
	translation['RECOVERABILITY_FIELD_UPDATED_DATE'] = 'Sidst opdateret';
	translation['RECOVERABILITY_FIELD_UPDATED_BY'] = 'Sidst opdateret af';
	translation['RECOVERABILITY_ACTION'] = 'Handling';
	translation['RECOVERABILITY_REINSTALL'] = 'Geninstallér';
	translation['RECOVERABILITY_DETAILS'] = 'Detaljer';
	translation['RECOVERABILITY_CONFIRM'] = 'Bekræft';
	translation['RECOVERABILITY_CONFIRM_REINSTALL'] = 'Er du sikker på, at du vil geninstallere {COMPONENTNAME}?';
	translation['RECOVERABILITY_INSTALLED'] = 'Komponenten er installeret.';
	translation['RECOVERABILITY_REQUEST_FAILED'] = 'Anmodningen mislykkedes';
	translation['RECOVERABILITY_REINSTALL_REQUEST_FAILED'] = 'Anmodningen om geninstallation mislykkedes.';
	translation['RECOVERABILITY_NOT_SUPPORTED'] = 'Anmodningen om geninstallation mislykkedes. Target SuiteApp {SUITEAPPNAME} understøttes ikke.';
	translation['RECOVERABILITY_NO_SHAREDMODULE'] = 'Kan ikke finde delt modul.';
	translation['OPERATION_TYPE_PROFESSIONAL_SERVICES'] = 'Professionelle tjenester';
	translation['OPERATION_TYPE_REAL_ESTATE_LEASING'] = 'Leasing af fast ejendom';
	translation['OPERATION_TYPE_OTHERS'] = 'Andre';
	translation['OPERATION_TYPE_DEPRECATED'] = 'Driftstype (frarådet)';

	return translation;
});

