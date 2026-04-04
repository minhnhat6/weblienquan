'use client';

/**
 * SpinWheel - Canvas-based spinning wheel component
 */

import { useRef, useEffect, useCallback } from 'react';
import { WHEEL, COLORS } from './constants';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Reward {
  emoji?: string;
  label: string;
  color: string;
  chance?: number;
  amount?: number;
}

interface SpinWheelProps {
  rotation: number;
  spinning: boolean;
  rewards: Reward[];
}

// ─── Drawing Helpers ───────────────────────────────────────────────────────────

function drawOuterRing(ctx: CanvasRenderingContext2D, cx: number, cy: number, outerR: number) {
  const goldGrad = ctx.createRadialGradient(cx, cy, outerR - 18, cx, cy, outerR);
  goldGrad.addColorStop(0, COLORS.gold.dark);
  goldGrad.addColorStop(0.3, COLORS.gold.light);
  goldGrad.addColorStop(0.6, COLORS.gold.highlight);
  goldGrad.addColorStop(1, COLORS.gold.border);

  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, 2 * Math.PI);
  ctx.fillStyle = goldGrad;
  ctx.fill();

  // Dark border
  ctx.beginPath();
  ctx.arc(cx, cy, outerR - WHEEL.RING_WIDTH + 2, 0, 2 * Math.PI);
  ctx.fillStyle = '#5a3000';
  ctx.fill();
}

function drawSegment(
  ctx: CanvasRenderingContext2D,
  reward: Reward,
  startAngle: number,
  arc: number,
  innerR: number
) {
  const endAngle = startAngle + arc;

  // Fill
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, innerR, startAngle, endAngle);
  ctx.closePath();
  ctx.fillStyle = reward.color;
  ctx.fill();

  // Border
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, innerR, startAngle, endAngle);
  ctx.closePath();
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Label
  ctx.save();
  ctx.rotate(startAngle + arc / 2);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${reward.amount === 0 ? 9 : 11}px 'Segoe UI', sans-serif`;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 3;
  ctx.fillText(reward.label, innerR - 8, 4);
  ctx.restore();
}

function drawSilverBall(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const ballGrad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, WHEEL.BALL_RADIUS);
  ballGrad.addColorStop(0, '#ffffff');
  ballGrad.addColorStop(0.4, '#c0c0c0');
  ballGrad.addColorStop(1, '#707070');

  ctx.beginPath();
  ctx.arc(x, y, WHEEL.BALL_RADIUS, 0, 2 * Math.PI);
  ctx.fillStyle = ballGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

function drawCenterButton(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  const { CENTER_RADIUS, INNER_CENTER_RADIUS } = WHEEL;

  // Outer gradient
  const centerGrad = ctx.createRadialGradient(cx - 12, cy - 12, 4, cx, cy, CENTER_RADIUS);
  centerGrad.addColorStop(0, COLORS.center.light);
  centerGrad.addColorStop(0.3, COLORS.gold.light);
  centerGrad.addColorStop(0.7, COLORS.center.mid);
  centerGrad.addColorStop(1, COLORS.center.dark);

  ctx.beginPath();
  ctx.arc(cx, cy, CENTER_RADIUS, 0, 2 * Math.PI);
  ctx.fillStyle = centerGrad;
  ctx.fill();
  ctx.strokeStyle = COLORS.center.border;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner ring
  const innerRingGrad = ctx.createRadialGradient(cx - 8, cy - 8, 2, cx, cy, INNER_CENTER_RADIUS);
  innerRingGrad.addColorStop(0, '#fff176');
  innerRingGrad.addColorStop(0.5, '#ffb300');
  innerRingGrad.addColorStop(1, '#e65100');

  ctx.beginPath();
  ctx.arc(cx, cy, INNER_CENTER_RADIUS, 0, 2 * Math.PI);
  ctx.fillStyle = innerRingGrad;
  ctx.fill();

  // Shine highlight
  ctx.beginPath();
  ctx.arc(cx - 14, cy - 14, 16, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function SpinWheel({ rotation, spinning, rewards }: SpinWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { SIZE, OUTER_PADDING, RING_WIDTH } = WHEEL;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const outerR = SIZE / 2 - OUTER_PADDING;
  const innerR = outerR - RING_WIDTH;

  const draw = useCallback((rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, SIZE, SIZE);

    const n = rewards.length;
    const arc = (2 * Math.PI) / n;

    drawOuterRing(ctx, cx, cy, outerR);

    // Draw segments
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rot * Math.PI) / 180);

    for (let i = 0; i < n; i++) {
      const startAngle = i * arc - Math.PI / 2;
      drawSegment(ctx, rewards[i], startAngle, arc, innerR);
    }

    // Draw silver balls
    for (let i = 0; i < n; i++) {
      const angle = i * arc - Math.PI / 2;
      const bx = Math.cos(angle) * (innerR + 11);
      const by = Math.sin(angle) * (innerR + 11);
      drawSilverBall(ctx, bx, by);
    }

    ctx.restore();
    drawCenterButton(ctx, cx, cy);
  }, [cx, cy, innerR, outerR, rewards, SIZE]);

  useEffect(() => {
    draw(rotation);
  }, [rotation, draw]);

  // Animation via RAF
  const rafRef = useRef<number>(0);
  const startRef = useRef<number | null>(null);
  const startRotRef = useRef(0);
  const targetRotRef = useRef(0);
  const durationRef = useRef(4500);

  useEffect(() => {
    if (!spinning) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    startRef.current = null;
    startRotRef.current = rotation - (targetRotRef.current - startRotRef.current);

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / durationRef.current, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out cubic
      const currentRot = startRotRef.current + (targetRotRef.current - startRotRef.current) * eased;
      draw(currentRot);
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw, rotation, spinning]);

  return <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ display: 'block' }} />;
}
