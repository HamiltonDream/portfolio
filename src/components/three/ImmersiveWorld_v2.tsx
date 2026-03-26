"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, useScroll, Html } from "@react-three/drei";
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
const TEXT_COLOR = "#eae8e3";
const TOTAL_PAGES = 8;

/* ================================================================
   SHADERS — sculpture vertex + fragment
   ================================================================ */
const sculptureVert = `
uniform float uTime;
uniform float uIntensity;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vDisplacement;
varying vec2 vUv;
varying float vFresnel;

vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289((x*34.0+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}

float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(
    i.z+vec4(0.0,i1.z,i2.z,1.0))
    +i.y+vec4(0.0,i1.y,i2.y,1.0))
    +i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

void main(){
  vUv=uv;
  vec3 pos=position;
  float n=snoise(pos*0.8+uTime*0.1)*uIntensity;
  float n2=snoise(pos*2.0+uTime*0.15)*uIntensity*0.3;
  float displacement=n+n2;
  vDisplacement=displacement;
  pos+=normal*displacement;
  vec4 worldPos=modelMatrix*vec4(pos,1.0);
  vWorldPos=worldPos.xyz;
  vNormal=normalize(normalMatrix*normal);
  vec3 viewDir=normalize(cameraPosition-worldPos.xyz);
  vFresnel=pow(1.0-max(dot(viewDir,vNormal),0.0),3.0);
  gl_Position=projectionMatrix*viewMatrix*worldPos;
}
`;

const sculptureFrag = `
uniform float uTime;
uniform vec3 uColor;
uniform vec3 uAccent;
varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vDisplacement;
varying vec2 vUv;
varying float vFresnel;

void main(){
  vec3 lightDir=normalize(vec3(2.0,3.0,4.0));
  vec3 viewDir=normalize(cameraPosition-vWorldPos);
  vec3 halfDir=normalize(lightDir+viewDir);
  float spec=pow(max(dot(vNormal,halfDir),0.0),64.0);
  float diff=max(dot(vNormal,lightDir),0.0)*0.3;
  
  vec3 color=uColor*0.5+diff*uColor*1.5;
  color+=uAccent*vFresnel*0.8;
  color+=vec3(1.0,0.95,0.85)*spec*0.6;
  color+=uAccent*smoothstep(0.05,0.2,vDisplacement)*0.3;
  
  float iri=sin(vDisplacement*15.0+uTime*0.3)*0.5+0.5;
  color=mix(color,uAccent*0.3,iri*0.1);
  
  gl_FragColor=vec4(color,0.9+vFresnel*0.1);
}
`;

/* ================================================================
   ZONE HTML — Loop-aware scroll visibility for DOM overlays
   ================================================================ */
function ZoneHtml({
  scrollRange,
  children,
  ...htmlProps
}: {
  scrollRange: [number, number];
  children: React.ReactNode;
} & Record<string, unknown>) {
  const scroll = useScroll();
  const contentRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    if (!contentRef.current) return;
    const t = scroll.offset;
    const [start, end] = scrollRange;
    const fade = 0.04;
    let opacity = 0;

    if (start > end) {
      // Wrapping range (e.g., 0.92 to 0.12)
      if (t >= start) {
        opacity = t < start + fade ? (t - start) / fade : 1;
      } else if (t <= end) {
        opacity = t > end - fade ? (end - t) / fade : 1;
      }
    } else {
      if (t >= start && t <= end) {
        if (start > 0.01 && t < start + fade) opacity = (t - start) / fade;
        else if (end < 0.99 && t > end - fade) opacity = (end - t) / fade;
        else opacity = 1;
      }
    }

    opacity = Math.max(0, Math.min(1, opacity));
    contentRef.current.style.opacity = String(opacity);
    contentRef.current.style.pointerEvents = opacity > 0.1 ? "auto" : "none";
  });

  return (
    <Html {...htmlProps}>
      <div ref={contentRef} style={{ opacity: 0 }}>
        {children}
      </div>
    </Html>
  );
}

/* ================================================================
   HUMANOID CHARACTER — Geometric stylized figure
   ================================================================ */
