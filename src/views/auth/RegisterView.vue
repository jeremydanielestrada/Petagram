<script setup>
import RegisterForm from '@/components/auth/RegisterForm.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useDisplay } from 'vuetify'
// Utilize pre-defined vue functions
const { mobile } = useDisplay()
</script>

<template>
  <AppLayout>
    <template #content>
      <v-container class="pa-0" fluid>
        <v-row>
          <v-col
            cols="12"
            lg="8"
            class="bg-surface-light d-flex justify-center align-center flex-column"
            v-if="!mobile"
          >
            <h1>Share your pet's cutie pictures</h1>
            <v-img src="/images/banner.gif" max-width="70%" width="70%"></v-img>
          </v-col>
          <v-col cols="12" lg="4" :class="mobile ? '' : 'pt-16'">
            <v-card class="mx-auto" elevation="0" max-width="600">
              <v-card-title class="text-center">
                <v-img
                  class="mx-auto"
                  src="/images/logo.png"
                  :width="mobile ? '75%' : '50%'"
                ></v-img>

                <h3 class="font-weight-black mt-5">Registration</h3>
              </v-card-title>

              <v-card-text class="pt-4">
                <v-divider class="my-5"></v-divider>

                <RegisterForm></RegisterForm>

                <v-divider class="my-5"></v-divider>

                <h4 class="text-center">
                  Already have account?
                  <RouterLink class="text-light-green-darken-3 font-weight-black" to="/">
                    Click here to Login
                  </RouterLink>
                </h4>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </AppLayout>
</template>
