import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'

/**
 * 通用响应格式
 */
interface ApiResponse<T> {
  code: number
  data: T
  message: string
  timestamp?: number
}

/**
 * 请求配置的接口定义
 */
interface RequestOptions {
  // 是否返回原始响应头，比如下载文件时需要
  isReturnNativeResponse?: boolean
  // 是否返回原始数据，比如二进制数据
  isReturnRawResponse?: boolean
  // 请求头配置
  headers?: Record<string, string>
  // 是否添加时间戳
  addTimestamp?: boolean
}

/**
 * 创建 axios 实例
 * 1. 可以使用自定义配置创建实例
 * 2. 可以设置基础URL、超时时间、请求头等
 */
const service: AxiosInstance = axios.create({
  // 从环境变量获取API地址，如果没有则使用空字符串
  baseURL: import.meta.env.VITE_API_URL || '',
  // 请求超时时间：15秒
  timeout: 15000,
  // 默认请求头
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

/**
 * 请求拦截器
 * 1. 在发送请求之前做一些处理
 * 2. 比如：添加统一的 token、处理请求数据等
 */
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 获取 token
    const token = localStorage.getItem('token')
    // 如果有 token 就添加到请求头中
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 如果是 FormData 类型，不添加时间戳
    if (config.data instanceof FormData) {
      return config
    }

    // 添加时间戳参数，防止请求被缓存
    const timestamp = Date.now()
    if (config.method?.toLowerCase() === 'get') {
      // GET 请求，将时间戳添加到 URL 参数中
      config.params = { ...config.params, timestamp }
    } else {
      // POST 等请求，将时间戳添加到请求体中
      if (config.data && typeof config.data === 'object') {
        config.data = { ...config.data, timestamp }
      } else if (!config.data) {
        config.data = { timestamp }
      }
    }

    return config
  },
  (error) => {
    // 请求错误处理
    console.error('请求拦截器错误：', error)
    return Promise.reject(error)
  },
)

/**
 * 响应拦截器
 * 1. 在接收响应之前做一些处理
 * 2. 比如：处理响应数据、处理错误响应等
 */
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // 如果是二进制数据，直接返回
    const contentType = response.headers['content-type']
    if (
      contentType &&
      (contentType.includes('application/octet-stream') ||
        contentType.includes('application/pdf') ||
        contentType.includes('image/') ||
        contentType.includes('audio/') ||
        contentType.includes('video/'))
    ) {
      return response.data
    }

    const res = response.data as ApiResponse<unknown>
    // 这里可以根据后端约定的状态码判断请求是否成功
    // 例如：code === 200 表示成功
    if (res.code === 200) {
      return res.data
    }
    // 处理其他状态码
    handleErrorStatus(res.code, res.message)
    return Promise.reject(new Error(res.message || '请求失败'))
  },
  (error) => {
    // 处理 HTTP 错误响应
    console.error('响应拦截器错误：', error)
    const message = error.response?.data?.message || error.message
    // 处理错误提示
    handleErrorStatus(error.response?.status, message)
    return Promise.reject(error)
  },
)

/**
 * 处理错误状态
 * @param status 状态码
 * @param message 错误信息
 */
function handleErrorStatus(status: number, message: string) {
  switch (status) {
    case 401:
      // 未登录或 token 过期
      console.error('未登录或 token 过期')
      // 可以在这里处理登出逻辑
      break
    case 403:
      console.error('没有权限')
      break
    case 404:
      console.error('请求的资源不存在')
      break
    case 500:
      console.error('服务器错误')
      break
    default:
      console.error(message)
  }
}

/**
 * 封装 GET 请求
 * @param url 请求地址
 * @param params 请求参数
 * @param options 请求配置
 */
export function get<T>(
  url: string,
  params?: Record<string, unknown>,
  options?: RequestOptions,
): Promise<T> {
  return service.get(url, { params, ...options })
}

/**
 * 封装 POST 请求
 * @param url 请求地址
 * @param data 请求数据
 * @param options 请求配置
 */
export function post<T>(
  url: string,
  data?: Record<string, unknown> | FormData,
  options?: RequestOptions,
): Promise<T> {
  return service.post(url, data, options)
}

/**
 * 封装表单提交请求
 * @param url 请求地址
 * @param formData FormData 对象
 * @param options 请求配置
 */
export function postForm<T>(url: string, formData: FormData, options?: RequestOptions): Promise<T> {
  return service.post(url, formData, {
    ...options,
    headers: {
      'Content-Type': 'multipart/form-data',
      ...options?.headers,
    },
  })
}

/**
 * 封装文件上传请求
 * @param url 请求地址
 * @param file 文件对象
 * @param filename 文件名
 * @param options 请求配置
 */
export function uploadFile<T>(
  url: string,
  file: File,
  filename = 'file',
  options?: RequestOptions,
): Promise<T> {
  const formData = new FormData()
  formData.append(filename, file)
  return postForm(url, formData, options)
}

/**
 * 封装文件下载请求
 * @param url 请求地址
 * @param params 请求参数
 * @param filename 文件名
 */
export async function downloadFile(
  url: string,
  params?: Record<string, unknown>,
  filename?: string,
): Promise<void> {
  const response = await service.get<Blob>(url, {
    params,
    responseType: 'blob',
  })

  // 创建 Blob 对象
  const blob = new Blob([response.data])
  // 创建下载链接
  const downloadUrl = window.URL.createObjectURL(blob)
  // 创建 a 标签
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = filename || 'download'
  // 触发点击下载
  document.body.appendChild(link)
  link.click()
  // 清理
  document.body.removeChild(link)
  window.URL.revokeObjectURL(downloadUrl)
}

// 导出请求实例和封装的方法
export default {
  service,
  get,
  post,
  postForm,
  uploadFile,
  downloadFile,
}
