import { ConnectionSyncer } from '@/components/connection/connection-syncer';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ConnectionSyncer />
      <div className="relative flex max-h-screen w-full overflow-hidden">{children}</div>
    </>
  );
}
