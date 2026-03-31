'use client';

import { EmailComposer } from '@/components/create/email-composer';
import { useSearchParams } from 'next/navigation';

export function ComposeContent() {
  const searchParams = useSearchParams();

  const to = searchParams.get('to') || '';
  const subject = searchParams.get('subject') || '';
  const body = searchParams.get('body') || '';
  const cc = searchParams.get('cc') || '';
  const bcc = searchParams.get('bcc') || '';
  const draftId = searchParams.get('draftId') || null;

  return (
    <EmailComposer
      initialTo={to.split(',')}
      initialSubject={subject}
      initialMessage={body}
      initialCc={cc.split(',')}
      initialBcc={bcc.split(',')}
      onSendEmail={async (data) => {
        console.log(data);
      }}
    />
  );
}
