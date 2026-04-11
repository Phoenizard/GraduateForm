import { useEffect } from 'react';
import { useFormStore } from '../store/formStore';
import TextInput from '../components/fields/TextInput';
import SingleChoice from '../components/fields/SingleChoice';

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
          <TextInput
            label="科研经历"
            fieldKey="q16"
            multiline
            placeholder={"时间 / 地点 / 项目名称或指导老师 / 持续时间 / 有无产出\n如：大二暑假，unnc校内科研，xxxx项目，3个月，无产出"}
          />
          <TextInput
            label="实习经历"
            fieldKey="q17"
            multiline
            placeholder={"时间 / 地点 / 工作内容 / 持续时间\n如：大一暑假，杭州，xxx公司，xxxx工作内容，2个月"}
          />
          <TextInput
            label="项目经历"
            fieldKey="q18"
            multiline
            placeholder="时间 / 内容等"
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
