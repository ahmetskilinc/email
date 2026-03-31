import { authProviders, isProviderEnabled } from '../lib/auth-providers';
import { env } from '../env';
import { Hono } from 'hono';

export const publicRouter = new Hono();

publicRouter.get('/providers', (c) => {
  const e = env as unknown as Record<string, string>;

  const authProviderStatus = authProviders(e).map((provider) => ({
    id: provider.id,
    name: provider.name,
    enabled: isProviderEnabled(provider, e),
    required: provider.required,
    envVarInfo: provider.envVarInfo,
    envVarStatus:
      provider.envVarInfo?.map((v) => ({
        name: v.name,
        set: !!e[v.name],
        source: v.source,
        defaultValue: v.defaultValue,
      })) ?? [],
  }));

  return c.json({
    allProviders: authProviderStatus,
    isProd: env.NODE_ENV === 'production',
  });
});
