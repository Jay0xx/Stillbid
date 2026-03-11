// src/hooks/useCountdown.js
import { useState, useEffect, useMemo } from 'react';

export const useCountdown = (endTimeUnix, startTimeUnix) => {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const end = Number(endTimeUnix);
  const start = startTimeUnix ? Number(startTimeUnix) : null;
  const diff = end - now;

  const isEnded = diff <= 0;
  const totalSeconds = isEnded ? 0 : diff;

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;

  const progress = useMemo(() => {
    if (!start || isEnded) return isEnded ? 100 : 0;
    const total = end - start;
    const elapsed = now - start;
    const pct = (elapsed / total) * 100;
    return Math.min(100, Math.max(0, pct));
  }, [start, end, now, isEnded]);

  return {
    hours,
    minutes,
    seconds,
    formatted: isEnded ? "Ended" : formatted,
    totalSeconds,
    isEnded,
    progress,
  };
};
