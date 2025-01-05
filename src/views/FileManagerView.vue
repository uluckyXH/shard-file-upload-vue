<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Upload, Plus, Document, View, Download, Search, InfoFilled, Loading, PictureFilled } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { fileApi } from '@/api/file'
import type { FileInfo, FileConfig, ChunkInfo } from '@/api/file'
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
const loadingText = ref('Loding...')

// 图片预览相关
const previewVisible = ref(false)
const previewUrl = ref('')
const previewTitle = ref('')

// 文件配置
const fileConfig = ref<FileConfig>({
  chunkSize: 5,
  maxFileSize: 100,
  storageType: 'LOCAL'
})

// 分片上传相关
const uploadFile = ref<File | null>(null)
const chunks = ref<ChunkInfo[]>([])
const uploadProgress = ref(0)
const currentUploadId = ref<string>('')  // 保存当前上传ID
const mergeError = ref(false)  // 合并失败标记

// 添加上传状态控制
const isUploading = ref(false)
const uploadComplete = ref(false)

// 添加控制变量
const showChunkList = ref(true)

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

// 获取文件配置
const getFileConfig = async () => {
  try {
    const config = await fileApi.getConfig()
    console.log('获取到文件配置:', config)
    fileConfig.value = config
  } catch (error) {
    console.error('获取文件配置失败:', error)
    ElMessage.error('获取文件配置失败')
  }
}

