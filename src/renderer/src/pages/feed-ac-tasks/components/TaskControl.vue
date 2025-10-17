<template>
  <div class="flex flex-col gap-4 w-96">
    <n-log ref="logInstRef" :log="progressLogs" language="naive-log" trim />
  </div>
</template>

<script setup lang="ts">
import { NLog } from 'naive-ui'
import { useLogsStore } from '../stores/logs'

const logsStore = useLogsStore()
const { progressLogs, logInstRef } = logsStore
</script>
