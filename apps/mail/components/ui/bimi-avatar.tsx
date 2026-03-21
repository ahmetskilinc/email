'use client';

import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { useState, useCallback, useMemo } from 'react';
import { useTRPC } from '@/providers/query-provider';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const getFirstLetterCharacter = (name?: string) => {
  if (!name) return '';
  const match = name.match(/[a-zA-Z]/);
  return match ? match[0].toUpperCase() : '';
};

interface BimiAvatarProps {
  email?: string;
  name?: string;
  onImageError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export const BimiAvatar = ({ email, name, onImageError }: BimiAvatarProps) => {
  const trpc = useTRPC();
  const [useDefaultFallback, setUseDefaultFallback] = useState(false);

  const { data: bimiData } = useQuery({
    ...trpc.bimi.getByEmail.queryOptions({ email: email || '' }),
    enabled: !!email && !useDefaultFallback,
    staleTime: 1000 * 60 * 60 * 24, // Cache for 24 hours
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in cache for 7 days
  });

  const handleFallbackImageError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setUseDefaultFallback(true);
      if (onImageError) {
        onImageError(e);
      }
    },
    [onImageError],
  );

  const firstLetter = getFirstLetterCharacter(name || email);

  return (
    <Avatar className="size-8">
      <AvatarImage
        src={bimiData?.logo?.url}
        onError={handleFallbackImageError}
        className="size-8"
      />
      <AvatarFallback className="text-xs">{firstLetter}</AvatarFallback>
    </Avatar>
  );
};
