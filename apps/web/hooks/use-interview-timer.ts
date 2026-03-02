"use client";

import { useEffect, useMemo, useState } from "react";

export const useInterviewTimer = (durationSeconds: number) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setElapsedSeconds((previous) => Math.min(previous + 1, durationSeconds));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [durationSeconds]);

  const remainingSeconds = useMemo(() => Math.max(durationSeconds - elapsedSeconds, 0), [durationSeconds, elapsedSeconds]);

  return { elapsedSeconds, remainingSeconds };
};
