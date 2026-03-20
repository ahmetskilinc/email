import { type Account, betterAuth, type BetterAuthOptions } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { jwt, bearer, mcp } from 'better-auth/plugins';
import { getSocialProviders } from './auth-providers';
import { defaultUserSettings } from './schemas';
import { getzeitmailDB } from './server-utils';
import { type EProviders } from '../types';
import { createDriver } from './driver';
import { redis } from './services';
import { createDb } from '../db';
import { env } from '../env';

const connectionHandlerHook = async (account: Account) => {
  console.log('[connectionHandlerHook] start', {
    providerId: account.providerId,
    userId: account.userId,
  });

  try {
    if (!account.accessToken) {
      console.error('[connectionHandlerHook] Missing Access Token', { accountId: account.id });
      return;
    }

    let refreshToken = account.refreshToken;
    if (!refreshToken) {
      const db = await getzeitmailDB(account.userId);
      const connections = await db.findManyConnections();
      const existing = connections.find((c) => c.providerId === account.providerId);
      refreshToken = existing?.refreshToken ?? null;
      console.log('[connectionHandlerHook] refreshToken fallback from DB:', !!refreshToken);
    }

    if (!refreshToken) {
      console.error('[connectionHandlerHook] No refresh token available', {
        accountId: account.id,
      });
      return;
    }

    const driver = createDriver(account.providerId, {
      auth: {
        accessToken: account.accessToken,
        refreshToken,
        userId: account.userId,
        email: '',
      },
    });

    console.log('[connectionHandlerHook] fetching userInfo');
    const userInfo = await driver.getUserInfo().catch((err) => {
      console.error('[connectionHandlerHook] getUserInfo failed:', err);
      return null;
    });

    if (!userInfo?.address) {
      console.error('[connectionHandlerHook] No userInfo address returned');
      return;
    }

    console.log('[connectionHandlerHook] creating connection for', userInfo.address);
    const db = await getzeitmailDB(account.userId);
    const [result] = await db.createConnection(account.providerId as EProviders, userInfo.address, {
      name: userInfo.name || 'Unknown',
      picture: userInfo.photo || '',
      accessToken: account.accessToken,
      refreshToken,
      scope: driver.getScope(),
      expiresAt: new Date(Date.now() + 3600 * 1000),
    });

    console.log('[connectionHandlerHook] connection created, id:', result?.id);

    // Auto-set as default connection if user has none
    const userData = await db.findUser();
    if (result?.id && !userData?.defaultConnectionId) {
      await db.updateUser({ defaultConnectionId: result.id });
      console.log('[connectionHandlerHook] defaultConnectionId set to', result.id);
    }

    console.log('[connectionHandlerHook] done');
  } catch (error) {
    console.error('[connectionHandlerHook] unexpected error:', error);
  }
};

export const createAuth = () => {
  return betterAuth({
    plugins: [
      mcp({
        loginPage: env.VITE_PUBLIC_APP_URL + '/login',
      }),
      jwt(),
      bearer(),
    ],
    ...createAuthConfig(),
  });
};

const createAuthConfig = () => {
  const cache = redis();
  const { db } = createDb(env.DATABASE_URL);
  return {
    database: drizzleAdapter(db, { provider: 'pg' }),
    secondaryStorage: {
      get: async (key: string) => {
        const value = await cache.get(key);
        return typeof value === 'string' ? value : value ? JSON.stringify(value) : null;
      },
      set: async (key: string, value: string, ttl?: number) => {
        if (ttl) await cache.set(key, value, { ex: ttl });
        else await cache.set(key, value);
      },
      delete: async (key: string) => {
        await cache.del(key);
      },
    },
    advanced: {
      ipAddress: {
        disableIpTracking: true,
      },
      cookiePrefix: env.NODE_ENV === 'development' ? 'better-auth-dev' : 'better-auth',
      crossSubDomainCookies: {
        enabled: true,
        domain: env.COOKIE_DOMAIN,
      },
    },
    baseURL: env.VITE_PUBLIC_BACKEND_URL,
    trustedOrigins: [
      ...(env.BETTER_AUTH_TRUSTED_ORIGINS
        ? env.BETTER_AUTH_TRUSTED_ORIGINS.split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : []),
    ],
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
      },
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24 * 3, // 1 day (every 1 day the session expiration is updated)
    },
    socialProviders: getSocialProviders(env as unknown as Record<string, string>),
    account: {
      accountLinking: {
        enabled: true,
        allowDifferentEmails: true,
        trustedProviders: ['google', 'microsoft'],
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    onAPIError: {
      onError: (error) => {
        console.error('API Error', error);
      },
      errorURL: `${env.VITE_PUBLIC_APP_URL}/login`,
      throw: true,
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            try {
              const db = await getzeitmailDB(user.id);
              const existingSettings = await db.findUserSettings();
              if (!existingSettings) {
                await db.insertUserSettings({ ...defaultUserSettings });
              }
            } catch (error) {
              console.error('[user.create hook] Failed to insert default settings:', error);
            }
          },
        },
      },
      account: {
        create: {
          after: connectionHandlerHook,
        },
        update: {
          after: connectionHandlerHook,
        },
      },
    },
  } satisfies BetterAuthOptions;
};

export const createSimpleAuth = () => {
  return betterAuth(createAuthConfig());
};

export type Auth = ReturnType<typeof createAuth>;
export type SimpleAuth = ReturnType<typeof createSimpleAuth>;
