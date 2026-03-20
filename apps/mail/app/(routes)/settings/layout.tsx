import { AppSidebar } from '@/components/ui/app-sidebar';
import { Suspense } from 'react';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AppSidebar className="hidden lg:flex" />
      <div className="bg-sidebar dark:bg-sidebar w-full overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-6 py-8">{children}</div>
      </div>
    </Suspense>
  );
}
