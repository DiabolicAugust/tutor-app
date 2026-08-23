import * as DocumentPicker from 'expo-document-picker';

import type { FileToUpload } from './student-file';

/**
 * Types a tutor plausibly keeps against a student.
 *
 * The same list the server enforces. Offering it to the picker means somebody
 * cannot select a file that will be refused a moment later — the check still
 * happens on the server, because a client-side filter is a convenience and never
 * a rule.
 */
const ACCEPTED = [
  'image/*',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

/**
 * Asks for one file. Resolves to `null` if the picker was dismissed.
 *
 * `copyToCacheDirectory` because the URI a picker hands back can point into a
 * provider the app loses access to the moment the picker closes, and an upload
 * that starts a second later would then fail on a file that was right there.
 */
export async function pickFile(): Promise<FileToUpload | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ACCEPTED,
    multiple: false,
    copyToCacheDirectory: true,
  });

  if (result.canceled) return null;

  const asset = result.assets[0];
  if (!asset) return null;

  return {
    uri: asset.uri,
    name: asset.name,
    // A picker can return no type for an unrecognised extension; the server has
    // an allow-list, so an empty string is refused there rather than guessed at
    // here.
    mimeType: asset.mimeType ?? 'application/octet-stream',
  };
}
