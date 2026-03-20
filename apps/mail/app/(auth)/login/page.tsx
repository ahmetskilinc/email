'use client';

import { Apple, Google, Microsoft } from '@/components/icons/icons';
import { signIn } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

interface ProviderInfo {
  id: string;
  name: string;
  enabled: boolean;
}

const providerIcons: Record<string, (cls: string) => ReactNode> = {
  google: (cls) => <Google className={cls} />,
  microsoft: (cls) => <Microsoft className={cls} />,
  apple: (cls) => <Apple className={cls} />,
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);

  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (!backendUrl) return;

    fetch(backendUrl + '/api/public/providers', { credentials: 'include' })
      .then((res) => res.json())
      .then((data: { allProviders: ProviderInfo[] }) => {
        setProviders(data.allProviders.filter((p) => p.enabled));
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn.email({ email, password });

      if (result.error) {
        toast.error(result.error.message ?? 'Invalid email or password');
        return;
      }

      router.push('/mail');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuth = (providerId: string) => {
    toast.promise(
      signIn.social({
        provider: providerId,
        callbackURL: `${window.location.origin}/mail`,
      }),
      { error: 'Login redirect failed' },
    );
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#111111] px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-white/60">Log in to your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-white/80">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-white/80">
              Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="border-white/10 bg-white/5 text-white placeholder:text-white/30"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Logging in...' : 'Log in'}
          </Button>
        </form>

        {providers.length > 0 && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-white/40">Or continue with</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="flex flex-col gap-2">
              {providers.map((provider) => {
                const renderIcon = providerIcons[provider.id];
                return (
                  <Button
                    key={provider.id}
                    variant="secondary"
                    className="w-full cursor-pointer"
                    onClick={() => handleOAuth(provider.id)}
                  >
                    {renderIcon?.('mr-2 h-5 w-5')}
                    Continue with {provider.name}
                  </Button>
                );
              })}
            </div>
          </>
        )}

        <p className="text-center text-sm text-white/40">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-white/70 underline hover:text-white">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
