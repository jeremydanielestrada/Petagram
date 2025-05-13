import { supabase } from '@/utils/supabase'
import { ref, onMounted } from 'vue'
import { defineStore } from 'pinia'

export const usePostStore = defineStore('postStore', () => {
  // States
  const posts = ref([])
  const isLoading = ref(false)
  const heartedPosts = ref([])

  // Fetch posts
  async function fetchPosts() {
    isLoading.value = true
    const { data, error } = await supabase.from('posts').select(`*, hearts(count), comments(count)`)

    if (error) {
      console.error('Error fetching posts:', error)
    } else {
      console.log('Fetched posts:', data) // For debugging
      // Ensure each post has a properly structured hearts property
      posts.value = data.map((post) => ({
        ...post,
        hearts: post.hearts || [],
      }))
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
      await fetchPosts()
    }

    isLoading.value = false
  }

  //fetching Hearts
  async function hasHearted(postId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('hearts')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle()

    return data !== null
  }

  async function loadHeartedPosts() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data } = await supabase.from('hearts').select('post_id').eq('user_id', user.id)

    heartedPosts.value = data.map((h) => h.post_id)
  }

  ///toggleHearts
  async function toggleHeart(postId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if heart exists
    const { data: existingHeart } = await supabase
      .from('hearts')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingHeart) {
      // Remove the heart
      await supabase.from('hearts').delete().eq('id', existingHeart.id)
    } else {
      // Add a new heart
      await supabase.from('hearts').insert({
        post_id: postId,
        user_id: user.id,
      })
    }
  }

  ///Fetch comments

  return {
    heartedPosts,
    posts,
    isLoading,
    fetchPosts,
    uploadImage,
    addPost,
    toggleHeart,
    loadHeartedPosts,
    hasHearted,
  }
})
