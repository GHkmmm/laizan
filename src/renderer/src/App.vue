<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import { GlobalThemeOverrides, NConfigProvider, NGlobalStyle, darkTheme, zhCN } from 'naive-ui'
import IndexPage from './pages/index.vue'

hljs.registerLanguage('naive-log', () => ({
  contains: [
    {
      className: 'number',
      begin: /\d+/
    }
  ]
}))

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#32f08c'
  }
}
</script>

<template>
  <n-config-provider
    :locale="zhCN"
    :theme="darkTheme"
    :theme-overrides="themeOverrides"
    :hljs="hljs"
  >
    <IndexPage />
    <n-global-style />
  </n-config-provider>
</template>
