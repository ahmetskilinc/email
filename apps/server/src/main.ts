import { connection, user } from './db/schema';
import { publicRouter } from './routes/auth';
import { createSimpleAuth } from './lib/auth';
import { trpcServer } from '@hono/trpc-server';
import { appRouter } from './trpc/router';
import { createDriver } from './lib/driver';
import { serve } from '@hono/node-server';
import { eq, and } from 'drizzle-orm';
import { EProviders } from './types';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { createDb } from './db';
import { env } from './env';
import { Hono } from 'hono';

const auth = createSimpleAuth();

const app = new Hono();

app.use('*', contextStorage());

app.use(
  '*',
  cors({
    origin: [env.VITE_PUBLIC_APP_URL, 'http://localhost:3000'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  }),
);

const requireUserId = (c: any) => {
  const userId = c.req.header('X-User-Id') || c.req.query('userId');
  if (!userId) throw new Error('Missing X-User-Id header');
  return userId;
};

app.get('/health', (c) => c.json({ ok: true }));

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.route('/api/public', publicRouter);

app.use(
  '/api/trpc/*',
  trpcServer({
    endpoint: '/api/trpc',
    router: appRouter,
    allowMethodOverride: true,
    createContext: async (_opts, c) => {
      const session = await auth.api.getSession({ headers: c.req.raw.headers });
      // Make session available via Hono context storage (used by trpc-logging)
      c.set('auth' as any, auth);
      c.set('sessionUser' as any, session?.user);
      return {
        c,
        auth: auth as any,
        sessionUser: session?.user,
      };
    },
  }),
);

app.get('/v1/connections', async (c) => {
  const userId = requireUserId(c);
  const { db, conn } = createDb(env.DATABASE_URL);
  try {
    const items = await db.query.connection.findMany({
      where: eq(connection.userId, userId),
      orderBy: (fields, { desc }) => desc(fields.createdAt),
    });
    return c.json({ data: items });
  } finally {
    await conn.end();
  }
});

app.post('/v1/connections', async (c) => {
  const body = await c.req.json<{
    providerId: EProviders;
    email: string;
    accessToken: string;
    refreshToken?: string;
    name?: string;
    picture?: string;
  }>();
  const userId = requireUserId(c);
  const { db, conn } = createDb(env.DATABASE_URL);
  try {
    const existingUser = await db.query.user.findFirst({ where: eq(user.id, userId) });
    if (!existingUser) {
      await db.insert(user).values({
        id: userId,
        name: body.name || body.email.split('@')[0],
        email: `${userId}@local.zero`,
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    const driver = createDriver(body.providerId, {
      auth: {
        userId,
        email: body.email,
        accessToken: body.accessToken,
        refreshToken: body.refreshToken || '',
      },
    });
    const info = await driver.getUserInfo();
    const now = new Date();
    const id = crypto.randomUUID();
    await db
      .insert(connection)
      .values({
        id,
        userId,
        providerId: body.providerId,
        email: info.address,
        name: info.name,
        picture: info.photo,
        accessToken: body.accessToken,
        refreshToken: body.refreshToken || null,
        scope: driver.getScope(),
        expiresAt: new Date('2099-12-31'),
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [connection.userId, connection.email],
        set: {
          providerId: body.providerId,
          accessToken: body.accessToken,
          refreshToken: body.refreshToken || null,
          scope: driver.getScope(),
          updatedAt: now,
          expiresAt: new Date('2099-12-31'),
        },
      });
    return c.json({ success: true });
  } finally {
    await conn.end();
  }
});

app.get('/v1/connections/:connectionId/threads', async (c) => {
  const userId = requireUserId(c);
  const connectionId = c.req.param('connectionId');
  const folder = c.req.query('folder') || 'inbox';
  const maxResults = Number(c.req.query('maxResults') || 50);
  const pageToken = c.req.query('pageToken') || undefined;
  const { db, conn } = createDb(env.DATABASE_URL);
  try {
    const row = await db.query.connection.findFirst({
      where: and(eq(connection.id, connectionId), eq(connection.userId, userId)),
    });
    if (!row) return c.json({ error: 'Connection not found' }, 404);
    const driver = createDriver(row.providerId, {
      auth: {
        userId,
        email: row.email,
        accessToken: row.accessToken || '',
        refreshToken: row.refreshToken || '',
      },
    });
    const result = await driver.list({ folder, maxResults, pageToken });
    return c.json(result);
  } finally {
    await conn.end();
  }
});

app.get('/v1/connections/:connectionId/threads/:threadId', async (c) => {
  const userId = requireUserId(c);
  const connectionId = c.req.param('connectionId');
  const threadId = c.req.param('threadId');
  const { db, conn } = createDb(env.DATABASE_URL);
  try {
    const row = await db.query.connection.findFirst({
      where: and(eq(connection.id, connectionId), eq(connection.userId, userId)),
    });
    if (!row) return c.json({ error: 'Connection not found' }, 404);
    const driver = createDriver(row.providerId, {
      auth: {
        userId,
        email: row.email,
        accessToken: row.accessToken || '',
        refreshToken: row.refreshToken || '',
      },
    });
    const result = await driver.get(threadId);
    return c.json(result);
  } finally {
    await conn.end();
  }
});

app.post('/v1/connections/:connectionId/send', async (c) => {
  const userId = requireUserId(c);
  const connectionId = c.req.param('connectionId');
  const payload = await c.req.json();
  const { db, conn } = createDb(env.DATABASE_URL);
  try {
    const row = await db.query.connection.findFirst({
      where: and(eq(connection.id, connectionId), eq(connection.userId, userId)),
    });
    if (!row) return c.json({ error: 'Connection not found' }, 404);
    const driver = createDriver(row.providerId, {
      auth: {
        userId,
        email: row.email,
        accessToken: row.accessToken || '',
        refreshToken: row.refreshToken || '',
      },
    });
    const result = await driver.create(payload);
    return c.json(result);
  } finally {
    await conn.end();
  }
});

app.post('/v1/connections/:connectionId/threads/:threadId/labels', async (c) => {
  const userId = requireUserId(c);
  const connectionId = c.req.param('connectionId');
  const threadId = c.req.param('threadId');
  const body = await c.req.json<{ addLabels: string[]; removeLabels: string[] }>();
  const { db, conn } = createDb(env.DATABASE_URL);
  try {
    const row = await db.query.connection.findFirst({
      where: and(eq(connection.id, connectionId), eq(connection.userId, userId)),
    });
    if (!row) return c.json({ error: 'Connection not found' }, 404);
    const driver = createDriver(row.providerId, {
      auth: {
        userId,
        email: row.email,
        accessToken: row.accessToken || '',
        refreshToken: row.refreshToken || '',
      },
    });
    await driver.modifyLabels([threadId], body);
    return c.json({ success: true });
  } finally {
    await conn.end();
  }
});

app.post('/v1/connections/:connectionId/sync', async (c) => {
  const userId = requireUserId(c);
  const connectionId = c.req.param('connectionId');
  const body = await c.req.json<{ folder?: string; maxResults?: number }>();
  const { db, conn } = createDb(env.DATABASE_URL);
  try {
    const row = await db.query.connection.findFirst({
      where: and(eq(connection.id, connectionId), eq(connection.userId, userId)),
    });
    if (!row) return c.json({ error: 'Connection not found' }, 404);
    const driver = createDriver(row.providerId, {
      auth: {
        userId,
        email: row.email,
        accessToken: row.accessToken || '',
        refreshToken: row.refreshToken || '',
      },
    });
    const folder = body.folder || 'inbox';
    const result = await driver.list({ folder, maxResults: body.maxResults || 100 });
    const preview = await Promise.all(result.threads.slice(0, 25).map((t) => driver.get(t.id)));
    return c.json({
      success: true,
      folder,
      listed: result.threads.length,
      synced: preview.length,
    });
  } finally {
    await conn.end();
  }
});

app.get('/', (c) => c.redirect(env.VITE_PUBLIC_APP_URL));

serve(
  {
    fetch: app.fetch,
    port: Number(env.PORT || 8787),
  },
  () => {
    console.log(`server listening on ${env.PORT || 8787}`);
  },
);
