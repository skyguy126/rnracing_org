import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const VERTEX = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uPixelRatio;

  attribute vec3 aScattered;
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aDelay;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vT;

  void main() {
    float stagger = 0.35;
    float raw = clamp((uProgress - aDelay * stagger) / (1.0 - stagger), 0.0, 1.0);
    float t = raw * raw * (3.0 - 2.0 * raw);

    vec3 pos = mix(position, aScattered, t);

    float drift = t * 0.12;
    pos.x += sin(uTime * 0.3 + aDelay * 6.28) * drift;
    pos.y += cos(uTime * 0.4 + aDelay * 3.14 + position.x * 2.0) * drift;
    pos.z += sin(uTime * 0.25 + aDelay * 4.71) * drift * 0.6;

    vColor = aColor;
    vAlpha = mix(0.85, 0.5, t);
    vT = t;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uPixelRatio * (14.0 / -mv.z);
    gl_PointSize = max(gl_PointSize, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vT;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float dist = length(uv);
    if (dist > 0.5) discard;

    float circle = smoothstep(0.5, 0.08, dist);
    float box = smoothstep(0.5, 0.42, max(abs(uv.x), abs(uv.y)));
    float shape = mix(box, circle, vT);

    vec3 col = vColor + vec3(0.015, 0.03, 0.09) * vT;

    gl_FragColor = vec4(col, shape * vAlpha);
  }
`;

interface ParticleData {
  positions: Float32Array;
  colors: Float32Array;
  scattered: Float32Array;
  sizes: Float32Array;
  delays: Float32Array;
  count: number;
}

function sampleImage(
  src: string,
  sw: number,
  sh: number
): Promise<ParticleData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = sw;
      c.height = sh;
      const ctx = c.getContext("2d")!;
      ctx.drawImage(img, 0, 0, sw, sh);
      const { data } = ctx.getImageData(0, 0, sw, sh);

      const pos: number[] = [];
      const col: number[] = [];
      const sct: number[] = [];
      const siz: number[] = [];
      const del: number[] = [];

      const aspect = sw / sh;
      const scale = 3.6;

      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sw; x++) {
          const i = (y * sw + x) * 4;
          const r = data[i] / 255;
          const g = data[i + 1] / 255;
          const b = data[i + 2] / 255;
          if (data[i + 3] < 25) continue;

          const px = (x / sw - 0.5) * scale * aspect;
          const py = (1 - y / sh - 0.5) * scale;

          pos.push(px, py, 0);
          col.push(r, g, b);

          const spread = 3.5 + Math.random() * 5;
          sct.push(
            px * spread + (Math.random() - 0.5) * 2.5,
            py * spread + (Math.random() - 0.5) * 2.5,
            (Math.random() - 0.5) * 7
          );
          siz.push(2.2 + Math.random() * 1.4);
          del.push(Math.random());
        }
      }

      resolve({
        positions: new Float32Array(pos),
        colors: new Float32Array(col),
        scattered: new Float32Array(sct),
        sizes: new Float32Array(siz),
        delays: new Float32Array(del),
        count: pos.length / 3,
      });
    };
    img.onerror = reject;
    img.src = src;
  });
}

interface Props {
  progressRef: React.RefObject<number>;
}

export default function CarParticles({ progressRef }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const [pd, setPd] = useState<ParticleData | null>(null);

  useEffect(() => {
    sampleImage("/camry-71.jpg", 220, 150).then(setPd);
  }, []);

  const geometry = useMemo(() => {
    if (!pd) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pd.positions, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(pd.colors, 3));
    g.setAttribute("aScattered", new THREE.BufferAttribute(pd.scattered, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(pd.sizes, 1));
    g.setAttribute("aDelay", new THREE.BufferAttribute(pd.delays, 1));
    return g;
  }, [pd]);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: {
        value: Math.min(
          typeof window !== "undefined" ? window.devicePixelRatio : 1,
          2
        ),
      },
    }),
    []
  );

  const { pointer } = useThree();

  useFrame((state) => {
    if (matRef.current) {
      const target = progressRef.current ?? 0;
      matRef.current.uniforms.uProgress.value +=
        (target - matRef.current.uniforms.uProgress.value) * 0.1;
      matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
    if (groupRef.current) {
      groupRef.current.rotation.y +=
        (pointer.x * 0.08 - groupRef.current.rotation.y) * 0.04;
      groupRef.current.rotation.x +=
        (-pointer.y * 0.04 - groupRef.current.rotation.x) * 0.04;
    }
  });

  if (!geometry) return null;

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <shaderMaterial
          ref={matRef}
          vertexShader={VERTEX}
          fragmentShader={FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
        />
      </points>
    </group>
  );
}
