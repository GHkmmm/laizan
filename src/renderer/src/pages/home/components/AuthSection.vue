<template>
  <div class="absolute top-4 right-2">
    <n-button quaternary @click="openSettings = true">
      <template #icon>
        <n-icon size="22">
          <Menu />
        </n-icon>
      </template>
    </n-button>
    <SettingsDrawer v-model:model-value="openSettings" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NIcon } from 'naive-ui'
import { Menu } from '@vicons/tabler'
import SettingsDrawer from './SettingsDrawer.vue'

const openSettings = ref<boolean>(false)
</script>
