// DeepSeek API 服务
import ConfigService from './config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
}

export interface ChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamResponse {
  choices: {
    delta: {
      content?: string;
    };
    index: number;
    finish_reason: string | null;
  }[];
}

export interface StreamCallbacks {
  onMessage: (content: string) => void;
  onComplete: (finalContent: string) => void;
  onError: (error: Error) => void;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}

class DeepSeekService {
  private static instance: DeepSeekService;
  private config: ConfigService;
  private requestCache: Map<string, { timestamp: number; result: string }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存
  private readonly MIN_REQUEST_INTERVAL = 1000; // 1秒请求间隔
  private lastRequestTime = 0;

  private constructor() {
    this.config = ConfigService.getInstance();
    this.requestCache = new Map();
  }

  public static getInstance(): DeepSeekService {
    if (!DeepSeekService.instance) {
      DeepSeekService.instance = new DeepSeekService();
    }
    return DeepSeekService.instance;
  }

  private validateConfig(): void {
    const cfg = this.config.getConfig();
    const missing: string[] = [];
    if (!cfg.API_BASE_URL) missing.push('API_BASE_URL');
    if (!cfg.API_KEY) missing.push('API_KEY');
    if (!cfg.MODEL) missing.push('MODEL');
    if (missing.length) {
      throw new Error(`环境变量缺失：${missing.join(', ')}`);
    }
  }

  private createSystemPrompt(intensity: number): string {
    const intensityDescriptions = {
      1: '轻微',
      2: '温和',
      3: '一般',
      4: '较重',
      5: '中等',
      6: '较重',
      7: '强烈',
      8: '很强烈',
      9: '非常强烈',
      10: '极度强烈'
    };

    return `你是一个专业的辩论助手，专门帮助用户生成有力的吵架回复。请根据用户提供的"对方的话"和指定的语气强度，生成3条具有说服力的回复内容。

要求：
1. 回复内容要符合指定的语气强度（${intensityDescriptions[intensity as keyof typeof intensityDescriptions] || '中等'}）
2. 内容要有逻辑性和说服力
3. 语言要自然流畅，符合日常对话习惯
4. 每条回复都要独立完整
5. 回复长度适中，一般在50-200字之间
6. 避免使用过分的侮辱性词汇，保持适当的争议性

请直接返回3条回复内容，每条用换行分隔，不要包含任何前缀或说明文字。`;
  }

  private generateCacheKey(messages: ChatMessage[], intensity: number): string {
    return JSON.stringify({ messages, intensity });
  }

