'use client';

import { useState } from 'react';
import { ArgueReply } from '@/lib/types';
import CopyButton from '@/components/CopyButton';

interface ResultsDisplayProps {
  replies: ArgueReply[];
}

export default function ResultsDisplay({ replies }: ResultsDisplayProps) {
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

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">吵架回复</h2>
        <p className="text-gray-600">点击复制按钮快速复制回复内容</p>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {replies.map((reply, index) => (
          <div
            key={reply.id}
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
                    {new Date(reply.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {reply.content}
                </p>
              </div>
              <div className="flex-shrink-0">
                <CopyButton
                  text={reply.content}
                  onCopy={() => handleCopy(reply.content, reply.id)}
                  copied={copiedId === reply.id}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 重新生成按钮 */}
      <div className="text-center pt-4">
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center px-4 py-2 text-sm text-wechat-primary hover:text-wechat-primary-hover border border-wechat-primary hover:border-wechat-primary-hover rounded-lg transition-colors duration-200"
        >
          重新生成
        </button>
      </div>
    </div>
  );
}