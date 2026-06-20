import * as Sharing from 'expo-sharing';

/**
 * Share a saved CSV file via the device share sheet.
 *
 * For the MVP, "Email CSV" also routes through the share sheet so the user can
 * pick their mail app and attach the CSV manually.
 *
 * TODO (future): direct email delivery without the share sheet — send the CSV
 * from a Supabase Edge Function using Resend / SendGrid (server-side key).
 */

export interface ShareCsvOptions {
  /** Dialog title (Android). */
  dialogTitle?: string;
  /** Optional default subject hint for email targets. */
  subject?: string;
}

export async function shareCsvFile(uri: string, options: ShareCsvOptions = {}): Promise<void> {
  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error(
      'Sharing is not available on this device. The CSV was saved locally — you can retrieve it from the app documents folder.',
    );
  }

  try {
    await Sharing.shareAsync(uri, {
      mimeType: 'text/csv',
      dialogTitle: options.dialogTitle ?? 'Export CardSnap CSV',
      UTI: 'public.comma-separated-values-text',
    });
  } catch (err) {
    throw new Error(
      `Failed to share CSV: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
