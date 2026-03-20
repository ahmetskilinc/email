'use client';

import { useCategorySettings, useDefaultCategoryId } from '@/hooks/use-categories';
import { Bell, Mail, ScanEye, Tag, User, Zap } from 'lucide-react';
import { ThreadDisplay } from '@/components/mail/thread-display';
import { MailList } from '@/components/mail/mail-list';
import { useRouter, useParams } from 'next/navigation';
import { useMail } from '@/components/mail/use-mail';
import { clearBulkSelectionAtom } from './use-mail';
import { useSession } from '@/lib/auth-client';
import { useEffect, useRef } from 'react';

import { useQueryState } from 'nuqs';
import { cn } from '@/lib/utils';
import { useAtom } from 'jotai';

export function MailLayout() {
  const params = useParams<{ folder: string }>();
  const folder = params?.folder ?? 'inbox';
  const [mail, _setMail] = useMail();
  const [, clearBulkSelection] = useAtom(clearBulkSelectionAtom);
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const prevFolderRef = useRef(folder);

  useEffect(() => {
    if (prevFolderRef.current !== folder && mail.bulkSelected.length > 0) {
      clearBulkSelection();
    }
    prevFolderRef.current = folder;
  }, [folder, mail.bulkSelected.length, clearBulkSelection]);

  useEffect(() => {
    if (!session?.user && !isPending) {
      router.push('/login');
    }
  }, [session?.user, isPending, router]);

  return (
    <div className="z-5 relative flex h-full p-0">
      <div className="flex w-full flex-row">
        <div className="w-full max-w-[420px] border-r">
          <div className="h-full w-full">
            <div className="z-1 relative h-full overflow-hidden pt-0">
              <MailList />
            </div>
          </div>
        </div>

        <div className="w-full flex-1">
          <ThreadDisplay />
        </div>
      </div>
    </div>
  );
}

interface CategoryItem {
  id: string;
  name: string;
  icon?: React.ReactNode;
  colors?: string;
}

const categoryIconMap = {
  Bell,
  Mail,
  ScanEye,
  Tag,
  User,
  Zap,
} as const;

const Categories = () => {
  const defaultCategoryIdInner = useDefaultCategoryId();
  const categorySettings = useCategorySettings();
  const [activeCategory] = useQueryState('category', {
    defaultValue: defaultCategoryIdInner,
  });

  const categories = categorySettings.map((cat) => {
    const base = {
      id: cat.id,
      name: cat.name,
    } as const;

    const isSelected = activeCategory === cat.id;
    if (cat.icon && cat.icon in categoryIconMap) {
      const DynamicIcon = categoryIconMap[cat.icon as keyof typeof categoryIconMap];
      return {
        ...base,
        icon: (
          <DynamicIcon
            className={cn(
              'text-muted-foreground h-4 w-4 dark:text-white',
              isSelected && 'text-white',
            )}
          />
        ),
      };
    }

    switch (cat.id) {
      case 'Important':
        return {
          ...base,
          icon: (
            <Zap
              className={cn('text-muted-foreground dark:text-white', isSelected && 'text-white')}
            />
          ),
        };
      case 'All Mail':
        return {
          ...base,
          icon: (
            <Mail
              className={cn('text-muted-foreground dark:text-white', isSelected && 'text-white')}
            />
          ),
          colors:
            'border-0 bg-[#006FFE] text-white dark:bg-[#006FFE] dark:text-white dark:hover:bg-[#006FFE]/90',
        };
      case 'Personal':
        return {
          ...base,
          icon: (
            <User
              className={cn('text-muted-foreground dark:text-white', isSelected && 'text-white')}
            />
          ),
        };
      case 'Promotions':
        return {
          ...base,
          icon: (
            <Tag
              className={cn('text-muted-foreground dark:text-white', isSelected && 'text-white')}
            />
          ),
        };
      case 'Updates':
        return {
          ...base,
          icon: (
            <Bell
              className={cn('text-muted-foreground dark:text-white', isSelected && 'text-white')}
            />
          ),
        };
      case 'Unread':
        return {
          ...base,
          icon: (
            <ScanEye
              className={cn(
                'text-muted-foreground h-4 w-4 dark:text-white',
                isSelected && 'text-white',
              )}
            />
          ),
        };
      default:
        return base;
    }
  });

  return categories as CategoryItem[];
};
