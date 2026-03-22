'use client';

import { SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { Attachment, ParsedMessage } from '@/types';
import { MailDisplaySkeleton } from './mail-skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { useThread } from '@/hooks/use-threads';
import MailDisplay from './mail-display';
import { useQueryState } from 'nuqs';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

const isFullscreen = false;
export function ThreadDisplay() {
  const isMobile = useIsMobile();

  const [id, _] = useQueryState('threadId');

  const { data: emailData, isLoading } = useThread(id ?? null);

  const allThreadAttachments = useMemo(() => {
    if (!emailData?.messages) return [];
    return emailData.messages.reduce<Attachment[]>((acc, message) => {
      if (message.attachments && message.attachments.length > 0) {
        acc.push(...message.attachments);
      }
      return acc;
    }, []);
  }, [emailData?.messages]);

  return (
    <div className={cn('flex min-h-0 flex-1 flex-col', !isMobile && 'h-[calc(100dvh-4rem)]')}>
      <div
        className={cn(
          'relative flex min-h-0 flex-1 flex-col overflow-hidden',
          isFullscreen && 'fixed inset-0 z-50',
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
            {isMobile && (
              <SheetHeader>
                <SheetTitle>Thread</SheetTitle>
                <SheetDescription>Email thread view</SheetDescription>
              </SheetHeader>
            )}
            <MessageList
              messages={emailData.messages}
              totalReplies={emailData?.totalReplies}
              allThreadAttachments={allThreadAttachments}
            />
          </>
        )}
      </div>
    </div>
  );
}

interface MessageListProps {
  messages: ParsedMessage[];
  totalReplies?: number;
  allThreadAttachments?: Attachment[];
}

const MessageList = ({ messages, totalReplies, allThreadAttachments }: MessageListProps) => (
  <div className="min-h-0 flex-1 overflow-y-auto">
    {(messages || []).map((message, index) => (
      <MailDisplay
        key={message.id}
        emailData={message}
        index={index}
        totalEmails={totalReplies}
        threadAttachments={index === 0 ? allThreadAttachments : undefined}
      />
    ))}
  </div>
);
