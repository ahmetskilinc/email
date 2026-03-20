'use client';

import { cn, formatDate, formatTime, shouldShowSeparateTime } from '@/lib/utils';
import { memo, useEffect, useState } from 'react';
import { BimiAvatar } from '@/components/ui/bimi-avatar';
import { useAttachments } from '@/hooks/use-attachments';
import type { Attachment, ParsedMessage } from '@/types';
import { MailContent } from './mail-content';
import { useParams } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { cleanNameDisplay } from '@/lib/mail/display-format';
import { MailDisplayActionBar } from './mail-display-action-bar';
import { MailDisplayAttachmentMenu } from './mail-display-attachment-menu';
import { MailDisplayDetailsPopover } from './mail-display-details-popover';
import { MailDisplayMessageAttachments } from './mail-display-message-attachments';
import { MailDisplayRecipientsSummary } from './mail-display-recipients-summary';
import { MailThreadAttachments } from './mail-thread-attachments';

type Props = {
  emailData: ParsedMessage;
  index: number;
  totalEmails?: number;
  demo?: boolean;
  threadAttachments?: Attachment[];
};

const MailDisplay = ({ emailData, index, totalEmails, demo, threadAttachments }: Props) => {
  const { data: messageAttachments } = useAttachments(emailData.id);
  const { folder } = useParams<{ folder: string }>();
  const [openDetailsPopover, setOpenDetailsPopover] = useState(false);

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
    <div
      className={cn('relative flex-1 overflow-hidden')}
      id={`mail-${emailData.id}`}
      onClick={(e) => {
        if (openDetailsPopover) {
          e.stopPropagation();
        }
      }}
    >
      <div className="relative h-full overflow-y-auto">
        {index === 0 && threadAttachments && threadAttachments.length > 0 && (
          <div className={cn('px-4 py-4', index === 0 && 'border-b')}>
            <MailThreadAttachments attachments={threadAttachments} />
          </div>
        )}
        <div className="flex flex-col pb-2 duration-200">
          <div className="mt-3 flex w-full items-start justify-between gap-4 px-4">
            <div className="flex w-full items-center justify-center gap-4">
              <BimiAvatar email={emailData?.sender?.email} name={emailData?.sender?.name} />

              <div className="flex w-full items-center justify-between">
                <div className="flex w-full items-center justify-start">
                  <div className="flex w-full flex-col">
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">
                          {cleanNameDisplay(emailData?.sender?.name)}
                        </span>

                        <MailDisplayDetailsPopover
                          emailData={emailData}
                          open={openDetailsPopover}
                          onOpenChange={setOpenDetailsPopover}
                        />
                      </div>

                      <div className="flex items-center justify-center">
                        <div className="text-muted-foreground mr-2 flex flex-col flex-nowrap! items-end text-sm font-medium dark:text-[#8C8C8C]">
                          <time className="whitespace-nowrap">
                            {emailData?.receivedOn ? formatDate(emailData.receivedOn) : ''}
                          </time>
                          {shouldShowSeparateTime(emailData?.receivedOn) && (
                            <time className="text-xs whitespace-nowrap opacity-75">
                              {emailData?.receivedOn && formatTime(emailData.receivedOn)}
                            </time>
                          )}
                        </div>

                        <MailDisplayAttachmentMenu
                          subject={emailData.subject || 'email'}
                          messageAttachments={messageAttachments || []}
                        />
                      </div>
                    </div>
                    <MailDisplayRecipientsSummary emailData={emailData} folder={folder} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cn('grid grid-rows-[1fr] overflow-hidden duration-200')}>
          <div className="min-h-0 overflow-hidden">
            <div className="h-fit w-full p-0">
              {emailData?.decodedBody ? (
                <MailContent
                  id={emailData.id}
                  html={emailData?.decodedBody}
                  senderEmail={emailData.sender.email}
                />
              ) : null}
              <MailDisplayMessageAttachments attachments={messageAttachments || []} />
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
};

export default memo(MailDisplay);
