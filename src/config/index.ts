interface AppConfig {
  title: string
  apiUrl: string
  uploadSizeLimit: number
  chunkSize: number
}

const config: AppConfig = {
  title: import.meta.env.VITE_APP_TITLE,
  apiUrl: import.meta.env.VITE_API_URL,
  // 转换为字节
  uploadSizeLimit: Number(import.meta.env.VITE_UPLOAD_SIZE_LIMIT) * 1024 * 1024,
  chunkSize: Number(import.meta.env.VITE_CHUNK_SIZE) * 1024 * 1024,
}

export default config
