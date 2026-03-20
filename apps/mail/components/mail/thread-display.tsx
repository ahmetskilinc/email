'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Archive, ArchiveX, Ellipsis, Inbox, Reply, Star, Trash, X, Zap } from 'lucide-react';
import { useOptimisticThreadState } from '@/components/mail/optimistic-thread-state';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useOptimisticActions } from '@/hooks/use-optimistic-actions';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { focusedIndexAtom } from '@/hooks/use-mail-navigation';
import { type ThreadDestination } from '@/lib/thread-actions';
import { useThread, useThreads } from '@/hooks/use-threads';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Attachment, ParsedMessage } from '@/types';
import { useAnimations } from '@/hooks/use-animations';
import { AnimatePresence, motion } from 'motion/react';
import { MailDisplaySkeleton } from './mail-skeleton';
import { useTRPC } from '@/providers/query-provider';
import { useMutation } from '@tanstack/react-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import ReplyCompose from './reply-composer';
import { useParams } from 'next/navigation';
import { cn, FOLDERS } from '@/lib/utils';
import MailDisplay from './mail-display';
import { useQueryState } from 'nuqs';
import { format } from 'date-fns';
import { useAtom } from 'jotai';
import { toast } from 'sonner';

const formatFileSize = (size: number) => {
  const sizeInMB = (size / (1024 * 1024)).toFixed(2);
  return sizeInMB === '0.00' ? '' : `${sizeInMB} MB`;
};