  private getCachedResponse(cacheKey: string): string | null {
    const cached = this.requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.result;
    }
    this.requestCache.delete(cacheKey);
    return null;
  }

  private setCachedResponse(cacheKey: string, result: string): void {
    this.requestCache.set(cacheKey, {
      timestamp: Date.now(),
      result
    });
  }

  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.MIN_REQUEST_INTERVAL) {
      const waitTime = this.MIN_REQUEST_INTERVAL - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    this.lastRequestTime = Date.now();
  }

  public async generateReplies(
    opponentMessage: string, 
    intensity: number
  ): Promise<string[]> {
    try {
      this.validateConfig();
      await this.waitForRateLimit();

      const systemPrompt = this.createSystemPrompt(intensity);
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `对方的话：${opponentMessage}` }
      ];

      // 检查缓存
      const cacheKey = this.generateCacheKey(messages, intensity);
      const cachedResponse = this.getCachedResponse(cacheKey);
      
      if (cachedResponse) {
        return this.parseReplies(cachedResponse);
      }

      const requestBody: ChatRequest = {
        model: this.config.getConfig().MODEL,
        messages,
        stream: false,
        max_tokens: 1000,
        temperature: 0.8,
      };

      console.log('发送API请求到:', this.config.getConfig().API_BASE_URL);

      const response = await fetch(this.config.getConfig().API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.getConfig().API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('API响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API错误响应:', errorText);
        
        let errorMessage = `API请求失败 (${response.status})`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage += `: ${errorData.error?.message || '未知错误'}`;
        } catch {
          errorMessage += `: ${errorText || '未知错误'}`;
        }
        
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      console.log('API原始响应:', responseText);
      
      let data: ChatResponse;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON解析错误:', parseError);
        throw new Error('API返回数据格式无效');
      }
      
      if (!data.choices || data.choices.length === 0) {
        console.error('无效的API响应结构:', data);
        throw new Error('API返回数据格式错误');
      }

      const content = data.choices[0].message.content;
      console.log('解析的内容:', content);
      
      // 缓存结果
      this.setCachedResponse(cacheKey, content);
      
      return this.parseReplies(content);
    } catch (error) {
      console.error('DeepSeek API调用失败:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('网络连接失败，请检查网络连接或稍后重试');
      }
      
      throw new Error(error instanceof Error ? error.message : '未知错误');
    }
  }

  public async generateRepliesStream(
    opponentMessage: string, 
    intensity: number,
    callbacks: StreamCallbacks
  ): Promise<void> {
    try {
      this.validateConfig();
      await this.waitForRateLimit();

      const systemPrompt = this.createSystemPrompt(intensity);
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `对方的话：${opponentMessage}` }
      ];

      // 检查缓存
      const cacheKey = this.generateCacheKey(messages, intensity);
      const cachedResponse = this.getCachedResponse(cacheKey);
      
      if (cachedResponse) {
        // 从缓存返回时，仍然模拟流式输出
        const replies = this.parseReplies(cachedResponse);
        await this.simulateStreamOutput(replies, callbacks);
        return;
      }

      const requestBody: ChatRequest = {
        model: this.config.getConfig().MODEL,
        messages,
        stream: true,
        max_tokens: 1000,
        temperature: 0.8,
      };

      console.log('发送流式API请求到:', this.config.getConfig().API_BASE_URL);

      const response = await fetch(this.config.getConfig().API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.getConfig().API_KEY}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log('流式API响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('流式API错误响应:', errorText);
        
        let errorMessage = `API请求失败 (${response.status})`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage += `: ${errorData.error?.message || '未知错误'}`;
        } catch {
          errorMessage += `: ${errorText || '未知错误'}`;
        }
        
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取流式响应');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          
          // 保留最后一个不完整的行
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                // 流式输出完成
                // 缓存结果
                this.setCachedResponse(cacheKey, fullContent);
                callbacks.onComplete(fullContent);
                return;
              }
              
              try {
                const streamData: StreamResponse = JSON.parse(data);
                const content = streamData.choices?.[0]?.delta?.content;
                
                if (content) {
                  fullContent += content;
                  callbacks.onMessage(content);
                  
                  // 模拟流式输出，每增加一些内容就稍微延迟
                  await new Promise(resolve => setTimeout(resolve, 30));
                }
              } catch (parseError) {
                console.warn('解析流式数据失败:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
    } catch (error) {
      console.error('DeepSeek流式API调用失败:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        callbacks.onError(new Error('网络连接失败，请检查网络连接或稍后重试'));
      } else {
        callbacks.onError(error instanceof Error ? error : new Error('未知错误'));
      }
    }
  }

  private async simulateStreamOutput(
    replies: string[], 
    callbacks: StreamCallbacks
  ): Promise<void> {
    // 模拟流式输出，每个回复逐字输出
    let fullContent = '';
    
    for (let i = 0; i < replies.length; i++) {
      const reply = replies[i];
      
      // 添加回复编号
      if (i > 0) {
        fullContent += '\n';
      }
      
      // 逐字输出
      for (let j = 0; j < reply.length; j++) {
        const char = reply[j];
        fullContent += char;
        callbacks.onMessage(char);
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      
      // 在回复之间添加小延迟
      if (i < replies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    callbacks.onComplete(fullContent);
  }

  public parseReplies(content: string): string[] {
    // 尝试多种方式解析回复内容
    let replies: string[] = [];

    // 方法1: 按空行分割
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length >= 3) {
      replies = lines.slice(0, 3);
    } else {
      // 方法2: 按数字编号分割
      const numberedMatches = content.match(/\d+[.、]\s*([^\d]+)/g);
      if (numberedMatches && numberedMatches.length >= 3) {
        replies = numberedMatches.map(match => 
          match.replace(/^\d+[.、]\s*/, '').trim()
        );
      } else {
        // 方法3: 直接返回整个内容作为一条回复
        replies = [content.trim()];
      }
    }

    // 过滤空回复
    return replies.filter(reply => reply && reply.length > 0);
  }
}

export default DeepSeekService;
