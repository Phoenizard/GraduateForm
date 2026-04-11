# 飞跃手册 — 26fall 申请数据收集问卷

诺丁汉大学数学+统计系毕业生申请信息收集系统。React + Vite + TailwindCSS + Supabase。

## 开发

```bash
cp .env.example .env   # 填入 Supabase 凭据
npm install
npm run dev
```

## 部署

Cloudflare Pages，构建命令 `npm run build`，输出目录 `dist`。环境变量在 Cloudflare 控制台配置。