// 处理文件上传
const handleUpload = async (file: File) => {
  // 检查文件大小
  if (file.size > fileConfig.value.maxFileSize * 1024 * 1024) {
    ElMessage.error(`文件大小不能超过 ${fileConfig.value.maxFileSize}MB`)
    return
  }

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

// 绘制loding svg
const svg = `
        <path class="path" d="
          M 30 15
          L 28 17
          M 25.61 25.61
          A 15 15, 0, 0, 1, 15 30
          A 15 15, 0, 1, 1, 27.99 7.5
          L 15 15
        " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
      `

// 修改初始化上传方法，使用正确的文件大小限制
const initUpload = async (file: File) => {
  if (!file || !(file instanceof File)) {
    ElMessage.error('无效的文件')
    return
  }

  try {
    // 检查文件大小（使用后端配置的maxFileSize，单位是MB）
    if (file.size > fileConfig.value.maxFileSize * 1024 * 1024) {
      ElMessage.error(`文件大小不能超过 ${fileConfig.value.maxFileSize}MB`)
      return
    }

    // 检查文件是否可读
    try {
      const slice = file.slice(0, 1024)
      await slice.arrayBuffer()
    } catch (error) {
      console.error('文件读取测试失败:', error)
      ElMessage.error('文件无法读取，请检查文件权限或重新选择文件')
      return
    }

    loadingText.value = '初始化上传...'
    loading.value = true

    // 计算文件MD5
    try {
      loadingText.value = '计算文件特征值...'
      const md5 = await fileApi.calculateMD5(file)

      // 准备文件信息
      const fileInfo: Partial<FileInfo> = {
        originalFileName: file.name,
        fileSize: file.size,
        md5: md5
      }

      // 初始化分片上传
      const result = await fileApi.initiateMultipartUpload(fileInfo)
      console.log('初始化成功:', result)

      // 开始上传分片
      await uploadChunks(result.uploadId!)
    } catch (error) {
      console.error('文件处理失败:', error)
      const err = error as Error
      ElMessage.error(err.message || '文件处理失败，请重试')
      throw error
    }
  } catch (error) {
    console.error('初始化上传失败:', error)
    // 清理状态
    uploadFile.value = null
    chunks.value = []
  } finally {
    loading.value = false
    loadingText.value = '处理中...'
  }
}

// 修改文件选择处理方法
const handleFileSelect = async (event: Event) => {
  // 如果正在上传或已完成但未确认，不允许选择新文件
  if (isUploading.value || uploadComplete.value) {
    ElMessage.warning('请等待当前上传完成并确认后再选择新文件')
    return
  }

  const input = event.target as HTMLInputElement
  if (!input.files || input.files.length === 0) {
    return
  }

  try {
    const file = input.files[0]

    // 检查文件大小（使用后端配置的maxFileSize，单位是MB）
    if (file.size > fileConfig.value.maxFileSize * 1024 * 1024) {
      ElMessage.error(`文件大小不能超过 ${fileConfig.value.maxFileSize}MB`)
      return
    }

    // 检查文件是否为空
    if (file.size === 0) {
      ElMessage.error('不能上传空文件')
      return
    }

    uploadFile.value = file
    // 创建文件分片（使用后端配置的chunkSize，单位是MB）
    chunks.value = fileApi.createFileChunks(file, fileConfig.value.chunkSize)
    // 初始化上传
    await initUpload(file)
  } catch (error) {
    console.error('文件处理失败:', error)
    const err = error as Error
    ElMessage.error(err.message || '文件处理失败，请重新选择文件')
  } finally {
    // 重置 input，确保可以重新选择相同的文件
    input.value = ''
  }
}

// 更新总进度的方法
const updateTotalProgress = () => {
  const totalProgress = chunks.value.reduce((sum, chunk) => sum + chunk.progress, 0)
  uploadProgress.value = Math.floor(totalProgress / chunks.value.length)
}

// 修改上传单个分片的方法
const uploadSingleChunk = async (chunk: ChunkInfo) => {
  try {
    chunk.status = 'uploading'
    await fileApi.uploadChunk(currentUploadId.value, chunk)
    chunk.status = 'success'
    chunk.progress = 100
    // 更新总进度
    updateTotalProgress()
    return true
  } catch (error) {
    console.error(`分片 ${chunk.index + 1} 上传失败:`, error)
    chunk.status = 'error'
    chunk.progress = 0
    // 更新总进度
    updateTotalProgress()
    return false
  }
}

// 修改重试上传单个分片的方法
const retryChunk = async (chunk: ChunkInfo) => {
  if (!currentUploadId.value) {
    ElMessage.error('上传ID已失效，请重新上传')
    return
  }
  const success = await uploadSingleChunk(chunk)
  if (success) {
    // 检查是否所有分片都上传成功
    checkAndMerge()
  }
}

// 检查并合并分片
const checkAndMerge = async () => {
  const allSuccess = chunks.value.every(chunk => chunk.status === 'success')
  if (allSuccess) {
    await mergeChunks()
  }
}

// 合并分片
const mergeChunks = async () => {
  try {
    loadingText.value = '合并文件中...'
    loading.value = true
    mergeError.value = false

    await fileApi.mergeChunks(currentUploadId.value)
    ElMessage.success('文件上传成功')

    // 不再立即清理状态，等待用户确认
    if (activeTab.value === 'list') {
      await getFileList()
    }
  } catch (error) {
    console.error('文件合并失败:', error)
    ElMessage.error('文件合并失败')
    mergeError.value = true
  } finally {
    loading.value = false
    loadingText.value = '处理中...'
  }
}

// 重试合并
const retryMerge = async () => {
  if (!currentUploadId.value) {
    ElMessage.error('上传ID已失效，请重新上传')
    return
  }
  await mergeChunks()
}

// 修改上传分片的方法
const uploadChunks = async (uploadId: string) => {
  try {
    loading.value = true
    loadingText.value = '上传分片中...'
    currentUploadId.value = uploadId
    mergeError.value = false
    isUploading.value = true

    // 串行上传分片
    for (let i = 0; i < chunks.value.length; i++) {
      const chunk = chunks.value[i]
      await uploadSingleChunk(chunk)
    }

    // 检查是否所有分片都上传成功
    const allSuccess = chunks.value.every(chunk => chunk.status === 'success')
    if (allSuccess) {
      await mergeChunks()
      uploadComplete.value = true
    }
  } catch (error) {
    console.error('分片上传失败:', error)
    ElMessage.error('分片上传失败')
  } finally {
    loading.value = false
    loadingText.value = '处理中...'
    isUploading.value = false
  }
}

// 添加确认完成方法
const confirmUpload = () => {
  // 清理状态
  chunks.value = []
  uploadProgress.value = 0
  uploadFile.value = null
  currentUploadId.value = ''
  uploadComplete.value = false
  // 重置文件输入框
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
  if (fileInput) {
    fileInput.value = ''
  }
}

// 修改计算属性，失败的排在最上面，其他按索引排序
const sortedChunks = computed(() => {
  return [...chunks.value].sort((a, b) => {
    // 失败的排在最上面
    if (a.status === 'error' && b.status !== 'error') return -1
    if (b.status === 'error' && a.status !== 'error') return 1
    // 其他情况按照索引排序
    return a.index - b.index
  })
})

// 页面加载时获取文件列表
onMounted(() => {
  getFileConfig()
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
                    :show-file-list="false" :on-change="handleChange" :disabled="uploadLoading" :accept="'*'">
                    <el-tooltip effect="dark" :content="`单文件大小限制: ${fileConfig.maxFileSize}MB`" placement="top">
                      <el-button type="primary" :loading="uploadLoading" :icon="uploadLoading ? Loading : Upload">
                        {{ uploadLoading ? '上传中...' : '上传文件' }}
                      </el-button>
                    </el-tooltip>
                  </el-upload>
                </div>

                <!-- 文件列表表格 -->
                <el-table v-loading="loading" :data="tableData" style="width: 100%" border :resizable="false"
                  :element-loading-text="loadingText" :element-loading-svg="svg"
                  element-loading-svg-view-box="-10, -10, 50, 50" element-loading-background="rgba(255, 255, 255, 0.9)">
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
              <div class="upload-area" @click="$refs.fileInput.click()">
                <input type="file" ref="fileInput" style="display: none" @change="handleFileSelect"
                  :disabled="isUploading || uploadComplete">
                <el-button type="primary" size="large" :icon="Plus" :disabled="isUploading || uploadComplete">
                  {{ isUploading ? '上传中...' : uploadComplete ? '上传完成' : '选择文件' }}
                </el-button>
                <p class="upload-tip">
                  支持大文件上传，自动进行分片处理
                  <br>
                  <small>
                    单文件大小限制: {{ fileConfig.maxFileSize }}MB，
                    分片大小: {{ fileConfig.chunkSize }}MB
                  </small>
                </p>
              </div>

              <!-- 分片上传进度 -->
              <div v-if="chunks.length > 0" class="chunks-progress">
                <div class="progress-header">
                  <div class="progress-info">
                    <h3>{{ uploadFile?.name }}</h3>
                    <p>总进度: {{ uploadProgress }}%</p>
                  </div>
                  <el-button link type="primary" @click="showChunkList = !showChunkList">
                    {{ showChunkList ? '隐藏分片' : '显示分片' }}
                  </el-button>
                </div>
                <el-progress :percentage="uploadProgress" />

                <!-- 分片列表 -->
                <div v-show="showChunkList" class="chunks-list-container">
                  <div class="chunks-list">
                    <div v-for="chunk in sortedChunks" :key="chunk.hash" class="chunk-item">
                      <span>分片 {{ chunk.index + 1 }}</span>
                      <div class="chunk-progress">
                        <el-progress :percentage="chunk.progress"
                          :status="chunk.status === 'error' ? 'exception' : undefined" />
                        <el-button v-if="chunk.status === 'error'" type="primary" link @click="retryChunk(chunk)">
                          重试
                        </el-button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 合并失败时显示重试按钮 -->
                <div v-if="mergeError" class="merge-error">
                  <el-alert title="文件合并失败" type="error" :closable="false" show-icon>
                    <template #default>
                      请点击重试按钮进行重新合并
                    </template>
                  </el-alert>
                  <el-button type="primary" @click="retryMerge">
                    重试合并
                  </el-button>
                </div>

                <!-- 上传完成后显示确认按钮 -->
                <div v-if="uploadComplete" class="upload-complete">
                  <el-alert title="文件上传成功" type="success" :closable="false" show-icon>
                    <template #default>
                      点击确认按钮开始新的上传
                    </template>
                  </el-alert>
                  <el-button type="primary" @click="confirmUpload">
                    确认完成
                  </el-button>
                </div>
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

:deep(.el-loading-spinner) {
  .path {
    stroke: var(--el-color-primary);
    stroke-linecap: round;
    animation: dash 1.5s ease-in-out infinite;
  }

  .el-loading-text {
    font-size: 14px;
    margin-top: 8px;
  }
}

.chunks-progress {
  margin: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--el-bg-color-page);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .progress-info {
    display: flex;
    align-items: center;
    gap: 1rem;

    h3 {
      margin: 0;
      font-size: 1rem;
      color: var(--el-text-color-primary);
    }

    p {
      margin: 0;
      color: var(--el-text-color-secondary);
    }
  }
}

.chunks-list-container {
  position: relative;
  max-height: 300px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.chunks-list {
  padding: 0.5rem;
  overflow-y: auto;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.chunk-item {
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem;
  background-color: var(--el-bg-color);
  border-radius: 4px;

  &.chunk-success {
    opacity: 0.8;
  }

  span {
    min-width: 80px;
    color: var(--el-text-color-secondary);
  }
}

.chunk-progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 1rem;

  .el-progress {
    flex: 1;
  }
}

.merge-error {
  margin-top: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;

  .el-alert {
    width: 100%;
  }
}

.upload-complete {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;

  .el-alert {
    width: 100%;
  }
}

/* 分片列表动画 */
.chunk-list-move {
  transition: transform 0.5s ease;
}
</style>
