/**
 * @NApiVersion 2.0
 * @NModuleScope Public
 * * Módulo: Gestor de Archivos y Renderizado (File System Adapter)
 */
define(['N/file', 'N/encode', 'N/render', './sads_fama_logger'], function(file, encode, render, logger) {
    'use strict';

    // ==========================================
    // 1. CONSTANTES (Clean Code: Evitar Magic Numbers)
    // ==========================================
    var CONSTANTS = {
        TARGET_FOLDER_ID: -15, // Carpeta de Attachments por defecto
        DATA_SOURCE_ALIAS: 'custom',
        TEMPLATE_RECORD: 'record',
        TEMPLATE_CUSTOMER: 'customer'
    };

    // ==========================================
    // 2. API PÚBLICA (Puertos de Salida)
    // ==========================================

    /**
     * Decodifica una cadena Base64 a UTF-8 y guarda el resultado como un archivo XML en el File Cabinet.
     * Implementa un Patrón de Seguridad Fail-Safe Defaults (Falla rápido si los datos son inválidos o corruptos).
     * * @param {string} fileName - El nombre que se le asignará al archivo XML en NetSuite.
     * @param {string} base64Content - El contenido del XML codificado en formato Base64.
     * @returns {number} El ID interno (internalid) del archivo guardado en el File Cabinet.
     * @throws {Error} Si el contenido Base64 está vacío o si falla la decodificación nativa del motor de NetSuite.
     */
    function saveXml(fileName, base64Content) {
        var decodedXml = '';
        
        try {
            // Validamos que venga contenido antes de intentar procesar
            if (!base64Content) {
                throw new Error('El contenido Base64 del XML está vacío.');
            }

            try {
                decodedXml = encode.convert({ 
                    string: base64Content, 
                    inputEncoding: encode.Encoding.BASE_64, 
                    outputEncoding: encode.Encoding.UTF_8 
                });
            } catch (decodeError) {
                // FAIL-SAFE: No guardamos basura. Si no se puede decodificar, abortamos.
                throw new Error('Fallo al decodificar el XML Base64 a UTF-8: ' + decodeError.message);
            }

            var xmlFile = file.create({ 
                name: fileName, 
                fileType: file.Type.XMLDOC, 
                contents: decodedXml, 
                folder: CONSTANTS.TARGET_FOLDER_ID 
            });
            
            return xmlFile.save();

        } catch (error) {
            logError('Fallo al guardar archivo XML', error, { fileName: fileName });
            throw error; // Propagamos al orquestador para que aborte la transacción
        }
    }

    /**
     * Renderiza un PDF de la transacción uniendo los datos estándar de NetSuite y los datos fiscales del PAC.
     * * @param {Object} txnRecord - El objeto record de la transacción principal cargada (ej. Invoice).
     * @param {Object|null} customerRecord - El objeto record del cliente cargado (opcional).
     * @param {number|string} pdfTemplateId - El ID interno de la plantilla avanzada de PDF/HTML (FreeMarker/BFO).
     * @param {Object} extraFields - Objeto con la metadata extraída del XML (UUID, cadena original, sellos, etc.).
     * @param {string} fileName - El nombre que se le asignará al archivo PDF generado.
     * @returns {number} El ID interno (internalid) del archivo PDF guardado en el File Cabinet.
     * @throws {Error} Si faltan parámetros obligatorios o si el motor de renderizado falla por plantillas mal formadas.
     */
    function generateCertifiedPdf(txnRecord, customerRecord, pdfTemplateId, extraFields, fileName) {
        try {
            if (!txnRecord || !pdfTemplateId) {
                throw new Error('Faltan parámetros obligatorios (txnRecord o pdfTemplateId) para generar el PDF.');
            }

            var renderer = render.create();
            renderer.setTemplateById({ id: pdfTemplateId });
            
            // Inyección de registros estándar de NetSuite
            renderer.addRecord({ templateName: CONSTANTS.TEMPLATE_RECORD, record: txnRecord });
            
            if (customerRecord) {
                renderer.addRecord({ templateName: CONSTANTS.TEMPLATE_CUSTOMER, record: customerRecord });
            }

            // Inyección de Datos Custom (Datos del PAC / CFDI)
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
            pdfFile.folder = CONSTANTS.TARGET_FOLDER_ID;
            
            logger.write('Funcion generateCertifiedPdf ejecutada, Retorno de Archivo PDF:', pdfFile.name);
            return pdfFile.save();

        } catch (error) {
            // Compromise Recording: Guardamos el contexto exacto de qué plantilla y registro falló
            logError('Fallo al generar PDF Certificado', error, { 
                fileName: fileName, 
                templateId: pdfTemplateId,
                transactionId: txnRecord ? txnRecord.id : 'N/A'
            });
            throw error; // Propagamos al orquestador
        }
    }

    // ==========================================
    // 3. FUNCIONES PRIVADAS (Soporte)
    // ==========================================

    /**
     * Estandariza la captura de errores delegando al Logger Central (Compromise Recording).
     * * @private
     * @param {string} customMessage - Mensaje contextual indicando en qué paso falló el sistema.
     * @param {Error|Object} e - El objeto de error interceptado.
     * @param {Object} [contextData] - Datos adicionales de contexto para facilitar el rastro de la auditoría.
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
        saveXml: saveXml, 
        generateCertifiedPdf: generateCertifiedPdf 
    };
});
/**
 * refactor(file-adapter): aplicar fail-safe defaults, blindar renderizado de PDF y agregar JSDoc
 * Descripción (Body):
 * Se refactorizó el adaptador de infraestructura sads_fama_files.js para interactuar de forma segura con el File Cabinet y el motor de renderizado:
 * * 🛡️ Fail-Safe Defaults: Se eliminó un comportamiento peligroso en saveXml que permitía guardar cadenas Base64 crudas con extensión .xml en caso de fallar la decodificación UTF-8. Ahora aborta la operación y propaga el error (Fail Fast).
 * * 🩺 Compromise Recording: Se integró el módulo central de logging (sads_fama_logger.js). Se añadieron bloques try/catch a la generación del PDF para atrapar excepciones del motor FreeMarker, registrando el ID de la plantilla y de la transacción para facilitar auditorías.
 * * 🧹 Clean Code: Se encapsularon los "Magic Numbers/Strings" (IDs de carpetas y alias de plantillas) en un diccionario CONSTANTS para documentar la intención de las variables.
 * * 📚 Documentación (JSDoc): Se incorporaron firmas de funciones estandarizadas en JSDoc para facilitar la lectura del código por otros desarrolladores e inicializar el soporte de IntelliSense en los IDEs, documentando parámetros esperados y tipos de retorno para las operaciones del sistema de archivos.
 */