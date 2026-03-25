import { MailLayout } from '@/components/mail/mail';
import { Suspense } from 'react';

export default function AllInboxesPage() {
  return (
    <Suspense>
      <MailLayout />
    </Suspense>
  );
}
