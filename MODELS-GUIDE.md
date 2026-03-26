# Loading External 3D Models in R3F + Next.js — Technical Report

> For Noah Hamilton's portfolio — React Three Fiber 9.5, drei 10.7, Three.js 0.183, Next.js 16

---

## 1. Model Sources & Loading Strategy

### Option A: CDN-hosted models (no download, instant `useGLTF`)

These can be loaded directly by URL — no `/public` folder needed:

**Three.js GitHub CDN (raw.githubusercontent.com):**
```
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/LittlestTokyo.glb
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/ferrari.glb
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/facecap.glb
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Horse.glb
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Flamingo.glb
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Stork.glb
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Soldier.glb
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/SheenChair.glb
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/IridescenceLamp.glb
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/DragonAttenuation.glb
https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/venice_mask.glb
```

**Best for portfolio hero from CDN:**
- `DamagedHelmet` — iconic sci-fi helmet, great for shader experiments
- `DragonAttenuation` — glass dragon, stunning with transmission material
- `venice_mask` — artistic mask, great for "creative" identity
- `IridescenceLamp` — iridescent material showcase

### Option B: Local `.glb` files in `/public/models/` (RECOMMENDED)

This is the **production-grade approach**. Place files at:
```
public/
  models/
    hero-sculpture.glb
    ...
```

Access them as `/models/hero-sculpture.glb` in code.

**Best free sources for download:**
1. **Sketchfab** (sketchfab.com) — Filter by "Downloadable" + CC license. Search for:
   - "abstract sculpture" 
   - "parametric architecture" 
   - "brutalist object"
   - "futuristic helmet"
   - "art deco object"
2. **Poly Haven** (polyhaven.com/models) — CC0, production quality
3. **Kenney** (kenney.nl) — stylized CC0 assets
4. **gltf.pmnd.rs** — Drag & drop to convert + generate R3F code
5. **Three.js examples** — Download from GitHub, place in `/public/models/`

### Workflow for local files:
```bash
# 1. Download .glb from Sketchfab/PolyHaven
# 2. Optimize it with gltf-transform
npx @gltf-transform/cli optimize input.glb output.glb --compress draco
# 3. Place in public/models/
# 4. Generate R3F component:
npx gltfjsx public/models/hero-sculpture.glb --types --transform
```

---

## 2. Model Recommendations for "Creative Technologist" Hero

### What screams "multidisciplinary creator":

| Concept | Why it works | Vibe |
|---------|-------------|------|
| **Abstract kinetic sculpture** | Mechanical + artistic, like a Calder mobile meets digital art | Engineering + Art |
| **Morphing geometric form** | Polyhedron that fractures and reassembles | Code + Design |
| **Musical instrument deconstruct** | Piano keys, synth knobs, waveforms as 3D objects | Music Production |
| **Architectural fragment** | Brutalist concrete piece, floating impossibly | Architecture + Design |
| **Venetian mask / theatrical mask** | Performance, identity, multifaceted creator | Multidisciplinary |
| **Crystal/gemstone cluster** | Faceted, refractive, catches light beautifully | Premium feel |
| **Camera/lens assembly** | For the editor/animator identity | Motion + Film |
| **Headphones with audio waves** | Music producer identity | HamiltonDream |

### The **KILLER** approach for your stack:

**Hybrid: Load a `.glb` sculpture + apply custom GLSL shaders + scroll-morph it**

Instead of using the model's default materials, you load the **geometry only** and wrap it in your existing custom shader material. This means:
- The model provides complex geometry you can't easily build from primitives
- Your shaders provide the unique visual identity (gold/dark theme, fresnel, noise displacement)
- Scroll drives morph/rotation/displacement intensity
- Mouse drives subtle deformation direction

---

## 3. Animation Techniques for Loaded Models

### 3A. Scroll-Driven Animation

```tsx
import { useGLTF } from "@react-three/drei";
import { useScroll } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

function HeroModel() {
  const { nodes, materials } = useGLTF("/models/sculpture.glb");
  const scroll = useScroll();
  const ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = scroll.offset; // 0 → 1

    // Scroll-driven rotation
    ref.current.rotation.y = t * Math.PI * 2;
    
    // Scroll-driven scale (grow as user scrolls)
    const scale = THREE.MathUtils.lerp(0.5, 1.5, t);
    ref.current.scale.setScalar(scale);
    
    // Scroll-driven position (move along a path)
    ref.current.position.y = Math.sin(t * Math.PI) * 3;
    
    // Scroll-driven material uniforms
    if (materialRef.current) {
      materialRef.current.uniforms.uScroll.value = t;
    }
  });

  return (
    <group ref={ref}>
      <mesh geometry={nodes.Sculpture.geometry}>
        <shaderMaterial ref={materialRef} {...shaderProps} />
      </mesh>
    </group>
  );
}
```

