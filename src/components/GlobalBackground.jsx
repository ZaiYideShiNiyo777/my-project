import React, { Component, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================
// 数字孪生科技风 全局固定动态背景
// - 粒子节点网络(带近邻动态连线,鼠标靠近粒子被推开)
// - 发光透视网格地面 + 坐标扫描平面 + 三维空间线框参考框 + 上升数据流
// - 蓝青数据网络色调(数字孪生典型视觉),整体缓慢环绕旋转 + 轻微滚动视差
// - 常驻整个页面底部(z-0),所有内容层(z-10+)之上可见、之下交互
// 性能策略:
//   - 粒子数按设备自适应(桌面 150 / 移动端 90)
//   - 更新限帧 30fps,页面隐藏(document.hidden)时跳过计算
//   - prefers-reduced-motion 用户渲染静态画面(不更新)
//   - DPR 上限 1.5,无每帧对象分配
//   - WebGL 不可用时自动降级为 CSS 透视网格 + 扫描线背景
// ============================================================

/* ---------- 圆形粒子贴图(程序生成,避免外链) ---------- */
let spriteTexture = null;
function getSpriteTexture() {
  if (spriteTexture) return spriteTexture;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  spriteTexture = new THREE.CanvasTexture(c);
  return spriteTexture;
}

/* ---------- 设备能力检测(模块级,只执行一次) ---------- */
const isCoarse = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0
  : false;
const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
const PARTICLE_COUNT = isCoarse ? 90 : 150; // 移动端减半,保证流畅
const COLOR_A = new THREE.Color('#60a5fa'); // 蓝
const COLOR_B = new THREE.Color('#22d3ee'); // 青(数据网络,数字孪生典型色调)
const MAX_LINK = 4.2; // 连线可见的最大距离
const MOUSE_RADIUS = 2.5; // 鼠标影响半径
const UPDATE_INTERVAL = 1 / 30; // 动画更新限帧上限(30fps,渲染仍由浏览器调度)

function createParticles() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const basePositions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const phases = new Float32Array(PARTICLE_COUNT);
  const tmpColor = new THREE.Color();

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const x = (Math.random() * 2 - 1) * 11;
    const y = 0.4 + Math.random() * 6.2;
    const z = -6.5 + Math.random() * 11;
    positions[i * 3] = basePositions[i * 3] = x;
    positions[i * 3 + 1] = basePositions[i * 3 + 1] = y;
    positions[i * 3 + 2] = basePositions[i * 3 + 2] = z;
    tmpColor.lerpColors(COLOR_A, COLOR_B, Math.random());
    colors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = tmpColor.b;
    phases[i] = Math.random() * Math.PI * 2;
  }

  // 预计算近邻拓扑(每粒子连接最近的 2 个,基于初始位置,去重)
  const edges = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const near = [];
    for (let j = 0; j < PARTICLE_COUNT; j++) {
      if (i === j) continue;
      const dx = basePositions[i * 3] - basePositions[j * 3];
      const dy = basePositions[i * 3 + 1] - basePositions[j * 3 + 1];
      const dz = basePositions[i * 3 + 2] - basePositions[j * 3 + 2];
      near.push([dx * dx + dy * dy + dz * dz, j]);
    }
    near.sort((a, b) => a[0] - b[0]);
    for (let k = 0; k < 2; k++) {
      const j = near[k][1];
      if (j > i) edges.push([i, j]);
    }
  }

  const edgeCount = edges.length;
  const linePositions = new Float32Array(edgeCount * 6);
  const lineColors = new Float32Array(edgeCount * 6);

  // 粒子
  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const particleMat = new THREE.PointsMaterial({
    size: 0.14,
    map: getSpriteTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(particleGeo, particleMat);

  // 连线
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));
  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);

  // 每帧更新:粒子浮动 + 鼠标推开;连线跟随 + 距离越远越暗
  const update = (t, mouse) => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const ix = i * 3;
      const bx = basePositions[ix];
      const by = basePositions[ix + 1];
      const bz = basePositions[ix + 2];
      let px = bx;
      let py = by + Math.sin(t * 0.6 + phases[i]) * 0.18;
      let pz = bz + Math.cos(t * 0.5 + phases[i]) * 0.12;

      if (mouse) {
        const mx = mouse.x * 9;
        const my = mouse.y * 3 + 2.6;
        const dx = px - mx;
        const dy = py - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_RADIUS * MOUSE_RADIUS) {
          const d = Math.sqrt(d2) || 0.001;
          const f = (1 - d / MOUSE_RADIUS) * 0.55;
          px += (dx / d) * f;
          py += (dy / d) * f;
        }
      }

      positions[ix] = px;
      positions[ix + 1] = py;
      positions[ix + 2] = pz;
    }
    particleGeo.attributes.position.needsUpdate = true;

    for (let e = 0; e < edgeCount; e++) {
      const i = edges[e][0];
      const j = edges[e][1];
      const ix = i * 3;
      const jx = j * 3;
      const dx = positions[ix] - positions[jx];
      const dy = positions[ix + 1] - positions[jx + 1];
      const dz = positions[ix + 2] - positions[jx + 2];
      const d2 = dx * dx + dy * dy + dz * dz;
      let b = 0;
      if (d2 < MAX_LINK * MAX_LINK) {
        const k = 1 - Math.sqrt(d2) / MAX_LINK;
        b = k * k * (3 - 2 * k); // smoothstep,远处柔和淡出
      }
      const r = (colors[ix] + colors[jx]) * 0.5 * b;
      const g = (colors[ix + 1] + colors[jx + 1]) * 0.5 * b;
      const bl = (colors[ix + 2] + colors[jx + 2]) * 0.5 * b;
      const vi = e * 6;
      linePositions[vi] = positions[ix];
      linePositions[vi + 1] = positions[ix + 1];
      linePositions[vi + 2] = positions[ix + 2];
      linePositions[vi + 3] = positions[jx];
      linePositions[vi + 4] = positions[jx + 1];
      linePositions[vi + 5] = positions[jx + 2];
      lineColors[vi] = r;
      lineColors[vi + 1] = g;
      lineColors[vi + 2] = bl;
      lineColors[vi + 3] = r;
      lineColors[vi + 4] = g;
      lineColors[vi + 5] = bl;
    }
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;
  };

  return { points, lines, update };
}

