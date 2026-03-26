"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, MeshReflectorMaterial, RoundedBox, Float } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

/* ================================================================
   PALETTE
   ================================================================ */
const BG = "#050508";
const ACCENT = "#00D4FF";
const VIOLET = "#7C3AED";
const TEXT = "#F0F0F8";
const DIM = "#6B7280";
const MUTED = "#374151";
const GLASS = "#1a1a2e";
const FLOOR = "#08081a";

/* ================================================================
   SECTION POSITIONS (Z-axis journey)
   ================================================================ */
const SECTIONS = {
  hero: { z: 8, scrollCenter: 0.05 },
  threshold1: { z: 2 },
  work: { z: -6, scrollCenter: 0.35 },
  threshold2: { z: -14 },
  about: { z: -23, scrollCenter: 0.6 },
  threshold3: { z: -30 },
  contact: { z: -37, scrollCenter: 0.9 },
};

/* Camera path keyframes: [scrollProgress, [x, y, z], [lookX, lookY, lookZ]] */
const CAMERA_PATH: [number, [number, number, number], [number, number, number]][] = [
  [0.0, [0, 1.8, 16], [0, 1.2, 0]],
  [0.12, [0, 1.8, 8], [0, 1.5, -2]],
  [0.2, [0, 1.8, 3], [0, 1.5, -5]],
  [0.3, [0, 1.8, -2], [0, 1.5, -8]],
  [0.45, [0, 1.8, -8], [0, 1.5, -14]],
  [0.55, [0, 1.8, -14], [0, 1.5, -20]],
  [0.65, [0, 1.8, -20], [0, 1.5, -26]],
  [0.8, [0, 1.8, -28], [0, 1.5, -34]],
  [0.9, [0, 1.8, -33], [0, 1.5, -39]],
  [1.0, [0, 1.8, -37], [0, 1.5, -42]],
];

/* ================================================================
   SCROLL STATE (custom scroll, no drei ScrollControls)
   ================================================================ */
function useCustomScroll() {
  const scrollRef = useRef({ progress: 0, velocity: 0, target: 0 });

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    scrollRef.current.target = Math.max(
      0,
      Math.min(1, scrollRef.current.target + e.deltaY * 0.0003)
    );
  }, []);

  // We'll attach this in the component
  return { scrollRef, onWheel };
}

/* ================================================================
   INTERPOLATION HELPERS
   ================================================================ */
function lerpPath(
  progress: number,
  path: typeof CAMERA_PATH
): { pos: THREE.Vector3; lookAt: THREE.Vector3 } {
  // Clamp progress
  const p = Math.max(0, Math.min(1, progress));

  // Find the two keyframes we're between
  let i = 0;
  for (let j = 0; j < path.length - 1; j++) {
    if (p >= path[j][0] && p <= path[j + 1][0]) {
      i = j;
      break;
    }
    if (j === path.length - 2) i = j;
  }

  const [t0, pos0, look0] = path[i];
  const [t1, pos1, look1] = path[Math.min(i + 1, path.length - 1)];
  const range = t1 - t0 || 1;
  const t = Math.max(0, Math.min(1, (p - t0) / range));

  // Smooth step for more cinematic feel
  const ease = t * t * (3 - 2 * t);

  return {
    pos: new THREE.Vector3(
      THREE.MathUtils.lerp(pos0[0], pos1[0], ease),
      THREE.MathUtils.lerp(pos0[1], pos1[1], ease),
      THREE.MathUtils.lerp(pos0[2], pos1[2], ease)
    ),
    lookAt: new THREE.Vector3(
      THREE.MathUtils.lerp(look0[0], look1[0], ease),
      THREE.MathUtils.lerp(look0[1], look1[1], ease),
      THREE.MathUtils.lerp(look0[2], look1[2], ease)
    ),
  };
}

function sectionOpacity(scrollProgress: number, sectionCenter: number, width = 0.12): number {
  const dist = Math.abs(scrollProgress - sectionCenter);
  if (dist > width) return 0;
  return Math.exp(-Math.pow(dist / (width * 0.5), 2));
}

/* ================================================================
   GLASS MONOLITH — Hero centerpiece
   ================================================================ */
