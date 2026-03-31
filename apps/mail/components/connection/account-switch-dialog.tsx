'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { connectionIdRef } from '@/providers/query-provider';
import { activeConnectionIdAtom } from '@/store/connection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTRPC } from '@/providers/query-provider';
import { Spinner } from '@/components/ui/spinner';
import { emailProviders } from '@/lib/constants';
import { useQueryState } from 'nuqs';
import { useSetAtom } from 'jotai';
import { cn } from '@/lib/utils';

export interface SwitchTarget {
  id: string;
  name: string | null;
  email: string;
  providerId: string;
  picture: string | null;
}

type LogEntry = {
  message: string;
  timestamp: number;
  status: 'pending' | 'done' | 'error';
};

export function AccountSwitchDialog({
  target,
  onComplete,
}: {
  target: SwitchTarget | null;
  onComplete: (success: boolean) => void;
}) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const switchingRef = useRef(false);

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [, setThreadId] = useQueryState('threadId');
  const setConnectionId = useSetAtom(activeConnectionIdAtom);
  const { mutateAsync: setDefaultConnection } = useMutation(
    trpc.connections.setDefault.mutationOptions(),
  );

  const addLog = useCallback((message: string, status: LogEntry['status'] = 'done') => {
    setLogs((prev) => [...prev, { message, timestamp: Date.now() - startTimeRef.current, status }]);
  }, []);

  const markLastDone = useCallback(() => {
    setLogs((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1]!, status: 'done' };
      return updated;
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const viewport = el.closest('[data-slot="scroll-area-viewport"]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [logs]);

  useEffect(() => {
    if (!target || switchingRef.current) return;
    switchingRef.current = true;

    const previousId = connectionIdRef.current;
    startTimeRef.current = Date.now();
    setLogs([]);
    setError(null);

    const run = async () => {
      addLog('Clearing active thread...', 'pending');
      await setThreadId(null);
      markLastDone();

      addLog('Setting default connection on server...', 'pending');
      await setDefaultConnection({ connectionId: target.id });
      markLastDone();

      addLog('Updating local connection state...', 'pending');
      connectionIdRef.current = target.id;
      setConnectionId(target.id);
      markLastDone();

      addLog('Invalidating connection cache...', 'pending');
      await queryClient.invalidateQueries({
        queryKey: [['connections', 'getDefault']],
      });
      markLastDone();

      addLog('Refreshing mailbox data...', 'pending');
      await queryClient.invalidateQueries({
        queryKey: [['mail', 'listThreads']],
      });
      markLastDone();

      addLog('Switch complete', 'done');
    };

    run()
      .then(() => {
        setTimeout(() => {
          onComplete(true);
          switchingRef.current = false;
        }, 600);
      })
      .catch((err) => {
        markLastDone();
        const msg = err instanceof Error ? err.message : 'Unknown error';
        addLog(`Error: ${msg}`, 'error');
        setError(msg);
        connectionIdRef.current = previousId;
        setConnectionId(previousId ?? null);
        switchingRef.current = false;
      });
  }, [target]);

  const Icon = emailProviders.find((p) => p.providerId === target?.providerId)?.icon;

  const isOpen = target !== null;
  const isDone = logs.length > 0 && logs[logs.length - 1]?.message === 'Switch complete';

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && (isDone || error)) {
          onComplete(!!isDone);
        }
      }}
    >
      <DialogContent showCloseButton={!!error}>
        <DialogHeader>
          <DialogTitle>Switching Account</DialogTitle>
          <DialogDescription>
            {error
              ? 'Something went wrong while switching accounts.'
              : 'Please wait while we switch your account...'}
          </DialogDescription>
        </DialogHeader>

        {target && (
          <div className="flex items-center gap-3 rounded border p-3">
            {target && target.picture ? (
              <Avatar className="size-9">
                <AvatarImage src={target.picture} alt={target.name || target.email} />
                <AvatarFallback className="text-[10px]">
                  {(target.name || target.email)
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="bg-sidebar-accent flex size-9 items-center justify-center rounded-full border">
                {Icon && <Icon className="size-4" />}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{target.name || target.email}</p>
              {target.name && (
                <p className="text-muted-foreground truncate text-xs">{target.email}</p>
              )}
            </div>
            {!isDone && !error && <Spinner className="text-muted-foreground size-4" />}
            {isDone && (
              <div className="flex size-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6L5 8.5L9.5 3.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            {error && (
              <div className="flex size-5 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M3.5 3.5L8.5 8.5M8.5 3.5L3.5 8.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            )}
          </div>
        )}

        <ScrollArea className="h-[140px] w-full rounded border">
          <div ref={scrollRef} className="p-3 font-mono text-[11px]">
            {logs.map((log, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-start gap-2 py-0.5',
                  log.status === 'error' && 'text-red-500',
                  log.status === 'done' && log.message === 'Switch complete' && 'text-emerald-500',
                )}
              >
                <span className="text-muted-foreground w-12 shrink-0 text-right tabular-nums">
                  {log.timestamp}ms
                </span>
                <span
                  className={cn(
                    'shrink-0',
                    log.status === 'pending' && 'text-yellow-500',
                    log.status === 'done' && 'text-emerald-500',
                    log.status === 'error' && 'text-red-500',
                  )}
                >
                  {log.status === 'pending' ? '○' : log.status === 'done' ? '●' : '✕'}
                </span>
                <span className="min-w-0 wrap-break-word">{log.message}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-muted-foreground flex h-[116px] items-center justify-center">
                Initializing...
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
