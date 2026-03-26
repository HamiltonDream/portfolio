"use client";

import { useRef, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  ScrollControls,
  useScroll,
  Html,
  Float,
  Text,
  Sphere,
  MeshDistortMaterial,
  MeshWobbleMaterial,
  Trail,
} from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

const ACCENT = "#c9a84c";
const DIM = "#5a584f";
const BG = "#050507";
const TEXT_COLOR = "#eae8e3";
const TOTAL_PAGES = 6;

/* ================================================================
   CAMERA RIG — Flies through space based on scroll
   ================================================================ */
function CameraRig() {
  const scroll = useScroll();
  const { camera } = useThree();
  const prevScroll = useRef(0);
  const velocity = useRef(0);
  const mouseTarget = useRef(new THREE.Vector2());
  const mouseSmooth = useRef(new THREE.Vector2());

  // Camera path — a journey through 3D space
  const pathPoints = useMemo(
    () => [
      new THREE.Vector3(0, 0, 30), // Start — far out
      new THREE.Vector3(0, 0, 10), // Hero — zoom in
      new THREE.Vector3(0, 0, 0), // Transition
      new THREE.Vector3(-15, 2, -15), // Work — sweep left
      new THREE.Vector3(0, 8, -35), // About — rise up
      new THREE.Vector3(0, 2, -55), // Contact — deep forward
      new THREE.Vector3(0, 0, -65), // End
    ],
    []
  );

  const lookAtPoints = useMemo(
    () => [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(0, 0, -10),
      new THREE.Vector3(-10, 2, -25),
      new THREE.Vector3(0, 5, -45),
      new THREE.Vector3(0, 0, -65),
      new THREE.Vector3(0, 0, -75),
    ],
    []
  );

  const cameraCurve = useMemo(
    () => new THREE.CatmullRomCurve3(pathPoints),
    [pathPoints]
  );
  const lookAtCurve = useMemo(
    () => new THREE.CatmullRomCurve3(lookAtPoints),
    [lookAtPoints]
  );

  // Mouse handler
  const onPointerMove = useCallback((e: PointerEvent) => {
    mouseTarget.current.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
  }, []);

  // Register mouse listener
  useFrame(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }
  });

  useFrame((_, delta) => {
    const t = scroll.offset;
    velocity.current = Math.abs(t - prevScroll.current) / delta;
    prevScroll.current = t;

    // Smooth mouse
    mouseSmooth.current.lerp(mouseTarget.current, 0.05);

    // Get camera position along path
    const pos = cameraCurve.getPoint(t);
    const lookAt = lookAtCurve.getPoint(Math.min(t + 0.02, 1));

    // Add mouse parallax
    camera.position.lerp(
      new THREE.Vector3(
        pos.x + mouseSmooth.current.x * 1.5,
        pos.y + mouseSmooth.current.y * 0.8,
        pos.z
      ),
      0.08
    );

    camera.lookAt(lookAt);

    // Add subtle roll based on mouse
    camera.rotation.z = THREE.MathUtils.lerp(
      camera.rotation.z,
      -mouseSmooth.current.x * 0.03,
      0.05
    );
  });

  return null;
}

/* ================================================================
   STAR FIELD — Surround the entire journey
   ================================================================ */
