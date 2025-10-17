import { defineStore } from 'pinia'
import { ref, nextTick, watchEffect } from 'vue'
import type { LogInst } from 'naive-ui'

export const useLogsStore = defineStore('logs', () => {
  const progressLogs = ref('')
  const logInstRef = ref<LogInst | null>(null)

  const addLog = (message: string): void => {
    progressLogs.value += `${new Date().toLocaleTimeString()} ${message}\n`
  }

  const clearLogs = (): void => {
    progressLogs.value = ''
  }

  const scrollToBottom = (): void => {
    nextTick(() => {
      logInstRef.value?.scrollTo({ position: 'bottom', silent: true })
    })
  }

  const setupAutoScroll = (): void => {
    watchEffect(() => {
      if (progressLogs.value) {
        scrollToBottom()
      }
    })
  }

  return {
    progressLogs,
    logInstRef,
    addLog,
    clearLogs,
    scrollToBottom,
    setupAutoScroll
  }
})
