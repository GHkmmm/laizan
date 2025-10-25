<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import javascript from 'highlight.js/lib/languages/javascript'

import {
  GlobalThemeOverrides,
  NConfigProvider,
  NGlobalStyle,
  darkTheme,
  zhCN,
  NMessageProvider,
  NDialogProvider,
  NModalProvider
} from 'naive-ui'

hljs.registerLanguage('javascript', javascript)

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#32f08c'
  },
  Layout: {
    siderColor: '#101014'
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
      <n-modal-provider>
        <n-dialog-provider>
          <n-message-provider>
            <RouterView />
          </n-message-provider>
        </n-dialog-provider>
      </n-modal-provider>
    </main>
    <n-global-style />
  </n-config-provider>
</template>
