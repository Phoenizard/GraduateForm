import SingleChoice from '../components/fields/SingleChoice';
import MultiChoice from '../components/fields/MultiChoice';

const q4Options = [
  { value: 'math_2p2', label: '数学与应用数学（2+2）' },
  { value: 'math_4p0', label: '数学与应用数学（4+0）' },
  { value: 'stats', label: '统计' },
];

const q5Options = [
  { value: 'phd', label: '博士' },
  { value: 'master', label: '硕士' },
];

const q6Options = [
  { value: 'statistics', label: 'Statistics' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'ml_ai', label: 'ML/AI' },
  { value: 'fin_math', label: '金融数学/金融统计' },
  { value: 'pure_math', label: '纯数' },
  { value: 'applied_math', label: '应用数学/计算数学' },
  { value: 'biostat', label: '生物统计' },
  { value: 'analytics', label: 'Analytics/BA' },
  { value: 'or', label: '运筹' },
  { value: 'business', label: '经管类' },
  { value: 'other', label: '其他' },
];

const q7Options = [
  { value: 'uk', label: '英国' },
  { value: 'us', label: '美国' },
  { value: 'hk', label: '香港' },
  { value: 'sg', label: '新加坡' },
  { value: 'au', label: '澳大利亚' },
  { value: 'eu', label: '欧陆' },
  { value: 'other', label: '其他' },
];

const q8Options = [
  { value: 'return_work', label: '回国就业' },
  { value: 'overseas_work', label: '留外就业' },
  { value: 'further_study', label: '继续深造' },
  { value: 'other', label: '其他' },
];

export default function Step2_Background() {
  return (
    <div className="space-y-8">
      <SingleChoice
        label="本科专业"
        fieldKey="q4"
        options={q4Options}
        required
      />

      <MultiChoice
        label="申请学位"
        fieldKey="q5"
        options={q5Options}
        required
      />

      <MultiChoice
        label="申请方向偏好"
        fieldKey="q6"
        options={q6Options}
        required
        otherKey="q6_other_text"
      />

      <MultiChoice
        label="申请地区偏好"
        fieldKey="q7"
        options={q7Options}
        required
      />

      <MultiChoice
        label="申请目的"
        fieldKey="q8"
        options={q8Options}
        required
      />
    </div>
  );
}
