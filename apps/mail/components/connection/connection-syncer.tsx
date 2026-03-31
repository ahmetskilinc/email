'use client';

import { connectionIdRef } from '@/providers/query-provider';
import { useActiveConnection } from '@/hooks/use-connections';
import { activeConnectionIdAtom } from '@/store/connection';
import { useSetAtom } from 'jotai';
import { useEffect } from 'react';

export function ConnectionSyncer() {
  const { data: connection } = useActiveConnection();
  const setConnectionId = useSetAtom(activeConnectionIdAtom);

  useEffect(() => {
    if (!connection?.id) return;
    if (connection.id === connectionIdRef.current) return;
    connectionIdRef.current = connection.id;
    setConnectionId(connection.id);
  }, [connection?.id, setConnectionId]);

  return null;
}
