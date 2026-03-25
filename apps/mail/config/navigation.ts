import {
  Archive,
  ArrowLeft,
  Folder,
  Inbox,
  LucideProps,
  Send,
  Settings,
  Trash2,
  User,
  Users,
} from 'lucide-react';

export interface NavItem {
  id?: string;
  title: string;
  href: string;
  icon: React.ForwardRefExoticComponent<
    Omit<LucideProps, 'ref'> & React.RefAttributes<SVGSVGElement>
  >;
  badge?: number;
  isBackButton?: boolean;
  isSettingsButton?: boolean;
  disabled?: boolean;
  target?: string;
  shortcut?: string;
}

interface NavConfig {
  path: string;
  items: NavItem[];
}

export const navigationConfig: Record<string, NavConfig> = {
  mail: {
    path: '/mail',
    items: [
      {
        id: 'inbox',
        title: 'Inbox',
        href: '/mail/inbox',
        icon: Inbox,
      },
      {
        id: 'drafts',
        title: 'Drafts',
        href: '/mail/draft',
        icon: Folder,
      },
      {
        id: 'sent',
        title: 'Sent',
        href: '/mail/sent',
        icon: Send,
      },
      {
        id: 'archive',
        title: 'Archive',
        href: '/mail/archive',
        icon: Archive,
      },
      {
        id: 'trash',
        title: 'Bin',
        href: '/mail/bin',
        icon: Trash2,
      },
    ],
  },
  settings: {
    path: '/settings',
    items: [
      {
        title: 'Back',
        href: '/mail',
        icon: ArrowLeft,
        isBackButton: true,
      },
      {
        title: 'General',
        href: '/settings/general',
        icon: User,
      },
      {
        title: 'Connections',
        href: '/settings/connections',
        icon: Users,
      },
      // {
      //   title: 'Notifications',
      //   href: '/settings/notifications',
      //   icon: Bell,
      // },
    ].map((item) => ({
      ...item,
      isSettingsPage: true,
    })),
  },
};

export const bottomNavItems = [
  {
    id: 'settings',
    title: 'Settings',
    href: '/settings/general',
    icon: Settings,
    isSettingsButton: true,
  },
];
