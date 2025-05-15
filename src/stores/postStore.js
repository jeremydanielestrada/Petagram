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
  async function hasCommented(postId, userId) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw new Error('Error checking for comments')

    return Boolean(data) // Returns true if comment exists, false otherwise
  }

  //add comment
  // In your postStore.js
  async function addComment({ post_id, content }) {
    if (!post_id || !content) {
      throw new Error('Post ID and content are required')
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError) throw new Error('Authentication error')
    if (!user) throw new Error('User not authenticated')

    try {
      const { error } = await supabase.from('comments').insert({
        post_id,
        user_id: user.id,
        content,
      })

      if (error) throw error

      // Optionally refresh comments after adding
      await this.fetchComments(post_id)
    } catch (error) {
      console.error('Error in addComment:', error)
      throw new Error(`Failed to add comment: ${error.message}`)
    }
  }

  // In your postStore.js
  // Alternative approach if you don't have a profiles table
  async function fetchComments(postId) {
    try {
      const { data: comments, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Update store
      const postIndex = this.posts.findIndex((p) => p.id === postId)
      if (postIndex !== -1) {
        this.posts[postIndex].comments = comments
      }

      return comments
    } catch (error) {
      console.error('Error fetching comments:', error)
      throw error
    }
  }

  ///Delet a post
  async function deletePost(postId) {
    // 1. Delete related hearts
    const { error: heartsError } = await supabase.from('hearts').delete().eq('post_id', postId)

    if (heartsError) {
      console.error('Error deleting hearts:', heartsError)
      throw heartsError
    }

    // 2. Delete related comments
    const { error: commentsError } = await supabase.from('comments').delete().eq('post_id', postId)

    if (commentsError) {
      console.error('Error deleting comments:', commentsError)
      throw commentsError
    }

    // 3. Delete the post itself
    const { error: postError } = await supabase.from('posts').delete().eq('id', postId)

    if (postError) {
      console.error('Error deleting post:', postError)
      throw postError
    }

    console.log(`Post ${postId} and all related data deleted.`)
  }

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
    hasCommented,
    addComment,
    fetchComments,
    deletePost,
  }
})
