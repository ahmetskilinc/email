'use client';

import { cleanEmailDisplay, cleanNameDisplay } from '@/lib/mail/display-format';
import type { ParsedMessage } from '@/types';

type Props = {
  emailData: ParsedMessage;
  folder: string | undefined;
};

export function MailDisplayRecipientsSummary({ emailData, folder }: Props) {
  const allRecipients = [...(emailData?.to || []), ...(emailData?.cc || [])];

  const recipientSummary =
    allRecipients.length === 1 && folder !== 'sent' ? (
      <span key="you">You</span>
    ) : (
      (() => {
        const visibleRecipients = allRecipients.slice(0, 3);
        const remainingCount = allRecipients.length - 3;
        return (
          <>
            {visibleRecipients.map((recipient, i) => (
              <span key={recipient.email}>
                {cleanNameDisplay(recipient.name) || cleanEmailDisplay(recipient.email)}
                {i < visibleRecipients.length - 1 ? ', ' : ''}
              </span>
            ))}
            {remainingCount > 0 && <span key="others">{`, +${remainingCount} others`}</span>}
          </>
        );
      })()
    );

  return (
    <div className="flex justify-between">
      <div className="flex gap-1">
        <p className="text-muted-foreground text-sm font-medium dark:text-[#8C8C8C]">
          {'To'}: {recipientSummary}
        </p>
        {(emailData?.bcc?.length || 0) > 0 && (
          <p className="text-muted-foreground text-sm font-medium dark:text-[#8C8C8C]">
            Bcc:{' '}
            {emailData?.bcc?.map((recipient, i) => (
              <span key={recipient.email}>
                {cleanNameDisplay(recipient.name) || cleanEmailDisplay(recipient.email)}
                {i < (emailData?.bcc?.length || 0) - 1 ? ', ' : ''}
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
