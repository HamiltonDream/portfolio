"use client";

import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { useFBX } from "@react-three/drei";
import { scrollState } from "@/lib/scrollState";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════
   LAPTOP BODY — rim-light shader (edge glow, visible without lights)
   ═══════════════════════════════════════════════════════════════ */
const BODY_VERT = `
varying vec3 vNormal;
varying vec3 vViewPos;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`;

const BODY_FRAG = `
uniform vec3 uBase;
uniform vec3 uRim;
uniform float uTime;
varying vec3 vNormal;
varying vec3 vViewPos;
void main() {
  vec3 view = normalize(vViewPos);
  vec3 n = normalize(vNormal);
  float rim = 1.0 - max(dot(view, n), 0.0);
  rim = pow(rim, 1.6);
  float pulse = 0.85 + sin(uTime * 1.5) * 0.15;
  vec3 col = uBase + uRim * rim * pulse * 2.5;
  col += uRim * 0.06;
  gl_FragColor = vec4(col, 1.0);
}`;

/* ═══════════════════════════════════════════════════════════════
   HOLOGRAPHIC SCREEN — data rain + scanlines + glitch
   ═══════════════════════════════════════════════════════════════ */
const SCREEN_VERT = `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`;

const SCREEN_FRAG = `
uniform float uTime;
uniform float uOpen;
uniform vec3 uAccent;
varying vec2 vUv;
float rand(vec2 s){return fract(sin(dot(s,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 uv = vUv;
  vec3 col = uAccent * 0.6 + uAccent * 0.4 * uv.y;
  col *= sin(uv.y * 150.0 + uTime * 3.0) * 0.08 + 0.92;
  float codeX = floor(uv.x * 20.0);
  float codeY = fract(uv.y + uTime * (rand(vec2(codeX, 0.0)) * 2.0 + 0.5) * 0.2 + rand(vec2(codeX, 1.0)));
  col += smoothstep(0.0, 0.3, codeY) * smoothstep(1.0, 0.5, codeY) * uAccent * 0.25 * step(0.6, rand(vec2(codeX, 2.0)));
  float glitchY = floor(uv.y * 30.0 + uTime * 2.0);
  col += step(0.96, rand(vec2(glitchY, floor(uTime * 6.0)))) * vec3(0.3, 0.1, 0.5);
  col *= 0.8 + sin(uTime * 2.0) * 0.2;
  float eX = smoothstep(0.0, 0.06, uv.x) * smoothstep(1.0, 0.94, uv.x);
  float eY = smoothstep(0.0, 0.06, uv.y) * smoothstep(1.0, 0.94, uv.y);
  gl_FragColor = vec4(col, uOpen * 0.9 * eX * eY);
}`;

/* accent colors per project */
const PROJECT_COLORS = ["#00D4FF", "#10B981", "#3B82F6", "#7C3AED", "#F59E0B"];

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function Laptop3D() {
  const fbx = useFBX("/models/laptop/Lowpoly_Notebook_2.fbx");
  const group = useRef<THREE.Group>(null!);
  const mixer = useRef<THREE.AnimationMixer | null>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const open = useRef(0);
  const currentColor = useRef(new THREE.Color("#00D4FF"));
  const targetColor = useRef(new THREE.Color("#00D4FF"));

  /* body material — rim-light shader */
  const bodyMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uBase: { value: new THREE.Color("#1e1e48") },
      uRim: { value: new THREE.Color("#00D4FF") },
      uTime: { value: 0 },
    },
    vertexShader: BODY_VERT,
    fragmentShader: BODY_FRAG,
  }), []);

  /* screen material — holographic */
  const screenMat = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpen: { value: 0 },
      uAccent: { value: new THREE.Color("#00D4FF") },
    },
    vertexShader: SCREEN_VERT,
    fragmentShader: SCREEN_FRAG,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), []);

  /* model clone — apply body shader */
  const model = useMemo(() => {
    const clone = fbx.clone();
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = bodyMat;
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
    return clone;
  }, [fbx, bodyMat]);

  /* animation mixer */
  useEffect(() => {
    if (fbx.animations?.length) {
      const m = new THREE.AnimationMixer(model);
      mixer.current = m;
      const action = m.clipAction(fbx.animations[0]);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.timeScale = 0;
      action.play();
    }
  }, [fbx, model]);

  useFrame(({ clock, pointer }) => {
    if (!group.current) return;
    const t = clock.getElapsedTime();
    const scroll = scrollState.scroll;
    const progress = scrollState.progress;

    /* mouse */
    mouse.current.x = THREE.MathUtils.lerp(mouse.current.x, pointer.x, 0.03);
    mouse.current.y = THREE.MathUtils.lerp(mouse.current.y, pointer.y, 0.03);

    /* lid opening (first 15% of scroll) */
    const lidTarget = THREE.MathUtils.clamp(scroll / 0.15, 0, 1);
    open.current = THREE.MathUtils.lerp(open.current, lidTarget, 0.05);

    if (mixer.current && fbx.animations.length) {
      mixer.current.setTime(open.current * fbx.animations[0].duration);
    }

    /* dramatic floating */
    const floatY = Math.sin(t * 0.8) * 0.08 + Math.sin(t * 1.6) * 0.04;
    const tiltX = Math.sin(t * 0.5) * 0.04 + mouse.current.y * 0.08;
    const tiltZ = Math.cos(t * 0.7) * 0.025;
    const breathScale = 1.0 + Math.sin(t * 1.2) * 0.008;

    group.current.position.y = 0.8 + floatY;
    group.current.rotation.x = tiltX;
    group.current.rotation.y = mouse.current.x * 0.12 + Math.sin(t * 0.3) * 0.04;
    group.current.rotation.z = tiltZ;
    group.current.scale.setScalar(0.9 * breathScale);

    /* accent color based on section */
    if (progress >= 0.2 && progress < 0.6) {
      const wp = THREE.MathUtils.clamp((progress - 0.2) / 0.4, 0, 0.999);
      const idx = Math.floor(wp * PROJECT_COLORS.length);
      targetColor.current.set(PROJECT_COLORS[idx]);
    } else if (progress >= 0.6 && progress < 0.8) {
      targetColor.current.set("#7C3AED");
    } else {
      targetColor.current.set("#00D4FF");
    }
    currentColor.current.lerp(targetColor.current, 0.04);

    /* update all shader uniforms */
    bodyMat.uniforms.uTime.value = t;
    bodyMat.uniforms.uRim.value.copy(currentColor.current);

    screenMat.uniforms.uTime.value = t;
    screenMat.uniforms.uOpen.value = open.current;
    screenMat.uniforms.uAccent.value.copy(currentColor.current);
  });

  return (
    <group ref={group} position={[0, 0.8, 0]} scale={0.9}>
      <primitive object={model} />

      {/* holographic screen */}
      <mesh position={[0, 0.35, -0.15]} rotation={[-0.3, 0, 0]} material={screenMat}>
        <planeGeometry args={[0.72, 0.48]} />
      </mesh>
    </group>
  );
}