function HumanoidCharacter() {
  const groupRef = useRef<THREE.Group>(null);
  const haloGroupRef = useRef<THREE.Group>(null);
  const fragmentsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(time * 0.6) * 0.15;
    groupRef.current.rotation.y += 0.003;

    if (haloGroupRef.current) {
      haloGroupRef.current.rotation.z = time * 0.3;
      haloGroupRef.current.rotation.x = Math.sin(time * 0.2) * 0.15 + 0.15;
    }

    if (fragmentsRef.current) {
      fragmentsRef.current.rotation.y = -time * 0.12;
    }
  });

  const bodyColor = "#1e1832";

  return (
    <group ref={groupRef}>
      {/* HEAD — faceted dodecahedron */}
      <mesh position={[0, 3.8, 0]}>
        <dodecahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.12} emissive={ACCENT} emissiveIntensity={0.12} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.22, 3.9, 0.55]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={3} />
      </mesh>
      <mesh position={[0.22, 3.9, 0.55]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={3} />
      </mesh>

      {/* NECK */}
      <mesh position={[0, 3.0, 0]}>
        <cylinderGeometry args={[0.15, 0.22, 0.5, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.05} />
      </mesh>

      {/* TORSO — hexagonal tapered */}
      <mesh position={[0, 1.9, 0]}>
        <cylinderGeometry args={[0.55, 0.4, 1.8, 6]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.06} />
      </mesh>

      {/* Chest core — glowing octahedron */}
      <mesh position={[0, 2.3, 0.4]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={4} transparent opacity={0.95} />
      </mesh>

      {/* SHOULDERS */}
      <mesh position={[0, 2.7, 0]} scale={[1.6, 0.12, 0.6]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.06} />
      </mesh>

      {/* Upper arms */}
      <mesh position={[-0.95, 2.15, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.09, 0.07, 1.0, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[0.95, 2.15, 0]} rotation={[0, 0, -0.2]}>
        <cylinderGeometry args={[0.09, 0.07, 1.0, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.04} />
      </mesh>

      {/* Forearms */}
      <mesh position={[-1.08, 1.35, 0.15]} rotation={[0.25, 0, 0.1]}>
        <cylinderGeometry args={[0.07, 0.05, 0.9, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[1.08, 1.35, 0.15]} rotation={[0.25, 0, -0.1]}>
        <cylinderGeometry args={[0.07, 0.05, 0.9, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.04} />
      </mesh>

      {/* Hands */}
      <mesh position={[-1.12, 0.85, 0.3]}>
        <icosahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.5} transparent opacity={0.8} />
      </mesh>
      <mesh position={[1.12, 0.85, 0.3]}>
        <icosahedronGeometry args={[0.08, 0]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.5} transparent opacity={0.8} />
      </mesh>

      {/* HIPS */}
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[0.4, 0.32, 0.45, 6]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.04} />
      </mesh>

      {/* Waist ring */}
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.42, 0.015, 8, 32]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={2} transparent opacity={0.7} />
      </mesh>

      {/* Upper legs */}
      <mesh position={[-0.2, -0.15, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 1.4, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[0.2, -0.15, 0]}>
        <cylinderGeometry args={[0.1, 0.08, 1.4, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.04} />
      </mesh>

      {/* Lower legs */}
      <mesh position={[-0.2, -1.2, 0.05]}>
        <cylinderGeometry args={[0.08, 0.06, 1.2, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[0.2, -1.2, 0.05]}>
        <cylinderGeometry args={[0.08, 0.06, 1.2, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.04} />
      </mesh>

      {/* Feet */}
      <mesh position={[-0.2, -1.85, 0.1]}>
        <boxGeometry args={[0.15, 0.06, 0.3]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.04} />
      </mesh>
      <mesh position={[0.2, -1.85, 0.1]}>
        <boxGeometry args={[0.15, 0.06, 0.3]} />
        <meshStandardMaterial color={bodyColor} metalness={0.95} roughness={0.15} emissive={ACCENT} emissiveIntensity={0.04} />
      </mesh>

      {/* HALO — twin golden rings */}
      <group ref={haloGroupRef} position={[0, 4.8, 0]}>
        <mesh>
          <torusGeometry args={[1.0, 0.02, 16, 64]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={2} transparent opacity={0.7} />
        </mesh>
        <mesh rotation={[0, 0, 0.4]}>
          <torusGeometry args={[0.75, 0.012, 16, 48]} />
          <meshStandardMaterial color="#8B7355" emissive="#8B7355" emissiveIntensity={1.2} transparent opacity={0.5} />
        </mesh>
      </group>

      {/* Shoulder accent lines */}
      <mesh position={[-0.75, 2.7, 0.2]} rotation={[0, 0, 0.5]}>
        <boxGeometry args={[0.35, 0.015, 0.015]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={2} transparent opacity={0.7} />
      </mesh>
      <mesh position={[0.75, 2.7, 0.2]} rotation={[0, 0, -0.5]}>
        <boxGeometry args={[0.35, 0.015, 0.015]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={2} transparent opacity={0.7} />
      </mesh>

      {/* Orbiting fragments */}
      <group ref={fragmentsRef}>
        {Array.from({ length: 10 }, (_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const r = 2.8 + Math.sin(i * 2.7) * 0.8;
          const y = 1.5 + Math.sin(i * 1.7) * 2;
          return (
            <mesh key={i} position={[Math.cos(angle) * r, y, Math.sin(angle) * r]}>
              <tetrahedronGeometry args={[0.06 + (i % 3) * 0.03, 0]} />
              <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.5} transparent opacity={0.6} />
            </mesh>
          );
        })}
      </group>

      {/* Inner glow light */}
      <pointLight position={[0, 2.3, 0.5]} intensity={0.8} color={ACCENT} distance={5} />
    </group>
  );
}

/* ================================================================
   CAMERA RIG — Closed-loop fly-through path
   ================================================================ */
function CameraRig() {
  const scroll = useScroll();
  const { camera } = useThree();
  const mouseTarget = useRef(new THREE.Vector2());
  const mouseSmooth = useRef(new THREE.Vector2());

  const cameraCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 3, 28),
          new THREE.Vector3(14, 4, 18),
          new THREE.Vector3(22, 3, 2),
          new THREE.Vector3(20, 5, -12),
          new THREE.Vector3(10, 9, -25),
          new THREE.Vector3(0, 11, -32),
          new THREE.Vector3(-12, 7, -22),
          new THREE.Vector3(-20, 3, -8),
          new THREE.Vector3(-16, 3, 10),
          new THREE.Vector3(-8, 3, 22),
        ],
        true
      ),
    []
  );

  const lookAtCurve = useMemo(
    () =>
      new THREE.CatmullRomCurve3(
        [
          new THREE.Vector3(0, 1.5, 18),
          new THREE.Vector3(10, 2, 8),
          new THREE.Vector3(20, 1, -6),
          new THREE.Vector3(17, 3, -18),
          new THREE.Vector3(5, 6, -28),
          new THREE.Vector3(0, 8, -32),
          new THREE.Vector3(-9, 4, -16),
          new THREE.Vector3(-17, 1, -5),
          new THREE.Vector3(-10, 1, 14),
          new THREE.Vector3(-3, 1, 22),
        ],
        true
      ),
    []
  );

  useEffect(() => {
    const handler = (e: PointerEvent) => {
      mouseTarget.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    };
    window.addEventListener("pointermove", handler, { passive: true });
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  useFrame(() => {
    const t = scroll.offset;
    mouseSmooth.current.lerp(mouseTarget.current, 0.05);

    const pos = cameraCurve.getPoint(t);
    const lookAt = lookAtCurve.getPoint(t);

    camera.position.lerp(
      new THREE.Vector3(
        pos.x + mouseSmooth.current.x * 1.2,
        pos.y + mouseSmooth.current.y * 0.5,
        pos.z
      ),
      0.06
    );

    camera.lookAt(lookAt);
    camera.rotation.z = THREE.MathUtils.lerp(
      camera.rotation.z,
      -mouseSmooth.current.x * 0.02,
      0.05
    );
  });

  return null;
}

/* ================================================================
   MONOLITH — Shader-driven sculptural form
   ================================================================ */
function Monolith({
  position,
  scale = 1,
  color = "#1a1528",
  intensity = 0.3,
  geometry = "icosahedron",
}: {
  position: [number, number, number];
  scale?: number;
  color?: string;
  intensity?: number;
  geometry?: "icosahedron" | "torus" | "torusKnot" | "sphere";
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: intensity },
      uColor: { value: new THREE.Color(color) },
      uAccent: { value: new THREE.Color(ACCENT) },
    }),
    [color, intensity]
  );

  useFrame(({ clock }) => {
    if (matRef.current) matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    if (meshRef.current) meshRef.current.rotation.y += 0.001;
  });

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      {geometry === "icosahedron" && <icosahedronGeometry args={[2, 48]} />}
      {geometry === "torus" && <torusGeometry args={[2, 0.8, 48, 100]} />}
      {geometry === "torusKnot" && <torusKnotGeometry args={[1.5, 0.5, 200, 32]} />}
      {geometry === "sphere" && <sphereGeometry args={[2, 64, 64]} />}
      <shaderMaterial
        ref={matRef}
        vertexShader={sculptureVert}
        fragmentShader={sculptureFrag}
        uniforms={uniforms}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ================================================================
   WORLD PILLARS — Distributed around the loop
   ================================================================ */
function WorldPillars() {
  const pillars = useMemo(() => {
    const arr = [];
    const rng = (seed: number) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 50; i++) {
      const angle = (i / 50) * Math.PI * 2;
      const r = 14 + rng(i) * 18;
      const x = Math.cos(angle) * r + (rng(i + 100) - 0.5) * 8;
      const z = Math.sin(angle) * r * 1.2 - 2 + (rng(i + 200) - 0.5) * 8;
      arr.push({
        position: [x, -4 + rng(i + 300) * 4, z] as [number, number, number],
        height: 8 + rng(i + 400) * 18,
        width: 0.1 + rng(i + 500) * 0.3,
        opacity: 0.12 + rng(i + 600) * 0.15,
      });
    }
    return arr;
  }, []);

  return (
    <>
      {pillars.map((p, i) => (
        <mesh key={i} position={p.position}>
          <boxGeometry args={[p.width, p.height, p.width]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={0.4}
            transparent
            opacity={p.opacity}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
      ))}
    </>
  );
}

/* ================================================================
   WORLD ARCHWAYS — Distributed around the loop
   ================================================================ */
function WorldArchways() {
  const arches = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const r = 10 + Math.sin(i * 1.3) * 4;
      arr.push({
        position: [
          Math.cos(angle) * r,
          1 + Math.sin(i * 0.7) * 2,
          Math.sin(angle) * r * 1.2 - 2,
        ] as [number, number, number],
        scale: 4 + Math.sin(i * 0.5) * 2,
        rotation: angle + i * 0.2,
        opacity: 0.08 + Math.sin(i * 0.8) * 0.05,
      });
    }
    return arr;
  }, []);

  return (
    <>
      {arches.map((arch, i) => (
        <mesh
          key={i}
          position={arch.position}
          rotation={[0, arch.rotation, i * 0.15]}
          scale={arch.scale}
        >
          <torusGeometry args={[1, 0.01, 4, 4]} />
          <meshStandardMaterial
            color={ACCENT}
            emissive={ACCENT}
            emissiveIntensity={0.5}
            transparent
            opacity={arch.opacity}
          />
        </mesh>
      ))}
    </>
  );
}

/* ================================================================
   FOG PLANES — Volumetric depth
   ================================================================ */
function FogPlanes() {
  const planes = useMemo(() => {
    const arr = [];
    const rng = (seed: number) => {
      const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
      return x - Math.floor(x);
    };
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const r = 8 + rng(i + 50) * 15;
      arr.push({
        position: [
          Math.cos(angle) * r,
          (rng(i + 150) - 0.5) * 10,
          Math.sin(angle) * r * 1.2 - 2,
        ] as [number, number, number],
        scale: [15 + rng(i + 250) * 10, 8 + rng(i + 350) * 6, 1] as [number, number, number],
        rotation: [0, angle + rng(i + 450) * 0.3, rng(i + 550) * 0.2] as [number, number, number],
        opacity: 0.008 + rng(i + 650) * 0.015,
      });
    }
    return arr;
  }, []);

  return (
    <>
      {planes.map((p, i) => (
        <mesh key={i} position={p.position} rotation={p.rotation} scale={p.scale}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            color="#1a1520"
            transparent
            opacity={p.opacity}
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </>
  );
}

/* ================================================================
   HERO ZONE — Character + name (scroll ~0.0, wraps 0.92–0.12)
   ================================================================ */
function HeroZone() {
  return (
    <group position={[0, 0, 18]}>
      <HumanoidCharacter />

      {/* Framing arcs */}
      <mesh rotation={[0, 0, Math.PI / 4]}>
        <torusGeometry args={[5, 0.015, 16, 100]} />
        <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={1.2} transparent opacity={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5.5, 0.01, 16, 100]} />
        <meshStandardMaterial color="#8B7355" emissive="#8B7355" emissiveIntensity={0.8} transparent opacity={0.2} />
      </mesh>

      {/* Hero text */}
      <ZoneHtml
        scrollRange={[0.92, 0.12]}
        center
        position={[0, 2, 6]}
        style={{ width: "100vw", textAlign: "center", pointerEvents: "none", userSelect: "none" }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
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
              textShadow: "0 0 80px rgba(201,168,76,0.15)",
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
            <span style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: DIM }}>
              Scroll to Explore
            </span>
          </div>
        </div>
      </ZoneHtml>
    </group>
  );
}

/* ================================================================
   WORK ZONE — Project gallery (scroll 0.18–0.40)
   ================================================================ */
const PROJECTS = [
  { title: "SaaS Platform", desc: "Full-Stack Web Application", category: "Software", hue: 250 },
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
    const cardStart = 0.18 + index * 0.03;
    const cardEnd = 0.42;
    const visibility =
      t < cardStart ? 0 : t > cardEnd ? Math.max(0, 1 - (t - cardEnd) / 0.08) : 1;
    meshRef.current.scale.setScalar(THREE.MathUtils.lerp(meshRef.current.scale.x, visibility, 0.05));
    meshRef.current.position.y = position[1] + Math.sin(time * 0.5 + index * 2) * 0.3;
    meshRef.current.rotation.y = rotation[1] + Math.sin(time * 0.3 + index) * 0.05;
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
          style={{ width: 400, padding: "32px", pointerEvents: "auto", cursor: "pointer" }}
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
              (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 40px rgba(201,168,76,0.1)";
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
            <p style={{ fontSize: "0.85rem", color: DIM, fontWeight: 300 }}>{project.desc}</p>
          </div>
        </Html>
      </mesh>
    </group>
  );
}

function WorkZone() {
  const cardPositions: [number, number, number][] = [
    [18, 0, -2],
    [22, 2, -6],
    [16, -1, -10],
    [20, 3, -14],
    [15, 0, -18],
  ];
  const cardRotations: [number, number, number][] = [
    [0, -0.4, 0],
    [0, -0.3, 0.05],
    [0, -0.5, -0.03],
    [0, -0.35, 0.02],
    [0, -0.45, -0.05],
  ];

  return (
    <group>
      {/* Section title */}
      <ZoneHtml scrollRange={[0.18, 0.42]} center position={[18, 5, -8]} style={{ pointerEvents: "none", userSelect: "none" }}>
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
      </ZoneHtml>

      {/* Sculptural accent */}
      <Monolith position={[25, 1, -10]} scale={0.5} intensity={0.15} geometry="torusKnot" color="#2a1f3d" />

      {PROJECTS.map((project, i) => (
        <ProjectCard
          key={project.title}
          project={project}
          position={cardPositions[i]}
          rotation={cardRotations[i]}
          index={i}
        />
      ))}
    </group>
  );
}

/* ================================================================
   ABOUT ZONE — Sculptural cathedral (scroll 0.45–0.60)
   ================================================================ */
const SKILLS = [
  "JavaScript", "TypeScript", "React", "Next.js", "Node.js",
  "Swift", "Python", "After Effects", "Premiere Pro",
  "FL Studio", "Blender", "Figma",
];

function AboutZone() {
  return (
    <group position={[0, 7, -30]}>
      {/* Central sculptural form */}
      <Monolith position={[0, 0, 0]} scale={0.8} intensity={0.4} geometry="torus" color="#1f1a30" />

      {/* Surrounding tall structures */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const r = 7;
        return (
          <mesh key={i} position={[Math.cos(angle) * r, -3, Math.sin(angle) * r]}>
            <boxGeometry args={[0.15, 12, 0.15]} />
            <meshStandardMaterial
              color={ACCENT}
              emissive={ACCENT}
              emissiveIntensity={0.5}
              transparent
              opacity={0.15}
              metalness={0.9}
              roughness={0.1}
            />
          </mesh>
        );
      })}

      <ZoneHtml
        scrollRange={[0.43, 0.60]}
        center
        position={[0, -1, -3]}
        style={{ width: "60vw", maxWidth: 700, textAlign: "center", pointerEvents: "none", userSelect: "none" }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
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
            medium. Code is my instrument, pixels are my canvas, sound is my space.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 16 }}>
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
      </ZoneHtml>
    </group>
  );
}

