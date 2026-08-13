import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================
// 数字孪生科技风 全局固定动态背景
// - 粒子节点网络(分级核心节点 + 亮度脉动 + 近邻动态连线,鼠标靠近粒子被推开)
// - 数据包流(沿网络连线流动的发光数据点,模拟数据传输)
// - 发光透视网格地面(扫描推进波) + 坐标轴参考系 + 竖直光栅扫描带 + 上升数据流
// - 悬浮全息网格 + 地面能量脉冲环 + 环绕流光带(双向数据环流)
// - 全息 HUD 装饰层(四角框 + 铭牌 + 坐标刻度 + 十字准星 + 追踪标签,纯 CSS)
// - 交互:鼠标视差跟随 + 滚动驱动位移/透明度 + 点击能量波纹
// - 蓝青数据网络色调(数字孪生典型视觉),整体缓慢环绕旋转 + 轻微滚动视差
// - 常驻整个页面底部(z-0),所有内容层(z-10+)之上可见、之下交互
// 性能策略:
//   - 粒子数按设备自适应(桌面 150 / 移动端 90),新增元素移动端减量
//   - 更新限帧 30fps,页面隐藏(document.hidden)时跳过计算
//   - prefers-reduced-motion 用户渲染静态画面(不更新, CSS 动画关闭)
//   - DPR 上限 1.5,无每帧对象分配(数据包/光栅/核心节点全部共享几何体 + 预分配数组)
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
  const baseColors = new Float32Array(PARTICLE_COUNT * 3); // 基础色,供亮度脉动与连线使用
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
    colors[i * 3] = baseColors[i * 3] = tmpColor.r;
    colors[i * 3 + 1] = baseColors[i * 3 + 1] = tmpColor.g;
    colors[i * 3 + 2] = baseColors[i * 3 + 2] = tmpColor.b;
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
    opacity: 0.72,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);

  // 核心节点(10%):更大更亮,形成网络主从层级(移动端 9 个 / 桌面 15 个)
  const coreCount = Math.max(6, Math.floor(PARTICLE_COUNT * 0.1));
  const corePool = Array.from({ length: PARTICLE_COUNT }, (_, i) => i);
  const coreIndices = [];
  for (let i = 0; i < coreCount; i++) {
    const k = Math.floor(Math.random() * corePool.length);
    coreIndices.push(corePool.splice(k, 1)[0]);
  }
  const corePositions = new Float32Array(coreCount * 3);
  const coreGeo = new THREE.BufferGeometry();
  coreGeo.setAttribute('position', new THREE.BufferAttribute(corePositions, 3));
  const coreMat = new THREE.PointsMaterial({
    size: 0.28,
    map: getSpriteTexture(),
    color: '#dbeafe',
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const corePoints = new THREE.Points(coreGeo, coreMat);

  // 每帧更新:粒子浮动 + 亮度脉动 + 鼠标推开;连线跟随 + 距离越远越暗
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

      // 亮度脉动(基于基础色 0.64~1.0),网络像在呼吸
      const pulse = 0.82 + Math.sin(t * 1.3 + phases[i]) * 0.18;
      colors[ix] = baseColors[ix] * pulse;
      colors[ix + 1] = baseColors[ix + 1] * pulse;
      colors[ix + 2] = baseColors[ix + 2] * pulse;
    }
    particleGeo.attributes.position.needsUpdate = true;
    particleGeo.attributes.color.needsUpdate = true;

    // 核心节点跟随主粒子(仅拷贝索引对应位置,复用主计算)
    for (let k = 0; k < coreCount; k++) {
      const ix = coreIndices[k] * 3;
      corePositions[k * 3] = positions[ix];
      corePositions[k * 3 + 1] = positions[ix + 1];
      corePositions[k * 3 + 2] = positions[ix + 2];
    }
    coreGeo.attributes.position.needsUpdate = true;

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
      // 连线亮度基于基础色(不叠加粒子脉动,避免整体闪烁)
      const r = (baseColors[ix] + baseColors[jx]) * 0.5 * b;
      const g = (baseColors[ix + 1] + baseColors[jx + 1]) * 0.5 * b;
      const bl = (baseColors[ix + 2] + baseColors[jx + 2]) * 0.5 * b;
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

  return { points, corePoints, lines, edges, positions, update };
}

