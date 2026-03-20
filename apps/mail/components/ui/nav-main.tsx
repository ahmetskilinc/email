'use client';

import { SidebarGroup, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from './sidebar';
import { Collapsible, CollapsibleTrigger } from '@/components/ui/collapsible';
import { type NavItem } from '@/config/navigation';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';
import { useStats } from '@/hooks/use-stats';
import { useCallback, useRef } from 'react';
import { BASE_URL } from '@/lib/constants';
import * as React from 'react';
import Link from 'next/link';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  ref?: React.Ref<SVGSVGElement>;
  startAnimation?: () => void;
  stopAnimation?: () => void;
}
interface NavItemProps extends NavItem {
  isActive?: boolean;
  isExpanded?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  suffix?: React.ComponentType<IconProps>;
  isSettingsPage?: boolean;
}

interface NavMainProps {
  items: {
    title: string;
    items: NavItemProps[];
    isActive?: boolean;
  }[];
}

type IconRefType = SVGSVGElement & {
  startAnimation?: () => void;
  stopAnimation?: () => void;
};

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();

  const isValidInternalUrl = useCallback((url: string) => {
    if (!url) return false;
    if (url.startsWith('/')) return true;
    try {
      const urlObj = new URL(url, BASE_URL);
      return urlObj.origin === BASE_URL;
    } catch {
      return false;
    }
  }, []);

  const getHref = useCallback(
    (item: NavItemProps) => {
      if (item.isSettingsButton) {
        const currentPath = pathname;
        return `${item.url}?from=${encodeURIComponent(currentPath)}`;
      }

      if (item.isBackButton) {
        return '/mail';
      }

      return item.url;
    },
    [pathname, isValidInternalUrl],
  );

  return (
    <SidebarGroup className="space-y-2.5 py-0 md:px-0">
      <SidebarMenu>
        {items.map((section) => (
          <Collapsible
            key={section.title}
            defaultOpen={section.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem className="space-y-1">
              {section.items.map((item) => (
                <NavItem
                  {...item}
                  key={item.url}
                  href={getHref(item)}
                  target={item.target}
                  title={item.title}
                />
              ))}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavItem(item: NavItemProps & { href: string }) {
  const iconRef = useRef<IconRefType>(null);
  const { data: stats } = useStats();

  if (item.disabled) {
    return (
      <SidebarMenuButton
        tooltip={item.title}
        className="flex cursor-not-allowed items-center opacity-50"
      >
        {item.icon && <item.icon ref={iconRef} className="relative mr-2.5 h-3 w-3.5" />}
        <p className="relative bottom-px mt-0.5 truncate text-[13px]">{item.title}</p>
      </SidebarMenuButton>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    if (item.onClick) {
      item.onClick(e as React.MouseEvent<HTMLAnchorElement>);
    }
  };

  return (
    <Collapsible defaultOpen={item.isActive}>
      <CollapsibleTrigger asChild>
        <SidebarMenuButton asChild onClick={handleClick} isActive={item.isActive}>
          <Link target={item.target} href={item.href}>
            {item.icon && <item.icon ref={iconRef} className="mr-2 shrink-0" />}
            <p className="relative bottom-px mt-0.5 min-w-0 flex-1 truncate text-[13px]">
              {item.title}
            </p>
            {stats &&
              stats.some((stat) => stat.label?.toLowerCase() === item.id?.toLowerCase()) && (
                <Badge className="text-muted-foreground ml-auto shrink-0 rounded-full border-none bg-transparent">
                  {stats
                    .find((stat) => stat.label?.toLowerCase() === item.id?.toLowerCase())
                    ?.count?.toLocaleString() || '0'}
                </Badge>
              )}
          </Link>
        </SidebarMenuButton>
      </CollapsibleTrigger>
    </Collapsible>
  );
}
