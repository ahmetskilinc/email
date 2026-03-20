import {
  Archive,
  ArrowLeft,
  Bell,
  Folder,
  Inbox,
  Send,
  Settings,
  Trash2,
  User,
  Users,
} from 'lucide-react';
export interface NavItem {
  id?: string;
  title: string;
  url: string;
  icon: React.ComponentType;
  badge?: number;
  isBackButton?: boolean;
  isSettingsButton?: boolean;
  disabled?: boolean;
  target?: string;
  shortcut?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavConfig {
  path: string;
  sections: NavSection[];
}

export const navigationConfig: Record<string, NavConfig> = {
  mail: {
    path: '/mail',
    sections: [
      {
        title: 'Core',
        items: [
          {
            id: 'inbox',
            title: 'Inbox',
            url: '/mail/inbox',
            icon: Inbox,
          },
          {
            id: 'drafts',
            title: 'Drafts',
            url: '/mail/draft',
            icon: Folder,
          },
          {
            id: 'sent',
            title: 'Sent',
            url: '/mail/sent',
            icon: Send,
          },
        ],
      },
      {
        title: 'Management',
        items: [
          {
            id: 'archive',
            title: 'Archive',
            url: '/mail/archive',
            icon: Archive,
          },
          {
            id: 'trash',
            title: 'Bin',
            url: '/mail/bin',
            icon: Trash2,
          },
        ],
      },
    ],
  },
  settings: {
    path: '/settings',
    sections: [
      {
        title: 'Settings',
        items: [
          {
            title: 'Back',
            url: '/mail',
            icon: ArrowLeft,
            isBackButton: true,
          },
          {
            title: 'General',
            url: '/settings/general',
            icon: User,
          },
          {
            title: 'Connections',
            url: '/settings/connections',
            icon: Users,
          },
          // {
          //   title: 'Notifications',
          //   url: '/settings/notifications',
          //   icon: Bell,
          // },
        ].map((item) => ({
          ...item,
          isSettingsPage: true,
        })),
      },
    ],
  },
};

export const bottomNavItems = [
  {
    title: '',
    items: [
      {
        id: 'settings',
        title: 'Settings',
        url: '/settings/general',
        icon: Settings,
        isSettingsButton: true,
      },
    ],
  },
];