function GlassMonolith() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const mouseRef = useRef({ x: 0, y: 0 });
  const targetRotRef = useRef({ x: 0, y: 0 });

  useFrame(({ pointer }) => {
    if (!meshRef.current) return;

    // Smooth mouse tracking
    mouseRef.current.x = THREE.MathUtils.lerp(mouseRef.current.x, pointer.x, 0.03);
    mouseRef.current.y = THREE.MathUtils.lerp(mouseRef.current.y, pointer.y, 0.03);

    // Idle rotation + mouse influence
    targetRotRef.current.y += 0.003;
    meshRef.current.rotation.y = targetRotRef.current.y + mouseRef.current.x * 0.15;
    meshRef.current.rotation.x = mouseRef.current.y * 0.08;
  });

  return (
    <group position={[0, 1.6, SECTIONS.hero.z]}>
      <RoundedBox
        ref={meshRef}
        args={[1.6, 2.4, 1.6]}
        radius={0.15}
        smoothness={8}
      >
        <meshPhysicalMaterial
          color={GLASS}
          metalness={0.1}
          roughness={0.05}
          transmission={0.92}
          ior={1.5}
          thickness={1.5}
          envMapIntensity={1.0}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          transparent
        />
      </RoundedBox>
      {/* Inner glow light */}
      <pointLight color={ACCENT} intensity={3} distance={4} decay={2} />
      {/* Subtle violet secondary */}
      <pointLight
        color={VIOLET}
        intensity={1}
        distance={3}
        decay={2}
        position={[0.5, -0.5, 0.5]}
      />
    </group>
  );
}

/* ================================================================
   THRESHOLD FRAME — Section divider
   ================================================================ */
