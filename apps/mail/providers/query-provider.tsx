'use client';

import {
  PersistQueryClientProvider,
  type PersistedClient,
  type Persister,
} from '@tanstack/react-query-persist-client';
import { QueryCache, QueryClient, hashKey, type InfiniteData } from '@tanstack/react-query';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { useMemo, type PropsWithChildren } from 'react';
import type { AppRouter } from '@zeitmail/server/trpc';
import { CACHE_BURST_KEY } from '@/lib/constants';
import { signOut } from '@/lib/auth-client';
import { get, set, del } from 'idb-keyval';
import superjson from 'superjson';

// Mutable ref — updated on connection switch without recreating the QueryClient.
// The queryKeyHashFn closes over this so key namespacing stays correct.
export const connectionIdRef = { current: null as string | null };

function createIDBPersister(idbValidKey: IDBValidKey = 'zeitmail-query-cache') {
  return {
    persistClient: async (client: PersistedClient) => {
      await set(idbValidKey, client);
    },
    restoreClient: async () => {
      return await get<PersistedClient>(idbValidKey);
    },
    removeClient: async () => {
      await del(idbValidKey);
    },
  } satisfies Persister;
}

const makeQueryClient = () =>
  new QueryClient({
    queryCache: new QueryCache({
      onError: (err, query) => {
        if (query.meta && query.meta.noGlobalError === true) return;
        if (query.meta && typeof query.meta.customError === 'string')
          console.error(query.meta.customError);
        else if (err.message === 'Invalid id value') return;
        else if (
          err.message === 'Required scopes missing' ||
          err.message.includes('Invalid connection')
        ) {
          signOut({
            fetchOptions: {
              onSuccess: () => {
                if (window.location.href.includes('/login')) return;
                window.location.href = '/login?error=required_scopes_missing';
              },
            },
          });
        } else
          console.error(`[query error] ${err.message || 'Something went wrong'}`, query.queryKey);
      },
    }),
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        queryKeyHashFn: (queryKey) =>
          hashKey([{ connectionId: connectionIdRef.current }, ...queryKey]),
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
      },
      mutations: {
        onError: (err) => console.error(err.message),
      },
    },
  });

let browserQueryClient: QueryClient | null = null;

const getQueryClient = () => {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
};

const getUrl = () => process.env.NEXT_PUBLIC_BACKEND_URL + '/api/trpc';

const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>();
export { useTRPC };

export const trpcClient = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      transformer: superjson,
      url: getUrl(),
      methodOverride: 'POST',
      maxItems: 1,
      fetch: (url, options) =>
        fetch(url, { ...options, credentials: 'include' }).then((res) => {
          const currentPath = new URL(window.location.href).pathname;
          const redirectPath = res.headers.get('X-zeitmail-Redirect');
          if (!!redirectPath && redirectPath !== currentPath) {
            window.location.href = redirectPath;
            res.headers.delete('X-zeitmail-Redirect');
          }
          return res;
        }),
    }),
  ],
});

type TrpcHook = ReturnType<typeof useTRPC>;
export function QueryProvider({ children }: PropsWithChildren) {
  const queryClient = useMemo(() => getQueryClient(), []);
  const persister = useMemo(() => createIDBPersister(), []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        buster: CACHE_BURST_KEY,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours
      }}
      onSuccess={() => {
        queryClient.invalidateQueries({ queryKey: [['connections', 'getDefault']] });
        const threadQueryKey = [['mail', 'listThreads'], { type: 'infinite' }];
        queryClient.setQueriesData(
          { queryKey: threadQueryKey },
          (data: InfiniteData<TrpcHook['mail']['listThreads']['~types']['output']>) => {
            if (!data) return data;
            return {
              pages: data.pages.slice(0, 3),
              pageParams: data.pageParams.slice(0, 3),
            };
          },
        );
        queryClient.invalidateQueries({ queryKey: threadQueryKey });
      }}
    >
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </PersistQueryClientProvider>
  );
}
