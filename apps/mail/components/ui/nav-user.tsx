'use client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AccountSwitchDialog, type SwitchTarget } from '../connection/account-switch-dialog';
import { BadgeCheck, LogOut, MoonIcon, Plus, SunIcon, MoreHorizontal } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useActiveConnection, useConnections } from '@/hooks/use-connections';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut, useSession } from '@/lib/auth-client';
import { AddConnectionDialog } from '../connection/add';
import { useEffect, useMemo, useState } from 'react';
import { emailProviders } from '@/lib/constants';
import { useTheme } from 'next-themes';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function NavUser() {
  const { data: session } = useSession();
  const { data } = useConnections();
  const [isRendered, setIsRendered] = useState(false);
  const [switchTarget, setSwitchTarget] = useState<SwitchTarget | null>(null);
  const { theme, setTheme } = useTheme();

  const { data: activeConnection } = useActiveConnection();

  useEffect(() => setIsRendered(true), []);

  const getProviderIcon = (providerId: string) => {
    const provider = emailProviders.find((p) => p.providerId === providerId);
    return provider?.icon;
  };

  const handleAccountSwitch =
    (connection: { id: string; name: string | null; email: string; picture: string | null }) =>
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
        // await handleClearCache();
        window.location.href = '/login';
      },
    });
  };

  const otherConnections = useMemo(() => {
    if (!data || !activeConnection) return [];
    return data.connections.filter((connection) => connection.id !== activeConnection?.id);
  }, [data, activeConnection]);

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  if (!isRendered) return null;
  if (!session) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            {data && activeConnection ? (
              <div
                key={activeConnection.id}
                onClick={handleAccountSwitch(activeConnection)}
                className={`flex cursor-pointer items-center ${
                  data.connections.length > 1 ? 'outline-mainBlue rounded-none outline-2' : ''
                }`}
              >
                <div className="relative">
                  {activeConnection.picture ? (
                    <Avatar className="size-6 rounded-none after:rounded-none">
                      <AvatarImage
                        className="rounded-none"
                        src={activeConnection.picture}
                        alt={activeConnection.name || activeConnection.email}
                      />
                      <AvatarFallback className="rounded-none text-[10px]">
                        {(activeConnection.name || activeConnection.email)
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    (() => {
                      const Icon = getProviderIcon(activeConnection.providerId);
                      return (
                        <div className="bg-muted flex size-6 items-center justify-center">
                          {Icon ? (
                            <Icon className="size-4" />
                          ) : (
                            <span className="text-[10px]">
                              {(activeConnection.name || activeConnection.email)
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </span>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            ) : (
              <div className="flex cursor-pointer items-center">
                <div className="relative">
                  <div className="bg-muted size-6 animate-pulse" />
                </div>
              </div>
            )}
            {otherConnections.slice(0, 2).map((connection) => {
              const Icon = getProviderIcon(connection.providerId);
              return (
                <Tooltip key={connection.id}>
                  <TooltipTrigger asChild>
                    <div
                      onClick={handleAccountSwitch(connection)}
                      className="flex cursor-pointer items-center"
                    >
                      <div className="relative">
                        {connection.picture ? (
                          <Avatar className="size-6 rounded-none after:rounded-none">
                            <AvatarImage
                              className="rounded-none"
                              src={connection.picture}
                              alt={connection.name || connection.email}
                            />
                            <AvatarFallback className="rounded-none text-[10px]">
                              {(connection.name || connection.email)
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="bg-muted flex size-6 items-center justify-center">
                            {Icon ? (
                              <Icon className="size-4" />
                            ) : (
                              <span className="text-[10px]">
                                {(connection.name || connection.email)
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>{connection.email}</TooltipContent>
                </Tooltip>
              );
            })}

            {otherConnections.length > 2 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="icon" className="m-0 size-6 border-none">
                    <span className="text-[10px]">+{otherConnections.length - 2}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="ml-3 min-w-56 bg-white font-medium dark:bg-[#131313]"
                  align="end"
                  side={'bottom'}
                  sideOffset={8}
                >
                  {data &&
                    data.connections &&
                    data.connections.map((connection) => {
                      const Icon = getProviderIcon(connection.providerId);
                      return (
                        <DropdownMenuItem
                          key={connection.id}
                          onClick={handleAccountSwitch(connection)}
                          className="flex cursor-pointer items-center gap-3 py-1"
                        >
                          {connection.picture ? (
                            <Avatar className="size-7 rounded-none after:rounded-none">
                              <AvatarImage
                                className="rounded-none"
                                src={connection.picture}
                                alt={connection.name || connection.email}
                              />
                              <AvatarFallback className="rounded-none text-[10px]">
                                {(connection.name || connection.email)
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="bg-muted flex size-7 items-center justify-center">
                              {Icon ? (
                                <Icon className="size-4" />
                              ) : (
                                <span className="text-[10px]">
                                  {(connection.name || connection.email)
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)}
                                </span>
                              )}
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
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <AddConnectionDialog>
              <Button variant="secondary" size="icon" className="m-0 size-6 border-none">
                <Plus className="size-4" />
              </Button>
            </AddConnectionDialog>
          </div>

          <div className="flex items-center justify-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="m-0 size-6 border-none">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="ml-3 min-w-56 bg-white font-medium dark:bg-[#131313]"
                align="end"
                side={'bottom'}
                sideOffset={8}
              >
                <DropdownMenuItem onClick={handleThemeToggle} className="cursor-pointer">
                  <div className="flex w-full items-center gap-2">
                    {theme === 'dark' ? (
                      <MoonIcon className="size-4 opacity-60" />
                    ) : (
                      <SunIcon className="size-4 opacity-60" />
                    )}
                    <p className="text-[13px] opacity-60">Toggle Theme</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                  <div className="flex items-center gap-2">
                    <LogOut size={16} className="opacity-60" />
                    <p className="text-[13px] opacity-60">Logout</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="mt-[2px] flex flex-col items-start gap-1 space-y-1">
          <div className="flex items-center gap-1 text-[13px] leading-none text-black dark:text-white">
            <p className={cn('max-w-[14.5ch] truncate text-[13px]')}>
              {activeConnection?.name || session.user.name || 'User'}
            </p>
            <BadgeCheck className="h-4 w-4 text-white dark:text-[#141414]" fill="#1D9BF0" />
          </div>
          <div className="h-5 max-w-[200px] overflow-hidden truncate text-xs font-normal leading-none text-[#898989]">
            {activeConnection?.email || session.user.email}
          </div>
        </div>
      </div>

      <AccountSwitchDialog target={switchTarget} onComplete={() => setSwitchTarget(null)} />
    </div>
  );
}
