const fs = require('fs');
const path = require('path');

// 1. Validar que se haya pasado una ruta como argumento
const inputFolder = process.argv[2];
if (!inputFolder) {
  console.error('Error: Por favor, proporciona la ruta de la carpeta.');
  console.error('Uso correcto: node extractor.js "C:/Ruta/A/Tu/Carpeta"');
  process.exit(1);
}

// 2. Resolver la ruta absoluta
const absoluteInputPath = path.resolve(inputFolder);

if (!fs.existsSync(absoluteInputPath)) {
  console.error(`Error: La ruta proporcionada no existe: ${absoluteInputPath}`);
  process.exit(1);
}

// 3. Determinar la ruta de salida (a la par de la carpeta principal)
const parentDir = path.dirname(absoluteInputPath);
const outputFileName = 'Diccionario_com_netsuite_mexicocompilance.txt';
const outputPath = path.join(parentDir, outputFileName);

// 4. Función recursiva para buscar archivos .js
function getJsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getJsFiles(filePath, fileList);
    } else if (path.extname(file).toLowerCase() === '.js') {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// 5. Procesar los archivos y generar el .txt
try {
  const jsFiles = getJsFiles(absoluteInputPath);
  
  if (jsFiles.length === 0) {
    console.log('No se encontraron archivos JavaScript (.js) en la ruta proporcionada.');
    process.exit(0);
  }

  // Si el archivo ya existe de una ejecución anterior, lo eliminamos para no duplicar texto
  if (fs.existsSync(outputPath)) {
    fs.unlinkSync(outputPath);
  }

  // Abrimos un stream para escribir el archivo poco a poco (ideal para muchos archivos)
  const stream = fs.createWriteStream(outputPath, { flags: 'a', encoding: 'utf8' });

  for (const filePath of jsFiles) {
    const fileName = path.basename(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Escribimos el separador y el nombre del archivo
    stream.write(`===================\nFile: ${fileName}\n===================\n`);
    // Escribimos el contenido intacto del archivo
    stream.write(content);
    // Agregamos un salto de línea al final por sanidad visual entre archivos
    stream.write('\n\n'); 
  }

  stream.end();
  console.log(`¡Proceso completado con éxito!`);
  console.log(`Se procesaron ${jsFiles.length} archivos.`);
  console.log(`Archivo guardado en: ${outputPath}`);
} catch (error) {
  console.error('Ocurrió un error durante la ejecución:', error.message);
}