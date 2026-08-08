define(['N/file','N/search','N/record'], function (file,search,record) {
	'use strict';

	function stdFileName (recordType,id) {
		return (recordType[0].toUpperCase() + recordType.substr(1)) + '_' + id;
	}

	function createFolderIfNotExistsInRoot (folderName) {
		var folderId;
		var folders = search
			.create({
				type: search.Type.FOLDER,
				filters: [
					['name', 'is', folderName],
					'and',
					['parent', 'anyof', ['@NONE@']],
				],
			})
			.run()
			.getRange({ start: 0, end: 2 });
		if (folders.length === 0) {
			var folder = record.create({
				type: record.Type.FOLDER,
			});
			folder.setValue('name', folderName);
			folderId = folder.save();
		} else {
			folderId = folders[0].id;
		}
		return folderId;
	}

	function saveXMLFile (folderName, fileProps, existingFileId) {
		var xmlFile;
		if (existingFileId) {
			xmlFile = file.load({
				id: existingFileId,
			});
			xmlFile.contents = fileProps.contents;
			return xmlFile.save();
		}
		var folderId = createFolderIfNotExistsInRoot(folderName);

		xmlFile = file.create({
			name: fileProps.name,
			fileType: file.Type.XMLDOC,
			contents: fileProps.contents,
			description: fileProps.description,
			encoding: file.Encoding.UTF8,
			folder: folderId,
		});
		return xmlFile.save();
	}

	function savePDFFile (folderName, pdfFile,existingFileId) {
		if (existingFileId) {
			file.delete({
				id : existingFileId,
			});
			return savePDFFile(folderName,pdfFile);
		}
		pdfFile.folder = createFolderIfNotExistsInRoot(folderName);
		return pdfFile.save();
	}
	return {
		saveXMLFile: saveXMLFile,
		savePDFFile: savePDFFile,
		stdFileName: stdFileName,
	};
});
