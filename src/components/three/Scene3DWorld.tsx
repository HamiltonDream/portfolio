"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { scrollState } from "@/lib/scrollState";
import * as THREE from "three";

/* ═══ SECTION COLORS — each section has its own vibe ═══ */
const SECTION_COLORS: [number, string][] = [
  [0.0, "#00D4FF"],   // hero — cyan
  [0.15, "#00D4FF"],
  [0.22, "#10B981"],  // project 1
  [0.30, "#3B82F6"],  // project 2
  [0.38, "#7C3AED"],  // project 3
  [0.46, "#7C3AED"],  // undiscovered
  [0.54, "#F59E0B"],  // motion reel
  [0.65, "#A855F7"],  // about — purple
  [0.80, "#EC4899"],  // contact — pink
  [1.0, "#00D4FF"],   // loop back
];

function getAccentColor(p: number): THREE.Color {
  const clamped = THREE.MathUtils.clamp(p, 0, 1);
  let i = 0;
  for (let j = 0; j < SECTION_COLORS.length - 1; j++) {
    if (clamped >= SECTION_COLORS[j][0] && clamped <= SECTION_COLORS[j + 1][0]) { i = j; break; }
    if (j === SECTION_COLORS.length - 2) i = j;
  }
  const [t0, c0] = SECTION_COLORS[i];
  const [t1, c1] = SECTION_COLORS[Math.min(i + 1, SECTION_COLORS.length - 1)];
  const range = t1 - t0 || 1;
  const t = THREE.MathUtils.clamp((clamped - t0) / range, 0, 1);
  return new THREE.Color(c0).lerp(new THREE.Color(c1), t);
}

/* ═══ CAMERA PATH — cinematic fly-through ═══
   [progress, x, y, z, lookX, lookY, lookZ] */
const CAM: [number, number, number, number, number, number, number][] = [
  [0.00,  0,  1.5,  12,    0,  1.5,  0],
  [0.10,  0,  1.5,   6,    0,  1.5, -2],
  [0.18,  2,  2.0,   0,   -1,  1.5, -6],
  [0.26, -1,  1.5,  -6,    1,  2.0,-12],
  [0.34,  2,  2.5, -12,   -1,  1.5,-18],
  [0.42, -2,  1.5, -18,    1,  2.0,-24],
  [0.50,  0,  3.0, -24,    0,  1.5,-30],
  [0.58,  2,  1.5, -30,   -1,  2.5,-36],
  [0.66, -1,  2.0, -36,    1,  1.5,-42],
  [0.74,  0,  2.5, -42,    0,  2.0,-48],
  [0.82,  1,  1.5, -48,   -1,  2.0,-54],
  [0.90,  0,  2.0, -54,    0,  1.5,-58],
  [1.00,  0,  2.0, -58,    0,  2.0,-62],
];

function lerpCam(progress: number) {
  const p = THREE.MathUtils.clamp(progress, 0, 1);
  let i = 0;
  for (let j = 0; j < CAM.length - 1; j++) {
    if (p >= CAM[j][0] && p <= CAM[j + 1][0]) { i = j; break; }
    if (j === CAM.length - 2) i = j;
  }
  const k0 = CAM[i];
  const k1 = CAM[Math.min(i + 1, CAM.length - 1)];
  const range = k1[0] - k0[0] || 1;
  const t = THREE.MathUtils.clamp((p - k0[0]) / range, 0, 1);
  const e = t * t * (3 - 2 * t); // smoothstep
  const l = THREE.MathUtils.lerp;
  return {
    pos: new THREE.Vector3(l(k0[1], k1[1], e), l(k0[2], k1[2], e), l(k0[3], k1[3], e)),
    look: new THREE.Vector3(l(k0[4], k1[4], e), l(k0[5], k1[5], e), l(k0[6], k1[6], e)),
  };
}

