'use client';

import { HardDriveDownload } from 'lucide-react';
import {
  downloadAttachment,
  formatFileSize,
  openAttachment,
} from '@/lib/mail/attachment-helpers';
import { getFileIcon } from './attachment-icons';
import type { Attachment } from '@/types';

type Props = {
  attachments: Attachment[];
};

export function MailDisplayMessageAttachments({ attachments }: Props) {
  if (!attachments.length) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 px-4 pt-4">
      {attachments.map((attachment, attIndex) => (
        <div key={`${attachment.filename}-${attachment.attachmentId}`} className="flex">
          <button
            type="button"
            className="flex cursor-pointer items-center gap-1 rounded-[5px] bg-[#FAFAFA] px-1.5 py-1 text-sm font-medium hover:bg-[#F0F0F0] dark:bg-[#262626] dark:hover:bg-[#303030]"
            onClick={() => openAttachment(attachment)}
          >
            {getFileIcon(attachment.filename)}
            <span className="max-w-[15ch] truncate text-sm text-black dark:text-white">
              {attachment.filename}
            </span>{' '}
            <span className="text-muted-foreground text-sm whitespace-nowrap dark:text-[#929292]">
              {formatFileSize(attachment.size)}
            </span>
          </button>
          <button
            type="button"
            onClick={() => downloadAttachment(attachment)}
            className="flex cursor-pointer items-center gap-1 rounded-[5px] px-1.5 py-1 text-sm"
          >
            <HardDriveDownload className="text-muted-foreground dark:text-muted-foreground h-4 w-4 fill-[#FAFAFA] dark:fill-[#262626]" />
          </button>
          {attIndex < attachments.length - 1 && (
            <div className="m-auto h-2 w-px bg-[#E0E0E0] dark:bg-[#424242]" />
          )}
        </div>
      ))}
    </div>
  );
}
