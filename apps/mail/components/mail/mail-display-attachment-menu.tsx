'use client';

import { Ellipsis, HardDriveDownload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createDownloadAllZipHandler } from '@/lib/mail/attachment-helpers';
import type { Attachment } from '@/types';

type Props = {
  subject: string;
  messageAttachments: Attachment[];
};

export function MailDisplayAttachmentMenu({ subject, messageAttachments }: Props) {
  if ((messageAttachments?.length ?? 0) === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-md bg-white transition-colors hover:bg-gray-100 focus:ring-0 focus:outline-none dark:bg-[#313131] dark:hover:bg-[#3d3d3d]"
        >
          <Ellipsis className="text-iconLight dark:text-iconDark" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            void createDownloadAllZipHandler(subject, messageAttachments)();
          }}
        >
          <HardDriveDownload className="mr-2 h-4 w-4" />
          Download All Attachments
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
