# 飞跃手册问卷系统 — 开发计划 PLAN.md

## 开发顺序总览

```
Phase 0：项目初始化
Phase 1：Supabase 数据库 & 客户端
Phase 2：登录入口（LoginGate）
Phase 3：全局状态 & 自动保存
Phase 4：问卷分页（Step 1-6）
Phase 5：提交 & 感谢页
Phase 6：收尾与部署
```

每个 Phase 完成后需自测，确认无报错再进入下一阶段。

---

## Phase 0：项目初始化

**目标**：跑通本地开发环境

```bash
npm create vite@latest fybk-survey -- --template react
cd fybk-survey
npm install
npm install @supabase/supabase-js zustand
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

配置 `tailwind.config.js`：
```js
content: ["./index.html", "./src/**/*.{js,jsx}"]
```

在 `src/index.css` 顶部添加：
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

创建 `.env.local`（填入真实 Supabase 凭据）：
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

创建 `.env.example`（留空值，提交到 git）：
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

✅ 验收：`npm run dev` 能打开默认页面

---

## Phase 1：Supabase 数据库 & 客户端

**目标**：数据库建好，前端能连通

### 1.1 在 Supabase 控制台执行 SQL

复制 `CLAUDE.md` 中的完整 Schema SQL，在 Supabase SQL Editor 中执行。
确认 `users` 和 `submissions` 两张表创建成功，RLS 已开启。

### 1.2 创建 `src/lib/supabase.js`

```js
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### 1.3 封装用户操作函数（在 `src/lib/supabase.js` 追加）

```js
// 登录或自动注册：返回 { userId, isNew }
export async function loginOrRegister(identifier) {
  const type = identifier.includes('@') ? 'email' : 'phone'

  // 查找已有用户
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('identifier', identifier)
    .single()

  if (existing) return { userId: existing.id, isNew: false }

  // 新用户自动注册
  const { data: created, error } = await supabase
    .from('users')
    .insert({ identifier, identifier_type: type })
    .select('id')
    .single()

  if (error) throw error
  return { userId: created.id, isNew: true }
}

// 加载草稿
export async function loadDraft(userId) {
  const { data } = await supabase
    .from('submissions')
    .select('id, draft')
    .eq('user_id', userId)
    .eq('status', 'draft')
    .single()
  return data  // 可能为 null（首次）
}

// 保存草稿（UPSERT）
export async function saveDraft(userId, submissionId, draft) {
  if (submissionId) {
    return supabase
      .from('submissions')
      .update({ draft, updated_at: new Date().toISOString() })
      .eq('id', submissionId)
  } else {
    return supabase
      .from('submissions')
      .insert({ user_id: userId, draft, status: 'draft' })
      .select('id')
      .single()
  }
}

// 最终提交
export async function submitForm(submissionId, draft) {
  return supabase
    .from('submissions')
    .update({
      status: 'submitted',
      draft,
      submitted_at: new Date().toISOString(),
      // 展开关键字段供后台查询
      q1_name: draft.q1,
      q2_contact_willing: draft.q2,
      q4_major: draft.q4,
      q5_degree: draft.q5,
      q6_direction: draft.q6,
      q7_region: draft.q7,
      q8_purpose: draft.q8,
      q9_destination_status: draft.q9_status,
      q9_destination: draft.q9_text,
      q11_admission: draft.q11,
      q21_apply_method: draft.q21,
    })
    .eq('id', submissionId)
}
```

✅ 验收：在浏览器控制台手动调用 `loginOrRegister('test@test.com')` 能在 Supabase 看到新用户

---

## Phase 2：登录入口（LoginGate）

**目标**：用户输入手机/邮箱后进入问卷，刷新不丢失登录状态

### 2.1 创建 `src/store/formStore.js`

```js
import { create } from 'zustand'

export const useFormStore = create((set) => ({
  // 用户身份
  userId: null,
  submissionId: null,
  // 表单数据（与 draft JSON 字段一一对应）
  formData: {},
  // 自动保存状态
  saveStatus: 'idle',  // 'idle' | 'saving' | 'saved' | 'error'
  // 当前步骤
  currentStep: 1,

  setUser: (userId, submissionId) => set({ userId, submissionId }),
  setFormData: (data) => set((s) => ({ formData: { ...s.formData, ...data } })),
  setField: (key, value) => set((s) => ({ formData: { ...s.formData, [key]: value } })),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setStep: (step) => set({ currentStep: step }),
  setSubmissionId: (id) => set({ submissionId: id }),
}))
```

### 2.2 创建 `src/components/LoginGate.jsx`

