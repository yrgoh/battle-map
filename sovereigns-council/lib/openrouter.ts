// OpenRouter API utilities
import { ThinkingDepth, Message, COUNCIL_MODELS, SYSTEM_PROMPT, VISION_MODEL } from './types';

interface OpenRouterPayload {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  include_reasoning?: boolean;
  thinking?: {
    budget_tokens: number;
  };
}

export interface ChatResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  provider_response?: {
    reasoning?: string;
  };
}

function buildPayload(
  modelId: string,
  messages: Message[],
  thinkingDepth: ThinkingDepth,
  visionData?: { type: string; data: string; text?: string }[]
): OpenRouterPayload {
  const model = COUNCIL_MODELS.find(m => m.id === modelId);
  const payload: OpenRouterPayload = {
    model: modelId,
    messages: [...messages],
  };

  // Add thinking parameters based on model and depth
  if (thinkingDepth !== 'off') {
    const budgetTokens = thinkingDepth === 'low' ? 1024 : 2048;

    // GPT and DeepSeek support reasoning
    if (['openai/gpt-5.4', 'deepseek/deepseek-v3.2'].includes(modelId)) {
      payload.include_reasoning = true;
    }

    // Claude and Qwen support thinking
    if (['anthropic/claude-4.6-sonnet', 'qwen/qwen-3.5-max'].includes(modelId)) {
      payload.thinking = { budget_tokens: budgetTokens };
    }
  }

  // Add vision data if model supports it and data provided
  if (model?.hasVision && visionData && visionData.length > 0) {
    const lastMessage = payload.messages[payload.messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      const content: Array<{ type: string; text?: string; image?: string }> = [];

      // Add text content
      if (lastMessage.content) {
        content.push({ type: 'text', text: lastMessage.content });
      }

      // Add vision data
      for (const v of visionData) {
        content.push({ type: v.type, image: v.data });
      }

      lastMessage.content = content as unknown as string;
    }
  }

  return payload;
}

export async function chat(
  apiKey: string,
  modelId: string,
  messages: Message[],
  thinkingDepth: ThinkingDepth,
  visionData?: { type: string; data: string; text?: string }[]
): Promise<{ content: string; reasoning?: string; usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
  const payload = buildPayload(modelId, messages, thinkingDepth, visionData);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      'X-Title': 'The Sovereign\'s Council',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data: ChatResponse = await response.json();
  const choice = data.choices[0];

  return {
    content: choice.message.content || '',
    reasoning: data.provider_response?.reasoning,
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

export async function analyzeImageWithVision(
  apiKey: string,
  imageData: string,
  prompt: string
): Promise<string> {
  const messages: Message[] = [
    {
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageData } },
      ] as unknown as string,
    },
  ];

  const payload = {
    model: VISION_MODEL,
    messages,
    max_tokens: 2048,
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
      'X-Title': 'The Sovereign\'s Council',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data: ChatResponse = await response.json();
  return data.choices[0].message.content || '';
}

// Critique prompt generator
export function buildCritiquePrompt(responseToCritique: string): Message[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `You are an elite critic. Analyze this response for flaws, biases, or missing data. Be harsh and specific.

Response to critique:
${responseToCritique}

Provide your critique focusing on:
1. Factual errors or misleading statements
2. Logical fallacies or reasoning flaws
3. Missing context or alternative perspectives
4. Biases or one-sided reasoning

Critique:`,
    },
  ];
}

// DeepSeek bridge: get context from GPT vision analysis
export async function getDeepSeekContext(
  apiKey: string,
  files: { type: string; data: string; text?: string }[],
  userPrompt: string
): Promise<string> {
  const visionPrompt = `Analyze this file(s) thoroughly and provide a detailed textual description of what you see or what's in the document. Focus on:
- Key information, facts, and data
- Visual elements, charts, graphs, or diagrams
- Any text content visible
- Overall context and meaning

User's actual question: ${userPrompt}

Provide a comprehensive summary that would allow a text-only AI to understand the file contents.`;

  const content: Array<{ type: string; text?: string; image?: string; image_url?: { url: string } }> = [
    { type: 'text', text: visionPrompt },
  ];

  for (const file of files) {
    if (file.type === 'image') {
      content.push({ type: 'image_url', image_url: { url: file.data } });
    }
  }

  const messages: Message[] = [{ role: 'user', content: content as unknown as string }];

  const result = await chat(apiKey, VISION_MODEL, messages, 'off', []);
  return result.content;
}