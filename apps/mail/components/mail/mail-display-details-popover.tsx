'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cleanEmailDisplay, cleanNameDisplay } from '@/lib/mail/display-format';
import { Button } from '@/components/ui/button';
import type { ParsedMessage } from '@/types';
import { Lock } from 'lucide-react';
import { format } from 'date-fns';

type Props = {
  emailData: ParsedMessage;
};

export function MailDisplayDetailsPopover({ emailData }: Props) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm">
            Details
          </Button>
        }
      />
      <PopoverContent className="w-fit min-w-[300px]">
        <div className="space-y-1 text-sm">
          <div className="flex">
            <span className="text-muted-foreground w-24 text-end">{'From'}:</span>
            <div className="ml-3">
              <span className="text-foreground pr-1 font-bold text-nowrap">
                {cleanNameDisplay(emailData?.sender?.name)}
              </span>
              {emailData?.sender?.name !== emailData?.sender?.email && (
                <span className="text-foreground text-nowrap">
                  {cleanEmailDisplay(emailData?.sender?.email)}
                </span>
              )}
            </div>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-24 text-end text-nowrap">{'To'}:</span>
            <span className="text-foreground ml-3 text-nowrap">
              {emailData?.to?.map((t) => cleanEmailDisplay(t.email)).join(', ')}
            </span>
          </div>
          {emailData?.replyTo && emailData.replyTo.length > 0 && (
            <div className="flex">
              <span className="text-muted-foreground w-24 text-end text-nowrap">{'Reply To'}:</span>
              <span className="text-foreground ml-3 text-nowrap">
                {cleanEmailDisplay(emailData?.replyTo)}
              </span>
            </div>
          )}
          {emailData?.cc && emailData.cc.length > 0 && (
            <div className="flex">
              <span className="text-muted-foreground w-24 shrink-0 text-end text-nowrap">
                {'Cc'}:
              </span>
              <span className="text-foreground ml-3 text-nowrap">
                {emailData?.cc?.map((t) => cleanEmailDisplay(t.email)).join(', ')}
              </span>
            </div>
          )}
          {emailData?.bcc && emailData.bcc.length > 0 && (
            <div className="flex">
              <span className="text-muted-foreground w-24 text-end">{'Bcc'}:</span>
              <span className="text-foreground ml-3 text-nowrap">
                {emailData?.bcc?.map((t) => cleanEmailDisplay(t.email)).join(', ')}
              </span>
            </div>
          )}
          <div className="flex">
            <span className="text-muted-foreground w-24 text-end">{'Date'}:</span>
            <span className="text-foreground ml-3 text-nowrap">
              {emailData?.receivedOn && !isNaN(new Date(emailData.receivedOn).getTime())
                ? format(new Date(emailData.receivedOn), 'PPpp')
                : ''}
            </span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-24 text-end">{'Mailed-By'}:</span>
            <span className="text-foreground ml-3 text-nowrap">
              {cleanEmailDisplay(emailData?.sender?.email)}
            </span>
          </div>
          <div className="flex">
            <span className="text-muted-foreground w-24 text-end">{'Signed-By'}:</span>
            <span className="text-foreground ml-3 text-nowrap">
              {cleanEmailDisplay(emailData?.sender?.email)}
            </span>
          </div>
          {emailData.tls && (
            <div className="flex items-center">
              <span className="text-muted-foreground w-24 text-end">{'Security'}:</span>
              <div className="text-foreground ml-3 flex items-center gap-1">
                <Lock className="h-4 w-4 text-green-600" /> {'Standard encryption (TLS)'}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