### 3B. Mouse-Reactive Model

```tsx
function MouseReactiveModel() {
  const { nodes } = useGLTF("/models/sculpture.glb");
  const ref = useRef<THREE.Group>(null);
  const mouse = useRef(new THREE.Vector2());

  useFrame((state) => {
    if (!ref.current) return;
    
    // Normalized mouse position (-1 to 1)
    const { x, y } = state.pointer;
    mouse.current.lerp(new THREE.Vector2(x, y), 0.05);
    
    // Rotate model toward mouse
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      mouse.current.x * 0.5,
      0.1
    );
    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      -mouse.current.y * 0.3,
      0.1
    );
    
    // Pass mouse to shader for deformation
    if (materialRef.current) {
      materialRef.current.uniforms.uMouse.value.copy(mouse.current);
    }
  });

  return (
    <group ref={ref}>
      <mesh geometry={nodes.MyMesh.geometry}>
        <myCustomShaderMaterial />
      </mesh>
    </group>
  );
}
```

### 3C. Custom Shaders on Loaded Model Meshes

```tsx
function ShaderedModel() {
  const { nodes } = useGLTF("/models/sculpture.glb");
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2() },
    uScroll: { value: 0 },
    uColor1: { value: new THREE.Color("#c9a84c") },
    uColor2: { value: new THREE.Color("#050507") },
  }), []);

  useFrame(({ clock, pointer }) => {
    if (!materialRef.current) return;
    materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    materialRef.current.uniforms.uMouse.value.lerp(pointer, 0.05);
  });

  return (
    <mesh geometry={nodes.Sculpture.geometry}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
      />
    </mesh>
  );
}
```

### 3D. Morph Targets from a GLB

```tsx
function MorphModel() {
  const { nodes } = useGLTF("/models/facecap.glb");
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current?.morphTargetInfluences) return;
    const t = clock.getElapsedTime();
    
    // Animate morph targets smoothly
    meshRef.current.morphTargetInfluences[0] = Math.sin(t) * 0.5 + 0.5;
    meshRef.current.morphTargetInfluences[1] = Math.cos(t * 0.7) * 0.5 + 0.5;
  });

  return <mesh ref={meshRef} geometry={nodes.Face.geometry} material={nodes.Face.material} />;
}
```

### 3E. Skeletal Animation (Mixamo animations on loaded model)

```tsx
import { useAnimations, useGLTF } from "@react-three/drei";

function AnimatedCharacter() {
  const group = useRef<THREE.Group>(null);
  const { nodes, materials, animations } = useGLTF("/models/character.glb");
  const { actions, mixer } = useAnimations(animations, group);

  useEffect(() => {
    // Play idle animation
    actions["idle"]?.reset().fadeIn(0.5).play();
    return () => { actions["idle"]?.fadeOut(0.5); };
  }, [actions]);

  // Blend between animations based on scroll
  const scroll = useScroll();
  useFrame(() => {
    const t = scroll.offset;
    if (t > 0.3 && actions["wave"]) {
      actions["idle"]?.fadeOut(0.3);
      actions["wave"]?.reset().fadeIn(0.3).play();
    }
  });

  return (
    <group ref={group}>
      <primitive object={nodes.Armature || nodes.Scene} />
    </group>
  );
}
```

---

## 4. Complete Code Patterns

### Pattern 1: Full useGLTF + Custom Shader + Scroll + Mouse

