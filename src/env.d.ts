/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
  readonly VITE_UPLOAD_SIZE_LIMIT: string
  readonly VITE_CHUNK_SIZE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
