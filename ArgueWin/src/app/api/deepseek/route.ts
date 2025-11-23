import { NextRequest } from 'next/server';
import ConfigService from '@/lib/config';

function createSystemPrompt(intensity: number): string {
  const intensityDescriptions: Record<number, string> = {
    1: '轻微',
    2: '温和',
    3: '一般',
    4: '较重',
    5: '中等',
    6: '较重',
    7: '强烈',
    8: '很强烈',
    9: '非常强烈',
    10: '极度强烈',
  };
  return `你是一个专业的辩论助手，专门帮助用户生成有力的吵架回复。请根据用户提供的"对方的话"和指定的语气强度，生成3条具有说服力的回复内容。

要求：
1. 回复内容要符合指定的语气强度（${intensityDescriptions[intensity] || '中等'}）
2. 内容要有逻辑性和说服力
3. 语言要自然流畅，符合日常对话习惯
4. 每条回复都要独立完整
5. 回复长度适中，一般在50-200字之间
6. 避免使用过分的侮辱性词汇，保持适当的争议性

请直接返回3条回复内容，每条用换行分隔，不要包含任何前缀或说明文字。`;
}

export async function POST(req: NextRequest) {
  try {
    const { opponentMessage, intensity, stream } = await req.json();

    if (!opponentMessage || typeof opponentMessage !== 'string') {
      return new Response(JSON.stringify({ error: '参数缺失：opponentMessage' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cfg = ConfigService.getInstance().getConfig();
    if (!cfg.API_BASE_URL || !cfg.API_KEY || !cfg.MODEL) {
      return new Response(JSON.stringify({ error: '环境变量缺失：API_BASE_URL, API_KEY, MODEL' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = createSystemPrompt(Number(intensity) || 5);
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `对方的话：${opponentMessage}` },
    ];

    const requestBody = {
      model: cfg.MODEL,
      messages,
      stream: !!stream,
      max_tokens: 1000,
      temperature: 0.8,
    };

    const external = await fetch(cfg.API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!external.ok) {
      const errorText = await external.text();
      let errorMessage = `API请求失败 (${external.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage += `: ${errorData.error?.message || '未知错误'}`;
      } catch {
        errorMessage += `: ${errorText || '未知错误'}`;
      }
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: external.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (stream) {
      const body = external.body as ReadableStream<Uint8Array> | null;
      if (!body) {
        return new Response(JSON.stringify({ error: '外部服务未返回可读流' }), {
          status: 502,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(body, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    const text = await external.text();
    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}