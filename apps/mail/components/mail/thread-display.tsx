'use client';

import type { Attachment, ParsedMessage } from '@/types';
import { useAnimations } from '@/hooks/use-animations';
import { AnimatePresence, motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { MailDisplaySkeleton } from './mail-skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useThread } from '@/hooks/use-threads';
import ReplyCompose from './reply-composer';
import MailDisplay from './mail-display';
import { Button } from '../ui/button';
import { useQueryState } from 'nuqs';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const isFullscreen = false;
export function ThreadDisplay() {
  const isMobile = useIsMobile();

  const [id, _] = useQueryState('threadId');

  const { data: emailData, isLoading, refetch: refetchThread } = useThread(id ?? null);

  const [navigationDirection, setNavigationDirection] = useState<'previous' | 'next' | null>(null);

  const animationsEnabled = useAnimations();

  const allThreadAttachments = useMemo(() => {
    if (!emailData?.messages) return [];
    return emailData.messages.reduce<Attachment[]>((acc, message) => {
      if (message.attachments && message.attachments.length > 0) {
        acc.push(...message.attachments);
      }
      return acc;
    }, []);
  }, [emailData?.messages]);

  const handleAnimationComplete = useCallback(() => {
    setNavigationDirection(null);
  }, [setNavigationDirection]);

  const handleClose = useCallback(() => {
    console.log('close');
  }, []);

  return (
    <div className={cn('flex h-[calc(100dvh-4rem)] flex-col rounded-xl')}>
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
            <div className="pb-4">
              <MailDisplaySkeleton isFullscreen={isFullscreen} />
            </div>
          </div>
        ) : (
          <>
            {/* <div
              className={cn(
                'flex shrink-0 items-center px-1 pb-[10px] md:px-3 md:pt-[12px] md:pb-[11px]',
                isMobile && 'bg-panelLight dark:bg-panelDark sticky top-0 z-10 mt-2',
              )}
            >
              <div className="flex flex-1 items-center gap-2">
                <Button variant="outline" size="icon" onClick={handleClose}>
                  <X className="size-4" />
                </Button>
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
                  isMobile={isMobile}
                />
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
