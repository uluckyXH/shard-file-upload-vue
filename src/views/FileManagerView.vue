<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Upload, Plus, Document, View, Download, Search, InfoFilled, Loading, PictureFilled } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { fileApi } from '@/api/file'
import type { FileInfo } from '@/api/file'
import { ElMessage } from 'element-plus'

const title = ref('文件上传管理系统')
const activeTab = ref('chunk')

// 搜索关键词
const searchKeyword = ref('')

// 普通上传相关
const uploadRef = ref()
const uploadLoading = ref(false)

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const tableData = ref<FileInfo[]>([])
const loading = ref(false)

// 文件详情对话框
const detailVisible = ref(false)
const currentFile = ref<FileInfo | null>(null)

// 进度状态
const loadingText = ref('处理中...')

// 图片预览相关
const previewVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('')

// 获取文件列表
const getFileList = async () => {
  try {
    loading.value = true
    const res = await fileApi.getFileList({
      page: currentPage.value,
      size: pageSize.value,
      fileName: searchKeyword.value
    })
    tableData.value = res.records
    total.value = res.total
  } catch (error) {
    ElMessage.error('获取文件列表失败')
    console.error('获取文件列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 添加搜索处理函数
const handleSearch = () => {
  currentPage.value = 1
  getFileList()
}

// 处理分页变化
const handleCurrentChange = (val: number) => {
  currentPage.value = val
  getFileList()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  getFileList()
}

// 格式化文件大小
const formatFileSize = (size: number) => {
  return fileApi.formatFileSize(size)
}

// 获取状态类型
const getStatusType = (status: FileInfo['status']) => {
  return fileApi.getStatusType(status)
}

// 预览文件
const handlePreview = (file: FileInfo) => {
  const fileType = file.fileExt.toLowerCase()
  const imageTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']

  if (imageTypes.includes(fileType)) {
    previewTitle.value = file.originalFileName
    previewUrl.value = fileApi.getPreviewUrl(file.id)
    previewVisible.value = true
  }
}

// 判断文件是否可预览
const isPreviewable = (fileType: string) => {
  const imageTypes = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp']
  return imageTypes.includes(fileType.toLowerCase())
}

// 下载文件
const handleDownload = (file: FileInfo) => {
  // 使用 window.open 在新窗口中打开下载链接
  window.open(fileApi.getPreviewUrl(file.id, false), '_blank')
}

// 查看文件详情
const handleDetail = async (file: FileInfo) => {
  try {
    const detail = await fileApi.getFileDetail(file.id)
    currentFile.value = detail
    detailVisible.value = true
  } catch {
    ElMessage.error('获取文件详情失败')
  }
}

// 处理标签页切换
const handleTabChange = (tab: string) => {
  if (tab === 'list') {
    getFileList()
  }
}

// 处理文件上传
const handleUpload = async (file: File) => {
  try {
    uploadLoading.value = true
    loading.value = true

    // 计算文件MD5
    loadingText.value = '计算文件特征值...'
    const md5 = await fileApi.calculateMD5(file)

    // 上传文件
    loadingText.value = '文件上传中...'
    await fileApi.uploadFile(file, md5)

    ElMessage.success('文件上传成功')
    // 如果当前在文件列表页，刷新列表
    if (activeTab.value === 'list') {
      loadingText.value = '刷新文件列表...'
      await getFileList()
    }
  } catch (error) {
    const err = error as { response?: { data?: { message?: string } } }
    ElMessage.error(err.response?.data?.message || '文件上传失败')
    loading.value = false
  } finally {
    uploadLoading.value = false
    loadingText.value = '处理中...'
  }
}

// 文件状态改变时的钩子
const handleChange = (uploadFile: UploadFile) => {
  if (uploadFile.status === 'ready') {
    handleUpload(uploadFile.raw!)
  }
}

// 页面加载时获取文件列表
onMounted(() => {
  getFileList()
})
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
        <p class="subtitle">高效的文件上传与管理解决方案</p>
      </div>

      <!-- 主要内容区域 -->
      <div class="main-content">
        <el-card class="content-card">
          <el-tabs v-model="activeTab" class="demo-tabs" @tab-change="handleTabChange">
            <!-- 文件列表 -->
            <el-tab-pane name="list">
              <template #label>
                <el-icon>
                  <Document />
                </el-icon>
                <span>文件管理</span>
              </template>
              <div class="list-container">
                <!-- 表格工具栏 -->
                <div class="table-toolbar">
                  <el-input v-model="searchKeyword" placeholder="搜索文件名" class="search-input" clearable
                    @keyup.enter="handleSearch" @clear="handleSearch">
                    <template #prefix>
                      <el-icon>
                        <Search />
                      </el-icon>
                    </template>
                    <template #append>
                      <el-button :icon="Search" @click="handleSearch">
                        搜索
                      </el-button>
                    </template>
                  </el-input>
                  <el-upload ref="uploadRef" class="upload-button" action="#" :auto-upload="false"
                    :show-file-list="false" :on-change="handleChange" :disabled="uploadLoading">
                    <el-button type="primary" :loading="uploadLoading" :icon="uploadLoading ? Loading : Upload">
                      {{ uploadLoading ? '上传中...' : '上传文件' }}
                    </el-button>
                  </el-upload>
                </div>

                <!-- 文件列表表格 -->
                <el-table v-loading="loading" :data="tableData" style="width: 100%" border :resizable="false"
                  :element-loading-text="loadingText" element-loading-spinner="el-icon-loading"
                  element-loading-background="rgba(255, 255, 255, 0.8)">
                  <template v-if="loading">
                    <el-table-column v-for="i in 5" :key="i">
                      <template #default>
                        <el-skeleton-item variant="text" style="width: 100%" />
                      </template>
                    </el-table-column>
                  </template>
                  <template v-else>
                    <el-table-column prop="fileName" label="文件名" min-width="200" show-overflow-tooltip>
                      <template #default="{ row }">
                        <div class="file-name-cell">
                          <el-icon class="file-icon">
                            <Document />
                          </el-icon>
                          <span>{{ row.originalFileName }}</span>
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="大小" width="120" align="right">
                      <template #default="{ row }">
                        {{ formatFileSize(row.fileSize) }}
                      </template>
                    </el-table-column>
                    <el-table-column prop="createTime" label="上传时间" width="180" />
                    <el-table-column label="状态" width="120" align="center">
                      <template #default="{ row }">
                        <el-tag :type="getStatusType(row.status)">
                          {{ fileApi.getStatusText(row.status) }}
                        </el-tag>
                      </template>
                    </el-table-column>
                    <el-table-column label="操作" width="220" fixed="right" align="center">
                      <template #default="{ row }">
                        <el-space>
                          <el-button link type="primary" :icon="View" @click="handlePreview(row)"
                            :disabled="!isPreviewable(row.fileExt)">
                            预览
                          </el-button>
                          <el-button link type="primary" :icon="Download" @click="handleDownload(row)">
                            下载
                          </el-button>
                          <el-button link type="info" :icon="InfoFilled" @click="handleDetail(row)">
                            详情
                          </el-button>
                        </el-space>
                      </template>
                    </el-table-column>
                  </template>
                </el-table>

                <!-- 分页 -->
                <div class="pagination-container">
                  <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50, 100]" :total="total" @size-change="handleSizeChange"
                    @current-change="handleCurrentChange" layout="total, sizes, prev, pager, next, jumper">
                    <template #sizes>
                      <el-select v-model="pageSize" @change="handleSizeChange">
                        <el-option v-for="item in [10, 20, 50, 100]" :key="item" :label="`${item}条/页`" :value="item" />
                      </el-select>
                    </template>
                    <template #total>
                      总共 {{ total }} 条记录
                    </template>
                  </el-pagination>
                </div>
              </div>
            </el-tab-pane>

            <!-- 分片上传 -->
            <el-tab-pane name="chunk">
              <template #label>
                <el-icon>
                  <Upload />
                </el-icon>
                <span>分片上传</span>
              </template>
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
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </div>
    </div>
  </div>

  <!-- 文件详情对话框 -->
  <el-dialog v-model="detailVisible" title="文件详情" width="600px" destroy-on-close>
    <el-descriptions :column="1" border>
      <el-descriptions-item label="文件ID">{{ currentFile?.id }}</el-descriptions-item>
      <el-descriptions-item label="文件名">{{ currentFile?.originalFileName }}</el-descriptions-item>
      <el-descriptions-item label="存储名">{{ currentFile?.fileName }}</el-descriptions-item>
      <el-descriptions-item label="文件类型">{{ currentFile?.fileExt }}</el-descriptions-item>
      <el-descriptions-item label="存储类型">{{ currentFile?.storageType }}</el-descriptions-item>
      <el-descriptions-item label="存储位置">{{ currentFile?.accessUrl }}</el-descriptions-item>
      <el-descriptions-item label="存储空间">{{ currentFile?.bucketName }}</el-descriptions-item>
      <el-descriptions-item label="文件大小">{{ formatFileSize(currentFile?.fileSize || 0) }}</el-descriptions-item>
      <el-descriptions-item label="文件状态">
        <el-tag :type="getStatusType(currentFile?.status || 'SUCCESS')">
          {{ fileApi.getStatusText(currentFile?.status || 'SUCCESS') }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="MD5">{{ currentFile?.md5 || '-' }}</el-descriptions-item>
      <el-descriptions-item label="上传ID">{{ currentFile?.uploadId || '-' }}</el-descriptions-item>
      <el-descriptions-item label="创建时间">{{ currentFile?.createTime }}</el-descriptions-item>
      <el-descriptions-item label="更新时间">{{ currentFile?.updateTime }}</el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <el-button @click="detailVisible = false">关闭</el-button>
    </template>
  </el-dialog>

  <!-- 预览对话框 -->
  <el-dialog v-model="previewVisible" :title="previewTitle" width="80%" destroy-on-close append-to-body
    :close-on-click-modal="false" class="preview-dialog">
    <div class="preview-container">
      <el-image v-if="previewUrl" :src="previewUrl" :preview-src-list="[previewUrl]" :initial-index="0" :zoom-rate="1.2"
        :max-scale="7" :min-scale="0.2" fit="contain" preview-teleported hide-on-click-modal class="preview-image">
        <template #placeholder>
          <div class="image-placeholder">
            <el-icon class="is-loading">
              <Loading />
            </el-icon>
            <span>加载中...</span>
          </div>
        </template>
        <template #error>
          <div class="image-error">
            <el-icon>
              <PictureFilled />
            </el-icon>
            <span>加载失败</span>
          </div>
        </template>
      </el-image>
    </div>
  </el-dialog>
</template>

<style scoped>
.file-manager {
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  background-color: var(--el-bg-color-page);
  min-height: 100vh;
}

.content-container {
  width: 100%;
  max-width: 1200px;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.welcome-header {
  text-align: center;
  padding: 2rem 0;
  position: relative;
}

.header-icon {
  font-size: 3rem;
  color: var(--el-color-primary);
  margin-bottom: 1rem;
  transition: transform 0.3s ease;
}

.welcome-header:hover .header-icon {
  transform: scale(1.1);
}

.welcome-header h1 {
  font-size: 2rem;
  color: var(--el-text-color-primary);
  margin: 0;
}

.subtitle {
  margin-top: 1rem;
  color: var(--el-text-color-secondary);
  font-size: 1.1rem;
}

.content-card {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.demo-tabs :deep(.el-tabs__item) {
  padding: 0 2rem;
}

.demo-tabs :deep(.el-tabs__item .el-icon) {
  margin-right: 8px;
  vertical-align: middle;
}

/* 普通上传样式 */
.upload-container {
  padding: 2rem;
  text-align: center;
}

.normal-uploader {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.normal-uploader :deep(.el-upload-dragger) {
  width: 100%;
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.normal-uploader :deep(.el-upload-dragger.is-dragover) {
  background-color: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.el-icon--upload,
.el-icon--loading {
  font-size: 3rem;
  color: var(--el-text-color-secondary);
  margin-bottom: 0.5rem;
}

.el-upload__text {
  font-size: 1rem;
  color: var(--el-text-color-regular);
}

.el-upload__tip {
  font-size: 0.875rem;
  color: var(--el-text-color-secondary);
  margin-top: 1rem;
}

/* 分片上传样式 */
.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  border-radius: 8px;
  border: 2px dashed var(--el-border-color);
  margin: 1rem;
  background-color: var(--el-bg-color-page);
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: var(--el-color-primary);
  transform: translateY(-2px);
}

.upload-tip {
  margin-top: 1rem;
  color: var(--el-text-color-secondary);
}

.features {
  padding: 1rem;
}

.feature-card {
  height: 100%;
  text-align: center;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
}

.feature-card h3 {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.feature-card p {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 0.9rem;
}

/* 文件列表样式 */
.list-container {
  padding: 1rem;
}

.table-toolbar {
  margin-bottom: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.search-input {
  flex: 1;
  max-width: 500px;
}

.upload-button {
  flex-shrink: 0;
}

.file-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-icon {
  font-size: 1.2em;
  color: var(--el-text-color-secondary);
}

.pagination-container {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
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

  .demo-tabs :deep(.el-tabs__item) {
    padding: 0 1rem;
  }

  .table-toolbar {
    flex-direction: column;
    gap: 1rem;
  }

  .search-input {
    width: 100%;
  }
}

.el-icon--loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

:deep(.el-image-viewer__wrapper) {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 2050;
}

:deep(.el-image-viewer__btn) {
  opacity: 0.7;
  background-color: rgb(64, 64, 64);
}

:deep(.el-image-viewer__btn:hover) {
  opacity: 1;
  background-color: var(--el-color-primary);
}

:deep(.el-image-viewer__actions) {
  opacity: 0.7;
  background-color: rgb(64, 64, 64);
}

:deep(.el-image-viewer__actions:hover) {
  opacity: 1;
}

:deep(.el-image-viewer__canvas) {
  user-select: none;
}

.preview-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.preview-container {
  height: 70vh;
  background-color: var(--el-bg-color);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-placeholder,
.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  gap: 8px;
}

.image-placeholder .el-icon,
.image-error .el-icon {
  font-size: 24px;
}
</style>
