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

---

## 升学参考平台（`site/`）本地预览

`site/` 子系统把问卷数据生成为 MkDocs 静态站（详见 `CLAUDE.md`）。本地手动预览步骤如下。

> **强制约束**：所有 Python 命令必须在 conda `base` 环境运行（`/opt/miniconda3`），禁止使用系统/本地 Python，禁止向本地 Python 装依赖。

### 一次性准备

```bash
conda activate base
cd site
pip install -r requirements.txt          # 安装 mkdocs-material 等依赖（仅首次）
```

凭据：在 `site/.env` 写入 Supabase 连接信息（用于从云端拉取已提交数据）：

```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

（也兼容根目录表单用的 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`。）

### 生成 + 预览（每次）

```bash
conda activate base
cd site

# 1) 拉取最新已提交数据并生成站点（写入 site/output/）
python feiyue/maker.py --source cloud
#   不想重新联网、复用上次缓存：python feiyue/maker.py --source cache

# 2) 启动本地预览服务器
cd output
mkdocs serve -a 127.0.0.1:8842
```

浏览器打开 **http://127.0.0.1:8842/GraduateForm/** 查看。`Ctrl+C` 停止。

> 端口可自选，但要避开 1024 以下的特权端口（如 80/843 会因权限不足失败）。
> `site/.cache/`、`site/output/` 均为可重生成产物，已在 `.gitignore` 忽略。