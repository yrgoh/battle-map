import { NextRequest, NextResponse } from 'next/server';

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterPayload {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  include_reasoning?: boolean;
  thinking?: {
    budget_tokens: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { apiKey, modelId, messages, thinkingDepth, visionData, deepseekContext } = body;

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 });
    }

    if (!modelId) {
      return NextResponse.json({ error: 'Model ID required' }, { status: 400 });
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    // Build the payload based on model requirements
    const payload: OpenRouterPayload = {
      model: modelId,
      messages: [...messages] as OpenRouterMessage[],
    };

    // Add thinking parameters
    if (thinkingDepth && thinkingDepth !== 'off') {
      const budgetTokens = thinkingDepth === 'low' ? 1024 : 2048;

      // GPT and DeepSeek support reasoning (include_reasoning)
      if (['openai/gpt-4o', 'deepseek/deepseek-chat'].includes(modelId)) {
        payload.include_reasoning = true;
      }

      // Claude and Qwen support thinking
      if (['anthropic/claude-3.5-sonnet-20241022', 'qwen/qwen-2.5-72b-instruct'].includes(modelId)) {
        payload.thinking = { budget_tokens: budgetTokens };
      }
    }

    // Add DeepSeek context if provided
    if (deepseekContext) {
      const userMessage = payload.messages[payload.messages.length - 1];
      if (userMessage && userMessage.role === 'user') {
        userMessage.content = `Context from file analysis:\n${deepseekContext}\n\n---\n\nOriginal question: ${userMessage.content}`;
      }
    }

    // Add vision data if provided
    if (visionData && visionData.length > 0) {
      const lastMessage = payload.messages[payload.messages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

        // Add text content
        if (typeof lastMessage.content === 'string') {
          content.push({ type: 'text', text: lastMessage.content });
        }

        // Add vision data (images)
        for (const v of visionData) {
          if (v.type === 'image') {
            content.push({ type: 'image_url', image_url: { url: v.data } });
          }
        }

        lastMessage.content = content as unknown as string;
      }
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://sovereigns-council.vercel.app',
        'X-Title': 'The Sovereign\'s Council',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.status}`, details: error },
        { status: response.status }
      );
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

    return NextResponse.json({
      content: choice?.message?.content || '',
      reasoning: data.provider_response?.reasoning,
      usage,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}