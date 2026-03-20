<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
});
</script>

<template>
  <AppShell section="settings">
    <div class="mx-auto max-w-2xl space-y-3">
      <h1 class="text-xl font-semibold text-white">Notifications</h1>
      <div class="panel p-4 text-sm text-zinc-400">
        Notification preferences are not yet migrated in this Nuxt version.
      </div>
    </div>
  </AppShell>
</template>
