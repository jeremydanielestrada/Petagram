<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import PostCards from '@/components/common/PostCards.vue'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
</script>

<template>
  <AppLayout>
    <template #content>
      <v-container>
        <v-row>
          <v-col cols="12" md="4" v-if="!mobile"></v-col>
          <v-col cols="12" md="4">
            <PostCards></PostCards>
          </v-col>
          <v-col cols="12" md="4" v-if="!mobile"></v-col>
        </v-row>
      </v-container>
    </template>
  </AppLayout>
</template>
