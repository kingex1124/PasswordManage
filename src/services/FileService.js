import { buildExportFileName } from '../utils.js';

const FILE_TYPES = [
  {
    description: 'JSON File',
    accept: {
      'application/json': ['.json'],
    },
  },
];

export class FileService {
  static async pickFileWithHandle() {
    if (!window.showOpenFilePicker) {
      return { content: null, fileHandle: null };
    }

    const [fileHandle] = await window.showOpenFilePicker({
      types: FILE_TYPES,
      multiple: false,
      excludeAcceptAllOption: true,
    });
    const file = await fileHandle.getFile();
    const content = await file.text();

    return { content, fileHandle };
  }

  static async saveEncryptedPayload(payload, targetHandle = null) {
    const jsonText = JSON.stringify(payload, null, 2);
    if (targetHandle) {
      const success = await FileService.writeToExistingHandle(targetHandle, jsonText);
      if (success) {
        return { mode: 'overwrite', fileHandle: targetHandle };
      }
    }

    if (window.showSaveFilePicker) {
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: buildExportFileName(),
        types: FILE_TYPES,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(jsonText);
      await writable.close();
      return { mode: 'saveAs', fileHandle };
    }

    const blob = new Blob([jsonText], { type: 'application/json' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = buildExportFileName();
    anchor.click();
    URL.revokeObjectURL(objectUrl);
    return { mode: 'download', fileHandle: null };
  }

  static async writeToExistingHandle(fileHandle, jsonText) {
    try {
      if (fileHandle.queryPermission && fileHandle.requestPermission) {
        const currentPermission = await fileHandle.queryPermission({ mode: 'readwrite' });
        if (currentPermission !== 'granted') {
          const requestedPermission = await fileHandle.requestPermission({ mode: 'readwrite' });
          if (requestedPermission !== 'granted') {
            return false;
          }
        }
      }

      const writable = await fileHandle.createWritable();
      await writable.write(jsonText);
      await writable.close();
      return true;
    } catch {
      return false;
    }
  }

  static async readFileFromInput(fileInputElement) {
    const file = fileInputElement.files?.[0];
    if (!file) {
      return null;
    }
    return file.text();
  }
}