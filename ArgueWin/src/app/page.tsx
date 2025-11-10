'use client';

import { useState, useCallback } from 'react';
import InputForm from '@/components/InputForm';
import ResultsDisplay from '@/components/ResultsDisplay';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ArgueReply, FormData } from '@/lib/types';
import DeepSeekService from '@/lib/deepseek';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [replies, setReplies] = useState<ArgueReply[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async (formData: FormData) => {
    if (!formData.opponentMessage.trim()) {
      setError('请输入对方的话');
      return;
    }

    setIsLoading(true);
    setError(null);
    setReplies([]);

    try {
      const apiService = DeepSeekService.getInstance();
      const generatedReplies = await apiService.generateReplies(
        formData.opponentMessage,
        formData.intensity
      );

      const newReplies: ArgueReply[] = generatedReplies.map((content, index) => ({
        id: `reply-${Date.now()}-${index}`,
        content: content.trim(),
        timestamp: Date.now(),
      }));

      setReplies(newReplies);

      // 保存到本地存储
      const sessionData = {
        id: `session-${Date.now()}`,
        opponentMessage: formData.opponentMessage,
        intensity: formData.intensity,
        replies: newReplies,
        createdAt: Date.now(),
      };

      // 存储到localStorage
      const existingSessions = JSON.parse(localStorage.getItem('argue-sessions') || '[]');
      existingSessions.unshift(sessionData);
      
      // 只保留最近10个会话
      if (existingSessions.length > 10) {
        existingSessions.splice(10);
      }
      
      localStorage.setItem('argue-sessions', JSON.stringify(existingSessions));
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成回复失败，请重试');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-center text-gray-900">
            吵架包赢
          </h1>
          <p className="mt-2 text-center text-gray-600">
            输入对方的话，选择语气强度，让AI帮你生成有力的回复
          </p>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* 输入表单 */}
          <InputForm onSubmit={handleGenerate} disabled={isLoading} />

          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* 加载状态 */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {/* 结果展示 */}
          {!isLoading && replies.length > 0 && (
            <ResultsDisplay replies={replies} />
          )}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-gray-500 text-sm">
            © 2024 吵架包赢. 由 DeepSeek AI 驱动
          </p>
        </div>
      </footer>
    </div>
  );
}