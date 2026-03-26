"use client";

import { useEffect, useRef } from "react";

export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const isHovering = useRef(false);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      target.current.x = e.clientX;
      target.current.y = e.clientY;
    }

    function onEnterInteractive() {
      isHovering.current = true;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(-50%, -50%) scale(2.5)`;
        ringRef.current.style.borderColor = "rgba(201, 168, 76, 0.6)";
        ringRef.current.style.mixBlendMode = "difference";
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(-50%, -50%) scale(0)`;
      }
    }

    function onLeaveInteractive() {
      isHovering.current = false;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(-50%, -50%) scale(1)`;
        ringRef.current.style.borderColor = "rgba(201, 168, 76, 0.3)";
        ringRef.current.style.mixBlendMode = "normal";
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(-50%, -50%) scale(1)`;
      }
    }

    window.addEventListener("mousemove", onMove);

    // Add hover listeners to all interactive elements
    const interactiveSelector = "a, button, [data-magnetic], .cursor-interact";
    const observer = new MutationObserver(() => {
      document.querySelectorAll(interactiveSelector).forEach((el) => {
        el.addEventListener("mouseenter", onEnterInteractive);
        el.addEventListener("mouseleave", onLeaveInteractive);
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Initial binding
    document.querySelectorAll(interactiveSelector).forEach((el) => {
      el.addEventListener("mouseenter", onEnterInteractive);
      el.addEventListener("mouseleave", onLeaveInteractive);
    });

    // Animation loop
    let frameId: number;
    function animate() {
      pos.current.x += (target.current.x - pos.current.x) * 0.15;
      pos.current.y += (target.current.y - pos.current.y) * 0.15;

      if (dotRef.current) {
        dotRef.current.style.left = `${target.current.x}px`;
        dotRef.current.style.top = `${target.current.y}px`;
      }
      if (ringRef.current) {
        ringRef.current.style.left = `${pos.current.x}px`;
        ringRef.current.style.top = `${pos.current.y}px`;
      }

      frameId = requestAnimationFrame(animate);
    }
    frameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <>
      {/* Inner dot */}
      <div
        ref={dotRef}
        className="fixed pointer-events-none z-[99999]"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: "#c9a84c",
          transform: "translate(-50%, -50%)",
          transition: "transform 0.2s ease",
        }}
      />
      {/* Outer ring */}
      <div
        ref={ringRef}
        className="fixed pointer-events-none z-[99998]"
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1px solid rgba(201, 168, 76, 0.3)",
          transform: "translate(-50%, -50%)",
          transition: "transform 0.3s ease, border-color 0.3s ease, mix-blend-mode 0.3s ease",
        }}
      />
    </>
  );
}