function StarField({ count = 3000 }) {
  const ref = useRef<THREE.Points>(null);

  const [positions, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      // Spread stars along the entire camera path
      pos[i * 3] = (Math.random() - 0.5) * 80;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 2] = 40 - Math.random() * 120; // Z from +40 to -80
      sz[i] = Math.random() * 2 + 0.5;
    }
    return [pos, sz];
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const time = clock.getElapsedTime();
    const arr = (ref.current.geometry.getAttribute("position") as THREE.BufferAttribute).array as Float32Array;
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      arr[i3] += Math.sin(time * 0.1 + i * 0.01) * 0.002;
      arr[i3 + 1] += Math.cos(time * 0.08 + i * 0.01) * 0.002;
    }
    (ref.current.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color={ACCENT}
        transparent
        opacity={0.5}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ================================================================
   FLOATING ORBS — ambient atmosphere throughout
   ================================================================ */
function FloatingOrbs() {
  const orbs = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 25; i++) {
      arr.push({
        position: [
          (Math.random() - 0.5) * 40,
          (Math.random() - 0.5) * 30,
          20 - Math.random() * 100,
        ] as [number, number, number],
        scale: Math.random() * 0.4 + 0.1,
        speed: Math.random() * 0.5 + 0.2,
        color: Math.random() > 0.5 ? ACCENT : "#8B7355",
      });
    }
    return arr;
  }, []);

  return (
    <>
      {orbs.map((orb, i) => (
        <Float
          key={i}
          position={orb.position}
          speed={orb.speed}
          rotationIntensity={0.5}
          floatIntensity={2}
        >
          <Sphere args={[orb.scale, 32, 32]}>
            <MeshDistortMaterial
              color={orb.color}
              emissive={orb.color}
              emissiveIntensity={0.8}
              transparent
              opacity={0.3}
              distort={0.4}
              speed={2}
              roughness={0}
            />
          </Sphere>
        </Float>
      ))}
    </>
  );
}

/* ================================================================
   HERO ZONE — The grand entrance (scroll 0–0.2)
   ================================================================ */
function HeroZone() {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = scroll.offset;
    const time = clock.getElapsedTime();

    // Fade out as we leave hero zone
    const heroOpacity = t < 0.15 ? 1 : Math.max(0, 1 - (t - 0.15) / 0.1);
    groupRef.current.children.forEach((child) => {
      if ((child as THREE.Mesh).material) {
        const mat = (child as THREE.Mesh).material as THREE.Material;
        if ("opacity" in mat) (mat as THREE.MeshStandardMaterial).opacity = heroOpacity * 0.3;
      }
    });

    // Rotate rings
    if (ringRef.current) {
      ringRef.current.rotation.x = time * 0.3;
      ringRef.current.rotation.y = time * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = -time * 0.2;
      ring2Ref.current.rotation.z = time * 0.25;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Central morphing sphere */}
      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={1}>
        <Sphere args={[2, 64, 64]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#0a0a12"
            emissive={ACCENT}
            emissiveIntensity={0.15}
            transparent
            opacity={0.6}
            distort={0.3}
            speed={1.5}
            roughness={0.1}
            metalness={0.9}
          />
        </Sphere>
      </Float>

      {/* Orbital rings */}
      <mesh ref={ringRef}>
        <torusGeometry args={[3.5, 0.015, 16, 100]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.5}
          transparent
          opacity={0.4}
        />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[4.2, 0.01, 16, 100]} />
        <meshStandardMaterial
          color="#8B7355"
          emissive="#8B7355"
          emissiveIntensity={0.3}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* HTML overlay — appears IN the 3D world */}
      <Html
        center
        position={[0, 0, 5]}
        style={{
          width: "100vw",
          textAlign: "center",
          pointerEvents: "none",
          userSelect: "none",
        }}
        className="hero-html"
      >
        <div className="flex flex-col items-center gap-4">
          <p
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
              color: DIM,
              fontFamily: "var(--font-inter), sans-serif",
            }}
          >
            Developer &bull; Artist &bull; Creator
          </p>
          <h1
            style={{
              fontSize: "clamp(4rem, 14vw, 12rem)",
              fontFamily: "var(--font-cormorant), Georgia, serif",
              fontWeight: 300,
              lineHeight: 0.9,
              color: TEXT_COLOR,
              letterSpacing: "-0.03em",
              textShadow: `0 0 80px rgba(201,168,76,0.15), 0 0 200px rgba(201,168,76,0.05)`,
            }}
          >
            Hamilton
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              color: DIM,
              fontFamily: "var(--font-inter), sans-serif",
              fontWeight: 300,
            }}
          >
            Software &middot; Music &middot; Motion &middot; Design
          </p>
          <div
            style={{
              marginTop: "3rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
              color: DIM,
            }}
          >
            <div
              style={{
                width: 1,
                height: 40,
                background: `linear-gradient(to bottom, ${ACCENT}, transparent)`,
                animation: "pulse 2s ease-in-out infinite",
              }}
            />
            <span style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase" }}>
              Scroll to Explore
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
}

