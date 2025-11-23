'use client';

import { useState, useCallback } from 'react';
import InputForm from '@/components/InputForm';
import ResultsDisplay, { useStreamingOutput } from '@/components/ResultsDisplay';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ArgueReply, FormData } from '@/lib/types';
import DeepSeekService from '@/lib/deepseek';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [replies, setReplies] = useState<ArgueReply[]>([]);
  const [error, setError] = useState<string | null>(null);

  // 使用流式输出的Hook
  const {
    isStreaming,
    unifiedContent,
    error: streamingError,
    startStreaming,
    addContent,
    completeStreaming,
    handleError
  } = useStreamingOutput(
    () => {
    },
    (allContent: string) => {
      // 解析完整的流式内容并设置回复
      const apiService = DeepSeekService.getInstance();
      const parsedReplies = apiService.parseReplies(allContent);
      
      const newReplies: ArgueReply[] = parsedReplies.map((content, index) => ({
        id: `reply-${Date.now()}-${index}`,
        content: content.trim(),
        timestamp: Date.now(),
      }));
      
      setReplies(newReplies);
    },
    (errorMessage: string) => {
      setError(errorMessage);
    }
  );

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
      
      // 使用流式输出
      startStreaming();
      
      let currentReplyIndex = 0;
      
      await apiService.generateRepliesStream(
        formData.opponentMessage,
        formData.intensity,
        {
          onMessage: (content: string) => {
            // 简单的回复索引跟踪
            if (content.trim().match(/^\d+[.、]/)) {
              currentReplyIndex++;
            }
            addContent(content, Math.min(currentReplyIndex, 2)); // 限制在3个回复内
          },
          onComplete: (fullContent: string) => {
            // 流式输出完成，解析所有内容
            const parsedReplies = apiService.parseReplies(fullContent);
            
            const newReplies: ArgueReply[] = parsedReplies.map((content, index) => ({
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
            completeStreaming(fullContent);
          },
          onError: (error: Error) => {
            setError(error.message);
            handleError(error.message);
          }
        }
      );
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '生成回复失败，请重试';
      setError(errorMessage);
      handleError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [startStreaming, addContent, completeStreaming, handleError, setReplies, setError]);

  const handleRegenerate = useCallback(() => {
    // 重新生成功能，回到初始状态
    const lastSession = JSON.parse(localStorage.getItem('argue-sessions') || '[]')[0];
    if (lastSession) {
      handleGenerate({
        opponentMessage: lastSession.opponentMessage,
        intensity: lastSession.intensity
      });
    }
  }, [handleGenerate, setReplies, setError]);

  return (
    <div className="min-h-screen bg-[#1B1511]">
      {/* 头部 */}
      <header className="bg-transparent border-b border-[#3A2A1F]">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-[#F4C169] to-[#FF9C3A] bg-clip-text text-transparent">
            吵架包赢
          </h1>
          <p className="mt-2 text-center text-[#CBB693]">
            输入对方的话，选择语气强度，让AI帮你生成有力的回复
            {isStreaming && <span className="text-wechat-primary ml-2">• 正在流式输出</span>}
          </p>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* 输入表单 */}
          <InputForm onSubmit={handleGenerate} disabled={isLoading || isStreaming} />

          {/* 错误提示 */}
          {(error || streamingError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error || streamingError}
            </div>
          )}

          {/* 加载状态 */}
          {isLoading && !isStreaming && (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          )}

          {/* 流式内容显示 */}
          {isStreaming && (
            <ResultsDisplay 
              replies={[]} 
              onRegenerate={() => {}}
              isStreaming={true}
              unifiedContent={unifiedContent}
            />
          )}

          {/* 结果展示 */}
          {!isLoading && !isStreaming && replies.length > 0 && (
            <ResultsDisplay 
              replies={replies} 
              onRegenerate={handleRegenerate}
              isStreaming={false}
            />
          )}
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-transparent border-t border-[#3A2A1F] mt-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-center text-[#B39A7C] text-sm">
            © 2024 吵架包赢. 由 DeepSeek AI 驱动
            {isStreaming && <span className="text-wechat-primary ml-1">• 流式输出已启用</span>}
          </p>
        </div>
      </footer>
    </div>
  );
}
