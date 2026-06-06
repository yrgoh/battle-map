'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import {
  COUNCIL_MODELS,
  SYSTEM_PROMPT,
  ThinkingDepth,
  Message,
  ModelResponse,
  FileAttachment,
  CostStats,
  Critique,
  ModelConfig,
} from '@/lib/types';
import { getOpenRouterKey, getTavilyKey, hasOpenRouterKey, getCustomModels } from '@/lib/storage';
import { calculateCost, createInitialCostStats } from '@/lib/cost-calculator';
import { Header } from '@/components/Header';
import { Dashboard } from '@/components/Dashboard';
import { FileUpload } from '@/components/FileUpload';
import { SettingsModal } from '@/components/SettingsModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [responses, setResponses] = useState<Map<string, ModelResponse>>(new Map());
  const [loadingModels, setLoadingModels] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [thinkingDepth, setThinkingDepth] = useState<ThinkingDepth>('off');
  const [liveSearch, setLiveSearch] = useState(false);
  const [costStats, setCostStats] = useState<CostStats>(createInitialCostStats());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [needsKey, setNeedsKey] = useState(false);
  const [models, setModels] = useState<ModelConfig[]>(COUNCIL_MODELS);

  // Load custom models on mount
  useEffect(() => {
    const customModels = getCustomModels();
    if (customModels) {
      setModels(customModels);
    }
  }, []);

  // Check for API key on mount
  useEffect(() => {
    if (!hasOpenRouterKey()) {
      setNeedsKey(true);
      setSettingsOpen(true);
    }
  }, []);

  // Perform web search via API
  const performSearch = async (searchQuery: string): Promise<string> => {
    const apiKey = getTavilyKey();
    if (!apiKey) return '';

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, query: searchQuery }),
      });
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        return data.results
          .map((r: { title: string; content: string; url: string }, i: number) =>
            `${i + 1}. ${r.title}\n${r.content.substring(0, 300)}...\nSource: ${r.url}`
          )
          .join('\n\n');
      }
    } catch (err) {
      console.error('Search error:', err);
    }
    return '';
  };

  // Analyze file for DeepSeek
  const analyzeFileForDeepSeek = async (fileData: string): Promise<string> => {
    const apiKey = getOpenRouterKey();
    if (!apiKey) return '';

    try {
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          imageData: fileData,
          prompt:
            'Analyze this file thoroughly. Provide a detailed textual summary of all content, including text, data, charts, and visual elements.',
        }),
      });
      const data = await res.json();
      return data.content || '';
    } catch (err) {
      console.error('Vision analysis error:', err);
    }
    return '';
  };

  // Call a single model with timeout
  const callModel = useCallback(
    async (
      modelId: string,
      userMessage: string,
      searchContext?: string,
      deepseekContext?: string
    ) => {
      const apiKey = getOpenRouterKey();
      if (!apiKey) {
        return null;
      }

      const modelMessages: Message[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages,
        { role: 'user', content: userMessage },
      ];

      // Build vision data for models that support it
      const visionData: { type: string; data: string }[] = [];
      if (searchContext) {
        const lastMsg = modelMessages[modelMessages.length - 1];
        lastMsg.content = `Web Search Results:\n${searchContext}\n\n---\n\n${lastMsg.content}`;
      }
      for (const f of files) {
        if (f.type === 'image') {
          visionData.push({ type: 'image_url', data: f.data });
        }
      }

      const hasVision = models.find((m) => m.id === modelId)?.hasVision;
      const useVision = hasVision && visionData.length > 0;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            apiKey,
            modelId,
            messages: modelMessages,
            thinkingDepth,
            visionData: useVision ? visionData : undefined,
            deepseekContext,
          }),
        });
        clearTimeout(timeoutId);

        const data = await res.json();

        if (data.error) {
          console.error(`Error from ${modelId}:`, data.error);
          return null;
        }

        const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
        const cost = calculateCost(modelId, usage.prompt_tokens, usage.completion_tokens);

        // Update cost stats
        setCostStats((prev) => ({
          totalCost: prev.totalCost + cost,
          totalTokens: prev.totalTokens + usage.total_tokens,
          promptTokens: prev.promptTokens + usage.prompt_tokens,
          completionTokens: prev.completionTokens + usage.completion_tokens,
        }));

        return {
          modelId,
          content: data.content,
          reasoning: data.reasoning,
          tokens: usage.total_tokens,
          cost,
          latency: 0,
          critiques: [],
        };
      } catch (err) {
        console.error(`Error calling ${modelId}:`, err);
        return null;
      }
    },
    [messages, files, thinkingDepth]
  );

  // Submit query to all models
  const submitQuery = useCallback(async () => {
    if (!query.trim() || loadingModels.size > 0) return;

    const apiKey = getOpenRouterKey();
    if (!apiKey) {
      setSettingsOpen(true);
      return;
    }

    // Clear previous responses
    setResponses(new Map());
    setCostStats(createInitialCostStats());

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: query }]);

    // Get search results if enabled
    let searchContext = '';
    if (liveSearch) {
      setLoadingModels(new Set(models.map((m) => m.id)));
      searchContext = await performSearch(query);
      setLoadingModels(new Set());
    }

    // Check if we have files that need DeepSeek context
    let deepseekContext = '';
    const hasFilesWithImages = files.some((f) => f.type === 'image');
    if (hasFilesWithImages) {
      for (const f of files) {
        if (f.type === 'image') {
          deepseekContext = await analyzeFileForDeepSeek(f.data);
          break;
        }
      }
    }

    // Call all models in parallel
    setLoadingModels(new Set(models.map((m) => m.id)));

    const promises = models.map((model) =>
      callModel(model.id, query, searchContext, deepseekContext).then((response) => ({
        modelId: model.id,
        response,
      }))
    );

    const results = await Promise.all(promises);

    const newResponses = new Map<string, ModelResponse>();
    results.forEach(({ modelId, response }) => {
      if (response) {
        newResponses.set(modelId, response);
      }
    });

    setResponses(newResponses);
    setLoadingModels(new Set());
    setQuery('');
  }, [query, files, liveSearch, callModel, loadingModels]);

  // Handle critique
  const handleCritique = useCallback(
    async (targetModelId: string) => {
      const targetResponse = responses.get(targetModelId);
      if (!targetResponse) return;

      const targetModel = models.find((m) => m.id === targetModelId);
      if (!targetModel) return;

      // Get the original question from messages
      const originalQuestion = messages
        .filter(m => m.role === 'user')
        .pop()?.content || '';

      if (!originalQuestion) {
        console.error('No original question found');
        return;
      }

      // Get all other models to critique
      const otherModels = models.filter((m) => m.id !== targetModelId);
      setLoadingModels(new Set(otherModels.map((m) => m.id)));

      const critiquePromises = otherModels.map(async (model) => {
        const apiKey = getOpenRouterKey();
        if (!apiKey) return null;

        const systemPrompt = `You are an elite critic. You must ONLY provide criticism of another model's response - NEVER answer the question yourself. If you find yourself starting to answer the question, STOP immediately and instead list the flaws, errors, or gaps in the response you're critiquing.`;

        const critiqueMessages: Message[] = [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `CRITIQUE TASK - DO NOT ANSWER THE QUESTION BELOW

The question was: "${originalQuestion}"

You are critiquing the response from: ${targetModel.name}

Their response was:
"""
${targetResponse.content}
"""

Your ONLY task is to identify problems with ${targetModel.name}'s response. Look for:
- Factual errors or misinformation
- Logical fallacies or reasoning flaws
- Missing important context or perspectives
- Biases or one-sided thinking
- Unsupported claims

Write your critique below. Start directly with your critique - do not restate the question.`,
          },
        ];

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000);

          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              apiKey,
              modelId: model.id,
              messages: critiqueMessages,
              thinkingDepth: 'off',
            }),
          });
          clearTimeout(timeoutId);

          const data = await res.json();
          return {
            modelId: model.id,
            modelName: model.name,
            content: data.content || '',
          } as Critique;
        } catch {
          return null;
        }
      });

      const critiques = (await Promise.all(critiquePromises)).filter(
        (c): c is Critique => c !== null
      );

      setResponses((prev) => {
        const updated = new Map(prev);
        const existing = updated.get(targetModelId);
        if (existing) {
          updated.set(targetModelId, { ...existing, critiques });
        }
        return updated;
      });

      setLoadingModels(new Set());
    },
    [responses]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        costStats={costStats}
        thinkingDepth={thinkingDepth}
        onThinkingDepthChange={setThinkingDepth}
        liveSearch={liveSearch}
        onLiveSearchChange={setLiveSearch}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1 container py-4 px-4">
        {/* Query Input */}
        <div className="mb-4 space-y-3">
          <FileUpload files={files} onFilesChange={setFiles} />

          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitQuery()}
              placeholder="Ask the Council..."
              disabled={loadingModels.size > 0}
              className="flex-1"
            />
            <Button onClick={submitQuery} disabled={!query.trim() || loadingModels.size > 0}>
              {loadingModels.size > 0 ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span className="ml-2 hidden sm:inline">Ask</span>
            </Button>
          </div>
        </div>

        {/* Dashboard */}
        <Dashboard
          models={models}
          responses={responses}
          loadingModels={loadingModels}
          onCritique={handleCritique}
        />
      </main>

      <SettingsModal
        open={settingsOpen}
        onOpenChange={(open) => {
          setSettingsOpen(open);
          if (!open) setNeedsKey(false);
        }}
        onModelsChange={() => {
          const customModels = getCustomModels();
          if (customModels) {
            setModels(customModels);
          } else {
            setModels(COUNCIL_MODELS);
          }
        }}
      />

      {needsKey && !settingsOpen && (
        <div className="fixed bottom-4 right-4">
          <Button variant="outline" onClick={() => setSettingsOpen(true)}>
            Add API Key
          </Button>
        </div>
      )}
    </div>
  );
}