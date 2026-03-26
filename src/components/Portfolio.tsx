"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";

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
    previewUrl: "https://www.fieldopsmanagement.com/",
    previewType: "site" as const,
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
    previewUrl: "https://caldreamscapelandscape.com/",
    previewType: "site" as const,
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
    previewUrl: "https://cookietracker.site/",
    previewType: "site" as const,
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
    previewUrl: "https://open.spotify.com/embed/album/1rWPihEZtSm2zZKjvjKdvx?theme=0",
    previewType: "embed" as const,
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
    previewUrl: "https://www.youtube.com/embed/eIp-fptOEwA?autoplay=0&controls=0&modestbranding=1&rel=0",
    previewType: "embed" as const,
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);
  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const [autoWalk, setAutoWalk] = useState(false);
  const autoWalkRef = useRef(false);
  const progressRef = useRef(0);
  const lastPaintedTime = useRef(-1);
  const [suckingIn, setSuckingIn] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewRect, setPreviewRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  /* Idle state machine: walking → stopping → idle → restarting → walking */
  type IdleState = "walking" | "stopping" | "idle" | "restarting";
  const [idleState, setIdleState] = useState<IdleState>("idle");
  const idleStateRef = useRef<IdleState>("idle");
  const hasScrolledRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleStopRef = useRef<HTMLVideoElement>(null);
  const idleLoopRef = useRef<HTMLVideoElement>(null);
  const idleRestartRef = useRef<HTMLVideoElement>(null);
  /* Walk animation time — always advances forward regardless of scroll direction */
  const walkTimeRef = useRef(0);
  /* Accumulated scroll velocity — drives walk playback rate for smooth animation */
  const scrollVelocityRef = useRef(0);
  /* Track scroll direction: 1 = forward (right), -1 = backward (left) */
  const scrollDirRef = useRef(1);
  /* ─── Cinematic Camera System ─── */
  const cameraScale = useMotionValue(1);
  const cameraX = useMotionValue(0);
  const cameraY = useMotionValue(0);
  const cameraRotate = useMotionValue(0);
  const smoothScale = useSpring(cameraScale, { stiffness: 80, damping: 20, mass: 0.8 });
  const smoothX = useSpring(cameraX, { stiffness: 60, damping: 18, mass: 0.6 });
  const smoothY = useSpring(cameraY, { stiffness: 60, damping: 18, mass: 0.6 });
  const smoothRotate = useSpring(cameraRotate, { stiffness: 70, damping: 22, mass: 0.5 });
  const lastEnvRef = useRef(0);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });
  const tiltX = useTransform(springY, [-0.5, 0.5], [5, -5]);
  const tiltY = useTransform(springX, [-0.5, 0.5], [-5, 5]);

  /* Mark active on scroll — triggers restart transition if idle */
  const startIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      if (idleStateRef.current !== "walking") return;
      const sv = idleStopRef.current;
      if (sv) {
        sv.currentTime = 0;
        sv.play().catch(() => {});
      }
      idleStateRef.current = "stopping";
      setIdleState("stopping");
      /* Camera: pull back when entering idle */
      cameraScale.set(0.97);
      cameraY.set(8);
      setTimeout(() => { cameraScale.set(1); cameraY.set(0); }, 200);
    }, 500);
  }, [cameraScale, cameraY]);

  const markActive = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    hasScrolledRef.current = true;

    const state = idleStateRef.current;
    if (state === "idle" || state === "stopping") {
      idleStopRef.current?.pause();
      idleLoopRef.current?.pause();
      const rv = idleRestartRef.current;
      if (rv) {
        rv.currentTime = 0;
        rv.play().catch(() => {});
      }
      idleStateRef.current = "restarting";
      setIdleState("restarting");
      /* Camera: punch in when restarting walk */
      cameraScale.set(1.03);
      cameraRotate.set(scrollDirRef.current * -0.6);
      setTimeout(() => { cameraScale.set(1); cameraRotate.set(0); }, 250);
    } else if (state === "walking") {
      startIdleTimer();
    }
  }, [startIdleTimer, cameraScale, cameraRotate]);

  /* Start idle loop on page load — character faces camera until first scroll */
  useEffect(() => {
    const lv = idleLoopRef.current;
    if (lv) {
      lv.currentTime = 0;
      lv.play().catch(() => {});
    }
  }, []);

  /* Try to grab duration from video — multiple strategies */
  const tryReady = useCallback(() => {
    const v = videoRef.current;
    if (!v || videoReady) return;
    if (v.duration && isFinite(v.duration) && v.duration > 0) {
      setVideoDuration(v.duration);
      setVideoReady(true);
      v.currentTime = 0;
      v.pause();
    }
  }, [videoReady]);

  /* Size canvases to viewport (retina-aware) */
  useEffect(() => {
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      [canvasRef.current].forEach(c => {
        if (c) {
          c.width = w * dpr;
          c.height = h * dpr;
          c.style.width = w + "px";
          c.style.height = h + "px";
        }
      });
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  /* Poll for readiness + timeout fallback */
  useEffect(() => {
    const interval = setInterval(() => tryReady(), 200);
    const timeout = setTimeout(() => {
      setVideoReady(true);
    }, 3000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [tryReady]);

  /* ─── Scroll input: move target position directly ─── */
  useEffect(() => {
    if (!videoDuration) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      markActive();
      const delta = (e.deltaY / (window.innerHeight * 6)) * videoDuration;
      if (delta !== 0) scrollDirRef.current = delta > 0 ? 1 : -1;
      targetTimeRef.current += delta;
      targetTimeRef.current = ((targetTimeRef.current % videoDuration) + videoDuration) % videoDuration;
      /* Accumulate scroll velocity for smooth walk playback */
      scrollVelocityRef.current += Math.abs(delta);
    };

    let touchY = 0;
    const onTS = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTM = (e: TouchEvent) => {
      e.preventDefault();
      markActive();
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      const delta = (dy / (window.innerHeight * 6)) * videoDuration;
      if (dy !== 0) scrollDirRef.current = dy > 0 ? 1 : -1;
      targetTimeRef.current += delta;
      targetTimeRef.current = ((targetTimeRef.current % videoDuration) + videoDuration) % videoDuration;
      scrollVelocityRef.current += Math.abs(delta);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchmove", onTM, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchmove", onTM);
    };
  }, [videoDuration, markActive]);

  /* ─── Render loop: canvas-based, seek-safe ─── */
  useEffect(() => {
    let frameCount = 0;
    let isSeeking = false;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true }) || null;

    /* Offscreen canvas for transition fallback — only written right before idle or during idle */
    let snapshotCanvas: HTMLCanvasElement | null = null;
    let snapshotCtx: CanvasRenderingContext2D | null = null;
    let hasSnapshot = false;

    const ensureSnapshotCanvas = () => {
      if (!canvas) return;
      if (!snapshotCanvas) {
        snapshotCanvas = document.createElement("canvas");
        snapshotCanvas.width = canvas.width;
        snapshotCanvas.height = canvas.height;
        snapshotCtx = snapshotCanvas.getContext("2d");
      } else if (snapshotCanvas.width !== canvas.width || snapshotCanvas.height !== canvas.height) {
        snapshotCanvas.width = canvas.width;
        snapshotCanvas.height = canvas.height;
        snapshotCtx = snapshotCanvas.getContext("2d");
        hasSnapshot = false;
      }
    };

    const saveSnapshot = () => {
      if (!canvas) return;
      ensureSnapshotCanvas();
      if (snapshotCtx) {
        snapshotCtx.drawImage(canvas, 0, 0);
        hasSnapshot = true;
      }
    };

    const restoreSnapshot = () => {
      if (hasSnapshot && snapshotCanvas && ctx && canvas) {
        ctx.drawImage(snapshotCanvas, 0, 0);
      }
    };

    /* Draw video to canvas with "cover" scaling.
       flip = true → mirror horizontally around the character's center,
       NOT the canvas center, so position doesn't shift. */
    const CHAR_CENTER_FRAC = 0.5; // character's x center as fraction of video width — tune if needed
    const drawCover = (vid: HTMLVideoElement, flip = false) => {
      if (!ctx || !canvas) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const vw = vid.videoWidth || 1;
      const vh = vid.videoHeight || 1;
      const scale = Math.max(cw / vw, ch / vh);
      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (cw - dw) / 2;
      const dy = (ch - dh) / 2;
      ctx.clearRect(0, 0, cw, ch);
      if (flip) {
        /* Flip around the character's screen-space center so they stay put */
        const charScreenX = dx + CHAR_CENTER_FRAC * vw * scale;
        ctx.save();
        ctx.translate(charScreenX, 0);
        ctx.scale(-1, 1);
        ctx.translate(-charScreenX, 0);
        ctx.drawImage(vid, dx, dy, dw, dh);
        ctx.restore();
      } else {
        ctx.drawImage(vid, dx, dy, dw, dh);
      }
    };

    const onSeeked = () => {
      isSeeking = false;
      if (!video) return;
      drawCover(video, scrollDirRef.current < 0);
      lastPaintedTime.current = video.currentTime;
      saveSnapshot();
    };

    if (video) {
      video.addEventListener("seeked", onSeeked);
    }

    const loop = () => {
      const v = videoRef.current;

      /* ═══ IDLE VIDEO STATE: draw idle clips when not walking ═══ */
      const iState = idleStateRef.current;
      if (iState !== "walking") {
        const idleVid =
          iState === "stopping" ? idleStopRef.current :
          iState === "idle" ? idleLoopRef.current :
          iState === "restarting" ? idleRestartRef.current : null;

        /* Play-once freeze for idle loop */
        if (iState === "idle" && idleVid && idleVid.duration && idleVid.currentTime >= idleVid.duration - 0.25) {
          idleVid.pause();
        }

        const vidReady = idleVid && idleVid.readyState >= 2;
        const flipIdle = scrollDirRef.current < 0;

        if (vidReady) {
          drawCover(idleVid!, flipIdle);
          saveSnapshot();
        } else if (hasSnapshot) {
          restoreSnapshot();
        }
        /* else: initial page load, no snapshot, canvas stays transparent (black = transparent via screen blend) */

        /* Keep currentTimeRef tracking so there's no jump when walking resumes */
        if (videoDuration > 0) {
          currentTimeRef.current = targetTimeRef.current;
          progressRef.current = currentTimeRef.current / videoDuration;
          frameCount++;
          if (frameCount % 6 === 0) setProgress(progressRef.current);
        }
        isSeeking = false;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      /* ═══ WALKING STATE ═══ */
      if (v && videoDuration > 0) {
        if (autoWalkRef.current) {
          /* Auto-walk: video plays naturally, sections crawl */
          if (v.paused) {
            v.playbackRate = 1.0;
            v.play().catch(() => {});
          }
          if (Math.abs(v.currentTime - lastPaintedTime.current) > 0.01) {
            drawCover(v, scrollDirRef.current < 0);
            lastPaintedTime.current = v.currentTime;
            saveSnapshot();
          }
          const sectionSpeed = 0.0003;
          currentTimeRef.current += sectionSpeed * videoDuration;
          currentTimeRef.current = currentTimeRef.current % videoDuration;
          targetTimeRef.current = currentTimeRef.current;

        } else {
          /* Scroll mode: velocity-driven playback for smooth walk */

          /* Section progress: lerp toward scroll target */
          let diff = targetTimeRef.current - currentTimeRef.current;
          if (diff > videoDuration / 2) diff -= videoDuration;
          if (diff < -videoDuration / 2) diff += videoDuration;
          currentTimeRef.current += diff * 0.3;
          currentTimeRef.current = ((currentTimeRef.current % videoDuration) + videoDuration) % videoDuration;

          /* Walk animation: play at speed proportional to scroll velocity */
          const vel = scrollVelocityRef.current;
          scrollVelocityRef.current *= 0.85; /* decay each frame */
          const rate = Math.min(vel * 25, 3); /* scale to playback rate, cap at 3× */
          if (rate > 0.07) {
            v.playbackRate = Math.max(rate, 0.25);
            if (v.paused) v.play().catch(() => {});
          } else {
            scrollVelocityRef.current = 0;
            if (!v.paused) v.pause();
          }

          /* Paint the latest decoded frame */
          if (v.readyState >= 2 && Math.abs(v.currentTime - lastPaintedTime.current) > 0.005) {
            drawCover(v, scrollDirRef.current < 0);
            lastPaintedTime.current = v.currentTime;
            saveSnapshot();
          }
        }

        progressRef.current = currentTimeRef.current / videoDuration;
        frameCount++;
        if (frameCount % 6 === 0) {
          setProgress(progressRef.current);
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      if (video) {
        video.removeEventListener("seeked", onSeeked);
      }
      snapshotCanvas = null;
      snapshotCtx = null;
    };
  }, [videoDuration]);

  /* ─── Derived state ─── */
  const blend = useMemo(() => getEnvBlend(progress), [progress]);
  const env = ENVIRONMENTS[blend.current];
  const nextEnv = ENVIRONMENTS[blend.next];
  const envIdx = blend.current;

  /* Camera kick on environment change */
  useEffect(() => {
    if (lastEnvRef.current !== envIdx) {
      const dir = envIdx > lastEnvRef.current ? 1 : -1;
      cameraScale.set(1.04);
      cameraX.set(dir * -20);
      cameraRotate.set(dir * -0.8);
      cameraY.set(-5);
      setTimeout(() => {
        cameraScale.set(1);
        cameraX.set(0);
        cameraRotate.set(0);
        cameraY.set(0);
      }, 100);
      lastEnvRef.current = envIdx;
    }
  }, [envIdx, cameraScale, cameraX, cameraRotate, cameraY]);

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
    const v = videoRef.current;
    if (!v || !videoDuration) return;
    const slice = 1 / ENV_COUNT;
    const targetProgress = idx * slice + slice * 0.1;
    const t = targetProgress * videoDuration;
    v.currentTime = t;
    targetTimeRef.current = t;
    currentTimeRef.current = t;
    progressRef.current = targetProgress;
  }, [videoDuration]);

  const toggleAutoWalk = useCallback(() => {
    setAutoWalk(prev => !prev);
  }, []);

  /* ─── Click-to-enter: cinematic camera-zoom transition ─── */
  const handlePreviewClick = useCallback((url: string) => {
    if (suckingIn) return;
    const el = previewRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setPreviewRect({ x: r.left, y: r.top, w: r.width, h: r.height });
    }
    setSuckingIn(url);
    setTimeout(() => {
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => {
        setSuckingIn(null);
        setPreviewRect(null);
      }, 500);
    }, 1500);
  }, [suckingIn]);

  const isSuckingIn = suckingIn !== null && "url" in env && env.url === suckingIn;

  /* ─── Determine which color/gradient to show (with crossfade) ─── */
  const blendedColor = blend.t > 0 ? nextEnv.color : env.color;

  return (
    <motion.div style={{
      width: "100vw", height: "100vh", overflow: "hidden", background: "#000", position: "relative", cursor: "default",
      scale: smoothScale,
      x: smoothX,
      y: smoothY,
      rotate: smoothRotate,
      transformOrigin: "50% 55%",
    }}>

      {/* ═══ VIDEO (hidden — used as decode source) ═══ */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="auto"
        onLoadedMetadata={tryReady}
        onLoadedData={tryReady}
        onCanPlay={tryReady}
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
      >
        <source src="/walk-transparent.mp4" type="video/mp4" />
      </video>

      {/* ═══ IDLE VIDEOS (hidden decode sources) ═══ */}
      <video
        ref={idleStopRef}
        src="/idle-stop.mp4"
        muted
        playsInline
        preload="auto"
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
        onEnded={() => {
          if (idleStateRef.current === "stopping") {
            const lv = idleLoopRef.current;
            if (lv) { lv.currentTime = 0; lv.play().catch(() => {}); }
            idleStateRef.current = "idle";
            setIdleState("idle");
          }
        }}
      />
      <video
        ref={idleLoopRef}
        src="/idle-loop.mp4"
        muted
        playsInline
        preload="auto"
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
      />
      <video
        ref={idleRestartRef}
        src="/idle-restart.mp4"
        muted
        playsInline
        preload="auto"
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
        onEnded={() => {
          idleRestartRef.current?.pause();
          const wv = videoRef.current;
          if (wv) {
            wv.currentTime = currentTimeRef.current;
          }
          idleStateRef.current = "walking";
          setIdleState("walking");
          startIdleTimer();
        }}
      />

      {/* ═══ CANVAS (character — blend-mode makes black transparent) ═══ */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed", inset: 0,
          zIndex: 5,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* ═══ ENVIRONMENT COLOR OVERLAY — crossfades between worlds ═══ */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
        background: env.gradient,
        opacity: 1 - blend.t,
        transition: "opacity 0.1s linear",
      }} />
      {blend.t > 0 && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none",
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

      {/* ═══ PROJECT PREVIEW — fixed right side, cinematic transitions ═══ */}
      <AnimatePresence mode="wait">
        {"previewUrl" in env && env.previewUrl && !isSuckingIn && (
            <motion.div
              ref={previewRef}
              key={`preview-${env.id}`}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -60 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "fixed",
                right: "6vw",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 4,
                perspective: "1200px",
                pointerEvents: "auto",
                cursor: "pointer",
              }}
              onClick={() => {
                if ("url" in env && env.url) handlePreviewClick(env.url as string);
              }}
              onMouseMove={(e: React.MouseEvent) => {
                const r = e.currentTarget.getBoundingClientRect();
                mouseX.set((e.clientX - r.left) / r.width - 0.5);
                mouseY.set((e.clientY - r.top) / r.height - 0.5);
              }}
              onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
            >
            {/* 3D tilt wrapper */}
            <motion.div style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}>
            {/* The screen */}
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: env.id === "music" ? 340 : 460,
                height: env.id === "music" ? 400 : 300,
                borderRadius: 12,
                overflow: "hidden",
                position: "relative",
                boxShadow: `
                  0 0 0 1px ${env.color}15,
                  0 30px 80px -20px rgba(0,0,0,0.7),
                  0 0 40px -10px ${env.color}12
                `,
                background: "rgba(8,8,12,0.95)",
              }}
            >
              {/* Browser chrome */}
              <div style={{
                height: 32,
                background: "rgba(22,22,28,0.98)",
                borderBottom: `1px solid rgba(255,255,255,0.04)`,
                display: "flex",
                alignItems: "center",
                padding: "0 12px",
                gap: 6,
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff5f57", opacity: 0.7 }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#febc2e", opacity: 0.6 }} />
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#28c840", opacity: 0.6 }} />
                <div style={{
                  flex: 1, marginLeft: 12, height: 20, borderRadius: 5,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.03)",
                  display: "flex", alignItems: "center", paddingLeft: 8, gap: 5,
                }}>
                  <svg width="7" height="8" viewBox="0 0 8 9" fill="none">
                    <rect x="0.5" y="4" width="7" height="4.5" rx="1" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
                    <path d="M2 4V2.5a2 2 0 014 0V4" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" fill="none" />
                  </svg>
                  <span style={{
                    fontSize: "0.4rem", color: "rgba(255,255,255,0.2)",
                    fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.03em",
                  }}>
                    {"url" in env ? (env.url as string).replace(/^https?:\/\//, "").replace(/\/$/, "") : ""}
                  </span>
                </div>
              </div>

              {/* Live iframe */}
              <iframe
                title={`Preview of ${env.title}`}
                src={env.previewUrl as string}
                sandbox="allow-scripts allow-same-origin allow-popups"
                loading="lazy"
                style={{
                  width: env.previewType === "site" ? "200%" : "100%",
                  height: env.previewType === "site" ? "200%" : "calc(100% - 32px)",
                  border: "none",
                  transform: env.previewType === "site" ? "scale(0.5)" : "none",
                  transformOrigin: "top left",
                  pointerEvents: "none",
                  background: "#0a0a0f",
                }}
              />

              {/* Hover overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                style={{
                  position: "absolute",
                  inset: 0, top: 32,
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(4px)",
                  gap: 10,
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    width: 44, height: 44, borderRadius: "50%",
                    border: `1.5px solid ${env.color}60`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={env.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                </motion.div>
                <span style={{
                  fontSize: "0.5rem", letterSpacing: "0.3em",
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "var(--font-mono, monospace)",
                }}>ENTER PROJECT</span>
              </motion.div>

              {/* Holographic shimmer sweep */}
              <motion.div
                animate={{ x: ["-120%", "220%"] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  top: 0, bottom: 0,
                  width: "30%",
                  background: `linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.02) 60%, transparent 100%)`,
                  pointerEvents: "none",
                  zIndex: 6,
                }}
              />

              {/* Scanline */}
              <motion.div
                animate={{ top: ["-5%", "105%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute",
                  left: 0, right: 0,
                  height: 1,
                  background: `linear-gradient(90deg, transparent, ${env.color}10, transparent)`,
                  pointerEvents: "none",
                  zIndex: 5,
                }}
              />

              {/* Edge glow */}
              <motion.div
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute", inset: -1, borderRadius: 13,
                  border: `1px solid ${env.color}18`,
                  pointerEvents: "none", zIndex: 3,
                }}
              />
            </motion.div>

            {/* Reflection */}
            <div style={{
              width: "70%",
              height: 30,
              margin: "0 auto",
              marginTop: -2,
              background: `radial-gradient(ellipse at 50% 0%, ${env.color}06 0%, transparent 70%)`,
              filter: "blur(6px)",
              pointerEvents: "none",
            }} />

            {/* Tech metadata */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                marginTop: 6, padding: "0 4px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ width: 4, height: 4, borderRadius: "50%", background: env.color }}
                />
                <span style={{
                  fontSize: "0.35rem", letterSpacing: "0.3em",
                  color: "rgba(255,255,255,0.2)",
                  fontFamily: "var(--font-mono, monospace)",
                }}>LIVE</span>
              </div>
              <span style={{
                fontSize: "0.32rem", letterSpacing: "0.15em",
                color: "rgba(255,255,255,0.08)",
                fontFamily: "var(--font-mono, monospace)",
              }}>{"num" in env ? `PROJECT ${env.num}` : ""}</span>
            </motion.div>

            </motion.div>{/* end tilt wrapper */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ CINEMATIC CAMERA ZOOM TRANSITION ═══ */}
      <AnimatePresence>
        {suckingIn && previewRect && (() => {
          const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
          const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
          const fillScale = Math.max(vw / previewRect.w, vh / previewRect.h) * 1.05;

          return (
            <motion.div
              key="camera-zoom"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "fixed", inset: 0, zIndex: 200,
                pointerEvents: "none",
                overflow: "hidden",
              }}
            >
              {/* Depth of field — world falls away */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0.85)",
                  backdropFilter: "blur(20px)",
                  zIndex: 1,
                }}
              />

              {/* Cinematic letterbox bars */}
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: [0, 50, 50, 0] }}
                transition={{ duration: 1.5, times: [0, 0.15, 0.85, 1], ease: "easeInOut" }}
                style={{ position: "absolute", top: 0, left: 0, right: 0, background: "#000", zIndex: 30 }}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: [0, 50, 50, 0] }}
                transition={{ duration: 1.5, times: [0, 0.15, 0.85, 1], ease: "easeInOut" }}
                style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#000", zIndex: 30 }}
              />

              {/* Camera push — zooms from preview location to fill viewport */}
              <motion.div
                initial={{
                  left: previewRect.x,
                  top: previewRect.y,
                  width: previewRect.w,
                  height: previewRect.h,
                  borderRadius: 12,
                }}
                animate={{
                  left: vw / 2 - (previewRect.w * fillScale) / 2,
                  top: vh / 2 - (previewRect.h * fillScale) / 2,
                  width: previewRect.w * fillScale,
                  height: previewRect.h * fillScale,
                  borderRadius: 0,
                }}
                transition={{
                  duration: 1.2,
                  ease: [0.16, 0.85, 0.3, 1],
                  borderRadius: { duration: 0.5, delay: 0.4 },
                }}
                style={{
                  position: "fixed",
                  overflow: "hidden",
                  zIndex: 10,
                  boxShadow: `0 0 120px 30px ${env.color}25`,
                }}
              >
                {/* Project atmosphere */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: `radial-gradient(ellipse at 50% 40%, ${env.color}25 0%, #08080c 70%)`,
                }} />
                {/* Depth grid */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.4, 0] }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  style={{
                    position: "absolute", inset: 0,
                    backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
                    backgroundSize: "40px 40px",
                  }}
                />
              </motion.div>

              {/* Camera tilt/roll during push */}
              <motion.div
                initial={{ rotateZ: 0 }}
                animate={{ rotateZ: [0, -0.3, 0.15, 0] }}
                transition={{ duration: 1.3, ease: [0.33, 0, 0, 1] }}
                style={{
                  position: "absolute", inset: 0,
                  zIndex: 9, pointerEvents: "none",
                }}
              />

              {/* Anamorphic light streak */}
              <motion.div
                initial={{ x: "-100%", opacity: 0 }}
                animate={{ x: "150%", opacity: [0, 0.9, 0.7, 0] }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: "absolute",
                  top: "46%", left: 0,
                  width: "50%", height: 2,
                  background: `linear-gradient(90deg, transparent, ${env.color}, white, ${env.color}, transparent)`,
                  filter: "blur(1px)",
                  zIndex: 20,
                }}
              />
              {/* Wide diffused flare */}
              <motion.div
                initial={{ x: "-80%", opacity: 0 }}
                animate={{ x: "140%", opacity: [0, 0.2, 0.15, 0] }}
                transition={{ duration: 1.0, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  position: "absolute",
                  top: "45%", left: 0,
                  width: "60%", height: 14,
                  background: `linear-gradient(90deg, transparent, ${env.color}30, transparent)`,
                  filter: "blur(6px)",
                  zIndex: 19,
                }}
              />

              {/* Chromatic aberration */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.25, 0.12, 0] }}
                transition={{ duration: 1.3, times: [0, 0.25, 0.7, 1] }}
                style={{
                  position: "absolute", inset: 0, zIndex: 15,
                  boxShadow: "inset 3px 0 20px -5px rgba(255,0,50,0.1), inset -3px 0 20px -5px rgba(0,80,255,0.1)",
                }}
              />

              {/* Film grain */}
              <div style={{
                position: "absolute", inset: 0, zIndex: 25,
                mixBlendMode: "overlay", opacity: 0.04,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: "150px 150px",
                pointerEvents: "none",
              }} />

              {/* Vignette */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.5, 0.7, 0.3] }}
                transition={{ duration: 1.5, times: [0, 0.15, 0.7, 1] }}
                style={{
                  position: "absolute", inset: 0, zIndex: 16,
                  background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.7) 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Final bright flash at climax */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0, 0.85, 0] }}
                transition={{ duration: 1.5, times: [0, 0.75, 0.9, 1], ease: "easeInOut" }}
                style={{
                  position: "absolute", inset: 0, zIndex: 28,
                  background: `linear-gradient(135deg, ${env.color}50, white)`,
                  pointerEvents: "none",
                }}
              />
            </motion.div>
          );
        })()}
      </AnimatePresence>

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
    </motion.div>
  );
}
