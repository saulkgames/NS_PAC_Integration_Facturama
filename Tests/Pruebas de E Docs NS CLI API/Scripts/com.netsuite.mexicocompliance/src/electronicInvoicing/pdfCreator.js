/**
 * Copyright (c) 2019, Oracle and/or its affiliates. All rights reserved.
 *
 * @NApiVersion 2.1
 * @NModuleScope Public
 */

define([
	'N/render',
	'./../common/lib/fileUtils',
	'./../common/constants',
], function (
	render,
	fileUtils,
	constants
) {
	function createPdf (records, connection, fileName) {
		var renderer = render.create();
		var txnRecord = records.transaction;
		var oldPdfFileId = txnRecord.getValue(constants.FIELD.EI_GENERATED_PDF_EDOC);
		var pdfTemplateScriptId = connection.templates[txnRecord.type];

		renderer.setTemplateById({
			id: pdfTemplateScriptId,
		});
		renderer.addRecord({
			templateName: 'record',
			record: txnRecord,
		});

		// If the record is an item fulfillment that comes from a transfer order or an
		// intercompany transfer order, there will be no customer object
		if (records.customer) {
			renderer.addRecord({
				templateName: 'customer',
				record: records.customer,
			});
		}

		var customData = records.customData;
		customData.pacRfc = connection.taxId;
		var datasource = {
			format: render.DataSource.OBJECT,
			alias: 'custom',
			data: customData,
		};
		renderer.addCustomDataSource(datasource);
  
		var pdfFileOutput;
		var pdfFileId;
		pdfFileOutput = renderer.renderAsPdf();
		pdfFileOutput.name = fileName + '.pdf';
		pdfFileId = fileUtils.savePDFFile(
			'Outbound PDF Documents',
			pdfFileOutput,
			oldPdfFileId
		);
		return pdfFileId;
	}

	return {
		createPdf: createPdf,
	};
});
