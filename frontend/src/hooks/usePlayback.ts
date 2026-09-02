import { useCallback, useEffect, useMemo, useState } from 'react';

export function usePlayback(frameCount: number, fps: number) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    if (!playing || frameCount < 2) return;
    const interval = 1000 / (fps * speed || 20);
    const id = window.setInterval(() => {
      setFrame((current) => {
        if (current >= frameCount - 1) {
          if (loop) return 0;
          setPlaying(false);
          return current;
        }
        return current + 1;
      });
    }, interval);
    return () => window.clearInterval(id);
  }, [playing, frameCount, fps, speed, loop]);

  const reset = useCallback(() => {
    setPlaying(false);
    setFrame(0);
  }, []);

  const time = useMemo(() => frame / (fps || 20), [frame, fps]);

  return { frame, setFrame, playing, setPlaying, loop, setLoop, speed, setSpeed, reset, time };
}