/* ═══ CAMERA CONTROLLER — EPIC TRAILER with heavy shake, FOV slams, roll tilts ═══ */
function CameraController() {
  const { camera } = useThree();
  const pos = useRef(new THREE.Vector3(0, 1.5, 12));
  const look = useRef(new THREE.Vector3(0, 1.5, 0));
  const mouse = useRef({ x: 0, y: 0 });
  const ready = useRef(false);
  const shakeOffset = useRef(new THREE.Vector3());
  const rollAngle = useRef(0);
  const fovSmooth = useRef(55);

  useFrame(({ pointer, clock }) => {
    const target = lerpCam(scrollState.progress);
    mouse.current.x = THREE.MathUtils.lerp(mouse.current.x, pointer.x, 0.03);
    mouse.current.y = THREE.MathUtils.lerp(mouse.current.y, pointer.y, 0.03);

    const px = mouse.current.x * 0.4;
    const py = mouse.current.y * 0.2;

    const bass = scrollState.bass;
    const beat = scrollState.beat;
    const energy = scrollState.energy;
    const t = clock.getElapsedTime();

    // HEAVY camera shake — cinematic handheld feel
    const shakeAmt = bass * 0.35 + (beat ? 0.6 : 0) + energy * 0.1;
    shakeOffset.current.set(
      (Math.random() - 0.5) * shakeAmt,
      (Math.random() - 0.5) * shakeAmt * 0.7,
      (Math.random() - 0.5) * shakeAmt * 0.4
    );

    // DRAMATIC FOV slam — punch in on beat, wide on drops
    const fovTarget = 55 + energy * 12 - (beat ? 18 : 0);
    fovSmooth.current = THREE.MathUtils.lerp(fovSmooth.current, fovTarget, beat ? 0.5 : 0.06);
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = fovSmooth.current;
    cam.updateProjectionMatrix();

    // Roll tilt — cinematic dutch angle on energy
    const rollTarget = Math.sin(t * 0.7) * energy * 0.12 + (beat ? (Math.random() - 0.5) * 0.25 : 0);
    rollAngle.current = THREE.MathUtils.lerp(rollAngle.current, rollTarget, 0.08);

    if (!ready.current) {
      pos.current.copy(target.pos);
      look.current.copy(target.look);
      ready.current = true;
    } else {
      // Speed ramp: SNAP on beat (trailer cut), crawl otherwise (slow-mo)
      const lerpSpeed = scrollState.audioActive
        ? (beat ? 0.25 : 0.02 + energy * 0.03)
        : 0.05;
      pos.current.lerp(
        new THREE.Vector3(
          target.pos.x + px + shakeOffset.current.x,
          target.pos.y + py + shakeOffset.current.y,
          target.pos.z + shakeOffset.current.z
        ),
        lerpSpeed
      );
      look.current.lerp(target.look, lerpSpeed);
    }

    camera.position.copy(pos.current);
    camera.lookAt(look.current);
    // Apply roll
    camera.rotateZ(rollAngle.current);
  });

  return null;
}

/* ═══ SCROLL HANDLER ═══ */
function ScrollHandler() {
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollState.scroll = THREE.MathUtils.clamp(scrollState.scroll + e.deltaY * 0.0003, 0, 1);
    };
    let ty = 0;
    const onTS = (e: TouchEvent) => { ty = e.touches[0].clientY; };
    const onTM = (e: TouchEvent) => {
      e.preventDefault();
      const dy = ty - e.touches[0].clientY;
      ty = e.touches[0].clientY;
      scrollState.scroll = THREE.MathUtils.clamp(scrollState.scroll + dy * 0.0008, 0, 1);
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTS, { passive: true });
    window.addEventListener("touchmove", onTM, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTS);
      window.removeEventListener("touchmove", onTM);
    };
  }, []);

  useFrame((_, delta) => {
    // Auto-advance when audio is active — epic trailer cruise with energy-driven speed
    if (scrollState.audioActive && scrollState.scroll < 1) {
      const speed = 0.02 + scrollState.energy * 0.04 + (scrollState.beat ? 0.02 : 0);
      scrollState.scroll = Math.min(scrollState.scroll + speed * delta, 1);
    }
    scrollState.progress = THREE.MathUtils.lerp(scrollState.progress, scrollState.scroll, 0.06);
  });

  return null;
}