/* ---------- 发光透视网格地面 ---------- */
function createGrid() {
  const size = 44;
  const step = 2;
  const half = size / 2;
  const rows = Math.floor(size / step) + 1;
  const pts = [];

  for (let i = 0; i < rows; i++) {
    const x = -half + i * step;
    pts.push([x, 0, -half], [x, 0, half]);
    const z = -half + i * step;
    pts.push([-half, 0, z], [half, 0, z]);
  }

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(pts.length * 3);
  const col = new Float32Array(pts.length * 3);
  const base = new THREE.Color('#3b82f6');
  pts.forEach((p, i) => {
    pos[i * 3] = p[0];
    pos[i * 3 + 1] = p[1];
    pos[i * 3 + 2] = p[2];
    const dist = Math.sqrt(p[0] * p[0] + p[2] * p[2]) / half;
    const b = Math.max(0.04, 1 - dist * 0.72);
    col[i * 3] = base.r * b;
    col[i * 3 + 1] = base.g * b;
    col[i * 3 + 2] = base.b * b;
  });
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const mat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
  });
  const grid = new THREE.LineSegments(geo, mat);
  grid.userData.mat = mat; // 呼吸动画用
  return grid;
}

/* ---------- 坐标扫描平面(竖直全息扫描,自下而上掠过场景) ---------- */
function createScanner() {
  const geo = new THREE.PlaneGeometry(30, 16);
  const mat = new THREE.MeshBasicMaterial({
    color: '#22d3ee',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = 0.3;
  const update = (t) => {
    const progress = (t * 0.055) % 1;
    mesh.position.y = -2.5 + progress * 11;
    mat.opacity = Math.sin(progress * Math.PI) * 0.055;
  };
  return { mesh, update };
}

/* ---------- 三维空间线框参考框(数字孪生坐标空间) ---------- */
function createAxisFrame() {
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(12, 7, 9));
  const mat = new THREE.LineBasicMaterial({
    color: '#38bdf8',
    transparent: true,
    opacity: 0.12,
    depthWrite: false,
  });
  const frame = new THREE.LineSegments(edges, mat);
  frame.position.y = 2.8;
  frame.userData.mat = mat; // 呼吸动画用
  return frame;
}

/* ---------- 扫描线(地面上升的全息光带) ---------- */
function createScanBeam() {
  const geo = new THREE.PlaneGeometry(36, 14);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    color: '#60a5fa',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(geo, mat);
  const update = (t) => {
    const progress = (t * 0.1) % 1;
    mesh.position.y = 0.15 + progress * 6.4;
    mat.opacity = Math.sin(progress * Math.PI) * 0.09;
  };
  return { mesh, update };
}

/* ---------- 上升数据流(从地面"生长"的发光竖线) ---------- */
function createStreams() {
  // 统一蓝青数据网络色,弱化与数字孪生风格不一致的彩色装饰
  const specs = [
    { x: -6, z: -3, color: '#22d3ee' },
    { x: -2, z: 1.5, color: '#60a5fa' },
    { x: 3, z: -2, color: '#22d3ee' },
    { x: 6.5, z: 2.5, color: '#60a5fa' },
    { x: 0.5, z: -4.5, color: '#22d3ee' },
  ];

  return specs.map((s, i) => {
    const height = 2.4 + (i % 3) * 1.3;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 0, 1, 0]), 3));
    const mat = new THREE.LineBasicMaterial({
      color: s.color,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    const line = new THREE.Line(geo, mat);
    line.position.set(s.x, 0, s.z);
    line.scale.y = 0;
    const data = { phase: i * 0.37, speed: 0.3 + (i % 3) * 0.1, height };
    const update = (t) => {
      const p = (t * data.speed + data.phase) % 1;
      line.scale.y = Math.min(1, p * 4) * data.height;
      mat.opacity = p > 0.88 ? (1 - p) * 3.2 : 0.3 + Math.sin(p * 6) * 0.06;
    };
    return { line, update };
  });
}

