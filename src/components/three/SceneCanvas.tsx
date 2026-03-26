"use client";

import { Canvas } from "@react-three/fiber";
import { PortfolioScene } from "./Sculpture";

export default function SceneCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45, near: 0.1, far: 100 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
      }}
      dpr={[1, 1.5]}
      style={{ background: "transparent" }}
    >
      <PortfolioScene />
    </Canvas>
  );
}
