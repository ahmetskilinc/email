import { activeDriverProcedure, router } from '../trpc';
import { resolveAccessToken } from '../../lib/server-utils';
import { createDriver } from '../../lib/driver';
import { z } from 'zod';

export const labelsRouter = router({
  list: activeDriverProcedure
    .output(
      z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          color: z
            .object({
              backgroundColor: z.string(),
              textColor: z.string(),
            })
            .optional(),
          type: z.string(),
        }),
      ),
    )
    .query(async ({ ctx }) => {
      const { activeConnection } = ctx;
      const driver = createDriver(activeConnection.providerId, {
        auth: {
          userId: activeConnection.userId,
          accessToken: resolveAccessToken(activeConnection),
          refreshToken: activeConnection.refreshToken || '',
          email: activeConnection.email,
        },
      });
      return driver.getUserLabels();
    }),
  create: activeDriverProcedure
    .input(
      z.object({
        name: z.string(),
        color: z
          .object({
            backgroundColor: z.string(),
            textColor: z.string(),
          })
          .default({
            backgroundColor: '',
            textColor: '',
          }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { activeConnection } = ctx;
      const driver = createDriver(activeConnection.providerId, {
        auth: {
          userId: activeConnection.userId,
          accessToken: resolveAccessToken(activeConnection),
          refreshToken: activeConnection.refreshToken || '',
          email: activeConnection.email,
        },
      });
      return driver.createLabel(input);
    }),
  update: activeDriverProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string().optional(),
        color: z
          .object({
            backgroundColor: z.string(),
            textColor: z.string(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { activeConnection } = ctx;
      const driver = createDriver(activeConnection.providerId, {
        auth: {
          userId: activeConnection.userId,
          accessToken: resolveAccessToken(activeConnection),
          refreshToken: activeConnection.refreshToken || '',
          email: activeConnection.email,
        },
      });
      const { id, ...label } = input;
      return driver.updateLabel(id, label);
    }),
  delete: activeDriverProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { activeConnection } = ctx;
      const driver = createDriver(activeConnection.providerId, {
        auth: {
          userId: activeConnection.userId,
          accessToken: resolveAccessToken(activeConnection),
          refreshToken: activeConnection.refreshToken || '',
          email: activeConnection.email,
        },
      });
      return driver.deleteLabel(input.id);
    }),
});
