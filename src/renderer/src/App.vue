<script setup lang="ts">
const startTask = (): void => {
  window.electron.ipcRenderer.send('startTask')
}
</script>

<template>
  <div>
    <button class="start-button" @click="startTask">开始任务</button>
  </div>
</template>
