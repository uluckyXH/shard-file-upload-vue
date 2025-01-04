<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <RouterView />
  </div>
</template>

<style>
/* 重置基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
}

body {
  overflow-x: hidden;
  background-color: var(--el-bg-color-page);
}

#app,
.app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100vh;
}

/* 滚动条美化 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--el-bg-color-page);
}

::-webkit-scrollbar-thumb {
  background: var(--el-border-color-darker);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-secondary);
}

/* 文本选择样式 */
::selection {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
</style>
