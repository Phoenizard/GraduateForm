import { useEffect } from 'react';
import { useFormStore } from '../store/formStore';
import TextInput from '../components/fields/TextInput';
import SingleChoice from '../components/fields/SingleChoice';
import MultiEntryField from '../components/fields/MultiEntryField';

const yearOptions = [
  { value: '大一', label: '大一' },
  { value: '大二', label: '大二' },
  { value: '大三', label: '大三' },
  { value: '大四', label: '大四' },
];

const q16Fields = [
  { key: 'time', label: '时间', type: 'select', options: yearOptions, hint: '如果是假期，比如大二考完放的暑假期间，记为大二' },
  { key: 'institution', label: '机构/地点', type: 'text' },
  { key: 'title', label: '项目名称/职位', type: 'text', placeholder: '如XXX项目或Research Assistant' },
  { key: 'advisor', label: '指导老师', type: 'text', optional: true },
  { key: 'duration', label: '时长', type: 'text' },
  { key: 'content', label: '项目内容', type: 'textarea', optional: true, placeholder: '如和XXX领域方向相关', fullWidth: true },
  { key: 'output', label: '产出', type: 'text', optional: true, fullWidth: true },
];

const q17Fields = [
  { key: 'time', label: '时间', type: 'select', options: yearOptions, hint: '如果是假期，比如大二考完放的暑假期间，记为大二' },
  { key: 'company', label: '企业/地点', type: 'text', optional: true },
  { key: 'duration', label: '时长', type: 'text' },
  { key: 'content', label: '工作内容', type: 'textarea', optional: true, fullWidth: true },
];

export default function Step4_Experience() {
  const q15 = useFormStore((s) => s.formData.q15);

  useEffect(() => {
    if (q15 === 'not_willing') {
      useFormStore.getState().clearFields(['q16', 'q17', 'q18', 'q19', 'q20']);
    }
  }, [q15]);

  return (
    <div className="space-y-6">
      <SingleChoice
        label="是否愿意提供个人经历信息"
        fieldKey="q15"
        required
        options={[
          { value: 'willing', label: '愿意' },
          { value: 'not_willing', label: '不愿意' },
        ]}
      />

      {q15 === 'willing' && (
        <>
          <MultiEntryField
            label="科研/项目经历"
            fieldKey="q16"
            fields={q16Fields}
            legacyKey="content"
          />
          <MultiEntryField
            label="实习经历"
            fieldKey="q17"
            fields={q17Fields}
            legacyKey="content"
          />
          <TextInput
            label="推荐信"
            fieldKey="q19"
            multiline
            placeholder="实习/学术；数量等"
          />
          <TextInput
            label="荣誉奖项"
            fieldKey="q20"
            multiline
            placeholder={"时间 / 项目类型 / 奖项\n如：2023.2 美赛 H奖"}
          />
        </>
      )}
    </div>
  );
}
