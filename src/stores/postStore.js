import { supabase } from '@/utils/supabase'
import { ref, onMounted } from 'vue'
import { defineStore } from 'pinia'

export const usePostStore = defineStore('postStore', () => {
  // States
  const posts = ref([])
  const isLoading = ref(false)

  // Fetch posts
  async function fecthPosts() {
    isLoading.value = true
    const { data, error } = await supabase.from('posts').select(`*, hearts(count), comments(count)`)

    if (error) {
      console.error('Error fetching posts:', error)
    } else {
      console.log('Fetched posts:', data) // ✅ Add this for debugging
      posts.value = data
    }

    isLoading.value = false
  }

  // Upload an image
  async function uploadImage(file) {
    isLoading.value = true

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('User fetch error:', userError)
      isLoading.value = false
      return null
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}_${Date.now()}.${fileExt}`
    const filePath = `posts/${fileName}`

    const { error: uploadError } = await supabase.storage.from('petagram').upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      console.error('Image upload error:', uploadError)
      isLoading.value = false
      return null
    }

    const { data: imageData } = supabase.storage.from('petagram').getPublicUrl(filePath)

    isLoading.value = false
    return imageData.publicUrl
  }

  // Add a post
  async function addPost({ image_url, caption }) {
    isLoading.value = true

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('User fetch error:', userError)
      isLoading.value = false
      return
    }

    const { data, error } = await supabase
      .from('posts')
      .insert([{ image_url, caption, user_id: user.id }])
      .select()

    if (error) {
      console.error('Error adding post:', error)
    } else {
      posts.value.unshift(data[0]) // Add the new post to the top of the list  await fetchPosts()
      await fecthPosts()
    }

    isLoading.value = false
  }

  return {
    posts,
    isLoading,
    fecthPosts,
    uploadImage,
    addPost,
  }
})