/* ═══ TUNNEL RING — procedural glowing ring ═══ */
const RING_VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const RING_FRAG = `
uniform float uTime;
uniform vec3 uColor;
uniform float uProximity;
uniform float uBass;
uniform float uBeat;
varying vec2 vUv;
void main() {
  float glow = pow(1.0 - abs(vUv.y - 0.5) * 2.0, 2.5);
  float pulse = 0.7 + sin(uTime * 3.0 + vUv.x * 6.28) * 0.3;
  // Beat: flash to white-hot
  float beatFlash = 1.0 + uBeat * 4.0;
  float alpha = glow * pulse * uProximity * 0.8 * (1.0 + uBass * 3.0) * beatFlash;
  // Color shift: push toward white on beat for strobe
  vec3 col = mix(uColor * (2.0 + uBass * 4.0), vec3(1.0), uBeat * 0.7);
  gl_FragColor = vec4(col, min(alpha, 1.0));
}`;

function TunnelRing({ z, baseColor }: { z: number; baseColor: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(baseColor) },
      uProximity: { value: 0 },
      uBass: { value: 0 },
      uBeat: { value: 0 },
    },
    vertexShader: RING_VERT,
    fragmentShader: RING_FRAG,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [baseColor]);

  useFrame(({ clock, camera }) => {
    const dist = Math.abs(camera.position.z - z);
    mat.uniforms.uTime.value = clock.getElapsedTime();
    mat.uniforms.uProximity.value = THREE.MathUtils.smoothstep(dist, 20, 3);
    mat.uniforms.uBass.value = scrollState.bass;
    mat.uniforms.uBeat.value = scrollState.beat ? 1.0 : 0.0;
    mat.uniforms.uColor.value.copy(getAccentColor(scrollState.progress));
    // EXPLOSIVE ring scale on bass — rings BREATHE with the music
    if (ref.current) {
      const s = 1 + scrollState.bass * 1.2 + (scrollState.beat ? 0.8 : 0);
      ref.current.scale.setScalar(s);
    }
  });

  return (
    <mesh ref={ref} position={[0, 1.5, z]} rotation={[0, 0, Math.PI / 2]} material={mat}>
      <torusGeometry args={[4.5, 0.05, 16, 64]} />
    </mesh>
  );
}

/* ═══ LIGHT BEAM — vertical accent line ═══ */
const BEAM_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const BEAM_FRAG = `
uniform vec3 uColor; uniform float uProximity; uniform float uEnergy; uniform float uBeat;
varying vec2 vUv;
void main(){
  float core = pow(1.0 - abs(vUv.x - 0.5) * 2.0, 6.0);
  float fade = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
  // STROBE: full intensity blast on beat
  float intensity = (1.0 + uEnergy * 5.0 + uBeat * 6.0);
  vec3 col = mix(uColor * 3.0, vec3(1.0), uBeat * 0.5);
  gl_FragColor = vec4(col * intensity, core * fade * uProximity * 0.5 * intensity);
}`;

function LightBeam({ position: p, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null!);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uProximity: { value: 0 },
      uEnergy: { value: 0 },
      uBeat: { value: 0 },
    },
    vertexShader: BEAM_VERT,
    fragmentShader: BEAM_FRAG,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [color]);

  useFrame(({ camera }) => {
    const dist = Math.abs(camera.position.z - p[2]);
    mat.uniforms.uProximity.value = THREE.MathUtils.smoothstep(dist, 25, 4);
    mat.uniforms.uEnergy.value = scrollState.energy;
    mat.uniforms.uBeat.value = scrollState.beat ? 1.0 : 0.0;
    mat.uniforms.uColor.value.copy(getAccentColor(scrollState.progress));
    // Beam width EXPLOSION on energy + beat scale spike
    if (ref.current) {
      ref.current.scale.x = 1 + scrollState.energy * 6.0 + (scrollState.beat ? 5.0 : 0);
      ref.current.scale.y = 1 + scrollState.bass * 0.5;
    }
  });

  return (
    <mesh ref={ref} position={p} material={mat}>
      <planeGeometry args={[0.15, 10]} />
    </mesh>
  );
}