/* ================================================================
   CONTACT ZONE — Convergence point (scroll 0.65–0.80)
   ================================================================ */
function ContactZone() {
  const ringGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.y = time * 0.15;
      ringGroupRef.current.rotation.x = Math.sin(time * 0.3) * 0.1;
    }
  });

  return (
    <group position={[-16, 0, -6]}>
      {/* Converging sculptural rings */}
      <group ref={ringGroupRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[4, 0.02, 16, 100]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.8} transparent opacity={0.4} />
        </mesh>
        <mesh rotation={[Math.PI / 2 + 0.3, 0.2, 0]}>
          <torusGeometry args={[4.5, 0.015, 16, 100]} />
          <meshStandardMaterial color="#8B7355" emissive="#8B7355" emissiveIntensity={0.5} transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 2 - 0.2, -0.1, 0.3]}>
          <torusGeometry args={[5, 0.01, 16, 80]} />
          <meshStandardMaterial color={ACCENT} emissive={ACCENT} emissiveIntensity={0.3} transparent opacity={0.2} />
        </mesh>
      </group>

      {/* Central form */}
      <Monolith position={[0, 0, 0]} scale={0.7} intensity={0.5} geometry="sphere" color="#1a1528" />

      <ZoneHtml
        scrollRange={[0.65, 0.80]}
        center
        position={[0, 0, -4]}
        style={{ width: "100vw", textAlign: "center", pointerEvents: "auto", userSelect: "none" }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
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
              textShadow: "0 0 60px rgba(201,168,76,0.1)",
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
              border: "1px solid rgba(201,168,76,0.3)",
              color: ACCENT,
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
              fontWeight: 300,
              textDecoration: "none",
              transition: "all 0.5s",
              cursor: "pointer",
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
      </ZoneHtml>
    </group>
  );
}