function ThresholdFrame({
  position,
  width = 8,
  height = 4.5,
}: {
  position: [number, number, number];
  width?: number;
  height?: number;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const emissiveRef = useRef(0.15);
  const barThickness = 0.04;
  const barDepth = 0.02;

  // Bars: top, bottom, left, right
  const bars = useMemo(
    () => [
      { pos: [0, height / 2, 0] as const, scale: [width, barThickness, barDepth] as const },
      { pos: [0, -height / 2, 0] as const, scale: [width, barThickness, barDepth] as const },
      { pos: [-width / 2, 0, 0] as const, scale: [barThickness, height, barDepth] as const },
      { pos: [width / 2, 0, 0] as const, scale: [barThickness, height, barDepth] as const },
    ],
    [width, height]
  );

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    const dist = Math.abs(camera.position.z - position[2]);
    const proximity = Math.max(0, 1 - dist / 8);
    emissiveRef.current = THREE.MathUtils.lerp(emissiveRef.current, 0.15 + proximity * 1.5, 0.04);

    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshPhysicalMaterial).emissiveIntensity = emissiveRef.current;
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {bars.map((bar, i) => (
        <mesh key={i} position={[bar.pos[0], bar.pos[1], bar.pos[2]]}>
          <boxGeometry args={[bar.scale[0], bar.scale[1], bar.scale[2]]} />
          <meshPhysicalMaterial
            color={GLASS}
            metalness={0.95}
            roughness={0.1}
            emissive={ACCENT}
            emissiveIntensity={0.15}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ================================================================
   FROSTED GLASS PANEL — Work section project display
   ================================================================ */
const PROJECTS = [
  {
    num: "01",
    title: "HamiltonDream",
    type: "Music · Production · Sound Design",
    cat: "Music",
  },
  {
    num: "02",
    title: "SaaS Platform",
    type: "React · Full Stack · Cloud",
    cat: "Software",
  },
  {
    num: "03",
    title: "Motion Reel",
    type: "After Effects · Motion Design",
    cat: "Motion",
  },
  {
    num: "04",
    title: "Mobile Suite",
    type: "iOS · React Native · UX",
    cat: "Apps",
  },
  {
    num: "05",
    title: "Brand Worlds",
    type: "Figma · Brand · Typography",
    cat: "Design",
  },
];

const PANEL_POSITIONS: [number, number, number][] = [
  [-2.5, 2.0, -3],
  [2.0, 1.5, -6],
  [-1.5, 1.8, -9],
  [2.5, 2.2, -12],
  [-2.0, 1.6, -15],
];

const PANEL_ROTATIONS: [number, number, number][] = [
  [0, 0.08, 0],
  [0, -0.06, 0],
  [0, 0.04, 0],
  [0, -0.1, 0],
  [0, 0.06, 0],
];

function GlassPanel({
  project,
  position,
  rotation,
  scrollProgress,
}: {
  project: (typeof PROJECTS)[number];
  position: [number, number, number];
  rotation: [number, number, number];
  scrollProgress: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null!);
  const [hovered, setHovered] = useState(false);

  useFrame(({ camera }) => {
    if (!meshRef.current || !matRef.current) return;

    // Distance-based de-frost effect
    const dist = camera.position.distanceTo(meshRef.current.getWorldPosition(new THREE.Vector3()));
    const frost = THREE.MathUtils.smoothstep(dist, 4, 14);

    matRef.current.transmission = 0.15 + frost * 0.7;
    matRef.current.roughness = 0.1 + frost * 0.5;
    matRef.current.emissiveIntensity = (1 - frost) * 0.6 + (hovered ? 0.4 : 0);

    // Subtle hover scale
    const targetScale = hovered ? 1.03 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.08);
  });

  // Compute panel's own opacity based on scroll
  const panelScrollCenter = 0.25 + PANEL_POSITIONS.indexOf(position) * 0.04;

  return (
    <group position={position} rotation={rotation}>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[3, 2]} />
        <meshPhysicalMaterial
          ref={matRef}
          color="#0a0a14"
          metalness={0}
          roughness={0.3}
          transmission={0.6}
          ior={1.2}
          thickness={0.5}
          transparent
          side={THREE.DoubleSide}
          emissive={ACCENT}
          emissiveIntensity={0}
        />
      </mesh>

      {/* Thin border frame */}
      {[
        { p: [0, 1, 0] as const, s: [3.1, 0.02, 0.01] as const },
        { p: [0, -1, 0] as const, s: [3.1, 0.02, 0.01] as const },
        { p: [-1.5, 0, 0] as const, s: [0.02, 2.1, 0.01] as const },
        { p: [1.5, 0, 0] as const, s: [0.02, 2.1, 0.01] as const },
      ].map((b, i) => (
        <mesh key={i} position={[b.p[0], b.p[1], b.p[2]]}>
          <boxGeometry args={[b.s[0], b.s[1], b.s[2]]} />
          <meshPhysicalMaterial
            color={GLASS}
            metalness={0.9}
            roughness={0.1}
            emissive={ACCENT}
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}

      {/* Content overlay */}
      <Html
        transform
        occlude={false}
        position={[0, 0, 0.05]}
        style={{
          width: 280,
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-display), sans-serif",
            textAlign: "center",
            opacity: hovered ? 1 : 0.7,
            transition: "opacity 0.3s ease",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.65rem",
              color: ACCENT,
              letterSpacing: "0.15em",
              marginBottom: 8,
            }}
          >
            {project.num}
          </div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 600,
              color: TEXT,
              letterSpacing: "-0.01em",
              marginBottom: 6,
            }}
          >
            {project.title}
          </div>
          <div
            style={{
              fontFamily: "var(--font-body), sans-serif",
              fontSize: "0.7rem",
              color: DIM,
              letterSpacing: "0.05em",
            }}
          >
            {project.type}
          </div>
        </div>
      </Html>
    </group>
  );
}

/* ================================================================
   CONCENTRIC RINGS — About section
   ================================================================ */
function ConcentricRings() {
  const groupRef = useRef<THREE.Group>(null!);
  const mouseRef = useRef({ x: 0, y: 0 });

  const rings = useMemo(
    () => [
      { radius: 0.8, initRot: [0, 0, 0] as [number, number, number], speed: 0.15 },
      { radius: 0.65, initRot: [Math.PI / 4, 0, 0] as [number, number, number], speed: -0.2 },
      { radius: 0.5, initRot: [0, Math.PI / 3, 0] as [number, number, number], speed: 0.12 },
      { radius: 0.35, initRot: [Math.PI / 6, Math.PI / 4, 0] as [number, number, number], speed: -0.18 },
      { radius: 0.2, initRot: [0, 0, Math.PI / 5] as [number, number, number], speed: 0.25 },
    ],
    []
  );

  useFrame(({ clock, pointer }) => {
    if (!groupRef.current) return;

    mouseRef.current.x = THREE.MathUtils.lerp(mouseRef.current.x, pointer.x, 0.02);
    mouseRef.current.y = THREE.MathUtils.lerp(mouseRef.current.y, pointer.y, 0.02);

    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      if (i < rings.length) {
        const ring = rings[i];
        child.rotation.x = ring.initRot[0] + t * ring.speed + mouseRef.current.y * 0.1;
        child.rotation.y = ring.initRot[1] + t * ring.speed * 0.7 + mouseRef.current.x * 0.15;
        child.rotation.z = ring.initRot[2] + t * ring.speed * 0.3;
      }
    });
  });

  return (
    <group ref={groupRef} position={[3, 1.8, SECTIONS.about.z]}>
      {rings.map((ring, i) => (
        <mesh key={i}>
          <torusGeometry args={[ring.radius, 0.015, 16, 64]} />
          <meshPhysicalMaterial
            color={GLASS}
            metalness={0.95}
            roughness={0.05}
            emissive={ACCENT}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ================================================================
   PORTAL FRAME — Contact section
   ================================================================ */
function PortalFrame() {
  const groupRef = useRef<THREE.Group>(null!);
  const breathRef = useRef(0);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    breathRef.current = 0.4 + Math.sin(clock.getElapsedTime() * 0.5) * 0.15;
    groupRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh) {
        (child.material as THREE.MeshPhysicalMaterial).emissiveIntensity = breathRef.current;
      }
    });
  });

  const w = 10;
  const h = 5.6;
  const thick = 0.06;
  const depth = 0.03;

  return (
    <group ref={groupRef} position={[0, 2.2, SECTIONS.contact.z]}>
      {[
        { p: [0, h / 2, 0] as const, s: [w, thick, depth] as const },
        { p: [0, -h / 2, 0] as const, s: [w, thick, depth] as const },
        { p: [-w / 2, 0, 0] as const, s: [thick, h, depth] as const },
        { p: [w / 2, 0, 0] as const, s: [thick, h, depth] as const },
      ].map((bar, i) => (
        <mesh key={i} position={[bar.p[0], bar.p[1], bar.p[2]]}>
          <boxGeometry args={[bar.s[0], bar.s[1], bar.s[2]]} />
          <meshPhysicalMaterial
            color={GLASS}
            metalness={0.95}
            roughness={0.1}
            emissive={ACCENT}
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
      {/* Gradient plane inside portal */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[w - 0.1, h - 0.1]} />
        <meshBasicMaterial color="#0a0a2a" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

/* ================================================================
   REFLECTIVE FLOOR
   ================================================================ */
function ReflectiveFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -10]}>
      <planeGeometry args={[100, 120]} />
      <MeshReflectorMaterial
        blur={[400, 100]}
        resolution={1024}
        mixBlur={0.75}
        mixStrength={0.35}
        roughness={0.15}
        depthScale={1.2}
        minDepthThreshold={0.4}
        maxDepthThreshold={1.4}
        color={FLOOR}
        metalness={0.9}
        mirror={0.3}
      />
    </mesh>
  );
}

