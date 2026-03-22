'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { MailList } from '@/components/mail/mail-list';
import { useIsMobile } from '@/hooks/use-mobile';
import { ThreadDisplay } from './thread-display';
import { useSession } from '@/lib/auth-client';
import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';

export function MailLayout() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const isMobile = useIsMobile();
  const [threadId, setThreadId] = useQueryState('threadId');

  useEffect(() => {
    if (!session?.user && !isPending) {
      router.push('/login');
    }
  }, [session?.user, isPending, router]);

  const handleSheetOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setThreadId(null);
    },
    [setThreadId],
  );

  return (
    <div className="relative flex h-full w-full flex-row p-0">
      <MailList />

      {isMobile ? (
        <Sheet open={!!threadId} onOpenChange={handleSheetOpenChange}>
          <SheetContent side="bottom" draggable className="h-[95dvh]! rounded-t-xl">
            <ThreadDisplay />
          </SheetContent>
        </Sheet>
      ) : (
        <ThreadDisplay />
      )}
    </div>
  );
}
