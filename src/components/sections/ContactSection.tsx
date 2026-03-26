"use client";

import { useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import Magnetic from "@/components/ui/Magnetic";
import EncryptedText from "@/components/ui/EncryptedText";

export default function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.3 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Vortex particle background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; angle: number; radius: number; speed: number; size: number; opacity: number }[] = [];
    const PARTICLE_COUNT = 500;
    const center = { x: 0, y: 0 };

    function resize() {
      canvas!.width = canvas!.clientWidth * window.devicePixelRatio;
      canvas!.height = canvas!.clientHeight * window.devicePixelRatio;
      center.x = canvas!.width / 2;
      center.y = canvas!.height / 2;
    }
    resize();
    window.addEventListener("resize", resize);

    // Initialize particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: 0,
        y: 0,
        angle: Math.random() * Math.PI * 2,
        radius: 50 + Math.random() * Math.max(canvas.width, canvas.height) * 0.5,
        speed: 0.001 + Math.random() * 0.003,
        size: 0.5 + Math.random() * 1.5,
        opacity: 0.1 + Math.random() * 0.4,
      });
    }

    function draw() {
      ctx!.clearRect(0, 0, canvas!.width, canvas!.height);

      for (const p of particles) {
        p.angle += p.speed;
        p.radius -= 0.1;
        if (p.radius < 5) {
          p.radius = 50 + Math.random() * Math.max(canvas!.width, canvas!.height) * 0.5;
          p.angle = Math.random() * Math.PI * 2;
        }

        p.x = center.x + Math.cos(p.angle) * p.radius;
        p.y = center.y + Math.sin(p.angle) * p.radius;

        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * window.devicePixelRatio, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(201, 168, 76, ${p.opacity})`;
        ctx!.fill();
      }

      animId = requestAnimationFrame(draw);
    }

    animId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section ref={sectionRef} id="contact" className="relative min-h-screen">
      <div className="h-screen flex items-center justify-center overflow-hidden relative">
        {/* Vortex Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
        />

        {/* Content */}
        <div className="relative z-10 text-center max-w-xl mx-auto px-8">
          <motion.span
            className="font-[family-name:var(--font-cormorant)] text-[6rem] font-light text-[#eae8e3] opacity-[0.04] leading-none block"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.04 } : {}}
            transition={{ duration: 1 }}
          >
            03
          </motion.span>

          <motion.h2
            className="font-[family-name:var(--font-cormorant)] text-[clamp(2.5rem,6vw,5rem)] font-light leading-tight mb-6"
            style={{ textShadow: "0 2px 60px rgba(201,168,76,0.08)" }}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Let&apos;s Create<br />Something New
          </motion.h2>

          <motion.p
            className="text-[#5a584f] text-lg font-light mb-12"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Got a project, a vision, or a wild idea?
          </motion.p>

          {/* Magnetic CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Magnetic strength={0.3}>
              <a
                href="mailto:hello@hamilton.dev"
                className="relative inline-flex items-center justify-center w-40 h-40 rounded-full border border-[#c9a84c]/30 text-[#c9a84c] text-sm uppercase tracking-[0.2em] font-light hover:bg-[#c9a84c]/5 transition-all duration-500 group"
              >
                <span className="relative z-10">Get in Touch</span>
                {/* Rotating ring */}
                <svg
                  className="absolute inset-0 w-full h-full animate-[spin_12s_linear_infinite]"
                  viewBox="0 0 160 160"
                >
                  <circle
                    cx="80"
                    cy="80"
                    r="78"
                    fill="none"
                    stroke="rgba(201,168,76,0.2)"
                    strokeWidth="1"
                    strokeDasharray="4 8"
                    className="group-hover:stroke-[rgba(201,168,76,0.5)] transition-all duration-500"
                  />
                </svg>
                {/* Pulse ring on hover */}
                <span className="absolute inset-0 rounded-full border border-[#c9a84c]/0 group-hover:border-[#c9a84c]/20 group-hover:scale-110 transition-all duration-700" />
              </a>
            </Magnetic>
          </motion.div>

          {/* Social Links */}
          <motion.div
            className="flex justify-center gap-8 mt-16"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {["GitHub", "Twitter", "LinkedIn", "SoundCloud"].map((label) => (
              <Magnetic key={label} strength={0.2}>
                <a
                  href="#"
                  className="text-xs uppercase tracking-[0.1em] text-[#5a584f] hover:text-[#c9a84c] transition-colors duration-300"
                >
                  <EncryptedText text={label} speed={30} />
                </a>
              </Magnetic>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