/* ================================================================
   SECTION HTML OVERLAYS
   ================================================================ */
function HeroOverlay({ opacity }: { opacity: number }) {
  if (opacity < 0.01) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: opacity > 0.3 ? "auto" : "none",
        opacity,
        transition: "opacity 0.1s",
        zIndex: 10,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "clamp(3rem, 12vw, 10rem)",
            fontWeight: 700,
            color: TEXT,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            margin: 0,
          }}
        >
          NOAH
        </h1>
        <h1
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "clamp(3rem, 12vw, 10rem)",
            fontWeight: 700,
            color: TEXT,
            letterSpacing: "-0.04em",
            lineHeight: 0.9,
            margin: 0,
          }}
        >
          HAMILTON
        </h1>
        <p
          style={{
            fontFamily: "var(--font-body), sans-serif",
            fontSize: "1rem",
            fontWeight: 300,
            color: DIM,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginTop: 24,
          }}
        >
          Multi-disciplinary Creator
        </p>
        <p
          style={{
            fontFamily: "var(--font-body), sans-serif",
            fontSize: "0.8rem",
            fontWeight: 400,
            color: MUTED,
            letterSpacing: "0.2em",
            marginTop: 8,
          }}
        >
          Software · Music · Design · Motion
        </p>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 48,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            width: 1,
            height: 40,
            background: `linear-gradient(to bottom, ${ACCENT}, transparent)`,
            animation: "scrollPulse 2s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "0.6rem",
            color: MUTED,
            letterSpacing: "0.3em",
          }}
        >
          SCROLL
        </span>
      </div>

      <style>{`
        @keyframes scrollPulse {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(8px); }
        }
      `}</style>
    </div>
  );
}

