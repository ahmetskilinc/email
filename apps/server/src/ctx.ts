import type { zeitmailEnv } from './env';
import type { Auth } from './lib/auth';

export type SessionUser = NonNullable<Awaited<ReturnType<Auth['api']['getSession']>>>['user'];

export type HonoVariables = {
  auth: Auth;
  sessionUser?: SessionUser;
  traceId?: string;
  requestId?: string;
};

export type HonoContext = { Variables: HonoVariables; Bindings: zeitmailEnv };
