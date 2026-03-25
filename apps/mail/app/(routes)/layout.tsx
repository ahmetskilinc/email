import { ConnectionSyncer } from '@/components/connection/connection-syncer';
import { SiteHeader } from '@/components/ui/site-header';
import { AppSidebar } from '@/components/ui/app-sidebar';
import { SidebarInset } from '@/components/ui/sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <SidebarInset className="h-dvh md:h-[calc(100dvh-1rem)]">
        <SiteHeader />
        <ConnectionSyncer />
        <div className="relative flex h-full w-full flex-1 overflow-hidden">{children}</div>
      </SidebarInset>
    </>
  );
}
