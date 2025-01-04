import { get, postForm } from '@/utils/request'
import config from '@/config'

// 文件信息接口
export interface FileInfo {
  id: number
  fileName: string
  originalFileName: string
  fileExt: string
  storageType: string
  accessUrl: string
  md5: string | null
  uploadId: string | null
  status: 'SUCCESS' | 'FAILED' | 'UPLOADING'
  bucketName: string
  fileSize: number
  createTime: string
  updateTime: string
}

// 分页响应接口
export interface PageResponse<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 分页参数接口
export interface PageParams {
  page: number
  size: number
  fileName?: string
}

/**
 * 文件管理相关接口
 */
export const fileApi = {
  /**
   * 分页获取文件列表
   * @param params 分页参数
   * @returns 文件列表分页数据
   */
  getFileList(params: PageParams): Promise<PageResponse<FileInfo>> {
    return get('/file/getByPage', {
      page: params.page,
      size: params.size,
      fileName: params.fileName,
    })
  },

  /**
   * 获取文件详情
   * @param id 文件ID
   * @returns 文件详情
   */
  getFileDetail(id: number): Promise<FileInfo> {
    return get(`/file/detail/${id}`)
  },

  /**
   * 获取文件预览链接
   * @param id 文件ID
   * @param preview 是否为预览模式
   * @returns 预览链接
   */
  getPreviewUrl(id: string | number, preview = true): string {
    const baseUrl = config.apiUrl
    return `${baseUrl}/file/view/${id}?preview=${preview}`
  },

  /**
   * 下载文件
   * @param id 文件ID
   * @param filename 自定义下载文件名
   */
  downloadFile(id: string | number): void {
    const url = this.getPreviewUrl(id, false)
    window.open(url, '_blank')
  },

  /**
   * 格式化文件大小
   * @param size 文件大小（字节）
   * @returns 格式化后的文件大小
   */
  formatFileSize(size: number): string {
    if (size < 1024) {
      return size + ' 字节'
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + ' KB'
    } else if (size < 1024 * 1024 * 1024) {
      return (size / (1024 * 1024)).toFixed(2) + ' MB'
    } else {
      return (size / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
    }
  },

  /**
   * 获取文件状态显示文本
   */
  getStatusText(status: FileInfo['status']): string {
    const statusMap: Record<FileInfo['status'], string> = {
      SUCCESS: '上传成功',
      FAILED: '上传失败',
      UPLOADING: '上传中',
    }
    return statusMap[status]
  },

  /**
   * 获取文件状态显示样式
   * @param status 文件状态
   * @returns Element Plus 的 tag 类型
   */
  getStatusType(status: FileInfo['status']): 'success' | 'warning' | 'danger' {
    const statusMap: Record<FileInfo['status'], 'success' | 'warning' | 'danger'> = {
      SUCCESS: 'success',
      FAILED: 'danger',
      UPLOADING: 'warning',
    }
    return statusMap[status]
  },

  /**
   * 上传文件
   * @param file 文件对象
   * @param md5 文件MD5值
   * @returns 文件访问地址
   */
  uploadFile(file: File, md5: string): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('md5', md5)
    return postForm('/file/upload', formData)
  },

  /**
   * 计算文件MD5
   * @param file 文件对象
   * @returns MD5值
   */
  async calculateMD5(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const buffer = e.target?.result
          const md5 = await window.crypto.subtle.digest('SHA-256', buffer as ArrayBuffer)
          const hashArray = Array.from(new Uint8Array(md5))
          const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
          resolve(hashHex)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    })
  },
}
