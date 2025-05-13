<script setup>
import { usePostStore } from '@/stores/postStore'
import { useAuthUserStore } from '@/stores/authUser'
import { ref, onMounted, computed } from 'vue'

const posts = usePostStore()
const caption = ref('')
const selectedFile = ref(null)

const dialog = ref(false)

onMounted(async () => {
  try {
    await posts.fecthPosts()
    console.log(posts.posts)
  } catch {
    console.log('Error fetching posts')
  }
})

//Handle submission
const handleSubmit = async () => {
  if (!selectedFile.value || !caption.value) {
    alert('Please select an image and write a caption')
    return
  }

  //First upload the image
  const imageUrl = await posts.uploadImage(selectedFile.value)

  if (imageUrl) {
    // If upload successful, create the post
    await posts.addPost({
      image_url: imageUrl,
      caption: caption.value,
    })

    // Reset form after successful post
    selectedFile.value = null
    caption.value = ''
  }
}

// const closeDialog = computed(() => {
//   return posts.posts.length > 0 ? dialog.value == true : dialog.value == false
// })
</script>
<template>
  <div class="text-center pa-4">
    <v-btn @click="dialog = true"> Open Dialog </v-btn>
    <v-dialog v-model="dialog" width="auto">
      <v-card width="500">
        <v-card-text>
          <v-form fast-fail @submit.prevent="handleSubmit">
            <v-file-input
              v-model="selectedFile"
              label="Upload Photo"
              prepend-icon="mdi-camera"
              variant="filled"
            ></v-file-input>
            <v-text-field v-model="caption" label="Caption" variant="filled" />
            <v-btn type="submit" :loading="posts.isLoading" :disabled="posts.isLoading">
              Upload
            </v-btn>
          </v-form>
        </v-card-text>
        <template v-slot:actions>
          <v-btn class="ms-auto" text="CLose" @click="dialog = false"></v-btn>
        </template>
      </v-card>
    </v-dialog>
  </div>

  <v-container>
    <v-row>
      <v-col cols="12" md="12" class="d-flex jutify-center align-center flex-column">
        <v-card v-for="post in posts.posts" :key="post.id" width="500" class="ma-5">
          <v-card-title>
            {{ post.caption }}
          </v-card-title>
          <v-card-text>
            <v-img :src="post.image_url" width="100%" height="500"></v-img>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
