<script setup lang="ts">
const props = defineProps<{
  section: 'mail' | 'settings';
}>();

const route = useRoute();
const { session, signOut } = useAuth();

const mailLinks = [
  { name: 'Inbox', to: '/mail/inbox' },
  { name: 'Drafts', to: '/mail/draft' },
  { name: 'Sent', to: '/mail/sent' },
  { name: 'Archive', to: '/mail/archive' },
  { name: 'Bin', to: '/mail/bin' },
];

const settingsLinks = [
  { name: 'Back to mail', to: '/mail/inbox' },
  { name: 'General', to: '/settings/general' },
  { name: 'Connections', to: '/settings/connections' },
  { name: 'Notifications', to: '/settings/notifications' },
];

const links = computed(() => (props.section === 'mail' ? mailLinks : settingsLinks));

const isActive = (path: string) => route.path === path;

const onSignOut = async () => {
  await signOut();
  await navigateTo('/login');
};
</script>

<template>
  <div class="flex min-h-screen bg-zinc-950 text-zinc-100">
    <aside class="w-64 border-r border-zinc-800 p-4">
      <NuxtLink to="/mail/inbox" class="mb-6 block text-lg font-semibold text-white">
        zeitmail
      </NuxtLink>
      <div class="mb-6">
        <p class="truncate text-xs text-zinc-400">
          {{ session?.user?.email }}
        </p>
      </div>
      <nav class="space-y-1">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="block rounded-md px-3 py-2 text-sm"
          :class="isActive(link.to) ? 'bg-zinc-800 text-white' : 'text-zinc-300 hover:bg-zinc-900'"
        >
          {{ link.name }}
        </NuxtLink>
      </nav>
      <button class="btn-secondary mt-8 w-full" type="button" @click="onSignOut">Sign out</button>
    </aside>
    <main class="flex-1 p-6">
      <slot />
    </main>
  </div>
</template>
