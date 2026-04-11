import { useFormStore } from '../store/formStore'

const STEPS = ['基本信息', '申请背景', '申请结果', '个人经历', '中介DIY', '申请经验']

export default function ProgressBar() {
  const currentStep = useFormStore((s) => s.currentStep)

  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs text-gray-500 mb-2">
        <span>第 {currentStep} / {STEPS.length} 步</span>
        <span>{STEPS[currentStep - 1]}</span>
      </div>
      <div className="flex gap-1">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < currentStep ? 'bg-blue-500' : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
