type ConnectionItem = {
  id: string;
  email: string;
  name: string;
  picture?: string | null;
  providerId: string;
};

type ConnectionsPayload = {
  connections: ConnectionItem[];
  disconnectedIds: string[];
} | null;

export const useConnections = () => {
  const trpc = useTrpc();
  const data = useState<ConnectionsPayload>('mail-new-connections', () => null);
  const isPending = useState<boolean>('mail-new-connections-pending', () => false);

  const refreshConnections = async () => {
    isPending.value = true;
    try {
      const result = await trpc.connections.list.query();
      data.value = result as ConnectionsPayload;
      return data.value;
    } finally {
      isPending.value = false;
    }
  };

  const getDefaultConnection = async () => {
    const result = await trpc.connections.getDefault.query();
    return result as ConnectionItem | null;
  };

  return {
    data,
    isPending,
    refreshConnections,
    getDefaultConnection,
  };
};