/* ================================================================
   WORK ZONE — Floating project cards in 3D space (scroll 0.25–0.55)
   ================================================================ */
const PROJECTS = [
  { title: "SaaS Platform", desc: "Full-Stack Web Application", category: "Software", hue: 250-10 },
  { title: "HamiltonDream", desc: "Music Production & Artistry", category: "Music", hue: 330 },
  { title: "Visual Stories", desc: "Editing & Animation", category: "Motion", hue: 200 },
  { title: "Mobile Suite", desc: "iOS & Android Development", category: "Apps", hue: 170 },
  { title: "Brand Worlds", desc: "Identity & Visual Systems", category: "Design", hue: 45 },
];

function ProjectCard({
  project,
  position,
  rotation,
  index,
}: {
  project: (typeof PROJECTS)[number];
  position: [number, number, number];
  rotation: [number, number, number];
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const scroll = useScroll();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = scroll.offset;
    const time = clock.getElapsedTime();

    // Cards appear as camera approaches
    const cardStart = 0.2 + index * 0.04;
    const cardEnd = 0.55;
    const visibility =
      t < cardStart ? 0 : t > cardEnd ? Math.max(0, 1 - (t - cardEnd) / 0.1) : 1;

    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, visibility, 0.05));

    // Gentle float
    meshRef.current.position.y =
      position[1] + Math.sin(time * 0.5 + index * 2) * 0.3;
    meshRef.current.rotation.y =
      rotation[1] + Math.sin(time * 0.3 + index) * 0.05;
  });

  return (
    <group position={position} rotation={rotation}>
      <mesh ref={meshRef} scale={0}>
        <planeGeometry args={[5, 3.5]} />
        <meshStandardMaterial
          color={`hsl(${project.hue}, 20%, 5%)`}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
        <Html
          transform
          position={[0, 0, 0.01]}
          style={{
            width: 400,
            padding: "32px",
            pointerEvents: "auto",
            cursor: "pointer",
          }}
          className="project-card-html"
        >
          <div
            style={{
              background: `linear-gradient(135deg, hsl(${project.hue}, 30%, 6%), hsl(${project.hue}, 40%, 3%))`,
              borderRadius: 16,
              padding: "40px 32px",
              border: `1px solid hsl(${project.hue}, 30%, 12%)`,
              backdropFilter: "blur(10px)",
              cursor: "pointer",
              transition: "border-color 0.4s, box-shadow 0.4s",
              height: "100%",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = ACCENT;
              (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px rgba(201,168,76,0.1)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = `hsl(${project.hue}, 30%, 12%)`;
              (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
            }}
          >
            <span
              style={{
                fontSize: "0.6rem",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                color: `hsl(${project.hue}, 50%, 50%)`,
                border: `1px solid hsl(${project.hue}, 30%, 20%)`,
                padding: "4px 12px",
                borderRadius: 99,
                display: "inline-block",
                marginBottom: 20,
              }}
            >
              {project.category}
            </span>
            <h3
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: "2rem",
                fontWeight: 300,
                color: TEXT_COLOR,
                marginBottom: 8,
              }}
            >
              {project.title}
            </h3>
            <p style={{ fontSize: "0.85rem", color: DIM, fontWeight: 300 }}>
              {project.desc}
            </p>
          </div>
        </Html>
      </mesh>
    </group>
  );
}

