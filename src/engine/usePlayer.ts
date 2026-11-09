import { useCallback, useEffect, useRef, useState } from "react";
import type { Frame } from "./types";

export interface PlayerApi<S> {
  frame: Frame<S>;
  index: number;
  total: number;
  playing: boolean;
  speed: number;
  setSpeed: (s: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
  seek: (i: number) => void;
}

/** Velocidades: milissegundos por passo. */
export const SPEEDS = [1600, 1000, 650, 380, 180];

export function usePlayer<S>(frames: Frame<S>[], autoPlay = false): PlayerApi<S> {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const timer = useRef<number | null>(null);

  // Sempre que os quadros mudam (novos dados), volta para o início.
  useEffect(() => {
    setIndex(0);
    setPlaying(autoPlay && frames.length > 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames]);

  const last = frames.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (index >= last) {
      setPlaying(false);
      return;
    }
    timer.current = window.setTimeout(() => setIndex((i) => Math.min(i + 1, last)), SPEEDS[speed]);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [playing, index, last, speed]);

  const play = useCallback(() => {
    setIndex((i) => (i >= last ? 0 : i));
    setPlaying(true);
  }, [last]);
  const pause = useCallback(() => setPlaying(false), []);
  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);
  const next = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.min(i + 1, last));
  }, [last]);
  const prev = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);
  const reset = useCallback(() => {
    setPlaying(false);
    setIndex(0);
  }, []);
  const seek = useCallback(
    (i: number) => {
      setPlaying(false);
      setIndex(Math.max(0, Math.min(i, last)));
    },
    [last],
  );

  const safe = Math.min(index, last);
  return {
    frame: frames[safe],
    index: safe,
    total: frames.length,
    playing,
    speed,
    setSpeed,
    play,
    pause,
    toggle,
    next,
    prev,
    reset,
    seek,
  };
}
