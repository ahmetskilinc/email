<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
});

const route = useRoute();
const trpc = useTrpc();

const to = ref(typeof route.query.to === 'string' ? route.query.to : '');
const cc = ref(typeof route.query.cc === 'string' ? route.query.cc : '');
const bcc = ref(typeof route.query.bcc === 'string' ? route.query.bcc : '');
const subject = ref(typeof route.query.subject === 'string' ? route.query.subject : '');
const message = ref(typeof route.query.body === 'string' ? route.query.body : '');

const isSending = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const toRecipients = (value: string) =>
  value
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean)
    .map((email) => ({ email }));

const sendEmail = async () => {
  isSending.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await trpc.mail.send.mutate({
      to: toRecipients(to.value),
      cc: toRecipients(cc.value),
      bcc: toRecipients(bcc.value),
      subject: subject.value,
      message: message.value,
      attachments: [],
      headers: {},
    });
    successMessage.value = 'Email sent';
    to.value = '';
    cc.value = '';
    bcc.value = '';
    subject.value = '';
    message.value = '';
  } catch (error: any) {
    errorMessage.value = error?.message || 'Failed to send email';
  } finally {
    isSending.value = false;
  }
};
</script>

<template>
  <AppShell section="mail">
    <div class="mx-auto max-w-3xl space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold text-white">Compose</h1>
        <button class="btn-secondary" type="button" @click="navigateTo('/mail/inbox')">Back to inbox</button>
      </div>

      <form class="panel space-y-3 p-4" @submit.prevent="sendEmail">
        <div class="space-y-1">
          <label class="text-sm text-zinc-300">To</label>
          <input v-model="to" type="text" placeholder="alice@example.com, bob@example.com" required />
        </div>
        <div class="space-y-1">
          <label class="text-sm text-zinc-300">CC</label>
          <input v-model="cc" type="text" placeholder="optional" />
        </div>
        <div class="space-y-1">
          <label class="text-sm text-zinc-300">BCC</label>
          <input v-model="bcc" type="text" placeholder="optional" />
        </div>
        <div class="space-y-1">
          <label class="text-sm text-zinc-300">Subject</label>
          <input v-model="subject" type="text" placeholder="Subject" required />
        </div>
        <div class="space-y-1">
          <label class="text-sm text-zinc-300">Message</label>
          <textarea v-model="message" rows="12" required />
        </div>
        <button type="submit" :disabled="isSending">
          {{ isSending ? 'Sending...' : 'Send email' }}
        </button>
      </form>

      <p v-if="successMessage" class="text-sm text-emerald-400">{{ successMessage }}</p>
      <p v-if="errorMessage" class="text-sm text-red-400">{{ errorMessage }}</p>
    </div>
  </AppShell>
</template>