```tsx
"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useScroll } from "@react-three/drei";
import * as THREE from "three";

// ---------- SHADERS ----------
const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uScroll;
uniform vec2 uMouse;
uniform float uHover;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vDisplacement;
varying vec2 vUv;
varying float vFresnel;

// Simplex noise (abbreviated — use your existing snoise from ImmersiveWorld)
// ... paste your snoise function here ...

void main() {
  vUv = uv;
  vec3 pos = position;
  
  // Noise displacement scaled by scroll
  float noiseScale = 0.8 + uScroll * 1.5;
  float n = snoise(pos * noiseScale + uTime * 0.12);
  float displacement = n * (0.05 + uScroll * 0.3);
  
  // Mouse-driven directional push
  vec3 mouseDir = vec3(uMouse.x, uMouse.y, 0.0);
  float mouseDot = dot(normalize(normal), normalize(mouseDir));
  displacement += mouseDot * uHover * 0.15;
  
  vDisplacement = displacement;
  pos += normal * displacement;
  
  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPos = worldPos.xyz;
  vNormal = normalize(normalMatrix * normal);
  
  vec3 viewDir = normalize(cameraPosition - worldPos.xyz);
  vFresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
  
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform float uScroll;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform float uHover;

varying vec3 vNormal;
varying vec3 vWorldPos;
varying float vDisplacement;
varying vec2 vUv;
varying float vFresnel;

void main() {
  // Mix colors based on displacement + fresnel
  vec3 baseColor = mix(uColor2, uColor1, vDisplacement * 3.0 + 0.3);
  
  // Add fresnel glow
  vec3 fresnelColor = uColor1 * 1.5;
  baseColor += fresnelColor * vFresnel * (0.4 + uHover * 0.4);
  
  // Subtle scan lines
  float scanline = sin(vWorldPos.y * 40.0 + uTime * 2.0) * 0.03;
  baseColor += scanline;
  
  // Edge highlight on hover
  float edgeGlow = smoothstep(0.6, 1.0, vFresnel) * uHover;
  baseColor += uColor1 * edgeGlow * 0.5;
  
  gl_FragColor = vec4(baseColor, 0.95);
}
`;

// ---------- COMPONENT ----------
interface HeroSculptureProps {
  position?: [number, number, number];
  scale?: number;
}

