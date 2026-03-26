"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

// Floating particles that react to scroll and mouse
function ParticleField({ count = 1500 }: { count?: number }) {
  const mesh = useRef<THREE.Points>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);
  const { viewport } = useThree();

  const [positions, sizes, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      sz[i] = Math.random() * 2.5 + 0.5;
      vel[i * 3] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.002;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }
    return [pos, sz, vel];
  }, [count]);

  useFrame(({ clock, pointer }) => {
    if (!mesh.current) return;
    const geo = mesh.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const time = clock.getElapsedTime();

    // Smooth mouse tracking
    mouseRef.current.x += (pointer.x * viewport.width * 0.5 - mouseRef.current.x) * 0.05;
    mouseRef.current.y += (pointer.y * viewport.height * 0.5 - mouseRef.current.y) * 0.05;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      // Ambient drift
      arr[i3] += velocities[i3] + Math.sin(time * 0.3 + i * 0.01) * 0.001;
      arr[i3 + 1] += velocities[i3 + 1] + Math.cos(time * 0.2 + i * 0.01) * 0.001;
      arr[i3 + 2] += velocities[i3 + 2];

      // Mouse repulsion
      const dx = arr[i3] - mouseRef.current.x;
      const dy = arr[i3 + 1] - mouseRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 3) {
        const force = (3 - dist) * 0.01;
        arr[i3] += (dx / dist) * force;
        arr[i3 + 1] += (dy / dist) * force;
      }

      // Wrap around edges
      if (arr[i3] > 15) arr[i3] = -15;
      if (arr[i3] < -15) arr[i3] = 15;
      if (arr[i3 + 1] > 15) arr[i3 + 1] = -15;
      if (arr[i3 + 1] < -15) arr[i3 + 1] = 15;
      if (arr[i3 + 2] > 10) arr[i3 + 2] = -10;
      if (arr[i3 + 2] < -10) arr[i3 + 2] = 10;
    }

    posAttr.needsUpdate = true;
    mesh.current.rotation.y = time * 0.02;
    mesh.current.rotation.x = Math.sin(time * 0.1) * 0.05;
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#c9a84c"
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Morphing wireframe sphere — living, breathing entity
function MorphSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  useFrame(({ clock, pointer }) => {
    if (!meshRef.current) return;
    const geo = meshRef.current.geometry;
    const posAttr = geo.getAttribute("position") as THREE.BufferAttribute;

    if (!originalPositions.current) {
      originalPositions.current = new Float32Array(posAttr.array);
    }

    const time = clock.getElapsedTime();
    const arr = posAttr.array as Float32Array;
    const orig = originalPositions.current;

    for (let i = 0; i < posAttr.count; i++) {
      const i3 = i * 3;
      const ox = orig[i3], oy = orig[i3 + 1], oz = orig[i3 + 2];

      // Simplex-like noise displacement
      const noise =
        Math.sin(ox * 3 + time * 0.5) * 0.08 +
        Math.sin(oy * 4 + time * 0.7) * 0.06 +
        Math.sin(oz * 2 + time * 0.3) * 0.04 +
        Math.sin((ox + oy) * 5 + time) * 0.03;

      // Mouse influence
      const mouseInfluence = pointer.x * 0.05;
      const mouseInfluenceY = pointer.y * 0.05;

      arr[i3] = ox * (1 + noise) + mouseInfluence * ox;
      arr[i3 + 1] = oy * (1 + noise) + mouseInfluenceY * oy;
      arr[i3 + 2] = oz * (1 + noise);
    }

    posAttr.needsUpdate = true;
    meshRef.current.rotation.y = time * 0.08;
    meshRef.current.rotation.x = Math.sin(time * 0.15) * 0.1;
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.8, 24]} />
      <meshStandardMaterial
        color="#0a0a0f"
        wireframe
        wireframeLinewidth={1}
        transparent
        opacity={0.15}
        emissive="#c9a84c"
        emissiveIntensity={0.05}
      />
    </mesh>
  );
}

// Orbiting particles around the sphere
function OrbiterRing({ count = 80, radius = 2.5, speed = 0.3, tilt = 0 }: {
  count?: number;
  radius?: number;
  speed?: number;
  tilt?: number;
}) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, [count, radius]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * speed;
    ref.current.rotation.x = tilt;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#c9a84c"
        transparent
        opacity={0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.1} />
      <pointLight position={[5, 5, 5]} intensity={0.3} color="#c9a84c" />
      <pointLight position={[-5, -3, 3]} intensity={0.15} color="#5a584f" />

      <ParticleField count={1200} />
      <MorphSphere />
      <OrbiterRing count={80} radius={2.8} speed={0.2} tilt={0.3} />
      <OrbiterRing count={60} radius={3.5} speed={-0.15} tilt={-0.5} />
      <OrbiterRing count={40} radius={4.2} speed={0.1} tilt={0.8} />

      <EffectComposer>
        <Bloom
          intensity={0.4}
          luminanceThreshold={0.6}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
      </EffectComposer>
    </>
  );
}

export default function Scene3D() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
        style={{ background: "transparent" }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
