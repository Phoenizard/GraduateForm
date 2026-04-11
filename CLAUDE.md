# 飞跃手册问卷系统 — CLAUDE.md

## 项目概述

为诺丁汉大学数学系收集26fall毕业生申请信息的问卷系统。
核心特点：**无需注册账号，手机号/邮箱直接登录即自动创建草稿，支持多次保存后提交。**

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React + Vite + TailwindCSS |
| 后端/数据库 | Supabase（免费层） |
| 部署 | Cloudflare Pages |

## 项目结构

```
/
├── CLAUDE.md
├── PLAN.md
├── .env.example
├── package.json
├── vite.config.js
├── tailwind.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── lib/
    │   └── supabase.js          # Supabase 客户端初始化
    ├── components/
    │   ├── LoginGate.jsx        # 手机/邮箱登录入口
    │   ├── ProgressBar.jsx      # 分页进度条
    │   ├── AutoSaveIndicator.jsx# 草稿保存状态提示
    │   └── fields/
    │       ├── TextInput.jsx
    │       ├── SingleChoice.jsx
    │       ├── MultiChoice.jsx
    │       └── MatrixText.jsx
    ├── pages/
    │   ├── Step1_Basic.jsx      # 题 1-3：基本信息
    │   ├── Step2_Background.jsx # 题 4-8：申请背景
    │   ├── Step3_Results.jsx    # 题 9-14：申请结果
    │   ├── Step4_Experience.jsx # 题 15-20：个人经历
    │   ├── Step5_Agency.jsx     # 题 21-25：中介/DIY
    │   ├── Step6_Essay.jsx      # 题 26：申请经验长文
    │   └── ThankYou.jsx         # 提交成功页
    ├── store/
    │   └── formStore.js         # Zustand 全局状态（表单数据 + 用户身份）
    └── hooks/
        └── useAutoSave.js       # debounce 自动保存 hook
```

## 关键业务规则

### 身份系统
- 用户在 `LoginGate` 输入手机号**或**邮箱（二选一）
- 提交后查询 `users` 表：存在则返回该用户草稿，不存在则自动 INSERT 新用户
- 身份信息存入 `localStorage`（`fybk_user_id`），刷新页面不需重新登录
- 无密码、无验证码、无第三方账号

### 草稿自动保存
- 每个 Step 页面内容变化后，经 **1500ms debounce** 触发保存
- 保存到 Supabase `submissions` 表的 `draft` JSON 字段（UPSERT）
- 页面顶部显示"保存中…" / "已保存 HH:MM" / "保存失败，请检查网络"
- 用户回到页面时自动从 `draft` 恢复所有字段

### 提交逻辑
- 最后一步点击"提交"：将 `draft` 数据写入正式字段，`status` 改为 `submitted`
- 提交后跳转 `ThankYou` 页，不可再编辑

### 题目依赖（条件显示）规则

| 题号 | 显示条件 | 实现方式 |
|------|---------|---------|
| Q3 联系方式填写 | Q2 选项值为 `1` 或 `2`（愿意提供） | `watch Q2` |
| Q9 去向填写框 | Q9 单选选"去向已定" | `watch Q9_status === 'decided'` |
| Q16-Q20（经历详情） | Q15 === `'willing'` | `watch Q15` |
| Q23（中介分享） | Q21 ∈ `['full','half']` **且** Q22 === `'yes'` | `watch Q21 && Q22` |
| Q24（DIY有无分享） | Q21 === `'diy'` | `watch Q21` |
| Q25（DIY详情） | Q24 === `'yes'` | `watch Q24` |

条件不满足时，对应字段**清空并隐藏**，不参与校验。

### 必填 / 选填规则

| 题号 | 必填 |
|------|-----|
| Q1 姓名代号 | ✅ |
| Q2 联系方式意愿 | ✅ |
| Q3 联系方式内容 | ❌ 选填（条件显示后仍选填） |
| Q4 本科专业 | ✅ |
| Q5 申请学位 | ✅ |
| Q6 申请偏好 | ✅ |
| Q7 申请地区 | ✅ |
| Q8 申请目的 | ✅ |
| Q9 最终去向（状态） | ✅ |
| Q9 去向填写框 | ✅（仅当选"已定"时） |
| Q10 申请三维 | ✅（允许填"无"） |
| Q11 Admission | ✅ |
| Q12 Waitlist | ❌ 选填 |
| Q13 Reject | ❌ 选填（原必填，已改） |
| Q14 未出项目状态 | ✅ |
| Q15 愿意提供经历 | ✅ |
| Q16-Q20 经历详情 | ❌ 选填（条件显示后仍选填） |
| Q21 申请方式 | ✅ |
| Q22 中介分享意愿 | ✅（仅全包/半包时显示） |
| Q23 中介分享内容 | ❌ 选填 |
| Q24 DIY分享意愿 | ✅（仅DIY时显示） |
| Q25 DIY分享内容 | ❌ 选填 |
| Q26 申请经验 | ❌ 选填 |

## Supabase 数据库 Schema

```sql
-- 用户表（手机/邮箱自动注册）
create table users (
  id uuid primary key default gen_random_uuid(),
  identifier text unique not null,  -- 手机号或邮箱，统一存储
  identifier_type text not null check (identifier_type in ('phone', 'email')),
  created_at timestamptz default now()
);

-- 问卷提交表
create table submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  status text default 'draft' check (status in ('draft', 'submitted')),
  draft jsonb default '{}',          -- 草稿完整数据（JSON）
  submitted_at timestamptz,
  updated_at timestamptz default now(),
  -- 提交后展开的正式字段（便于后台查询，从draft复制）
  q1_name text,
  q2_contact_willing text,
  q4_major text,
  q5_degree text[],
  q6_direction text[],
  q7_region text[],
  q8_purpose text[],
  q9_destination_status text,
  q9_destination text,
  q11_admission text,
  q21_apply_method text,
  created_at timestamptz default now()
);

-- Row Level Security（开启，允许匿名读写自己的数据）
alter table users enable row level security;
alter table submissions enable row level security;

-- 任何人可创建用户（首次登录）
create policy "allow_insert_users" on users for insert with check (true);
create policy "allow_select_users" on users for select using (true);

-- 用户只能读写自己的 submission（通过 user_id 匹配）
create policy "allow_own_submission" on submissions
  using (user_id = (select id from users where identifier = current_setting('app.current_user_identifier', true)));
```

> **注意**：Supabase 免费层 RLS 使用 `anon` key，前端直接操作数据库。
> 通过在每次请求前设置 `app.current_user_identifier` session 变量实现简单隔离。
> 这不是高安全级别方案，适合本项目的低敏感度场景。

## 环境变量

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## 开发命令

```bash
npm install
npm run dev      # 本地开发
npm run build    # 构建，输出 dist/
```

## Cloudflare Pages 部署

- Build command: `npm run build`
- Build output directory: `dist`
- 环境变量在 Cloudflare Pages 控制台添加

## 代码规范

- 组件用函数式 + hooks，不用 class
- 状态管理用 Zustand（`formStore.js`），不用 Redux
- 样式全部用 TailwindCSS，不写自定义 CSS 文件
- 中文界面，所有用户可见文字用中文
- 自动保存失败时**不阻断用户操作**，仅显示提示
