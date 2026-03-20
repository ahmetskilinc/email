'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar';
import { bottomNavItems, navigationConfig } from '@/config/navigation';
import { EmailComposer } from '../create/email-composer';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import { usePathname } from 'next/navigation';
import { PencilLine } from 'lucide-react';
import React, { useMemo } from 'react';
import { NavUser } from './nav-user';
import { NavMain } from './nav-main';
import { useQueryState } from 'nuqs';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { currentSection, navItems } = useMemo(() => {
    const section = Object.entries(navigationConfig).find(([, config]) =>
      pathname.startsWith(config.path),
    );

    const currentSection = section?.[0] || 'mail';
    if (navigationConfig[currentSection]) {
      const items = [...navigationConfig[currentSection].sections];

      return { currentSection, navItems: items };
    } else {
      return {
        currentSection: '',
        navItems: [],
      };
    }
  }, [pathname]);

  const showComposeButton = currentSection === 'mail';

  return (
    <Sidebar collapsible="none" {...props} className="border-r">
      <SidebarHeader>
        {session && <NavUser />}

        {/* {showComposeButton && <ComposeButton />} */}
      </SidebarHeader>
      <SidebarContent className="p-2">
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavMain items={bottomNavItems} />
      </SidebarFooter>
    </Sidebar>
  );
}

function ComposeButton() {
  const [dialogOpen, setDialogOpen] = useQueryState('isComposeOpen');
  const [, setDraftId] = useQueryState('draftId');
  const [, setTo] = useQueryState('to');
  const [, setActiveReplyId] = useQueryState('activeReplyId');
  const [, setMode] = useQueryState('mode');

  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      setDialogOpen(null);
    } else {
      setDialogOpen('true');
    }
    setDraftId(null);
    setTo(null);
    setActiveReplyId(null);
    setMode(null);
  };
  return (
    <Dialog open={!!dialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="default">
          <PencilLine className="size-3 text-white" />
          New Email
        </Button>
      </DialogTrigger>

      <DialogContent className="h-screen w-screen max-w-none border-none bg-[#FAFAFA] p-0 shadow-none dark:bg-[#141414]">
        <DialogTitle className="sr-only">New Email</DialogTitle>
        <DialogDescription className="sr-only">New Email</DialogDescription>
        <EmailComposer
          onSendEmail={async (data) => {
            console.log(data);
          }}
          onClose={() => {
            setDialogOpen(null);
          }}
          className={undefined}
          autofocus={false}
          settingsLoading={false}
          editorClassName={undefined}
        />
      </DialogContent>
    </Dialog>
  );
}
