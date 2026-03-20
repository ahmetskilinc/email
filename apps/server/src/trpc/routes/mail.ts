import { IGetThreadResponseSchema, IGetThreadsResponseSchema } from '../../lib/driver/types';
import { activeDriverProcedure, router, privateProcedure } from '../trpc';
import { processEmailHtml } from '../../lib/email-processor';
import { defaultPageSize, FOLDERS } from '../../lib/utils';
import { toAttachmentFiles } from '../../lib/attachments';
import { serializedFileSchema } from '../../lib/schemas';
import type { DeleteAllSpamResponse } from '../../types';
import { resolveAccessToken } from '../../lib/server-utils';
import { createDriver } from '../../lib/driver';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

const senderSchema = z.object({
  name: z.string().optional(),
  email: z.string(),
});

const getDriver = (activeConnection: {
  userId: string;
  providerId: string;
  accessToken: string | null;
  refreshToken: string | null;
  email: string;
}) =>
  createDriver(activeConnection.providerId, {
    auth: {
      userId: activeConnection.userId,
      accessToken: resolveAccessToken(activeConnection),
      refreshToken: activeConnection.refreshToken || '',
      email: activeConnection.email,
    },
  });

export const mailRouter = router({
  suggestRecipients: activeDriverProcedure
    .input(
      z.object({
        query: z.string().optional().default(''),
        limit: z.number().optional().default(10),
      }),
    )
    .query(async () => {
      // Not available without Durable Objects
      return [];
    }),

  forceSync: activeDriverProcedure.mutation(async () => {
    // No-op without Durable Objects
    return { success: true };
  }),

  get: activeDriverProcedure
    .input(z.object({ id: z.string() }))
    .output(IGetThreadResponseSchema)
    .query(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      return driver.get(input.id);
    }),

  listThreads: activeDriverProcedure
    .input(
      z.object({
        folder: z.string().optional().default('inbox'),
        q: z.string().optional().default(''),
        maxResults: z.number().optional().default(defaultPageSize),
        cursor: z.string().optional().default(''),
        labelIds: z.array(z.string()).optional().default([]),
      }),
    )
    .output(IGetThreadsResponseSchema)
    .query(async ({ ctx, input }) => {
      const { folder, maxResults, cursor, q, labelIds } = input;
      const driver = getDriver(ctx.activeConnection);

      if (folder === FOLDERS.DRAFT) {
        return driver.listDrafts({ q, maxResults, pageToken: cursor });
      }

      return driver.list({
        folder,
        query: q || undefined,
        maxResults,
        labelIds,
        pageToken: cursor || undefined,
      });
    }),

  markAsRead: activeDriverProcedure
    .input(z.object({ ids: z.string().array() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      return driver.markAsRead(input.ids);
    }),

  markAsUnread: activeDriverProcedure
    .input(z.object({ ids: z.string().array() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      return driver.markAsUnread(input.ids);
    }),

  markAsImportant: activeDriverProcedure
    .input(z.object({ ids: z.string().array() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      return Promise.all(
        input.ids.map((id) =>
          driver.modifyLabels([id], { addLabels: ['IMPORTANT'], removeLabels: [] }),
        ),
      );
    }),

  modifyLabels: activeDriverProcedure
    .input(
      z.object({
        threadId: z.string().array(),
        addLabels: z.string().array().optional().default([]),
        removeLabels: z.string().array().optional().default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { threadId, addLabels, removeLabels } = input;
      const driver = getDriver(ctx.activeConnection);
      if (!threadId.length) return { success: false, error: 'No thread IDs provided' };
      await driver.modifyLabels(threadId, { addLabels, removeLabels });
      return { success: true };
    }),

  toggleStar: activeDriverProcedure
    .input(z.object({ ids: z.string().array() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      if (!input.ids.length) return { success: false, error: 'No thread IDs provided' };

      const threads = await Promise.allSettled(input.ids.map((id) => driver.get(id)));
      const anyStarred = threads.some(
        (r) =>
          r.status === 'fulfilled' &&
          r.value.messages.some((m) =>
            m.tags?.some((t) => t.name.toLowerCase().startsWith('starred')),
          ),
      );

      await driver.modifyLabels(input.ids, {
        addLabels: anyStarred ? [] : ['STARRED'],
        removeLabels: anyStarred ? ['STARRED'] : [],
      });
      return { success: true };
    }),

  toggleImportant: activeDriverProcedure
    .input(z.object({ ids: z.string().array() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      if (!input.ids.length) return { success: false, error: 'No thread IDs provided' };

      const threads = await Promise.allSettled(input.ids.map((id) => driver.get(id)));
      const anyImportant = threads.some(
        (r) =>
          r.status === 'fulfilled' &&
          r.value.messages.some((m) =>
            m.tags?.some((t) => t.name.toLowerCase().startsWith('important')),
          ),
      );

      await driver.modifyLabels(input.ids, {
        addLabels: anyImportant ? [] : ['IMPORTANT'],
        removeLabels: anyImportant ? ['IMPORTANT'] : [],
      });
      return { success: true };
    }),

  bulkStar: activeDriverProcedure
    .input(z.object({ ids: z.string().array() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      return driver.modifyLabels(input.ids, { addLabels: ['STARRED'], removeLabels: [] });
    }),

  bulkMarkImportant: activeDriverProcedure
    .input(z.object({ ids: z.string().array() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      return driver.modifyLabels(input.ids, { addLabels: ['IMPORTANT'], removeLabels: [] });
    }),

  bulkUnstar: activeDriverProcedure
    .input(z.object({ ids: z.string().array() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      return driver.modifyLabels(input.ids, { addLabels: [], removeLabels: ['STARRED'] });
    }),

  bulkUnmarkImportant: activeDriverProcedure
    .input(z.object({ ids: z.string().array() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      return driver.modifyLabels(input.ids, { addLabels: [], removeLabels: ['IMPORTANT'] });
    }),

  deleteAllSpam: activeDriverProcedure.mutation(async ({ ctx }): Promise<DeleteAllSpamResponse> => {
    try {
      const driver = getDriver(ctx.activeConnection);
      const result = await driver.deleteAllSpam();
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to delete spam emails',
        error: String(error),
        count: 0,
      };
    }
  }),

  send: activeDriverProcedure
    .input(
      z.object({
        to: z.array(senderSchema),
        subject: z.string(),
        message: z.string(),
        attachments: z.array(serializedFileSchema).optional().default([]),
        headers: z.record(z.string()).optional().default({}),
        cc: z.array(senderSchema).optional(),
        bcc: z.array(senderSchema).optional(),
        threadId: z.string().optional(),
        fromEmail: z.string().optional(),
        draftId: z.string().optional(),
        isForward: z.boolean().optional(),
        originalMessage: z.string().optional(),
        scheduleAt: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { activeConnection } = ctx;
      const driver = getDriver(activeConnection);
      const { draftId, attachments, ...mail } = input;

      const mailWithAttachments = {
        ...mail,
        attachments: attachments?.map((att: any) =>
          typeof att?.arrayBuffer === 'function' ? att : toAttachmentFiles([att])[0],
        ),
      } as typeof mail & { attachments: any[] };

      if (draftId) {
        await driver.sendDraft(draftId, mailWithAttachments);
      } else {
        await driver.create(mailWithAttachments);
      }

      return { success: true };
    }),

  unsend: activeDriverProcedure.input(z.object({ messageId: z.string() })).mutation(async () => {
    // Scheduling not available without Cloudflare Workers queues
    return { success: false, error: 'Undo send is not available in Node.js mode' };
  }),

  delete: activeDriverProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      await driver.delete(input.id);
      return true;
    }),

  bulkDelete: activeDriverProcedure
    .input(z.object({ ids: z.string().array() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      return driver.modifyLabels(input.ids, { addLabels: ['TRASH'], removeLabels: [] });
    }),

  bulkArchive: activeDriverProcedure
    .input(z.object({ ids: z.string().array() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      return driver.modifyLabels(input.ids, { addLabels: [], removeLabels: ['INBOX'] });
    }),

  bulkMute: activeDriverProcedure
    .input(z.object({ ids: z.string().array() }))
    .mutation(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      return driver.modifyLabels(input.ids, { addLabels: ['MUTE'], removeLabels: [] });
    }),

  getEmailAliases: activeDriverProcedure.query(async ({ ctx }) => {
    const driver = getDriver(ctx.activeConnection);
    return driver.getEmailAliases();
  }),

  snoozeThreads: activeDriverProcedure
    .input(z.object({ ids: z.string().array(), wakeAt: z.string() }))
    .mutation(async ({ input, ctx }) => {
      if (!input.ids.length) return { success: false, error: 'No thread IDs provided' };
      const driver = getDriver(ctx.activeConnection);
      await driver.modifyLabels(input.ids, { addLabels: ['SNOOZED'], removeLabels: ['INBOX'] });
      return { success: true };
    }),

  unsnoozeThreads: activeDriverProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input, ctx }) => {
      if (!input.ids.length) return { success: false, error: 'No thread IDs' };
      const driver = getDriver(ctx.activeConnection);
      await driver.modifyLabels(input.ids, { addLabels: ['INBOX'], removeLabels: ['SNOOZED'] });
      return { success: true };
    }),

  getMessageAttachments: activeDriverProcedure
    .input(z.object({ messageId: z.string() }))
    .query(async ({ ctx, input }) => {
      const driver = getDriver(ctx.activeConnection);
      return driver.getMessageAttachments(input.messageId);
    }),

  processEmailContent: privateProcedure
    .input(
      z.object({
        html: z.string(),
        shouldLoadImages: z.boolean(),
        theme: z.enum(['light', 'dark']),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const { processedHtml, hasBlockedImages } = processEmailHtml({
          html: input.html,
          shouldLoadImages: input.shouldLoadImages,
          theme: input.theme,
        });
        return { processedHtml, hasBlockedImages };
      } catch (error) {
        console.error('Error processing email content:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to process email content',
        });
      }
    }),

  getRawEmail: activeDriverProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const driver = getDriver(ctx.activeConnection);
      return driver.getRawEmail(input.id);
    }),
});
