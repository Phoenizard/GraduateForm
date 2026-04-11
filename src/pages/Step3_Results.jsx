import { useEffect } from 'react';
import { useFormStore } from '../store/formStore';
import TextInput from '../components/fields/TextInput';
import SingleChoice from '../components/fields/SingleChoice';
import MatrixText from '../components/fields/MatrixText';

const q9StatusOptions = [
  { value: 'decided', label: '我的去向已定' },
  { value: 'undecided_willing', label: '我的去向未定，愿意后续更新' },
  { value: 'undecided_not', label: '我的去向未定，不愿意后续更新' },
];

const q10Rows = [
  { key: 'q10_gpa_pct', label: '均分', placeholder: '如：70/70/70；大三70' },
  { key: 'q10_gpa_4', label: 'GPA', placeholder: '如：3.85/4.0' },
  { key: 'q10_language', label: '语言', placeholder: '如：雅思 7（6.5）' },
  { key: 'q10_gre', label: 'GRE/GMAT', placeholder: '如：GRE 325+3.5' },
];

const q14Options = [
  { value: 'none', label: '我没有未出结果的项目' },
  { value: 'willing', label: '我有未出结果的项目，愿意更新' },
  { value: 'not_willing', label: '我有未出结果的项目，不愿意更新' },
];

export default function Step3_Results() {
  const q9Status = useFormStore((s) => s.formData.q9_status);

  useEffect(() => {
    if (q9Status && q9Status !== 'decided') {
      useFormStore.getState().clearFields(['q9_text']);
    }
  }, [q9Status]);

  return (
    <div className="space-y-8">
      <SingleChoice
        label="最终去向"
        fieldKey="q9_status"
        options={q9StatusOptions}
        required
      />

      {q9Status === 'decided' && (
        <TextInput
          label="去向详情"
          fieldKey="q9_text"
          required
          placeholder="学校全称 + 项目全称，如：University of Nottingham MS in Statistics"
        />
      )}

      <MatrixText
        label="申请三维"
        rows={q10Rows}
        required
      />

      <TextInput
        label="Admission（录取）"
        fieldKey="q11"
        required
        multiline
        placeholder={"学校, 项目, (con), (timeline)\n如：University of Nottingham, MSc in Statistics, con 40, 12.1提交-3.1offer"}
      />

      <TextInput
        label="Waitlist"
        fieldKey="q12"
        required={false}
        multiline
        placeholder="学校, 项目, (timeline)"
      />

      <TextInput
        label="Reject（拒信）"
        fieldKey="q13"
        required={false}
        multiline
        placeholder="学校, 项目, (timeline)"
      />

      <SingleChoice
        label="是否有未出结果的项目"
        fieldKey="q14"
        options={q14Options}
        required
      />
    </div>
  );
}
