<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
});

await navigateTo('/mail/inbox', { replace: true });
</script>

<template>
  <div />
</template>
