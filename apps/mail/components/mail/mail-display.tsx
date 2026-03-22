'use client';

import { MailDisplayMessageAttachments } from './mail-display-message-attachments';
import { MailDisplayRecipientsSummary } from './mail-display-recipients-summary';
import { cn, formatDate, formatTime, shouldShowSeparateTime } from '@/lib/utils';
import { MailDisplayDetailsPopover } from './mail-display-details-popover';
import { MailDisplayAttachmentMenu } from './mail-display-attachment-menu';
import { MailThreadAttachments } from './mail-thread-attachments';
import { MailDisplayActionBar } from './mail-display-action-bar';
import { cleanNameDisplay } from '@/lib/mail/display-format';
import { BimiAvatar } from '@/components/ui/bimi-avatar';
import { useAttachments } from '@/hooks/use-attachments';
import type { Attachment, ParsedMessage } from '@/types';
import { MailContent } from './mail-content';
import { useParams } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { useEffect } from 'react';

type Props = {
  emailData: ParsedMessage;
  index: number;
  totalEmails?: number;
  demo?: boolean;
  threadAttachments?: Attachment[];
};

export default function MailDisplay({
  emailData,
  index,
  totalEmails,
  demo,
  threadAttachments,
}: Props) {
  const { data: messageAttachments } = useAttachments(emailData.id);
  const { folder } = useParams<{ folder: string }>();

  const [, setActiveReplyId] = useQueryState('activeReplyId');
  const [, setMode] = useQueryState('mode');

  useEffect(() => {
    if (!demo && totalEmails && index === totalEmails - 1 && totalEmails > 5) {
      setTimeout(() => {
        const element = document.getElementById(`mail-${emailData.id}`);
        element?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [demo, emailData.id, totalEmails, index]);

  return (
    <div className="relative flex-1">
      <div className="relative h-full overflow-y-auto">
        {index === 0 && threadAttachments && threadAttachments.length > 0 && (
          <div className={cn('px-4 py-4', index === 0 && 'border-b')}>
            <MailThreadAttachments attachments={threadAttachments} />
          </div>
        )}
        <div className="flex flex-col duration-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center justify-start gap-2">
              <BimiAvatar email={emailData?.sender?.email} name={emailData?.sender?.name} />
              <div>
                <div className="flex items-center justify-start gap-2">
                  {cleanNameDisplay(emailData?.sender?.name)}
                  <MailDisplayDetailsPopover emailData={emailData} />
                </div>
                <MailDisplayRecipientsSummary emailData={emailData} folder={folder} />
              </div>
            </div>
            <div className="flex flex-col items-end justify-end">
              <time className="text-sm text-nowrap">
                {emailData?.receivedOn ? formatDate(emailData.receivedOn) : ''}
              </time>
              {shouldShowSeparateTime(emailData?.receivedOn) && (
                <time className="text-xs text-nowrap opacity-75">
                  {emailData?.receivedOn && formatTime(emailData.receivedOn)}
                </time>
              )}
            </div>
          </div>
          {messageAttachments && messageAttachments.length > 0 && (
            <MailDisplayAttachmentMenu
              subject={emailData.subject || 'email'}
              messageAttachments={messageAttachments}
            />
          )}
        </div>

        <div className={cn('grid grid-rows-[1fr] overflow-hidden')}>
          <div className="min-h-0 overflow-hidden">
            <div className="h-fit w-full p-0">
              {emailData?.decodedBody ? (
                <MailContent
                  id={emailData.id}
                  html={emailData?.decodedBody}
                  senderEmail={emailData.sender.email}
                />
              ) : (
                <p className="text-sm text-gray-500">No body found</p>
              )}
              {messageAttachments && messageAttachments.length > 0 && (
                <MailDisplayMessageAttachments attachments={messageAttachments} />
              )}
              <MailDisplayActionBar
                onReply={() => {
                  void setMode('reply');
                  void setActiveReplyId(emailData.id);
                }}
                onReplyAll={() => {
                  void setMode('replyAll');
                  void setActiveReplyId(emailData.id);
                }}
                onForward={() => {
                  void setMode('forward');
                  void setActiveReplyId(emailData.id);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
