export type ThinkingDepth = 'off' | 'low' | 'high';

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  hasVision: boolean;
  supportsThinking: boolean;
  supportsReasoning: boolean;
}

export const COUNCIL_MODELS: ModelConfig[] = [
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', hasVision: true, supportsThinking: false, supportsReasoning: true },
  { id: 'anthropic/claude-3.5-sonnet-20241022', name: 'Claude-3.5 Sonnet', provider: 'Anthropic', hasVision: true, supportsThinking: true, supportsReasoning: false },
  { id: 'google/gemini-1.5-flash', name: 'Gemini-1.5 Flash', provider: 'Google', hasVision: true, supportsThinking: false, supportsReasoning: false },
  { id: 'qwen/qwen-2.5-72b-instruct', name: 'Qwen-2.5 72B', provider: 'Qwen', hasVision: true, supportsThinking: true, supportsReasoning: false },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat', provider: 'DeepSeek', hasVision: false, supportsThinking: false, supportsReasoning: true },
];

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf';
  data: string; // base64
  extractedText?: string;
}

export interface ModelResponse {
  modelId: string;
  content: string;
  reasoning?: string;
  tokens: number;
  cost: number;
  latency: number;
  critiques?: Critique[];
}

export interface Critique {
  modelId: string;
  modelName: string;
  content: string;
}

export interface CouncilState {
  messages: Message[];
  responses: ModelResponse[];
  thinkingDepth: ThinkingDepth;
  liveSearch: boolean;
  uploadedFiles: FileAttachment[];
  isLoading: boolean;
  votingMode: boolean;
  selectedWinner: string | null;
}

export interface CostStats {
  totalCost: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

// Pricing per 1M tokens (USD) - OpenRouter prices
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'openai/gpt-4o': { input: 2.5, output: 10 },
  'anthropic/claude-3.5-sonnet-20241022': { input: 3, output: 15 },
  'google/gemini-1.5-flash': { input: 0.075, output: 0.3 },
  'qwen/qwen-2.5-72b-instruct': { input: 0.2, output: 0.8 },
  'deepseek/deepseek-chat': { input: 0.27, output: 1.1 },
};

// DeepSeek needs GPT vision analysis
export const VISION_MODEL = 'openai/gpt-4o';
export const SYSTEM_PROMPT = `You are an elite advisor. Your mission is objective truth, not consensus. Do not be polite. Critique peer errors immediately. Ground all logic in provided documents or web search data. Zero sycophancy allowed.`;