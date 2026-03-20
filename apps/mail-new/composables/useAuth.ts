import { createAuthClient } from 'better-auth/client';

type SessionPayload = {
  user?: {
    id: string;
    email?: string;
    name?: string;
    image?: string | null;
  };
  session?: {
    id: string;
    expiresAt?: string;
  };
} | null;

const getErrorMessage = (result: any, fallback: string) =>
  result?.error?.message || result?.message || fallback;

const getAuthClient = () => {
  const runtimeConfig = useRuntimeConfig();
  return createAuthClient({
    baseURL: runtimeConfig.public.backendUrl,
    fetchOptions: {
      credentials: 'include',
    },
  });
};

export const useAuth = () => {
  const authClient = getAuthClient();
  const session = useState<SessionPayload>('mail-new-auth-session', () => null);
  const isPending = useState<boolean>('mail-new-auth-pending', () => false);
  const isInitialized = useState<boolean>('mail-new-auth-init', () => false);

  const refreshSession = async () => {
    isPending.value = true;
    try {
      const result: any = await authClient.getSession();
      session.value = (result?.data ?? null) as SessionPayload;
      return session.value;
    } finally {
      isInitialized.value = true;
      isPending.value = false;
    }
  };

  const ensureSession = async () => {
    if (!isInitialized.value) {
      await refreshSession();
    }
    return session.value;
  };

  const signInEmail = async (email: string, password: string) => {
    const result: any = await authClient.signIn.email({ email, password });
    if (result?.error) {
      return { ok: false, error: getErrorMessage(result, 'Invalid email or password') };
    }
    await refreshSession();
    return { ok: true };
  };

  const signUpEmail = async (name: string, email: string, password: string) => {
    const result: any = await authClient.signUp.email({ name, email, password });
    if (result?.error) {
      return { ok: false, error: getErrorMessage(result, 'Failed to create account') };
    }
    await refreshSession();
    return { ok: true };
  };

  const signInSocial = async (provider: string, callbackURL: string) => {
    const result: any = await authClient.signIn.social({ provider, callbackURL });
    if (result?.error) {
      return { ok: false, error: getErrorMessage(result, 'Login redirect failed') };
    }
    const redirectTo = result?.data?.url || result?.url;
    if (redirectTo && import.meta.client) {
      window.location.href = redirectTo;
    }
    return { ok: true };
  };

  const linkSocial = async (provider: string, callbackURL: string) => {
    const result: any = await authClient.linkSocial({ provider, callbackURL });
    if (result?.error) {
      return { ok: false, error: getErrorMessage(result, 'Failed to connect provider') };
    }
    const redirectTo = result?.data?.url || result?.url;
    if (redirectTo && import.meta.client) {
      window.location.href = redirectTo;
    }
    return { ok: true };
  };

  const signOut = async () => {
    await authClient.signOut();
    session.value = null;
  };

  const updateUserName = async (name: string) => {
    const result: any = await authClient.updateUser({ name });
    if (result?.error) {
      return { ok: false, error: getErrorMessage(result, 'Failed to update name') };
    }
    await refreshSession();
    return { ok: true };
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    const result: any = await authClient.changePassword({
      currentPassword,
      newPassword,
      revokeOtherSessions: false,
    });
    if (result?.error) {
      return { ok: false, error: getErrorMessage(result, 'Failed to change password') };
    }
    return { ok: true };
  };

  return {
    session,
    isPending,
    isInitialized,
    ensureSession,
    refreshSession,
    signInEmail,
    signUpEmail,
    signInSocial,
    linkSocial,
    signOut,
    updateUserName,
    changePassword,
  };
};
