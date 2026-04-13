import { useEffect, useRef } from 'react';
import { useFormStore } from '../store/formStore';
import TextInput from '../components/fields/TextInput';
import SingleChoice from '../components/fields/SingleChoice';

export default function Step5_Agency() {
  const q21 = useFormStore((s) => s.formData.q21);
  const q22 = useFormStore((s) => s.formData.q22);
  const q24 = useFormStore((s) => s.formData.q24);
  const prevQ21 = useRef(q21);

  useEffect(() => {
    const prev = prevQ21.current;
    prevQ21.current = q21;
    if (prev === q21) return;

    const wasAgency = prev === 'full' || prev === 'half';
    const isAgency = q21 === 'full' || q21 === 'half';
    const wasDiy = prev === 'diy';
    const isDiy = q21 === 'diy';

    const clear = useFormStore.getState().clearFields;
    if (wasAgency && !isAgency) clear(['q22', 'q23']);
    if (wasDiy && !isDiy) clear(['q24', 'q25']);
  }, [q21]);

  useEffect(() => {
    if (q22 === 'no') {
      useFormStore.getState().clearFields(['q23']);
    }
  }, [q22]);

  useEffect(() => {
    if (q24 === 'no') {
      useFormStore.getState().clearFields(['q25']);
    }
  }, [q24]);

  const isAgency = q21 === 'full' || q21 === 'half';
  const isDiy = q21 === 'diy';

  return (
    <div className="space-y-6">
      <SingleChoice
        label="申请方式"
        fieldKey="q21"
        required
        options={[
          { value: 'full', label: '全包' },
          { value: 'half', label: '半包' },
          { value: 'diy', label: 'DIY' },
          { value: 'other', label: '其他' },
        ]}
      />

      {isAgency && (
        <>
          <SingleChoice
            label="是否有中介相关分享"
            fieldKey="q22"
            required
            options={[
              { value: 'yes', label: '有（避雷 / 大力推荐）' },
              { value: 'no', label: '无' },
            ]}
          />
          {q22 === 'yes' && (
            <TextInput
              label="中介分享（可透露具体名称）"
              fieldKey="q23"
              multiline
              hint="可从以下方面入手：选校精准度 / 文书质量 / 沟通效率 / 费用合理性 / 服务态度"
            />
          )}
        </>
      )}

      {isDiy && (
        <>
          <SingleChoice
            label="是否有 DIY 相关分享"
            fieldKey="q24"
            required
            options={[
              { value: 'yes', label: '有' },
              { value: 'no', label: '无' },
            ]}
          />
          {q24 === 'yes' && (
            <TextInput
              label="DIY 申请分享"
              fieldKey="q25"
              multiline
              hint="可参考：如何确定申请学校和项目？选校最看重哪些因素？如何安排申请时间线？如何准备面试？...（自由发挥）"
            />
          )}
        </>
      )}
    </div>
  );
}
