import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlayback } from './usePlayback';

describe('usePlayback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes with default values', () => {
    const { result } = renderHook(() => usePlayback(100, 20));

    expect(result.current.frame).toBe(0);
    expect(result.current.playing).toBe(false);
    expect(result.current.loop).toBe(true);
    expect(result.current.speed).toBe(1);
  });

  it('advances frame when playing', () => {
    const { result } = renderHook(() => usePlayback(100, 20));

    act(() => {
      result.current.setPlaying(true);
    });

    expect(result.current.playing).toBe(true);

    act(() => {
      vi.advanceTimersByTime(50); // 1000 / 20 = 50ms per frame
    });

    expect(result.current.frame).toBe(1);
  });

  it('loops back to start when reaching end', () => {
    const { result } = renderHook(() => usePlayback(5, 20));

    act(() => {
      result.current.setFrame(4); // Last frame
      result.current.setPlaying(true);
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.frame).toBe(0);
  });

  it('stops playing when loop is disabled and reaches end', () => {
    const { result } = renderHook(() => usePlayback(5, 20));

    act(() => {
      result.current.setLoop(false);
      result.current.setFrame(4);
      result.current.setPlaying(true);
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(result.current.playing).toBe(false);
    expect(result.current.frame).toBe(4);
  });

  it('resets to frame 0', () => {
    const { result } = renderHook(() => usePlayback(100, 20));

    act(() => {
      result.current.setFrame(50);
      result.current.setPlaying(true);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.frame).toBe(0);
    expect(result.current.playing).toBe(false);
  });

  it('adjusts playback speed', () => {
    const { result } = renderHook(() => usePlayback(100, 20));

    act(() => {
      result.current.setSpeed(2);
      result.current.setPlaying(true);
    });

    // At 2x speed, interval should be 25ms instead of 50ms
    act(() => {
      vi.advanceTimersByTime(25);
    });

    expect(result.current.frame).toBe(1);
  });

  it('calculates time correctly', () => {
    const { result } = renderHook(() => usePlayback(100, 20));

    act(() => {
      result.current.setFrame(20);
    });

    // 20 frames / 20 fps = 1 second
    expect(result.current.time).toBe(1);
  });
});