/* ═══ FLOATING DIAMOND — procedural geometric accent ═══ */
function FloatingDiamond({ position: p, size = 0.3 }: { position: [number, number, number]; size?: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#00D4FF") },
    },
    vertexShader: `
      varying vec3 vNormal; varying vec3 vViewPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform float uTime; uniform vec3 uColor;
      varying vec3 vNormal; varying vec3 vViewPos;
      void main() {
        vec3 v = normalize(vViewPos);
        float rim = 1.0 - max(dot(v, normalize(vNormal)), 0.0);
        rim = pow(rim, 1.8);
        float pulse = 0.7 + sin(uTime * 2.0) * 0.3;
        vec3 col = uColor * 0.15 + uColor * rim * pulse * 2.0;
        gl_FragColor = vec4(col, 0.3 + rim * 0.7);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  const offset = useMemo(() => Math.random() * 100, []);

  useFrame(({ clock, camera }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    // WILD spin — accelerates with energy, snaps on beat
    const spinMult = 1 + scrollState.energy * 8;
    ref.current.rotation.x = t * 0.5 * spinMult + offset + (scrollState.beat ? Math.PI * 0.7 : 0);
    ref.current.rotation.y = t * 0.3 * spinMult + offset + (scrollState.beat ? Math.PI * 0.4 : 0);
    ref.current.position.y = p[1] + Math.sin(t * 0.8 + offset) * 0.4 + scrollState.bass * 1.2;

    const dist = Math.abs(camera.position.z - p[2]);
    const baseScale = THREE.MathUtils.smoothstep(dist, 30, 5) * size;
    // EXPLOSIVE treble pulse — diamonds POP on highs + beat
    const treblePulse = 1 + scrollState.treble * 2.5 + (scrollState.beat ? 2.0 : 0);
    ref.current.scale.setScalar(baseScale * treblePulse);

    mat.uniforms.uTime.value = t;
    mat.uniforms.uColor.value.copy(getAccentColor(scrollState.progress));
  });

  return (
    <mesh ref={ref} position={p} material={mat}>
      <octahedronGeometry args={[1, 0]} />
    </mesh>
  );
}

/* ═══ PARTICLES — star field that follows the camera ═══ */
function StarField() {
  const ref = useRef<THREE.Points>(null!);
  const count = 2500;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = Math.random() * 15 - 3;
      pos[i * 3 + 2] = -Math.random() * 80;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const matRef = useRef<THREE.PointsMaterial>(null!);

  useFrame(() => {
    if (matRef.current) {
      matRef.current.color.copy(getAccentColor(scrollState.progress));
      // EXPLOSIVE particle burst on beats
      matRef.current.size = 0.05 + scrollState.energy * 0.25 + (scrollState.beat ? 0.35 : 0);
      matRef.current.opacity = 0.5 + scrollState.energy * 0.5;
    }
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        ref={matRef}
        color="#00D4FF"
        size={0.03}
        transparent
        opacity={0.4}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ═══ FLOOR ═══ */
const FLOOR_VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FLOOR_FRAG = `
uniform vec3 uColor; uniform float uTime; uniform float uBass; uniform float uBeat;
varying vec2 vUv;
void main(){
  float gridX = step(0.97, fract(vUv.x * 40.0));
  float gridY = step(0.97, fract(vUv.y * 40.0));
  float grid = max(gridX, gridY) * 0.2;
  float center = 1.0 - length(vUv - 0.5) * 1.2;
  center = max(center, 0.0);
  float pulse = 0.6 + sin(uTime * 0.5) * 0.1;
  // MASSIVE bass shockwave + beat strobe
  float bassGlow = 1.0 + uBass * 8.0 + uBeat * 5.0;
  // Scan line on beat — horizontal wipe
  float scanLine = smoothstep(0.0, 0.02, abs(vUv.y - fract(uTime * 0.3))) * uBeat;
  vec3 baseCol = uColor * grid * center * pulse * bassGlow;
  vec3 scan = vec3(1.0) * scanLine * 0.3;
  gl_FragColor = vec4(baseCol + scan + vec3(0.02, 0.02, 0.04), 1.0);
}`;

function Floor() {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color("#00D4FF") },
      uTime: { value: 0 },
      uBass: { value: 0 },
      uBeat: { value: 0 },
    },
    vertexShader: FLOOR_VERT,
    fragmentShader: FLOOR_FRAG,
  }), []);

  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.getElapsedTime();
    mat.uniforms.uBass.value = scrollState.bass;
    mat.uniforms.uBeat.value = scrollState.beat ? 1.0 : 0.0;
    mat.uniforms.uColor.value.copy(getAccentColor(scrollState.progress));
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -30]} material={mat}>
      <planeGeometry args={[60, 80]} />
    </mesh>
  );
}

/* ═══ PROJECT PANEL — clean HTML card in 3D space ═══ */
const PROJECT_DATA = [
  { num: "01", title: "Field Ops Management", type: "REACT · FULL STACK · SAAS", color: "#00D4FF", url: "https://www.fieldopsmanagement.com/" },
  { num: "02", title: "Cal Dreamscape", type: "WEB DESIGN · BRANDING", color: "#10B981", url: "https://caldreamscapelandscape.com/" },
  { num: "03", title: "Cookie Tracker", type: "WEB APP · REACT · ANALYTICS", color: "#3B82F6", url: "https://cookietracker.site/" },
  { num: "04", title: "Undiscovered", type: "MUSIC · PRODUCTION · ALBUM", color: "#7C3AED", url: "https://open.spotify.com/album/1rWPihEZtSm2zZKjvjKdvx" },
  { num: "05", title: "Motion Reel", type: "ANIMATION · MOTION · 3D", color: "#F59E0B", url: "https://www.youtube.com/watch?v=eIp-fptOEwA&list=PLK9JwrqTx7UpF1JQ81kpahVNeRLrvZwil" },
];

function ProjectPanel({ position: pos, project, side }: {
  position: [number, number, number];
  project: typeof PROJECT_DATA[0];
  side: "left" | "right";
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const opRef = useRef(0);

  useFrame(({ camera }) => {
    if (!groupRef.current) return;
    const dist = Math.abs(camera.position.z - pos[2]);
    opRef.current = THREE.MathUtils.smoothstep(dist, 16, 2);
    groupRef.current.visible = opRef.current > 0.01;
  });

  const rotY = side === "left" ? 0.2 : -0.2;

  return (
    <group ref={groupRef} position={pos} rotation={[0, rotY, 0]}>
      <Html
        transform
        distanceFactor={5}
        style={{ pointerEvents: "auto", userSelect: "none" }}
      >
        <a
          href={project.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "block",
            width: 280,
            padding: "28px 24px",
            borderRadius: 14,
            border: `1px solid ${project.color}33`,
            background: "rgba(3,3,8,0.88)",
            backdropFilter: "blur(20px)",
            textDecoration: "none",
            color: "#F0F0F8",
            fontFamily: "Inter, system-ui, sans-serif",
            transition: "border-color 0.4s, transform 0.4s",
            transform: "scale(1)",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = project.color + "88"; e.currentTarget.style.transform = "scale(1.03)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = project.color + "33"; e.currentTarget.style.transform = "scale(1)"; }}
        >
          <span style={{ fontSize: "3.2rem", fontWeight: 800, color: project.color, opacity: 0.1, fontFamily: "monospace", display: "block", lineHeight: 1 }}>{project.num}</span>
          <p style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: project.color, marginTop: 10, fontFamily: "monospace", opacity: 0.75 }}>{project.type}</p>
          <h3 style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: 6, letterSpacing: "-0.02em", lineHeight: 1.15 }}>{project.title}</h3>
          <span style={{ display: "inline-block", marginTop: 18, fontSize: "0.5rem", letterSpacing: "0.2em", color: project.color, fontFamily: "monospace", opacity: 0.55 }}>VIEW PROJECT →</span>
        </a>
      </Html>
    </group>
  );
}

/* ═══ BEAT FLASH — full-screen white strobe on hard beats ═══ */
function BeatFlash() {
  const ref = useRef<THREE.Mesh>(null!);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uFlash: { value: 0 } },
    vertexShader: `void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `
      uniform float uFlash;
      void main(){
        gl_FragColor = vec4(1.0, 1.0, 1.0, uFlash);
      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  const flashVal = useRef(0);

  useFrame(() => {
    // Flash spikes on beat, decays fast
    if (scrollState.beat) flashVal.current = 0.5;
    flashVal.current *= 0.82; // rapid decay
    mat.uniforms.uFlash.value = flashVal.current;
  });

  return (
    <mesh ref={ref} renderOrder={999} frustumCulled={false} material={mat}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

/* ═══ SPEED LINES — streaking particles on energy ═══ */
function SpeedLines() {
  const ref = useRef<THREE.Points>(null!);
  const count = 200;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = -Math.random() * 6;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  const matRef = useRef<THREE.PointsMaterial>(null!);

  useFrame(({ camera }) => {
    if (!ref.current) return;
    // Speed lines follow camera, rush forward on energy
    ref.current.position.copy(camera.position);
    ref.current.position.z -= 2;
    if (matRef.current) {
      matRef.current.opacity = scrollState.energy * 0.6 + (scrollState.beat ? 0.4 : 0);
      matRef.current.size = 0.01 + scrollState.energy * 0.05;
    }
  });

  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial
        ref={matRef}
        color="#ffffff"
        size={0.02}
        transparent
        opacity={0}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ═══ SCENE COMPOSITION ═══ */
const RING_POSITIONS = Array.from({ length: 15 }, (_, i) => -i * 4.5);
const BEAM_POSITIONS: [number, number, number][] = [
  [-5, 3, -8], [5, 3, -8],
  [-6, 4, -20], [6, 4, -20],
  [-4, 3, -32], [4, 3, -32],
  [-5, 4, -44], [5, 4, -44],
  [-6, 3, -55], [6, 3, -55],
];
const DIAMOND_POSITIONS: [number, number, number][] = [
  [3, 2.5, -5], [-3, 3, -10], [4, 1.5, -16], [-3.5, 3.5, -22],
  [2, 4, -28], [-4, 2, -34], [3, 3, -40], [-2, 4, -46],
  [4, 2, -52], [-3, 2.5, -57],
];

const PANEL_PLACEMENTS: { pos: [number, number, number]; side: "left" | "right" }[] = [
  { pos: [-3.5, 2.0, -4],  side: "left" },
  { pos: [3.5,  2.2, -11], side: "right" },
  { pos: [-3.5, 2.0, -18], side: "left" },
  { pos: [3.5,  2.2, -24], side: "right" },
  { pos: [-3.5, 2.0, -30], side: "left" },
];

export function Scene() {
  return (
    <>
      <color attach="background" args={["#030308"]} />
      <fog attach="fog" args={["#030308", 5, 40]} />

      <ScrollHandler />
      <CameraController />
      <BeatFlash />
      <SpeedLines />
      <Floor />
      <StarField />

      {RING_POSITIONS.map((z, i) => (
        <TunnelRing key={`ring-${i}`} z={z} baseColor="#00D4FF" />
      ))}
      {BEAM_POSITIONS.map((p, i) => (
        <LightBeam key={`beam-${i}`} position={p} color="#00D4FF" />
      ))}
      {DIAMOND_POSITIONS.map((p, i) => (
        <FloatingDiamond key={`diamond-${i}`} position={p} size={0.25 + (i % 3) * 0.15} />
      ))}
      {PROJECT_DATA.map((proj, i) => (
        <ProjectPanel
          key={`proj-${i}`}
          position={PANEL_PLACEMENTS[i].pos}
          project={proj}
          side={PANEL_PLACEMENTS[i].side}
        />
      ))}
    </>
  );
}
