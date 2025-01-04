<script setup lang="ts">
import { ref } from 'vue'
import { Upload, Plus } from '@element-plus/icons-vue'

const title = ref('文件分片上传系统')
</script>

<template>
  <div class="file-manager">
    <div class="content-container">
      <!-- 标题区域 -->
      <div class="welcome-header">
        <el-icon class="header-icon">
          <Upload />
        </el-icon>
        <h1>{{ title }}</h1>
        <p class="subtitle">基于分片技术的大文件上传解决方案</p>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <el-card class="upload-card" :body-style="{ padding: '0' }">
          <template #header>
            <div class="card-header">
              <span class="title">开始上传</span>
              <el-tag type="success" effect="dark">Demo</el-tag>
            </div>
          </template>

          <!-- 上传区域 -->
          <div class="upload-area">
            <el-button type="primary" size="large" :icon="Plus">
              选择文件
            </el-button>
            <p class="upload-tip">支持大文件上传，自动进行分片处理</p>
          </div>

          <!-- 功能特点 -->
          <div class="features">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card shadow="hover" class="feature-card">
                  <h3>分片处理</h3>
                  <p>自动将大文件切分成小块进行上传</p>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" class="feature-card">
                  <h3>进度监控</h3>
                  <p>实时显示每个分片的上传进度</p>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card shadow="hover" class="feature-card">
                  <h3>并发上传</h3>
                  <p>多个分片同时上传，提升传输速度</p>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped>
.file-manager {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 10vh 2rem;
  background-color: var(--el-bg-color-page);
  min-height: 100vh;
}

.content-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 2vh;
}

.welcome-header {
  text-align: center;
  padding: 2vh 0;
  flex-shrink: 1;
  position: relative;
}

.header-icon {
  font-size: clamp(2rem, 4vh, 3rem);
  color: var(--el-color-primary);
  margin-bottom: 1vh;
  transition: transform 0.3s ease;
}

.welcome-header:hover .header-icon {
  transform: scale(1.1);
}

.welcome-header h1 {
  font-size: clamp(1.5rem, 3vh, 2.5rem);
  color: var(--el-text-color-primary);
  line-height: 1.2;
  margin: 0;
}

.subtitle {
  margin-top: 1vh;
  color: var(--el-text-color-secondary);
  font-size: clamp(0.875rem, 2vh, 1.25rem);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.upload-card {
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  min-height: 0;
  transition: all 0.3s ease;
  border: 1px solid var(--el-border-color-light);
}

.upload-card:hover {
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  flex-shrink: 0;
}

.card-header .title {
  font-size: clamp(1rem, 2vh, 1.25rem);
  font-weight: bold;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(1.5rem, 4vh, 3rem) 1.5rem;
  border-radius: 12px;
  border: 2px dashed var(--el-border-color);
  margin: 1rem;
  background-color: var(--el-bg-color-page);
  transition: all 0.3s ease;
  cursor: pointer;
  min-height: clamp(120px, 20vh, 200px);
  flex-shrink: 1;
  position: relative;
  overflow: hidden;
}

.upload-area::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--el-color-primary);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.upload-area:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.upload-area>* {
  position: relative;
  z-index: 1;
}

.upload-tip {
  margin-top: 1vh;
  color: var(--el-text-color-secondary);
  font-size: clamp(0.75rem, 1.5vh, 0.875rem);
}

.features {
  padding: 1rem;
  flex-shrink: 0;
}

.feature-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  text-align: center;
  transition: all 0.3s ease;
  border-radius: 12px;
  padding: clamp(0.75rem, 2vh, 1.25rem);
  border: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: var(--el-border-color-lighter);
}

.feature-card h3 {
  margin: 0.5vh 0;
  font-size: clamp(0.875rem, 2vh, 1.125rem);
  color: var(--el-text-color-primary);
}

.feature-card p {
  margin: 0;
  font-size: clamp(0.75rem, 1.5vh, 0.875rem);
  color: var(--el-text-color-secondary);
  line-height: 1.4;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .file-manager {
    padding: 1rem;
  }

  .features .el-row {
    margin: 0 !important;
  }

  .features .el-col {
    width: 100% !important;
    padding: 0.5rem 0 !important;
  }
}
</style>
