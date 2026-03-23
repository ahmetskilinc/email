'use client'
import { isThreadInBackgroundQueueAtom } from '@/store/backgroundQueue';
import { useInfiniteQuery, useQuery, useMutation } from '@tanstack/react-query';
import type { IGetThreadResponse } from '../../server/src/lib/driver/types';
import { threadConnectionAtom } from '@/store/threadConnection';
import { useActiveConnection } from '@/hooks/use-connections';
import { useSearchValue } from '@/hooks/use-search-value';
import { useTRPC } from '@/providers/query-provider';
import useSearchLabels from './use-labels-search';
import { useSession } from '@/lib/auth-client';
import { useAtomValue, useSetAtom } from 'jotai';
import { useSettings } from './use-settings';
import { useParams, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useQueryState } from 'nuqs';
import { useEffect, useMemo } from 'react';

export const useThreads = () => {
  const { folder } = useParams<{ folder: string }>();
  const pathname = usePathname();
  const isAllInboxes = pathname === '/mail/all-inboxes';
  const [searchValue] = useSearchValue();
  const isInQueue = useAtomValue(isThreadInBackgroundQueueAtom);
  const trpc = useTRPC();
  const { labels } = useSearchLabels();
  const { data: activeConnection } = useActiveConnection();
  const setThreadConnection = useSetAtom(threadConnectionAtom);

  const threadsQuery = useInfiniteQuery(
    trpc.mail.listThreads.infiniteQueryOptions(
      {
        q: searchValue.value,
        folder,
        labelIds: labels,
      },
      {
        enabled: !isAllInboxes && !!activeConnection,
        initialCursor: '',
        getNextPageParam: (lastPage) => lastPage?.nextPageToken ?? null,
        staleTime: 60 * 1000,
        refetchOnMount: true,
        refetchIntervalInBackground: true,
      },
    ),
  );

  const allInboxesQuery = useInfiniteQuery(
    trpc.mail.listAllInboxes.infiniteQueryOptions(
      {},
      {
        enabled: isAllInboxes,
        initialCursor: '',
        getNextPageParam: (lastPage) => lastPage?.nextPageToken ?? null,
        staleTime: 60 * 1000,
        refetchOnMount: true,
        refetchIntervalInBackground: true,
      },
    ),
  );

  useEffect(() => {
    if (!isAllInboxes || !allInboxesQuery.data) return;
    const map: Record<string, string> = {};
    allInboxesQuery.data.pages
      .flatMap((p) => p.threads)
      .forEach((t) => {
        if (t.connectionId) map[t.id] = t.connectionId;
      });
    setThreadConnection((prev) => ({ ...prev, ...map }));
  }, [isAllInboxes, allInboxesQuery.data, setThreadConnection]);

  const activeQuery = isAllInboxes ? allInboxesQuery : threadsQuery;

  const threads = useMemo(() => {
    return activeQuery.data
      ? activeQuery.data.pages
          .flatMap((e) => e.threads)
          .filter(Boolean)
          .filter((e) => !isInQueue(`thread:${e.id}`))
      : [];
  }, [activeQuery.data, isInQueue]);

  const isEmpty = threads.length === 0;
  const isReachingEnd =
    isEmpty ||
    (activeQuery.data &&
      !activeQuery.data.pages[activeQuery.data.pages.length - 1]?.nextPageToken);

  const loadMore = async () => {
    if (activeQuery.isLoading || activeQuery.isFetching) return;
    await activeQuery.fetchNextPage();
  };

  return [activeQuery, threads, isReachingEnd, loadMore] as const;
};

export const useThread = (threadId: string | null, options?: { enabled?: boolean }) => {
  const { data: session } = useSession();
  const { data: activeConnection } = useActiveConnection();
  const [queryThreadId] = useQueryState('threadId');
  const id = threadId ?? queryThreadId;
  const trpc = useTRPC();
  const { data: settings } = useSettings();
  const { theme: systemTheme } = useTheme();
  const threadConnectionMap = useAtomValue(threadConnectionAtom);

  const connectionId = id ? threadConnectionMap[id] : undefined;

  const isEnabled = (options?.enabled ?? true) && !!id && !!session?.user.id && !!activeConnection;

  const threadQuery = useQuery(
    trpc.mail.get.queryOptions(
      {
        id: id!,
        connectionId,
      },
      {
        enabled: isEnabled,
        staleTime: 1000 * 60 * 60,
      },
    ),
  );

  const { latestDraft, isGroupThread, finalData, latestMessage } = useMemo(() => {
    if (!threadQuery.data) {
      return {
        latestDraft: undefined,
        isGroupThread: false,
        finalData: undefined,
        latestMessage: undefined,
      };
    }

    const latestDraft = threadQuery.data.latest?.id
      ? threadQuery.data.messages.findLast((e) => e.isDraft)
      : undefined;

    const isGroupThread = threadQuery.data.latest?.id
      ? [
          ...(threadQuery.data.latest.to || []),
          ...(threadQuery.data.latest.cc || []),
          ...(threadQuery.data.latest.bcc || []),
        ].length > 1
      : false;

    const nonDraftMessages = threadQuery.data.messages.filter((e) => !e.isDraft);
    const latestMessage = nonDraftMessages[nonDraftMessages.length - 1];

    const finalData: IGetThreadResponse = {
      ...threadQuery.data,
      messages: nonDraftMessages,
    };

    return { latestDraft, isGroupThread, finalData, latestMessage };
  }, [threadQuery.data]);

  const { mutateAsync: processEmailContent } = useMutation(
    trpc.mail.processEmailContent.mutationOptions(),
  );

  const shouldLoadImages = useMemo(() => {
    if (!settings?.settings || !latestMessage?.sender?.email) return false;

    return !!(
      settings.settings.externalImages ||
      settings.settings.trustedSenders?.includes(latestMessage.sender.email)
    );
  }, [settings?.settings, latestMessage?.sender?.email]);

  useQuery({
    queryKey: [
      'email-content',
      latestMessage?.id,
      shouldLoadImages,
      systemTheme,
    ],
    queryFn: async () => {
      if (!latestMessage?.decodedBody || !settings?.settings) return null;

      const userTheme =
        settings.settings.colorTheme === 'system' ? systemTheme : settings.settings.colorTheme;
      const theme = userTheme === 'dark' ? 'dark' : 'light';

      const result = await processEmailContent({
        html: latestMessage.decodedBody,
        shouldLoadImages,
        theme,
      });

      return {
        html: result.processedHtml,
        hasBlockedImages: result.hasBlockedImages,
      };
    },
    enabled: !!latestMessage?.decodedBody && !!settings?.settings,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return { ...threadQuery, data: finalData, isGroupThread, latestDraft };
};
