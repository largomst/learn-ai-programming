'use client';

import { useState, useEffect } from 'react';
import { FormData } from '@/lib/types';

interface InputFormProps {
  onSubmit: (formData: FormData) => void;
  disabled?: boolean;
}

const INTENSITY_LABELS: Record<number, string> = {
  1: '轻微',
  2: '温和', 
  3: '一般',
  4: '较轻',
  5: '中等',
  6: '较重',
  7: '强烈',
  8: '很强烈',
  9: '非常强烈',
  10: '极度强烈'
};

export default function InputForm({ onSubmit, disabled = false }: InputFormProps) {
  const [opponentMessage, setOpponentMessage] = useState('');
  const [intensity, setIntensity] = useState(5);

  // 从本地存储恢复数据
  useEffect(() => {
    const saved = localStorage.getItem('argue-form-data');
    if (saved) {
      try {
        const { opponentMessage: savedMessage, intensity: savedIntensity } = JSON.parse(saved);
        setOpponentMessage(savedMessage || '');
        setIntensity(savedIntensity || 5);
      } catch (error) {
        console.error('Failed to parse saved form data:', error);
      }
    }
  }, []);

  // 保存表单数据
  const saveFormData = (message: string, intensityValue: number) => {
    try {
      localStorage.setItem('argue-form-data', JSON.stringify({
        opponentMessage: message,
        intensity: intensityValue
      }));
    } catch (error) {
      console.error('Failed to save form data:', error);
    }
  };

  const handleMessageChange = (value: string) => {
    setOpponentMessage(value);
    saveFormData(value, intensity);
  };

  const handleIntensityChange = (value: number) => {
    setIntensity(value);
    saveFormData(opponentMessage, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ opponentMessage, intensity });
  };

  return (
    <div className="wechat-card p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 对方的话输入框 */}
        <div>
          <label htmlFor="opponentMessage" className="block text-sm font-medium text-gray-700 mb-2">
            对方的话
          </label>
          <textarea
            id="opponentMessage"
            value={opponentMessage}
            onChange={(e) => handleMessageChange(e.target.value)}
            placeholder="请输入对方说的话..."
            className="wechat-input h-32 resize-none"
            disabled={disabled}
            required
          />
        </div>

        {/* 语气强度滑块 */}
        <div>
          <label htmlFor="intensity" className="block text-sm font-medium text-gray-700 mb-3">
            语气强度: <span className="text-wechat-primary font-semibold">{INTENSITY_LABELS[intensity]}</span>
          </label>
          <div className="space-y-3">
            <input
              type="range"
              id="intensity"
              min="1"
              max="10"
              value={intensity}
              onChange={(e) => handleIntensityChange(Number(e.target.value))}
              className="intensity-slider"
              disabled={disabled}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>轻微</span>
              <span>温和</span>
              <span>一般</span>
              <span>强烈</span>
              <span>极度强烈</span>
            </div>
          </div>
        </div>

        {/* 提交按钮 */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={disabled || !opponentMessage.trim()}
            className="wechat-button w-full text-lg font-semibold py-4"
          >
            {disabled ? '正在生成...' : '开始吵架'}
          </button>
        </div>
      </form>
    </div>
  );
}