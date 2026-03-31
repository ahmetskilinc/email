'use client';

import { authClient, useSession } from '@/lib/auth-client';
import { ICloudForm } from '@/components/connection/icloud-form';
import { YahooForm } from '@/components/connection/yahoo-form';
import { useConnections } from '@/hooks/use-connections';
import { emailProviders } from '@/lib/constants';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { data: connectionsData, refetch: refetchConnections } = useConnections();
  const [appPasswordProvider, setAppPasswordProvider] = useState<string | null>(null);

  const hasConnections = (connectionsData?.connections?.length ?? 0) > 0;

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  const handleProviderClick = async (providerId: string) => {
    if (providerId === 'icloud' || providerId === 'yahoo') {
      setAppPasswordProvider(providerId);
      return;
    }
    await authClient.linkSocial({
      provider: providerId,
      callbackURL: `${window.location.origin}/mail/inbox`,
    });
  };

  const handleAppPasswordSuccess = async () => {
    setAppPasswordProvider(null);
    await refetchConnections();
  };

  if (isPending) return null;

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#111111] px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white">Connect your email</h1>
          <p className="mt-2 text-sm text-white/60">
            {hasConnections
              ? 'Your account is connected. Add more or head to your inbox.'
              : 'Connect an email account to start using your inbox.'}
          </p>
        </div>

        {appPasswordProvider === 'icloud' ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <ICloudForm
              defaultEmail=""
              onSuccess={handleAppPasswordSuccess}
              onBack={() => setAppPasswordProvider(null)}
            />
          </div>
        ) : appPasswordProvider === 'yahoo' ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <YahooForm
              defaultEmail=""
              onSuccess={handleAppPasswordSuccess}
              onBack={() => setAppPasswordProvider(null)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
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
        )}

        {hasConnections && (
          <Button
            className="w-full"
            onClick={() => {
              window.location.href = '/mail/inbox';
            }}
          >
            Go to Inbox
            <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
