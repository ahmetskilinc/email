'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createDownloadAllZipHandler } from '@/lib/mail/attachment-helpers';
import { Ellipsis, HardDriveDownload } from 'lucide-react';
import type { Attachment } from '@/types';
import { Button } from '../ui/button';

type Props = {
  subject: string;
  messageAttachments: Attachment[];
};

export function MailDisplayAttachmentMenu({ subject, messageAttachments }: Props) {
  if ((messageAttachments?.length ?? 0) === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <Ellipsis className="text-iconLight dark:text-iconDark" />
          </Button>
        }
      />
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
