/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulos 4 y 5: Gestor de Archivos (XML Download & PDF Builder)
 */
define(['N/https', 'N/file', 'N/render', 'N/record', 'N/log'], function(https, file, render, record, log) {
    'use strict';

    var TARGET_FOLDER_ID = -10; // TODO: Configurar tu Folder ID

    function downloadXml(cfdiId, baseGetUrl, headers, txnRecord) {
        var downloadUrl = baseGetUrl
            .replace('{id}', cfdiId);

        var response = https.get({ url: downloadUrl, headers: headers });
        
        if (response.code !== 200) {
            throw new Error('Fallo al descargar XML de Facturama. HTTP ' + response.code);
        }

        var responseJson = JSON.parse(response.body);
        
        var xmlFile = file.create({
            name: txnRecord.getValue('tranid') + '_' + cfdiId + '.xml',
            fileType: file.Type.XMLDOC,
            contents: responseJson.Content,
            folder: TARGET_FOLDER_ID
        });

        return xmlFile.save();
    }

    function generatePdf(txnId, txnType, xmlFileId) {
        var pdfFile = render.transaction({
            entityId: parseInt(txnId, 10),
            printMode: render.PrintMode.PDF
        });

        pdfFile.folder = TARGET_FOLDER_ID;
        pdfFile.isOnline = true;
        var pdfFileId = pdfFile.save();

        record.attach({ record: { type: 'file', id: xmlFileId }, to: { type: txnType, id: txnId } });
        record.attach({ record: { type: 'file', id: pdfFileId }, to: { type: txnType, id: txnId } });

        record.submitFields({
            type: txnType,
            id: txnId,
            values: { 'custbody_edoc_generated_pdf': pdfFileId },
            options: { ignoreMandatoryFields: true }
        });

        return pdfFileId;
    }

    return {
        downloadXml: downloadXml,
        generatePdf: generatePdf
    };
});