/* ---------- 数据包流(沿网络连线流动的发光数据点,模拟数据传输) ---------- */
function createPacketFlow(edges, positions) {
  // 桌面 36 个 / 移动端 18 个,共享单点几何体,零每帧分配
  const count = isCoarse ? 18 : 36;
  const edgeCount = edges.length;
  const packetPositions = new Float32Array(count * 3);
  const packetEdge = new Int16Array(count);
  const packetT = new Float32Array(count);
  const packetSpeed = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    packetEdge[i] = Math.floor(Math.random() * edgeCount);
    packetT[i] = Math.random();
    packetSpeed[i] = 0.055 + Math.random() * 0.07;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(packetPositions, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.12,
    map: getSpriteTexture(),
    color: '#a5f3fc',
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);

  const update = () => {
    for (let i = 0; i < count; i++) {
      // 限帧步进固定,速度与帧率无关;到终点随机换边,模拟数据路由
      packetT[i] += packetSpeed[i];
      if (packetT[i] >= 1) {
        packetT[i] -= 1;
        packetEdge[i] = Math.floor(Math.random() * edgeCount);
      }
      const e = packetEdge[i];
      const ia = edges[e][0] * 3;
      const ib = edges[e][1] * 3;
      const tt = packetT[i];
      packetPositions[i * 3] = positions[ia] + (positions[ib] - positions[ia]) * tt;
      packetPositions[i * 3 + 1] = positions[ia + 1] + (positions[ib + 1] - positions[ia + 1]) * tt;
      packetPositions[i * 3 + 2] = positions[ia + 2] + (positions[ib + 2] - positions[ia + 2]) * tt;
    }
    geo.attributes.position.needsUpdate = true;
  };

  return { points, update };
}

/* ---------- 发光透视网格地面(带沿 Z 轴传播的扫描推进波) ---------- */
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
  const baseCol = new Float32Array(pts.length * 3); // 基础亮度,供推进波叠加
  const base = new THREE.Color('#3b82f6');
  pts.forEach((p, i) => {
    pos[i * 3] = p[0];
    pos[i * 3 + 1] = p[1];
    pos[i * 3 + 2] = p[2];
    const dist = Math.sqrt(p[0] * p[0] + p[2] * p[2]) / half;
    const b = Math.max(0.04, 1 - dist * 0.72);
    col[i * 3] = baseCol[i * 3] = base.r * b;
    col[i * 3 + 1] = baseCol[i * 3 + 1] = base.g * b;
    col[i * 3 + 2] = baseCol[i * 3 + 2] = base.b * b;
  });
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

  const mat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.18,
    depthWrite: false,
  });
  const grid = new THREE.LineSegments(geo, mat);
  grid.userData.mat = mat; // 呼吸动画用

  // 扫描推进波:一条高亮带沿 Z 轴匀速传播,网格像被扫描仪推动(约 270 次颜色写入/帧)
  const updateWave = (t) => {
    for (let i = 0; i < pts.length; i++) {
      const pz = pts[i][2];
      const wave = 0.5 + 0.5 * Math.sin(pz * 1.1 - t * 2.2);
      const boost = 0.55 + wave * 0.9; // 0.55 ~ 1.45
      col[i * 3] = baseCol[i * 3] * boost;
      col[i * 3 + 1] = baseCol[i * 3 + 1] * boost;
      col[i * 3 + 2] = baseCol[i * 3 + 2] * boost;
    }
    geo.attributes.color.needsUpdate = true;
  };
  grid.userData.updateWave = updateWave;
  return grid;
}

