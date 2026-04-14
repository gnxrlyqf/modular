import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  baseRadius: number;
  radius: number;
  brightness: number;
  baseBrightness: number;
  rotation: number;
  rotationSpeed: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  vx: number;
  vy: number;
  originX: number;
  originY: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  centerX: number;
  centerY: number;
}

const STAR_COUNT = 220;
const MAGNETIC_RADIUS = 180;
const MAGNETIC_STRENGTH = 0.025;
const RETURN_STRENGTH = 0.03;
const MAX_SCALE = 3;

function createStar(width: number, height: number): Star {
  const cx = width / 2 + (Math.random() - 0.5) * 40; // orbit center within ~20px of page center
  const cy = height / 2 + (Math.random() - 0.5) * 40;

  // Place star at a random angle and radius from its orbit center
  const angle = Math.random() * Math.PI * 2;
  const orbitRadius = Math.random() * Math.max(width, height) * 0.65;
  const x = cx + Math.cos(angle) * orbitRadius;
  const y = cy + Math.sin(angle) * orbitRadius;

  const baseRadius = 0.6 + Math.random() * 2;
  const baseBrightness = 0.25 + Math.random() * 0.75;

  // Orbit speed: derived from linear pixel speed so inner stars move faster.
  // Linear speed ranges from ~0.04 px/frame near center to ~0.015 px/frame at edge.
  const maxOrbit = Math.max(width, height) * 0.65;
  const t = Math.min(1, orbitRadius / Math.max(maxOrbit, 1)); // 0=center, 1=edge
  const linearSpeed = (0.04 - t * 0.025) * (0.8 + Math.random() * 0.4);
  const orbitSpeed = linearSpeed / Math.max(orbitRadius, 10);

  // Self-rotation: slow spin of the note visual, same direction
  const rotationSpeed = 0.0003 + Math.random() * 0.0005;

  return {
    x,
    y,
    baseRadius,
    radius: baseRadius,
    brightness: baseBrightness,
    baseBrightness,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed,
    twinkleSpeed: 0.3 + Math.random() * 0.8,
    twinkleOffset: Math.random() * Math.PI * 2,
    vx: 0,
    vy: 0,
    originX: x,
    originY: y,
    angle,
    orbitRadius,
    orbitSpeed,
    centerX: cx,
    centerY: cy,
  };
}

function drawMusicNote(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  brightness: number
) {
  const scale = radius * 1.2;
  const alpha = Math.min(1, brightness);
  const noteColor = `rgba(220, 230, 255, ${alpha})`;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation * 0.3);

  ctx.shadowColor = `rgba(180, 200, 255, ${alpha * 0.5})`;
  ctx.shadowBlur = scale * 3;

  // ─── Note head: solid filled ellipse, tilted ~25° (matching engraving standard) ───
  ctx.save();
  ctx.rotate(-0.44); // ~25 degrees in radians
  ctx.beginPath();
  ctx.ellipse(0, 0, scale * 1.1, scale * 0.72, 0, 0, Math.PI * 2);
  ctx.fillStyle = noteColor;
  ctx.fill();
  ctx.restore();

  // ─── Stem: starts at right edge of head, goes straight up ───
  const stemX = scale * 0.95;
  const stemBottom = -scale * 0.35; // connects near right side of tilted head
  const stemTop = -scale * 3.8;

  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.moveTo(stemX, stemBottom);
  ctx.lineTo(stemX, stemTop);
  ctx.strokeStyle = noteColor;
  ctx.lineWidth = Math.max(0.6, scale * 0.22);
  ctx.lineCap = "round";
  ctx.stroke();

  // ─── Flag: S-curve — starts right at stem top, arcs out then hooks down ───
  ctx.beginPath();
  ctx.moveTo(stemX, stemTop);
  // Control point 1: push right and slightly down (the initial rightward arc)
  // Control point 2: come back left and further down (the hook)
  // End point: below and slightly left of stem, the tail of the flag
  ctx.bezierCurveTo(
    stemX + scale * 2.2, stemTop + scale * 0.6,   // cp1: far right, slight drop
    stemX + scale * 1.0, stemTop + scale * 2.2,   // cp2: back toward stem, midway
    stemX + scale * 0.3, stemTop + scale * 2.8    // end: just right of stem, hanging down
  );
  ctx.strokeStyle = noteColor;
  ctx.lineWidth = Math.max(0.6, scale * 0.22);
  ctx.stroke();

  ctx.restore();
}

export default function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = `${window.innerWidth}px`;
      canvas!.style.height = `${window.innerHeight}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Reinitialize stars on resize
      const w = window.innerWidth;
      const h = window.innerHeight;
      starsRef.current = Array.from({ length: STAR_COUNT }, () =>
        createStar(w, h)
      );
    }

    resize();
    window.addEventListener("resize", resize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseRef.current.x = e.touches[0].clientX;
        mouseRef.current.y = e.touches[0].clientY;
        mouseRef.current.active = true;
      }
    };

    const handleTouchEnd = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleTouchEnd);

    let time = 0;

    function animate() {
      time += 0.016; // ~60fps time step
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mouse = mouseRef.current;

      ctx!.clearRect(0, 0, w, h);

      for (const star of starsRef.current) {
        // Orbital rotation — advance angle and move origin along the orbit path
        star.angle += star.orbitSpeed;
        star.originX = star.centerX + Math.cos(star.angle) * star.orbitRadius;
        star.originY = star.centerY + Math.sin(star.angle) * star.orbitRadius;

        // Self-rotation of the note visual
        star.rotation += star.rotationSpeed;

        // Twinkle
        const twinkle =
          Math.sin(time * star.twinkleSpeed + star.twinkleOffset) * 0.15;
        star.brightness = Math.max(
          0.15,
          Math.min(1, star.baseBrightness + twinkle)
        );

        if (mouse.active) {
          const dx = mouse.x - star.x;
          const dy = mouse.y - star.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAGNETIC_RADIUS) {
            const proximity = 1 - dist / MAGNETIC_RADIUS;
            // Attract toward cursor
            star.vx += dx * MAGNETIC_STRENGTH * proximity * 0.1;
            star.vy += dy * MAGNETIC_STRENGTH * proximity * 0.1;
            // Scale up
            const targetRadius =
              star.baseRadius * (1 + proximity * (MAX_SCALE - 1));
            star.radius += (targetRadius - star.radius) * 0.08;
            // Brighten
            star.brightness = Math.min(
              1,
              star.brightness + proximity * 0.4
            );
          } else {
            // Shrink back
            star.radius += (star.baseRadius - star.radius) * 0.05;
          }
        } else {
          star.radius += (star.baseRadius - star.radius) * 0.05;
        }

        // Return to origin
        star.vx += (star.originX - star.x) * RETURN_STRENGTH;
        star.vy += (star.originY - star.y) * RETURN_STRENGTH;

        // Damping
        star.vx *= 0.88;
        star.vy *= 0.88;

        // Update position
        star.x += star.vx;
        star.y += star.vy;

        // Keep in bounds
        star.x = Math.max(0, Math.min(w, star.x));
        star.y = Math.max(0, Math.min(h, star.y));

        drawMusicNote(
          ctx!,
          star.x,
          star.y,
          star.radius,
          star.rotation,
          star.brightness
        );
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="star-field-canvas"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