界面要求：
- 居中卡片，标题"飞跃手册问卷 · 26Fall"
- 副标题说明："输入您的手机号或邮箱即可开始填写，下次凭同样的信息继续编辑"
- 单个输入框（placeholder: "手机号或邮箱"）
- "开始填写"按钮
- 输入验证：非空，且符合手机号（11位数字）或邮箱格式（含@）
- 按钮 loading 状态（提交时禁用）
- 错误提示文字（网络失败时显示）

登录逻辑：
1. 调用 `loginOrRegister(identifier)`
2. 调用 `loadDraft(userId)` 获取草稿
3. 将 `userId`、`submissionId`、`draft` 数据存入 Zustand store
4. 将 `userId` 和 `identifier` 存入 `localStorage`（key: `fybk_user_id`, `fybk_identifier`）

### 2.3 修改 `src/App.jsx`

启动时检查 `localStorage`：
- 有记录 → 静默恢复登录（调用 `loadDraft`），直接显示问卷
- 无记录 → 显示 `LoginGate`

✅ 验收：登录后刷新页面不需要重新输入，且草稿数据已恢复

---

## Phase 3：全局 UI 框架 & 自动保存

**目标**：问卷外壳、进度条、自动保存机制就位

### 3.1 创建 `src/hooks/useAutoSave.js`

```js
import { useEffect, useRef } from 'react'
import { useFormStore } from '../store/formStore'
import { saveDraft } from '../lib/supabase'

export function useAutoSave() {
  const { userId, submissionId, formData, setSaveStatus, setSubmissionId } = useFormStore()
  const timer = useRef(null)

  useEffect(() => {
    if (!userId) return
    setSaveStatus('saving')
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const result = await saveDraft(userId, submissionId, formData)
        // 首次保存后记录 submissionId
        if (!submissionId && result.data?.id) {
          setSubmissionId(result.data.id)
        }
        setSaveStatus('saved')
      } catch {
        setSaveStatus('error')
      }
    }, 1500)
    return () => clearTimeout(timer.current)
  }, [formData])
}
```

### 3.2 创建 `src/components/ProgressBar.jsx`

- 显示当前步骤 / 总步骤（共6步）
- 简单线性进度条
- 显示步骤名称（基本信息 / 申请背景 / 申请结果 / 个人经历 / 中介DIY / 申请经验）

### 3.3 创建 `src/components/AutoSaveIndicator.jsx`

- `saving`：灰色旋转图标 + "保存中…"
- `saved`：绿色勾 + "已保存 HH:MM"
- `error`：红色 ! + "保存失败，请检查网络"
- `idle`：不显示

### 3.4 创建基础字段组件（`src/components/fields/`）

**TextInput.jsx**：单行文本输入，接收 `label, fieldKey, required, placeholder`

**SingleChoice.jsx**：单选题，接收 `label, fieldKey, options: [{value, label}], required`

**MultiChoice.jsx**：多选题，接收 `label, fieldKey, options, required`；包含"其他"选项时，选中后显示附加文本框

**MatrixText.jsx**：矩阵文本题，接收 `label, rows: [{key, label, placeholder}]`；每行一个输入框

所有字段组件：
- 读取/写入 `useFormStore` 的 `formData`
- 调用 `setField(key, value)` 更新状态
- 必填未填时边框变红，显示"此项为必填"

✅ 验收：在任意字段输入内容，1.5秒后顶部显示"已保存 HH:MM"，Supabase 数据库 draft 字段更新

---

## Phase 4：问卷分页（Step 1-6）

**目标**：完整实现6个步骤页面，含所有依赖逻辑

每个 Step 组件结构：
- 顶部：`<ProgressBar />` + `<AutoSaveIndicator />`
- 中部：该步骤的题目（使用字段组件）
- 底部：`<上一步>` `<下一步>` 按钮（首步无上一步，末步改为"提交"）
- 点击下一步前校验当前步骤必填项

### Step 1：基本信息（题 1-3）

```
Q1：TextInput，label="姓名（缩写或代号）"，required
Q2：SingleChoice，label="联系方式意愿"，options:
    - { value: '1', label: '我愿意提供联系方式，并公开' }
    - { value: '2', label: '我愿意提供联系方式，不公开（仅用于后续数据完善）' }
    - { value: '3', label: '我不愿意提供联系方式' }
Q3：MatrixText，条件显示（Q2 === '1' || Q2 === '2'）
    rows: [
      { key: 'q3_email', label: '邮箱', placeholder: '' },
      { key: 'q3_wechat', label: '微信', placeholder: '' },
      { key: 'q3_other', label: '其他', placeholder: '' },
    ]
    非必填，Q2 不满足条件时清空 q3_* 字段
```

### Step 2：申请背景（题 4-8）

