'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenu,
} from '@/components/ui/sidebar';
import { navigationConfig } from '@/config/navigation';
import { usePathname } from 'next/navigation';
import { MailPlus } from 'lucide-react';
import { NavUser } from './nav-user';
import { NavMain } from './nav-main';
import { useMemo } from 'react';

export function AppSidebar() {
  const pathname = usePathname();
  const { navItems } = useMemo(() => {
    const section = Object.entries(navigationConfig).find(([, config]) =>
      pathname.startsWith(config.path),
    );

    const currentSection = section?.[0] ?? 'mail';
    return { navItems: navigationConfig[currentSection].items };
  }, [pathname]);

  return (
    <Sidebar collapsible="offcanvas" variant="inset">
      <SidebarHeader>
        <SidebarMenu className="space-y-3">
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={
                <a>
                  <span className="text-base font-semibold">BruvMail Inc.</span>
                </a>
              }
            />
          </SidebarMenuItem>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton tooltip="Compose">
              <MailPlus />
              <span>Compose</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navItems.map((item) => ({
            title: item.title,
            url: item.href,
            icon: item.icon,
          }))}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
