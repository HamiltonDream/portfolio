"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO — Scroll-driven site with walk-through projects
   
   Hero → [scroll down] → Walk Zone (video scrubs per project)
   → [scroll down] → Music → Contact
   
   The walking video is pinned (sticky) during the projects
   section only. Everything else scrolls normally.
   ═══════════════════════════════════════════════════════════════ */

const PROJECTS = [
  {
    id: "fieldops",
    num: "01",
    title: "Field Ops\nManagement",
    subtitle: "FULL STACK · SAAS · REACT",
    description:
      "Enterprise field operations platform. Real-time scheduling, crew management, invoicing — the whole stack.",
    color: "#4ADE80",
    url: "https://www.fieldopsmanagement.com/",
  },
  {
    id: "dreamscape",
    num: "02",
    title: "Cal\nDreamscape",
    subtitle: "WEB DESIGN · BRANDING",
    description:
      "Complete brand identity and website for a California landscape company. Nature-inspired, premium feel.",
    color: "#A8B4A5",
    url: "https://caldreamscapelandscape.com/",
  },
  {
    id: "cookie",
    num: "03",
    title: "Cookie\nTracker",
    subtitle: "WEB APP · REACT · ANALYTICS",
    description:
      "Analytics dashboard for tracking cookies, sessions, and user behavior. Clean data visualization.",
    color: "#60A5FA",
    url: "https://cookietracker.site/",
  },
  {
    id: "motion",
    num: "04",
    title: "Motion\nReel",
    subtitle: "ANIMATION · MOTION · 3D",
    description:
      "Compilation of motion design, 3D animation, and visual effects work.",
    color: "#FB923C",
    url: "https://www.youtube.com/watch?v=eIp-fptOEwA&list=PLK9JwrqTx7UpF1JQ81kpahVNeRLrvZwil",
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function Portfolio() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const walkRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);

  const [duration, setDuration] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const [autoTour, setAutoTour] = useState(false);
  const [musicVisible, setMusicVisible] = useState(false);

  /* ── Video readiness — just grab duration, no loader ── */
  const tryReady = useCallback(() => {
    const v = videoRef.current;
    if (!v || duration > 0) return;
    if (v.duration && isFinite(v.duration) && v.duration > 0) {
      setDuration(v.duration);
      v.currentTime = 0;
    }
  }, [duration]);

  useEffect(() => {
    const i = setInterval(tryReady, 150);
    return () => clearInterval(i);
  }, [tryReady]);

  /* ── Scroll → video time sync ── */
  useEffect(() => {
    if (!duration) return;

    let ticking = false;
    let lastTime = -1;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const section = walkRef.current;
        const video = videoRef.current;
        const fade = fadeRef.current;

        if (!section || !video) {
          ticking = false;
          return;
        }

        const rect = section.getBoundingClientRect();
        const scrollable = section.offsetHeight - window.innerHeight;
        if (scrollable <= 0) { ticking = false; return; }

        const progress = Math.max(0, Math.min(1, -rect.top / scrollable));

        /* Seek video */
        const targetTime = progress * duration;
        if (Math.abs(lastTime - targetTime) > 0.01) {
          lastTime = targetTime;
          if (typeof video.fastSeek === "function") {
            video.fastSeek(targetTime);
          } else {
            video.currentTime = targetTime;
          }
        }

        /* Active project */
        const idx = Math.min(Math.floor(progress * PROJECTS.length), PROJECTS.length - 1);
        if (idx >= 0) setActiveIdx(prev => prev !== idx ? idx : prev);

        /* Fade: black when entering/leaving walk zone, clear in middle */
        if (fade) {
          let op = 0;
          if (rect.top > 0) {
            // Approaching from above — fade from black as section enters
            op = Math.min(1, rect.top / (window.innerHeight * 0.4));
          } else if (progress > 0.9) {
            // Near end — fade to black
            op = (progress - 0.9) / 0.1;
          }
          fade.style.opacity = String(Math.max(0, Math.min(1, op)));
        }

        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [duration]);

  /* ── Auto-tour ── */
  useEffect(() => {
    if (!autoTour) return;
    let raf: number;
    const animate = () => {
      window.scrollBy(0, 1.8);
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 5) {
        setAutoTour(false);
        return;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    const stop = () => setAutoTour(false);
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
    };
  }, [autoTour]);

  /* ── Music section visibility (lazy-load Spotify) ── */
  const musicRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = musicRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setMusicVisible(true); obs.disconnect(); }
    }, { rootMargin: "200px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const project = PROJECTS[activeIdx] ?? PROJECTS[0];

  return (
    <main style={{ background: "#050508", color: "#F0F0F8" }}>

      {/* ═══ FIXED NAV ═══ */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 60,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "20px clamp(24px, 5vw, 80px)",
        background: "rgba(5,5,8,0.6)",
        backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <a href="#" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          style={{ fontSize: "0.7rem", letterSpacing: "0.5em", fontFamily: "var(--font-mono, monospace)", color: "rgba(255,255,255,0.5)", fontWeight: 600, cursor: "pointer", textDecoration: "none" }}>
          HAMILTON
        </a>
        <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {[{ label: "WORK", href: "#work" }, { label: "MUSIC", href: "#music" }, { label: "CONTACT", href: "#contact" }].map(({ label, href }) => (
            <a key={label} href={href} style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-mono, monospace)", textDecoration: "none", transition: "color 0.3s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.25)")}>{label}</a>
          ))}
        </div>
      </nav>

      {/* ═══ HERO ═══ */}
      <section style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 clamp(24px, 5vw, 80px)", position: "relative" }}>
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3, ease }}>
          <p style={{ fontSize: "0.5rem", letterSpacing: "0.4em", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono, monospace)", marginBottom: 20 }}>
            CREATIVE DEVELOPER &amp; PRODUCER
          </p>
          <h1 style={{ fontSize: "clamp(3.5rem, 11vw, 9rem)", fontWeight: 800, lineHeight: 0.85, letterSpacing: "-0.03em", fontFamily: "var(--font-display, sans-serif)", marginBottom: 28 }}>
            NOAH<br />HAMILTON
          </h1>
          <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.2)", lineHeight: 1.8, maxWidth: 440, marginBottom: 44 }}>
            Code. Sound. Motion.<br />Building at the intersection of every creative discipline.
          </p>
          <button onClick={() => setAutoTour(!autoTour)} style={{
            padding: "12px 32px", borderRadius: 999,
            background: autoTour ? "rgba(255,255,255,0.08)" : "transparent",
            border: "1px solid rgba(255,255,255,0.12)",
            color: autoTour ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
            fontSize: "0.55rem", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.2em", cursor: "pointer", transition: "all 0.4s",
          }}>
            {autoTour ? "■ STOP TOUR" : "▶ TAKE THE TOUR"}
          </button>
        </motion.div>

        <motion.div animate={{ opacity: [0.12, 0.35, 0.12], y: [0, 8, 0] }} transition={{ duration: 3, repeat: Infinity }}
          style={{ position: "absolute", bottom: 44, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: "0.45rem", letterSpacing: "0.4em", color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-mono, monospace)" }}>SCROLL</span>
          <div style={{ width: 1, height: 44, background: "linear-gradient(to bottom, rgba(255,255,255,0.2), transparent)" }} />
        </motion.div>
      </section>

      {/* ═══ WALK ZONE — video fills screen, projects cycle ═══ */}
      <section ref={walkRef} id="work" style={{ height: `${PROJECTS.length * 150}vh`, position: "relative" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", width: "100%", overflow: "hidden" }}>

          <video ref={videoRef} src="/walk-loop.mp4" muted playsInline preload="auto"
            onLoadedMetadata={tryReady} onLoadedData={tryReady} onCanPlay={tryReady}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }} />

          {/* Vignette */}
          <div style={{ position: "absolute", inset: 0, zIndex: 2, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)" }} />
          {/* Bottom gradient */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "55%", zIndex: 2, pointerEvents: "none", background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)" }} />
          {/* Top gradient */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "25%", zIndex: 2, pointerEvents: "none", background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }} />

          {/* Project info */}
          <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none", display: "flex", alignItems: "flex-end", padding: "0 clamp(24px, 5vw, 80px) 100px" }}>
            <AnimatePresence mode="wait">
              <motion.div key={project.id} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.55, ease }}
                style={{ maxWidth: 550, pointerEvents: "auto" }}>
                <span style={{ fontSize: "clamp(6rem, 18vw, 14rem)", fontWeight: 900, fontFamily: "var(--font-display, sans-serif)", color: project.color, opacity: 0.04, lineHeight: 0.8, display: "block", marginBottom: -40, userSelect: "none" }}>{project.num}</span>
                <p style={{ fontSize: "0.5rem", letterSpacing: "0.4em", color: project.color, fontFamily: "var(--font-mono, monospace)", marginBottom: 12, opacity: 0.6 }}>{project.subtitle}</p>
                <h2 style={{ fontSize: "clamp(2rem, 5vw, 4.5rem)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", fontFamily: "var(--font-display, sans-serif)", color: "#fff", whiteSpace: "pre-line", textShadow: "0 4px 40px rgba(0,0,0,0.4)", marginBottom: 16 }}>{project.title}</h2>
                <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.7, maxWidth: 420 }}>{project.description}</p>
                <a href={project.url} target="_blank" rel="noopener noreferrer" style={{
                  display: "inline-flex", alignItems: "center", gap: 8, marginTop: 24, padding: "10px 24px", borderRadius: 999,
                  border: `1px solid ${project.color}30`, background: `${project.color}08`, color: project.color,
                  fontSize: "0.55rem", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.15em", textDecoration: "none", transition: "all 0.4s", pointerEvents: "auto",
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${project.color}18`; e.currentTarget.style.borderColor = `${project.color}60`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = `${project.color}08`; e.currentTarget.style.borderColor = `${project.color}30`; }}>
                  VIEW PROJECT →
                </a>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Side dots */}
          <div style={{ position: "absolute", right: 24, top: "50%", transform: "translateY(-50%)", zIndex: 20, display: "flex", flexDirection: "column", gap: 6 }}>
            {PROJECTS.map((p, i) => (
              <div key={p.id} style={{ width: activeIdx === i ? 24 : 4, height: 4, borderRadius: 2, background: activeIdx === i ? p.color : "rgba(255,255,255,0.12)", transition: "all 0.5s cubic-bezier(0.25,0.46,0.45,0.94)" }} />
            ))}
          </div>

          {/* Left label */}
          <div style={{ position: "absolute", left: 40, top: "50%", transform: "translateY(-50%) rotate(-90deg)", zIndex: 20, pointerEvents: "none" }}>
            <AnimatePresence mode="wait">
              <motion.span key={project.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 0.15, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.5 }}
                style={{ fontSize: "0.6rem", letterSpacing: "0.5em", color: project.color, fontFamily: "var(--font-mono, monospace)", fontWeight: 600, whiteSpace: "nowrap" }}>
                PROJECT {project.num}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Fade overlay */}
          <div ref={fadeRef} style={{ position: "absolute", inset: 0, zIndex: 30, pointerEvents: "none", background: "#050508", opacity: 1 }} />
        </div>
      </section>

      {/* ═══ MUSIC ═══ */}
      <section ref={musicRef} id="music" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 clamp(24px, 5vw, 80px)", position: "relative" }}>
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease }}>
          <p style={{ fontSize: "0.5rem", letterSpacing: "0.4em", color: "#C084FC", fontFamily: "var(--font-mono, monospace)", marginBottom: 16, opacity: 0.6 }}>MUSIC · PRODUCTION · ALBUM</p>
          <h2 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", fontFamily: "var(--font-display, sans-serif)", marginBottom: 20 }}>Undiscovered</h2>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.7, maxWidth: 420, marginBottom: 36 }}>Full-length album. Produced, mixed, and mastered. Every sound from scratch.</p>
          <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
            <a href="https://open.spotify.com/album/1rWPihEZtSm2zZKjvjKdvx" target="_blank" rel="noopener noreferrer" style={{ padding: "10px 24px", borderRadius: 999, border: "1px solid rgba(192,132,252,0.3)", background: "rgba(192,132,252,0.06)", color: "#C084FC", fontSize: "0.55rem", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.15em", textDecoration: "none" }}>
              SPOTIFY →
            </a>
            <a href="https://music.apple.com/us/album/undiscovered/1882395617" target="_blank" rel="noopener noreferrer" style={{ padding: "10px 24px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: "0.55rem", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.15em", textDecoration: "none" }}>
              APPLE MUSIC →
            </a>
          </div>
          {musicVisible && (
            <div style={{ maxWidth: 400, borderRadius: 14, overflow: "hidden", border: "1px solid rgba(192,132,252,0.12)" }}>
              <iframe title="Spotify" src="https://open.spotify.com/embed/album/1rWPihEZtSm2zZKjvjKdvx?theme=0" width="100%" height="152" style={{ border: "none", display: "block" }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
            </div>
          )}
        </motion.div>
      </section>

      {/* ═══ CONTACT ═══ */}
      <section id="contact" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 clamp(24px, 5vw, 80px)" }}>
        <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.8, ease }}>
          <p style={{ fontSize: "0.5rem", letterSpacing: "0.4em", color: "#F472B6", fontFamily: "var(--font-mono, monospace)", marginBottom: 16, opacity: 0.6 }}>GET IN TOUCH</p>
          <h2 style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.03em", fontFamily: "var(--font-display, sans-serif)", marginBottom: 20 }}>
            Let&apos;s<br />Build
          </h2>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.25)", lineHeight: 1.7, maxWidth: 420, marginBottom: 36 }}>Available for freelance, collaborations, and creative partnerships.</p>
          <div style={{ display: "flex", gap: 12 }}>
            <a href="mailto:hello@hamilton.dev" style={{ padding: "12px 28px", borderRadius: 999, border: "1px solid rgba(244,114,182,0.3)", background: "rgba(244,114,182,0.06)", color: "#F472B6", fontSize: "0.55rem", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.15em", textDecoration: "none", transition: "all 0.4s" }}>EMAIL ME</a>
            <a href="#" style={{ padding: "12px 28px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: "0.55rem", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.15em", textDecoration: "none" }}>RESUME</a>
          </div>
        </motion.div>
      </section>

      {/* ═══ AUTO-TOUR PILL ═══ */}
      <AnimatePresence>
        {autoTour && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.4 }}
            onClick={() => setAutoTour(false)}
            style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 70, display: "flex", alignItems: "center", gap: 10, padding: "10px 24px", borderRadius: 999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", pointerEvents: "auto" }}>
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80" }} />
            <span style={{ fontSize: "0.5rem", letterSpacing: "0.3em", color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-mono, monospace)" }}>TOURING — CLICK OR SCROLL TO STOP</span>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
