import { AppSidebar } from '@/components/ui/app-sidebar';
import { Suspense } from 'react';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <div className="mx-auto w-full max-w-2xl px-6 py-8">{children}</div>
    </Suspense>
  );
}
