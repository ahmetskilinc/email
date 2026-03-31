'use client';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useTRPC } from '@/providers/query-provider';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { ICloudColor } from '../icons/icons';

interface ICloudFormProps {
  defaultEmail?: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function ICloudForm({ defaultEmail = '', onSuccess, onBack }: ICloudFormProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync: createIcloud, isPending } = useMutation(
    trpc.connections.createIcloud.mutationOptions(),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createIcloud({ email, password });
      toast.success('iCloud Mail connected successfully');
      await queryClient.invalidateQueries({ queryKey: [['connections', 'getDefault']] });
      await queryClient.invalidateQueries({ queryKey: [['connections', 'list']] });
      onSuccess();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Failed to connect iCloud Mail';
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
          <ICloudColor className="h-5 w-5" />
          <h3 className="text-sm font-medium">Connect iCloud Mail</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          Enter your iCloud email and app-specific password to connect iCloud Mail.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="icloud-email">
            iCloud Email
          </label>
          <Input
            id="icloud-email"
            type="email"
            placeholder="you@icloud.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <p className="text-muted-foreground text-xs">
            Supported: @icloud.com, @me.com, @mac.com
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="icloud-password">
            App-Specific Password
          </label>
          <Input
            id="icloud-password"
            type="password"
            placeholder="xxxx-xxxx-xxxx-xxxx"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <p className="text-muted-foreground text-xs">
            Don&apos;t use your Apple ID password.{' '}
            <a
              href="https://appleid.apple.com/account/manage"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary inline-flex items-center gap-0.5 underline"
            >
              Generate one at appleid.apple.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isPending || !email || !password}>
          {isPending ? 'Connecting…' : 'Connect iCloud Mail'}
        </Button>
      </form>
    </>
  );
}
