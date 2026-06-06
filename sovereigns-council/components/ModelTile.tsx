'use client';

import React, { useState } from 'react';
import { MessageSquare, ChevronDown, ChevronUp, Brain, AlertTriangle } from 'lucide-react';
import { ModelConfig, ModelResponse, Critique } from '@/lib/types';
import { formatCost, formatTokens } from '@/lib/cost-calculator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface ModelTileProps {
  model: ModelConfig;
  response: ModelResponse | null;
  isLoading: boolean;
  index: number;
  onCritique: () => void;
}

export function ModelTile({
  model,
  response,
  isLoading,
  index,
  onCritique,
}: ModelTileProps) {
  const [showCritiques, setShowCritiques] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  const hasVision = model.hasVision;
  const hasThinking = model.supportsThinking;
  const hasReasoning = model.supportsReasoning;

  return (
    <Card className="flex flex-col h-full transition-all">
      <CardHeader className="pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">
              {model.name}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {hasVision && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Vision
              </Badge>
            )}
            {hasThinking && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                <Brain className="w-3 h-3 mr-1" />
                Think
              </Badge>
            )}
            {hasReasoning && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Reason
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{model.provider}</p>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-muted-foreground">Consulting...</span>
            </div>
          </div>
        ) : response ? (
          <>
            {/* Response Content */}
            <div className="flex-1 overflow-auto custom-scrollbar">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {response.content.split('\n').map((line, i) => (
                  <p key={i} className="mb-2">{line}</p>
                ))}
              </div>

              {/* Reasoning Section */}
              {response.reasoning && (
                <div className="mt-3 pt-3 border-t">
                  <button
                    onClick={() => setShowReasoning(!showReasoning)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Brain className="w-3 h-3" />
                    {showReasoning ? 'Hide' : 'Show'} Reasoning
                    {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showReasoning && (
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                      {response.reasoning}
                    </pre>
                  )}
                </div>
              )}

              {/* Critiques Section */}
              {response.critiques && response.critiques.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <button
                    onClick={() => setShowCritiques(!showCritiques)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {showCritiques ? 'Hide' : 'Show'} Critiques ({response.critiques.length})
                    {showCritiques ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showCritiques && (
                    <div className="mt-2 space-y-2">
                      {response.critiques.map((critique: Critique, i: number) => (
                        <div key={i} className="p-2 bg-destructive/10 rounded border-l-2 border-destructive">
                          <p className="text-xs font-semibold text-destructive">{critique.modelName}:</p>
                          <p className="text-xs mt-1">{critique.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stats & Actions */}
            <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
              <div className="flex gap-3">
                <span>${response.cost.toFixed(4)}</span>
                <span>{formatTokens(response.tokens)} tokens</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCritique}
                className="h-7 text-xs"
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Critique
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Waiting for the Sovereign&apos;s question...
          </div>
        )}
      </CardContent>
    </Card>
  );
}