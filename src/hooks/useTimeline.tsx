import React, { createContext, useContext, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { BattleConfig } from '../types/battle';

interface TimelineState {
  currentDate: Date;
  isPlaying: boolean;
  speed: number; // days per second
  minDate: Date;
  maxDate: Date;
}

interface TimelineActions {
  setDate: (date: Date) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setSpeed: (speed: number) => void;
  goToEvent: (date: Date) => void;
  reset: () => void;
}

const TimelineContext = createContext<(TimelineState & TimelineActions) | null>(null);

function getDates(battle: BattleConfig): { min: Date; max: Date } {
  return {
    min: new Date(battle.dateRange.start + 'T00:00:00'),
    max: new Date(battle.dateRange.end + 'T00:00:00'),
  };
}

export function TimelineProvider({
  children,
  battle,
  battleId,
}: {
  children: React.ReactNode;
  battle?: BattleConfig;
  battleId?: string;
}) {
  const dates = useMemo(
    () => battle ? getDates(battle) : { min: new Date('1942-06-28'), max: new Date('1943-02-02') },
    [battle]
  );
  const minDate = dates.min;
  const maxDate = dates.max;

  const [currentDate, setCurrentDate] = useState(() => new Date(minDate));
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(2); // 2 days per second
  const lastFrameRef = useRef<number>(0);
  const animRef = useRef<number>(0);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  // Reset when battleId changes
  useEffect(() => {
    setCurrentDate(new Date(minDate));
    setIsPlaying(false);
    setSpeed(2);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, [battleId, minDate]);

  const clampDate = useCallback(
    (d: Date) => {
      if (d < minDate) return new Date(minDate);
      if (d > maxDate) return new Date(maxDate);
      return d;
    },
    [minDate, maxDate]
  );

  const setDate = useCallback(
    (d: Date) => {
      setCurrentDate(clampDate(d));
    },
    [clampDate]
  );

  const play = useCallback(() => setIsPlaying(true), []);
  const pause = useCallback(() => setIsPlaying(false), []);
  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);

  const goToEvent = useCallback(
    (d: Date) => {
      setCurrentDate(clampDate(d));
      setIsPlaying(false);
    },
    [clampDate]
  );

  const reset = useCallback(() => {
    setCurrentDate(new Date(minDate));
    setIsPlaying(false);
  }, [minDate]);

  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    lastFrameRef.current = performance.now();

    const tick = (now: number) => {
      const delta = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;

      setCurrentDate((prev) => {
        const next = new Date(prev.getTime() + delta * speedRef.current * 86400000);
        if (next >= maxDate) {
          setIsPlaying(false);
          return new Date(maxDate);
        }
        return next;
      });

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [isPlaying, maxDate]);

  const value = useMemo(
    () => ({
      currentDate,
      isPlaying,
      speed,
      minDate,
      maxDate,
      setDate,
      play,
      pause,
      togglePlay,
      setSpeed,
      goToEvent,
      reset,
    }),
    [currentDate, isPlaying, speed, minDate, maxDate, setDate, play, pause, togglePlay, setSpeed, goToEvent, reset]
  );

  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
}

export function useTimeline() {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error('useTimeline must be used within TimelineProvider');
  return ctx;
}
