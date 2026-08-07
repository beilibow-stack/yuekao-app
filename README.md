# 粤考上岸计划

面向微信内使用的移动端广东省考学习 H5，使用 Next.js App Router、TypeScript 和 Tailwind CSS。

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

在 `.env.local` 中填写所选模型服务的 API Key。API Key 只由服务端 Route Handler 读取。

## 构建

```bash
npm run build
```

## Vercel

导入 GitHub 仓库后，在 Project Settings → Environment Variables 配置：

- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`
部署于 Vercel