export function HeroSculpture({ position = [0, 0, 0], scale = 1 }: HeroSculptureProps) {
  const { nodes } = useGLTF("/models/hero-sculpture.glb");
  const groupRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const scroll = useScroll();
  const mouseSmooth = useRef(new THREE.Vector2());
  const hoverRef = useRef(0);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uHover: { value: 0 },
      uColor1: { value: new THREE.Color("#c9a84c") },
      uColor2: { value: new THREE.Color("#0a0a12") },
    }),
    []
  );

  useFrame(({ clock, pointer }) => {
    if (!groupRef.current || !materialRef.current) return;
    const t = clock.getElapsedTime();
    const s = scroll.offset;

    // Update uniforms
    materialRef.current.uniforms.uTime.value = t;
    materialRef.current.uniforms.uScroll.value = s;
    mouseSmooth.current.lerp(pointer, 0.05);
    materialRef.current.uniforms.uMouse.value.copy(mouseSmooth.current);

    // Smooth hover
    materialRef.current.uniforms.uHover.value = THREE.MathUtils.lerp(
      materialRef.current.uniforms.uHover.value,
      hoverRef.current,
      0.08
    );

    // Idle rotation + scroll-driven spin
    groupRef.current.rotation.y = t * 0.15 + s * Math.PI * 4;
    groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;

    // Mouse-driven tilt
    groupRef.current.rotation.z = THREE.MathUtils.lerp(
      groupRef.current.rotation.z,
      -mouseSmooth.current.x * 0.15,
      0.05
    );

    // Scroll-driven scale
    const dynamicScale = scale * (1 + Math.sin(s * Math.PI) * 0.2);
    groupRef.current.scale.setScalar(dynamicScale);
  });

  // Traverse all meshes in the loaded model and apply our shader
  const meshes = useMemo(() => {
    const result: THREE.Mesh[] = [];
    if (nodes) {
      Object.values(nodes).forEach((node) => {
        if ((node as THREE.Mesh).isMesh) {
          result.push(node as THREE.Mesh);
        }
      });
    }
    return result;
  }, [nodes]);

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerEnter={() => (hoverRef.current = 1)}
      onPointerLeave={() => (hoverRef.current = 0)}
    >
      {meshes.map((mesh, i) => (
        <mesh key={i} geometry={mesh.geometry} castShadow>
          <shaderMaterial
            ref={i === 0 ? materialRef : undefined}
            uniforms={uniforms}
            vertexShader={vertexShader}
            fragmentShader={fragmentShader}
            transparent
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

useGLTF.preload("/models/hero-sculpture.glb");
```

### Pattern 2: Traversing & Replacing Materials on Every Mesh

```tsx
function TraversedModel() {
  const gltf = useGLTF("/models/complex-scene.glb");
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!ref.current) return;
    
    // Replace every mesh's material
    ref.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        
        // Option 1: Custom standard material
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color("#c9a84c"),
          metalness: 0.9,
          roughness: 0.1,
          envMapIntensity: 1.5,
          clearcoat: 1.0,
          clearcoatRoughness: 0.1,
        });
        
        // Option 2: Custom shader material
        // mesh.material = new THREE.ShaderMaterial({
        //   uniforms: { ... },
        //   vertexShader,
        //   fragmentShader,
        // });
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, []);

  return <primitive ref={ref} object={gltf.scene.clone(true)} />;
}
```

### Pattern 3: gltfjsx Generated Component (TypeScript)

Run this in terminal:
```bash
npx gltfjsx public/models/hero-sculpture.glb --types --transform -o src/components/three/HeroModel.tsx
```

This generates a typed component like:
```tsx
import * as THREE from "three";
import { useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { GLTF } from "three-stdlib";

type GLTFResult = GLTF & {
  nodes: {
    Sculpture_Main: THREE.Mesh;
    Sculpture_Detail: THREE.Mesh;
    Sculpture_Base: THREE.Mesh;
  };
  materials: {
    MainMaterial: THREE.MeshStandardMaterial;
    DetailMaterial: THREE.MeshStandardMaterial;
  };
};

export function HeroModel(props: JSX.IntrinsicElements["group"]) {
  const { nodes, materials } = useGLTF(
    "/models/hero-sculpture-transformed.glb"
  ) as GLTFResult;

  return (
    <group {...props} dispose={null}>
      {/* Replace material with custom shader */}
      <mesh
        geometry={nodes.Sculpture_Main.geometry}
        castShadow
      >
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
      <mesh
        geometry={nodes.Sculpture_Detail.geometry}
        material={materials.DetailMaterial}
      />
    </group>
  );
}

useGLTF.preload("/models/hero-sculpture-transformed.glb");
```

### Pattern 4: Scroll-Reactive within ScrollControls

```tsx
// In your Experience.tsx — inside ScrollControls
function SceneContent() {
  return (
    <ScrollControls pages={6} damping={0.3}>
      <CameraRig />
      <ScrollModel />
      {/* ... rest of your zones */}
    </ScrollControls>
  );
}

function ScrollModel() {
  const { nodes } = useGLTF("/models/sculpture.glb");
  const scroll = useScroll();
  const ref = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!ref.current) return;
    const t = scroll.offset;

    // HERO SECTION (0 – 0.16): Model visible, centered, slowly rotating
    if (t < 0.2) {
      const heroT = t / 0.2;
      ref.current.visible = true;
      ref.current.position.set(0, 0, 0);
      ref.current.rotation.y += 0.005;
      ref.current.scale.setScalar(THREE.MathUtils.lerp(1, 1.3, heroT));
      // Fade opacity via material
    }

    // TRANSITION (0.16 – 0.25): Model shrinks and moves aside
    else if (t < 0.25) {
      const transT = (t - 0.2) / 0.05;
      ref.current.position.x = THREE.MathUtils.lerp(0, -5, transT);
      ref.current.scale.setScalar(THREE.MathUtils.lerp(1.3, 0.5, transT));
    }

    // WORK SECTION (0.25+): Model becomes small accent piece
    else {
      ref.current.position.x = -5;
      ref.current.scale.setScalar(0.5);
    }
  });

  return (
    <group ref={ref}>
      <mesh geometry={(Object.values(nodes).find(n => (n as THREE.Mesh).isMesh) as THREE.Mesh)?.geometry}>
        <meshPhysicalMaterial
          color="#c9a84c"
          metalness={0.95}
          roughness={0.05}
          envMapIntensity={2}
        />
      </mesh>
    </group>
  );
}
```

---

## 5. Specific Model Recommendations

### Tier 1: Direct CDN URLs (load with useGLTF immediately)

| Model | URL | Why |
|-------|-----|-----|
| **Damaged Helmet** | `https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/DamagedHelmet/glTF/DamagedHelmet.gltf` | Sci-fi, detailed, great shader target |
| **Venice Mask** | `https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/venice_mask.glb` | Artistic, theatrical, "multidisciplinary" vibe |
| **Dragon Attenuation** | `https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/DragonAttenuation.glb` | Glass dragon — transmission/refraction |
| **Iridescence Lamp** | `https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/IridescenceLamp.glb` | Iridescent material, artistic object |
| **Nefertiti** | `https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Nefertiti/Nefertiti.glb` | Classic bust — screams "art + tech" |
| **Lee Perry Smith** | `https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/LeePerrySmith/LeePerrySmith.glb` | Photorealistic head scan — SSS showcase |
| **Shader Ball** | `https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/ShaderBall.glb` | Perfect for showing off custom shaders |
| **AnimatedMorphSphere** | `https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/AnimatedMorphSphere/AnimatedMorphSphere.glb` | Has morph targets, great for organic animation |

### Tier 2: Sketchfab Downloads (CC licensed, need `/public/models/`)

Search these terms on Sketchfab with "Downloadable" filter:
- **"abstract sculpture printable"** — clean geometric forms
- **"zaha hadid architecture"** — parametric/organic architecture
- **"kinetic sculpture"** — moving art pieces
- **"brutalist concrete"** — heavy, architectural feel
- **"futuristic helmet concept"** — sci-fi creative tech vibe
- **"audio visualizer 3d"** — music producer identity
- **"geometric crystal"** — faceted, refractive art objects

### Tier 3: Build Procedurally + Load Hybrid

The most impressive approach: **use a loaded model as the BASE geometry, then deform it with your existing GLSL noise shaders.** This gives you:
1. Complex topology from a modeled asset (impossible to achieve with SphereGeometry alone)
2. Your unique shader identity (the gold/dark fresnel aesthetic)
3. Interactivity (mouse + scroll driving displacement intensity)

---

## 6. Integration Into Your Existing Architecture

Your current stack in `Experience.tsx` uses:
- `ScrollControls` with `TOTAL_PAGES = 6`
- `CameraRig` following a CatmullRomCurve3 path
- Section zones (Hero, Work, About, Contact)
- Custom GLSL shaders in `Sculpture.tsx` and `ImmersiveWorld.tsx`

### Drop-in integration path:

```tsx
// Experience.tsx — Add to SceneContent
import { Suspense } from "react";
import { HeroSculpture } from "./HeroSculpture";

