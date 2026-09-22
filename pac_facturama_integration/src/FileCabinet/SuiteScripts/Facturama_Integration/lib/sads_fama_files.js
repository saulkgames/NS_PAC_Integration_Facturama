/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 *
 * Módulo: Gestor de archivos del File Cabinet y renderizado de PDF certificado.
 */
define(['N/file', 'N/encode', 'N/render', './sads_fama_logger'], function (file, encode, render, logger) {
    'use strict';

    var CONSTANTS = {
        TARGET_FOLDER_ID: 412704, // Carpeta de Attachments por defecto
        DATA_SOURCE_ALIAS: 'custom',
        TEMPLATE_RECORD: 'record',
        TEMPLATE_CUSTOMER: 'customer',

    };

    /**
     * Decodifica el contenido y lo guarda como archivo XML, PDF o JSON en el File Cabinet.
     * El tipo se determina por la extensión del nombre de archivo.
     * @param {string} fileName - Nombre del archivo en NetSuite (define el tipo por su extensión).
     * @param {string|Object} baseContent - Contenido del archivo (Base64 para XML, objeto para JSON).
     * @param {number|string} [targetFolderId] - Carpeta destino; usa CONSTANTS.TARGET_FOLDER_ID si se omite.
     * @returns {number} ID interno del archivo guardado.
     * @throws {Error} Si faltan parámetros, el tipo no está soportado o falla la decodificación.
     */
    function saveFile(fileName, baseContent, targetFolderId) {
        var nsFileType;
        var fileContent = '';
        var finalFolderId = targetFolderId || CONSTANTS.TARGET_FOLDER_ID;
        var isPDF = fileName.toLowerCase().indexOf('.pdf') !== -1;
        var isXML = fileName.toLowerCase().indexOf('.xml') !== -1;
        var isJSON = fileName.toLowerCase().indexOf('.json') !== -1;

        if (!fileName) {
            throw new Error('El nombre del archivo (fileName) es obligatorio para guardar el archivo.');
        }
        if (!baseContent) {
            throw new Error('El contenido de baseContent está vacío.');
        }

        try {
            if (isPDF) {
                fileContent = baseContent;
                nsFileType = file.Type.PDF;
            } else if (isXML) {

                try {
                    fileContent = encode.convert({
                        string: baseContent,
                        inputEncoding: encode.Encoding.BASE_64,
                        outputEncoding: encode.Encoding.UTF_8
                    });
                    nsFileType = file.Type.XMLDOC;
                } catch (decodeError) {
                    throw new Error('Fallo al decodificar el baseContent a UTF-8: ' + decodeError.message);
                }

            } else if (isJSON) {
                try {
                    fileContent = JSON.stringify(baseContent);
                    nsFileType = file.Type.JSON;
                } catch (decodeError) {
                    throw new Error('Fallo al parsear el baseContent a String: ' + decodeError.message);
                }
            } else {
                throw new Error('Tipo de archivo no soportado. Solo se permiten archivos PDF, XML o JSON.');
            }

            var newFile = file.create({
                name: fileName,
                fileType: nsFileType,
                contents: fileContent,
                folder: finalFolderId
            });

            return newFile.save();
        } catch (error) {
            logError('Fallo al guardar docuemnto', error, { fileName: fileName });
            throw error; // Se propaga al orquestador para que aborte la transacción
        }
    }

    /**
     * Renderiza un PDF de la transacción combinando los datos estándar de NetSuite y los datos
     * fiscales del PAC.
     * @param {Object} txnRecord - Record de la transacción principal cargada (ej. Invoice).
     * @param {Object|null} customerRecord - Record del cliente cargado (opcional).
     * @param {number|string} pdfTemplateId - ID interno de la plantilla avanzada de PDF/HTML.
     * @param {Object} extraFields - Metadata extraída del XML (UUID, cadena original, sellos, etc.).
     * @param {string} fileName - Nombre del archivo PDF generado.
     * @param {number|string} [targetFolderId] - Carpeta destino; usa CONSTANTS.TARGET_FOLDER_ID si se omite.
     * @returns {number} ID interno del archivo PDF guardado.
     * @throws {Error} Si faltan parámetros obligatorios o falla el motor de renderizado.
     */
    function generateCertifiedPdf(txnRecord, customerRecord, pdfTemplateId, extraFields, fileName, targetFolderId) {
        try {
            if (!txnRecord || !pdfTemplateId) {
                throw new Error('Faltan parámetros obligatorios (txnRecord o pdfTemplateId) para generar el PDF.');
            }

            var renderer = render.create();
            renderer.setTemplateById({ id: pdfTemplateId });

            renderer.addRecord({ templateName: CONSTANTS.TEMPLATE_RECORD, record: txnRecord });

            if (customerRecord) {
                renderer.addRecord({ templateName: CONSTANTS.TEMPLATE_CUSTOMER, record: customerRecord });
            }

            var customData = {
                certData: extraFields || {}
            };

            renderer.addCustomDataSource({
                format: render.DataSource.OBJECT,
                alias: CONSTANTS.DATA_SOURCE_ALIAS,
                data: customData
            });

            var pdfFile = renderer.renderAsPdf();
            pdfFile.name = fileName;
            pdfFile.folder = targetFolderId || CONSTANTS.TARGET_FOLDER_ID;

            logger.write('Funcion generateCertifiedPdf ejecutada, Retorno de Archivo PDF:', pdfFile.name);
            return pdfFile.save();

        } catch (error) {
            logError('Fallo al generar PDF Certificado', error, {
                fileName: fileName,
                templateId: pdfTemplateId,
                transactionId: txnRecord ? txnRecord.id : 'N/A'
            });
            throw error; // Se propaga al orquestador
        }
    }

    /**
     * Estandariza la captura de errores delegando al logger central.
     * @private
     * @param {string} customMessage - Contexto de dónde ocurrió el fallo.
     * @param {Error|Object} e - Objeto de error interceptado.
     * @param {Object} [contextData] - Datos adicionales de contexto para la auditoría.
     * @returns {void}
     */
    function logError(customMessage, e, contextData) {
        var errorDetails = {
            name: e.name || 'FILE_SYSTEM_ERROR',
            message: e.message || e.toString(),
            stack: e.stack || (typeof e.getStackTrace === 'function' ? e.getStackTrace().join('\n') : 'No stack trace'),
            context: contextData || {}
        };
        logger.write('ERROR FILES: ' + customMessage, errorDetails);
    }

    return {
        saveFile: saveFile,
        generateCertifiedPdf: generateCertifiedPdf
    };
});
