export const emailProviders = [
  { name: 'Gmail', providerId: 'google' },
  { name: 'iCloud Mail', providerId: 'icloud' },
  { name: 'Outlook', providerId: 'microsoft' },
  { name: 'Yahoo Mail', providerId: 'yahoo' },
] as const;

export const allowedFolders = new Set([
  'inbox',
  'draft',
  'sent',
  'spam',
  'bin',
  'archive',
  'snoozed',
]);