/* ---------- 3D 场景 ---------- */
function Scene({ paused = false }) {
  const camera = useThree((s) => s.camera);
  const group = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const acc = useRef(0); // 帧率限制累积器
  const particles = useMemo(() => createParticles(), []);
  const grid = useMemo(() => createGrid(), []);
  const scan = useMemo(() => createScanBeam(), []);
  const scanner = useMemo(() => createScanner(), []);
  const frame = useMemo(() => createAxisFrame(), []);
  const streams = useMemo(() => createStreams(), []);

  useEffect(() => {
    camera.lookAt(0, 2.6, 0);
    const onMove = (e) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [camera]);

  useFrame((state, delta) => {
    // 页面不可见、后台面板打开或用户要求减少动态时,保持静态(不浪费计算)
    if (paused || document.hidden || prefersReducedMotion) return;

    // 更新限帧 30fps:滚动等主线程任务不会被每帧大计算拖慢
    acc.current += delta;
    if (acc.current < UPDATE_INTERVAL) return;
    acc.current = 0;

    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.rotation.y += delta * 0.05;
      // 滚动视差:背景随滚动轻微上移,产生纵深层次感
      group.current.position.y = -window.scrollY * 0.0009;
    }
    particles.update(t, mouse.current);
    grid.userData.mat.opacity = 0.22 + Math.sin(t * 0.5) * 0.07;
    scan.update(t);
    scanner.update(t);
    frame.userData.mat.opacity = 0.09 + Math.sin(t * 0.4 + 1.3) * 0.04;
    streams.forEach((s) => s.update(t));
  });

  return (
    <group ref={group}>
      <primitive object={particles.lines} />
      <primitive object={particles.points} />
      <primitive object={grid} />
      <primitive object={scan.mesh} />
      <primitive object={scanner.mesh} />
      <primitive object={frame} />
      {streams.map((s, i) => (
        <primitive key={i} object={s.line} />
      ))}
    </group>
  );
}

/* ---------- WebGL 不可用时的静态降级背景 ---------- */
function StaticTechBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="css-grid-floor" />
      <div className="css-scan-line" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
}

class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? <StaticTechBackground /> : this.props.children;
  }
}

/* ---------- 对外导出的全局背景组件 ---------- */
export default function GlobalBackground({ paused = false }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <SceneErrorBoundary>
        <Canvas
          dpr={isCoarse ? [1, 1] : [1, 1.5]}
          gl={{ alpha: true, antialias: !isCoarse, powerPreference: 'high-performance' }}
          camera={{ position: [0, 3.5, 9.8], fov: 52, near: 0.1, far: 120 }}
          style={{ position: 'absolute', inset: 0 }}
        >
          <Scene paused={paused} />
        </Canvas>
      </SceneErrorBoundary>
    </div>
  );
}
