'use client';

import { Lock } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cleanEmailDisplay, cleanNameDisplay } from '@/lib/mail/display-format';
import type { ParsedMessage } from '@/types';

type Props = {
  emailData: ParsedMessage;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MailDisplayDetailsPopover({ emailData, open, onOpenChange }: Props) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button type="button">Details</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="space-y-1 text-sm">
          <div className="flex">
            <span className="w-24 text-end text-gray-500">{'From'}:</span>
            <div className="ml-3">
              <span className="text-muted-foreground pr-1 font-bold text-nowrap">
                {cleanNameDisplay(emailData?.sender?.name)}
              </span>
              {emailData?.sender?.name !== emailData?.sender?.email && (
                <span className="text-muted-foreground text-nowrap">
                  {cleanEmailDisplay(emailData?.sender?.email)}
                </span>
              )}
            </div>
          </div>
          <div className="flex">
            <span className="w-24 text-end text-nowrap text-gray-500">{'To'}:</span>
            <span className="text-muted-foreground ml-3 text-nowrap">
              {emailData?.to?.map((t) => cleanEmailDisplay(t.email)).join(', ')}
            </span>
          </div>
          {emailData?.replyTo && emailData.replyTo.length > 0 && (
            <div className="flex">
              <span className="w-24 text-end text-nowrap text-gray-500">{'Reply To'}:</span>
              <span className="text-muted-foreground ml-3 text-nowrap">
                {cleanEmailDisplay(emailData?.replyTo)}
              </span>
            </div>
          )}
          {emailData?.cc && emailData.cc.length > 0 && (
            <div className="flex">
              <span className="w-24 shrink-0 text-nowrap text-end text-gray-500">{'Cc'}:</span>
              <span className="text-muted-foreground ml-3 text-nowrap">
                {emailData?.cc?.map((t) => cleanEmailDisplay(t.email)).join(', ')}
              </span>
            </div>
          )}
          {emailData?.bcc && emailData.bcc.length > 0 && (
            <div className="flex">
              <span className="w-24 text-end text-gray-500">{'Bcc'}:</span>
              <span className="text-muted-foreground ml-3 text-nowrap">
                {emailData?.bcc?.map((t) => cleanEmailDisplay(t.email)).join(', ')}
              </span>
            </div>
          )}
          <div className="flex">
            <span className="w-24 text-end text-gray-500">{'Date'}:</span>
            <span className="text-muted-foreground ml-3 text-nowrap">
              {emailData?.receivedOn && !isNaN(new Date(emailData.receivedOn).getTime())
                ? format(new Date(emailData.receivedOn), 'PPpp')
                : ''}
            </span>
          </div>
          <div className="flex">
            <span className="w-24 text-end text-gray-500">{'Mailed-By'}:</span>
            <span className="text-muted-foreground ml-3 text-nowrap">
              {cleanEmailDisplay(emailData?.sender?.email)}
            </span>
          </div>
          <div className="flex">
            <span className="w-24 text-end text-gray-500">{'Signed-By'}:</span>
            <span className="text-muted-foreground ml-3 text-nowrap">
              {cleanEmailDisplay(emailData?.sender?.email)}
            </span>
          </div>
          {emailData.tls && (
            <div className="flex items-center">
              <span className="w-24 text-end text-gray-500">{'Security'}:</span>
              <div className="text-muted-foreground ml-3 flex items-center gap-1">
                <Lock className="h-4 w-4 text-green-600" /> {'Standard encryption (TLS)'}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
