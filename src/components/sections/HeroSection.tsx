"use client";

import { useRef, useMemo } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import TextLoop from "@/components/ui/TextLoop";
import { ROLES } from "@/lib/constants";

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.1 });
  const chars = useMemo(() => "Hamilton".split(""), []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  // Continuous scroll-driven transforms — every scroll pixel matters
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);
  const titleScale = useTransform(scrollYProgress, [0, 0.5, 1], [1, 1.15, 0.8]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1, 0]);
  const tagY = useTransform(scrollYProgress, [0, 1], ["0%", "-120%"]);
  const tagOpacity = useTransform(scrollYProgress, [0, 0.4, 0.7], [1, 1, 0]);
  const subY = useTransform(scrollYProgress, [0, 1], ["0%", "80%"]);
  const subOpacity = useTransform(scrollYProgress, [0, 0.5, 0.8], [1, 0.6, 0]);
  const lampScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.5]);
  const lampOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const bgRotate = useTransform(scrollYProgress, [0, 1], [0, 40]);
  const scrollHintOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-[150vh]"
    >
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        {/* Aurora-like gradient background */}
        <motion.div className="absolute inset-0 z-0" style={{ opacity: lampOpacity }}>
          <div className="absolute inset-0 bg-[#050507]" />
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] opacity-30"
            style={{ rotate: bgRotate }}
          >
            <div
              className="absolute inset-0"
              style={{
                background: "conic-gradient(from 0deg, transparent, rgba(201,168,76,0.06), transparent, rgba(90,88,79,0.04), transparent)",
              }}
            />
          </motion.div>
          {/* Lamp-style light cone */}
          <motion.div
            className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[300px] h-[600px] origin-top"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{
              background: "linear-gradient(180deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.02) 60%, transparent 100%)",
              clipPath: "polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)",
              filter: "blur(40px)",
              scale: lampScale,
            }}
          />
          <motion.div
            className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[800px] origin-top"
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isInView ? { scaleX: 1, opacity: 0.6 } : {}}
            transition={{ duration: 2.2, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
            style={{
              background: "linear-gradient(180deg, rgba(201,168,76,0.08) 0%, transparent 70%)",
              clipPath: "polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)",
              filter: "blur(60px)",
              scale: lampScale,
            }}
          />
        </motion.div>

        {/* Content */}
        <div className="relative z-10 text-center">
          {/* Tag */}
          <motion.p
            className="text-[0.68rem] uppercase tracking-[0.4em] font-medium text-[#5a584f] mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.6 }}
            style={{ y: tagY, opacity: tagOpacity }}
          >
            Developer &bull; Artist &bull; Creator
          </motion.p>

          {/* Title — staggered char reveal + scroll parallax */}
          <motion.h1
            className="font-[family-name:var(--font-cormorant)] text-[clamp(4.5rem,16vw,14rem)] font-light leading-[0.92] tracking-[-0.035em] mb-6"
            style={{
              textShadow: "0 0 80px rgba(201,168,76,0.04)",
              y: titleY,
              scale: titleScale,
              opacity: titleOpacity,
            }}
          >
            {chars.map((char, i) => (
              <motion.span
                key={i}
                className="inline-block cursor-default hover:text-[#c9a84c] transition-colors duration-200"
                initial={{ opacity: 0, y: 80, rotateX: 40 }}
                animate={isInView ? { opacity: 1, y: 0, rotateX: 0 } : {}}
                transition={{
                  duration: 0.8,
                  delay: 0.8 + i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="text-[clamp(0.82rem,1.4vw,1rem)] font-light text-[#5a584f] mb-8"
            initial={{ opacity: 0, y: 15 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 1.4 }}
            style={{ y: subY, opacity: subOpacity }}
          >
            Software &middot; Music &middot; Motion &middot; Design
          </motion.p>

          {/* Role Cycling */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 1.8 }}
            className="text-sm font-light text-[#c9a84c] tracking-widest uppercase"
            style={{ opacity: subOpacity }}
          >
            <TextLoop texts={[...ROLES]} interval={3000} />
          </motion.div>
        </div>

        {/* Scroll Hint */}
        <motion.div
          className="absolute bottom-12 flex flex-col items-center gap-3 text-[#5a584f]"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 2.2 }}
          style={{ opacity: scrollHintOpacity }}
        >
          <div className="w-px h-12 bg-gradient-to-b from-[#c9a84c] to-transparent animate-pulse" />
          <span className="text-[0.6rem] uppercase tracking-[0.3em]">Scroll</span>
        </motion.div>
      </div>
    </section>
  );
}
