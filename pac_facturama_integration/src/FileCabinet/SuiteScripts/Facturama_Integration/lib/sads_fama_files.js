/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * 
 * Módulo: Gestor de Archivos
 */
define(['N/file', 'N/encode'], function(file, encode) {
    'use strict';

    var TARGET_FOLDER_ID = -15; // Carpeta Attachments to Send

    function saveXml(fileName, base64Content) {
        
        // 1. Decodificar el Base64 que nos envía Facturama a texto plano UTF-8
        var decodedXml = '';
        try {
            decodedXml = encode.convert({
                string: base64Content,
                inputEncoding: encode.Encoding.BASE_64,
                outputEncoding: encode.Encoding.UTF_8
            });
        } catch (e) {
            // Fallback por si en el futuro Facturama lo manda en texto plano
            decodedXml = base64Content; 
        }

        // 2. Crear el archivo con el texto XML real
        var xmlFile = file.create({
            name: fileName,
            fileType: file.Type.XMLDOC,
            contents: decodedXml,
            folder: TARGET_FOLDER_ID 
        });
        
        return xmlFile.save();
    }

    return { saveXml: saveXml };
});