/* ================================================================
   NAVIGATION — Fixed overlay
   ================================================================ */
function Navigation() {
  const scroll = useScroll();
  const navRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    if (!navRef.current) return;
    const t = scroll.offset;
    const links = navRef.current.querySelectorAll("a[data-section]");
    links.forEach((link) => {
      const section = (link as HTMLElement).dataset.section;
      let isActive = false;
      if (section === "work" && t > 0.16 && t < 0.43) isActive = true;
      if (section === "about" && t > 0.43 && t < 0.63) isActive = true;
      if (section === "contact" && t > 0.63 && t < 0.82) isActive = true;
      (link as HTMLElement).style.color = isActive ? ACCENT : DIM;
    });
  });

  return (
    <Html fullscreen style={{ pointerEvents: "none" }} zIndexRange={[9999, 9999]}>
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
   MAIN SCENE — Everything assembled with infinite looping scroll
   ================================================================ */
export function ImmersiveScene() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 10, 20]} intensity={0.5} color="#f5f0e8" />
      <pointLight position={[-15, -3, -15]} intensity={0.25} color="#5a584f" />
      <pointLight position={[0, 8, -30]} intensity={0.3} color={ACCENT} />
      <pointLight position={[-20, 3, -5]} intensity={0.2} color="#8B7355" />
      <pointLight position={[20, 3, -10]} intensity={0.2} color="#8B7355" />
      <spotLight position={[0, 8, 22]} angle={0.5} penumbra={0.8} intensity={0.8} color="#f0e8d8" distance={25} />
      <pointLight position={[0, 3, 20]} intensity={0.6} color="#e8dcc8" />

      <ScrollControls pages={TOTAL_PAGES} infinite damping={0.25}>
        <CameraRig />
        <Navigation />

        {/* The World */}
        <WorldPillars />
        <WorldArchways />
        <FogPlanes />

        {/* Content Zones */}
        <HeroZone />
        <WorkZone />
        <AboutZone />
        <ContactZone />
      </ScrollControls>

      {/* Post-processing */}
      <EffectComposer>
        <Bloom intensity={0.25} luminanceThreshold={0.6} luminanceSmoothing={0.5} mipmapBlur />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={new THREE.Vector2(0.0005, 0.0005)}
        />
        <Vignette offset={0.3} darkness={0.7} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    </>
  );
}
