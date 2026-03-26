"use client";

import { useEffect, useRef, useCallback } from "react";

interface SplashCursorProps {
  SIM_RESOLUTION?: number;
  DYE_RESOLUTION?: number;
  DENSITY_DISSIPATION?: number;
  VELOCITY_DISSIPATION?: number;
  PRESSURE?: number;
  CURL?: number;
  SPLAT_RADIUS?: number;
  SPLAT_FORCE?: number;
  COLOR_UPDATE_SPEED?: number;
}

export default function SplashCursor({
  SIM_RESOLUTION = 128,
  DYE_RESOLUTION = 1024,
  DENSITY_DISSIPATION = 3.5,
  VELOCITY_DISSIPATION = 2,
  PRESSURE = 0.1,
  CURL = 3,
  SPLAT_RADIUS = 0.2,
  SPLAT_FORCE = 6000,
  COLOR_UPDATE_SPEED = 10,
}: SplashCursorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const getWebGLContext = useCallback((canvas: HTMLCanvasElement) => {
    const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };
    const gl = canvas.getContext("webgl2", params) as WebGL2RenderingContext | null
      || canvas.getContext("webgl", params) as WebGLRenderingContext | null;
    if (!gl) return null;

    const isWebGL2 = gl instanceof WebGL2RenderingContext;
    let halfFloat: OES_texture_half_float | null = null;
    let supportLinearFiltering: OES_texture_half_float_linear | null = null;

    if (!isWebGL2) {
      halfFloat = gl.getExtension("OES_texture_half_float");
      supportLinearFiltering = gl.getExtension("OES_texture_half_float_linear");
    } else {
      gl.getExtension("EXT_color_buffer_float");
      supportLinearFiltering = gl.getExtension("OES_texture_float_linear");
    }

    gl.clearColor(0, 0, 0, 0);

    const halfFloatTexType = isWebGL2
      ? (gl as WebGL2RenderingContext).HALF_FLOAT
      : halfFloat ? halfFloat.HALF_FLOAT_OES : gl.UNSIGNED_BYTE;

    const formatRGBA = getSupportedFormat(gl, isWebGL2 ? (gl as WebGL2RenderingContext).RGBA16F : gl.RGBA, gl.RGBA, halfFloatTexType);
    const formatRG = getSupportedFormat(gl, isWebGL2 ? (gl as WebGL2RenderingContext).RG16F : gl.RGBA, isWebGL2 ? (gl as WebGL2RenderingContext).RG : gl.RGBA, halfFloatTexType);
    const formatR = getSupportedFormat(gl, isWebGL2 ? (gl as WebGL2RenderingContext).R16F : gl.RGBA, isWebGL2 ? (gl as WebGL2RenderingContext).RED : gl.RGBA, halfFloatTexType);

    return { gl, isWebGL2, halfFloatTexType, formatRGBA, formatRG, formatR, supportLinearFiltering };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = getWebGLContext(canvas);
    if (!ctx) return;

    const { gl, isWebGL2, halfFloatTexType, formatRGBA, formatRG, formatR, supportLinearFiltering } = ctx;

    function resizeCanvas() {
      if (!canvas) return;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    resizeCanvas();

    class GLProgram {
      uniforms: Record<string, WebGLUniformLocation | null> = {};
      program: WebGLProgram;
      constructor(vertexShader: WebGLShader, fragmentShader: WebGLShader) {
        this.program = gl.createProgram()!;
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        const uniformCount = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        for (let i = 0; i < uniformCount; i++) {
          const info = gl.getActiveUniform(this.program, i);
          if (info) this.uniforms[info.name] = gl.getUniformLocation(this.program, info.name);
        }
      }
      bind() { gl.useProgram(this.program); }
    }

    function compileShader(type: number, source: string) {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    const baseVertexShader = compileShader(gl.VERTEX_SHADER,
      isWebGL2
        ? `#version 300 es
           precision highp float;
           in vec2 aPosition;
           out vec2 vUv;
           out vec2 vL;
           out vec2 vR;
           out vec2 vT;
           out vec2 vB;
           uniform vec2 texelSize;
           void main () {
             vUv = aPosition * 0.5 + 0.5;
             vL = vUv - vec2(texelSize.x, 0.0);
             vR = vUv + vec2(texelSize.x, 0.0);
             vT = vUv + vec2(0.0, texelSize.y);
             vB = vUv - vec2(0.0, texelSize.y);
             gl_Position = vec4(aPosition, 0.0, 1.0);
           }`
        : `precision highp float;
           attribute vec2 aPosition;
           varying vec2 vUv;
           varying vec2 vL;
           varying vec2 vR;
           varying vec2 vT;
           varying vec2 vB;
           uniform vec2 texelSize;
           void main () {
             vUv = aPosition * 0.5 + 0.5;
             vL = vUv - vec2(texelSize.x, 0.0);
             vR = vUv + vec2(texelSize.x, 0.0);
             vT = vUv + vec2(0.0, texelSize.y);
             vB = vUv - vec2(0.0, texelSize.y);
             gl_Position = vec4(aPosition, 0.0, 1.0);
           }`
    );

    const outKw = isWebGL2 ? "out" : "";
    const fragColorDecl = isWebGL2 ? "out vec4 fragColor;" : "";
    const fragColor = isWebGL2 ? "fragColor" : "gl_FragColor";
    const texFn = isWebGL2 ? "texture" : "texture2D";
    const varying = isWebGL2 ? "in" : "varying";
    const ver = isWebGL2 ? "#version 300 es" : "";

    const splatShader = compileShader(gl.FRAGMENT_SHADER,
      `${ver}
       precision highp float;
       precision highp sampler2D;
       ${varying} vec2 vUv;
       ${fragColorDecl}
       uniform sampler2D uTarget;
       uniform float aspectRatio;
       uniform vec3 color;
       uniform vec2 point;
       uniform float radius;
       void main () {
         vec2 p = vUv - point;
         p.x *= aspectRatio;
         vec3 splat = exp(-dot(p, p) / radius) * color;
         vec3 base = ${texFn}(uTarget, vUv).xyz;
         ${fragColor} = vec4(base + splat, 1.0);
       }`
    );

    const advectionShader = compileShader(gl.FRAGMENT_SHADER,
      `${ver}
       precision highp float;
       precision highp sampler2D;
       ${varying} vec2 vUv;
       ${fragColorDecl}
       uniform sampler2D uVelocity;
       uniform sampler2D uSource;
       uniform vec2 texelSize;
       uniform float dt;
       uniform float dissipation;
       void main () {
         vec2 coord = vUv - dt * ${texFn}(uVelocity, vUv).xy * texelSize;
         vec4 result = ${texFn}(uSource, coord);
         float decay = 1.0 + dissipation * dt;
         ${fragColor} = result / decay;
       }`
    );

    const divergenceShader = compileShader(gl.FRAGMENT_SHADER,
      `${ver}
       precision mediump float;
       precision mediump sampler2D;
       ${varying} vec2 vUv;
       ${varying} vec2 vL;
       ${varying} vec2 vR;
       ${varying} vec2 vT;
       ${varying} vec2 vB;
       ${fragColorDecl}
       uniform sampler2D uVelocity;
       void main () {
         float L = ${texFn}(uVelocity, vL).x;
         float R = ${texFn}(uVelocity, vR).x;
         float T = ${texFn}(uVelocity, vT).y;
         float B = ${texFn}(uVelocity, vB).y;
         float div = 0.5 * (R - L + T - B);
         ${fragColor} = vec4(div, 0.0, 0.0, 1.0);
       }`
    );

    const curlShader = compileShader(gl.FRAGMENT_SHADER,
      `${ver}
       precision mediump float;
       precision mediump sampler2D;
       ${varying} vec2 vUv;
       ${varying} vec2 vL;
       ${varying} vec2 vR;
       ${varying} vec2 vT;
       ${varying} vec2 vB;
       ${fragColorDecl}
       uniform sampler2D uVelocity;
       void main () {
         float L = ${texFn}(uVelocity, vL).y;
         float R = ${texFn}(uVelocity, vR).y;
         float T = ${texFn}(uVelocity, vT).x;
         float B = ${texFn}(uVelocity, vB).x;
         float vorticity = R - L - T + B;
         ${fragColor} = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
       }`
    );

    const vorticityShader = compileShader(gl.FRAGMENT_SHADER,
      `${ver}
       precision highp float;
       precision highp sampler2D;
       ${varying} vec2 vUv;
       ${varying} vec2 vL;
       ${varying} vec2 vR;
       ${varying} vec2 vT;
       ${varying} vec2 vB;
       ${fragColorDecl}
       uniform sampler2D uVelocity;
       uniform sampler2D uCurl;
       uniform float curl;
       uniform float dt;
       void main () {
         float L = ${texFn}(uCurl, vL).x;
         float R = ${texFn}(uCurl, vR).x;
         float T = ${texFn}(uCurl, vT).x;
         float B = ${texFn}(uCurl, vB).x;
         float C = ${texFn}(uCurl, vUv).x;
         vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
         force /= length(force) + 0.0001;
         force *= curl * C;
         force.y *= -1.0;
         vec2 velocity = ${texFn}(uVelocity, vUv).xy;
         velocity += force * dt;
         velocity = min(max(velocity, -1000.0), 1000.0);
         ${fragColor} = vec4(velocity, 0.0, 1.0);
       }`
    );

    const pressureShader = compileShader(gl.FRAGMENT_SHADER,
      `${ver}
       precision mediump float;
       precision mediump sampler2D;
       ${varying} vec2 vUv;
       ${varying} vec2 vL;
       ${varying} vec2 vR;
       ${varying} vec2 vT;
       ${varying} vec2 vB;
       ${fragColorDecl}
       uniform sampler2D uPressure;
       uniform sampler2D uDivergence;
       void main () {
         float L = ${texFn}(uPressure, vL).x;
         float R = ${texFn}(uPressure, vR).x;
         float T = ${texFn}(uPressure, vT).x;
         float B = ${texFn}(uPressure, vB).x;
         float C = ${texFn}(uPressure, vUv).x;
         float divergence = ${texFn}(uDivergence, vUv).x;
         float pressure = (L + R + B + T - divergence) * 0.25;
         ${fragColor} = vec4(pressure, 0.0, 0.0, 1.0);
       }`
    );

    const gradientSubtractShader = compileShader(gl.FRAGMENT_SHADER,
      `${ver}
       precision mediump float;
       precision mediump sampler2D;
       ${varying} vec2 vUv;
       ${varying} vec2 vL;
       ${varying} vec2 vR;
       ${varying} vec2 vT;
       ${varying} vec2 vB;
       ${fragColorDecl}
       uniform sampler2D uPressure;
       uniform sampler2D uVelocity;
       void main () {
         float L = ${texFn}(uPressure, vL).x;
         float R = ${texFn}(uPressure, vR).x;
         float T = ${texFn}(uPressure, vT).x;
         float B = ${texFn}(uPressure, vB).x;
         vec2 velocity = ${texFn}(uVelocity, vUv).xy;
         velocity.xy -= vec2(R - L, T - B);
         ${fragColor} = vec4(velocity, 0.0, 1.0);
       }`
    );

    const displayShader = compileShader(gl.FRAGMENT_SHADER,
      `${ver}
       precision highp float;
       precision highp sampler2D;
       ${varying} vec2 vUv;
       ${fragColorDecl}
       uniform sampler2D uTexture;
       void main () {
         vec3 c = ${texFn}(uTexture, vUv).rgb;
         float a = max(c.r, max(c.g, c.b));
         ${fragColor} = vec4(c, a * 0.8);
       }`
    );

    const clearShader = compileShader(gl.FRAGMENT_SHADER,
      `${ver}
       precision mediump float;
       precision mediump sampler2D;
       ${varying} vec2 vUv;
       ${fragColorDecl}
       uniform sampler2D uTexture;
       uniform float value;
       void main () {
         ${fragColor} = value * ${texFn}(uTexture, vUv);
       }`
    );

    const splatProgram = new GLProgram(baseVertexShader, splatShader);
    const advectionProgram = new GLProgram(baseVertexShader, advectionShader);
    const divergenceProgram = new GLProgram(baseVertexShader, divergenceShader);
    const curlProgram = new GLProgram(baseVertexShader, curlShader);
    const vorticityProgram = new GLProgram(baseVertexShader, vorticityShader);
    const pressureProgram = new GLProgram(baseVertexShader, pressureShader);
    const gradientSubtractProgram = new GLProgram(baseVertexShader, gradientSubtractShader);
    const displayProgram = new GLProgram(baseVertexShader, displayShader);
    const clearProgram = new GLProgram(baseVertexShader, clearShader);

    const blit = (() => {
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);

      return (target: { fbo: WebGLFramebuffer; width: number; height: number } | null) => {
        if (target) {
          gl.viewport(0, 0, target.width, target.height);
          gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
        } else {
          gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
      };
    })();

    function getResolution(resolution: number) {
      let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
      if (aspectRatio < 1) aspectRatio = 1.0 / aspectRatio;
      const min = Math.round(resolution);
      const max = Math.round(resolution * aspectRatio);
      return gl.drawingBufferWidth > gl.drawingBufferHeight ? { width: max, height: min } : { width: min, height: max };
    }

    function createFBO(w: number, h: number, internalFormat: number, format: number, type: number, filter: number) {
      gl.activeTexture(gl.TEXTURE0);
      const texture = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);
      const fbo = gl.createFramebuffer()!;
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT);
      return { texture, fbo, width: w, height: h, texelSizeX: 1.0 / w, texelSizeY: 1.0 / h, attach(id: number) { gl.activeTexture(gl.TEXTURE0 + id); gl.bindTexture(gl.TEXTURE_2D, texture); return id; } };
    }

    function createDoubleFBO(w: number, h: number, internalFormat: number, format: number, type: number, filter: number) {
      let fbo1 = createFBO(w, h, internalFormat, format, type, filter);
      let fbo2 = createFBO(w, h, internalFormat, format, type, filter);
      return {
        width: w, height: h,
        texelSizeX: fbo1.texelSizeX, texelSizeY: fbo1.texelSizeY,
        get read() { return fbo1; },
        set read(v) { fbo1 = v; },
        get write() { return fbo2; },
        set write(v) { fbo2 = v; },
        swap() { const t = fbo1; fbo1 = fbo2; fbo2 = t; },
      };
    }

    const texType = halfFloatTexType;
    const rgba = formatRGBA!;
    const rg = formatRG!;
    const r = formatR!;
    const filtering = supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    const simRes = getResolution(SIM_RESOLUTION);
    const dyeRes = getResolution(DYE_RESOLUTION);

    let dye = createDoubleFBO(dyeRes.width, dyeRes.height, rgba.internalFormat, rgba.format, texType, filtering);
    let velocity = createDoubleFBO(simRes.width, simRes.height, rg.internalFormat, rg.format, texType, filtering);
    let divergenceFBO = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    let curlFBO = createFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    let pressureFBO = createDoubleFBO(simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);

    let lastUpdateTime = Date.now();
    let colorUpdateTimer = 0;
    let animationId: number;

    function splat(x: number, y: number, dx: number, dy: number, color: [number, number, number]) {
      splatProgram.bind();
      gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
      gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas!.width / canvas!.height);
      gl.uniform2f(splatProgram.uniforms.point, x, y);
      gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
      gl.uniform1f(splatProgram.uniforms.radius, correctRadius(SPLAT_RADIUS / 100.0));
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
      gl.uniform3f(splatProgram.uniforms.color, color[0], color[1], color[2]);
      blit(dye.write);
      dye.swap();
    }

    function correctRadius(radius: number) {
      const aspectRatio = canvas!.width / canvas!.height;
      return aspectRatio > 1 ? radius * aspectRatio : radius;
    }

    function step(dt: number) {
      gl.disable(gl.BLEND);

      curlProgram.bind();
      gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(curlFBO);

      vorticityProgram.bind();
      gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(vorticityProgram.uniforms.uCurl, curlFBO.attach(1));
      gl.uniform1f(vorticityProgram.uniforms.curl, CURL);
      gl.uniform1f(vorticityProgram.uniforms.dt, dt);
      blit(velocity.write);
      velocity.swap();

      divergenceProgram.bind();
      gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
      blit(divergenceFBO);

      clearProgram.bind();
      gl.uniform1i(clearProgram.uniforms.uTexture, pressureFBO.read.attach(0));
      gl.uniform1f(clearProgram.uniforms.value, PRESSURE);
      blit(pressureFBO.write);
      pressureFBO.swap();

      pressureProgram.bind();
      gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(pressureProgram.uniforms.uDivergence, divergenceFBO.attach(0));
      for (let i = 0; i < 20; i++) {
        gl.uniform1i(pressureProgram.uniforms.uPressure, pressureFBO.read.attach(1));
        blit(pressureFBO.write);
        pressureFBO.swap();
      }

      gradientSubtractProgram.bind();
      gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressureFBO.read.attach(0));
      gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
      blit(velocity.write);
      velocity.swap();

      advectionProgram.bind();
      gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
      const velocityId = velocity.read.attach(0);
      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
      gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
      gl.uniform1f(advectionProgram.uniforms.dt, dt);
      gl.uniform1f(advectionProgram.uniforms.dissipation, VELOCITY_DISSIPATION);
      blit(velocity.write);
      velocity.swap();

      gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
      gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
      gl.uniform1f(advectionProgram.uniforms.dissipation, DENSITY_DISSIPATION);
      blit(dye.write);
      dye.swap();
    }

    function render() {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
      displayProgram.bind();
      gl.uniform1i(displayProgram.uniforms.uTexture, dye.read.attach(0));
      blit(null);
    }

    function generateColor(): [number, number, number] {
      const c = HSVtoRGB(Math.random(), 0.6, 0.08);
      return [c.r, c.g, c.b];
    }

    function HSVtoRGB(h: number, s: number, v: number) {
      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = v * (1 - s);
      const q = v * (1 - f * s);
      const t = v * (1 - (1 - f) * s);
      let r: number, g: number, b: number;
      switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
        default: r = 0; g = 0; b = 0;
      }
      return { r, g, b };
    }

    let lastMouse = { x: 0, y: 0 };
    let currentColor = generateColor();

    function handlePointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dx = (x - lastMouse.x) * SPLAT_FORCE;
      const dy = -(y - lastMouse.y) * SPLAT_FORCE;
      lastMouse = { x, y };

      colorUpdateTimer += 0.016;
      if (colorUpdateTimer >= 1.0 / COLOR_UPDATE_SPEED) {
        colorUpdateTimer = 0;
        currentColor = generateColor();
      }

      splat(x / canvas!.width, 1.0 - y / canvas!.height, dx, dy, currentColor);
    }

    function update() {
      const now = Date.now();
      const dt = Math.min((now - lastUpdateTime) / 1000, 0.016666);
      lastUpdateTime = now;

      resizeCanvas();
      step(dt);
      render();
      animationId = requestAnimationFrame(update);
    }

    canvas.addEventListener("pointermove", handlePointerMove);
    animationId = requestAnimationFrame(update);

    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      cancelAnimationFrame(animationId);
    };
  }, [getWebGLContext, SIM_RESOLUTION, DYE_RESOLUTION, DENSITY_DISSIPATION, VELOCITY_DISSIPATION, PRESSURE, CURL, SPLAT_RADIUS, SPLAT_FORCE, COLOR_UPDATE_SPEED]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-[998]"
      style={{ background: "transparent" }}
    />
  );
}

function getSupportedFormat(gl: WebGLRenderingContext, internalFormat: number, format: number, type: number) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.deleteTexture(texture);
  gl.deleteFramebuffer(fbo);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (status !== gl.FRAMEBUFFER_COMPLETE) return null;
  return { internalFormat, format };
}
