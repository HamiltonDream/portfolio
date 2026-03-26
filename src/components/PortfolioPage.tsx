"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import Navigation from "@/components/layout/Navigation";
import CustomCursor from "@/components/ui/CustomCursor";
import Magnetic from "@/components/ui/Magnetic";
import TextLoop from "@/components/ui/TextLoop";
import EncryptedText from "@/components/ui/EncryptedText";
import { PROJECTS, SKILLS, ROLES } from "@/lib/constants";

const SceneCanvas = dynamic(() => import("@/components/three/SceneCanvas"), {
  ssr: false,
  loading: () => null,
});

/* ================================================================
   SECTION — Hero
   ================================================================ */
function HeroSection() {
  const roleTexts = ROLES.map((r) => r);

  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-end pb-20 px-10 md:px-16"
    >
      <div className="max-w-2xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-dim text-xs uppercase tracking-[0.25em] mb-4"
        >
          Noah Hamilton
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="font-[var(--font-cormorant)] text-[clamp(2.5rem,8vw,7rem)] font-light leading-[0.9] text-text mb-6"
        >
          Creative
          <br />
          Developer
        </motion.h1>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="flex items-center gap-3"
        >
          <span className="w-8 h-px bg-accent" />
          <TextLoop
            texts={[...roleTexts]}
            interval={3000}
            className="text-dim text-sm tracking-wide"
          />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-dim text-[10px] uppercase tracking-[0.3em]">
          Scroll
        </span>
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-6 bg-accent/40"
        />
      </motion.div>
    </section>
  );
}

/* ================================================================
   SECTION — Work
   ================================================================ */
function WorkSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      id="work"
      ref={sectionRef}
      className="relative py-32 px-10 md:px-16"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1 }}
      >
        <p className="text-dim text-xs uppercase tracking-[0.25em] mb-2">
          Selected Work
        </p>
        <h2 className="font-[var(--font-cormorant)] text-[clamp(2rem,5vw,4rem)] font-light text-text mb-16">
          Projects
        </h2>
      </motion.div>

      <div className="space-y-0">
        {PROJECTS.map((project, i) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.8,
              delay: i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <Magnetic strength={0.05}>
              <div className="group cursor-interact relative border-t border-dim/20 py-8 flex items-center justify-between transition-colors duration-500 hover:border-accent/30">
                <div className="flex items-center gap-6 md:gap-10">
                  <span className="text-dim/40 text-xs font-mono">
                    {project.num}
                  </span>
                  <div>
                    <h3 className="text-text text-xl md:text-2xl font-light tracking-tight group-hover:text-accent transition-colors duration-500">
                      <EncryptedText text={project.title} speed={25} />
                    </h3>
                    <p className="text-dim text-xs mt-1 tracking-wide">
                      {project.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-dim/40 text-xs uppercase tracking-wider hidden md:block">
                    {project.category}
                  </span>
                  <motion.span
                    className="w-6 h-6 rounded-full border border-dim/30 flex items-center justify-center group-hover:border-accent/50 group-hover:bg-accent/10 transition-all duration-500"
                    whileHover={{ scale: 1.2 }}
                  >
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 8 8"
                      className="text-dim group-hover:text-accent transition-colors"
                    >
                      <path
                        d="M1 7L7 1M7 1H2M7 1V6"
                        stroke="currentColor"
                        strokeWidth="0.8"
                        fill="none"
                      />
                    </svg>
                  </motion.span>
                </div>
              </div>
            </Magnetic>
          </motion.div>
        ))}
        <div className="border-t border-dim/20" />
      </div>
    </section>
  );
}

/* ================================================================
   SECTION — About
   ================================================================ */
function AboutSection() {
  return (
    <section
      id="about"
      className="relative py-32 px-10 md:px-16"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1 }}
      >
        <p className="text-dim text-xs uppercase tracking-[0.25em] mb-2">
          About
        </p>
        <h2 className="font-[var(--font-cormorant)] text-[clamp(2rem,5vw,4rem)] font-light text-text mb-12">
          The Artist
        </h2>
      </motion.div>

      <div className="max-w-xl space-y-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-dim text-sm leading-relaxed"
        >
          I&apos;m a multidisciplinary creator who blurs the line between
          code and art. I build software, produce music as{" "}
          <span className="text-accent">HamiltonDream</span>, craft visual
          stories through editing and animation, and design brands that
          resonate.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="text-dim text-sm leading-relaxed"
        >
          Every project is an opportunity to merge technical precision with
          creative expression — building experiences that feel alive.
        </motion.p>
      </div>

      {/* Skills grid */}
      <div className="mt-16 flex flex-wrap gap-3">
        {SKILLS.map((skill, i) => (
          <motion.div
            key={skill}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
          >
            <Magnetic strength={0.15}>
              <span className="cursor-interact inline-block px-4 py-2 text-xs text-dim border border-dim/15 rounded-full hover:border-accent/40 hover:text-accent transition-all duration-500">
                {skill}
              </span>
            </Magnetic>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ================================================================
   SECTION — Contact
   ================================================================ */
function ContactSection() {
  return (
    <section
      id="contact"
      className="relative py-32 px-10 md:px-16 min-h-[60vh] flex flex-col justify-center"
    >
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 1 }}
      >
        <p className="text-dim text-xs uppercase tracking-[0.25em] mb-2">
          Get in Touch
        </p>
        <h2 className="font-[var(--font-cormorant)] text-[clamp(2rem,5vw,4rem)] font-light text-text mb-8">
          Let&apos;s Create
        </h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Magnetic strength={0.1}>
          <a
            href="mailto:hello@hamilton.dev"
            className="group cursor-interact inline-flex items-center gap-4 text-text text-lg md:text-xl tracking-tight hover:text-accent transition-colors duration-500"
          >
            <span className="w-10 h-10 rounded-full border border-dim/30 flex items-center justify-center group-hover:border-accent group-hover:bg-accent/10 transition-all duration-500">
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                className="text-dim group-hover:text-accent transition-colors"
              >
                <path
                  d="M1 11L11 1M11 1H4M11 1V8"
                  stroke="currentColor"
                  strokeWidth="1"
                  fill="none"
                />
              </svg>
            </span>
            <EncryptedText text="hello@hamilton.dev" speed={20} />
          </a>
        </Magnetic>
      </motion.div>

      {/* Footer */}
      <div className="mt-auto pt-20 flex items-center justify-between text-dim/30 text-[10px] uppercase tracking-[0.3em]">
        <span>&copy; {new Date().getFullYear()} Hamilton</span>
        <span>Built with obsession</span>
      </div>
    </section>
  );
}

/* ================================================================
   MAIN PORTFOLIO COMPONENT — Exported as default
   ================================================================ */
export default function PortfolioPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <CustomCursor />
      <Navigation />

      {/* Fixed 3D Canvas background — takes right portion on desktop */}
      <div className="fixed inset-0 z-0">
        <SceneCanvas />
      </div>

      {/* Scrollable content — left side with glass effect */}
      <div
        ref={containerRef}
        className="relative z-10 min-h-screen overflow-y-auto"
        style={{ scrollBehavior: "smooth" }}
      >
        <div className="md:max-w-[55vw]">
          <HeroSection />
          <WorkSection />
          <AboutSection />
          <ContactSection />
        </div>
      </div>

      {/* Film grain */}
      <div
        className="fixed inset-0 z-[9000] pointer-events-none"
        style={{
          opacity: 0.02,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          animation: "grainShift 0.3s steps(1) infinite",
        }}
      />
    </>
  );
}
