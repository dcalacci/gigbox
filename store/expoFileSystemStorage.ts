import * as FileSystem from 'expo-file-system';
import type { Storage } from 'redux-persist';

// interface Storage {
//   getItem(key: string): Promise<string>;
//   setItem(key: string, value: string): Promise<string | void>;
//   removeItem(key: string): Promise<void>;
// }

function generateFolderPath() {
    return FileSystem.documentDirectory + 'appData/';
}

function generateFilePath(key: string) {
    const fileName = key.replace(/[^a-z0-9.\-_]/gi, '-');
    return generateFolderPath() + fileName;
}

function writeFile(path: string, value: string) {
    FileSystem.writeAsStringAsync(path, value);
}

export class ExpoFileSystemStorage implements Storage {
    getItem(key: string) {
        return FileSystem.readAsStringAsync(generateFilePath(key));
    }

    setItem(key: string, value: string): Promise<string | void> {
        const folderPath = generateFolderPath();
        return FileSystem.getInfoAsync(folderPath).then((info) => {
            const filePath = generateFilePath(key);
            if (info.exists) {
                writeFile(filePath, value);
            } else {
                FileSystem.makeDirectoryAsync(folderPath, {
                    intermediates: true,
                }).then(() => writeFile(filePath, value));
            }
        });
    }

    removeItem(key: string) {
        return FileSystem.deleteAsync(generateFilePath(key), { idempotent: true });
    }
}
