'use client';

import { useState, useEffect } from 'react';
import { ArgueReply } from '@/lib/types';
import CopyButton from '@/components/CopyButton';

interface ResultsDisplayProps {
  replies: ArgueReply[];
  onRegenerate: () => void;
  isStreaming?: boolean;
  unifiedContent?: string; // 新增统一流式内容
}

interface StreamingState {
  // 统一收集所有流式内容的数组
  allContent: string[];
  isComplete: boolean;
  currentIndex: number;
}

interface StreamingReply {
  id: string;
  content: string;
  timestamp: number;
  isStreaming: boolean;
  isComplete: boolean;
  isUnified?: boolean; // 是否为统一显示区域
}

type DisplayReply = ArgueReply | StreamingReply;

export default function ResultsDisplay({ replies, onRegenerate, isStreaming = false, unifiedContent = '' }: ResultsDisplayProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [streamingState, setStreamingState] = useState<StreamingState>({
    currentContent: [],
    isComplete: false,
    currentIndex: -1
  });

  // 初始化流式状态
  useEffect(() => {
    if (isStreaming) {
      setStreamingState({
        allContent: [],
        isComplete: false,
        currentIndex: -1
      });
    }
  }, [isStreaming]);

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

  // 获取要显示的回复内容
  const getDisplayReplies = (): DisplayReply[] => {
    if (isStreaming && !streamingState.isComplete) {
      // 流式输出时，显示一个统一的临时区域
      return [{
        id: 'streaming-unified',
        content: unifiedContent,
        timestamp: Date.now(),
        isStreaming: true,
        isComplete: false,
        isUnified: true
      }];
    }
    return replies;
  };

  const displayReplies = getDisplayReplies();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isStreaming ? '正在生成吵架回复...' : '吵架回复'}
        </h2>
        <p className="text-gray-600">
          {isStreaming ? 'AI正在逐字生成您的专属回复' : '点击复制按钮快速复制回复内容'}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {displayReplies.map((reply, index) => {
          // 使用类型守卫检查是否是流式回复
          const isStreaming = 'isStreaming' in reply ? reply.isStreaming : false;
          const isComplete = 'isComplete' in reply ? reply.isComplete : true;
          const isUnified = 'isUnified' in reply ? reply.isUnified : false;
          
          return (
            <div
              key={reply.id}
              className="wechat-card p-6 fade-in hover:shadow-md transition-shadow duration-200"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex items-center mb-2">
                    {!isUnified && (
                      <span className="inline-flex items-center justify-center w-6 h-6 bg-wechat-primary text-white text-sm font-medium rounded-full mr-3">
                        {index + 1}
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      {isStreaming ? '正在输入...' : new Date(reply.timestamp).toLocaleTimeString()}
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
                      onCopy={() => handleCopy(reply.content, reply.id)}
                      copied={copiedId === reply.id}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* 流式输出时的占位符 */}
        {isStreaming && (
          <div className="wechat-card p-6 opacity-60">
            <div className="flex items-center mb-2">
              <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-300 text-gray-500 text-sm font-medium rounded-full mr-3">
                {(displayReplies.length || 0) + 1}
              </span>
              <span className="text-sm text-gray-500">等待生成...</span>
            </div>
            <p className="text-gray-400 italic">即将为您生成第三条回复...</p>
          </div>
        )}
      </div>

      {/* 控制按钮 */}
      <div className="text-center pt-4 space-x-3">
        {!isStreaming && (
          <button
            onClick={onRegenerate}
            className="inline-flex items-center px-4 py-2 text-sm text-wechat-primary hover:text-wechat-primary-hover border border-wechat-primary hover:border-wechat-primary-hover rounded-lg transition-colors duration-200"
          >
            重新生成
          </button>
        )}
        
        {isStreaming && (
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-lg transition-colors duration-200"
          >
            取消生成
          </button>
        )}
      </div>
    </div>
  );
}

// 提供给父组件使用的流式输出Hook
export function useStreamingOutput(
  onNewContent: (content: string, index: number) => void,
  onComplete: (allContent: string) => void,
  onError: (error: string) => void
) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [unifiedContent, setUnifiedContent] = useState<string>(''); // 统一收集所有内容
  const [error, setError] = useState<string | null>(null);

  const startStreaming = () => {
    setIsStreaming(true);
    setUnifiedContent('');
    setError(null);
  };

  const addContent = (content: string, index: number) => {
    // 所有内容都累积到统一字符串中
    setUnifiedContent(prev => prev + content);
    // 同时调用原有的onNewContent回调（如果需要的话）
    onNewContent(content, index);
  };

  const completeStreaming = (fullContent: string) => {
    setIsStreaming(false);
    onComplete(fullContent);
  };

  const handleError = (errorMessage: string) => {
    setIsStreaming(false);
    setError(errorMessage);
    onError(errorMessage);
  };

  return {
    isStreaming,
    unifiedContent,
    error,
    startStreaming,
    addContent,
    completeStreaming,
    handleError
  };
}