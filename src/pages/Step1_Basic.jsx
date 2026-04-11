import { useEffect } from 'react';
import { useFormStore } from '../store/formStore';
import TextInput from '../components/fields/TextInput';
import SingleChoice from '../components/fields/SingleChoice';
import MatrixText from '../components/fields/MatrixText';

const q2Options = [
  { value: '1', label: '我愿意提供联系方式，并公开' },
  { value: '2', label: '我愿意提供联系方式，不公开（仅用于后续数据完善）' },
  { value: '3', label: '我不愿意提供联系方式' },
];

const q3Rows = [
  { key: 'q3_email', label: '邮箱', placeholder: '' },
  { key: 'q3_wechat', label: '微信', placeholder: '' },
  { key: 'q3_other', label: '其他', placeholder: '' },
];

export default function Step1_Basic() {
  const q2 = useFormStore((s) => s.formData.q2);

  const showQ3 = q2 === '1' || q2 === '2';

  useEffect(() => {
    if (q2 === '3') {
      useFormStore.getState().clearFields(['q3_email', 'q3_wechat', 'q3_other']);
    }
  }, [q2]);

  return (
    <div className="space-y-8">
      <TextInput
        label="姓名（缩写或代号）"
        fieldKey="q1"
        required
      />

      <SingleChoice
        label="联系方式意愿"
        fieldKey="q2"
        options={q2Options}
        required
      />

      {showQ3 && (
        <MatrixText
          label="联系方式"
          rows={q3Rows}
          required={false}
        />
      )}
    </div>
  );
}
