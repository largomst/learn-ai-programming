interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export default function LoadingSpinner({ size = 'md', text = '正在生成回复...' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-wechat-primary rounded-full animate-spin`}></div>
      <p className="text-gray-600 text-sm">{text}</p>
    </div>
  );
}