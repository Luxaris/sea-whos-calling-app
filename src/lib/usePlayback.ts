import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Plays a clip, or simulates playback with a timer when there is no audio file yet.
 * Returns elapsed seconds so callers can draw a playhead and "0:02 of 0:08".
 */
export function usePlayback(clipSeconds: number, audioUrl: string | null) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const frame = useRef<number>();
  const audio = useRef<HTMLAudioElement | null>(null);

  const stop = useCallback(() => {
    if (frame.current) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    audio.current?.pause();
    audio.current = null;
    setPlaying(false);
    setElapsed(0);
  }, []);

  const play = useCallback(() => {
    const started = performance.now();
    if (audioUrl) {
      const el = new Audio(audioUrl);
      el.addEventListener('ended', stop);
      el.play().catch(stop);
      audio.current = el;
    }
    setPlaying(true);
    setElapsed(0);
    const tick = (t: number) => {
      const seconds = audio.current ? audio.current.currentTime : (t - started) / 1000;
      if (seconds >= clipSeconds) {
        stop();
        return;
      }
      setElapsed(seconds);
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  }, [audioUrl, clipSeconds, stop]);

  const toggle = useCallback(() => (playing ? stop() : play()), [playing, play, stop]);

  useEffect(() => stop, [stop]);

  return { playing, elapsed, progress: clipSeconds > 0 ? elapsed / clipSeconds : 0, toggle, stop };
}
