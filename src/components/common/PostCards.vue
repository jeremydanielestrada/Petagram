<script setup>
import { usePostStore } from '@/stores/postStore'
import { useAuthUserStore } from '@/stores/authUser'
import { ref, onMounted, computed } from 'vue'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()

const posts = usePostStore()
const caption = ref('')
const selectedFile = ref(null)

const dialog = ref(false)

onMounted(async () => {
  await posts.loadHeartedPosts()
  await posts.fetchPosts()
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
    dialog.value = false
  }
}

// This handles toggle + updates UI
const handleToggleHeart = async (postId) => {
  await posts.toggleHeart(postId)
  await posts.fetchPosts()
  await posts.loadHeartedPosts()
}

// const closeDialog = computed(() => {
//   return posts.posts.length > 0 ? dialog.value == true : dialog.value == false
// })
</script>
<template>
  <div class="text-center pa-4">
    <v-card :width="mobile ? '350' : '500'">
      <v-card-title>Add Post</v-card-title>
      <v-card-text>
        <v-form fast-fail @submit.prevent="handleSubmit">
          <v-file-input
            v-model="selectedFile"
            label="Upload Photo"
            prepend-icon="mdi-camera"
            variant="filled"
            color="light-green-darken-3"
          ></v-file-input>
          <v-text-field
            v-model="caption"
            label="Caption"
            variant="filled"
            prepend-icon="mdi-closed-caption"
            color="light-green-darken-3"
          />
          <v-btn
            type="submit"
            :loading="posts.isLoading"
            :disabled="posts.isLoading"
            block
            variant="outlined"
            color="light-green-darken-3"
          >
            Upload
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>

  <v-card v-for="post in posts.posts" :key="post.id" max-width="500" class="ma-5">
    <v-card-title>
      {{ post.caption }}
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-img :src="post.image_url" width="100%" height="100%"></v-img>
    </v-card-text>
    <v-card-actions>
      <v-btn
        icon
        variant="plain"
        @click="handleToggleHeart(post.id)"
        :color="posts.heartedPosts.includes(post.id) ? 'red' : 'grey'"
      >
        <v-icon>
          {{ posts.heartedPosts.includes(post.id) ? 'mdi-heart' : 'mdi-heart-outline' }}
        </v-icon>
      </v-btn>
      <span> {{ post.hearts && post.hearts[0] ? post.hearts[0].count : 0 }}</span>
    </v-card-actions>
  </v-card>
</template>