function WorkZone() {
  const cardPositions: [number, number, number][] = [
    [-12, 0, -18],
    [-6, 3, -22],
    [-14, -1, -26],
    [-8, 2, -30],
    [-13, -2, -34],
  ];
  const cardRotations: [number, number, number][] = [
    [0, 0.4, 0],
    [0, 0.3, 0.05],
    [0, 0.5, -0.03],
    [0, 0.35, 0.02],
    [0, 0.45, -0.05],
  ];

  return (
    <group>
      {/* Section label */}
      <Html
        center
        position={[-15, 5, -16]}
        style={{ pointerEvents: "none", userSelect: "none" }}
      >
        <div style={{ textAlign: "right" }}>
          <span
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "8rem",
              fontWeight: 300,
              color: TEXT_COLOR,
              opacity: 0.03,
              lineHeight: 1,
              display: "block",
            }}
          >
            01
          </span>
          <h2
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "3rem",
              fontWeight: 300,
              color: TEXT_COLOR,
              letterSpacing: "-0.02em",
            }}
          >
            Selected Works
          </h2>
        </div>
      </Html>

      {PROJECTS.map((project, i) => (
        <ProjectCard
          key={project.title}
          project={project}
          position={cardPositions[i]}
          rotation={cardRotations[i]}
          index={i}
        />
      ))}

      {/* Ambient geometry near work zone */}
      <Float position={[-18, 4, -20]} speed={0.8} floatIntensity={2}>
        <mesh>
          <octahedronGeometry args={[0.5, 0]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={0.3}
            wireframe
            transparent
            opacity={0.2}
          />
        </mesh>
      </Float>
      <Float position={[-5, -2, -24]} speed={1.2} floatIntensity={1.5}>
        <mesh>
          <tetrahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color="#8B7355"
            emissive="#8B7355"
            emissiveIntensity={0.4}
            wireframe
            transparent
            opacity={0.3}
          />
        </mesh>
      </Float>
    </group>
  );
}

/* ================================================================
   ABOUT ZONE — Ethereal knowledge space (scroll 0.55–0.75)
   ================================================================ */
const SKILLS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Swift",
  "Python",
  "After Effects",
  "Premiere Pro",
  "FL Studio",
  "Blender",
  "Figma",
];

