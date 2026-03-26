"use client";

import { useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ================================================================
   PROJECTS DATA
   ================================================================ */
const PROJECTS = [
  { num: "01", title: "HamiltonDream", type: "Music · Production · Sound Design", description: "Original compositions and sound design across genres. Full production pipeline from concept to master." },
  { num: "02", title: "SaaS Platform", type: "React · Full Stack · Cloud", description: "End-to-end cloud platform with real-time dashboards, auth, and subscription management." },
  { num: "03", title: "Motion Reel", type: "After Effects · Motion Design", description: "Cinematic motion graphics, title sequences, and visual effects for brands and artists." },
  { num: "04", title: "Mobile Suite", type: "iOS · React Native · UX", description: "Cross-platform mobile apps with fluid animations and intuitive user experiences." },
  { num: "05", title: "Brand Worlds", type: "Figma · Brand · Typography", description: "Complete brand identity systems from logo to guidelines to digital presence." },
];

/* ================================================================
   SKILLS / ABOUT DATA
   ================================================================ */
const SKILLS = [
  "Software Development",
  "Music Production",
  "Motion Design",
  "Video Editing",
  "3D Animation",
  "App Development",
  "Brand Design",
  "Sound Engineering",
];

/* ================================================================
   COMPONENT
   ================================================================ */
export default function ScrollSections({
  scrollRef,
}: {
  scrollRef: React.RefObject<{ value: number }>;
}) {
  const containerRef = useRef<HTMLDivElement>(null!);

  /* ---- update shared scroll progress for 3D camera ---- */
  const updateScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    scrollRef.current.value = h > 0 ? window.scrollY / h : 0;
  }, [scrollRef]);

  useEffect(() => {
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, [updateScroll]);

  /* ---- GSAP animations ---- */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* — HERO text reveal — */
      const heroChars = containerRef.current?.querySelectorAll(".hero-char");
      if (heroChars?.length) {
        gsap.from(heroChars, {
          y: 80,
          opacity: 0,
          rotationX: -90,
          stagger: 0.04,
          duration: 1.2,
          ease: "power4.out",
          delay: 0.3,
        });
      }

      const heroSub = containerRef.current?.querySelector(".hero-sub");
      if (heroSub) {
        gsap.from(heroSub, {
          y: 30,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          delay: 0.8,
        });
      }

      const heroLine = containerRef.current?.querySelector(".hero-line");
      if (heroLine) {
        gsap.from(heroLine, {
          scaleX: 0,
          duration: 1.5,
          ease: "power2.inOut",
          delay: 1.2,
        });
      }

      /* — Hero scroll-out — */
      gsap.to(".hero-content", {
        y: -100,
        opacity: 0,
        ease: "none",
        scrollTrigger: {
          trigger: ".section-hero",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      /* — WORK: horizontal scroll of project cards — */
      const workTrack = containerRef.current?.querySelector(".work-track") as HTMLElement | null;
      if (workTrack) {
        const cards = workTrack.querySelectorAll(".project-card");
        const totalWidth = workTrack.scrollWidth - window.innerWidth;

        gsap.to(workTrack, {
          x: -totalWidth,
          ease: "none",
          scrollTrigger: {
            trigger: ".section-work",
            start: "top top",
            end: () => `+=${totalWidth}`,
            scrub: 1,
            pin: true,
            anticipatePin: 1,
          },
        });

        // Staggered card entrance
        cards.forEach((card, i) => {
          gsap.from(card, {
            y: 120,
            opacity: 0,
            rotationY: -15,
            scale: 0.85,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              containerAnimation: gsap.getById?.("workHScroll") || undefined,
              start: "left 85%",
              end: "left 50%",
              scrub: 1,
              horizontal: true,
            },
          });
        });
      }

      /* — ABOUT: line-by-line text reveal pinned — */
      const aboutLines = containerRef.current?.querySelectorAll(".about-line");
      if (aboutLines?.length) {
        gsap.from(aboutLines, {
          y: 60,
          opacity: 0,
          stagger: 0.15,
          ease: "none",
          scrollTrigger: {
            trigger: ".section-about",
            start: "top 60%",
            end: "top 10%",
            scrub: 1,
          },
        });
      }

      /* — Skills stagger — */
      const skillItems = containerRef.current?.querySelectorAll(".skill-item");
      if (skillItems?.length) {
        gsap.from(skillItems, {
          x: -60,
          opacity: 0,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".skills-grid",
            start: "top 70%",
            end: "top 30%",
            scrub: 1,
          },
        });
      }

      /* — CONTACT entrance — */
      gsap.from(".contact-heading", {
        scale: 0.6,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".section-contact",
          start: "top 60%",
          end: "top 20%",
          scrub: 1,
        },
      });

      gsap.from(".contact-body", {
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".section-contact",
          start: "top 40%",
          end: "top 10%",
          scrub: 1,
        },
      });

      /* — nav line grows with scroll — */
      gsap.to(".scroll-progress-bar", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  /* ---- RENDER ---- */
  return (
    <div ref={containerRef} className="scroll-sections relative z-10">
      {/* Fixed progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[2px]">
        <div className="scroll-progress-bar h-full bg-gradient-to-r from-[#00D4FF] to-[#7C3AED] origin-left" style={{ transform: "scaleX(0)" }} />
      </div>

      {/* Fixed nav */}
      <nav className="fixed top-6 right-8 z-50 flex flex-col gap-3 items-end mix-blend-difference">
        {["Work", "About", "Contact"].map((label) => (
          <button
            key={label}
            onClick={() => {
              const el = document.querySelector(`.section-${label.toLowerCase()}`);
              el?.scrollIntoView({ behavior: "smooth" });
            }}
            className="text-xs tracking-[0.3em] uppercase text-white/50 hover:text-[#00D4FF] transition-colors duration-300 font-mono"
          >
            {label}
          </button>
        ))}
      </nav>

      {/* ============================================
          HERO SECTION
          ============================================ */}
      <section className="section-hero relative h-screen flex items-center justify-center">
        <div className="hero-content text-center px-6">
          <p className="text-xs tracking-[0.5em] uppercase text-[#00D4FF]/80 font-mono mb-6">
            Creative Developer & Producer
          </p>
          <h1 className="text-[clamp(3rem,10vw,8rem)] font-bold leading-[0.9] tracking-tight mb-8" style={{ perspective: "600px" }}>
            {Array.from("HAMILTON").map((char, i) => (
              <span key={i} className="hero-char inline-block" style={{ display: "inline-block" }}>
                {char}
              </span>
            ))}
          </h1>
          <p className="hero-sub text-lg md:text-xl text-white/40 max-w-xl mx-auto leading-relaxed">
            Building immersive digital experiences at the intersection of code, sound, and motion.
          </p>
          <div className="hero-line w-16 h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent mx-auto mt-10 origin-center" />
          <div className="mt-12 flex items-center gap-2 text-white/20 text-xs font-mono animate-pulse">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            SCROLL
          </div>
        </div>
      </section>

      {/* ============================================
          WORK SECTION — horizontal scroll pinned
          ============================================ */}
      <section className="section-work relative" style={{ minHeight: "100vh" }}>
        <div className="work-track flex items-center gap-0 h-screen" style={{ width: "fit-content", paddingLeft: "100vw", paddingRight: "40vw" }}>
          {/* Intro slide */}
          <div className="flex-shrink-0 w-screen h-screen flex items-center px-16">
            <div>
              <p className="text-xs font-mono tracking-[0.4em] text-[#00D4FF]/70 mb-4 uppercase">Selected Work</p>
              <h2 className="text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.05] max-w-2xl">
                Projects that<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#7C3AED]">push boundaries</span>
              </h2>
            </div>
          </div>

          {/* Project cards */}
          {PROJECTS.map((proj, i) => (
            <div
              key={i}
              className="project-card flex-shrink-0 w-[420px] h-[520px] mx-10 relative group cursor-pointer"
            >
              <div className="absolute inset-0 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md overflow-hidden transition-all duration-500 group-hover:border-[#00D4FF]/30 group-hover:bg-white/[0.04]">
                {/* Number */}
                <div className="absolute top-6 left-6">
                  <span className="text-6xl font-bold text-white/[0.04] group-hover:text-[#00D4FF]/10 transition-colors duration-500 font-mono">{proj.num}</span>
                </div>
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="text-xs font-mono tracking-[0.3em] text-[#00D4FF]/60 mb-3 uppercase">{proj.type}</p>
                  <h3 className="text-3xl font-bold mb-3 group-hover:text-[#00D4FF] transition-colors duration-300">{proj.title}</h3>
                  <p className="text-sm text-white/30 leading-relaxed group-hover:text-white/50 transition-colors duration-300">{proj.description}</p>
                  {/* Hover arrow */}
                  <div className="mt-6 flex items-center gap-2 text-[#00D4FF]/0 group-hover:text-[#00D4FF]/80 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
                    <span className="text-xs font-mono tracking-wider">VIEW PROJECT</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00D4FF]/0 to-transparent group-hover:via-[#00D4FF]/40 transition-all duration-500" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================
          ABOUT SECTION
          ============================================ */}
      <section className="section-about relative min-h-screen flex items-center py-32">
        <div className="max-w-5xl mx-auto px-8 md:px-16 grid md:grid-cols-2 gap-16 items-start">
          <div>
            <p className="about-line text-xs font-mono tracking-[0.4em] text-[#00D4FF]/70 mb-6 uppercase">About</p>
            <h2 className="about-line text-[clamp(2rem,4vw,3.5rem)] font-bold leading-[1.1] mb-8">
              Multi-disciplinary<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#7C3AED]">creator</span>
            </h2>
            <p className="about-line text-white/40 leading-relaxed mb-4">
              I build things at the intersection of technology and art. From full-stack applications to music production, from motion graphics to brand systems — I believe the best work happens when disciplines collide.
            </p>
            <p className="about-line text-white/30 leading-relaxed">
              Every project is an opportunity to push the boundaries of what&apos;s possible and create experiences that resonate.
            </p>
          </div>
          <div className="skills-grid grid grid-cols-2 gap-4 pt-4">
            {SKILLS.map((skill, i) => (
              <div
                key={i}
                className="skill-item px-4 py-3 rounded-lg border border-white/[0.05] bg-white/[0.02] text-sm text-white/50 hover:text-[#00D4FF] hover:border-[#00D4FF]/20 transition-all duration-300 cursor-default"
              >
                {skill}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================
          CONTACT SECTION
          ============================================ */}
      <section className="section-contact relative min-h-screen flex items-center justify-center py-32">
        <div className="text-center px-6 max-w-2xl">
          <p className="text-xs font-mono tracking-[0.4em] text-[#00D4FF]/70 mb-6 uppercase">Get in Touch</p>
          <h2 className="contact-heading text-[clamp(2.5rem,6vw,5rem)] font-bold leading-[1.05] mb-8">
            Let&apos;s build<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D4FF] to-[#7C3AED]">something great</span>
          </h2>
          <div className="contact-body space-y-6">
            <p className="text-white/40 leading-relaxed">
              Available for freelance projects, collaborations, and creative partnerships. Let&apos;s make something unforgettable.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
              <a
                href="mailto:hello@hamilton.dev"
                className="px-8 py-3 rounded-full border border-[#00D4FF]/30 text-[#00D4FF] text-sm font-mono tracking-wider hover:bg-[#00D4FF]/10 hover:border-[#00D4FF]/60 transition-all duration-300"
              >
                EMAIL ME
              </a>
              <a
                href="#"
                className="px-8 py-3 rounded-full border border-white/10 text-white/50 text-sm font-mono tracking-wider hover:border-white/30 hover:text-white/80 transition-all duration-300"
              >
                RESUME
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-white/[0.04]">
        <p className="text-xs text-white/20 font-mono tracking-wider">
          &copy; {new Date().getFullYear()} HAMILTON &mdash; All Rights Reserved
        </p>
      </footer>
    </div>
  );
}
