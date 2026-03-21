'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { AccountSwitchDialog, type SwitchTarget } from '../connection/account-switch-dialog';
import { MoreVertical, LogOut, UserCircle, PlusCircle, UserPlus } from 'lucide-react';
import { useActiveConnection, useConnections } from '@/hooks/use-connections';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { emailProviders } from '@/lib/constants';
import { useSession } from '@/lib/auth-client';
import { signOut } from '@/lib/auth-client';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

export function NavUser() {
  const [switchTarget, setSwitchTarget] = useState<SwitchTarget | null>(null);
  const { isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { data: sesionData } = useSession();
  const { data: activeConnection } = useActiveConnection();
  const { data: connectionsData } = useConnections();
  const user = sesionData?.user;
  const connections = connectionsData?.connections;

  const handleAccountSwitch =
    (connection: {
      id: string;
      name: string | null;
      email: string;
      picture: string | null;
      providerId: string;
    }) =>
    () => {
      if (connection.id === activeConnection?.id) return;
      setSwitchTarget(connection);
    };

  const handleLogout = async () => {
    toast.promise(signOut(), {
      loading: 'Signing out...',
      success: () => 'Signed out successfully!',
      error: 'Error signing out',
      async finally() {
        window.location.href = '/login';
      },
    });
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const otherConnections = connections?.filter((c) => c.id !== activeConnection?.id);

  const ActiveConnectionIcon = emailProviders.find(
    (p) => p.providerId === activeConnection?.providerId,
  )?.icon;

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  {activeConnection && activeConnection.picture ? (
                    <Avatar className="size-8">
                      <AvatarImage
                        src={activeConnection.picture}
                        alt={activeConnection.name || activeConnection.email}
                      />
                      <AvatarFallback className="text-[10px]">
                        {(activeConnection.name || activeConnection.email)
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="bg-sidebar-accent flex size-8 items-center justify-center rounded-full border">
                      {ActiveConnectionIcon && <ActiveConnectionIcon className="size-4" />}
                    </div>
                  )}
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{activeConnection?.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {activeConnection?.email}
                    </span>
                  </div>
                  <MoreVertical className="ml-auto size-4" />
                </SidebarMenuButton>
              }
            />
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? 'bottom' : 'right'}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <div className="flex items-center gap-2 text-left text-sm">
                    {activeConnection && activeConnection.picture ? (
                      <Avatar className="size-8">
                        <AvatarImage
                          src={activeConnection.picture}
                          alt={activeConnection.name || activeConnection.email}
                        />
                        <AvatarFallback className="text-[10px]">
                          {(activeConnection.name || activeConnection.email)
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="bg-sidebar-accent flex size-8 items-center justify-center rounded-full border">
                        {ActiveConnectionIcon && <ActiveConnectionIcon className="size-4" />}
                      </div>
                    )}
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="flex items-center gap-px truncate font-medium">
                        <span className="mr-1 inline-block size-1.5 animate-pulse rounded-full bg-green-500 duration-2000" />
                        {activeConnection?.name}
                      </span>
                      <span className="text-muted-foreground truncate text-xs">
                        {activeConnection?.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuGroup>
                {otherConnections &&
                  otherConnections.map((connection) => {
                    const Icon = emailProviders.find(
                      (p) => p.providerId === connection.providerId,
                    )?.icon;
                    return (
                      <DropdownMenuItem
                        key={connection.id}
                        onClick={handleAccountSwitch(connection)}
                      >
                        {connection.picture ? (
                          <Avatar className="size-7">
                            <AvatarImage
                              src={connection.picture}
                              alt={connection.name || connection.email}
                            />
                            <AvatarFallback className="text-[10px]">
                              {(connection.name || connection.email)
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="bg-sidebar-accent flex size-8 items-center justify-center rounded-full border">
                            {Icon && <Icon className="size-4" />}
                          </div>
                        )}
                        <div className="-space-y-0.5">
                          <p className="text-[12px]">{connection.name || connection.email}</p>
                          {connection.name && (
                            <p className="text-muted-foreground text-[11px]">
                              {connection.email.length > 25
                                ? `${connection.email.slice(0, 25)}...`
                                : connection.email}
                            </p>
                          )}
                        </div>
                      </DropdownMenuItem>
                    );
                  })}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  render={
                    <Link href="/onboarding">
                      <PlusCircle />
                      Add Connection
                    </Link>
                  }
                />
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  render={
                    <Link href="/settings/general">
                      <UserCircle />
                      Account
                    </Link>
                  }
                />
                <DropdownMenuItem
                  render={
                    <Link href="/settings/connections">
                      <UserPlus />
                      Connections
                    </Link>
                  }
                />
                {/* <DropdownMenuItem>
                  <CreditCard />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bell />
                  Notifications
                </DropdownMenuItem> */}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <AccountSwitchDialog target={switchTarget} onComplete={() => setSwitchTarget(null)} />
    </>
  );
}
