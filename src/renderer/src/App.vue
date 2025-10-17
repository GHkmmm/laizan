<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import {
  GlobalThemeOverrides,
  NConfigProvider,
  NGlobalStyle,
  darkTheme,
  zhCN,
  NMessageProvider,
  NDialogProvider
} from 'naive-ui'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#32f08c'
  },
  Drawer: {
    // color: '#101014'
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
    <main>
      <n-dialog-provider>
        <n-message-provider>
          <RouterView /> </n-message-provider
      ></n-dialog-provider>
    </main>
    <n-global-style />
  </n-config-provider>
</template>
