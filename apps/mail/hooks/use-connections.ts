'use client'
import { useTRPC } from '@/providers/query-provider';
import { useQuery } from '@tanstack/react-query';

export const useConnections = () => {
  const trpc = useTRPC();
  const connectionsQuery = useQuery(trpc.connections.list.queryOptions());
  return connectionsQuery;
};

export const useActiveConnection = () => {
  const trpc = useTRPC();
  const connectionsQuery = useQuery(
    trpc.connections.getDefault.queryOptions(void 0, {
      staleTime: 1000 * 30, // 30 seconds
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
    }),
  );
  return connectionsQuery;
};
