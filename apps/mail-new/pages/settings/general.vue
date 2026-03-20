<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
});

const trpc = useTrpc();
const { session, refreshSession, updateUserName, changePassword } = useAuth();

await refreshSession();

const name = ref(session.value?.user?.name || '');
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const externalImages = ref(false);
const isSavingName = ref(false);
const isChangingPassword = ref(false);
const isSavingSettings = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const loadSettings = async () => {
  try {
    const result = await trpc.settings.get.query();
    externalImages.value = Boolean(result?.settings?.externalImages);
  } catch {
    externalImages.value = false;
  }
};

await loadSettings();

const saveName = async () => {
  if (!name.value.trim()) {
    errorMessage.value = 'Name cannot be empty';
    return;
  }
  errorMessage.value = '';
  successMessage.value = '';
  isSavingName.value = true;
  try {
    const result = await updateUserName(name.value.trim());
    if (!result.ok) {
      errorMessage.value = result.error;
      return;
    }
    successMessage.value = 'Name updated';
  } finally {
    isSavingName.value = false;
  }
};

const savePassword = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  if (newPassword.value.length < 8) {
    errorMessage.value = 'New password must be at least 8 characters';
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }
  isChangingPassword.value = true;
  try {
    const result = await changePassword(currentPassword.value, newPassword.value);
    if (!result.ok) {
      errorMessage.value = result.error;
      return;
    }
    successMessage.value = 'Password changed';
    currentPassword.value = '';
    newPassword.value = '';
    confirmPassword.value = '';
  } finally {
    isChangingPassword.value = false;
  }
};

const saveSettings = async () => {
  errorMessage.value = '';
  successMessage.value = '';
  isSavingSettings.value = true;
  try {
    await trpc.settings.save.mutate({
      externalImages: externalImages.value,
    });
    successMessage.value = 'Settings saved';
  } catch (error: any) {
    errorMessage.value = error?.message || 'Failed to save settings';
  } finally {
    isSavingSettings.value = false;
  }
};
</script>

<template>
  <AppShell section="settings">
    <div class="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 class="text-xl font-semibold text-white">General</h1>
        <p class="text-sm text-zinc-400">Manage your account details.</p>
      </div>

      <section class="panel space-y-4 p-4">
        <h2 class="text-sm font-semibold text-white">Profile</h2>
        <div class="space-y-1">
          <p class="text-xs text-zinc-500">Email</p>
          <p class="text-sm text-zinc-200">{{ session?.user?.email }}</p>
        </div>
        <div class="space-y-1">
          <label class="text-sm text-zinc-300">Name</label>
          <input v-model="name" type="text" />
        </div>
        <button type="button" :disabled="isSavingName" @click="saveName">
          {{ isSavingName ? 'Saving...' : 'Update name' }}
        </button>
      </section>

      <section class="panel space-y-4 p-4">
        <h2 class="text-sm font-semibold text-white">Privacy</h2>
        <label class="flex items-center gap-2 text-sm text-zinc-300">
          <input v-model="externalImages" type="checkbox" class="h-4 w-4" />
          Load external images automatically
        </label>
        <button type="button" :disabled="isSavingSettings" @click="saveSettings">
          {{ isSavingSettings ? 'Saving...' : 'Save preferences' }}
        </button>
      </section>

      <section class="panel space-y-4 p-4">
        <h2 class="text-sm font-semibold text-white">Change Password</h2>
        <input v-model="currentPassword" type="password" placeholder="Current password" />
        <input v-model="newPassword" type="password" placeholder="New password" minlength="8" />
        <input
          v-model="confirmPassword"
          type="password"
          placeholder="Confirm new password"
          minlength="8"
        />
        <button type="button" :disabled="isChangingPassword" @click="savePassword">
          {{ isChangingPassword ? 'Changing...' : 'Change password' }}
        </button>
      </section>

      <p v-if="successMessage" class="text-sm text-emerald-400">{{ successMessage }}</p>
      <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>
    </div>
  </AppShell>
</template>
