'use client';

import { useOptimisticThreadState } from '@/components/mail/optimistic-thread-state';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useIsFetching, type UseQueryResult } from '@tanstack/react-query';
import type { ParsedDraft } from '../../../server/src/lib/driver/types';
import { useOptimisticActions } from '@/hooks/use-optimistic-actions';
import { focusedIndexAtom } from '@/hooks/use-mail-navigation';
import { useThread, useThreads } from '@/hooks/use-threads';
import { cn, FOLDERS, formatDate } from '@/lib/utils';
import { useTRPC } from '@/providers/query-provider';
import { useSettings } from '@/hooks/use-settings';
import { PencilLine, Users } from 'lucide-react';
import { VList, type VListHandle } from 'virtua';
import { BimiAvatar } from '../ui/bimi-avatar';
import { useDraft } from '@/hooks/use-drafts';
import type { ParsedMessage } from '@/types';
import { useParams } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { Avatar } from '../ui/avatar';
import { useQueryState } from 'nuqs';
import { useAtom } from 'jotai';

function cleanNameDisplay(name?: string) {
  if (!name) return '';
  const match = name.match(/^[^\p{L}\p{N}.]*(.*?)[^\p{L}\p{N}.]*$/u);
  return match ? match[1] : name;
}

function MailListInlineSpinner() {
  return (
    <div className="h-4 w-4 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent dark:border-white dark:border-t-transparent" />
  );
}

interface MailListRowProps {
  title: string;
  subtitle: string;
  date?: string;
  unread?: boolean;
  isSelected?: boolean;
  isKeyboardFocused?: boolean;
  isGroup?: boolean;
  avatarEmail?: string;
  avatarName?: string;
  replyCount?: number;
  hasDraftBadge?: boolean;
  loading?: boolean;
  onClick?: () => void;
}

