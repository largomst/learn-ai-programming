'use client';

import { useState } from 'react';
import { ArgueReply } from '@/lib/types';
import CopyButton from '@/components/CopyButton';

interface StreamingDisplayProps {
  streamedContent: string[];
  isComplete: boolean;
  onRegenerate: () => void;
}

interface StreamingReply extends Omit<ArgueReply, 'id'> {
  isStreaming?: boolean;
  isComplete?: boolean;
}

export default function StreamingDisplay({ 
  streamedContent, 
  isComplete, 
  onRegenerate 
}: StreamingDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('复制失败:', error);
      // 降级处理
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // 将流式内容转换为显示格式
  const getDisplayReplies = (): StreamingReply[] => {
    const replies: StreamingReply[] = [];
    
    streamedContent.forEach((content, index) => {
      if (content.trim()) {
        replies.push({
          content: content.trim(),
          timestamp: Date.now(),
          isStreaming: true,
          isComplete: false
        });
      }
    });
    
    return replies;
  };

  const displayReplies = getDisplayReplies();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          正在生成吵架回复...
        </h2>
        <p className="text-gray-600">
          AI正在逐字生成您的专属回复
        </p>
        <div className="mt-2 flex justify-center space-x-1">
          <div className="w-2 h-2 bg-wechat-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-wechat-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-wechat-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {displayReplies.map((reply, index) => {
          const isStreaming = reply.isStreaming;
          const isComplete = reply.isComplete;
          
          return (
            <div
              key={`streaming-${index}`}
              className="wechat-card p-6 fade-in hover:shadow-md transition-shadow duration-200"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex items-center mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 bg-wechat-primary text-white text-sm font-medium rounded-full mr-3">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-500">
                      {isStreaming ? '正在输入...' : '已完成'}
                    </span>
                    {isStreaming && (
                      <div className="ml-2 flex space-x-1">
                        <div className="w-1 h-1 bg-wechat-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 bg-wechat-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1 h-1 bg-wechat-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {reply.content}
                    {isStreaming && !isComplete && (
                      <span className="inline-block w-1 h-5 bg-wechat-primary ml-1 animate-pulse"></span>
                    )}
                  </p>
                </div>
                {!isStreaming && (
                  <div className="flex-shrink-0">
                    <CopyButton
                      text={reply.content}
                      onCopy={() => handleCopy(reply.content, `streaming-${index}`)}
                      copied={copiedId === `streaming-${index}`}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* 额外的占位符回复 */}
        {Array.from({ length: Math.max(0, 3 - displayReplies.length) }).map((_, index) => {
          const currentIndex = displayReplies.length + index;
          return (
            <div 
              key={`placeholder-${currentIndex}`}
              className="wechat-card p-6 opacity-60"
            >
              <div className="flex items-center mb-2">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-300 text-gray-500 text-sm font-medium rounded-full mr-3">
                  {currentIndex + 1}
                </span>
                <span className="text-sm text-gray-500">
                  {isComplete ? '已完成' : '等待生成...'}
                </span>
                {!isComplete && (
                  <div className="ml-2 flex space-x-1">
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                )}
              </div>
              <p className="text-gray-400 italic">
                {isComplete ? '已生成完成' : `即将为您生成第${currentIndex + 1}条回复...`}
              </p>
            </div>
          );
        })}
      </div>

      {/* 控制按钮 */}
      <div className="text-center pt-4 space-x-3">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors duration-200"
        >
          取消生成
        </button>
      </div>
    </div>
  );
}