/* ---------- 坐标扫描平面(竖直光栅扫描带 + 前沿亮线,自下而上掠过场景) ---------- */
function createScanner() {
  // 光栅:多条水平细线组成的扫描带(桌面 6 条 / 移动端 4 条),共享单几何体
  const barCount = isCoarse ? 4 : 6;
  const halfW = 14;
  const segs = [];
  for (let i = 0; i < barCount; i++) {
    const y = (i / (barCount - 1)) * 4 - 2; // -2 ~ 2
    segs.push(-halfW, y, 0.3, halfW, y, 0.3);
  }
  const barGeo = new THREE.BufferGeometry();
  barGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(segs), 3));
  const barMat = new THREE.LineBasicMaterial({
    color: '#22d3ee',
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const bars = new THREE.LineSegments(barGeo, barMat);

  // 前沿亮线(比光栅更宽更亮,带出扫描边缘)
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-15, 0, 0.3, 15, 0, 0.3]), 3));
  const edgeMat = new THREE.LineBasicMaterial({
    color: '#a5f3fc',
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const edge = new THREE.Line(edgeGeo, edgeMat);

  const group = new THREE.Group();
  group.add(bars);
  group.add(edge);

  const update = (t) => {
    const progress = (t * 0.055) % 1;
    group.position.y = -2.5 + progress * 11;
    const a = Math.sin(progress * Math.PI); // 上下两端淡入淡出
    barMat.opacity = a * 0.12;
    edgeMat.opacity = a * 0.5;
  };
  return { mesh: group, update };
}

/* ---------- 三维坐标轴线(X/Y/Z 半透明轴 + 末端短线刻度,空间参考系) ---------- */
function createAxisLines() {
  const pts = [];
  const cols = [];
  const push = (a, b, c) => {
    pts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
    cols.push(c.r, c.g, c.b, c.r, c.g, c.b);
  };
  const cBlue = new THREE.Color('#60a5fa');
  const cCyan = new THREE.Color('#22d3ee');
  const cSky = new THREE.Color('#93c5fd');
  // X 轴(蓝) + 两端刻度
  push([-6.5, 0, 0], [6.5, 0, 0], cBlue);
  push([6.5, -0.35, 0], [6.5, 0.35, 0], cBlue);
  push([-6.5, -0.35, 0], [-6.5, 0.35, 0], cBlue);
  // Y 轴(青) + 顶端刻度
  push([0, 0, 0], [0, 5.2, 0], cCyan);
  push([-0.35, 5.2, 0], [0.35, 5.2, 0], cCyan);
  // Z 轴(淡蓝) + 两端刻度
  push([0, 0, -5], [0, 0, 5], cSky);
  push([0, 0.35, 5], [0, -0.35, 5], cSky);
  push([0, 0.35, -5], [0, -0.35, -5], cSky);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cols), 3));
  const mat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.userData.mat = mat; // 呼吸动画用
  return lines;
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

/* ---------- 悬浮网格(竖直全息网格,缓慢自转 + 透明度呼吸) ---------- */
function createFloatGrid() {
  const grid = new THREE.GridHelper(30, isCoarse ? 10 : 15, '#22d3ee', '#60a5fa');
  grid.position.y = isCoarse ? 5.0 : 5.6;
  grid.rotation.x = Math.PI / 2; // 竖直放置(原平面 xz → 转至 xy,面向相机)
  const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
  mats.forEach((m) => {
    m.transparent = true;
    m.opacity = 0.07;
    m.depthWrite = false;
  });
  grid.userData.mats = mats;
  return grid;
}

