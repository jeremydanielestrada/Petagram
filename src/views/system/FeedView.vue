<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import PostCards from '@/components/common/PostCards.vue'
</script>

<template>
  <AppLayout>
    <template #content>
      <PostCards></PostCards>
    </template>
  </AppLayout>
</template>