```
Q4：SingleChoice，label="本科专业"，required，options:
    - { value: 'math_2p2', label: '数学与应用数学（2+2）' }
    - { value: 'math_4p0', label: '数学与应用数学（4+0）' }
    - { value: 'stats', label: '统计' }

Q5：MultiChoice，label="申请学位"，required，options:
    - { value: 'phd', label: '博士' }
    - { value: 'master', label: '硕士' }

Q6：MultiChoice，label="申请方向偏好"，required，options:
    - Statistics / Data Science / ML_AI / 金融数学_金融统计
    - 纯数 / 应用数学_计算数学 / 生物统计 / Analytics_BA
    - 运筹 / 经管类 / 其他（带附加文本框）

Q7：MultiChoice，label="申请地区偏好"，required，options:
    - 英国 / 美国 / 香港 / 新加坡 / 澳大利亚 / 欧陆 / 其他

Q8：MultiChoice，label="申请目的"，required，options:
    - 回国就业 / 留外就业 / 继续深造 / 其他
```

### Step 3：申请结果（题 9-14）

```
Q9：组合题
    先显示 SingleChoice，label="最终去向"，required，options:
    - { value: 'decided', label: '我的去向已定' }
    - { value: 'undecided_willing', label: '我的去向未定，愿意后续更新' }
    - { value: 'undecided_not', label: '我的去向未定，不愿意后续更新' }
    当选 'decided' 时，额外显示 TextInput（fieldKey='q9_text'，required，
    placeholder="学校全称 + 项目全称，如：University of Nottingham MS in Statistics"）

Q10：MatrixText，label="申请三维"，required（允许填"无"），
    rows: [
      { key: 'q10_gpa_pct', label: '均分', placeholder: '如：70/70/70；大三70' },
      { key: 'q10_gpa_4', label: 'GPA', placeholder: '如：3.85/4.0' },
      { key: 'q10_language', label: '语言', placeholder: '如：雅思 7（6.5）' },
      { key: 'q10_gre', label: 'GRE/GMAT', placeholder: '如：GRE 325+3.5' },
    ]

Q11：TextInput（多行 textarea），label="Admission（录取）"，required
    placeholder="学校, 项目, (con), (timeline)\n如：University of Nottingham, MSc in Statistics, con 40, 12.1提交-3.1offer"

Q12：TextInput（多行 textarea），label="Waitlist"，非必填
    placeholder="学校, 项目, (timeline)"

Q13：TextInput（多行 textarea），label="Reject（拒信）"，非必填（已改）
    placeholder="学校, 项目, (timeline)"

Q14：SingleChoice，label="是否有未出结果的项目"，required，options:
    - { value: 'none', label: '我没有未出结果的项目' }
    - { value: 'willing', label: '我有未出结果的项目，愿意更新' }
    - { value: 'not_willing', label: '我有未出结果的项目，不愿意更新' }
```

### Step 4：个人经历（题 15-20）

```
Q15：SingleChoice，label="是否愿意提供个人经历信息"，required，options:
    - { value: 'willing', label: '愿意' }
    - { value: 'not_willing', label: '不愿意' }

以下 Q16-Q20 均在 Q15 === 'willing' 时显示，非必填：
Q15 切换为 'not_willing' 时清空 q16-q20 所有字段

Q16：TextInput（多行），label="科研经历"
    placeholder="时间 / 地点 / 项目名称或指导老师 / 持续时间 / 有无产出\n如：大二暑假，unnc校内科研，xxxx项目，3个月，无产出"

Q17：TextInput（多行），label="实习经历"
    placeholder="时间 / 地点 / 工作内容 / 持续时间\n如：大一暑假，杭州，xxx公司，xxxx工作内容，2个月"

Q18：TextInput（多行），label="项目经历"
    placeholder="时间 / 内容等"

Q19：TextInput（多行），label="推荐信"
    placeholder="实习/学术；数量等"

Q20：TextInput（多行），label="荣誉奖项"
    placeholder="时间 / 项目类型 / 奖项\n如：2023.2 美赛 H奖"
```

### Step 5：中介 / DIY（题 21-25）

