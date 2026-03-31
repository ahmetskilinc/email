import { connectionsRouter } from './routes/connections';
import { categoriesRouter } from './routes/categories';
import { settingsRouter } from './routes/settings';
import { draftsRouter } from './routes/drafts';
import { labelsRouter } from './routes/label';
import { userRouter } from './routes/user';
import { mailRouter } from './routes/mail';
import { bimiRouter } from './routes/bimi';
import { router } from './trpc';

export const appRouter = router({
  mail: mailRouter,
  labels: labelsRouter,
  connections: connectionsRouter,
  settings: settingsRouter,
  user: userRouter,
  drafts: draftsRouter,
  bimi: bimiRouter,
  categories: categoriesRouter,
});

export type AppRouter = typeof appRouter;
