/**
 * Copyright (c) 2017, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 */


define([], function () {

	var translation = {};

	translation['WITHHOLDING'] = 'Einbehaltung';
	translation['EDIT_BUTTON'] = 'Bearbeiten';
	translation['CANCEL_BUTTON'] = 'Abbrechen';
	translation['TAX_TYPE'] = 'Steuerart';
	translation['EXAMPLE_PLAIN_TEXT'] = 'Deutscher Text';
	translation['EXAMPLE_TEXT_WITH_INSERTED_VALUE'] = 'Steuersatz Verlauf ({tax_code_name})';
	translation['LABEL_BANK_INFO'] = 'Bankinformationen';
	translation['LABEL_PAYMENT_METHOD'] = 'Zahlungsart';
	translation['HELP_BANK_INFO'] = 'Wählen Sie den Datensatz für Bankinformationen des Zahlungsempfängers aus, den Sie für diese Transaktion verwenden wollen. Dieses Datenfeld wird verwendet für Mexico Localization.';
	translation['ERROR_DATE_RANGE'] = 'Das „Gültig bis“-Datum muss nach dem „Wirksam ab“-Datum liegen.';
	translation['ERROR_GENERAL_TITLE'] = 'Validierungsfehler';
	translation['ERROR_MISSING_MAPPING'] = 'Zuordnung für Datensatztyp {record_type} fehlt.';
	translation['ERROR_SUBSIDIARY_COUNTRY_MISSING'] = 'Für die Niederlassung mit dieser Identifikationsnummer wurde kein Land gefunden.';
	translation['ERROR_SUBSIDIARY_MISSING'] = 'Für den Datensatz oder Benutzer wurde keine Niederlassung gefunden';
	translation['ERROR_UNEXPECTED_SAT_ITEM_CODE_1'] = 'SAT-Artikelnummer mit Code';
	translation['ERROR_UNEXPECTED_SAT_ITEM_CODE_2'] = 'nicht gefunden';
	translation['ERROR_RFC_COMPANY'] = 'Die RFC-Nummer muss dem für Mexiko erforderlichen Format entsprechen (XXX000000XXX). Alternativ können Sie die allgemeine RFC-Nummer für ausländische Einheiten verwenden: XEXX010101000.';
	translation['ERROR_RFC_PERSON'] = 'Die RFC-Nummer muss dem für Mexiko erforderlichen Format entsprechen (XXXX000000XXX).';
	translation['ERROR_SAT_CODE_DUPLICATED'] = 'Sie können diesen Code nicht eingeben, weil er bereits für einen anderen Datensatz verwendet wurde.';
	translation['EI_AUDIT_TRAIL_CERTIFY_SUCCESS'] = 'E-Dokument erfolgreich zertifiziert';
	translation['ERROR_EI_AUDIT_TRAIL_NO_PAC'] = 'Es wurde keine aktive PAC-Verbindung gefunden.';
	translation['ERROR_EI_AUDIT_TRAIL_NO_PAC_RESPONSE'] = 'Versuch, mit PAC zu verbinden, fehlgeschlagen; keine Reaktion vom PAC.';
	translation['ERROR_EI_AUDIT_NO_PLUGIN_IMPLEMENTATION_FOUND'] = 'Keine Verbindung mit PAC möglich, da keine gültige Plugin-Implementierung gefunden wurde.';
	translation['ERROR_EI_SUBSIDIARY_ALREADY_IN_USE'] = 'At least one of the selected subsidiaries is already configured on another enabled PAC. Make sure that you assign a subsidiary to one enabled PAC only.';
	translation['ERROR_EI_ONLY_ONE_ENABLED_PAC_IS_ALLOWED'] = 'This PAC cannot be enabled because there is already an enabled PAC in your account. To enable this PAC, disable the currently enabled one and try again.';
	translation['ERROR_UNIQUE_PAC_VIOLATE_BANNER_TITLE'] = 'Eine aktive PAC-Verbindung liegt vor.';
	translation['ERROR_NO_ACCEPT_DIALOG_MSG'] = 'Sie müssen die Wichtige Mitteilung lesen und akzeptieren, bevor Sie sie speichern.';
	translation['PAC_LICENSE_AGREEMENT'] = 'Indem Sie einen Dienstleister für Zertifizierungen in dieser Anwendung auswählen, erteilen Sie Oracle und NetSuite die Genehmigung, Informationen direkt an den Dienstleister für PAC-Zertifizierungen zu übertragen. Bitte stellen Sie vor einem möglichen Datentransfer sicher, dass Sie sämtliche erforderlichen Genehmigungen eingeholt haben und etwaige erforderlichen Vereinbarungen direkt mit dem Dienstleister der PAC-Zertifizierung geschlossen haben.';
	translation['WARNING_GENERAL_TITLE'] = 'Warnung zur Validierung';
	translation['ERROR_INVALID_OPERATION_TYPE'] = 'Der Vorgangstyp „Immobilien-Leasing“ sollte nicht verwendet werden, wenn ein ausländischer Verkäufer ausgewählt wird. Mit der Auswahl fortfahren?';
	translation['ERROR_INVALID_TAX_CODES_FOREIGN'] = 'Mexiko – Ein ausländischer Verkäufer sollte keine Nicht-Import-Steuercodes verwenden ({tax_codes}).Weiter speichern?';
	translation['ERROR_INVALID_TAX_CODES_LOCAL'] = 'Mexiko – Lokale Verkäufer sollten keinen Import-Steuercode verwenden ({tax_codes}).Weiter speichern?';
    translation['UUID_PDF'] = 'UUID';
    translation['RFC_PDF'] = 'RFC';
	translation['CFDI_USAGE_PDF'] = 'CFDI-Verwendung';
	translation['INDUSTRY_TYPE_PDF'] = 'BRANCHENART';
	translation['CSD_SERIAL_NUMBER_PDF'] = 'CSD-Seriennummer';
	translation['PAYMENT_METHOD_PDF'] = 'SAT-Zahlungsmethode';
	translation['PAYMENT_TERMS_PDF'] = 'SAT-Zahlungsbedingung';
	translation['TAX_PDF'] = 'Steuer';
	translation['FACTOR_PDF'] = 'Faktor';
	translation['ORIGINAL_STRING_PDF'] = 'Ursprüngliche String';
	translation['CFDI_SIGNATURE_PDF'] = 'CFDI-Unterschrift';
	translation['SAT_SIGNATURE_PDF'] = 'SAT-Unterschrift';
	translation['CERTIFICATION_TIMESTAMP_PDF'] = 'Zeitstempel zur Zertifizierung';
	translation['SAT_SERIAL_NUMBER_PDF'] = 'SAT-Seriennummer';
	translation['AMOUNT_PDF'] = 'Betrag';
	translation['AMOUNT_DUE_PDF'] = 'Fälliger Betrag';
	translation['PAID_AMOUNT_PDF'] = 'Bezahlter Betrag';
	translation['ISSUANCE_PDF'] = 'AUSGABE';
	translation['CUSTOMER_INFO_PDF'] = 'Kundeninformation';
	translation['RECEIVER_INFO_PDF'] = 'Empfängerinformationen';
	translation['ISSUER_INFO_PDF'] = 'Ausgabeinformationen';
	translation['TRANSFERS_PDF'] = 'ÜBERTRAGUNGEN';
	translation['WITHHOLDING_PDF'] = 'EINBEHALTUNG';
	translation['TOTAL_WITHHODLING_TAXES_PDF'] = 'Quellensteuer gesamt';
	translation['TOTAL_TRANSFER_TAXES_PDF'] = 'Steuerbelastung gesamt';
	translation['PAC_RFC_PDF'] = 'PAC-RFC';
	translation['RELATED_CFDIS_PDF'] = 'In Bezug stehende CFDIs';
	translation['INVOICE_PDF'] = 'Rechnung';
	translation['SALES_ORDER_PDF'] = 'Kundenauftrag';
	translation['SHIP_TO_PDF'] = 'Versand an';
	translation['BILL_TO_PDF'] = 'Rechnungsanschrift';
	translation['SHIP_VIA_PDF'] = 'Versand über';
	translation['SALES_REP_PDF'] = 'Verkaufsvertreter';
	translation['PARTNER_PDF'] = 'Partner';
	translation['DUE_DATE_PDF'] = 'Fälligkeitsdatum';
	translation['TERMS_PDF'] = 'Bedingungen';
	translation['CURRENCY_PDF'] = 'Währung';
	translation['QUANTITY_PDF'] = 'Menge';
	translation['UNIT_PDF'] = 'Einheiten';
	translation['ITEM_DESCRIPTION_PDF'] = 'Artikelbeschreibung';
	translation['DESCRIPTION_PDF'] = 'Beschreibung';
	translation['UNIT_RATE_PDF'] = 'Einheitsrate';
	translation['DISCOUNT_PDF'] = 'Rabatt';
	translation['SALES_INFO_PDF'] = 'Umsatzerlösinformationen';
	translation['SUBTOTAL_PDF'] = 'Teilsumme';
	translation['TAX_TOTAL_PDF'] = 'Steuer-Gesamtsumme';
	translation['TOTAL_PDF'] = 'Gesamt';
	translation['PREVIOUS_AMOUNT_PDF'] = 'Vorheriger Betrag';
	translation['PARTS_PDF'] = 'Teile';
	translation['BASE_PDF'] = 'Basis';
	translation['RATE_PDF'] = 'Satz';
	translation['SERIE_PDF'] = 'SERIE';
	translation['FOLIO_PDF'] = 'FOLIO';
	translation['TRANSACTION_TYPE_CASH_SALE_PDF'] = 'I - Ingreso';
	translation['TRANSACTION_TYPE_INVOICE_PDF'] = 'I - Ingreso';
	translation['TRANSACTION_TYPE_CREDIT_MEMO_PDF'] = 'E - Egreso';
	translation['TRANSACTION_TYPE_PAYMENT_PDF'] = 'P - Pago';
	translation['TRANSACTION_TYPE_ITEM_FULFILMENT_PDF'] = 'T - Traslado';
	translation['FOOTER_PDF'] = 'Dieses Dokument ist eine gedruckte Darstellung einer CFDI.';
	translation['RECOVERABILITY_PAGE_NAME'] = 'Mexico Localization Komponenten';
	translation['RECOVERABILITY_FIELD_COMPONENT'] = 'Name der Komponente';
	translation['RECOVERABILITY_FIELD_STATUS'] = 'Status';
	translation['RECOVERABILITY_FIELD_UPDATED_DATE'] = 'Datum der letzten Aktualisierung';
	translation['RECOVERABILITY_FIELD_UPDATED_BY'] = 'Zuletzt aktualisiert von';
	translation['RECOVERABILITY_ACTION'] = 'Aktion';
	translation['RECOVERABILITY_REINSTALL'] = 'Erneut installieren';
	translation['RECOVERABILITY_DETAILS'] = 'Details';
	translation['RECOVERABILITY_CONFIRM'] = 'Bestätigen';
	translation['RECOVERABILITY_CONFIRM_REINSTALL'] = 'Sind Sie sicher, dass Sie neu installieren möchten {COMPONENTNAME}?';
	translation['RECOVERABILITY_INSTALLED'] = 'Die Komponente wurde erfolgreich installiert.';
	translation['RECOVERABILITY_REQUEST_FAILED'] = 'Anfrage fehlgeschlagen';
	translation['RECOVERABILITY_REINSTALL_REQUEST_FAILED'] = 'Anfrage zu erneuter Installierung fehlgeschlagen.';
	translation['RECOVERABILITY_NOT_SUPPORTED'] = 'Anfrage zu erneuter Installierung fehlgeschlagen. Target SuiteApp {SUITEAPPNAME} wird nicht unterstützt.';
	translation['RECOVERABILITY_NO_SHAREDMODULE'] = 'Geteiltes Modul kann nicht lokalisiert werden.';
	translation['OPERATION_TYPE_PROFESSIONAL_SERVICES'] = 'Professionelle Dienstleistungen';
	translation['OPERATION_TYPE_REAL_ESTATE_LEASING'] = 'Immobilien-Leasing';
	translation['OPERATION_TYPE_OTHERS'] = 'Sonstige';
	translation['OPERATION_TYPE_DEPRECATED'] = 'Vorgangsart (Veraltet)';

	return translation;
});

