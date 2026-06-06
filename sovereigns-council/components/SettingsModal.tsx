'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getOpenRouterKey, setOpenRouterKey, getTavilyKey, setTavilyKey, getCustomModels, setCustomModels, clearCustomModels } from '@/lib/storage';
import { COUNCIL_MODELS, ModelConfig } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onModelsChange?: () => void;
}

export function SettingsModal({ open, onOpenChange, onModelsChange }: SettingsModalProps) {
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [tavilyKey, setTavilyKeyState] = useState('');
  const [saved, setSaved] = useState(false);
  const [models, setModels] = useState<ModelConfig[]>(COUNCIL_MODELS);
  const [newModelId, setNewModelId] = useState('');
  const [newModelName, setNewModelName] = useState('');

  useEffect(() => {
    if (open) {
      const orKey = getOpenRouterKey();
      const tKey = getTavilyKey();
      const customModels = getCustomModels();
      setOpenrouterKey(orKey || '');
      setTavilyKeyState(tKey || '');
      setModels(customModels || COUNCIL_MODELS);
    }
  }, [open]);

  const handleSave = () => {
    if (openrouterKey.trim()) {
      setOpenRouterKey(openrouterKey.trim());
    }
    if (tavilyKey.trim()) {
      setTavilyKey(tavilyKey.trim());
    }
    setCustomModels(models);
    setSaved(true);
    onModelsChange?.();
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetModels = () => {
    setModels(COUNCIL_MODELS);
    clearCustomModels();
    onModelsChange?.();
  };

  const addModel = () => {
    if (!newModelId.trim() || !newModelName.trim()) return;
    const newModel: ModelConfig = {
      id: newModelId.trim(),
      name: newModelName.trim(),
      provider: 'Custom',
      hasVision: false,
      supportsThinking: false,
      supportsReasoning: false,
    };
    setModels([...models, newModel]);
    setNewModelId('');
    setNewModelName('');
  };

  const removeModel = (id: string) => {
    setModels(models.filter(m => m.id !== id));
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle>Settings</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* API Keys */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">API Keys</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">OpenRouter API Key</label>
              <Input
                type="password"
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                placeholder="sk-or-..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tavily API Key (Optional)</label>
              <Input
                type="password"
                value={tavilyKey}
                onChange={(e) => setTavilyKeyState(e.target.value)}
                placeholder="tvly-..."
              />
            </div>
          </div>

          {/* Model Configuration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Council Models</h3>
              <Button variant="ghost" size="sm" onClick={handleResetModels}>
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>

            <div className="space-y-2 max-h-48 overflow-auto">
              {models.map((model) => (
                <div key={model.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{model.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{model.id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeModel(model.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Input
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="Model name (e.g., GPT-4o)"
                className="flex-1"
              />
              <Input
                value={newModelId}
                onChange={(e) => setNewModelId(e.target.value)}
                placeholder="OpenRouter ID (e.g., openai/gpt-4o)"
                className="flex-1"
              />
              <Button size="icon" onClick={addModel} disabled={!newModelId.trim() || !newModelName.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="flex-1">
              {saved ? 'Saved!' : 'Save All'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}