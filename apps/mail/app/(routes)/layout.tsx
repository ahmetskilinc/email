import { ConnectionSyncer } from '@/components/connection/connection-syncer';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { SiteHeader } from '@/components/ui/site-header';
import { AppSidebar } from '@/components/ui/app-sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppSidebar />
      <SidebarInset className="h-[calc(100vh-16px)]">
        <SiteHeader />
        <ConnectionSyncer />
        <div className="relative flex max-h-screen w-full overflow-hidden">{children}</div>
      </SidebarInset>
    </>
  );
}
