# 飞跃手册 — 诺丁汉大学数学+统计系升学参考平台

仓库含两部分：

- **升学参考平台（`site/`）** — 由已收集数据生成的 MkDocs 静态站，**当前维护中**，数据已冻结在仓库内、构建离线。Fork 部署见文末。
- **申请数据收集问卷（`src/`，React + Vite + Supabase）** — 26fall 数据已收集完毕，**表单现已停用**，源码保留作记录。下面「问卷开发 / 部署」两节仅供参考。

## 问卷开发（已停用）

> 表单依赖 Supabase 后端，26fall 收集已结束，无需再运行。以下步骤仅为历史留存。

```bash
cp .env.example .env   # 填入 Supabase 凭据
npm install
npm run dev
```

## 问卷部署（已停用）

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

数据已冻结在仓库内（`site/data/frozen/`），构建全程离线，**无需任何 Supabase 凭据或网络**。

### 生成 + 预览（每次）

```bash
conda activate base
cd site

# 1) 读取冻结数据并生成站点（写入 site/output/）
python feiyue/maker.py

# 2) 启动本地预览服务器
cd output
mkdocs serve -a 127.0.0.1:8842
```

浏览器打开 **http://127.0.0.1:8842/GraduateForm/** 查看。`Ctrl+C` 停止。

> 端口可自选，但要避开 1024 以下的特权端口（如 80/843 会因权限不足失败）。
> `site/.cache/`、`site/output/` 均为可重生成产物，已在 `.gitignore` 忽略。

---

## Fork 后部署自己的升学站

升学站（`site/`）已是自包含的静态项目：数据冻结在仓库、构建离线、**workflow 不依赖任何 Secret**。Fork 后按以下步骤即可部署到你自己账户名下的 GitHub Pages。

> 只涉及升学站。仓库根目录的问卷表单（`src/`）已废弃，无需理会。

### 1. 启用 Actions

Fork 来的仓库默认禁用 Actions（GitHub 安全策略）。进入你的 fork：
**Settings → Actions → General → Actions permissions → 选 "Allow all actions and reusable workflows" → Save。**

### 2. 改模板里的仓库地址

编辑 `site/templates/mkdocs.jinja` 顶部，把 4 处 `Phoenizard` / `GraduateForm` 换成你自己的 GitHub 用户名与仓库名：

```yaml
site_url: https://<你的用户名>.github.io/<你的仓库名>/
repo_name: <你的用户名>/<你的仓库名>
repo_url: https://github.com/<你的用户名>/<你的仓库名>/
```

不改也能部署，但站内的规范链接、编辑与仓库入口会指回原仓库。

`site/resources/` 下的部分文章（前言、DIY、保研）正文里也内嵌了仓库链接，如需一并替换：

```bash
cd site && grep -rl "Phoenizard/GraduateForm" resources/
```

### 3. 触发构建

把上述改动 push 到你 fork 的 `main` 分支（改动落在 `site/**`，会自动触发），或到
**Actions → publish-site → Run workflow** 手动触发一次。

Workflow 会离线构建并用 `mkdocs gh-deploy --force` 把成品推到 **`gh-pages` 分支**。

### 4. 开启 GitHub Pages

首次部署后，`gh-pages` 分支才会出现。然后：
**Settings → Pages → Source 选 "Deploy from a branch" → Branch 选 `gh-pages` / `(root)` → Save。**

等一两分钟，站点上线于 **https://<你的用户名>.github.io/<你的仓库名>/**。

### 更新数据 / 内容

数据已冻结、不再更新。若要改文章、模板或资源，编辑 `site/` 下对应文件并 push，Action 会自动重建部署。若要换成你自己的一批数据，替换 `site/data/frozen/` 的 4 个 JSON（结构见 `CLAUDE.md`）。