function SceneContent() {
  return (
    <ScrollControls pages={TOTAL_PAGES} damping={0.3}>
      <CameraRig />
      <StarField />
      <FloatingOrbs />
      
      {/* NEW: Loaded model with custom shader, replacing HeroZone sphere */}
      <Suspense fallback={null}>
        <HeroSculpture position={[0, 0, 0]} scale={2} />
      </Suspense>
      
      <WorkZone />
      <AboutZone />
      <ContactZone />
      <PostEffects />
    </ScrollControls>
  );
}
```

### Key Next.js considerations:

1. **`"use client"`** — All R3F components must be client components
2. **Suspense boundary** — Always wrap `useGLTF` components in `<Suspense>`
3. **Preloading** — Call `useGLTF.preload()` at module level to start loading early
4. **File size** — Keep `.glb` files under 5MB for fast loads; use Draco compression
5. **`useGLTF` with Draco** — Enabled by default in drei 10.7, uses CDN decoder

---

## 7. Performance Optimization

```tsx
// Preload models as early as possible
useGLTF.preload("/models/hero-sculpture.glb");

// Use Suspense with a loading indicator
import { useProgress, Html } from "@react-three/drei";

function Loader() {
  const { progress } = useProgress();
  return <Html center><span style={{ color: "#c9a84c" }}>{progress.toFixed(0)}%</span></Html>;
}

// In Canvas:
<Suspense fallback={<Loader />}>
  <HeroSculpture />
</Suspense>

// Optimize with gltf-transform before shipping:
// npx @gltf-transform/cli optimize hero.glb hero-opt.glb --compress draco --texture-compress webp
```

---

## 8. Verdict & Recommendation

**For maximum visual impact in your portfolio:**

1. **Download the Damaged Helmet or Nefertiti bust** from Three.js examples
2. **Place in `/public/models/`** (production reliability > CDN)
3. **Run `gltfjsx`** to generate a typed React component
4. **Strip all default materials**, replace with your existing gold/dark GLSL shader from `ImmersiveWorld.tsx`
5. **Wire scroll offset** to displacement intensity — model starts smooth, becomes organic/fractured as user scrolls
6. **Wire mouse position** to rotation + directional displacement
7. **Add `<Float>` wrapper** from drei for idle secondary motion
8. **Bloom post-processing** on the fresnel edges

This hybrid approach (loaded geometry + procedural shaders + interactive animation) is exactly what award-winning sites like paodao.fr use — the geometry is authored, but the material and motion are entirely code-driven.
