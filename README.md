# ZHI主页

纯前端 + JSON 的个人主页与 AI 工具导航，基于 Astro 静态站点。

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
npm run preview
```

## 部署

### Vercel
- 直接导入仓库即可
- 可选环境变量：`PUBLIC_UMAMI_ID`、`PUBLIC_UMAMI_SRC`

### GitHub Pages
1. 开启 Pages：Settings → Pages → Source: GitHub Actions
2. 推送到 `main` 分支即可自动部署
3. 如需自定义域名，设置 `SITE_URL` 环境变量为你的域名

## 数据编辑

- `public/data/profile.json`
- `public/data/tools.json`
- `public/data/logs.json`

日志可选字段：
- `pinned`: `true/false` 置顶

工具可选字段：
- `category`: 分类名称（用于筛选）
- `weight`: 权重（数值越大越靠前）
- `featured`: 是否推荐（true/false）

## Umami 统计

设置环境变量：

```bash
PUBLIC_UMAMI_ID=你的站点ID
PUBLIC_UMAMI_SRC=https://analytics.umami.is/script.js
```

## GitHub Pages 本地构建 (可选)

```bash
SITE_URL=https://<用户名>.github.io BASE_PATH=/zhi-home/ npm run build
```
