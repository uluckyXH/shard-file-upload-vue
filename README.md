# 文件上传管理系统

一个基于 Vue 3 + TypeScript 开发的现代化文件上传管理系统，支持大文件分片上传。

## 后端项目

后端项目地址：[shard-file-upload](https://github.com/uluckyXH/shard-file-upload)

## 技术栈

- **前端框架**: Vue 3
- **开发语言**: TypeScript
- **UI 框架**: Element Plus
- **构建工具**: Vite
- **HTTP 客户端**: Axios
- **路由管理**: Vue Router
- **代码规范**: ESLint + Prettier
- **包管理器**: pnpm

## 主要功能

### 1. 文件上传

- ✨ 支持普通上传和分片上传两种模式
- 📦 大文件自动切片处理
- 🚀 分片并发上传
- 📊 实时上传进度
- ⚡ 失败分片自动重试

### 2. 文件管理

- 📋 文件列表展示
- 🔍 文件名搜索
- 📄 文件详情查看
- 🖼️ 图片文件预览
- ⬇️ 文件下载
- 📱 响应式设计

## 目录结构

```
src/
├── api/ # API 接口封装
│ └── file.ts # 文件相关接口
├── assets/ # 静态资源
├── components/ # 公共组件
├── config/ # 配置文件
│ └── index.ts # 全局配置
├── router/ # 路由配置
├── types/ # TypeScript 类型定义
├── utils/ # 工具函数
│ └── request.ts # Axios 封装
└── views/ # 页面视图
└── FileManagerView.vue # 文件管理页面
```

## API 接口说明

### 文件上传相关

1. **获取文件配置**

   - 接口：`GET /file/config`
   - 返回：分片大小、最大文件限制等配置信息

2. **初始化分片上传**

   - 接口：`POST /file/initiateMultipartUpload`
   - 参数：文件信息（文件名、大小、MD5等）
   - 返回：上传ID和文件信息

3. **上传分片**

   - 接口：`POST /file/uploadChunk`
   - 参数：分片文件、分片序号、上传ID
   - 返回：分片上传结果

4. **合并分片**
   - 接口：`POST /file/mergeChunks`
   - 参数：上传ID
   - 返回：合并结果

### 文件管理相关

1. **获取文件列表**

   - 接口：`GET /file/getByPage`
   - 参数：页码、每页数量、文件名（可选）
   - 返回：分页的文件列表数据

2. **获取文件详情**

   - 接口：`GET /file/detail/{id}`
   - 参数：文件ID
   - 返回：文件详细信息

3. **文件预览/下载**
   - 接口：`GET /file/view/{id}`
   - 参数：文件ID、是否预览
   - 返回：文件流

## 开发环境设置

1. 安装依赖

   ```bash
   pnpm install
   ```

2. 启动

   ```bash
   pnpm dev
   ```

## 许可证

[Apache License 2.0](LICENSE)
