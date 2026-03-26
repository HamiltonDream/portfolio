"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   SCROLL-DRIVEN VIDEO PORTFOLIO
   You scroll → he walks. Each environment = a discipline.
   Smooth crossfades between worlds. Infinite loop.
   ═══════════════════════════════════════════════════════════════ */

/*
  ENVIRONMENTS — each one is a world you walk through.
  They have different vibes, colors, content.
  3D models will be added per-environment later.
*/
const ENVIRONMENTS = [
  {
    id: "intro",
    label: "INTRO",
    title: "NOAH\nHAMILTON",
    subtitle: "CREATIVE DEVELOPER & PRODUCER",
    description: "Code. Sound. Motion.\nBuilding at the intersection of every creative discipline.",
    color: "#ffffff",
    accent: "rgba(255,255,255,0.12)",
    gradient: "linear-gradient(135deg, rgba(20,20,30,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(20,20,30,0.85) 100%)",
  },
  {
    id: "dev",
    label: "DEVELOPMENT",
    title: "Field Ops\nManagement",
    subtitle: "FULL STACK · SAAS · REACT",
    description: "Enterprise field operations platform. Real-time scheduling, crew management, invoicing — the whole stack.",
    color: "#4ADE80",
    accent: "rgba(74,222,128,0.08)",
    gradient: "linear-gradient(135deg, rgba(0,20,10,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,20,10,0.8) 100%)",
    url: "https://www.fieldopsmanagement.com/",
    num: "01",
  },
  {
    id: "design",
    label: "DESIGN",
    title: "Cal\nDreamscape",
    subtitle: "WEB DESIGN · BRANDING",
    description: "Complete brand identity and website for a California landscape company. Nature-inspired, premium feel.",
    color: "#A8B4A5",
    accent: "rgba(168,180,165,0.08)",
    gradient: "linear-gradient(135deg, rgba(15,20,15,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(15,20,15,0.8) 100%)",
    url: "https://caldreamscapelandscape.com/",
    num: "02",
  },
  {
    id: "apps",
    label: "APPS",
    title: "Cookie\nTracker",
    subtitle: "WEB APP · REACT · ANALYTICS",
    description: "Analytics dashboard for tracking cookies, sessions, and user behavior. Clean data visualization.",
    color: "#60A5FA",
    accent: "rgba(96,165,250,0.08)",
    gradient: "linear-gradient(135deg, rgba(0,10,30,0.8) 0%, rgba(0,0,0,0.3) 50%, rgba(0,10,30,0.8) 100%)",
    url: "https://cookietracker.site/",
    num: "03",
  },
  {
    id: "music",
    label: "MUSIC",
    title: "Undiscovered",
    subtitle: "MUSIC · PRODUCTION · ALBUM",
    description: "Full-length album. Produced, mixed, and mastered. Every sound from scratch.",
    color: "#C084FC",
    accent: "rgba(192,132,252,0.08)",
    gradient: "linear-gradient(135deg, rgba(20,0,30,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(20,0,30,0.85) 100%)",
    url: "https://open.spotify.com/album/1rWPihEZtSm2zZKjvjKdvx",
    num: "04",
  },
  {
    id: "motion",
    label: "MOTION",
    title: "Motion\nReel",
    subtitle: "ANIMATION · MOTION · 3D",
    description: "Compilation of motion design, 3D animation, and visual effects work.",
    color: "#FB923C",
    accent: "rgba(251,146,60,0.08)",
    gradient: "linear-gradient(135deg, rgba(25,12,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(25,12,0,0.85) 100%)",
    url: "https://www.youtube.com/watch?v=eIp-fptOEwA&list=PLK9JwrqTx7UpF1JQ81kpahVNeRLrvZwil",
    num: "05",
  },
  {
    id: "contact",
    label: "CONTACT",
    title: "Let's\nBuild",
    subtitle: "GET IN TOUCH",
    description: "Available for freelance, collaborations, and creative partnerships.",
    color: "#F472B6",
    accent: "rgba(244,114,182,0.08)",
    gradient: "linear-gradient(135deg, rgba(25,0,15,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(25,0,15,0.85) 100%)",
  },
];

