// 全局类型定义
export interface ArgueReply {
  id: string;
  content: string;
  timestamp: number;
}

export interface ArgueSession {
  id: string;
  opponentMessage: string;
  intensity: number;
  replies: ArgueReply[];
  createdAt: number;
}

export interface ApiResponse {
  success: boolean;
  data?: string[];
  error?: string;
}

export interface FormData {
  opponentMessage: string;
  intensity: number;
}