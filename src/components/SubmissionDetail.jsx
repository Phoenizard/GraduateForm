const FIELD_LABELS = [
  { key: 'q1', label: 'Q1 姓名/代号' },
  { key: 'q2', label: 'Q2 联系方式意愿' },
  { key: 'q3_email', label: 'Q3 邮箱' },
  { key: 'q3_wechat', label: 'Q3 微信' },
  { key: 'q3_other', label: 'Q3 其他联系方式' },
  { key: 'q4', label: 'Q4 本科专业' },
  { key: 'q5', label: 'Q5 申请学位' },
  { key: 'q6', label: 'Q6 申请方向偏好' },
  { key: 'q6_other_text', label: 'Q6 其他方向' },
  { key: 'q7', label: 'Q7 申请地区' },
  { key: 'q8', label: 'Q8 申请目的' },
  { key: 'q9_status', label: 'Q9 最终去向状态' },
  { key: 'q9_text', label: 'Q9 去向详情' },
  { key: 'q10_gpa_pct', label: 'Q10 均分' },
  { key: 'q10_gpa_4', label: 'Q10 GPA' },
  { key: 'q10_language', label: 'Q10 语言成绩' },
  { key: 'q10_gre', label: 'Q10 GRE/GMAT' },
  { key: 'q11', label: 'Q11 Admission', structured: true },
  { key: 'q12', label: 'Q12 Waitlist', structured: true },
  { key: 'q13', label: 'Q13 Reject', structured: true },
  { key: 'q14', label: 'Q14 未出结果项目' },
  { key: 'q15', label: 'Q15 愿意提供经历' },
  { key: 'q16', label: 'Q16 科研/项目经历', structured: true },
  { key: 'q17', label: 'Q17 实习经历', structured: true },
  { key: 'q19', label: 'Q19 推荐信' },
  { key: 'q20', label: 'Q20 荣誉奖项' },
  { key: 'q21', label: 'Q21 申请方式' },
  { key: 'q22', label: 'Q22 中介分享意愿' },
  { key: 'q23', label: 'Q23 中介分享内容' },
  { key: 'q24', label: 'Q24 DIY分享意愿' },
  { key: 'q25', label: 'Q25 DIY分享内容' },
  { key: 'q26', label: 'Q26 申请经验心得' },
]

const ENTRY_FIELD_LABELS = {
  school: '学校',
  project: '项目',
  submitTime: '提交时间',
  receiveTime: '收到时间',
  cond: 'Cond',
  scholarship: '奖学金',
  note: '备注',
  time: '时间',
  institution: '机构/地点',
  title: '项目名称/职位',
  advisor: '指导老师',
  duration: '时长',
  content: '内容',
  output: '产出',
  company: '企业/地点',
}

function formatValue(val) {
  if (val == null || val === '') return '未填写'
  if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') return val.join('、')
  return String(val)
}

function formatEntries(val) {
  // Legacy string format
  if (typeof val === 'string') return val || '未填写'
  if (!Array.isArray(val) || val.length === 0) return null
  return val
}

function StructuredEntries({ entries }) {
  const formatted = formatEntries(entries)
  if (formatted === null) return <span className="text-sm text-gray-300">未填写</span>
  if (typeof formatted === 'string') {
    return <span className={`text-sm whitespace-pre-wrap ${formatted === '未填写' ? 'text-gray-300' : 'text-gray-900'}`}>{formatted}</span>
  }
  return (
    <div className="space-y-2 w-full">
      {formatted.map((entry, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3 text-sm space-y-1">
          {Object.entries(entry).map(([k, v]) => {
            if (!v) return null
            return (
              <div key={k} className="flex gap-2">
                <span className="text-gray-400 shrink-0">{ENTRY_FIELD_LABELS[k] || k}:</span>
                <span className="text-gray-900">{v}</span>
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export default function SubmissionDetail({ submission, onClose }) {
  const draft = submission.draft || {}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-lg w-full max-w-2xl max-h-[85vh] overflow-y-auto m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{draft.q1 || '未填写姓名'}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              状态：{submission.status === 'submitted' ? '已提交' : '草稿'}
              {submission.submitted_at && ` · 提交于 ${new Date(submission.submitted_at).toLocaleString('zh-CN')}`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-4 space-y-3">
          {FIELD_LABELS.map(({ key, label, structured }) => {
            const val = draft[key]
            if (structured) {
              return (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-500">{label}</span>
                  <StructuredEntries entries={val} />
                </div>
              )
            }
            const display = formatValue(val)
            return (
              <div key={key} className="flex flex-col sm:flex-row sm:gap-4">
                <span className="text-sm font-medium text-gray-500 sm:w-40 shrink-0">{label}</span>
                <span className={`text-sm whitespace-pre-wrap ${display === '未填写' ? 'text-gray-300' : 'text-gray-900'}`}>
                  {display}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export { FIELD_LABELS }
