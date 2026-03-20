export default defineNuxtRouteMiddleware(async (to) => {
  const { ensureSession } = useAuth();
  const session = await ensureSession();
  if (!session?.user) {
    return navigateTo('/login');
  }

  if (to.path.startsWith('/mail')) {
    const { data, refreshConnections } = useConnections();
    const connections = data.value ?? (await refreshConnections());
    if (!connections?.connections?.length) {
      return navigateTo('/onboarding');
    }
  }
});
