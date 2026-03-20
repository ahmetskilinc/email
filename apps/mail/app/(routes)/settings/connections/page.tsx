'use client';

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddConnectionDialog } from '@/components/connection/add';
import { useSession, authClient } from '@/lib/auth-client';
import { useConnections } from '@/hooks/use-connections';
import { useTRPC } from '@/providers/query-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation } from '@tanstack/react-query';
import { Trash, Plus, Unplug } from 'lucide-react';
import { useThreads } from '@/hooks/use-threads';
import { emailProviders } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

function ConnectionSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-3 w-44 rounded" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
}

export default function ConnectionsPage() {
  const { data, isPending, refetch: refetchConnections } = useConnections();
  const { refetch } = useSession();

  const trpc = useTRPC();
  const { mutateAsync: deleteConnection } = useMutation(trpc.connections.delete.mutationOptions());
  const [{ refetch: refetchThreads }] = useThreads();

  const disconnectAccount = async (connectionId: string) => {
    await deleteConnection(
      { connectionId },
      {
        onError: (error) => {
          console.error('Error disconnecting account:', error);
          toast.error('Failed to disconnect account');
        },
      },
    );
    toast.success('Account disconnected successfully');
    void refetchConnections();
    refetch();
    void refetchThreads();
  };

  const connections = data?.connections ?? [];
  const disconnectedIds = data?.disconnectedIds ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Email Accounts</h2>
          <p className="text-muted-foreground text-sm">
            Manage your connected email accounts. Add or remove accounts to access your mail.
          </p>
        </div>
      </div>

      {isPending ? (
        <div className="space-y-3">
          <ConnectionSkeleton />
          <ConnectionSkeleton />
        </div>
      ) : connections.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12">
          <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
            <Plus className="text-muted-foreground h-6 w-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No accounts connected</p>
            <p className="text-muted-foreground text-sm">
              Connect an email account to get started.
            </p>
          </div>
          <AddConnectionDialog>
            <Button variant="outline" size="sm" className="mt-1">
              <Plus className="size-4" />
              Add Account
            </Button>
          </AddConnectionDialog>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {connections.map((connection) => {
              const provider = emailProviders.find((p) => p.providerId === connection.providerId);
              const Icon = provider?.icon;
              const isDisconnected = disconnectedIds.includes(connection.id);
              const isOnly = connections.length === 1;

              return (
                <div
                  key={connection.id}
                  className="hover:bg-black/2 dark:hover:bg-white/2 flex items-center gap-4 rounded-xl border p-4 transition-colors"
                >
                  {connection.picture ? (
                    <img
                      src={connection.picture}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                      width={40}
                      height={40}
                    />
                  ) : (
                    <div className="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                      {Icon && <Icon className="size-5" />}
                    </div>
                  )}

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{connection.name}</span>
                      {provider && (
                        <span className="text-muted-foreground text-xs">{provider.name}</span>
                      )}
                      {isDisconnected && <Badge variant="destructive">Disconnected</Badge>}
                    </div>
                    <span className="text-muted-foreground max-w-[280px] cursor-default truncate text-xs">
                      {connection.email}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    {isDisconnected && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          await authClient.linkSocial({
                            provider: connection.providerId,
                            callbackURL: `${window.location.origin}/settings/connections`,
                          });
                        }}
                      >
                        <Unplug className="size-4" />
                        Reconnect
                      </Button>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          disabled={isOnly}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Disconnect Email Account</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to disconnect{' '}
                            <span className="text-foreground font-medium">{connection.email}</span>?
                            You can reconnect it later.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-end gap-3">
                          <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DialogClose>
                          <DialogClose asChild>
                            <Button
                              variant="destructive"
                              onClick={() => disconnectAccount(connection.id)}
                            >
                              Disconnect
                            </Button>
                          </DialogClose>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              );
            })}
          </div>
          <AddConnectionDialog>
            <Button variant="outline" size="sm">
              <Plus className="size-4" />
              Add Account
            </Button>
          </AddConnectionDialog>
        </>
      )}
    </div>
  );
}
