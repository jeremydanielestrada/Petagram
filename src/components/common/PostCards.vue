<script setup>
import { usePostStore } from '@/stores/postStore'
import { ref, onMounted, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { supabase } from '@/utils/supabase'

const { mobile } = useDisplay()

const postStore = usePostStore()
const caption = ref('')
const selectedFile = ref(null)
const input = ref('')

const selectedPost = ref(null)
const comments = ref([])

const dialog = ref(false)

onMounted(async () => {
  await postStore.loadHeartedPosts()
  await postStore.fetchPosts()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user && postStore.posts.length > 0) {
    // Option A: Check for all posts at once (more efficient)
    for (const post of postStore.posts) {
      try {
        const hasUserCommented = await postStore.hasCommented(post.id, user.id)
        console.log(`User has commented on post ${post.id}: ${hasUserCommented}`)
        // You might want to store this information somewhere
        // For example, adding a 'hasCommented' property to each post
        post.hasUserCommented = hasUserCommented
      } catch (error) {
        console.error(`Error checking comments for post ${post.id}:`, error)
      }
    }
  }
})

// This function will fetch comments for a specific post
const loadComments = async (post) => {
  selectedPost.value = post
  try {
    comments.value = await postStore.fetchComments(post.id)
  } catch (error) {
    console.error('Error loading comments:', error)
    comments.value = []
  }
}

// Update your dialog opening function to load comments
const openCommentsDialog = async (post) => {
  await loadComments(post)
  dialog.value = true
}

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
    await postStore.addPost({
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
  await postStore.toggleHeart(postId)
  await postStore.fetchPosts()
  await postStore.loadHeartedPosts()
}

//Add comment function
const handleComment = async () => {
  if (!input.value || !selectedPost.value) {
    alert('Please add a comment')
    return
  }

  try {
    await postStore.addComment({
      post_id: selectedPost.value.id,
      content: input.value,
    })

    // Refresh comments after adding
    await loadComments(selectedPost.value)

    input.value = ''
  } catch (error) {
    console.error('Error adding comment:', error)
    alert('Failed to add comment')
  }
}
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
            :loading="postStore.isLoading"
            :disabled="postStore.isLoading"
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

  <v-card v-for="post in postStore.posts" :key="post.id" max-width="500" class="ma-5">
    <v-card-title>
      {{ post.caption }}
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-img
        :src="post.image_url"
        max-width="500"
        max-height="600"
        aspect-ratio="1git a"
        cover
      ></v-img>
    </v-card-text>
    <v-card-actions>
      <v-btn
        icon
        variant="plain"
        @click="handleToggleHeart(post.id)"
        :color="postStore.heartedPosts.includes(post.id) ? 'red' : 'grey'"
      >
        <v-icon>
          {{ postStore.heartedPosts.includes(post.id) ? 'mdi-heart' : 'mdi-heart-outline' }}
        </v-icon>
      </v-btn>
      <span> {{ post.hearts && post.hearts[0] ? post.hearts[0].count : 0 }}</span>

      <div class="text-center pa-4">
        <v-btn variant="plain" @click="openCommentsDialog(post)">
          <v-icon class="mr-1">mdi-comment-outline</v-icon>
          {{ post.comments?.length || 0 }} Comments
        </v-btn>

        <v-dialog v-model="dialog" width="auto">
          <v-card :width="mobile ? 350 : 500">
            <v-card-title>Comments</v-card-title>

            <!-- Comments list -->
            <v-card-text>
              <div v-if="comments.length > 0">
                <div v-for="comment in comments" :key="comment.id" class="mb-3">
                  <div class="font-weight-bold text-subtitle-2">
                    {{ `User ${comment.user_id.substring(0, 8)}...` }}
                  </div>
                  <div>{{ comment.content }}</div>
                  <v-divider class="my-2"></v-divider>
                </div>
              </div>
              <div v-else class="text-center py-3">No comments yet. Be the first to comment!</div>
            </v-card-text>

            <!-- Comment input -->
            <v-card-actions>
              <v-text-field
                v-model="input"
                label="Add a comment"
                variant="outlined"
                density="compact"
                hide-details
                class="mx-2"
                @keyup.enter="handleComment(selectedPost.id)"
              ></v-text-field>
              <v-btn icon variant="text" color="primary" @click="handleComment(selectedPost.id)">
                <v-icon>mdi-send</v-icon>
              </v-btn>
            </v-card-actions>
            <v-divider></v-divider>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn text="Close" @click="dialog = false"></v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </v-card-actions>
  </v-card>
</template>
