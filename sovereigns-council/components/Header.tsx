'use client';

import React from 'react';
import { DollarSign, Coins, Settings } from 'lucide-react';
import { formatCost, formatTokens } from '@/lib/cost-calculator';
import { CostStats, ThinkingDepth } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface HeaderProps {
  costStats: CostStats;
  thinkingDepth: ThinkingDepth;
  onThinkingDepthChange: (depth: ThinkingDepth) => void;
  liveSearch: boolean;
  onLiveSearchChange: (enabled: boolean) => void;
  onOpenSettings: () => void;
}

export function Header({
  costStats,
  thinkingDepth,
  onThinkingDepthChange,
  liveSearch,
  onLiveSearchChange,
  onOpenSettings,
}: HeaderProps) {
  const thinkingValue = thinkingDepth === 'off' ? 0 : thinkingDepth === 'low' ? 1 : 2;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
            The Sovereign&apos;s Council
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Cost Display */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span className="font-mono">{formatCost(costStats.totalCost)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Coins className="w-4 h-4" />
              <span className="font-mono">{formatTokens(costStats.totalTokens)} tokens</span>
            </div>
          </div>

          {/* Thinking Depth Slider */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Thinking:</span>
            <Slider
              value={[thinkingValue]}
              onValueChange={([val]) => onThinkingDepthChange(val === 0 ? 'off' : val === 1 ? 'low' : 'high')}
              min={0}
              max={2}
              step={1}
              className="w-24"
            />
            <span className="text-xs w-10 capitalize">{thinkingDepth}</span>
          </div>

          {/* Live Search Toggle */}
          <div className="hidden lg:flex items-center gap-2">
            <Switch
              checked={liveSearch}
              onCheckedChange={onLiveSearchChange}
              id="live-search"
            />
            <label htmlFor="live-search" className="text-xs text-muted-foreground cursor-pointer">
              Live Search
            </label>
          </div>

          {/* Settings */}
          <Button variant="ghost" size="icon" onClick={onOpenSettings}>
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Controls */}
      <div className="lg:hidden container px-4 pb-3 flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="w-4 h-4" />
          <span className="font-mono">{formatCost(costStats.totalCost)}</span>
          <Coins className="w-4 h-4 ml-2" />
          <span className="font-mono">{formatTokens(costStats.totalTokens)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Thinking:</span>
          <Slider
            value={[thinkingValue]}
            onValueChange={([val]) => onThinkingDepthChange(val === 0 ? 'off' : val === 1 ? 'low' : 'high')}
            min={0}
            max={2}
            step={1}
            className="w-20"
          />
          <span className="text-xs capitalize">{thinkingDepth}</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={liveSearch}
            onCheckedChange={onLiveSearchChange}
            id="live-search-mobile"
          />
          <label htmlFor="live-search-mobile" className="text-xs text-muted-foreground">
            Search
          </label>
        </div>
      </div>
    </header>
  );
}