/* ---------- 能量脉冲环(地面水平扩散的发光圆环,多环错峰循环) ---------- */
function createPulseRings() {
  const count = isCoarse ? 2 : 3;
  return Array.from({ length: count }, (_, i) => {
    const geo = new THREE.RingGeometry(0.9, 1, 48);
    const mat = new THREE.MeshBasicMaterial({
      color: i % 2 ? '#60a5fa' : '#22d3ee',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.28;
    const data = { phase: i / count, scale: 0.5, maxScale: isCoarse ? 2.6 : 3.4 };
    const update = (t) => {
      const p = (t * 0.22 + data.phase) % 1;
      mesh.scale.setScalar(data.scale + p * data.maxScale);
      mat.opacity = Math.sin(p * Math.PI) * 0.15;
    };
    return { mesh, update };
  });
}

/* ---------- 环绕流光带(曲线轨道 + 沿轨道流动的发光数据点) ---------- */
// 沿预采样轨道定位光点(纯线性插值,零分配,避免 getPointAt 的每帧 Vector3 分配)
function placeOnOrbit(dot, p, samples, sampleCount) {
  // 防御:相位非有限数或索引越界时跳过本帧(光点短暂静止,绝不抛错)
  if (!Number.isFinite(p) || p < 0 || p > 1) return;
  const idx = p * sampleCount;
  if (idx < 0 || idx > sampleCount) return;
  const i0 = Math.floor(idx);
  const a = samples[i0];
  const b = samples[i0 + 1];
  if (!a || !b) return;
  const f = idx - i0;
  dot.position.set(a.x + (b.x - a.x) * f, a.y + (b.y - a.y) * f, a.z + (b.z - a.z) * f);
}

function createOrbitStream() {
  const curve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(-8, 1.2, -3),
      new THREE.Vector3(0, 2.2, -4.6),
      new THREE.Vector3(8, 1.2, -3),
      new THREE.Vector3(8, 1.9, 3),
      new THREE.Vector3(0, 2.9, 4.6),
      new THREE.Vector3(-8, 1.9, 3),
    ],
    true
  );
  const lineGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(64));
  const lineMat = new THREE.LineBasicMaterial({
    color: '#22d3ee',
    transparent: true,
    opacity: 0.09,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const line = new THREE.Line(lineGeo, lineMat);

  // 预采样轨道点(一次性构建,运行时光点仅在采样点间插值)
  const SAMPLE = 128;
  const samples = curve.getSpacedPoints(SAMPLE); // SAMPLE + 1 个点,覆盖 0~1 闭区间

  // 流动光点:共享几何体,沿预采样轨道匀速运动,亮度随相位闪烁(移动端减为 2 个)
  const dotGeo = new THREE.SphereGeometry(0.09, 6, 6);
  const dotCount = isCoarse ? 2 : 3;
  const dots = Array.from({ length: dotCount }, (_, i) => {
    const mat = new THREE.MeshBasicMaterial({
      color: i % 2 ? '#60a5fa' : '#22d3ee',
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dot = new THREE.Mesh(dotGeo, mat);
    return { dot, mat, offset: i / dotCount };
  });

  // 反向流动光点(与主光点方向交错,双向数据环流;移动端 1 个)
  const reverseDots = Array.from({ length: 1 }, (_, i) => {
    const mat = new THREE.MeshBasicMaterial({
      color: '#60a5fa',
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const dot = new THREE.Mesh(dotGeo, mat);
    return { dot, mat, offset: i * 0.5 };
  });

  const update = (t) => {
    lineMat.opacity = 0.13 + Math.sin(t * 0.6) * 0.04;
    const base = t * 0.055;
    dots.forEach((d) => {
      const p = (base + d.offset) % 1;
      placeOnOrbit(d.dot, p, samples, SAMPLE);
      d.mat.opacity = 0.45 + Math.sin(p * Math.PI * 2) * 0.4;
    });
    // 反向点沿反向慢速流转
    const revBase = 1 - t * 0.04;
    reverseDots.forEach((d) => {
      const p = (revBase + d.offset) % 1;
      placeOnOrbit(d.dot, p, samples, SAMPLE);
      d.mat.opacity = 0.3 + Math.sin(p * Math.PI * 2) * 0.35;
    });
  };
  return {
    line,
    dots: [...dots.map((d) => d.dot), ...reverseDots.map((d) => d.dot)],
    update,
  };
}

/* ---------- 3D 场景 ---------- */
function Scene({ paused = false }) {
  const camera = useThree((s) => s.camera);
  const group = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const acc = useRef(0); // 帧率限制累积器
  const particles = useMemo(() => createParticles(), []);
  const packetFlow = useMemo(() => createPacketFlow(particles.edges, particles.positions), [particles]);
  const grid = useMemo(() => createGrid(), []);
  const scan = useMemo(() => createScanBeam(), []);
  const scanner = useMemo(() => createScanner(), []);
  const axisLines = useMemo(() => createAxisLines(), []);
  const streams = useMemo(() => createStreams(), []);
  const floatGrid = useMemo(() => createFloatGrid(), []);
  const rings = useMemo(() => createPulseRings(), []);
  const orbit = useMemo(() => createOrbitStream(), []);
  const scrollSpeed = useRef(0); // 平滑滚动速度(驱动背景透明度反馈)
  const lastScrollY = useRef(0);

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
      // 自转 + 鼠标视差:整体朝向与横向位置随鼠标平滑偏移,背景"活"起来
      const targetRy = t * 0.05 + mouse.current.x * 0.1;
      group.current.rotation.y += (targetRy - group.current.rotation.y) * 0.12;
      group.current.position.x += (mouse.current.x * 0.4 - group.current.position.x) * 0.05;
      // 滚动视差(纵向) + 鼠标纵向视差
      group.current.position.y = -window.scrollY * 0.0009 + mouse.current.y * -0.2;
    }

    // 滚动速度反馈:滚动越快,网格/线框/扫描线越亮(滚动驱动背景"沸腾")
    const sy = window.scrollY;
    const dy = Math.abs(sy - lastScrollY.current);
    lastScrollY.current = sy;
    scrollSpeed.current += (Math.min(dy / 60, 24) - scrollSpeed.current) * 0.25;
    const speedBoost = Math.min(scrollSpeed.current * 0.02, 0.18);

    particles.update(t, mouse.current);
    packetFlow.update();
    grid.userData.mat.opacity = 0.2 + speedBoost + Math.sin(t * 0.5) * 0.05;
    grid.userData.updateWave(t);
    scan.update(t);
    scanner.update(t);
    axisLines.userData.mat.opacity = 0.12 + speedBoost * 0.6 + Math.sin(t * 0.45 + 2) * 0.05;
    streams.forEach((s) => s.update(t));

    // 悬浮网格:缓慢自转 + 透明度呼吸(滚动加速时更亮)
    floatGrid.rotation.z += delta * 0.05;
    const fg = 0.085 + speedBoost * 0.5 + Math.sin(t * 0.7 + 0.8) * 0.025;
    floatGrid.userData.mats.forEach((m) => {
      m.opacity = Math.max(0.02, fg);
    });

    rings.forEach((r) => r.update(t));
    orbit.update(t);
  });

  return (
    <group ref={group}>
      <primitive object={particles.lines} />
      <primitive object={particles.points} />
      <primitive object={particles.corePoints} />
      <primitive object={packetFlow.points} />
      <primitive object={grid} />
      <primitive object={scan.mesh} />
      <primitive object={scanner.mesh} />
      <primitive object={axisLines} />
      {streams.map((s, i) => (
        <primitive key={i} object={s.line} />
      ))}
      <primitive object={floatGrid} />
      {rings.map((r, i) => (
        <primitive key={i} object={r.mesh} />
      ))}
      <primitive object={orbit.line} />
      {orbit.dots.map((d, i) => (
        <primitive key={i} object={d} />
      ))}
    </group>
  );
}

/* ---------- WebGL 不可用时的静态降级背景 ---------- */
function StaticTechBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="css-horizon" />
      <div className="css-grid-floor" />
      <div className="css-scan-line" />
      <div className="css-data-dots css-dot-a" />
      <div className="css-data-dots css-dot-b" />
      <div className="css-data-dots css-dot-c" />
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }} />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ backgroundColor: 'rgba(34, 211, 238, 0.1)' }} />
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
  // 点击能量波纹:点击页面任意处产生扩散反馈(不拦截交互,reduce-motion 时跳过)
  const [ripples, setRipples] = useState([]);
  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const onDown = (e) => {
      const id = `${Date.now()}-${Math.random()}`;
      setRipples((list) => [...list.slice(-4), { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setRipples((list) => list.filter((r) => r.id !== id));
      }, 740);
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, []);

  // HUD 坐标刻度(上下两排,长短交替)
  const ticks = useMemo(
    () =>
      Array.from({ length: 21 }, (_, i) => (
        <span key={i} className={i % 3 === 0 ? 'hud-tick' : 'hud-tick hud-tick-sm'} />
      )),
    []
  );

  // HUD 竖排数据条刻度(左右各一排,长短交替)
  const railTicks = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => (
        <span key={i} className={i % 2 === 0 ? 'hud-rail-tick' : 'hud-rail-tick hud-rail-tick-sm'} />
      )),
    []
  );

  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* 背景氛围光晕层(位于 3D 之下,蓝/青/紫三大光斑慢呼吸) */}
      <div className="bg-glow" />
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

      {/* 全息 HUD 装饰:角框 + 坐标刻度 + 竖排数据条 + 状态条 + 十字准星 + 铭牌(纯 CSS,零 JS 开销) */}
      <div className="hud-layer">
        <div className="hud-corner hud-corner-tl" />
        <div className="hud-corner hud-corner-tr" />
        <div className="hud-corner hud-corner-bl" />
        <div className="hud-corner hud-corner-br" />
        <div className="hud-corner-label hud-label-tl">TWIN-07</div>
        <div className="hud-corner-label hud-label-tr">MESH</div>
        <div className="hud-corner-label hud-label-bl">VER 2.1</div>
        <div className="hud-corner-label hud-label-br">TELEMETRY</div>
        <div className="hud-track-tag">TRACKING // ACTIVE</div>
        <div className="hud-tick-row hud-tick-row-top">{ticks}</div>
        <div className="hud-tick-row hud-tick-row-bottom">{ticks}</div>
        <div className="hud-rail hud-rail-left">
          <span className="hud-rail-label">X-AXIS</span>
          {railTicks}
        </div>
        <div className="hud-rail hud-rail-right">
          <span className="hud-rail-label">Y-AXIS</span>
          {railTicks}
        </div>
        <div className="hud-status">SYSTEM ONLINE</div>
        <div className="hud-crosshair" />
        <div className="hud-crosshair-ring" />
      </div>

      {/* 点击能量波纹(浮于内容之上,pointer-events:none 不挡交互) */}
      {ripples.map((r) => (
        <span key={r.id} className="bg-ripple" style={{ left: r.x, top: r.y, zIndex: 999 }} />
      ))}
    </div>
  );
}
