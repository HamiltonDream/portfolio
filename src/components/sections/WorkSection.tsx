"use client";

import { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PROJECTS } from "@/lib/constants";

gsap.registerPlugin(ScrollTrigger);

export default function WorkSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(sectionRef, { amount: 0.1 });

  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track) return;

    const totalScroll = track.scrollWidth - window.innerWidth;

    const tween = gsap.to(track, {
      x: -totalScroll,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => `+=${totalScroll}`,
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} id="work" className="relative">
      <div className="h-screen flex flex-col justify-center overflow-hidden">
        {/* Section Header */}
        <div className="px-12 mb-8">
          <motion.span
            className="font-[family-name:var(--font-cormorant)] text-[6rem] font-light text-[#eae8e3] opacity-[0.04] leading-none block"
            initial={{ opacity: 0 }}
            animate={headerInView ? { opacity: 0.04 } : {}}
            transition={{ duration: 1 }}
          >
            01
          </motion.span>
          <motion.h2
            className="font-[family-name:var(--font-cormorant)] text-[clamp(2rem,5vw,4rem)] font-light tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Selected Works
          </motion.h2>
        </div>

        {/* Horizontal Track */}
        <div ref={trackRef} className="flex gap-8 pl-12 will-change-transform">
          {PROJECTS.map((project, i) => (
            <motion.article
              key={project.id}
              className="flex-shrink-0 w-[55vw] max-w-[700px] group cursor-pointer"
              initial={{ opacity: 0, y: 60 }}
              animate={headerInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ perspective: "1200px" }}
            >
              <ThreeDCard hue={project.hue}>
                <div
                  className="relative aspect-[4/3] rounded-xl overflow-hidden mb-4"
                  style={{
                    background: `linear-gradient(135deg, hsl(${project.hue}, 40%, 8%) 0%, hsl(${project.hue}, 60%, 3%) 100%)`,
                  }}
                >
                  {/* Ghost Number */}
                  <span className="absolute top-4 right-6 font-[family-name:var(--font-cormorant)] text-[6rem] font-light text-white/[0.04] leading-none select-none">
                    {project.num}
                  </span>
                  {/* Category Tag */}
                  <span className="absolute bottom-4 left-6 text-[0.65rem] uppercase tracking-[0.15em] text-white/40 border border-white/10 px-3 py-1 rounded-full">
                    {project.category}
                  </span>
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: `radial-gradient(circle at 50% 50%, hsla(${project.hue}, 60%, 50%, 0.08) 0%, transparent 70%)`,
                    }}
                  />
                </div>
                <h3 className="font-[family-name:var(--font-cormorant)] text-xl font-light mb-1 group-hover:text-[#c9a84c] transition-colors duration-300">
                  {project.title}
                </h3>
                <p className="text-sm text-[#5a584f]">{project.description}</p>
              </ThreeDCard>
            </motion.article>
          ))}
          {/* Spacer for scroll end */}
          <div className="flex-shrink-0 w-[10vw]" />
        </div>
      </div>
    </section>
  );
}

// Inline 3D Card tilt component
function ThreeDCard({ children, hue }: { children: React.ReactNode; hue: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -15;
    const rotateY = (x - 0.5) * 15;
    el.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="transition-transform duration-300 ease-out will-change-transform"
      style={{
        transformStyle: "preserve-3d",
      }}
    >
      {children}
    </div>
  );
}
