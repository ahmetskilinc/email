<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
});

type ProviderInfo = {
  id: string;
  name: string;
  enabled: boolean;
};

const runtimeConfig = useRuntimeConfig();
const { signInEmail, signInSocial } = useAuth();

const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const providers = ref<ProviderInfo[]>([]);

onMounted(async () => {
  try {
    const data = await $fetch<{ allProviders: ProviderInfo[] }>(
      `${runtimeConfig.public.backendUrl}/api/public/providers`,
      {
        credentials: 'include',
      },
    );
    providers.value = data.allProviders.filter((provider) => provider.enabled);
  } catch {
    providers.value = [];
  }
});

const submitLogin = async () => {
  errorMessage.value = '';
  isLoading.value = true;
  try {
    const result = await signInEmail(email.value, password.value);
    if (!result.ok) {
      errorMessage.value = result.error;
      return;
    }
    await navigateTo('/mail/inbox');
  } finally {
    isLoading.value = false;
  }
};

const loginWithProvider = async (providerId: string) => {
  errorMessage.value = '';
  const callbackURL = `${window.location.origin}/mail/inbox`;
  const result = await signInSocial(providerId, callbackURL);
  if (!result.ok) {
    errorMessage.value = result.error;
  }
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-sm space-y-6">
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold text-white">Welcome back</h1>
        <p class="text-sm text-zinc-400">Log in to your account.</p>
      </div>
      <form class="space-y-3" @submit.prevent="submitLogin">
        <div class="space-y-1">
          <label class="text-sm text-zinc-300" for="email">Email</label>
          <input id="email" v-model="email" type="email" required />
        </div>
        <div class="space-y-1">
          <label class="text-sm text-zinc-300" for="password">Password</label>
          <input id="password" v-model="password" type="password" required />
        </div>
        <button class="w-full" type="submit" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Log in' }}
        </button>
      </form>
      <div v-if="providers.length" class="space-y-2">
        <p class="text-center text-xs text-zinc-500">Or continue with</p>
        <button
          v-for="provider in providers"
          :key="provider.id"
          class="btn-secondary w-full"
          type="button"
          @click="loginWithProvider(provider.id)"
        >
          Continue with {{ provider.name }}
        </button>
      </div>
      <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>
      <p class="text-center text-sm text-zinc-400">
        Don't have an account?
        <NuxtLink to="/signup" class="text-zinc-200 underline">Sign up</NuxtLink>
      </p>
    </div>
  </div>
</template>
