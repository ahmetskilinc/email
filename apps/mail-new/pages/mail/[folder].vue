<script setup lang="ts">
import { allowedFolders } from '~/utils/constants';

definePageMeta({
  middleware: ['auth'],
});

const route = useRoute();
const router = useRouter();
const trpc = useTrpc();

const folder = computed(() => String(route.params.folder || 'inbox'));
const selectedThreadId = computed(() =>
  typeof route.query.threadId === 'string' ? route.query.threadId : null,
);

const threads = ref<any[]>([]);
const selectedThread = ref<any | null>(null);
const isLoadingThreads = ref(false);
const isLoadingThread = ref(false);
const errorMessage = ref('');

const getPreview = (thread: any) => {
  const raw = thread?.$raw?.preview;
  if (raw) {
    return {
      id: thread.id,
      senderName: raw.sender?.name || raw.sender?.email || 'Unknown sender',
      senderEmail: raw.sender?.email || '',
      subject: raw.subject || '(no subject)',
      receivedOn: raw.receivedOn || '',
      unread: Boolean(raw.unread),
      totalReplies: raw.totalReplies || 1,
    };
  }

  return {
    id: thread?.id || '',
    senderName: thread?.sender?.name || thread?.sender?.email || 'Unknown sender',
    senderEmail: thread?.sender?.email || '',
    subject: thread?.subject || '(no subject)',
    receivedOn: thread?.receivedOn || '',
    unread: false,
    totalReplies: 1,
  };
};

const ensureFolderValid = async () => {
  if (allowedFolders.has(folder.value)) {
    return true;
  }

  try {
    const labels = await trpc.labels.list.query();
    const labelExists = labels.some((label: any) => label.id === folder.value);
    if (!labelExists) {
      errorMessage.value = 'Folder not found. Redirecting to inbox.';
      await navigateTo('/mail/inbox');
      return false;
    }
    return true;
  } catch {
    errorMessage.value = 'Unable to validate folder';
    return false;
  }
};

const loadThread = async (threadId: string) => {
  isLoadingThread.value = true;
  errorMessage.value = '';
  try {
    selectedThread.value = await trpc.mail.get.query({ id: threadId });
  } catch (error: any) {
    selectedThread.value = null;
    errorMessage.value = error?.message || 'Failed to load thread';
  } finally {
    isLoadingThread.value = false;
  }
};

const loadThreads = async () => {
  const isValid = await ensureFolderValid();
  if (!isValid) {
    return;
  }

  isLoadingThreads.value = true;
  errorMessage.value = '';
  try {
    const result = await trpc.mail.listThreads.query({
      folder: folder.value,
      q: '',
      maxResults: 50,
      cursor: '',
      labelIds: [],
    });
    threads.value = result?.threads || [];

    const hasSelectedThread = selectedThreadId.value
      ? threads.value.some((thread) => thread.id === selectedThreadId.value)
      : false;

    if (selectedThreadId.value && hasSelectedThread) {
      await loadThread(selectedThreadId.value);
      return;
    }

    if (threads.value[0]?.id) {
      await router.replace({
        query: {
          ...route.query,
          threadId: threads.value[0].id,
        },
      });
      await loadThread(threads.value[0].id);
      return;
    }

    selectedThread.value = null;
  } catch (error: any) {
    threads.value = [];
    selectedThread.value = null;
    errorMessage.value = error?.message || 'Failed to load mail';
  } finally {
    isLoadingThreads.value = false;
  }
};

const openThread = async (threadId: string) => {
  await router.replace({
    query: {
      ...route.query,
      threadId,
    },
  });
  await loadThread(threadId);
};

watch(folder, async () => {
  await loadThreads();
});

watch(selectedThreadId, async (nextThreadId) => {
  if (!nextThreadId) {
    selectedThread.value = null;
    return;
  }
  if (selectedThread.value?.id === nextThreadId) {
    return;
  }
  await loadThread(nextThreadId);
});

await loadThreads();
</script>

<template>
  <AppShell section="mail">
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold capitalize text-white">{{ folder }}</h1>
        <p class="text-sm text-zinc-400">Browse your messages</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-secondary" type="button" @click="navigateTo('/mail/compose')">Compose</button>
        <button class="btn-secondary" type="button" @click="navigateTo('/settings/general')">
          Settings
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="mb-4 text-sm text-red-400">{{ errorMessage }}</p>

    <div class="grid min-h-[70vh] grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
      <section class="panel overflow-hidden">
        <div class="border-b border-zinc-800 p-3 text-sm text-zinc-300">
          {{ isLoadingThreads ? 'Loading messages...' : `${threads.length} threads` }}
        </div>
        <div class="max-h-[70vh] overflow-auto">
          <button
            v-for="thread in threads"
            :key="thread.id"
            type="button"
            class="w-full border-b border-zinc-900 p-3 text-left hover:bg-zinc-800/40"
            :class="selectedThreadId === thread.id ? 'bg-zinc-800/60' : ''"
            @click="openThread(thread.id)"
          >
            <div class="flex items-center justify-between gap-2">
              <p class="truncate text-sm text-white">
                {{ getPreview(thread).senderName }}
              </p>
              <p class="text-xs text-zinc-500">
                {{ getPreview(thread).receivedOn ? new Date(getPreview(thread).receivedOn).toLocaleDateString() : '' }}
              </p>
            </div>
            <p class="mt-1 truncate text-sm text-zinc-400">{{ getPreview(thread).subject }}</p>
          </button>
          <div v-if="!isLoadingThreads && !threads.length" class="p-4 text-sm text-zinc-500">
            No threads found in this folder.
          </div>
        </div>
      </section>

      <section class="panel min-h-[70vh] p-4">
        <div v-if="isLoadingThread" class="text-sm text-zinc-400">Loading thread...</div>
        <div v-else-if="!selectedThread" class="text-sm text-zinc-500">Select a thread to view it.</div>
        <div v-else class="space-y-4">
          <header class="space-y-1 border-b border-zinc-800 pb-3">
            <h2 class="text-lg font-semibold text-white">{{ selectedThread.latest?.subject || '(no subject)' }}</h2>
            <p class="text-xs text-zinc-500">
              {{ selectedThread.totalReplies || selectedThread.messages?.length || 0 }} messages
            </p>
          </header>

          <article
            v-for="message in selectedThread.messages || []"
            :key="message.id"
            class="rounded-md border border-zinc-800 bg-zinc-900/50 p-3"
          >
            <div class="mb-2 flex items-center justify-between">
              <p class="text-sm text-zinc-200">
                {{ message.sender?.name || message.sender?.email || 'Unknown sender' }}
              </p>
              <p class="text-xs text-zinc-500">
                {{
                  message.receivedOn ? new Date(message.receivedOn).toLocaleString() : ''
                }}
              </p>
            </div>
            <p class="whitespace-pre-wrap text-sm text-zinc-300">
              {{ message.body || message.snippet || '' }}
            </p>
          </article>
        </div>
      </section>
    </div>
  </AppShell>
</template>
