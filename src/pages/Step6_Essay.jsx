import TextInput from '../components/fields/TextInput';

export default function Step6_Essay() {
  return (
    <div className="space-y-6">
      <TextInput
        label="申请经验心得"
        fieldKey="q26"
        multiline
        rows={8}
        placeholder="可参考方向：选校与专业 / 标化成绩准备 / 推荐信筹备 / 个人陈述与简历 / 暑期科研与实习 / 其他建议（自由发挥）"
      />
    </div>
  );
}
