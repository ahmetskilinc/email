'use client';

import { useParams, useRouter } from 'next/navigation';
import { MailLayout } from '@/components/mail/mail';
import { useLabels } from '@/hooks/use-labels';
import { useEffect, useMemo } from 'react';

export const dynamic = 'force-dynamic';

const ALLOWED_FOLDERS = new Set(['inbox', 'draft', 'sent', 'spam', 'bin', 'archive']);

function checkLabelExists(labels: any[], id: string): boolean {
  for (const label of labels) {
    if (label.id === id) return true;
    if (label.labels?.length > 0 && checkLabelExists(label.labels, id)) return true;
  }
  return false;
}

export default function MailPage() {
  const params = useParams();
  const folder = params.folder as string;
  const router = useRouter();

  const isStandardFolder = ALLOWED_FOLDERS.has(folder);
  const { userLabels, isLoading: isLoadingLabels } = useLabels();

  const isLabelValid = useMemo(() => {
    if (isStandardFolder) return true;
    if (isLoadingLabels) return true;
    if (!userLabels) return false;
    return checkLabelExists(userLabels, folder);
  }, [isStandardFolder, isLoadingLabels, userLabels, folder]);

  useEffect(() => {
    if (!isLabelValid) {
      const timer = setTimeout(() => router.push('/mail/inbox'), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLabelValid, router]);

  if (!isLabelValid) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center">
        <h2 className="text-xl font-semibold">Folder not found</h2>
        <p className="text-muted-foreground mt-2">
          The folder you&apos;re looking for doesn&apos;t exist. Redirecting to inbox...
        </p>
      </div>
    );
  }

  return <MailLayout />;
}