const cleanNameDisplay = (name?: string) => {
  if (!name) return '';
  return name.replace(/["<>]/g, '');
};

interface ThreadDisplayProps {
  threadParam?: any;
  onClose?: () => void;
  isMobile?: boolean;
  messages?: ParsedMessage[];
  id?: string;
}

const isFullscreen = false;
export function ThreadDisplay() {
  const isMobile = useIsMobile();
  const params = useParams<{ folder: string }>();

  const folder = params?.folder ?? 'inbox';
  const [id, setThreadId] = useQueryState('threadId');

  const { data: emailData, isLoading, refetch: refetchThread } = useThread(id ?? null);

  useEffect(() => {
    if (!id || emailData) return;
    refetchThread();
  }, [id]);
  const [, items] = useThreads();
  const [isStarred, setIsStarred] = useState(false);
  const [isImportant, setIsImportant] = useState(false);

  const [navigationDirection, setNavigationDirection] = useState<'previous' | 'next' | null>(null);

  const animationsEnabled = useAnimations();

  // Collect all attachments from all messages in the thread
  const allThreadAttachments = useMemo(() => {
    if (!emailData?.messages) return [];
    return emailData.messages.reduce<Attachment[]>((acc, message) => {
      if (message.attachments && message.attachments.length > 0) {
        acc.push(...message.attachments);
      }
      return acc;
    }, []);
  }, [emailData?.messages]);

  const [mode, setMode] = useQueryState('mode');
  const [activeReplyId, setActiveReplyId] = useQueryState('activeReplyId');
  const [, setDraftId] = useQueryState('draftId');

  const [focusedIndex, setFocusedIndex] = useAtom(focusedIndexAtom);
  const trpc = useTRPC();
  const { mutateAsync: toggleImportant } = useMutation(trpc.mail.toggleImportant.mutationOptions());
  const [, setIsComposeOpen] = useQueryState('isComposeOpen');

  // Get optimistic state for this thread
  const optimisticState = useOptimisticThreadState(id ?? '');

  const handleNext = useCallback(() => {
    if (!id || !items.length || focusedIndex === null) return setThreadId(null);
    if (focusedIndex < items.length - 1) {
      const nextIndex = Math.max(1, focusedIndex + 1);
      //   console.log('nextIndex', nextIndex);

      const nextThread = items[nextIndex];
      if (nextThread) {
        setMode(null);
        setActiveReplyId(null);
        setDraftId(null);
        setThreadId(nextThread.id);
        setFocusedIndex(focusedIndex + 1);
        if (animationsEnabled) {
          setNavigationDirection('next');
        }
      }
    }
  }, [
    items,
    id,
    focusedIndex,
    setThreadId,
    setFocusedIndex,
    setMode,
    setActiveReplyId,
    setDraftId,
    animationsEnabled,
  ]);

  const isInArchive = folder === FOLDERS.ARCHIVE;
  const isInSpam = folder === FOLDERS.SPAM;
  const isInBin = folder === FOLDERS.BIN;
  const handleClose = useCallback(() => {
    setThreadId(null);
    setMode(null);
    setActiveReplyId(null);
    setDraftId(null);
  }, [setThreadId, setMode, setActiveReplyId, setDraftId]);

  const { optimisticMoveThreadsTo } = useOptimisticActions();

  const moveThreadTo = useCallback(
    async (destination: ThreadDestination) => {
      if (!id) return;

      setMode(null);
      setActiveReplyId(null);
      setDraftId(null);

      optimisticMoveThreadsTo([id], folder, destination);
      handleNext();
    },
    [id, folder, optimisticMoveThreadsTo, handleNext, setMode, setActiveReplyId, setDraftId],
  );

  const { optimisticToggleStar } = useOptimisticActions();

  const handleToggleStar = useCallback(async () => {
    if (!emailData || !id) return;

    const newStarredState = !isStarred;
    optimisticToggleStar([id], newStarredState);
    setIsStarred(newStarredState);
  }, [emailData, id, isStarred, optimisticToggleStar]);

  const handleToggleImportant = useCallback(async () => {
    if (!emailData || !id) return;
    await toggleImportant({ ids: [id] });
    await refetchThread();
    if (isImportant) {
      toast.success('Marked as Important');
    } else {
      toast.error('Failed to mark as important');
    }
  }, [emailData, id, toggleImportant, refetchThread, isImportant]);

  // Set initial star state based on email data
  useEffect(() => {
    if (emailData?.latest?.tags) {
      // Check if any tag has the name 'STARRED'
      setIsStarred(emailData.latest.tags.some((tag) => tag.name === 'STARRED'));
      setIsImportant(emailData.latest.tags.some((tag) => tag.name === 'IMPORTANT'));
    }
  }, [emailData?.latest?.tags]);

  useEffect(() => {
    if (optimisticState.optimisticStarred !== null) {
      setIsStarred(optimisticState.optimisticStarred);
    }
  }, [optimisticState.optimisticStarred]);
  useEffect(() => {
    if (mode && activeReplyId) {
      setTimeout(() => {
        const replyElement = document.getElementById(`reply-composer-${activeReplyId}`);
        if (replyElement) {
          replyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100); // Short delay to ensure the component is rendered
    }
  }, [mode, activeReplyId]);

  const handleAnimationComplete = useCallback(() => {
    setNavigationDirection(null);
  }, [setNavigationDirection]);

  console.log(emailData);

  return (
    <div
      className={cn(
        'flex flex-col',
        isFullscreen ? 'h-screen' : isMobile ? 'h-full' : 'h-dvh rounded-xl',
      )}
    >
      <div
        className={cn(
          'relative flex flex-col overflow-hidden duration-300',
          isMobile ? 'h-full' : 'h-full',
          !isMobile && !isFullscreen && 'rounded-r-lg',
          isFullscreen ? 'fixed inset-0 z-50' : '',
        )}
      >
        {!id ? (
          <div className="flex h-full w-full items-center justify-center">
            <p className="text-lg">It&apos;s empty here</p>
          </div>
        ) : !emailData || isLoading ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ScrollArea className="h-full flex-1" type="auto">
              <div className="pb-4">
                <MailDisplaySkeleton isFullscreen={isFullscreen} />
              </div>
            </ScrollArea>
          </div>
        ) : (
          <>
            {/* <div
              className={cn(
                'flex shrink-0 items-center px-1 pb-[10px] md:px-3 md:pb-[11px] md:pt-[12px]',
                isMobile && 'bg-panelLight dark:bg-panelDark sticky top-0 z-10 mt-2',
              )}
            >
              <div className="flex flex-1 items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="icon" onClick={handleClose}>
                      <X className="size-4" />
                    </Button>
                  </TooltipTrigger>
                </Tooltip>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMode('replyAll');
                    setActiveReplyId(emailData?.latest?.id ?? '');
                  }}
                >
                  <Reply className="text-muted-foreground dark:text-[#9B9B9B]" />
                  Reply all
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="icon" onClick={handleToggleStar}>
                      <Star
                        className={cn(
                          'ml-[2px] mt-[2.4px] h-5 w-5',
                          isStarred
                            ? 'fill-yellow-400 stroke-yellow-400'
                            : 'fill-transparent stroke-[#9D9D9D] dark:stroke-[#9D9D9D]',
                        )}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{isStarred ? 'Unstar' : 'Star'}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="secondary" size="icon" onClick={() => moveThreadTo('archive')}>
                      <Archive className="text-iconLight dark:text-iconDark" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Archive</TooltipContent>
                </Tooltip>

                {!isInBin && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="destructive" size="icon" onClick={() => moveThreadTo('bin')}>
                        <Trash className="text-[#F43F5E]" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Move to Bin</TooltipContent>
                  </Tooltip>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="icon">
                      <Ellipsis className="text-iconLight dark:text-iconDark" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isInSpam || isInArchive || isInBin ? (
                      <DropdownMenuItem onClick={() => moveThreadTo('inbox')}>
                        <Inbox className="mr-2 h-4 w-4" />
                        <span>Move to Inbox</span>
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => moveThreadTo('spam')}>
                        <ArchiveX className="text-iconLight dark:text-iconDark mr-2" />
                        <span>Move to Spam</span>
                      </DropdownMenuItem>
                    )}
                    {!isImportant && (
                      <DropdownMenuItem onClick={handleToggleImportant}>
                        <Zap className="text-iconLight dark:text-iconDark mr-2" />
                        Mark as Important
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div> */}
            <div className={cn('flex min-h-0 flex-1 flex-col', isMobile && 'h-full')}>
              {animationsEnabled ? (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={id}
                    initial={{
                      opacity: 0,
                      x:
                        navigationDirection === 'previous'
                          ? -25
                          : navigationDirection === 'next'
                            ? 25
                            : 0,
                    }}
                    animate={{
                      opacity: 1,
                      x: 0,
                    }}
                    exit={{
                      opacity: 0,
                      x:
                        navigationDirection === 'previous'
                          ? 25
                          : navigationDirection === 'next'
                            ? -25
                            : 0,
                    }}
                    transition={{
                      duration: 0.08,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    onAnimationComplete={handleAnimationComplete}
                    className="h-full w-full"
                  >
                    <MessageList
                      messages={emailData.messages}
                      isFullscreen={isFullscreen}
                      totalReplies={emailData?.totalReplies}
                      allThreadAttachments={allThreadAttachments}
                      mode={mode || undefined}
                      activeReplyId={activeReplyId || undefined}
                      isMobile={isMobile}
                    />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <MessageList
                  messages={emailData.messages}
                  isFullscreen={isFullscreen}
                  totalReplies={emailData?.totalReplies}
                  allThreadAttachments={allThreadAttachments}
                  mode={mode || undefined}
                  activeReplyId={activeReplyId || undefined}
                  isMobile={isMobile}
                />
              )}

              {mode &&
                activeReplyId &&
                activeReplyId === emailData.messages[emailData.messages.length - 1]?.id && (
                  <div
                    className="border-border bg-panelLight dark:bg-panelDark sticky bottom-0 z-10 border-t px-4 py-2"
                    id={`reply-composer-${activeReplyId}`}
                  >
                    <ReplyCompose messageId={activeReplyId} />
                  </div>
                )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: ParsedMessage[];
  isFullscreen: boolean;
  totalReplies?: number;
  allThreadAttachments?: Attachment[];
  mode?: string;
  activeReplyId?: string;
  isMobile: boolean;
}

const MessageList = ({
  messages,
  isFullscreen,
  totalReplies,
  allThreadAttachments,
  mode,
  activeReplyId,
  isMobile,
}: MessageListProps) => (
  <div className={cn('flex-1 overflow-y-auto', isMobile ? 'h-[calc(100%-1px)]' : 'h-full')}>
    <div className="pb-4">
      {(messages || []).map((message, index) => {
        const isLastMessage = index === messages.length - 1;
        const isReplyingToThisMessage = mode && activeReplyId === message.id;

        return (
          <div
            key={message.id}
            className={cn('duration-200', index > 0 && 'border-border border-t')}
          >
            <MailDisplay
              emailData={message}
              index={index}
              totalEmails={totalReplies}
              threadAttachments={index === 0 ? allThreadAttachments : undefined}
            />
            {isReplyingToThisMessage && !isLastMessage && (
              <div className="px-4 py-2" id={`reply-composer-${message.id}`}>
                <ReplyCompose messageId={message.id} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);
