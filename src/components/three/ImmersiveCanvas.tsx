"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useRef } from "react";
import { Scene } from "./Scene3DWorld";
import { EffectComposer, Bloom, ChromaticAberration, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { scrollState } from "@/lib/scrollState";

/* Drives post-processing intensity — EPIC TRAILER level */
function AudioPostFX() {
  const caRef = useRef<any>(null);
  const bloomRef = useRef<any>(null);
  const vigRef = useRef<any>(null);
  const bloomSmooth = useRef(0.8);
  const caSmooth = useRef(0.001);

  useFrame(() => {
    const beat = scrollState.beat;
    const bass = scrollState.bass;
    const energy = scrollState.energy;

    // BLOOM: massive spike on beat, heavy on energy
    const bloomTarget = 1.0 + energy * 6.0 + (beat ? 8.0 : 0);
    bloomSmooth.current = THREE.MathUtils.lerp(bloomSmooth.current, bloomTarget, beat ? 0.6 : 0.06);
    if (bloomRef.current) {
      bloomRef.current.intensity = bloomSmooth.current;
    }

    // CHROMATIC ABERRATION: dramatic RGB split on bass + beat
    const caTarget = bass * 0.018 + (beat ? 0.04 : 0);
    caSmooth.current = THREE.MathUtils.lerp(caSmooth.current, caTarget, beat ? 0.6 : 0.08);
    if (caRef.current) {
      caRef.current.offset = new THREE.Vector2(caSmooth.current, caSmooth.current * 0.6);
    }

    // VIGNETTE: heavy tunnel vision on beat
    if (vigRef.current) {
      vigRef.current.darkness = 0.5 + energy * 0.6 + (beat ? 0.5 : 0);
    }
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        ref={bloomRef}
        luminanceThreshold={0.15}
        luminanceSmoothing={0.4}
        intensity={0.8}
        mipmapBlur
      />
      <ChromaticAberration
        ref={caRef}
        blendFunction={BlendFunction.NORMAL}
        offset={new THREE.Vector2(0.001, 0.001)}
      />
      <Vignette ref={vigRef} eskil={false} offset={0.15} darkness={0.5} />
    </EffectComposer>
  );
}

export default function ImmersiveCanvas() {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "fixed",
        inset: 0,
        zIndex: 0,
        background: "#050508",
      }}
    >
      <Canvas
        camera={{ position: [0, 1.5, 12], fov: 55, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
        }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <Scene />
          <AudioPostFX />
        </Suspense>
      </Canvas>
    </div>
  );
}
