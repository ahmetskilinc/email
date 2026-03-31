'use client';

import type { Attachment } from '@/types';
import {
  decodeBase64ToBlob,
  formatFileSize,
  triggerBlobDownload,
} from '@/lib/mail/attachment-helpers';
import { getFileIcon } from './attachment-icons';

export function MailThreadAttachments({ attachments }: { attachments: Attachment[] }) {
  if (!attachments || attachments.length === 0) return null;

  const handleDownload = async (attachment: Attachment) => {
    try {
      const blob = decodeBase64ToBlob(attachment.body, attachment.mimeType);
      triggerBlobDownload(blob, attachment.filename);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  return (
    <div className="mt-2 w-full">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">
          Thread Attachments <span className="text-[#8D8D8D]">[{attachments.length}]</span>
        </span>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {attachments.map((attachment) => (
          <button
            key={`${attachment.attachmentId}-${attachment.filename}`}
            onClick={() => handleDownload(attachment)}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-[#F0F0F0] dark:bg-[#262626] dark:hover:bg-[#303030]"
          >
            <span className="text-muted-foreground">{getFileIcon(attachment.filename)}</span>
            <span className="max-w-[200px] truncate" title={attachment.filename}>
              {attachment.filename}
            </span>
            <span className="text-muted-foreground">{formatFileSize(attachment.size)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
