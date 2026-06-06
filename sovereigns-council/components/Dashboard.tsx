'use client';

import React from 'react';
import { ModelConfig, ModelResponse } from '@/lib/types';
import { ModelTile } from '@/components/ModelTile';

interface DashboardProps {
  models: ModelConfig[];
  responses: Map<string, ModelResponse>;
  loadingModels: Set<string>;
  onCritique: (modelId: string) => void;
}

export function Dashboard({
  models,
  responses,
  loadingModels,
  onCritique,
}: DashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 auto-rows-fr">
      {models.map((model, index) => {
        const response = responses.get(model.id);
        const isLoading = loadingModels.has(model.id);

        return (
          <div
            key={model.id}
            className="min-h-[300px]"
          >
            <ModelTile
              model={model}
              response={response || null}
              isLoading={isLoading}
              index={index}
              onCritique={() => onCritique(model.id)}
            />
          </div>
        );
      })}
    </div>
  );
}