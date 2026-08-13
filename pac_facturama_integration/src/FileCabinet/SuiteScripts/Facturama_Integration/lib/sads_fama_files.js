/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo: Gestor de Archivos (Clon de pdfCreator.js)
 */
define(['N/file', 'N/encode', 'N/render'], function(file, encode, render) {
    'use strict';

    var TARGET_FOLDER_ID = -15; 

    function saveXml(fileName, base64Content) {
        var decodedXml = '';
        try {
            decodedXml = encode.convert({ string: base64Content, inputEncoding: encode.Encoding.BASE_64, outputEncoding: encode.Encoding.UTF_8 });
        } catch (e) { decodedXml = base64Content; }

        var xmlFile = file.create({ name: fileName, fileType: file.Type.XMLDOC, contents: decodedXml, folder: TARGET_FOLDER_ID });
        return xmlFile.save();
    }

    function generateCertifiedPdf(txnRecord, customerRecord, pdfTemplateId, extraFields, fileName) {
        var renderer = render.create();
        
        renderer.setTemplateById({ id: pdfTemplateId });
        
        renderer.addRecord({ templateName: 'record', record: txnRecord });
        if (customerRecord) {
            renderer.addRecord({ templateName: 'customer', record: customerRecord });
        }

        // Replicamos el objeto 'custom.certData' de Oracle
        var customData = {
            certData: extraFields 
        };
        
        renderer.addCustomDataSource({
            format: render.DataSource.OBJECT,
            alias: 'custom',
            data: customData
        });

        var pdfFile = renderer.renderAsPdf();
        pdfFile.name = fileName;
        pdfFile.folder = TARGET_FOLDER_ID;
        return pdfFile.save();
    }

    return { saveXml: saveXml, generateCertifiedPdf: generateCertifiedPdf };
});