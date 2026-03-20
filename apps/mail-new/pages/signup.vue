<script setup lang="ts">
definePageMeta({
  middleware: ['guest'],
});

const { signUpEmail } = useAuth();

const name = ref('');
const email = ref('');
const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');

const submitSignup = async () => {
  errorMessage.value = '';
  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters';
    return;
  }

  isLoading.value = true;
  try {
    const result = await signUpEmail(name.value, email.value, password.value);
    if (!result.ok) {
      errorMessage.value = result.error;
      return;
    }
    await navigateTo('/mail/inbox');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-sm space-y-6">
      <div class="space-y-2 text-center">
        <h1 class="text-2xl font-semibold text-white">Create your account</h1>
        <p class="text-sm text-zinc-400">Sign up to get started with your email.</p>
      </div>
      <form class="space-y-3" @submit.prevent="submitSignup">
        <div class="space-y-1">
          <label class="text-sm text-zinc-300" for="name">Name</label>
          <input id="name" v-model="name" type="text" required />
        </div>
        <div class="space-y-1">
          <label class="text-sm text-zinc-300" for="email">Email</label>
          <input id="email" v-model="email" type="email" required />
        </div>
        <div class="space-y-1">
          <label class="text-sm text-zinc-300" for="password">Password</label>
          <input id="password" v-model="password" type="password" minlength="8" required />
        </div>
        <button class="w-full" type="submit" :disabled="isLoading">
          {{ isLoading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>
      <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>
      <p class="text-center text-sm text-zinc-400">
        Already have an account?
        <NuxtLink to="/login" class="text-zinc-200 underline">Log in</NuxtLink>
      </p>
    </div>
  </div>
</template>
