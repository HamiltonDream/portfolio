"use client";

import { useEffect, useRef, useState } from "react";
import { scrollState } from "@/lib/scrollState";

/* ── sections ── */
const SECTIONS = {
  hero: { start: 0.0, end: 0.15 },
  work: { start: 0.15, end: 0.60 },
  about: { start: 0.60, end: 0.80 },
  contact: { start: 0.80, end: 1.0 },
};

const SKILLS = ["Software Development", "Music Production", "Motion Design", "Video Editing", "3D Animation", "App Development", "Brand Design", "Sound Engineering"];

/* ── fade helper ── */
function fade(p: number, s: { start: number; end: number }) {
  const f = 0.04;
  if (p < s.start - f) return 0;
  if (p < s.start) return (p - (s.start - f)) / f;
  if (p <= s.end - f) return 1;
  if (p <= s.end) return 1 - (p - (s.end - f)) / f;
  return 0;
}

export default function PortfolioOverlay() {
  const prevP = useRef(0);
  const [, rerender] = useState(0);
  const [autoScroll, setAutoScroll] = useState(false);
  const autoRef = useRef(false);

  useEffect(() => {
    autoRef.current = autoScroll;
  }, [autoScroll]);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      // auto-scroll: slowly advance
      if (autoRef.current && scrollState.scroll < 1) {
        scrollState.scroll = Math.min(scrollState.scroll + 0.00012, 1);
      }
      const newP = scrollState.progress;
      if (Math.abs(newP - prevP.current) > 0.0005) {
        prevP.current = newP;
        rerender((n) => n + 1);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // stop auto-scroll if user scrolls manually
  useEffect(() => {
    const stop = () => { if (autoRef.current) setAutoScroll(false); };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    return () => { window.removeEventListener("wheel", stop); window.removeEventListener("touchstart", stop); };
  }, []);

  // detect when user interacts with Spotify iframe (focus goes to iframe = user clicked play)
  useEffect(() => {
    const onBlur = () => {
      // when window loses focus, check if an iframe got it
      setTimeout(() => {
        if (document.activeElement?.tagName === "IFRAME") {
          setAutoScroll(true);
          window.dispatchEvent(new Event("startAudioReact"));
        }
      }, 100);
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, []);

  const p = scrollState.progress;
  const ho = fade(p, SECTIONS.hero);
  const ao = fade(p, SECTIONS.about);
  const co = fade(p, SECTIONS.contact);

  const nav = (target: number) => { scrollState.scroll = target; };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10, pointerEvents: "none", overflow: "hidden", fontFamily: "var(--font-body, Inter, sans-serif)" }}>
      {/* progress bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, zIndex: 50 }}>
        <div style={{ width: `${p * 100}%`, height: "100%", background: "linear-gradient(90deg, #00D4FF, #7C3AED, #EC4899)", transition: "width 0.1s" }} />
      </div>

      {/* top nav */}
      <nav style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 50, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 32px", pointerEvents: "auto" }}>
        <span style={{ fontSize: "0.7rem", letterSpacing: "0.4em", fontFamily: "var(--font-mono, monospace)", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>HAMILTON</span>
        <div style={{ display: "flex", gap: 24 }}>
          {([["WORK", 0.25], ["ABOUT", 0.7], ["CONTACT", 0.9]] as [string, number][]).map(([l, t]) => (
            <button key={l} onClick={() => nav(t)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "0.6rem", letterSpacing: "0.3em", color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-mono, monospace)", transition: "color 0.3s", padding: "4px 0" }}>{l}</button>
          ))}
        </div>
      </nav>

      {/* nav dots */}
      <div style={{ position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)", zIndex: 50, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "auto" }}>
        {Object.entries(SECTIONS).map(([k, s]) => {
          const a = p >= s.start && p < s.end;
          return <button key={k} onClick={() => nav((s.start + s.end) / 2)} style={{ width: a ? 10 : 5, height: a ? 10 : 5, borderRadius: "50%", background: a ? "#00D4FF" : "rgba(255,255,255,0.12)", border: "none", cursor: "pointer", transition: "all 0.4s" }} />;
        })}
      </div>

      {/* ═══ HERO ═══ */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: ho, transform: `translateY(${(1 - ho) * -30}px)`, pointerEvents: ho > 0.5 ? "auto" : "none" }}>
        <div style={{ textAlign: "center", maxWidth: 700 }}>
          <p style={{ fontSize: "0.6rem", letterSpacing: "0.6em", color: "rgba(0,212,255,0.6)", fontFamily: "var(--font-mono, monospace)", marginBottom: 20 }}>CREATIVE DEVELOPER &amp; PRODUCER</p>
          <h1 style={{ fontSize: "clamp(3.5rem, 12vw, 9rem)", fontWeight: 800, lineHeight: 0.85, letterSpacing: "-0.03em", marginBottom: 28, fontFamily: "var(--font-display, sans-serif)" }}>
            NOAH<br />
            <span style={{ background: "linear-gradient(135deg, #00D4FF, #7C3AED, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>HAMILTON</span>
          </h1>
          <p style={{ fontSize: "1rem", color: "rgba(255,255,255,0.3)", maxWidth: 440, margin: "0 auto", lineHeight: 1.8 }}>Code. Sound. Motion. Building immersive experiences at the intersection of every creative discipline.</p>
          <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center", alignItems: "center" }}>
            <button onClick={() => nav(0.25)} style={{ padding: "12px 32px", borderRadius: 999, background: "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))", border: "1px solid rgba(0,212,255,0.3)", color: "#00D4FF", fontSize: "0.65rem", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.2em", cursor: "pointer", pointerEvents: "auto" }}>VIEW WORK</button>
            <button onClick={() => { setAutoScroll(true); nav(0.0); window.dispatchEvent(new Event("startAudioReact")); }} style={{ padding: "12px 32px", borderRadius: 999, background: "transparent", border: "1px solid rgba(124,58,237,0.3)", color: "#7C3AED", fontSize: "0.65rem", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.2em", cursor: "pointer", pointerEvents: "auto" }}>{"\u25b6"} RIDE</button>
          </div>
          <p style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.1)", fontFamily: "var(--font-mono, monospace)", marginTop: 56, letterSpacing: "0.3em" }}>{"\u2193"} SCROLL TO EXPLORE</p>
        </div>
      </div>

      {/* ═══ ABOUT ═══ */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", opacity: ao, transform: `translateY(${(1 - ao) * 40}px)`, pointerEvents: ao > 0.5 ? "auto" : "none" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64 }}>
          <div>
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.4em", color: "rgba(168,85,247,0.6)", fontFamily: "var(--font-mono, monospace)", marginBottom: 16 }}>ABOUT</p>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.1, marginBottom: 24, fontFamily: "var(--font-display, sans-serif)" }}>Multi-disciplinary<br /><span style={{ background: "linear-gradient(90deg, #A855F7, #EC4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>creator</span></h2>
            <p style={{ color: "rgba(255,255,255,0.3)", lineHeight: 1.8, fontSize: "0.9rem" }}>I build things at the intersection of technology and art. From full-stack applications to music production, from motion graphics to brand systems {"\u2014"} the best work happens when disciplines collide.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, alignContent: "start" }}>
            {SKILLS.map((s, i) => <div key={i} style={{ padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(168,85,247,0.08)", background: "rgba(168,85,247,0.03)", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>{s}</div>)}
          </div>
        </div>
      </div>

      {/* ═══ CONTACT ═══ */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: co, transform: `scale(${0.92 + co * 0.08})`, pointerEvents: co > 0.5 ? "auto" : "none" }}>
        <div style={{ textAlign: "center", maxWidth: 560 }}>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.4em", color: "rgba(236,72,153,0.6)", fontFamily: "var(--font-mono, monospace)", marginBottom: 16 }}>GET IN TOUCH</p>
          <h2 style={{ fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: 700, lineHeight: 1.1, marginBottom: 24, fontFamily: "var(--font-display, sans-serif)" }}>Let&apos;s build<br /><span style={{ background: "linear-gradient(90deg, #EC4899, #00D4FF)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>something great</span></h2>
          <p style={{ color: "rgba(255,255,255,0.3)", lineHeight: 1.8, fontSize: "0.9rem", marginBottom: 36 }}>Available for freelance projects, collaborations, and creative partnerships.</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
            <a href="mailto:hello@hamilton.dev" style={{ padding: "14px 32px", borderRadius: 999, border: "1px solid rgba(236,72,153,0.3)", background: "rgba(236,72,153,0.08)", color: "#EC4899", fontSize: "0.65rem", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.15em", pointerEvents: "auto", textDecoration: "none" }}>EMAIL ME</a>
            <a href="#" style={{ padding: "14px 32px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: "0.65rem", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.15em", pointerEvents: "auto", textDecoration: "none" }}>RESUME</a>
          </div>
        </div>
      </div>

      {/* ═══ AUTO-SCROLL INDICATOR ═══ */}
      {autoScroll && (
        <div style={{ position: "absolute", bottom: 110, left: "50%", transform: "translateX(-50%)", zIndex: 55, pointerEvents: "auto" }}>
          <button onClick={() => setAutoScroll(false)} style={{ padding: "8px 24px", borderRadius: 999, background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#7C3AED", fontSize: "0.55rem", fontFamily: "var(--font-mono, monospace)", letterSpacing: "0.2em", cursor: "pointer", animation: "pulse 2s infinite" }}>
            {"\u25b6"} RIDING — TAP TO STOP
          </button>
        </div>
      )}

      {/* ═══ MUSIC PLAYER — persistent bottom bar ═══ */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 60, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
        <div
          style={{ width: 380, padding: "8px 16px 12px", background: "rgba(3,3,8,0.95)", backdropFilter: "blur(24px)", borderTop: "1px solid rgba(124,58,237,0.2)", borderLeft: "1px solid rgba(255,255,255,0.03)", borderRight: "1px solid rgba(255,255,255,0.03)", borderRadius: "14px 14px 0 0", pointerEvents: "auto", cursor: "pointer" }}
          onClick={() => { if (!autoRef.current) { setAutoScroll(true); window.dispatchEvent(new Event("startAudioReact")); } }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <p style={{ fontSize: "0.45rem", letterSpacing: "0.3em", color: "rgba(124,58,237,0.7)", fontFamily: "var(--font-mono, monospace)" }}>{"\u266b"} UNDISCOVERED {autoScroll ? "· RIDING" : "· TAP TO RIDE"}</p>
            <a href="https://music.apple.com/us/album/undiscovered/1882395617" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: "0.45rem", color: "rgba(255,255,255,0.2)", fontFamily: "var(--font-mono, monospace)", textDecoration: "none", letterSpacing: "0.15em" }}>APPLE MUSIC {"\u2192"}</a>
          </div>
          <iframe title="Spotify Player" src="https://open.spotify.com/embed/album/1rWPihEZtSm2zZKjvjKdvx?theme=0" width="100%" height="80" style={{ borderRadius: 8, border: "none", pointerEvents: "auto" }} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
        </div>
      </div>
    </div>
  );
}
