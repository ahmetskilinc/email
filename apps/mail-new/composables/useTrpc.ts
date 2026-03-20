import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';

type TrpcClient = ReturnType<typeof createTRPCProxyClient<any>>;

export const useTrpc = (): any => {
  const runtimeConfig = useRuntimeConfig();
  const trpcClient = useState<TrpcClient | null>('mail-new-trpc-client', () => null);

  if (!trpcClient.value) {
    trpcClient.value = createTRPCProxyClient<any>({
      links: [
        httpBatchLink({
          url: `${runtimeConfig.public.backendUrl}/api/trpc`,
          transformer: superjson,
          fetch: async (url, options) => {
            const response = await fetch(url, {
              ...options,
              credentials: 'include',
            });
            const redirectPath = response.headers.get('X-zeitmail-Redirect');
            if (redirectPath && import.meta.client) {
              const currentPath = window.location.pathname;
              if (redirectPath !== currentPath) {
                window.location.href = redirectPath;
              }
            }
            return response;
          },
        }),
      ],
    });
  }

  return trpcClient.value as any;
};
