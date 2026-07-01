"use client";

import { useEffect, useMemo, useState } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  height: number;
  rotate: number;
  color: string;
  depth: number;
  duration: number;
  delay: number;
}

const COLORS = [
  "rgba(52,211,153,0.7)",
  "rgba(167,139,250,0.7)",
  "rgba(251,191,36,0.65)",
  "rgba(56,189,248,0.65)",
  "rgba(249,115,22,0.6)",
  "rgba(244,114,182,0.55)",
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x:
      Math.random() < 0.6
        ? Math.random() * 55
        : 55 + Math.random() * 45,
    y: Math.random() * 100,
    size: 2 + Math.random() * 3,
    height:
      Math.random() < 0.5
        ? 2 + Math.random() * 2
        : 6 + Math.random() * 6,
    rotate: Math.random() * 360,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    depth: 0.2 + Math.random() * 0.8,
    duration: 3 + Math.random() * 5,
    delay: Math.random() * 4,
  }));
}

export default function MouseTracker() {
  const particles = useMemo(() => generateParticles(120), []);

  const [mounted, setMounted] = useState(false);

  const [screen, setScreen] = useState({
    width: 1920,
    height: 1080,
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const glowX = useSpring(mouseX, {
    stiffness: 60,
    damping: 20,
  });

  const glowY = useSpring(mouseY, {
    stiffness: 60,
    damping: 20,
  });

  const slowRawX = useSpring(mouseX, {
    stiffness: 15,
    damping: 30,
  });

  const slowRawY = useSpring(mouseY, {
    stiffness: 15,
    damping: 30,
  });

  const medRawX = useSpring(mouseX, {
    stiffness: 30,
    damping: 25,
  });

  const medRawY = useSpring(mouseY, {
    stiffness: 30,
    damping: 25,
  });

  const fastRawX = useSpring(mouseX, {
    stiffness: 55,
    damping: 20,
  });

  const fastRawY = useSpring(mouseY, {
    stiffness: 55,
    damping: 20,
  });

  const slowX = useTransform(
    slowRawX,
    (v) => (v - screen.width / 2) * 0.018
  );

  const slowY = useTransform(
    slowRawY,
    (v) => (v - screen.height / 2) * 0.018
  );

  const medX = useTransform(
    medRawX,
    (v) => (v - screen.width / 2) * 0.035
  );

  const medY = useTransform(
    medRawY,
    (v) => (v - screen.height / 2) * 0.035
  );

  const fastX = useTransform(
    fastRawX,
    (v) => (v - screen.width / 2) * 0.06
  );

  const fastY = useTransform(
    fastRawY,
    (v) => (v - screen.height / 2) * 0.06
  );

  useEffect(() => {
    // Defer to next tick to avoid synchronous setState linter warning
    const timer = setTimeout(() => {
      setMounted(true);
      setScreen({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 0);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleResize = () => {
      setScreen({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      clearTimeout(timer);
      window.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  const slowParticles = particles.filter(
    (p) => p.depth < 0.4
  );

  const mediumParticles = particles.filter(
    (p) => p.depth >= 0.4 && p.depth < 0.7
  );

  const fastParticles = particles.filter(
    (p) => p.depth >= 0.7
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          x: slowX,
          y: slowY,
        }}
      >
        {slowParticles.map((particle) => (
          <FloatingDot
            key={particle.id}
            p={particle}
          />
        ))}
      </motion.div>

      <motion.div
        className="absolute inset-0"
        style={{
          x: medX,
          y: medY,
        }}
      >
        {mediumParticles.map((particle) => (
          <FloatingDot
            key={particle.id}
            p={particle}
          />
        ))}
      </motion.div>

      <motion.div
        className="absolute inset-0"
        style={{
          x: fastX,
          y: fastY,
        }}
      >
        {fastParticles.map((particle) => (
          <FloatingDot
            key={particle.id}
            p={particle}
          />
        ))}
      </motion.div>

      <motion.div
        className="absolute rounded-full"
        style={{
          width: 480,
          height: 480,
          x: glowX,
          y: glowY,
          translateX: "-50%",
          translateY: "-50%",
          background:
            "radial-gradient(circle, rgba(16,185,129,0.07) 0%, rgba(16,185,129,0.02) 50%, transparent 70%)",
        }}
      />

      <motion.div
        className="absolute rounded-full bg-emerald-400"
        style={{
          width: 5,
          height: 5,
          x: glowX,
          y: glowY,
          translateX: "-50%",
          translateY: "-50%",
          boxShadow:
            "0 0 8px 2px rgba(52,211,153,0.7)",
          opacity: 0.75,
        }}
      />
    </div>
  );
}

function FloatingDot({
  p,
}: {
  p: Particle;
}) {
  return (
    <motion.div
      style={{
        position: "absolute",
        left: `${p.x}%`,
        top: `${p.y}%`,
        width: p.size,
        height: p.height,
        borderRadius:
          p.height > p.size * 1.5
            ? 2
            : "50%",
        backgroundColor: p.color,
        rotate: p.rotate,
        opacity: 0.3 + p.depth * 0.5,
      }}
      animate={{
        y: [0, -10 - p.depth * 12, 0],
        rotate: [
          p.rotate,
          p.rotate + 20,
          p.rotate,
        ],
        opacity: [
          0.3 + p.depth * 0.5,
          0.5 + p.depth * 0.4,
          0.3 + p.depth * 0.5,
        ],
      }}
      transition={{
        duration: p.duration,
        delay: p.delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}