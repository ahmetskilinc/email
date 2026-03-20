<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
});

await navigateTo('/settings/general', { replace: true });
</script>

<template>
  <div />
</template>
