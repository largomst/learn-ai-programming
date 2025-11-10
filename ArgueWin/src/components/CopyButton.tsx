interface CopyButtonProps {
  text: string;
  onCopy: () => void;
  copied: boolean;
  size?: 'sm' | 'md';
}

export default function CopyButton({ text, onCopy, copied, size = 'md' }: CopyButtonProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm'
  };

  return (
    <button
      onClick={onCopy}
      className={`${sizeClasses[size]} inline-flex items-center justify-center rounded-lg border transition-all duration-200 ${
        copied
          ? 'bg-green-50 border-green-200 text-green-700'
          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-wechat-primary hover:text-wechat-primary'
      }`}
      title={copied ? '已复制!' : '复制'}
    >
      {copied ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}