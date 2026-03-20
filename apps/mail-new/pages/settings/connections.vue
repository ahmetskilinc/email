<script setup lang="ts">
import { emailProviders } from '~/utils/constants';

definePageMeta({
  middleware: ['auth'],
});

const trpc = useTrpc();
const { linkSocial } = useAuth();
const { data, isPending, refreshConnections } = useConnections();

const selectedProvider = ref<string | null>(null);
const accountEmail = ref('');
const appPassword = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const isSubmitting = ref(false);

await refreshConnections();

const connectProvider = async (providerId: string) => {
  errorMessage.value = '';
  successMessage.value = '';

  if (providerId === 'icloud' || providerId === 'yahoo') {
    selectedProvider.value = providerId;
    accountEmail.value = '';
    appPassword.value = '';
    return;
  }

  const callbackURL = `${window.location.origin}/settings/connections`;
  const result = await linkSocial(providerId, callbackURL);
  if (!result.ok) {
    errorMessage.value = result.error;
  }
};

const connectAppPasswordProvider = async () => {
  if (!selectedProvider.value) {
    return;
  }
  errorMessage.value = '';
  successMessage.value = '';
  isSubmitting.value = true;
  try {
    if (selectedProvider.value === 'icloud') {
      await trpc.connections.createIcloud.mutate({
        email: accountEmail.value,
        password: appPassword.value,
      });
    } else {
      await trpc.connections.createYahoo.mutate({
        email: accountEmail.value,
        password: appPassword.value,
      });
    }
    selectedProvider.value = null;
    successMessage.value = 'Account connected';
    await refreshConnections();
  } catch (error: any) {
    errorMessage.value = error?.message || 'Failed to connect account';
  } finally {
    isSubmitting.value = false;
  }
};

const disconnectAccount = async (connectionId: string) => {
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await trpc.connections.delete.mutate({ connectionId });
    await refreshConnections();
    successMessage.value = 'Account disconnected';
  } catch (error: any) {
    errorMessage.value = error?.message || 'Failed to disconnect account';
  }
};
</script>

<template>
  <AppShell section="settings">
    <div class="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 class="text-xl font-semibold text-white">Connections</h1>
        <p class="text-sm text-zinc-400">Manage your connected email accounts.</p>
      </div>

      <section v-if="selectedProvider" class="panel space-y-3 p-4">
        <h2 class="text-sm font-semibold text-white">
          Connect {{ selectedProvider === 'icloud' ? 'iCloud' : 'Yahoo' }} with app password
        </h2>
        <input v-model="accountEmail" type="email" placeholder="you@example.com" />
        <input v-model="appPassword" type="password" placeholder="App password" />
        <div class="flex gap-2">
          <button type="button" :disabled="isSubmitting" @click="connectAppPasswordProvider">
            {{ isSubmitting ? 'Connecting...' : 'Connect' }}
          </button>
          <button class="btn-secondary" type="button" @click="selectedProvider = null">Cancel</button>
        </div>
      </section>

      <section class="panel space-y-3 p-4">
        <h2 class="text-sm font-semibold text-white">Add account</h2>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="provider in emailProviders"
            :key="provider.providerId"
            class="btn-secondary"
            type="button"
            @click="connectProvider(provider.providerId)"
          >
            {{ provider.name }}
          </button>
        </div>
      </section>

      <section class="panel p-4">
        <h2 class="mb-3 text-sm font-semibold text-white">Connected accounts</h2>
        <div v-if="isPending" class="text-sm text-zinc-500">Loading accounts...</div>
        <div v-else-if="!data?.connections?.length" class="text-sm text-zinc-500">
          No accounts connected.
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="connection in data.connections"
            :key="connection.id"
            class="flex items-center justify-between rounded-md border border-zinc-800 p-3"
          >
            <div>
              <p class="text-sm text-zinc-200">{{ connection.name }}</p>
              <p class="text-xs text-zinc-500">{{ connection.email }}</p>
              <p
                v-if="data.disconnectedIds?.includes(connection.id)"
                class="mt-1 text-xs text-amber-400"
              >
                Disconnected
              </p>
            </div>
            <div class="flex gap-2">
              <button
                v-if="data.disconnectedIds?.includes(connection.id)"
                class="btn-secondary"
                type="button"
                @click="
                  connectProvider(connection.providerId)
                "
              >
                Reconnect
              </button>
              <button
                class="btn-secondary"
                type="button"
                :disabled="(data.connections?.length || 0) <= 1"
                @click="disconnectAccount(connection.id)"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </section>

      <p v-if="successMessage" class="text-sm text-emerald-400">{{ successMessage }}</p>
      <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>
    </div>
  </AppShell>
</template>
