import { resolve } from 'node:path';
import { config } from 'dotenv';

config({ path: resolve(process.cwd(), '../../.env'), override: false });

export type zeitmailEnv = {
  NODE_ENV: 'local' | 'development' | 'production';
  DATABASE_URL: string;
  PORT: string;
  COOKIE_DOMAIN: string;
  VITE_PUBLIC_APP_URL: string;
  VITE_PUBLIC_BACKEND_URL: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  BETTER_AUTH_TRUSTED_ORIGINS: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  MICROSOFT_CLIENT_ID: string;
  MICROSOFT_CLIENT_SECRET: string;
  IMAP_SERVICE_URL: string;
  ENCRYPTION_KEY: string;
};

const requireEnv = (key: keyof zeitmailEnv, fallback = ''): string => process.env[key] ?? fallback;

export const env: zeitmailEnv = {
  NODE_ENV: (process.env.NODE_ENV as zeitmailEnv['NODE_ENV']) || 'development',
  DATABASE_URL: requireEnv('DATABASE_URL'),
  PORT: requireEnv('PORT', '8787'),
  COOKIE_DOMAIN: requireEnv('COOKIE_DOMAIN', 'localhost'),
  VITE_PUBLIC_APP_URL: requireEnv('VITE_PUBLIC_APP_URL', 'http://localhost:3000'),
  VITE_PUBLIC_BACKEND_URL: requireEnv('VITE_PUBLIC_BACKEND_URL', 'http://localhost:8787'),
  BETTER_AUTH_SECRET: requireEnv('BETTER_AUTH_SECRET'),
  BETTER_AUTH_URL: requireEnv('BETTER_AUTH_URL'),
  BETTER_AUTH_TRUSTED_ORIGINS: requireEnv('BETTER_AUTH_TRUSTED_ORIGINS'),
  GOOGLE_CLIENT_ID: requireEnv('GOOGLE_CLIENT_ID'),
  GOOGLE_CLIENT_SECRET: requireEnv('GOOGLE_CLIENT_SECRET'),
  MICROSOFT_CLIENT_ID: requireEnv('MICROSOFT_CLIENT_ID'),
  MICROSOFT_CLIENT_SECRET: requireEnv('MICROSOFT_CLIENT_SECRET'),
  IMAP_SERVICE_URL: requireEnv('IMAP_SERVICE_URL', 'http://localhost:8789'),
  ENCRYPTION_KEY: requireEnv('ENCRYPTION_KEY'),
};
