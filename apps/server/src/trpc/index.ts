import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from './router';

export type { AppRouter };
export type Inputs = inferRouterInputs<AppRouter>;
export type Outputs = inferRouterOutputs<AppRouter>;
