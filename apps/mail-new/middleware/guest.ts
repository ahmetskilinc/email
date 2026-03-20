export default defineNuxtRouteMiddleware(async () => {
  const { ensureSession } = useAuth();
  const session = await ensureSession();
  if (session?.user) {
    return navigateTo('/mail/inbox');
  }
});
