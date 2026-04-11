import { useState } from 'react';
import { useFormStore } from '../store/formStore';
import { revertToDraft } from '../lib/supabase';

export default function ThankYou() {
  const q2 = useFormStore((s) => s.formData.q2);
  const [reverting, setReverting] = useState(false);

  const handleReEdit = async () => {
    setReverting(true);
    try {
      const state = useFormStore.getState();
      const { error } = await revertToDraft(state.submissionId);
      if (error) throw error;
      state.setSubmitted(false);
      state.setStep(1);
    } catch {
      alert('操作失败，请稍后重试');
    } finally {
      setReverting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">感谢您的分享！</h1>
        <p className="text-gray-700 mb-4">
          您的申请经历将帮助未来的学弟学妹少走弯路。
        </p>
        {q2 === '1' && (
          <p className="text-gray-600 mb-6">
            您的联系方式将在飞跃手册中公开，欢迎学弟学妹直接联系您。
          </p>
        )}
        <button
          type="button"
          onClick={handleReEdit}
          disabled={reverting}
          className="mt-4 px-6 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
        >
          {reverting ? '处理中…' : '重新填写'}
        </button>
        <p className="text-xs text-gray-400 mt-2">在原有答案基础上修改，修改后需重新提交</p>
      </div>
    </div>
  );
}
