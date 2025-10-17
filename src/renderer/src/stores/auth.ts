import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const hasAuth = ref<boolean | null>(null)

  const login = async (): Promise<void> => {
    await window.api.login()
    hasAuth.value = await window.api.hasAuth()
  }

  const logout = async (): Promise<void> => {
    window.api.logout()
    hasAuth.value = await window.api.hasAuth()
  }

  const checkAuth = async (): Promise<void> => {
    hasAuth.value = await window.api.hasAuth()
  }

  return {
    hasAuth,
    login,
    logout,
    checkAuth
  }
})
