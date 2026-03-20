import { createRateLimiterMiddleware, privateProcedure, publicProcedure, router } from '../trpc';
import { getActiveConnection, getzeitmailDB } from '../../lib/server-utils';
import { createDriver } from '../../lib/driver';
import { encrypt } from '../../lib/encryption';
import { Ratelimit } from '@upstash/ratelimit';
import { TRPCError } from '@trpc/server';
import { EProviders } from '../../types';
import { z } from 'zod';

export const connectionsRouter = router({
  list: privateProcedure
    .use(
      createRateLimiterMiddleware({
        limiter: Ratelimit.slidingWindow(120, '1m'),
        generatePrefix: ({ sessionUser }) => `ratelimit:get-connections-${sessionUser?.id}`,
      }),
    )
    .query(async ({ ctx }) => {
      const { sessionUser } = ctx;
      const db = await getzeitmailDB(sessionUser.id);
      const connections = await db.findManyConnections();

      const appPasswordProviders = ['icloud', 'yahoo'];
      const disconnectedIds = connections
        .filter(
          (c) =>
            !c.accessToken || (!appPasswordProviders.includes(c.providerId) && !c.refreshToken),
        )
        .map((c) => c.id);

      return {
        connections: connections.map((connection) => {
          return {
            id: connection.id,
            email: connection.email,
            name: connection.name,
            picture: connection.picture,
            createdAt: connection.createdAt,
            providerId: connection.providerId,
          };
        }),
        disconnectedIds,
      };
    }),
  setDefault: privateProcedure
    .input(z.object({ connectionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { connectionId } = input;
      const user = ctx.sessionUser;
      const db = await getzeitmailDB(user.id);
      const foundConnection = await db.findUserConnection(connectionId);
      if (!foundConnection) throw new TRPCError({ code: 'NOT_FOUND' });
      await db.updateUser({ defaultConnectionId: connectionId });
    }),
  delete: privateProcedure
    .input(z.object({ connectionId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { connectionId } = input;
      const user = ctx.sessionUser;
      const db = await getzeitmailDB(user.id);
      await db.deleteConnection(connectionId);

      const activeConnection = await getActiveConnection(user.id);
      if (connectionId === activeConnection?.id) await db.updateUser({ defaultConnectionId: null });
    }),
  createIcloud: privateProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;
      const { sessionUser } = ctx;

      const validDomains = ['icloud.com', 'me.com', 'mac.com'];
      const domain = email.split('@')[1];
      if (!domain || !validDomains.includes(domain)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only iCloud email addresses are supported (icloud.com, me.com, mac.com)',
        });
      }

      const driver = createDriver(EProviders.icloud, {
        auth: {
          userId: sessionUser.id,
          accessToken: password,
          refreshToken: '',
          email,
        },
      });

      const userInfo = await driver.getUserInfo().catch(() => {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid iCloud credentials. Please check your email and app-specific password.',
        });
      });

      const db = await getzeitmailDB(sessionUser.id);
      const connectionInfo = {
        name: userInfo.name || email.split('@')[0],
        picture: '',
        accessToken: encrypt(password),
        refreshToken: null as string | null,
        scope: 'icloud',
        expiresAt: new Date('2099-12-31'),
      };
      await db.createConnection(EProviders.icloud, userInfo.address, connectionInfo);

      return { success: true };
    }),
  createYahoo: privateProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;
      const { sessionUser } = ctx;

      const validDomains = [
        'yahoo.com',
        'ymail.com',
        'rocketmail.com',
        'yahoo.co.uk',
        'yahoo.co.in',
        'yahoo.ca',
        'yahoo.com.au',
      ];
      const domain = email.split('@')[1];
      if (
        !domain ||
        !validDomains.some(
          (d) => domain.toLowerCase() === d || domain.toLowerCase().startsWith('yahoo.'),
        )
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message:
            'Only Yahoo email addresses are supported (yahoo.com, ymail.com, rocketmail.com, etc.)',
        });
      }

      const driver = createDriver(EProviders.yahoo, {
        auth: {
          userId: sessionUser.id,
          accessToken: password,
          refreshToken: '',
          email,
        },
      });

      const userInfo = await driver.getUserInfo().catch(() => {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid Yahoo credentials. Please check your email and app password.',
        });
      });

      const db = await getzeitmailDB(sessionUser.id);
      const connectionInfo = {
        name: userInfo.name || email.split('@')[0],
        picture: '',
        accessToken: encrypt(password),
        refreshToken: null as string | null,
        scope: 'yahoo',
        expiresAt: new Date('2099-12-31'),
      };
      await db.createConnection(EProviders.yahoo, userInfo.address, connectionInfo);

      return { success: true };
    }),
  getDefault: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.sessionUser) return null;
    const connection = await getActiveConnection(ctx.sessionUser.id).catch(() => null);
    if (!connection) return null;
    return {
      id: connection.id,
      email: connection.email,
      name: connection.name,
      picture: connection.picture,
      createdAt: connection.createdAt,
      providerId: connection.providerId,
    };
  }),
});
