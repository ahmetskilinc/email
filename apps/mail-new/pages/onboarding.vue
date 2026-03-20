<script setup lang="ts">
import { emailProviders } from '~/utils/constants';

definePageMeta({
  middleware: ['auth'],
});

const { linkSocial } = useAuth();
const trpc = useTrpc();
const { data, refreshConnections } = useConnections();

const selectedProvider = ref<string | null>(null);
const accountEmail = ref('');
const appPassword = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

await refreshConnections();

const hasConnections = computed(() => (data.value?.connections?.length ?? 0) > 0);

const pickProvider = async (providerId: string) => {
  errorMessage.value = '';
  if (providerId === 'icloud' || providerId === 'yahoo') {
    selectedProvider.value = providerId;
    accountEmail.value = '';
    appPassword.value = '';
    return;
  }

  const callbackURL = `${window.location.origin}/mail/inbox`;
  const result = await linkSocial(providerId, callbackURL);
  if (!result.ok) {
    errorMessage.value = result.error;
  }
};

const saveAppPasswordConnection = async () => {
  if (!selectedProvider.value) {
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';
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
    accountEmail.value = '';
    appPassword.value = '';
    await refreshConnections();
  } catch (error: any) {
    errorMessage.value = error?.message || 'Failed to connect account';
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-xl space-y-6">
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold text-white">Connect your email</h1>
        <p class="text-sm text-zinc-400">
          {{
            hasConnections
              ? 'Your account is connected. Add more or head to your inbox.'
              : 'Connect an email account to start using your inbox.'
          }}
        </p>
      </div>

      <div v-if="selectedProvider" class="panel space-y-3 p-4">
        <h2 class="text-sm font-semibold text-white">
          Connect {{ selectedProvider === 'icloud' ? 'iCloud' : 'Yahoo' }} with app password
        </h2>
        <input v-model="accountEmail" type="email" placeholder="you@example.com" />
        <input v-model="appPassword" type="password" placeholder="App password" />
        <div class="flex gap-2">
          <button type="button" :disabled="isSubmitting" @click="saveAppPasswordConnection">
            {{ isSubmitting ? 'Connecting...' : 'Connect' }}
          </button>
          <button class="btn-secondary" type="button" @click="selectedProvider = null">
            Back
          </button>
        </div>
      </div>

      <div v-else class="grid grid-cols-2 gap-3">
        <button
          v-for="provider in emailProviders"
          :key="provider.providerId"
          class="btn-secondary h-20"
          type="button"
          @click="pickProvider(provider.providerId)"
        >
          {{ provider.name }}
        </button>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>

      <button v-if="hasConnections" class="w-full" type="button" @click="navigateTo('/mail/inbox')">
        Go to Inbox
      </button>
    </div>
  </div>
</template>