const ENV_COUNT = ENVIRONMENTS.length;

/* Section boundaries — each env gets an equal slice of 0-1 progress */
function getEnvIndex(progress: number): number {
  return Math.min(Math.floor(progress * ENV_COUNT), ENV_COUNT - 1);
}

function getEnvBlend(progress: number): { current: number; next: number; t: number } {
  const slice = 1 / ENV_COUNT;
  const idx = Math.min(Math.floor(progress / slice), ENV_COUNT - 1);
  const local = (progress - idx * slice) / slice; // 0-1 within this env
  // Blend zone: last 20% of each section crossfades into next
  const blendStart = 0.75;
  const t = local > blendStart ? (local - blendStart) / (1 - blendStart) : 0;
  const nextIdx = (idx + 1) % ENV_COUNT;
  return { current: idx, next: nextIdx, t };
}

/* Smooth easing */
const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function Portfolio() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const targetRef = useRef(0);
  const rafRef = useRef(0);
  const [autoWalk, setAutoWalk] = useState(false);
  const autoWalkRef = useRef(false);

  /* Try to grab duration from video — multiple strategies */
  const tryReady = useCallback(() => {
    const v = videoRef.current;
    if (!v || videoReady) return;
    if (v.duration && isFinite(v.duration) && v.duration > 0) {
      setVideoDuration(v.duration);
      setVideoReady(true);
      v.currentTime = 0;
    }
  }, [videoReady]);

  /* Poll for readiness + timeout fallback */
  useEffect(() => {
    const interval = setInterval(() => tryReady(), 200);
    const timeout = setTimeout(() => {
      // After 3s, show the page even if video isn't ready
      setVideoReady(true);
    }, 3000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [tryReady]);

  /* ─── Scroll input ─── */
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Gentle scroll ratio — needs good amount of scroll to walk through
      const sensitivity = window.innerHeight * 8;
      targetRef.current += e.deltaY / sensitivity;

      // Infinite wrap
      if (targetRef.current < 0) targetRef.current += 1;
      if (targetRef.current >= 1) targetRef.current -= 1;
    };

    let touchY = 0;
    const onTS = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTM = (e: TouchEvent) => {
      e.preventDefault();
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      targetRef.current += dy / (window.innerHeight * 8);
      if (targetRef.current < 0) targetRef.current += 1;
      if (targetRef.current >= 1) targetRef.current -= 1;
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchmove", onTM, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchmove", onTM);
    };
  }, []);

  /* ─── Render loop: smooth seeking, no play/pause ─── */
  useEffect(() => {
    let frameCount = 0;

    const loop = () => {
      const video = videoRef.current;

      if (video && videoDuration > 0) {
        // Shortest-path lerp around the loop
        let diff = targetRef.current - progressRef.current;
        if (diff > 0.5) diff -= 1;
        if (diff < -0.5) diff += 1;

        // Responsive lerp — snappy but still smooth
        progressRef.current += diff * 0.18;
        if (progressRef.current < 0) progressRef.current += 1;
        if (progressRef.current >= 1) progressRef.current -= 1;

        // Auto-walk: advance target when active
        if (autoWalkRef.current) {
          targetRef.current += 0.0008;
          if (targetRef.current >= 1) targetRef.current -= 1;
        }

        // Seek only when change is meaningful (avoids micro-stutter)
        const targetTime = progressRef.current * videoDuration;
        if (Math.abs(video.currentTime - targetTime) > 0.02) {
          if (typeof video.fastSeek === "function") {
            video.fastSeek(targetTime);
          } else {
            video.currentTime = targetTime;
          }
        }

        // Throttle React state updates (every 4 frames)
        frameCount++;
        if (frameCount % 4 === 0) {
          setProgress(progressRef.current);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoDuration]);

  /* ─── Derived state ─── */
  const blend = useMemo(() => getEnvBlend(progress), [progress]);
  const env = ENVIRONMENTS[blend.current];
  const nextEnv = ENVIRONMENTS[blend.next];
  const envIdx = blend.current;

  /* Compute local progress within current environment (0-1) */
  const localProgress = useMemo(() => {
    const slice = 1 / ENV_COUNT;
    return (progress - envIdx * slice) / slice;
  }, [progress, envIdx]);

  /* Keep ref in sync with state */
  useEffect(() => { autoWalkRef.current = autoWalk; }, [autoWalk]);

  /* Stop auto-walk on manual scroll */
  useEffect(() => {
    const stop = () => { if (autoWalkRef.current) setAutoWalk(false); };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    return () => { window.removeEventListener("wheel", stop); window.removeEventListener("touchstart", stop); };
  }, []);

  /* Nav click → jump to environment */
  const navTo = useCallback((idx: number) => {
    const slice = 1 / ENV_COUNT;
    targetRef.current = idx * slice + slice * 0.1;
  }, []);

  const toggleAutoWalk = useCallback(() => {
    setAutoWalk(prev => !prev);
  }, []);

  /* ─── Determine which color/gradient to show (with crossfade) ─── */
  const blendedColor = blend.t > 0 ? nextEnv.color : env.color;

  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", background: "#000", position: "relative", cursor: "default" }}>

      {/* ═══ VIDEO ═══ */}
      <video
        ref={videoRef}
        src="/walk-loop.mp4"
        muted
        playsInline
        preload="auto"
        onLoadedMetadata={tryReady}
        onLoadedData={tryReady}
        onCanPlay={tryReady}
        style={{
          position: "fixed", inset: 0,
          width: "100%", height: "100%",
          objectFit: "cover", zIndex: 0,
        }}
      />

      {/* ═══ ENVIRONMENT COLOR OVERLAY — crossfades between worlds ═══ */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
        background: env.gradient,
        opacity: 1 - blend.t,
        transition: "opacity 0.1s linear",
      }} />
      {blend.t > 0 && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
          background: nextEnv.gradient,
          opacity: blend.t,
        }} />
      )}

      {/* ═══ VIGNETTE ═══ */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)",
      }} />

      {/* ═══ BOTTOM GRADIENT ═══ */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, height: "50%",
        zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
      }} />

      {/* ═══ TOP GRADIENT ═══ */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "25%",
        zIndex: 2, pointerEvents: "none",
        background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
      }} />

      {/* ═══ PROGRESS BAR ═══ */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 2, zIndex: 60,
        pointerEvents: "none",
      }}>
        <div style={{
          height: "100%",
          width: `${progress * 100}%`,
          background: blendedColor,
          opacity: 0.5,
          transition: "background 0.5s",
        }} />
      </div>

      {/* ═══ NAV ═══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "24px 40px",
      }}>
        <button
          onClick={() => navTo(0)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: "0.7rem", letterSpacing: "0.5em",
            fontFamily: "var(--font-mono, monospace)",
            color: "rgba(255,255,255,0.5)", fontWeight: 600,
          }}
        >HAMILTON</button>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {[
            { label: "WORK", idx: 1 },
            { label: "MUSIC", idx: 4 },
            { label: "ABOUT", idx: 5 },
            { label: "CONTACT", idx: 6 },
          ].map(({ label, idx }) => (
            <button
              key={label}
              onClick={() => navTo(idx)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "0.55rem", letterSpacing: "0.25em",
                color: envIdx === idx ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
                fontFamily: "var(--font-mono, monospace)",
                transition: "color 0.4s",
                padding: "4px 0",
              }}
            >{label}</button>
          ))}
        </div>
      </nav>

      {/* ═══ ENVIRONMENT LABEL — left side, vertical ═══ */}
      <div style={{
        position: "fixed", left: 40, top: "50%", transform: "translateY(-50%) rotate(-90deg)",
        zIndex: 30, pointerEvents: "none",
        transformOrigin: "center center",
      }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={env.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 0.15, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.6, ease }}
            style={{
              fontSize: "0.6rem",
              letterSpacing: "0.5em",
              color: env.color,
              fontFamily: "var(--font-mono, monospace)",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >{env.label}</motion.span>
        </AnimatePresence>
      </div>

      {/* ═══ SIDE DOTS ═══ */}
      <div style={{
        position: "fixed", right: 24, top: "50%", transform: "translateY(-50%)",
        zIndex: 50, display: "flex", flexDirection: "column", gap: 6,
      }}>
        {ENVIRONMENTS.map((e, i) => (
          <button
            key={e.id}
            onClick={() => navTo(i)}
            style={{
              width: envIdx === i ? 24 : 4,
              height: 4,
              borderRadius: 2,
              background: envIdx === i ? e.color : "rgba(255,255,255,0.12)",
              border: "none", cursor: "pointer", padding: 0,
              transition: "all 0.5s cubic-bezier(0.25,0.46,0.45,0.94)",
            }}
          />
        ))}
      </div>

      {/* ═══ MAIN CONTENT — changes per environment ═══ */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none",
        display: "flex", alignItems: "flex-end",
        padding: "0 40px 120px 40px",
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={env.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.7, ease }}
            style={{ maxWidth: 600, pointerEvents: "auto" }}
          >
            {/* Number watermark */}
            {"num" in env && env.num && (
              <span style={{
                fontSize: "clamp(6rem, 18vw, 14rem)",
                fontWeight: 900,
                fontFamily: "var(--font-display, sans-serif)",
                color: env.color,
                opacity: 0.04,
                lineHeight: 0.8,
                display: "block",
                marginBottom: -40,
                userSelect: "none",
              }}>{env.num}</span>
            )}

            {/* Subtitle / tag */}
            <p style={{
              fontSize: "0.5rem",
              letterSpacing: "0.4em",
              color: env.color,
              fontFamily: "var(--font-mono, monospace)",
              marginBottom: 12,
              opacity: 0.6,
            }}>{env.subtitle}</p>

            {/* Title */}
            <h1 style={{
              fontSize: env.id === "intro"
                ? "clamp(3.5rem, 11vw, 9rem)"
                : "clamp(2rem, 5vw, 4.5rem)",
              fontWeight: env.id === "intro" ? 800 : 700,
              lineHeight: env.id === "intro" ? 0.85 : 1.05,
              letterSpacing: "-0.03em",
              fontFamily: "var(--font-display, sans-serif)",
              color: "#fff",
              whiteSpace: "pre-line",
              textShadow: "0 4px 40px rgba(0,0,0,0.4)",
              marginBottom: 16,
            }}>{env.title}</h1>

            {/* Description */}
            <p style={{
              fontSize: "0.85rem",
              color: "rgba(255,255,255,0.3)",
              lineHeight: 1.7,
              maxWidth: 420,
              whiteSpace: "pre-line",
            }}>{env.description}</p>

            {/* Link */}
            {"url" in env && env.url && (
              <a
                href={env.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 24,
                  padding: "10px 24px",
                  borderRadius: 999,
                  border: `1px solid ${env.color}30`,
                  background: `${env.color}08`,
                  color: env.color,
                  fontSize: "0.55rem",
                  fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.15em",
                  textDecoration: "none",
                  transition: "all 0.4s",
                  pointerEvents: "auto",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${env.color}18`;
                  e.currentTarget.style.borderColor = `${env.color}60`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `${env.color}08`;
                  e.currentTarget.style.borderColor = `${env.color}30`;
                }}
              >VIEW PROJECT →</a>
            )}

            {/* Contact buttons */}
            {env.id === "contact" && (
              <div style={{ display: "flex", gap: 12, marginTop: 24, pointerEvents: "auto" }}>
                <a href="mailto:hello@hamilton.dev" style={{
                  padding: "12px 28px", borderRadius: 999,
                  border: `1px solid ${env.color}40`,
                  background: `${env.color}10`,
                  color: env.color,
                  fontSize: "0.55rem", fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.15em", textDecoration: "none",
                }}>EMAIL ME</a>
                <a href="#" style={{
                  padding: "12px 28px", borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "0.55rem", fontFamily: "var(--font-mono, monospace)",
                  letterSpacing: "0.15em", textDecoration: "none",
                }}>RESUME</a>
              </div>
            )}

            {/* Intro scroll hint */}
            {env.id === "intro" && (
              <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16 }}>
                <button
                  onClick={toggleAutoWalk}
                  style={{
                    padding: "10px 28px",
                    borderRadius: 999,
                    background: autoWalk ? "rgba(255,255,255,0.1)" : "transparent",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: autoWalk ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
                    fontSize: "0.55rem",
                    fontFamily: "var(--font-mono, monospace)",
                    letterSpacing: "0.2em",
                    cursor: "pointer",
                    transition: "all 0.4s",
                    pointerEvents: "auto",
                  }}
                >{autoWalk ? "■ STOP" : "▶ AUTO WALK"}</button>
                <motion.p
                  animate={{ opacity: [0.15, 0.4, 0.15] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{
                    fontSize: "0.5rem",
                    letterSpacing: "0.4em",
                    color: "rgba(255,255,255,0.15)",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >OR SCROLL TO WALK ↓</motion.p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ MUSIC PLAYER — only visible in music environment ═══ */}
      <AnimatePresence>
        {env.id === "music" && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.6 }}
            style={{
              position: "fixed", bottom: 20, right: 40,
              zIndex: 55, pointerEvents: "auto",
            }}
          >
            <div style={{
              width: 320, padding: "8px 14px 12px",
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(192,132,252,0.12)",
              borderRadius: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <p style={{ fontSize: "0.4rem", letterSpacing: "0.3em", color: "rgba(192,132,252,0.5)", fontFamily: "var(--font-mono, monospace)" }}>♫ UNDISCOVERED</p>
                <a href="https://music.apple.com/us/album/undiscovered/1882395617" target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.4rem", color: "rgba(255,255,255,0.15)", fontFamily: "var(--font-mono, monospace)", textDecoration: "none", letterSpacing: "0.15em" }}>APPLE MUSIC →</a>
              </div>
              <iframe title="Spotify" src="https://open.spotify.com/embed/album/1rWPihEZtSm2zZKjvjKdvx?theme=0" width="100%" height="80" style={{ borderRadius: 8, border: "none" }} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ FLOATING ENVIRONMENT INDICATOR — bottom right ═══ */}
      <div style={{
        position: "fixed", bottom: 30, right: 40, zIndex: 30,
        pointerEvents: "none",
      }}>
        {env.id !== "music" && (
          <AnimatePresence mode="wait">
            <motion.div
              key={env.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 16px",
                borderRadius: 999,
                background: "rgba(0,0,0,0.5)",
                backdropFilter: "blur(12px)",
                border: `1px solid ${env.color}15`,
              }}
            >
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: env.color, opacity: 0.6,
              }} />
              <span style={{
                fontSize: "0.45rem", letterSpacing: "0.3em",
                color: "rgba(255,255,255,0.4)",
                fontFamily: "var(--font-mono, monospace)",
              }}>{env.label}</span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* ═══ SCROLL VELOCITY INDICATOR — subtle motion lines ═══ */}

      {/* ═══ LOADER ═══ */}
      <AnimatePresence>
        {!videoReady && (
          <motion.div
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease }}
            style={{
              position: "fixed", inset: 0, zIndex: 100,
              background: "#000",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 24,
            }}
          >
            <motion.div
              animate={{ scaleX: [0, 1] }}
              transition={{ duration: 3, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                width: 120, height: 1,
                background: "rgba(255,255,255,0.2)",
                transformOrigin: "left",
              }}
            />
            <motion.p
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                fontSize: "0.55rem", letterSpacing: "0.5em",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >LOADING</motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
