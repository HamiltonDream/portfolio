"use client";

import { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Float, Html, MeshTransmissionMaterial } from "@react-three/drei";
import {
  EffectComposer,
  Bloom,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";

const ACCENT = "#c9a84c";
const DIM = "#5a584f";
const TEXT_COLOR = "#eae8e3";

/* ================================================================
   CUSTOM VERTEX SHADER — Organic noise displacement
   ================================================================ */
const sculptureVertexShader = `
uniform float uTime;
uniform float uHover;
uniform vec2 uMouse;
uniform float uScroll;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vDisplacement;
varying vec2 vUv;
varying float vFresnel;

// Simplex noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289((x * 34.0 + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float fbm(vec3 p) {
  float v = 0.0;
  float a = 0.5;
  vec3 shift = vec3(100.0);
  for (int i = 0; i < 4; i++) {
    v += a * snoise(p);
    p = p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vUv = uv;
  
  vec3 pos = position;
  
  // Base organic displacement
  float noise1 = fbm(pos * 1.5 + uTime * 0.15);
  float noise2 = snoise(pos * 3.0 + uTime * 0.2) * 0.3;
  
  // Mouse influence — bulge toward cursor
  float mouseInfluence = 1.0 - smoothstep(0.0, 2.0, length(pos.xy - uMouse * 2.0));
  float mouseBulge = mouseInfluence * uHover * 0.15;
  
  // Scroll morph — subtle shape change
  float scrollMorph = sin(pos.y * 3.0 + uScroll * 3.0) * uScroll * 0.08;
  
  // Breathing — slow pulse
  float breathe = sin(uTime * 0.8) * 0.03;
  
  float displacement = noise1 * 0.12 + noise2 + mouseBulge + scrollMorph + breathe;
  vDisplacement = displacement;
  
  pos += normal * displacement;
  
  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize(normalMatrix * normal);
  
  // Fresnel
  vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
  vFresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
  
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

/* ================================================================
   CUSTOM FRAGMENT SHADER — Liquid glass / chrome material
   ================================================================ */
const sculptureFragmentShader = `
uniform float uTime;
uniform float uHover;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uAccent;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vDisplacement;
varying vec2 vUv;
varying float vFresnel;

void main() {
  // Base color — dark with subtle gradient
  vec3 base = mix(uColor1, uColor2, vUv.y * 0.5 + 0.5);
  
  // Iridescent shimmer
  float iridescence = sin(vDisplacement * 20.0 + uTime * 0.5) * 0.5 + 0.5;
  vec3 iriColor = mix(
    vec3(0.15, 0.12, 0.25),  // Deep purple
    vec3(0.25, 0.2, 0.08),   // Warm gold
    iridescence
  );
  
  // Fresnel rim glow
  vec3 rimColor = mix(uAccent, vec3(1.0), 0.3);
  
  // Specular highlights
  vec3 lightDir = normalize(vec3(2.0, 3.0, 4.0));
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(vNormal, halfDir), 0.0), 64.0);
  
  vec3 lightDir2 = normalize(vec3(-3.0, 1.0, -2.0));
  vec3 halfDir2 = normalize(lightDir2 + viewDir);
  float spec2 = pow(max(dot(vNormal, halfDir2), 0.0), 32.0);
  
  // Compose
  vec3 color = base * 0.3;
  color += iriColor * 0.15;
  color += rimColor * vFresnel * (0.4 + uHover * 0.3);
  color += vec3(1.0, 0.95, 0.8) * spec * 0.5;
  color += uAccent * spec2 * 0.3;
  
  // Displacement-based subtle color shift
  color += uAccent * smoothstep(0.05, 0.15, vDisplacement) * 0.1;
  
  float alpha = 0.85 + vFresnel * 0.15;
  
  gl_FragColor = vec4(color, alpha);
}
`;

/* ================================================================
   INTERACTIVE SCULPTURE — The main 3D model
   ================================================================ */
function InteractiveSculpture() {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouseTarget = useRef(new THREE.Vector2(0, 0));
  const mouseCurrent = useRef(new THREE.Vector2(0, 0));
  const hoverTarget = useRef(0);
  const hoverCurrent = useRef(0);
  const scrollTarget = useRef(0);
  const scrollCurrent = useRef(0);
  const rotationTarget = useRef(new THREE.Vector2(0, 0));

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHover: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uScroll: { value: 0 },
      uColor1: { value: new THREE.Color("#08080f") },
      uColor2: { value: new THREE.Color("#0f0e18") },
      uAccent: { value: new THREE.Color(ACCENT) },
    }),
    []
  );

  useEffect(() => {
    function onMove(e: MouseEvent) {
      mouseTarget.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    }
    function onScroll() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      scrollTarget.current = maxScroll > 0 ? window.scrollY / maxScroll : 0;
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", onScroll);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current || !materialRef.current) return;
    const time = clock.getElapsedTime();

    // Smooth mouse
    mouseCurrent.current.lerp(mouseTarget.current, 0.05);
    hoverCurrent.current += (hoverTarget.current - hoverCurrent.current) * 0.05;
    scrollCurrent.current += (scrollTarget.current - scrollCurrent.current) * 0.03;

    // Update uniforms
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uMouse.value.copy(mouseCurrent.current);
    materialRef.current.uniforms.uHover.value = hoverCurrent.current;
    materialRef.current.uniforms.uScroll.value = scrollCurrent.current;

    // Rotation follows mouse — sculpture tracks you
    rotationTarget.current.set(
      mouseCurrent.current.y * 0.3,
      mouseCurrent.current.x * 0.4
    );
    meshRef.current.rotation.x += (rotationTarget.current.x - meshRef.current.rotation.x) * 0.03;
    meshRef.current.rotation.y += (rotationTarget.current.y - meshRef.current.rotation.y) * 0.03;

    // Subtle constant rotation
    meshRef.current.rotation.y += 0.002;

    // Breathing scale
    const breathe = 1 + Math.sin(time * 0.8) * 0.015;
    meshRef.current.scale.setScalar(breathe);
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, 0]}
      onPointerEnter={() => { hoverTarget.current = 1; }}
      onPointerLeave={() => { hoverTarget.current = 0; }}
    >
      <icosahedronGeometry args={[2.2, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={sculptureVertexShader}
        fragmentShader={sculptureFragmentShader}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ================================================================
   FLOATING ACCENT PIECES — Small geometric satellites
   ================================================================ */
function AccentPieces() {
  const groupRef = useRef<THREE.Group>(null);
  const pieces = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = 3.5 + Math.random() * 1.5;
      arr.push({
        position: [
          Math.cos(angle) * r,
          (Math.random() - 0.5) * 3,
          Math.sin(angle) * r,
        ] as [number, number, number],
        scale: 0.08 + Math.random() * 0.12,
        type: i % 3,
        speed: 0.3 + Math.random() * 0.4,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    groupRef.current.rotation.y = time * 0.05;
  });

  return (
    <group ref={groupRef}>
      {pieces.map((piece, i) => (
        <Float
          key={i}
          position={piece.position}
          speed={piece.speed}
          rotationIntensity={2}
          floatIntensity={1.5}
        >
          <mesh scale={piece.scale}>
            {piece.type === 0 && <octahedronGeometry args={[1, 0]} />}
            {piece.type === 1 && <tetrahedronGeometry args={[1, 0]} />}
            {piece.type === 2 && <icosahedronGeometry args={[1, 0]} />}
            <meshStandardMaterial
              color={ACCENT}
              emissive={ACCENT}
              emissiveIntensity={0.5}
              metalness={0.9}
              roughness={0.1}
              transparent
              opacity={0.7}
            />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

/* ================================================================
   ORBITAL RINGS — Thin elegant rings around the sculpture
   ================================================================ */
function OrbitalRings() {
  const ring1 = useRef<THREE.Mesh>(null);
  const ring2 = useRef<THREE.Mesh>(null);
  const ring3 = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1.current) {
      ring1.current.rotation.x = t * 0.2;
      ring1.current.rotation.y = t * 0.15;
    }
    if (ring2.current) {
      ring2.current.rotation.x = -t * 0.15 + 1;
      ring2.current.rotation.z = t * 0.1;
    }
    if (ring3.current) {
      ring3.current.rotation.y = t * 0.12;
      ring3.current.rotation.z = -t * 0.08 + 2;
    }
  });

  return (
    <>
      <mesh ref={ring1}>
        <torusGeometry args={[3.2, 0.008, 16, 128]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.6}
          transparent
          opacity={0.35}
        />
      </mesh>
      <mesh ref={ring2}>
        <torusGeometry args={[3.8, 0.006, 16, 100]} />
        <meshStandardMaterial
          color="#8B7355"
          emissive="#8B7355"
          emissiveIntensity={0.4}
          transparent
          opacity={0.25}
        />
      </mesh>
      <mesh ref={ring3}>
        <torusGeometry args={[4.3, 0.004, 16, 80]} />
        <meshStandardMaterial
          color={ACCENT}
          emissive={ACCENT}
          emissiveIntensity={0.3}
          transparent
          opacity={0.15}
        />
      </mesh>
    </>
  );
}

/* ================================================================
   GRID FLOOR — Subtle ground plane for spatial reference
   ================================================================ */
function GridFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.5, 0]}>
      <planeGeometry args={[40, 40, 40, 40]} />
      <meshBasicMaterial
        color={ACCENT}
        transparent
        opacity={0.03}
        wireframe
      />
    </mesh>
  );
}

/* ================================================================
   MAIN SCENE EXPORT
   ================================================================ */
export function PortfolioScene() {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.05} />
      <directionalLight
        position={[5, 8, 6]}
        intensity={0.4}
        color="#f5f0e8"
      />
      <pointLight
        position={[-4, 3, -3]}
        intensity={0.3}
        color={ACCENT}
        distance={15}
      />
      <pointLight
        position={[3, -2, 4]}
        intensity={0.15}
        color="#5a584f"
        distance={12}
      />
      <spotLight
        position={[0, 10, 5]}
        angle={0.3}
        penumbra={0.8}
        intensity={0.5}
        color="#f0e8d8"
        distance={20}
      />

      {/* The Sculpture */}
      <InteractiveSculpture />
      <AccentPieces />
      <OrbitalRings />
      <GridFloor />

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.4}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
        <Vignette
          offset={0.3}
          darkness={0.6}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    </>
  );
}