```
Q21：SingleChoice，label="申请方式"，required，options:
    - { value: 'full', label: '全包' }
    - { value: 'half', label: '半包' }
    - { value: 'diy', label: 'DIY' }
    - { value: 'other', label: '其他' }

--- 全包/半包分支（Q21 ∈ ['full','half']）---

Q22：SingleChoice，label="是否有中介相关分享"，required（条件显示），options:
    - { value: 'yes', label: '有（避雷 / 大力推荐）' }
    - { value: 'no', label: '无' }
    Q21 切换离开时清空 q22, q23

Q23：TextInput（多行），条件显示（Q21 ∈ ['full','half'] 且 Q22 === 'yes'），非必填
    label="中介分享（可透露具体名称）"
    placeholder="可从以下方面入手：选校精准度 / 文书质量 / 沟通效率 / 费用合理性 / 服务态度"
    Q22 切换为 'no' 时清空 q23

--- DIY 分支（Q21 === 'diy'）---

Q24：SingleChoice，label="是否有 DIY 相关分享"，required（条件显示），options:
    - { value: 'yes', label: '有' }
    - { value: 'no', label: '无' }
    Q21 切换离开时清空 q24, q25

Q25：TextInput（多行），条件显示（Q24 === 'yes'），非必填
    label="DIY 申请分享"
    placeholder="可参考：如何确定申请学校和项目？选校最看重哪些因素？如何安排申请时间线？如何准备面试？...（自由发挥）"
    Q24 切换为 'no' 时清空 q25
```

### Step 6：申请经验（题 26）

```
Q26：TextInput（多行，高度较大），label="申请经验心得"，非必填
    placeholder="可参考方向：选校与专业 / 标化成绩准备 / 推荐信筹备 / 个人陈述与简历 / 暑期科研与实习 / 其他建议（自由发挥）"

底部按钮改为"提交问卷"
点击后先做最终校验（所有步骤必填项），通过后调用 submitForm()
提交成功 → 跳转 ThankYou 页
提交失败 → 显示错误提示，不跳转
```

✅ 验收：完整走一遍问卷，依赖显示/隐藏逻辑正确，必填校验正确，草稿随时可恢复

---

## Phase 5：提交 & 感谢页

### ThankYou.jsx

内容：
- 标题："感谢您的分享！🎉"
- 正文："您的申请经历将帮助未来的学弟学妹少走弯路。"
- 如果 Q2 选择"愿意公开联系方式"，额外显示："您的联系方式将在飞跃手册中公开，欢迎学弟学妹直接联系您。"
- 不提供"返回修改"按钮（提交即终态）

✅ 验收：提交后 Supabase 中 status 变为 submitted，ThankYou 页正常显示

---

## Phase 6：收尾与部署

### 6.1 本地最终测试清单

- [ ] 全新用户登录 → 创建草稿 → 分步填写 → 草稿自动保存
- [ ] 中途关闭页面 → 重新打开 → 草稿恢复，回到上次停留步骤
- [ ] 依赖题目切换（Q2→Q3 / Q9→填写框 / Q15→Q16-20 / Q21→Q22-25）
- [ ] 必填校验：未填必填项时无法进入下一步
- [ ] 最终提交 → ThankYou 页 → Supabase status = submitted
- [ ] 移动端布局可用（输入框不被键盘遮挡）

### 6.2 Cloudflare Pages 部署步骤

1. 将代码推送到 GitHub 仓库
2. 在 Cloudflare Pages 连接该仓库
3. Build command: `npm run build`
4. Build output: `dist`
5. 在 Pages 控制台添加环境变量：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. 触发部署，验证线上访问

### 6.3 部署后验证

- 线上能正常登录
- 草稿保存指向正确的 Supabase 实例
- 手机端浏览器可正常使用

---

## 附：字段 Key 速查表

| 题号 | fieldKey | 类型 |
|------|----------|------|
| Q1 | `q1` | string |
| Q2 | `q2` | string ('1'/'2'/'3') |
| Q3 邮箱 | `q3_email` | string |
| Q3 微信 | `q3_wechat` | string |
| Q3 其他 | `q3_other` | string |
| Q4 | `q4` | string |
| Q5 | `q5` | string[] |
| Q6 | `q6` | string[] |
| Q6 其他文本 | `q6_other_text` | string |
| Q7 | `q7` | string[] |
| Q8 | `q8` | string[] |
| Q9 状态 | `q9_status` | string |
| Q9 去向文本 | `q9_text` | string |
| Q10 均分 | `q10_gpa_pct` | string |
| Q10 GPA | `q10_gpa_4` | string |
| Q10 语言 | `q10_language` | string |
| Q10 GRE | `q10_gre` | string |
| Q11 | `q11` | string |
| Q12 | `q12` | string |
| Q13 | `q13` | string |
| Q14 | `q14` | string |
| Q15 | `q15` | string |
| Q16 | `q16` | string |
| Q17 | `q17` | string |
| Q18 | `q18` | string |
| Q19 | `q19` | string |
| Q20 | `q20` | string |
| Q21 | `q21` | string |
| Q22 | `q22` | string |
| Q23 | `q23` | string |
| Q24 | `q24` | string |
| Q25 | `q25` | string |
| Q26 | `q26` | string |