function AboutZone() {
  const groupRef = useRef<THREE.Group>(null);
  const scroll = useScroll();

  // Central nebula
  const nebulaRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (nebulaRef.current) {
      const time = clock.getElapsedTime();
      nebulaRef.current.rotation.y = time * 0.1;
      nebulaRef.current.rotation.x = Math.sin(time * 0.2) * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 8, -40]}>
      {/* Morphing nebula sphere */}
      <Float speed={0.8} rotationIntensity={0.2} floatIntensity={1}>
        <Sphere ref={nebulaRef} args={[3, 64, 64]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#0a0a12"
            emissive={ACCENT}
            emissiveIntensity={0.08}
            transparent
            opacity={0.25}
            distort={0.5}
            speed={1}
            roughness={0.2}
            metalness={0.8}
            wireframe
          />
        </Sphere>
      </Float>

      {/* About content */}
      <Html
        center
        position={[0, -2, 5]}
        style={{
          width: "60vw",
          maxWidth: 700,
          textAlign: "center",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <div className="flex flex-col items-center gap-6">
          <span
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "8rem",
              fontWeight: 300,
              color: TEXT_COLOR,
              opacity: 0.03,
              lineHeight: 1,
            }}
          >
            02
          </span>
          <h2
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "3rem",
              fontWeight: 300,
              color: TEXT_COLOR,
            }}
          >
            About
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: 1.8,
              color: DIM,
              fontWeight: 300,
              maxWidth: 550,
            }}
          >
            I build software, produce music as HamiltonDream, edit films, and
            animate worlds. I don&apos;t pick one lane — I create across every
            medium. Code is my instrument, pixels are my canvas, sound is my
            space.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: 10,
              marginTop: 16,
            }}
          >
            {SKILLS.map((skill) => (
              <span
                key={skill}
                style={{
                  padding: "6px 16px",
                  fontSize: "0.75rem",
                  color: "rgba(234,232,227,0.7)",
                  border: "1px solid rgba(234,232,227,0.08)",
                  borderRadius: 99,
                  fontWeight: 300,
                  letterSpacing: "0.05em",
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </Html>

      {/* Floating skill orbs around the nebula */}
      {SKILLS.slice(0, 6).map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const r = 5 + Math.random() * 2;
        return (
          <Float
            key={i}
            position={[Math.cos(angle) * r, Math.sin(angle) * 2, Math.sin(angle) * r]}
            speed={0.5 + Math.random() * 0.5}
            floatIntensity={1.5}
          >
            <Sphere args={[0.08, 16, 16]}>
              <meshStandardMaterial
                color={ACCENT}
                emissive={ACCENT}
                emissiveIntensity={1}
                transparent
                opacity={0.6}
              />
            </Sphere>
          </Float>
        );
      })}
    </group>
  );
}

/* ================================================================
   CONTACT ZONE — Portal at the end of the universe (scroll 0.8–1.0)
   ================================================================ */
function ContactZone() {
  const portalRef = useRef<THREE.Mesh>(null);
  const ringGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (portalRef.current) {
      portalRef.current.rotation.z = time * 0.5;
    }
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.y = time * 0.15;
      ringGroupRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
    }
  });

  return (
    <group position={[0, 2, -60]}>
      {/* Portal rings */}
      <group ref={ringGroupRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4, 0.02, 16, 100]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={0.8}
            transparent
            opacity={0.4}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2 + 0.3, 0.2, 0]}>
          <torusGeometry args={[4.5, 0.015, 16, 100]} />
          <meshStandardMaterial
            color="#8B7355"
            emissive="#8B7355"
            emissiveIntensity={0.5}
            transparent
            opacity={0.3}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2 - 0.2, -0.1, 0.3]}>
          <torusGeometry args={[5, 0.01, 16, 80]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={0.3}
            transparent
            opacity={0.2}
          />
        </mesh>
      </group>

      {/* Central glow sphere */}
      <Sphere ref={portalRef} args={[1.5, 32, 32]}>
        <MeshDistortMaterial
          color="#0a0a12"
          emissive={ACCENT}
          emissiveIntensity={0.2}
          transparent
          opacity={0.5}
          distort={0.6}
          speed={2}
          roughness={0}
          metalness={1}
        />
      </Sphere>

      {/* Contact HTML */}
      <Html
        center
        position={[0, -2, 8]}
        style={{
          width: "100vw",
          textAlign: "center",
          pointerEvents: "auto",
          userSelect: "none",
        }}
      >
        <div className="flex flex-col items-center gap-6">
          <span
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "8rem",
              fontWeight: 300,
              color: TEXT_COLOR,
              opacity: 0.03,
              lineHeight: 1,
            }}
          >
            03
          </span>
          <h2
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 300,
              color: TEXT_COLOR,
              lineHeight: 1.1,
              textShadow: `0 0 60px rgba(201,168,76,0.1)`,
            }}
          >
            Let&apos;s Create
            <br />
            Something New
          </h2>
          <p style={{ color: DIM, fontSize: "1rem", fontWeight: 300 }}>
            Got a project, a vision, or a wild idea?
          </p>
          <a
            href="mailto:hello@hamilton.dev"
            style={{
              marginTop: 16,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 160,
              height: 160,
              borderRadius: "50%",
              border: `1px solid rgba(201,168,76,0.3)`,
              color: ACCENT,
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 300,
              textDecoration: "none",
              transition: "all 0.5s",
              cursor: "pointer",
              position: "relative",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "rgba(201,168,76,0.05)";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(201,168,76,0.6)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 0 60px rgba(201,168,76,0.15)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(201,168,76,0.3)";
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = "none";
            }}
          >
            Get in Touch
          </a>
          <div style={{ display: "flex", gap: 24, marginTop: 24 }}>
            {["GitHub", "Twitter", "LinkedIn", "SoundCloud"].map((label) => (
              <a
                key={label}
                href="#"
                style={{
                  fontSize: "0.7rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: DIM,
                  textDecoration: "none",
                  transition: "color 0.3s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = ACCENT;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLAnchorElement).style.color = DIM;
                }}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </Html>
    </group>
  );
}

/* ================================================================
   LIGHT BEAMS — Atmospheric volumetric-like beams
   ================================================================ */
function LightBeams() {
  const beams = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 8; i++) {
      arr.push({
        position: [
          (Math.random() - 0.5) * 30,
          15 + Math.random() * 10,
          10 - Math.random() * 80,
        ] as [number, number, number],
        rotation: [0, 0, (Math.random() - 0.5) * 0.5] as [number, number, number],
        scale: [0.05, 20 + Math.random() * 15, 0.05] as [number, number, number],
        opacity: 0.03 + Math.random() * 0.04,
      });
    }
    return arr;
  }, []);

  return (
    <>
      {beams.map((beam, i) => (
        <mesh key={i} position={beam.position} rotation={beam.rotation} scale={beam.scale}>
          <cylinderGeometry args={[1, 0.5, 1, 8]} />
          <meshBasicMaterial
            color={ACCENT}
            transparent
            opacity={beam.opacity}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}

/* ================================================================
   NAVIGATION — Fixed HTML overlay (not in 3D space)
   ================================================================ */
function Navigation() {
  const scroll = useScroll();
  const navRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    if (!navRef.current) return;
    const t = scroll.offset;
    // Determine active section
    const links = navRef.current.querySelectorAll("a[data-section]");
    links.forEach((link) => {
      const section = (link as HTMLElement).dataset.section;
      let isActive = false;
      if (section === "work" && t > 0.15 && t < 0.55) isActive = true;
      if (section === "about" && t > 0.55 && t < 0.8) isActive = true;
      if (section === "contact" && t > 0.8) isActive = true;
      (link as HTMLElement).style.color = isActive ? ACCENT : DIM;
    });
  });

  return (
    <Html
      fullscreen
      style={{ pointerEvents: "none" }}
      zIndexRange={[9999, 9999]}
    >
      <div
        ref={navRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "24px 40px",
          zIndex: 9999,
          pointerEvents: "auto",
          mixBlendMode: "difference",
        }}
      >
        <a
          href="#"
          style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "1.5rem",
            fontWeight: 300,
            color: TEXT_COLOR,
            textDecoration: "none",
            letterSpacing: "0.05em",
          }}
        >
          H
        </a>
        <div style={{ display: "flex", gap: 36 }}>
          {[
            { label: "Work", section: "work" },
            { label: "About", section: "about" },
            { label: "Contact", section: "contact" },
          ].map((link) => (
            <a
              key={link.section}
              href="#"
              data-section={link.section}
              style={{
                fontSize: "0.7rem",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: DIM,
                textDecoration: "none",
                fontWeight: 400,
                transition: "color 0.3s",
                cursor: "pointer",
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </Html>
  );
}

/* ================================================================
   PROGRESS BAR
   ================================================================ */
function ProgressBar() {
  const scroll = useScroll();
  const barRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    if (barRef.current) {
      barRef.current.style.width = `${scroll.offset * 100}%`;
    }
  });

  return (
    <Html fullscreen style={{ pointerEvents: "none" }} zIndexRange={[10000, 10000]}>
      <div
        ref={barRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: 1,
          background: ACCENT,
          zIndex: 10000,
          transition: "width 0.05s linear",
        }}
      />
    </Html>
  );
}

/* ================================================================
   MAIN SCENE — Assembles everything inside ScrollControls
   ================================================================ */
export function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight position={[5, 10, 10]} intensity={0.3} color={ACCENT} />
      <pointLight position={[-10, -5, -20]} intensity={0.15} color="#5a584f" />
      <pointLight position={[0, 5, -50]} intensity={0.2} color={ACCENT} />

      <ScrollControls pages={TOTAL_PAGES} damping={0.25}>
        <CameraRig />
        <Navigation />
        <ProgressBar />

        {/* The Universe */}
        <StarField count={2500} />
        <FloatingOrbs />
        <LightBeams />

        {/* Content Zones */}
        <HeroZone />
        <WorkZone />
        <AboutZone />
        <ContactZone />
      </ScrollControls>

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.5}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0005, 0.0005)}
        />
        <Vignette
          offset={0.3}
          darkness={0.7}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  );
}