function WorkOverlay({ opacity }: { opacity: number }) {
  if (opacity < 0.01) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        padding: "5vh 5vw",
        pointerEvents: "none",
        opacity,
        transition: "opacity 0.1s",
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.7rem",
          color: ACCENT,
          letterSpacing: "0.15em",
          marginBottom: 8,
        }}
      >
        01
      </div>
      <h2
        style={{
          fontFamily: "var(--font-display), sans-serif",
          fontSize: "clamp(1.5rem, 4vw, 3rem)",
          fontWeight: 700,
          color: TEXT,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
        }}
      >
        SELECTED
        <br />
        WORK
      </h2>
    </div>
  );
}

function AboutOverlay({ opacity }: { opacity: number }) {
  if (opacity < 0.01) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "50%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "0 8vw",
        pointerEvents: opacity > 0.3 ? "auto" : "none",
        opacity,
        transition: "opacity 0.1s",
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.7rem",
          color: ACCENT,
          letterSpacing: "0.15em",
          marginBottom: 8,
        }}
      >
        02
      </div>
      <h2
        style={{
          fontFamily: "var(--font-display), sans-serif",
          fontSize: "clamp(1.5rem, 4vw, 3rem)",
          fontWeight: 700,
          color: TEXT,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          marginBottom: 24,
        }}
      >
        ABOUT
      </h2>
      <p
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontSize: "1rem",
          fontWeight: 400,
          color: "#9CA3AF",
          lineHeight: 1.8,
          maxWidth: 480,
          marginBottom: 16,
        }}
      >
        I&apos;m Noah Hamilton — a multi-disciplinary creator who builds at the
        intersection of code, sound, and visual design.
      </p>
      <p
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontSize: "1rem",
          fontWeight: 400,
          color: "#9CA3AF",
          lineHeight: 1.8,
          maxWidth: 480,
          marginBottom: 24,
        }}
      >
        As HamiltonDream, I produce music that blends electronic textures with
        cinematic emotion. As a developer, I build apps and web experiences that
        feel alive.
      </p>
      <div>
        <div
          style={{
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "0.75rem",
            fontWeight: 600,
            color: ACCENT,
            letterSpacing: "0.2em",
            marginBottom: 10,
          }}
        >
          SKILLS
        </div>
        <p
          style={{
            fontFamily: "var(--font-body), sans-serif",
            fontSize: "0.8rem",
            color: DIM,
          }}
        >
          Software Development · Music Production · Video Editing · Animation ·
          App Development · UI/UX Design · 3D Design · Sound Design
        </p>
      </div>
    </div>
  );
}

