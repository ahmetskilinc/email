import { resolveAccessToken } from '../../lib/server-utils';
import type { MailManager } from '../../lib/driver/types';
import { activeDriverProcedure, router } from '../trpc';
import { createDriver } from '../../lib/driver';
import { createDraftData } from '../../lib/schemas';
import { z } from 'zod';

export const draftsRouter = router({
  create: activeDriverProcedure.input(createDraftData).mutation(async ({ input, ctx }) => {
    const { activeConnection } = ctx;
    const driver = createDriver(activeConnection.providerId, {
      auth: {
        userId: activeConnection.userId,
        accessToken: resolveAccessToken(activeConnection),
        refreshToken: activeConnection.refreshToken || '',
        email: activeConnection.email,
      },
    });
    return driver.createDraft(input);
  }),
  get: activeDriverProcedure.input(z.object({ id: z.string() })).query(async ({ input, ctx }) => {
    const { activeConnection } = ctx;
    const driver = createDriver(activeConnection.providerId, {
      auth: {
        userId: activeConnection.userId,
        accessToken: resolveAccessToken(activeConnection),
        refreshToken: activeConnection.refreshToken || '',
        email: activeConnection.email,
      },
    });
    return driver.getDraft(input.id) as ReturnType<MailManager['getDraft']>;
  }),
  list: activeDriverProcedure
    .input(
      z.object({
        q: z.string().optional(),
        maxResults: z.number().optional(),
        pageToken: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { activeConnection } = ctx;
      const driver = createDriver(activeConnection.providerId, {
        auth: {
          userId: activeConnection.userId,
          accessToken: resolveAccessToken(activeConnection),
          refreshToken: activeConnection.refreshToken || '',
          email: activeConnection.email,
        },
      });
      const { q, maxResults, pageToken } = input;
      return driver.listDrafts({ q, maxResults, pageToken }) as Awaited<
        ReturnType<MailManager['listDrafts']>
      >;
    }),
  delete: activeDriverProcedure
    .input(
      z.object({
        id: z.string().min(1, 'id is required'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { activeConnection } = ctx;
      const driver = createDriver(activeConnection.providerId, {
        auth: {
          userId: activeConnection.userId,
          accessToken: resolveAccessToken(activeConnection),
          refreshToken: activeConnection.refreshToken || '',
          email: activeConnection.email,
        },
      });
      await driver.deleteDraft(input.id);
      return true;
    }),
});
