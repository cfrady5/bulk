import * as FileSystem from 'expo-file-system';

/**
 * Persist a CSV string to a file using expo-file-system.
 * Returns the file URI which can be passed to expo-sharing.
 */

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9-_ ]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 60);
}

export interface SaveCsvResult {
  uri: string;
  fileName: string;
}

export async function saveCsvFile(csv: string, baseName: string): Promise<SaveCsvResult> {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const fileName = `${sanitizeFileName(baseName) || 'cardsnap_export'}_${timestamp}.csv`;

  // documentDirectory persists across app launches (vs cacheDirectory).
  const dir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!dir) {
    throw new Error('No writable directory available on this device.');
  }
  const uri = `${dir}${fileName}`;

  try {
    await FileSystem.writeAsStringAsync(uri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
  } catch (err) {
    throw new Error(
      `Failed to save CSV file: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return { uri, fileName };
}
