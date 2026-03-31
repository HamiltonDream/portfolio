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
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const fogCanvasRef = useRef<HTMLCanvasElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(0);
  const targetTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const [autoWalk, setAutoWalk] = useState(false);
  const autoWalkRef = useRef(false);
  const autoWalkDirRef = useRef<1 | -1>(1);
  const [autoWalkDir, setAutoWalkDir] = useState<1 | -1>(1);
  const progressRef = useRef(0);
  const lastPaintedTime = useRef(-1);
  const [suckingIn, setSuckingIn] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewRect, setPreviewRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  /* ── Performance tier: detect device capability ── */
  const [isMobile, setIsMobile] = useState(false);
  const perfTierRef = useRef<"high" | "mid" | "low">("high");
  useEffect(() => {
    const mobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    setIsMobile(mobile);
    const cores = navigator.hardwareConcurrency || 2;
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory || 4;
    if (mobile || cores <= 2 || mem <= 2) perfTierRef.current = "low";
    else if (cores <= 4 || mem <= 4) perfTierRef.current = "mid";
    else perfTierRef.current = "high";
  }, []);
  /* Idle state machine: walking → stopping → idle → restarting → walking */
  type IdleState = "walking" | "stopping" | "idle" | "restarting";
  const [idleState, setIdleState] = useState<IdleState>("idle");
  const idleStateRef = useRef<IdleState>("idle");
  const hasScrolledRef = useRef(false);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleStopRef = useRef<HTMLVideoElement>(null);
  const idleLoopRef = useRef<HTMLVideoElement>(null);
  const idleLoopBRef = useRef<HTMLVideoElement>(null);
  const idleLoopActiveRef = useRef<"A" | "B">("A");
  const idleRestartRef = useRef<HTMLVideoElement>(null);
  /* Lightning flash states for cinematic idle transitions */
  const [showLightningFlash, setShowLightningFlash] = useState(false);
  const [showWakeFlash, setShowWakeFlash] = useState(false);
  const [showLoopFlash, setShowLoopFlash] = useState(false);
  /* Walk animation time — always advances forward regardless of scroll direction */
  const walkTimeRef = useRef(0);
  /* Accumulated scroll velocity — drives walk playback rate for smooth animation */
  const scrollVelocityRef = useRef(0);
  /* Track scroll direction: 1 = forward (right), -1 = backward (left) */
  const scrollDirRef = useRef(1);
  /* Auto-snap: set when a light flick should glide to next section */
  const autoSnapTargetRef = useRef<number | null>(null);
  /* ─── Cinematic Camera System ─── */
  const cameraScale = useMotionValue(1);
  const cameraX = useMotionValue(0);
  const cameraY = useMotionValue(0);
  const cameraRotate = useMotionValue(0);
  const smoothScale = useSpring(cameraScale, { stiffness: 120, damping: 18, mass: 0.5 });
  const smoothX = useSpring(cameraX, { stiffness: 100, damping: 16, mass: 0.4 });
  const smoothY = useSpring(cameraY, { stiffness: 100, damping: 16, mass: 0.4 });
  const smoothRotate = useSpring(cameraRotate, { stiffness: 110, damping: 18, mass: 0.35 });
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
    /* Don't go idle during auto-walk */
    if (autoWalkRef.current) return;
    idleTimerRef.current = setTimeout(() => {
      if (idleStateRef.current !== "walking") return;
      if (autoWalkRef.current) return;
      const sv = idleStopRef.current;
      if (sv) {
        sv.currentTime = 0;
        sv.play().catch(() => {});
      }
      idleStateRef.current = "stopping";
      setIdleState("stopping");
      /* Camera: fluid pull-back when entering idle */
      cameraScale.set(0.98);
      cameraY.set(5);
      setTimeout(() => { cameraScale.set(1); cameraY.set(0); }, 150);
    }, 600);
  }, [cameraScale, cameraY]);

  const markActive = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    hasScrolledRef.current = true;

    const state = idleStateRef.current;
    if (state === "idle") {
      /* Fully idle — play the restart animation */
      idleLoopRef.current?.pause();
      idleLoopBRef.current?.pause();
      const rv = idleRestartRef.current;
      if (rv) {
        rv.currentTime = 0;
        rv.play().catch(() => {});
      }
      idleStateRef.current = "restarting";
      setIdleState("restarting");
      /* Camera: dramatic punch on wake-up */
      cameraScale.set(1.05);
      cameraRotate.set(scrollDirRef.current * -0.8);
      cameraX.set(scrollDirRef.current * -10);
      setTimeout(() => { cameraScale.set(1); cameraRotate.set(0); cameraX.set(0); }, 300);
      /* Wake-up flash to mask color transition back */
      setShowWakeFlash(true);
      setTimeout(() => setShowWakeFlash(false), 350);
    } else if (state === "stopping") {
      /* Character already turning — play restart from matching point */
      const sv = idleStopRef.current;
      const rv = idleRestartRef.current;
      let turnProgress = 0;
      if (sv && sv.duration) {
        turnProgress = Math.min(sv.currentTime / sv.duration, 1);
      }
      sv?.pause();
      if (rv) {
        const restartStart = (1 - turnProgress) * (rv.duration || 0);
        rv.currentTime = restartStart;
        rv.play().catch(() => {});
      }
      idleStateRef.current = "restarting";
      setIdleState("restarting");
      cameraScale.set(1.03);
      cameraRotate.set(scrollDirRef.current * -0.6);
      setTimeout(() => { cameraScale.set(1); cameraRotate.set(0); }, 250);
    } else if (state === "restarting") {
      /* Already playing restart — just let it finish */
    } else if (state === "walking") {
      startIdleTimer();
    }
  }, [startIdleTimer, cameraScale, cameraRotate, cameraX]);

  /* Start idle loop on page load — character faces camera until first scroll */
  useEffect(() => {
    const lv = idleLoopRef.current;
    if (lv) {
      lv.currentTime = 0;
      lv.play().catch(() => {});
    }
    /* Pre-load buffer B so it's ready for ping-pong */
    const lvB = idleLoopBRef.current;
    if (lvB) { lvB.load(); }
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

  /* Size canvases to viewport (capped DPR for performance) */
  useEffect(() => {
    const resize = () => {
      const tier = perfTierRef.current;
      const maxDpr = tier === "low" ? 1 : tier === "mid" ? 1.5 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = window.innerWidth;
      const h = window.innerHeight;
      [canvasRef.current, particleCanvasRef.current, fogCanvasRef.current].forEach(c => {
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
      scrollVelocityRef.current += Math.abs(delta);
      /* Cancel any auto-snap when user actively scrolls */
      autoSnapTargetRef.current = null;
    };

    let touchY = 0;
    const onTS = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTM = (e: TouchEvent) => {
      e.preventDefault();
      markActive();
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      /* Touch is 3× more sensitive than wheel — fingers move less distance */
      const delta = (dy / (window.innerHeight * 2)) * videoDuration;
      if (dy !== 0) scrollDirRef.current = dy > 0 ? 1 : -1;
      targetTimeRef.current += delta;
      targetTimeRef.current = ((targetTimeRef.current % videoDuration) + videoDuration) % videoDuration;
      scrollVelocityRef.current += Math.abs(delta);
      autoSnapTargetRef.current = null;
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

  /* ─── Render loop: canvas-based, optimized ─── */
  useEffect(() => {
    let frameCount = 0;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true }) || null;

    /* Single offscreen canvas for snapshot persistence across transitions */
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
      if (!canvas || !ctx) return;
      ensureSnapshotCanvas();
      if (snapshotCtx) {
        snapshotCtx.clearRect(0, 0, snapshotCanvas!.width, snapshotCanvas!.height);
        snapshotCtx.drawImage(canvas, 0, 0);
        hasSnapshot = true;
      }
    };

    const restoreSnapshot = () => {
      if (hasSnapshot && snapshotCanvas && ctx && canvas) {
        ctx.drawImage(snapshotCanvas, 0, 0);
      }
    };

    /* Draw video to canvas — aspect-ratio-aware scaling.
       - Wide screens (desktop): "contain" + bottom-align (character fits perfectly)
       - Tall/narrow screens (phone portrait): scale up to fill width, center vertically
       - Square-ish screens: slight scale-up to fill more space
       IMPORTANT: No clearRect — drawImage overpaints to prevent flash. */
    const CHAR_CENTER_FRAC = 0.5;
    const drawFrame = (vid: HTMLVideoElement, flip = false) => {
      if (!ctx || !canvas) return;
      const cw = canvas.width;
      const ch = canvas.height;
      const vw = vid.videoWidth || 1;
      const vh = vid.videoHeight || 1;

      const viewAspect = cw / ch;       // screen aspect ratio
      const vidAspect = vw / vh;         // video aspect ratio (16:9 = ~1.78)

      let scale: number;
      let dy: number;

      if (viewAspect >= vidAspect * 0.95) {
        /* Wide or matching screen (most desktops): contain, bottom-aligned.
           This is the original behavior — character fits perfectly. */
        scale = Math.min(cw / vw, ch / vh);
        const dh = vh * scale;
        dy = ch - dh; /* bottom-aligned */
      } else {
        /* Tall/narrow screen (phones, some laptops): scale to fill width
           so character isn't tiny. Vertically center with bottom bias. */
        scale = cw / vw; /* fill width */
        const dh = vh * scale;
        if (dh <= ch) {
          dy = ch - dh; /* fits — bottom-align */
        } else {
          /* Overflows vertically: center with 30% top / 70% bottom bias */
          dy = (ch - dh) * 0.3;
        }
      }

      const dw = vw * scale;
      const dh = vh * scale;
      const dx = (cw - dw) / 2;

      if (flip) {
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

      /* Edge fade: frosted glass effect over edges to hide video bounds */
      const dp = Math.min(window.devicePixelRatio || 1, 2);
      const edgeW = Math.min(120 * dp, cw * 0.12); /* responsive edge width */
      const edgeT = Math.min(80 * dp, ch * 0.08);
      /* Left edge — soft glass fade */
      const gL = ctx.createLinearGradient(Math.max(dx, 0), 0, Math.max(dx, 0) + edgeW, 0);
      gL.addColorStop(0, "rgba(0,0,0,0.85)");
      gL.addColorStop(0.5, "rgba(0,0,0,0.3)");
      gL.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gL;
      ctx.fillRect(Math.max(dx, 0), Math.max(dy, 0), edgeW, dh);
      /* Right edge */
      const rEdge = Math.min(dx + dw, cw);
      const gR = ctx.createLinearGradient(rEdge, 0, rEdge - edgeW, 0);
      gR.addColorStop(0, "rgba(0,0,0,0.85)");
      gR.addColorStop(0.5, "rgba(0,0,0,0.3)");
      gR.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gR;
      ctx.fillRect(rEdge - edgeW, Math.max(dy, 0), edgeW, dh);
      /* Top edge */
      const tEdge = Math.max(dy, 0);
      const gT = ctx.createLinearGradient(0, tEdge, 0, tEdge + edgeT);
      gT.addColorStop(0, "rgba(0,0,0,0.8)");
      gT.addColorStop(0.5, "rgba(0,0,0,0.25)");
      gT.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gT;
      ctx.fillRect(Math.max(dx, 0), tEdge, dw, edgeT);
    };

    /* Track last set playbackRate to avoid thrashing */
    let lastRate = 1.0;

    /* ═══ CANVAS SMOKE FOG SYSTEM ═══ */
    const fCanvas = fogCanvasRef.current;
    const fCtx = fCanvas?.getContext("2d", { alpha: true }) || null;
    type SmokePuff = {
      x: number; y: number; vx: number; vy: number;
      radius: number; opacity: number; phase: number; speed: number;
    };
    const smokePuffs: SmokePuff[] = [];
    const tier = perfTierRef.current;
    const SMOKE_COUNT = tier === "low" ? 12 : tier === "mid" ? 25 : 50;
    const spawnSmoke = (): SmokePuff => {
      const fw = fCanvas?.width || 1920;
      const fh = fCanvas?.height || 1080;
      return {
        x: Math.random() * fw * 1.4 - fw * 0.2,
        y: fh * (0.6 + Math.random() * 0.45),
        vx: (Math.random() - 0.5) * 0.4,
        vy: -(Math.random() * 0.2 + 0.02),
        radius: 80 + Math.random() * 250,
        opacity: 0.04 + Math.random() * 0.09,
        phase: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.006,
      };
    };
    for (let i = 0; i < SMOKE_COUNT; i++) smokePuffs.push(spawnSmoke());

    const drawSmoke = () => {
      if (!fCtx || !fCanvas) return;
      const fw = fCanvas.width;
      const fh = fCanvas.height;
      fCtx.clearRect(0, 0, fw, fh);

      for (const s of smokePuffs) {
        s.phase += s.speed;
        /* Slow organic drift */
        s.x += s.vx + Math.sin(s.phase) * 0.3;
        s.y += s.vy + Math.cos(s.phase * 0.7) * 0.1;

        /* Wrap horizontally */
        if (s.x < -s.radius * 2) s.x = fw + s.radius;
        if (s.x > fw + s.radius * 2) s.x = -s.radius;
        /* Reset if drifted too high */
        if (s.y < fh * 0.3) {
          s.y = fh * (0.75 + Math.random() * 0.3);
          s.x = Math.random() * fw * 1.4 - fw * 0.2;
        }

        /* Vertical fade: denser at bottom, transparent higher up */
        const vertFade = Math.max(0, (s.y - fh * 0.35) / (fh * 0.65));
        const a = s.opacity * vertFade;
        if (a < 0.001) continue;

        /* Soft radial gradient puff */
        const grad = fCtx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.radius);
        grad.addColorStop(0, `rgba(18,18,28,${(a * 1.2).toFixed(4)})`);
        grad.addColorStop(0.3, `rgba(15,15,25,${(a * 0.8).toFixed(4)})`);
        grad.addColorStop(0.6, `rgba(12,12,22,${(a * 0.35).toFixed(4)})`);
        grad.addColorStop(1, "rgba(10,10,20,0)");
        fCtx.beginPath();
        fCtx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        fCtx.fillStyle = grad;
        fCtx.fill();
      }

      /* Dense ground layer — solid fog bank at very bottom */
      const groundGrad = fCtx.createLinearGradient(0, fh, 0, fh * 0.7);
      groundGrad.addColorStop(0, "rgba(8,8,14,0.9)");
      groundGrad.addColorStop(0.4, "rgba(12,12,22,0.45)");
      groundGrad.addColorStop(0.7, "rgba(16,16,28,0.15)");
      groundGrad.addColorStop(1, "rgba(20,20,30,0)");
      fCtx.fillStyle = groundGrad;
      fCtx.fillRect(-10, fh * 0.7, fw + 20, fh * 0.3 + 10);
    };

    /* ═══ FLOATING DUST PARTICLE SYSTEM ═══ */
    const pCanvas = particleCanvasRef.current;
    const pCtx = pCanvas?.getContext("2d", { alpha: true }) || null;
    type DustParticle = {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; life: number; maxLife: number;
      behind: boolean; /* true = this particle passes behind the character */
    };
    const particles: DustParticle[] = [];
    let particleFade = 1; /* 0 = fully hidden (idle), 1 = fully visible (walking) */

    const spawnDust = (): DustParticle => {
      const pw = pCanvas?.width || 1920;
      const ph = pCanvas?.height || 1080;
      const life = Math.random() * 10 + 6;
      return {
        x: Math.random() * pw,
        y: Math.random() * ph,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -(Math.random() * 0.35 + 0.1),
        size: Math.random() * 2.5 + 0.8,
        opacity: Math.random() * 0.45 + 0.15,
        life, maxLife: life,
        behind: Math.random() < 0.4, /* ~40% of particles go behind */
      };
    };
    const DUST_COUNT = tier === "low" ? 15 : tier === "mid" ? 35 : 80;
    for (let i = 0; i < DUST_COUNT; i++) particles.push(spawnDust());

    const drawParticles = () => {
      if (!pCtx || !pCanvas) return;
      const pw = pCanvas.width;
      const ph = pCanvas.height;
      pCtx.clearRect(0, 0, pw, ph);

      /* Smooth fade: lerp toward 0 when idle, 1 when walking */
      const isIdle = idleStateRef.current !== "walking";
      const fadeTarget = isIdle ? 0 : 1;
      particleFade += (fadeTarget - particleFade) * 0.03;
      if (particleFade < 0.005 && isIdle) { particleFade = 0; return; }

      /* Replenish while visible */
      if (!isIdle) { while (particles.length < DUST_COUNT) particles.push(spawnDust()); }

      const vel = scrollVelocityRef.current;
      const dir = scrollDirRef.current;

      /* Character body zone — center of screen, roughly where the model stands */
      const charCenterX = pw * 0.5;
      const charHalfW = pw * 0.08; /* ~16% of screen width = character body */
      const charTop = ph * 0.15;   /* character starts near top of screen */
      const charBottom = ph * 0.85; /* down to near bottom */

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= 0.016;
        if (p.life <= 0) { particles.splice(i, 1); continue; }

        /* Scroll parallax drift */
        p.vx -= vel * dir * 0.3;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.997;
        p.vx += (Math.random() - 0.5) * 0.015;
        p.vy += (Math.random() - 0.5) * 0.008;

        if (p.x < -20) p.x = pw + 20;
        if (p.x > pw + 20) p.x = -20;
        if (p.y < -20) p.y = ph + 20;
        if (p.y > ph + 20) p.y = -20;

        /* "Behind" particles: skip drawing when inside character silhouette zone,
           they'll naturally drift out the other side and reappear */
        if (p.behind && p.y > charTop && p.y < charBottom) {
          const dx = Math.abs(p.x - charCenterX);
          if (dx < charHalfW) continue; /* invisible — looks like it went behind him */
        }

        const t = p.life / p.maxLife;
        const lifeFade = t < 0.15 ? t / 0.15 : t > 0.8 ? (1 - t) / 0.2 : 1;
        const a = lifeFade * p.opacity * particleFade;
        if (a < 0.001) continue;

        /* Soft glow halo — skip on low tier (expensive overdraw) */
        if (tier === "high") {
          pCtx.beginPath();
          pCtx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
          pCtx.fillStyle = `rgba(255,255,255,${(a * 0.08).toFixed(4)})`;
          pCtx.fill();
        }

        /* Core dot */
        pCtx.beginPath();
        pCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        pCtx.fillStyle = `rgba(255,255,255,${a.toFixed(4)})`;
        pCtx.fill();
      }
    };

    const loop = () => {
      const v = videoRef.current;

      /* ═══ SMOKE + PARTICLES — throttled on low-end devices ═══ */
      if (tier === "low") {
        /* Low: skip smoke entirely, particles every 3rd frame */
        if (frameCount % 3 === 0) drawParticles();
      } else if (tier === "mid") {
        /* Mid: smoke every other frame, particles every frame */
        if (frameCount % 2 === 0) drawSmoke();
        drawParticles();
      } else {
        drawSmoke();
        drawParticles();
      }

      /* ═══ IDLE VIDEO STATE: draw idle clips when not walking ═══ */
      const iState = idleStateRef.current;
      if (iState !== "walking") {
        const activeLoop = idleLoopActiveRef.current === "A" ? idleLoopRef.current : idleLoopBRef.current;
        const fallbackLoop = idleLoopActiveRef.current === "A" ? idleLoopBRef.current : idleLoopRef.current;
        const idleVid =
          iState === "stopping" ? idleStopRef.current :
          iState === "idle" ? activeLoop :
          iState === "restarting" ? idleRestartRef.current : null;

        const flipIdle = scrollDirRef.current < 0;

        /* Draw from active buffer; if it's not ready, try fallback.
           Canvas NEVER clears — worst case keeps showing the last good frame. */
        if (iState === "idle") {
          if (idleVid && idleVid.readyState >= 2 && idleVid.currentTime > 0.04) {
            drawFrame(idleVid, flipIdle);
          } else if (fallbackLoop && fallbackLoop.readyState >= 2) {
            drawFrame(fallbackLoop, flipIdle);
          }
        } else if (idleVid && idleVid.readyState >= 2) {
          drawFrame(idleVid, flipIdle);
        }

        /* Keep section tracking in sync */
        if (videoDuration > 0) {
          currentTimeRef.current = targetTimeRef.current;
          progressRef.current = currentTimeRef.current / videoDuration;
          frameCount++;
          if (frameCount % 6 === 0) setProgress(progressRef.current);
        }
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      /* Save snapshot on transition from idle to walking (once) */
      if (!hasSnapshot && ctx && canvas) {
        saveSnapshot();
      }

      /* ═══ WALKING STATE ═══ */
      if (v && videoDuration > 0) {
        if (autoWalkRef.current) {
          if (v.paused) { v.playbackRate = 1.0; v.play().catch(() => {}); }
          if (v.readyState >= 2 && v.currentTime !== lastPaintedTime.current) {
            drawFrame(v, scrollDirRef.current < 0);
            lastPaintedTime.current = v.currentTime;
          }
          const sectionSpeed = 0.0006;
          const dir = autoWalkDirRef.current;
          scrollDirRef.current = dir;
          currentTimeRef.current += dir * sectionSpeed * videoDuration;
          currentTimeRef.current = ((currentTimeRef.current % videoDuration) + videoDuration) % videoDuration;
          targetTimeRef.current = currentTimeRef.current;

          /* Update progress every frame during auto-walk so camera kicks sync */
          progressRef.current = currentTimeRef.current / videoDuration;
          setProgress(progressRef.current);
        } else {
          /* ── Section progress: smooth lerp toward target ── */
          let diff = targetTimeRef.current - currentTimeRef.current;
          if (diff > videoDuration / 2) diff -= videoDuration;
          if (diff < -videoDuration / 2) diff += videoDuration;

          /* ── Auto-snap: detect when velocity dies, glide to next section ── */
          if (autoSnapTargetRef.current !== null) {
            let snapDiff = autoSnapTargetRef.current - currentTimeRef.current;
            if (snapDiff > videoDuration / 2) snapDiff -= videoDuration;
            if (snapDiff < -videoDuration / 2) snapDiff += videoDuration;
            const absDiff = Math.abs(snapDiff);
            if (absDiff > 0.005) {
              /* Smooth ease-out: lerp factor gives fluid deceleration.
                 Larger factor = faster start, natural slow-down at end. */
              const lerp = 0.09;
              currentTimeRef.current += snapDiff * lerp;
              currentTimeRef.current = ((currentTimeRef.current % videoDuration) + videoDuration) % videoDuration;
              targetTimeRef.current = autoSnapTargetRef.current;

              /* Match auto-walk: play at 1× for smooth frame delivery */
              if (v.paused) { v.playbackRate = 1.0; v.play().catch(() => {}); }
              else if (Math.abs(v.playbackRate - 1.0) > 0.05) { v.playbackRate = 1.0; lastRate = 1.0; }

              /* Draw every decoded frame */
              if (v.readyState >= 2 && v.currentTime !== lastPaintedTime.current) {
                drawFrame(v, scrollDirRef.current < 0);
                lastPaintedTime.current = v.currentTime;
              }

              /* Update progress every frame during snap for fluid transitions */
              progressRef.current = currentTimeRef.current / videoDuration;
              setProgress(progressRef.current);
            } else {
              /* Arrived — clean stop */
              currentTimeRef.current = autoSnapTargetRef.current;
              targetTimeRef.current = autoSnapTargetRef.current;
              autoSnapTargetRef.current = null;
              scrollVelocityRef.current = 0;
              if (!v.paused) v.pause();
            }
          } else {
            /* ── Normal scroll behavior ── */
            currentTimeRef.current += diff * 0.15;
            currentTimeRef.current = ((currentTimeRef.current % videoDuration) + videoDuration) % videoDuration;

            /* Trigger snap when natural scroll velocity dies */
            if (scrollVelocityRef.current < 0.03 && scrollVelocityRef.current > 0) {
              const dir = scrollDirRef.current;
              const curProg = currentTimeRef.current / videoDuration;
              const curIdx = getEnvIndex(curProg);
              const slice = 1 / ENV_COUNT;
              const localProg = (curProg - curIdx * slice) / slice;
              /* Snap forward if past 30% of section, else back to current center */
              let snapIdx: number;
              if (dir > 0 && localProg > 0.3) {
                snapIdx = (curIdx + 1) % ENV_COUNT;
              } else if (dir < 0 && localProg < 0.7) {
                snapIdx = (curIdx - 1 + ENV_COUNT) % ENV_COUNT;
              } else {
                snapIdx = curIdx;
              }
              const snapTime = (snapIdx + 0.5) / ENV_COUNT * videoDuration;
              autoSnapTargetRef.current = snapTime;
              targetTimeRef.current = snapTime;
              scrollVelocityRef.current = 0;
            }

            /* Walk video: velocity-driven playback rate */
            const vel = scrollVelocityRef.current;
            scrollVelocityRef.current *= 0.92;
            const targetRate = Math.min(vel * 20, 2.5);

            if (targetRate > 0.05) {
              const clampedRate = Math.max(targetRate, 0.2);
              /* On low-end devices, use direct seeking instead of playbackRate
                 (variable playbackRate can stall weak decoders) */
              if (tier === "low") {
                /* Seek-based: set currentTime directly each frame */
                if (!v.paused) v.pause();
                const seekStep = clampedRate * (1 / 60) * scrollDirRef.current;
                let newTime = v.currentTime + seekStep;
                newTime = ((newTime % videoDuration) + videoDuration) % videoDuration;
                v.currentTime = newTime;
              } else {
                if (Math.abs(clampedRate - lastRate) > 0.08 || v.paused) {
                  v.playbackRate = clampedRate;
                  lastRate = clampedRate;
                }
                if (v.paused) v.play().catch(() => {});
              }
            } else {
              scrollVelocityRef.current = 0;
              if (!v.paused) v.pause();
            }

            /* Paint on new video frames — also paint after seek on low tier */
            if (v.readyState >= 2 && v.currentTime !== lastPaintedTime.current) {
              drawFrame(v, scrollDirRef.current < 0);
              lastPaintedTime.current = v.currentTime;
            }
          }
        }

        progressRef.current = currentTimeRef.current / videoDuration;
        frameCount++;
        if (frameCount % 6 === 0) setProgress(progressRef.current);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      snapshotCanvas = null;
      snapshotCtx = null;
    };
  }, [videoDuration]);

  /* ─── Derived state ─── */
  const blend = useMemo(() => getEnvBlend(progress), [progress]);
  const env = ENVIRONMENTS[blend.current];
  const nextEnv = ENVIRONMENTS[blend.next];
  const envIdx = blend.current;

  /* Camera kick on environment change — delayed to sync with content entrance */
  useEffect(() => {
    if (lastEnvRef.current !== envIdx) {
      const dir = envIdx > lastEnvRef.current ? 1 : -1;
      lastEnvRef.current = envIdx;
      /* Wait for AnimatePresence exit/enter to start, then punch.
         First section (intro→fieldops) fires faster since intro has no heavy exit. */
      const delay = envIdx <= 1 ? 300 : 700;
      const kickTimer = setTimeout(() => {
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
      }, delay);
      return () => clearTimeout(kickTimer);
    }
  }, [envIdx, cameraScale, cameraX, cameraRotate, cameraY]);

  /* Compute local progress within current environment (0-1) */
  const localProgress = useMemo(() => {
    const slice = 1 / ENV_COUNT;
    return (progress - envIdx * slice) / slice;
  }, [progress, envIdx]);

  /* Keep ref in sync with state */
  useEffect(() => { autoWalkRef.current = autoWalk; }, [autoWalk]);

  /* Stop auto-walk on manual scroll — immediate ref sync + idle trigger */
  useEffect(() => {
    const stop = () => {
      if (autoWalkRef.current) {
        autoWalkRef.current = false;
        setAutoWalk(false);
        /* Don't idle here — user is actively scrolling, markActive handles timer */
      }
    };
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
    setAutoWalk(prev => {
      const next = !prev;
      /* Sync ref IMMEDIATELY so the render loop sees it this frame */
      autoWalkRef.current = next;
      if (next) {
        /* When turning on auto-walk, use the proper transition to wake from idle */
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        const state = idleStateRef.current;
        if (state === "idle") {
          /* Play restart animation — same as markActive for idle state */
          idleLoopRef.current?.pause();
          idleLoopBRef.current?.pause();
          const rv = idleRestartRef.current;
          if (rv) { rv.currentTime = 0; rv.play().catch(() => {}); }
          idleStateRef.current = "restarting";
          setIdleState("restarting");
          cameraScale.set(1.05);
          cameraRotate.set(-0.8);
          cameraX.set(-10);
          setTimeout(() => { cameraScale.set(1); cameraRotate.set(0); cameraX.set(0); }, 300);
          setShowWakeFlash(true);
          setTimeout(() => setShowWakeFlash(false), 350);
        } else if (state === "stopping") {
          /* Interrupt stop with time-matched restart */
          const sv = idleStopRef.current;
          const rv = idleRestartRef.current;
          let turnProgress = 0;
          if (sv && sv.duration) { turnProgress = Math.min(sv.currentTime / sv.duration, 1); }
          sv?.pause();
          if (rv) { rv.currentTime = (1 - turnProgress) * (rv.duration || 0); rv.play().catch(() => {}); }
          idleStateRef.current = "restarting";
          setIdleState("restarting");
          cameraScale.set(1.03);
          cameraRotate.set(-0.6);
          setTimeout(() => { cameraScale.set(1); cameraRotate.set(0); }, 250);
        } else if (state === "walking") {
          /* Already walking — just ensure video is playing */
          const wv = videoRef.current;
          if (wv) { wv.playbackRate = 1.0; wv.play().catch(() => {}); }
        }
        /* Note: restarting state's onEnded will set walking + start walk video */
      } else {
        /* Stopping auto-walk: go to idle-stop immediately, no delay */
        const wv = videoRef.current;
        if (wv && !wv.paused) wv.pause();
        scrollVelocityRef.current = 0;
        autoSnapTargetRef.current = null;
        /* Skip the 600ms idle timer — trigger stop animation right now */
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        const sv = idleStopRef.current;
        if (sv) {
          sv.currentTime = 0;
          sv.play().catch(() => {});
        }
        idleStateRef.current = "stopping";
        setIdleState("stopping");
        cameraScale.set(0.98);
        cameraY.set(5);
        setTimeout(() => { cameraScale.set(1); cameraY.set(0); }, 150);
      }
      return next;
    });
  }, [cameraScale, cameraY]);

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
        preload="metadata"
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
        onEnded={() => {
          if (idleStateRef.current === "stopping") {
            /* Start idle loop on buffer A, pre-prime B */
            const lvA = idleLoopRef.current;
            const lvB = idleLoopBRef.current;
            idleLoopActiveRef.current = "A";
            if (lvA) { lvA.currentTime = 0; lvA.play().catch(() => {}); }
            if (lvB) { lvB.currentTime = 0; lvB.pause(); }
            idleStateRef.current = "idle";
            setIdleState("idle");
            /* ── Cinematic lightning flash to mask color transition ── */
            setShowLightningFlash(true);
            cameraScale.set(1.06);
            cameraX.set((Math.random() - 0.5) * 14);
            cameraY.set(-8);
            setTimeout(() => {
              cameraScale.set(0.98);
              cameraX.set((Math.random() - 0.5) * 8);
              cameraY.set(5);
            }, 80);
            setTimeout(() => {
              cameraScale.set(1);
              cameraX.set(0);
              cameraY.set(0);
            }, 280);
            setTimeout(() => setShowLightningFlash(false), 550);
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
        onTimeUpdate={() => {
          const a = idleLoopRef.current;
          if (a && a.duration && idleStateRef.current === "idle") {
            const timeLeft = a.duration - a.currentTime;
            /* Pre-prime buffer B 0.3s before end */
            if (timeLeft <= 0.3 && timeLeft > 0.05) {
              const b = idleLoopBRef.current;
              if (b && (b.paused || b.currentTime > 0.5)) {
                b.currentTime = 0;
                b.play().catch(() => {});
              }
            }
          }
        }}
        onEnded={() => {
          if (idleStateRef.current === "idle") {
            idleLoopActiveRef.current = "B";
            /* Flash overlay to mask any remaining transition artifacts */
            setShowLoopFlash(true);
            setTimeout(() => setShowLoopFlash(false), 200);
          }
        }}
      />
      <video
        ref={idleLoopBRef}
        src="/idle-loop.mp4"
        muted
        playsInline
        preload="auto"
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
        onTimeUpdate={() => {
          const b = idleLoopBRef.current;
          if (b && b.duration && idleStateRef.current === "idle") {
            const timeLeft = b.duration - b.currentTime;
            if (timeLeft <= 0.3 && timeLeft > 0.05) {
              const a = idleLoopRef.current;
              if (a && (a.paused || a.currentTime > 0.5)) {
                a.currentTime = 0;
                a.play().catch(() => {});
              }
            }
          }
        }}
        onEnded={() => {
          if (idleStateRef.current === "idle") {
            idleLoopActiveRef.current = "A";
            setShowLoopFlash(true);
            setTimeout(() => setShowLoopFlash(false), 200);
          }
        }}
      />
      <video
        ref={idleRestartRef}
        src="/idle-restart.mp4"
        muted
        playsInline
        preload="metadata"
        style={{ position: "absolute", width: 0, height: 0, opacity: 0, pointerEvents: "none" }}
        onEnded={() => {
          idleRestartRef.current?.pause();
          const wv = videoRef.current;
          if (wv) {
            wv.currentTime = currentTimeRef.current;
            wv.playbackRate = 1.0;
            wv.play().catch(() => {});
          }
          idleStateRef.current = "walking";
          setIdleState("walking");
          startIdleTimer();
        }}
      />

      {/* ═══ FROSTED GLASS EDGES — blur on high-end only, gradient fallback on others ═══ */}
      {/* Left glass edge */}
      <div style={{
        position: "fixed", top: 0, left: 0, bottom: 0, width: isMobile ? "60px" : "120px",
        zIndex: 8, pointerEvents: "none",
        ...(perfTierRef.current === "high" ? { backdropFilter: "blur(12px) saturate(1.2)", WebkitBackdropFilter: "blur(12px) saturate(1.2)" } : {}),
        background: "linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)",
        maskImage: "linear-gradient(to right, black 0%, black 30%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to right, black 0%, black 30%, transparent 100%)",
      }} />
      {/* Right glass edge */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0, width: isMobile ? "60px" : "120px",
        zIndex: 8, pointerEvents: "none",
        ...(perfTierRef.current === "high" ? { backdropFilter: "blur(12px) saturate(1.2)", WebkitBackdropFilter: "blur(12px) saturate(1.2)" } : {}),
        background: "linear-gradient(to left, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 100%)",
        maskImage: "linear-gradient(to left, black 0%, black 30%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to left, black 0%, black 30%, transparent 100%)",
      }} />
      {/* Top glass edge */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: isMobile ? "40px" : "70px",
        zIndex: 8, pointerEvents: "none",
        ...(perfTierRef.current === "high" ? { backdropFilter: "blur(8px) saturate(1.2)", WebkitBackdropFilter: "blur(8px) saturate(1.2)" } : {}),
        background: "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
        maskImage: "linear-gradient(to bottom, black 0%, black 20%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, black 0%, black 20%, transparent 100%)",
      }} />

      {/* ═══ CANVAS (character — blend-mode makes black transparent) ═══ */}
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed", inset: 0,
          zIndex: 5,
          mixBlendMode: "screen",
          pointerEvents: "none",
          willChange: "transform",
        }}
      />

      {/* ═══ PARTICLE CANVAS — floating dust motes ═══ */}
      <canvas
        ref={particleCanvasRef}
        style={{
          position: "fixed", inset: 0,
          zIndex: 6,
          mixBlendMode: "screen",
          pointerEvents: "none",
        }}
      />

      {/* ═══ SMOKE FOG CANVAS — organic smoke rising from bottom ═══ */}
      <canvas
        ref={fogCanvasRef}
        style={{
          position: "fixed", inset: 0,
          zIndex: 6,
          pointerEvents: "none",
        }}
      />

      {/* ═══ LIGHTNING FLASH — cinematic idle transition mask (high tier only) ═══ */}
      <AnimatePresence>
        {showLightningFlash && perfTierRef.current === "high" && (
          <motion.div
            key="lightning-flash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", inset: 0, zIndex: 7,
              pointerEvents: "none", overflow: "hidden",
            }}
          >
            {/* Main white flash — fast strike, quick decay */}
            <motion.div
              animate={{ opacity: [0, 1, 0.65, 0.08, 0] }}
              transition={{ duration: 0.45, times: [0, 0.06, 0.12, 0.4, 1], ease: "easeOut" }}
              style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at 50% 55%, #fff 0%, rgba(220,230,255,0.85) 25%, rgba(180,200,255,0.35) 55%, transparent 85%)",
              }}
            />
            {/* Secondary flash — delayed double-strike for realism */}
            <motion.div
              animate={{ opacity: [0, 0, 0.55, 0.15, 0] }}
              transition={{ duration: 0.45, times: [0, 0.14, 0.2, 0.4, 1], ease: "easeOut" }}
              style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at 42% 48%, rgba(255,255,255,0.8) 0%, transparent 45%)",
              }}
            />
            {/* Lightning streak lines — diagonal energy cracks */}
            <motion.div
              animate={{ opacity: [0, 0.7, 0.4, 0], x: ["-3%", "0%", "1%", "3%"] }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                position: "absolute", inset: 0,
                background: `
                  linear-gradient(72deg, transparent 29%, rgba(255,255,255,0.18) 29.8%, rgba(255,255,255,0.06) 30.2%, transparent 30.6%),
                  linear-gradient(105deg, transparent 44%, rgba(255,255,255,0.12) 44.5%, transparent 45%),
                  linear-gradient(82deg, transparent 59%, rgba(200,220,255,0.14) 59.3%, rgba(200,220,255,0.04) 59.7%, transparent 60.1%),
                  linear-gradient(118deg, transparent 66%, rgba(255,255,255,0.08) 66.3%, transparent 66.6%)
                `,
              }}
            />
            {/* Horizontal anamorphic flare streak */}
            <motion.div
              animate={{ opacity: [0, 0.6, 0.25, 0], scaleX: [0.6, 1.5, 2.5, 3.5] }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: "49%", left: "-25%", right: "-25%",
                height: 2,
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), rgba(255,255,255,0.85), rgba(255,255,255,0.5), transparent)",
                filter: "blur(1.5px)",
                transformOrigin: "center center",
              }}
            />
            {/* Diffused wide glow band */}
            <motion.div
              animate={{ opacity: [0, 0.35, 0.12, 0] }}
              transition={{ duration: 0.55, times: [0, 0.1, 0.4, 1], ease: "easeOut" }}
              style={{
                position: "absolute",
                top: "42%", left: "-10%", right: "-10%",
                height: 80,
                background: "linear-gradient(90deg, transparent, rgba(200,215,255,0.15), rgba(255,255,255,0.25), rgba(200,215,255,0.15), transparent)",
                filter: "blur(18px)",
              }}
            />
            {/* Afterglow — lingering tinted haze */}
            <motion.div
              animate={{ opacity: [0, 0, 0.2, 0.08, 0] }}
              transition={{ duration: 0.55, times: [0, 0.15, 0.25, 0.55, 1], ease: "easeOut" }}
              style={{
                position: "absolute", inset: 0,
                background: `radial-gradient(ellipse at 50% 55%, ${blendedColor}15 0%, transparent 55%)`,
              }}
            />
            {/* Film grain overlay during flash */}
            <motion.div
              animate={{ opacity: [0, 0.05, 0.02, 0] }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{
                position: "absolute", inset: 0,
                mixBlendMode: "overlay",
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: "150px 150px",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ WAKE FLASH — exit idle cinematic punch ═══ */}
      <AnimatePresence>
        {showWakeFlash && (
          <motion.div
            key="wake-flash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed", inset: 0, zIndex: 7,
              pointerEvents: "none",
            }}
          >
            {/* Quick bright radial punch */}
            <motion.div
              animate={{ opacity: [0, 0.65, 0.15, 0] }}
              transition={{ duration: 0.3, times: [0, 0.1, 0.35, 1], ease: "easeOut" }}
              style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(ellipse at 50% 55%, rgba(255,255,255,0.8) 0%, rgba(210,220,255,0.35) 30%, transparent 65%)",
              }}
            />
            {/* Directional motion streak */}
            <motion.div
              animate={{ opacity: [0, 0.4, 0], x: ["0%", "4%"] }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(95deg, transparent 15%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.06) 55%, transparent 85%)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ IDLE LOOP FLASH — masks buffer swap at loop point ═══ */}
      <AnimatePresence>
        {showLoopFlash && (
          <motion.div
            key="loop-flash"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: "fixed", inset: 0, zIndex: 7,
              pointerEvents: "none",
              background: "radial-gradient(ellipse at 50% 60%, rgba(255,255,255,0.35) 0%, rgba(200,210,230,0.12) 35%, transparent 60%)",
            }}
          />
        )}
      </AnimatePresence>

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


      {/* Volumetric light shaft + atmospheric haze — high/mid only (animated divs) */}
      {perfTierRef.current !== "low" && <>
        <motion.div
          animate={{ opacity: [0.03, 0.08, 0.03] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "fixed", inset: 0,
            zIndex: 3, pointerEvents: "none",
            background: "linear-gradient(135deg, transparent 20%, rgba(255,255,255,0.02) 40%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 60%, transparent 80%)",
            transform: "skewX(-15deg)",
          }}
        />
        <motion.div
          animate={{ opacity: [0.015, 0.04, 0.015] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "fixed", inset: 0,
            zIndex: 8, pointerEvents: "none",
            background: `radial-gradient(ellipse at 50% 70%, ${blendedColor}08 0%, transparent 60%)`,
            transition: "background 1.5s ease",
          }}
        />
      </>}
      {/* Persistent film grain — high tier only (SVG filter triggers GPU repaints) */}
      {perfTierRef.current === "high" && <div style={{
        position: "fixed", inset: 0,
        zIndex: 8, pointerEvents: "none",
        mixBlendMode: "overlay",
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "200px 200px",
      }} />}

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
        padding: isMobile ? "16px 20px" : "24px 40px",
      }}>
        <button
          onClick={() => navTo(0)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: isMobile ? "0.6rem" : "0.7rem", letterSpacing: "0.5em",
            fontFamily: "var(--font-mono, monospace)",
            color: "rgba(255,255,255,0.5)", fontWeight: 600,
          }}
        >HAMILTON</button>
        <div style={{ display: "flex", gap: isMobile ? 14 : 28, alignItems: "center" }}>
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
                fontSize: isMobile ? "0.45rem" : "0.55rem", letterSpacing: "0.25em",
                color: envIdx === idx ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.25)",
                fontFamily: "var(--font-mono, monospace)",
                transition: "color 0.4s",
                padding: "4px 0",
              }}
            >{label}</button>
          ))}
        </div>
      </nav>

      {/* ═══ SIDE DOTS ═══ */}
      <div style={{
        position: "fixed", right: isMobile ? 12 : 24, top: "50%", transform: "translateY(-50%)",
        zIndex: 50, display: "flex", flexDirection: "column", gap: isMobile ? 4 : 6,
      }}>
        {ENVIRONMENTS.map((e, i) => (
          <button
            key={e.id}
            onClick={() => navTo(i)}
            style={{
              width: envIdx === i ? (isMobile ? 16 : 24) : (isMobile ? 3 : 4),
              height: isMobile ? 3 : 4,
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
        padding: isMobile ? "0 20px 80px 20px" : "0 40px 120px 40px",
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={env.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.7, ease }}
            style={{ maxWidth: isMobile ? "100%" : 600, pointerEvents: "auto" }}
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

            {/* Intro auto-walk */}
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
                  animate={{ opacity: [0.35, 0.7, 0.35] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  style={{
                    fontSize: "0.55rem",
                    letterSpacing: "0.4em",
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >SCROLL TO WALK ↓</motion.p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ═══ AUTO-WALK CONTROLS — persistent bottom-right (not on intro) ═══ */}
      {env.id !== "intro" && <div style={{
        position: "fixed",
        bottom: isMobile ? 20 : 40,
        right: isMobile ? 20 : 40,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 8,
        pointerEvents: "auto",
      }}>
        {/* Reverse direction */}
        {autoWalk && (
          <button
            onClick={() => {
              const next = autoWalkDirRef.current === 1 ? -1 : 1;
              autoWalkDirRef.current = next as 1 | -1;
              setAutoWalkDir(next as 1 | -1);
              scrollDirRef.current = next;
            }}
            style={{
              width: 36, height: 36,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.7rem",
              cursor: "pointer",
              transition: "all 0.3s",
              display: "flex", alignItems: "center", justifyContent: "center",
              backdropFilter: "blur(12px)",
              transform: autoWalkDir === -1 ? "scaleX(-1)" : "none",
            }}
            title={autoWalkDir === 1 ? "Reverse" : "Forward"}
          >↻</button>
        )}
        {/* Play / Stop */}
        <button
          onClick={toggleAutoWalk}
          style={{
            padding: "10px 22px",
            borderRadius: 999,
            background: autoWalk ? "rgba(255,255,255,0.08)" : "transparent",
            border: `1px solid ${autoWalk ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`,
            color: autoWalk ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.25)",
            fontSize: "0.5rem",
            fontFamily: "var(--font-mono, monospace)",
            letterSpacing: "0.2em",
            cursor: "pointer",
            transition: "all 0.4s",
            backdropFilter: "blur(12px)",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >{autoWalk ? "■ STOP" : "▶ AUTO WALK"}</button>
      </div>}

      {/* ═══ PROJECT PREVIEW — fixed right side, cinematic transitions ═══ */}
      <AnimatePresence mode="wait">
        {"previewUrl" in env && env.previewUrl && !isSuckingIn && !isMobile && (
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
