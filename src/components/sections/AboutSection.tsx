"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Magnetic from "@/components/ui/Magnetic";
import { SKILLS } from "@/lib/constants";

gsap.registerPlugin(ScrollTrigger);

export default function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bioRef = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.15 });

  const bioText = "I build software, produce music as HamiltonDream, edit films, and animate worlds. I don't pick one lane — I create across every medium. Code is my instrument, pixels are my canvas, sound is my space. Every project is a new dimension.";
  const words = bioText.split(" ");

  // ScrollReveal — progressive word unblur
  useEffect(() => {
    const bio = bioRef.current;
    const section = sectionRef.current;
    if (!bio || !section) return;

    const spans = bio.querySelectorAll<HTMLSpanElement>(".bio-word");

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 60%",
        end: "center center",
        scrub: 1,
      },
    });

    spans.forEach((span, i) => {
      tl.to(
        span,
        {
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          duration: 0.3,
        },
        i * 0.02
      );
    });

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, []);

  return (
    <section ref={sectionRef} id="about" className="relative min-h-[200vh]">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="max-w-3xl mx-auto px-8 text-center">
          {/* Section Number */}
          <motion.span
            className="font-[family-name:var(--font-cormorant)] text-[6rem] font-light text-[#eae8e3] opacity-[0.04] leading-none block"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.04 } : {}}
            transition={{ duration: 1 }}
          >
            02
          </motion.span>

          {/* Title */}
          <motion.h2
            className="font-[family-name:var(--font-cormorant)] text-[clamp(2rem,5vw,4rem)] font-light tracking-tight mb-12"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            About
          </motion.h2>

          {/* Bio — ScrollReveal unblur */}
          <p
            ref={bioRef}
            className="text-[clamp(1rem,2vw,1.35rem)] leading-relaxed font-light mb-16 text-left"
          >
            {words.map((word, i) => (
              <span
                key={i}
                className="bio-word inline-block mr-[0.3em] opacity-[0.1]"
                style={{
                  filter: "blur(4px)",
                  transform: "translateY(5px)",
                  transition: "none",
                }}
              >
                {word}
              </span>
            ))}
          </p>

          {/* Interactive headline */}
          <VariableProximityText text="Every project is a new dimension" />

          {/* Skills Cloud */}
          <div className="flex flex-wrap justify-center gap-3 mt-12">
            {SKILLS.map((skill, i) => (
              <motion.div
                key={skill}
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.4 + i * 0.05 }}
              >
                <Magnetic strength={0.4}>
                  <span className="inline-block px-5 py-2.5 text-sm font-light text-[#eae8e3]/80 border border-[#eae8e3]/10 rounded-full backdrop-blur-sm hover:border-[#c9a84c]/40 hover:text-[#c9a84c] transition-all duration-300 cursor-default">
                    {skill}
                  </span>
                </Magnetic>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// VariableProximity — font weight changes near cursor
function VariableProximityText({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [charWeights, setCharWeights] = useState<number[]>(() =>
    new Array(text.length).fill(300)
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    function handleMouseMove(e: MouseEvent) {
      const spans = container!.querySelectorAll<HTMLSpanElement>(".prox-char");
      const newWeights: number[] = [];

      spans.forEach((span) => {
        const rect = span.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
        const maxDist = 150;
        const t = Math.max(0, 1 - dist / maxDist);
        const weight = 300 + t * 600; // 300 → 900
        newWeights.push(weight);
      });

      setCharWeights(newWeights);
    }

    function handleMouseLeave() {
      setCharWeights(new Array(text.length).fill(300));
    }

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      className="font-[family-name:var(--font-inter)] text-[clamp(1.2rem,2.5vw,1.8rem)] text-[#c9a84c] leading-relaxed cursor-default select-none"
    >
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="prox-char inline-block transition-all duration-100"
          style={{ fontWeight: charWeights[i] }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </div>
  );
}
