import { MODEL_PRICING, CostStats } from './types';

export function calculateCost(
  modelId: string,
  promptTokens: number,
  completionTokens: number
): number {
  const pricing = MODEL_PRICING[modelId];
  if (!pricing) return 0;

  const inputCost = (promptTokens / 1_000_000) * pricing.input;
  const outputCost = (completionTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}

export function calculateTotalCost(responses: Array<{ modelId: string; tokens: number }>): number {
  // This is simplified - in reality we'd track prompt vs completion tokens separately
  return responses.reduce((total, response) => {
    return total + (calculateCost(response.modelId, 0, response.tokens) || 0);
  }, 0);
}

export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`;
  }
  return `$${cost.toFixed(4)}`;
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export function createInitialCostStats(): CostStats {
  return {
    totalCost: 0,
    totalTokens: 0,
    promptTokens: 0,
    completionTokens: 0,
  };
}