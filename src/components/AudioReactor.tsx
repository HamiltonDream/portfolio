"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { scrollState } from "@/lib/scrollState";

type AudioMode = "off" | "bpm" | "tab" | "mic";

/**
 * AudioReactor — real audio capture for accurate music reactivity.
 *
 * Flow when RIDE is clicked:
 * 1. BPM engine starts instantly (no delay)
 * 2. Browser prompts to share tab audio (getDisplayMedia)
 *    → Select the Spotify/SoundCloud tab + check "Share tab audio"
 * 3. If granted: switches to real FFT analysis (kills BPM)
 * 4. If denied: tries mic capture (getUserMedia)
 * 5. If mic denied: keeps BPM running
 */
export default function AudioReactor() {
  const [mode, setMode] = useState<AudioMode>("off");
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number>(0);
  const bpmRafRef = useRef<number>(0);
  const prevBassRef = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(false);

  /* ─── BPM ENGINE (instant start, no permissions needed) ─── */
  const startBPM = useCallback(() => {
    if (activeRef.current) return;
    activeRef.current = true;
    scrollState.audioActive = true;
    setMode("bpm");

    const bpm = 140;
    const beatInterval = 60000 / bpm;
    const halfBeat = beatInterval / 2;
    const startTime = performance.now();

    const loop = () => {
      const now = performance.now();
      const elapsed = now - startTime;
      const beatPhase = (elapsed % beatInterval) / beatInterval;
      const subPhase = (elapsed % halfBeat) / halfBeat;
      const buildUp = Math.min(elapsed / 6000, 1);

      const kick = beatPhase < 0.05 ? beatPhase / 0.05 : beatPhase < 0.3 ? 1 - (beatPhase - 0.05) / 0.25 : 0;
      const simBass = Math.min(Math.max(kick, 0) * buildUp, 1.0);
      const simMid = Math.min((0.4 + Math.sin(elapsed * 0.004) * 0.2) * buildUp, 1.0);
      const hihat = subPhase < 0.08 ? 1 - subPhase / 0.08 : 0;
      const simTreble = Math.min((hihat * 0.7 + 0.15) * buildUp, 1.0);

      const barPhase = (elapsed % (beatInterval * 16)) / (beatInterval * 16);
      const isDrop = barPhase > 0.9;
      const isBreak = barPhase > 0.45 && barPhase < 0.5;
      const mult = isDrop ? 1.5 : isBreak ? 0.1 : 1.0;

      scrollState.bass = scrollState.bass * 0.2 + simBass * mult * 0.8;
      scrollState.mid = scrollState.mid * 0.3 + simMid * mult * 0.7;
      scrollState.treble = scrollState.treble * 0.2 + simTreble * mult * 0.8;
      scrollState.energy = scrollState.bass * 0.5 + scrollState.mid * 0.3 + scrollState.treble * 0.2;
      scrollState.beat = beatPhase < 0.06 && !isBreak;

      bpmRafRef.current = requestAnimationFrame(loop);
    };
    bpmRafRef.current = requestAnimationFrame(loop);
  }, []);

  const stopBPM = useCallback(() => {
    cancelAnimationFrame(bpmRafRef.current);
  }, []);

  /* ─── REAL AUDIO ANALYSIS LOOP (shared by tab + mic) ─── */
  const startAnalysisLoop = useCallback(() => {
    if (!analyserRef.current || !dataRef.current) return;
    const analyser = analyserRef.current;
    const data = dataRef.current;
    const bins = analyser.frequencyBinCount;

    const loop = () => {
      analyser.getByteFrequencyData(data);

      let bassSum = 0, midSum = 0, trebSum = 0;
      for (let i = 0; i < bins; i++) {
        const v = data[i] / 255;
        if (i < 10) bassSum += v;
        else if (i < 50) midSum += v;
        else trebSum += v;
      }

      // Amplified values — push harder for stronger reactions
      const bass = Math.min((bassSum / 8) * 1.4, 1);
      const mid = Math.min((midSum / 35) * 1.3, 1);
      const treble = Math.min((trebSum / 60) * 1.5, 1);
      const energy = bass * 0.5 + mid * 0.3 + treble * 0.2;

      // Aggressive beat detection — lower threshold, wider window
      const bassSpike = bass - prevBassRef.current;
      const isBeat = bassSpike > 0.08 && bass > 0.2;
      prevBassRef.current = bass * 0.6 + prevBassRef.current * 0.4;

      // Minimal smoothing for SNAPPY real-time response
      scrollState.bass = scrollState.bass * 0.15 + bass * 0.85;
      scrollState.mid = scrollState.mid * 0.2 + mid * 0.8;
      scrollState.treble = scrollState.treble * 0.15 + treble * 0.85;
      scrollState.energy = scrollState.energy * 0.15 + energy * 0.85;
      scrollState.beat = isBeat;

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  /* ─── TAB AUDIO CAPTURE (getDisplayMedia — most accurate) ─── */
  const captureTabAudio = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: true,
        video: { width: 1, height: 1, frameRate: 1 }, // minimal video
      });

      // Check if we got an audio track
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getTracks().forEach(t => t.stop());
        return false;
      }

      // Stop the video track immediately — we only need audio
      stream.getVideoTracks().forEach(t => t.stop());

      // Create audio-only stream
      const audioStream = new MediaStream(audioTracks);
      streamRef.current = audioStream;

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(audioStream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6; // less smoothing = more reactive
      source.connect(analyser);

      ctxRef.current = ctx;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

      // Kill BPM, start real analysis
      stopBPM();
      startAnalysisLoop();
      setMode("tab");
      return true;
    } catch {
      return false;
    }
  }, [stopBPM, startAnalysisLoop]);

  /* ─── MIC CAPTURE (getUserMedia — fallback) ─── */
  const captureMic = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser);

      ctxRef.current = ctx;
      analyserRef.current = analyser;
      dataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;

      stopBPM();
      startAnalysisLoop();
      setMode("mic");
      return true;
    } catch {
      return false;
    }
  }, [stopBPM, startAnalysisLoop]);

  /* ─── MAIN START: BPM instant → try tab audio → try mic → keep BPM ─── */
  const startReacting = useCallback(async () => {
    // 1. Start BPM immediately so scene reacts right away
    startBPM();

    // 2. Try to capture tab audio (most accurate)
    const gotTab = await captureTabAudio();
    if (gotTab) return;

    // 3. Try mic capture
    const gotMic = await captureMic();
    if (gotMic) return;

    // 4. BPM keeps running as fallback — already started
  }, [startBPM, captureTabAudio, captureMic]);

  /* ─── EVENT LISTENER ─── */
  useEffect(() => {
    const handler = () => { startReacting(); };
    window.addEventListener("startAudioReact", handler);
    return () => window.removeEventListener("startAudioReact", handler);
  }, [startReacting]);

  /* ─── CLEANUP ─── */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(bpmRafRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (ctxRef.current) ctxRef.current.close();
      activeRef.current = false;
      scrollState.audioActive = false;
    };
  }, []);

  /* ─── SMALL STATUS INDICATOR ─── */
  if (mode === "off") return null;

  const label = mode === "tab" ? "TAB AUDIO" : mode === "mic" ? "MIC AUDIO" : "BEAT MODE";
  const color = mode === "tab" ? "#10B981" : mode === "mic" ? "#3B82F6" : "#7C3AED";

  return (
    <div style={{
      position: "fixed",
      top: 20,
      right: 80,
      zIndex: 60,
      display: "flex",
      alignItems: "center",
      gap: 6,
      pointerEvents: "none",
    }}>
      <div style={{
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: color,
        boxShadow: `0 0 8px ${color}`,
        animation: "pulse 1.5s infinite",
      }} />
      <span style={{
        fontSize: "0.45rem",
        letterSpacing: "0.25em",
        color: color,
        fontFamily: "monospace",
        opacity: 0.7,
      }}>{label}</span>
    </div>
  );
}
