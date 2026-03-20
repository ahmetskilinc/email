'use client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { authClient, useSession } from '@/lib/auth-client';
import { emailProviders } from '@/lib/constants';
import { ICloudForm } from './icloud-form';
import { YahooForm } from './yahoo-form';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { useState } from 'react';

export const AddConnectionDialog = ({
  children,
  onOpenChange,
}: {
  children?: React.ReactNode;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}) => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [appPasswordProvider, setAppPasswordProvider] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setAppPasswordProvider(null);
    onOpenChange?.(next);
  };

  const handleProviderClick = async (providerId: string) => {
    if (providerId === 'icloud' || providerId === 'yahoo') {
      setAppPasswordProvider(providerId);
      return;
    }
    await authClient.linkSocial({
      provider: providerId,
      callbackURL: `${window.location.origin}${pathname}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        {appPasswordProvider === 'icloud' ? (
          <ICloudForm
            defaultEmail={session?.user?.email ?? ''}
            onSuccess={() => {
              setOpen(false);
              setAppPasswordProvider(null);
            }}
            onBack={() => setAppPasswordProvider(null)}
          />
        ) : appPasswordProvider === 'yahoo' ? (
          <YahooForm
            defaultEmail={session?.user?.email ?? ''}
            onSuccess={() => {
              setOpen(false);
              setAppPasswordProvider(null);
            }}
            onBack={() => setAppPasswordProvider(null)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Connect Email</DialogTitle>
              <DialogDescription>Select an email provider to connect</DialogDescription>
            </DialogHeader>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {emailProviders.map((provider) => {
                const Icon = provider.icon;
                return (
                  <Button
                    key={provider.providerId}
                    variant="secondary"
                    className="h-24 w-full flex-col items-center justify-center gap-2"
                    onClick={() => handleProviderClick(provider.providerId)}
                  >
                    <Icon className="size-6!" />
                    <span className="text-xs">{provider.name}</span>
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
