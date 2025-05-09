<script setup></script>

<template>
  <v-form>
    <v-text-field v-model="firstName" :rules="firstNameRules" label="First name"></v-text-field>

    <v-text-field v-model="lastName" :rules="lastNameRules" label="Last name"></v-text-field>

    <v-btn class="mt-2" type="submit" block>Submit</v-btn>
  </v-form>
</template>
