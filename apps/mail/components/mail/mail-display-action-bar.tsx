'use client';

import { Forward, Reply, ReplyAll } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  onReply: () => void;
  onReplyAll: () => void;
  onForward: () => void;
};

export function MailDisplayActionBar({ onReply, onReplyAll, onForward }: Props) {
  return (
    <div className="my-2.5 flex gap-2 px-4">
      <Button type="button" onClick={onReply} variant="outline">
        <Reply />
        Reply
      </Button>
      <Button type="button" onClick={onReplyAll} variant="outline">
        <ReplyAll />
        Reply All
      </Button>
      <Button type="button" onClick={onForward} variant="outline">
        <Forward />
        Forward
      </Button>
    </div>
  );
}
