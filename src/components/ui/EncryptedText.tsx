"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface EncryptedTextProps {
  text: string;
  className?: string;
  speed?: number;
  charset?: string;
}

const DEFAULT_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

export default function EncryptedText({
  text,
  className,
  speed = 50,
  charset = DEFAULT_CHARSET,
}: EncryptedTextProps) {
  const [display, setDisplay] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const iterationRef = useRef(0);

  const scramble = useCallback(() => {
    iterationRef.current = 0;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, i) => {
            if (char === " ") return " ";
            if (i < iterationRef.current) return text[i];
            return charset[Math.floor(Math.random() * charset.length)];
          })
          .join("")
      );
      iterationRef.current += 1 / 3;
      if (iterationRef.current >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplay(text);
      }
    }, speed);
  }, [text, speed, charset]);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplay(text);
  }, [text]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  return (
    <span className={className} onMouseEnter={scramble} onMouseLeave={reset}>
      {display}
    </span>
  );
}