function ContactOverlay({ opacity }: { opacity: number }) {
  if (opacity < 0.01) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: opacity > 0.3 ? "auto" : "none",
        opacity,
        transition: "opacity 0.1s",
        zIndex: 10,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: "0.7rem",
          color: ACCENT,
          letterSpacing: "0.15em",
          marginBottom: 12,
        }}
      >
        03
      </div>
      <h2
        style={{
          fontFamily: "var(--font-display), sans-serif",
          fontSize: "clamp(2rem, 8vw, 6rem)",
          fontWeight: 700,
          color: TEXT,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        LET&apos;S CREATE
      </h2>
      <h2
        style={{
          fontFamily: "var(--font-display), sans-serif",
          fontSize: "clamp(2rem, 8vw, 6rem)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          textAlign: "center",
          marginBottom: 32,
          background: `linear-gradient(90deg, ${ACCENT}, ${VIOLET})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        SOMETHING
      </h2>
      <a
        href="mailto:noah@hamiltondream.com"
        style={{
          fontFamily: "var(--font-body), sans-serif",
          fontSize: "1rem",
          color: TEXT,
          textDecoration: "none",
          borderBottom: `1px solid ${MUTED}`,
          paddingBottom: 4,
          transition: "border-color 0.3s",
          marginBottom: 24,
        }}
        onMouseEnter={(e) => {
          (e.target as HTMLElement).style.borderColor = ACCENT;
        }}
        onMouseLeave={(e) => {
          (e.target as HTMLElement).style.borderColor = MUTED;
        }}
      >
        noah@hamiltondream.com
      </a>
      <div style={{ display: "flex", gap: 24 }}>
        {["LINKEDIN", "GITHUB", "TWITTER"].map((label) => (
          <a
            key={label}
            href="#"
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: "0.65rem",
              color: DIM,
              letterSpacing: "0.15em",
              textDecoration: "none",
              transition: "color 0.2s, transform 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.target as HTMLElement).style.color = ACCENT;
              (e.target as HTMLElement).style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              (e.target as HTMLElement).style.color = DIM;
              (e.target as HTMLElement).style.transform = "translateY(0)";
            }}
          >
            {label}
          </a>
        ))}
      </div>
    </div>
  );
}

/* ================================================================
   NAV DOTS — Right side vertical navigation
   ================================================================ */
function NavDots({ scrollProgress }: { scrollProgress: number }) {
  const sections = [
    { label: "Hero", center: 0.05 },
    { label: "Work", center: 0.35 },
    { label: "About", center: 0.6 },
    { label: "Contact", center: 0.9 },
  ];

  const activeIndex = sections.reduce((closest, sec, i) => {
    return Math.abs(scrollProgress - sec.center) <
      Math.abs(scrollProgress - sections[closest].center)
      ? i
      : closest;
  }, 0);

  return (
    <div
      style={{
        position: "fixed",
        right: 32,
        top: "50%",
        transform: "translateY(-50%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        zIndex: 20,
      }}
    >
      {sections.map((sec, i) => (
        <div
          key={sec.label}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            border: i === activeIndex ? "none" : `1px solid ${MUTED}`,
            background: i === activeIndex ? ACCENT : "transparent",
            boxShadow:
              i === activeIndex ? `0 0 8px rgba(0, 212, 255, 0.3)` : "none",
            cursor: "pointer",
            transition: "all 0.3s ease",
          }}
          title={sec.label}
        />
      ))}
    </div>
  );
}

/* ================================================================
   CAMERA CONTROLLER
   ================================================================ */
function CameraController({
  scrollRef,
}: {
  scrollRef: React.RefObject<{ progress: number; velocity: number; target: number }>;
}) {
  const { camera } = useThree();
  const posRef = useRef(new THREE.Vector3(0, 1.8, 16));
  const lookRef = useRef(new THREE.Vector3(0, 1.2, 0));
  const mouseRef = useRef({ x: 0, y: 0 });
  const chromaticRef = useRef<{ offset: THREE.Vector2 }>({ offset: new THREE.Vector2(0.002, 0.002) });

  useFrame(({ pointer }) => {
    if (!scrollRef.current) return;

    // Smooth scroll interpolation
    const scroll = scrollRef.current;
    scroll.velocity = scroll.target - scroll.progress;
    scroll.progress = THREE.MathUtils.lerp(scroll.progress, scroll.target, 0.04);

    // Camera path interpolation
    const target = lerpPath(scroll.progress, CAMERA_PATH);

    // Mouse parallax
    mouseRef.current.x = THREE.MathUtils.lerp(mouseRef.current.x, pointer.x, 0.03);
    mouseRef.current.y = THREE.MathUtils.lerp(mouseRef.current.y, pointer.y, 0.03);

    const parallaxX = mouseRef.current.x * 0.3;
    const parallaxY = mouseRef.current.y * 0.15;

    // Apply with smooth lerp
    posRef.current.lerp(
      target.pos.clone().add(new THREE.Vector3(parallaxX, parallaxY, 0)),
      0.04
    );
    lookRef.current.lerp(target.lookAt, 0.04);

    camera.position.copy(posRef.current);
    camera.lookAt(lookRef.current);
  });

  return null;
}

/* ================================================================
   MAIN SCENE EXPORT
   ================================================================ */
export function ImmersiveScene() {
  const scrollRef = useRef({ progress: 0, velocity: 0, target: 0 });
  const [sectionOpacities, setSectionOpacities] = useState({
    hero: 1,
    work: 0,
    about: 0,
    contact: 0,
  });

  // Wheel handler
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    scrollRef.current.target = Math.max(
      0,
      Math.min(1, scrollRef.current.target + e.deltaY * 0.0003)
    );
  }, []);

  // Touch handling for mobile
  const touchRef = useRef(0);
  const onTouchStart = useCallback((e: TouchEvent) => {
    touchRef.current = e.touches[0].clientY;
  }, []);
  const onTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    const delta = touchRef.current - e.touches[0].clientY;
    touchRef.current = e.touches[0].clientY;
    scrollRef.current.target = Math.max(
      0,
      Math.min(1, scrollRef.current.target + delta * 0.001)
    );
  }, []);

  // Attach scroll listener to the gl.domElement
  const { gl } = useThree();
  const attachedRef = useRef(false);

  useFrame(() => {
    // Attach listeners once
    if (!attachedRef.current && gl.domElement) {
      gl.domElement.addEventListener("wheel", onWheel, { passive: false });
      gl.domElement.addEventListener("touchstart", onTouchStart, { passive: true });
      gl.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
      attachedRef.current = true;
    }

    // Update section opacities
    const p = scrollRef.current.progress;
    setSectionOpacities({
      hero: sectionOpacity(p, SECTIONS.hero.scrollCenter, 0.15),
      work: sectionOpacity(p, SECTIONS.work.scrollCenter, 0.15),
      about: sectionOpacity(p, SECTIONS.about.scrollCenter, 0.14),
      contact: sectionOpacity(p, SECTIONS.contact.scrollCenter, 0.14),
    });
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight color="#0a0a20" intensity={0.3} />
      <directionalLight
        position={[5, 10, 5]}
        color="#E0F0FF"
        intensity={0.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-3, -2, -5]} color={VIOLET} intensity={0.12} />

      {/* Section accent lights */}
      <pointLight position={[0, 3, SECTIONS.hero.z]} color={ACCENT} intensity={1.5} distance={15} decay={2} />
      <pointLight position={[0, 3, SECTIONS.work.z]} color={ACCENT} intensity={1.5} distance={20} decay={2} />
      <pointLight position={[0, 3, SECTIONS.about.z]} color={ACCENT} intensity={1.5} distance={15} decay={2} />
      <pointLight position={[0, 3, SECTIONS.contact.z]} color={ACCENT} intensity={1.5} distance={15} decay={2} />

      {/* Fog */}
      <fog attach="fog" args={[BG, 10, 70]} />

      {/* Reflective floor */}
      <ReflectiveFloor />

      {/* Camera */}
      <CameraController scrollRef={scrollRef} />

      {/* HERO — Glass Monolith */}
      <GlassMonolith />

      {/* THRESHOLD FRAMES */}
      <ThresholdFrame position={[0, 2.25, SECTIONS.threshold1.z]} />
      <ThresholdFrame position={[0, 2.25, SECTIONS.threshold2.z]} />
      <ThresholdFrame position={[0, 2.25, SECTIONS.threshold3.z]} />

      {/* WORK — Frosted Glass Panels */}
      {PROJECTS.map((project, i) => (
        <GlassPanel
          key={project.num}
          project={project}
          position={PANEL_POSITIONS[i]}
          rotation={PANEL_ROTATIONS[i]}
          scrollProgress={scrollRef.current.progress}
        />
      ))}

      {/* ABOUT — Concentric Rings */}
      <ConcentricRings />

      {/* CONTACT — Portal Frame */}
      <PortalFrame />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.002, 0.002)}
        />
        <Vignette eskil={false} offset={0.3} darkness={0.7} />
      </EffectComposer>

      {/* HTML Overlays rendered inside R3F for proper context */}
      <HtmlOverlays opacities={sectionOpacities} scrollProgress={scrollRef.current.progress} />
    </>
  );
}

/* ================================================================
   HTML OVERLAYS — Rendered via drei Html to stay in R3F context
   ================================================================ */
function HtmlOverlays({
  opacities,
  scrollProgress,
}: {
  opacities: { hero: number; work: number; about: number; contact: number };
  scrollProgress: number;
}) {
  return (
    <Html
      fullscreen
      zIndexRange={[10, 0]}
      style={{ pointerEvents: "none" }}
    >
      <HeroOverlay opacity={opacities.hero} />
      <WorkOverlay opacity={opacities.work} />
      <AboutOverlay opacity={opacities.about} />
      <ContactOverlay opacity={opacities.contact} />
      <NavDots scrollProgress={scrollProgress} />
    </Html>
  );
}
