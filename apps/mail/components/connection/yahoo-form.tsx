'use client';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useTRPC } from '@/providers/query-provider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { YahooColor } from '../icons/icons';

interface YahooFormProps {
  defaultEmail?: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function YahooForm({ defaultEmail = '', onSuccess, onBack }: YahooFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync: createYahoo, isPending } = useMutation(
    trpc.connections.createYahoo.mutationOptions(),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createYahoo({ email, password });
      toast.success('Yahoo Mail connected successfully');
      await queryClient.invalidateQueries({ queryKey: [['connections', 'getDefault']] });
      await queryClient.invalidateQueries({ queryKey: [['connections', 'list']] });
      onSuccess();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to connect Yahoo Mail';
      toast.error(message);
    }
  };

  return (
    <>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground mr-1"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <YahooColor className="h-5 w-5" />
          <h3 className="text-sm font-medium">Connect Yahoo Mail</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          Enter your Yahoo email and app password to connect Yahoo Mail.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="yahoo-email">
            Yahoo Email
          </label>
          <Input
            id="yahoo-email"
            type="email"
            placeholder="you@yahoo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <p className="text-muted-foreground text-xs">
            Supported: @yahoo.com, @ymail.com, @rocketmail.com, and regional Yahoo domains
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="yahoo-password">
            App Password
          </label>
          <Input
            id="yahoo-password"
            type="password"
            placeholder="xxxx xxxx xxxx xxxx"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <p className="text-muted-foreground text-xs">
            Don&apos;t use your Yahoo account password.{' '}
            <a
              href="https://login.yahoo.com/account/security#other-apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-0.5 underline"
            >
              Generate an app password at Yahoo Account Security
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isPending || !email || !password}>
          {isPending ? 'Connecting…' : 'Connect Yahoo Mail'}
        </Button>
      </form>
    </>
  );
}
