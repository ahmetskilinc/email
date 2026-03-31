import { createAuthClient } from 'better-auth/react';
import type { Auth } from '@zeitmail/server/auth';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8787',
  fetchOptions: {
    credentials: 'include',
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
