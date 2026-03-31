import { GmailColor, ICloudColor, OutlookColor, YahooColor } from '../components/icons/icons';

export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL;
export const CACHE_BURST_KEY = 'cache-burst:v0.0.5';

export const emailProviders = [
  {
    name: 'Gmail',
    icon: GmailColor,
    providerId: 'google',
  },
  {
    name: 'iCloud Mail',
    icon: ICloudColor,
    providerId: 'icloud',
  },
  {
    name: 'Outlook',
    icon: OutlookColor,
    providerId: 'microsoft',
  },
  {
    name: 'Yahoo Mail',
    icon: YahooColor,
    providerId: 'yahoo',
  },
] as const;