function MailListRow({
  title,
  subtitle,
  date,
  unread,
  isSelected,
  isKeyboardFocused,
  isGroup,
  avatarEmail,
  avatarName,
  replyCount,
  hasDraftBadge,
  loading,
  onClick,
}: MailListRowProps) {
  if (loading) {
    return (
      <div className="select-none border-b md:my-1 md:border-none">
        <div className="group relative mx-1 flex cursor-pointer flex-col items-start rounded-lg py-2 text-left text-sm">
          <div className="flex w-full items-center justify-between gap-4 px-4">
            <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
            <div className="flex w-full flex-col gap-1">
              <Skeleton className="bg-muted h-4 w-32 rounded" />
              <Skeleton className="bg-muted h-4 w-48 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const showBorder = !unread || isSelected;

  return (
    <div className={cn('select-none border-b md:my-1 md:border-none')} onClick={onClick}>
      <div
        className={cn(
          'hover:bg-offsetLight dark:hover:bg-primary/5 group relative mx-1 flex cursor-pointer flex-col items-start rounded-lg py-2 text-left text-sm hover:opacity-100',
          (isSelected || isKeyboardFocused) && 'border-border bg-primary/5 opacity-100',
          isKeyboardFocused && 'ring-primary/50',
        )}
      >
        <div
          className={cn(
            'relative flex w-full items-center justify-between gap-4 px-4',
            !unread && 'opacity-60',
          )}
        >
          <div>
            {isGroup ? (
              <Avatar className={cn('h-8 w-8 rounded-full', showBorder && 'border')}>
                <div className="flex h-full w-full items-center justify-center rounded-full bg-[#FFFFFF] p-2 dark:bg-[#373737]">
                  <Users className="h-4 w-4" />
                </div>
              </Avatar>
            ) : (
              <BimiAvatar email={avatarEmail ?? ''} name={avatarName ?? avatarEmail ?? ''} />
            )}
          </div>

          <div className="flex w-full justify-between">
            <div className="w-full">
              <div className="flex w-full flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-[4px]">
                  <span
                    className={cn(
                      unread && !isSelected ? 'font-bold' : 'font-medium',
                      'text-md flex items-baseline gap-1 group-hover:opacity-100',
                    )}
                  >
                    <div className="flex items-center gap-1">
                      <span className="line-clamp-1 overflow-hidden text-sm">{title}</span>
                      {unread && !isSelected ? (
                        <span className="ml-0.5 size-2 rounded-full bg-[#006FFE]" />
                      ) : null}
                    </div>
                  </span>
                  {replyCount && replyCount > 1 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="rounded-md text-xs opacity-70">[{replyCount}]</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {replyCount === 1 ? '1 reply' : `${replyCount} replies`}
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                  {hasDraftBadge ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center">
                          <PencilLine className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Draft</TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
                {date ? (
                  <p
                    className={cn(
                      'text-muted-foreground text-nowrap text-xs font-normal opacity-70 transition-opacity group-hover:opacity-100 dark:text-[#8C8C8C]',
                      isSelected && 'opacity-100',
                    )}
                  >
                    {date}
                  </p>
                ) : null}
              </div>
              <div className="flex justify-between">
                <p className="mt-1 line-clamp-1 w-[95%] min-w-0 overflow-hidden text-sm text-[#8C8C8C]">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MailListItemWrapperProps {
  message: { id: string };
  onClick?: (message: ParsedMessage) => () => void;
  isKeyboardFocused?: boolean;
}

const ThreadItem = memo(
  function ThreadItem({ message, onClick, isKeyboardFocused }: MailListItemWrapperProps) {
    const { folder } = useParams<{ folder: string }>();
    const [threadId] = useQueryState('threadId');
    const isFolderSent = folder === FOLDERS.SENT;

    const rawPreview = (message as any)?.$raw?.preview as
      | {
          sender: { name: string; email: string };
          subject: string;
          receivedOn: string;
          unread: boolean;
          totalReplies: number;
        }
      | undefined;

    const {
      data: getThreadData,
      isGroupThread,
      latestDraft,
    } = useThread(message.id, { enabled: !rawPreview });

    const latestMessage = getThreadData?.latest;
    const idToUse = latestMessage?.threadId ?? latestMessage?.id ?? message.id;
    const optimisticState = useOptimisticThreadState(idToUse ?? '');

    const displayUnread = useMemo(() => {
      if (optimisticState.optimisticRead !== null) return !optimisticState.optimisticRead;
      return getThreadData?.hasUnread ?? rawPreview?.unread ?? false;
    }, [optimisticState.optimisticRead, getThreadData?.hasUnread, rawPreview?.unread]);

    const effectiveLatestMessage =
      latestMessage ??
      (rawPreview
        ? ({
            id: message.id,
            threadId: message.id,
            sender: rawPreview.sender,
            subject: rawPreview.subject,
            receivedOn: rawPreview.receivedOn,
            unread: rawPreview.unread,
            body: undefined,
            tags: [],
          } as any)
        : undefined);

    if (!effectiveLatestMessage || optimisticState.shouldHide || !idToUse) return null;

    const totalReplies = getThreadData?.totalReplies ?? rawPreview?.totalReplies ?? 0;
    const isSelected = !!threadId && idToUse === threadId;

    const cleanName = effectiveLatestMessage.sender?.name
      ? effectiveLatestMessage.sender.name.trim().replace(/^['"]|['"]$/g, '')
      : '';

    const title = isFolderSent
      ? (effectiveLatestMessage.subject ?? '')
      : cleanNameDisplay(cleanName || effectiveLatestMessage.sender?.email || '');

    const subtitle = isFolderSent
      ? (latestMessage?.to?.map((e: { email: string }) => e.email).join(', ') ?? '')
      : (effectiveLatestMessage.subject ?? '');

    const receivedOn = effectiveLatestMessage.receivedOn as string | undefined;
    const dateStr = receivedOn ? formatDate(receivedOn.split('.')[0] || '') : undefined;

    return (
      <MailListRow
        title={title}
        subtitle={subtitle}
        date={dateStr}
        unread={displayUnread}
        isSelected={isSelected}
        isKeyboardFocused={isKeyboardFocused}
        isGroup={isGroupThread}
        avatarEmail={effectiveLatestMessage.sender?.email}
        avatarName={cleanName || effectiveLatestMessage.sender?.email}
        replyCount={totalReplies}
        hasDraftBadge={!!latestDraft}
        onClick={onClick ? onClick(effectiveLatestMessage) : undefined}
      />
    );
  },
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.isKeyboardFocused === next.isKeyboardFocused &&
    Object.is(prev.onClick, next.onClick),
);

const DraftItem = memo(function DraftItem({ message }: MailListItemWrapperProps) {
  const draftQuery = useDraft(message.id) as UseQueryResult<ParsedDraft>;
  const draft = draftQuery.data;
  const [, setComposeOpen] = useQueryState('isComposeOpen');
  const [, setDraftId] = useQueryState('draftId');
  const optimisticState = useOptimisticThreadState(message.id);

  const handleClick = useCallback(() => {
    setComposeOpen('true');
    setDraftId(message.id);
  }, [message.id, setComposeOpen, setDraftId]);

  if (optimisticState.shouldHide) return null;
  if (!draft) return <MailListRow loading title="" subtitle="" />;

  const recipient = draft.to?.[0] || 'No Recipient';
  const dateStr = draft.rawMessage?.internalDate
    ? formatDate(Number(draft.rawMessage.internalDate))
    : undefined;

  return (
    <MailListRow
      title={cleanNameDisplay(recipient)}
      subtitle={draft.subject ?? ''}
      date={dateStr}
      avatarEmail={typeof recipient === 'string' && recipient.includes('@') ? recipient : undefined}
      avatarName={cleanNameDisplay(recipient)}
      onClick={handleClick}
    />
  );
});

export const MailList = memo(
  function MailList() {
    const { folder } = useParams<{ folder: string }>();
    const { data: settingsData } = useSettings();
    const [, setThreadId] = useQueryState('threadId');
    const [, setDraftId] = useQueryState('draftId');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      setIsMounted(true);
    }, []);

    const [{ refetch, isLoading, isFetching, isFetchingNextPage, hasNextPage }, items, , loadMore] =
      useThreads();
    const trpc = useTRPC();
    const isFetchingMail = useIsFetching({ queryKey: trpc.mail.get.queryKey() }) > 0;
    const itemsRef = useRef(items);
    const parentRef = useRef<HTMLDivElement>(null);
    const vListRef = useRef<VListHandle>(null);

    useEffect(() => {
      itemsRef.current = items;
    }, [items]);

    useEffect(() => {
      const handleRefresh = () => {
        void refetch();
      };

      window.addEventListener('refreshMailList', handleRefresh);
      return () => window.removeEventListener('refreshMailList', handleRefresh);
    }, [refetch]);

    const handleNavigateToThread = useCallback(
      (threadId: string | null) => {
        setThreadId(threadId);
        return;
      },
      [setThreadId],
    );

    const [, setFocusedIndex] = useAtom(focusedIndexAtom);

    const { optimisticMarkAsRead } = useOptimisticActions();
    const handleMailClick = useCallback(
      (message: ParsedMessage) => async () => {
        const autoRead = settingsData?.settings?.autoRead ?? true;

        const messageThreadId = message.threadId ?? message.id;
        const clickedIndex = itemsRef.current.findIndex((item) => item.id === messageThreadId);
        setFocusedIndex(clickedIndex);
        if (message.unread && autoRead) optimisticMarkAsRead([messageThreadId], true);
        setThreadId(messageThreadId);
        setDraftId(null);
      },
      [setFocusedIndex, optimisticMarkAsRead, setThreadId, setDraftId, settingsData],
    );

    const Comp = useMemo(() => (folder === FOLDERS.DRAFT ? DraftItem : ThreadItem), [folder]);

    const vListRenderer = useCallback(
      (index: number) => {
        const item = items[index];
        return item ? (
          <>
            <Comp key={item.id} message={item} onClick={handleMailClick} />
            {index === items.length - 1 && (isFetchingNextPage || isFetchingMail) ? (
              <div className="flex w-full justify-center py-4">
                <MailListInlineSpinner />
              </div>
            ) : null}
          </>
        ) : (
          <></>
        );
      },
      [
        folder,
        items,
        isFetchingMail,
        isFetchingNextPage,
        handleMailClick,
        isLoading,
        isFetching,
        hasNextPage,
      ],
    );

    return (
      <>
        <div ref={parentRef} className="hide-link-indicator flex h-full w-full">
          {!isMounted || isLoading ? (
            <div className="flex h-32 w-full items-center justify-center">
              <MailListInlineSpinner />
            </div>
          ) : !items || items.length === 0 ? (
            <div className="flex h-full w-full items-center justify-center">
              <p className="text-lg">It&apos;s empty here</p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col" id="mail-list-scroll">
              <VList
                ref={vListRef}
                count={items.length}
                overscan={5}
                itemSize={100}
                className="flex-1 overflow-x-hidden"
                onScroll={() => {
                  if (!vListRef.current) return;
                  const endIndex = vListRef.current.findEndIndex();
                  if (
                    Math.abs(items.length - 1 - endIndex) < 7 &&
                    !isLoading &&
                    !isFetchingNextPage &&
                    !isFetchingMail &&
                    hasNextPage
                  ) {
                    void loadMore();
                  }
                }}
              >
                {vListRenderer}
              </VList>
            </div>
          )}
        </div>
        <div className="w-full pt-2 text-center">
          {isFetching ? (
            <div className="text-center">
              <div className="mx-auto">
                <MailListInlineSpinner />
              </div>
            </div>
          ) : (
            <div className="h-2" />
          )}
        </div>
      </>
    );
  },
  () => true,
);
