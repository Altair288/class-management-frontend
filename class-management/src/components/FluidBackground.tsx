import React, { useRef, useEffect } from "react";

const COLORS = [
  "rgba(33,150,243,0.7)",
  "rgba(227,242,253,0.7)",
  "rgba(100,181,246,0.7)",
  "rgba(187,222,251,0.7)",
  "rgba(129,212,250,0.7)",
  "rgba(30,136,229,0.7)",
  "rgba(144,202,249,0.7)",
  "rgba(255,255,255,0.7)",
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export default function FluidBackground() {
  const N = 8; // canvas数量
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = Array.from({ length: N }, () => useRef<HTMLCanvasElement>(null));
  const turbulenceRef = useRef<SVGFEElement>(null);
  const animationRef = useRef<number>();

  // 动态调整canvas大小和位置
  useEffect(() => {
    const resize = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const size = Math.max(width, height) * 2; // 更大尺寸
      canvasRefs.forEach((ref) => {
        if (!ref.current) return;
        ref.current.width = size;
        ref.current.height = size;
        ref.current.style.position = "absolute";
        ref.current.style.width = `${size}px`;
        ref.current.style.height = `${size}px`;
        ref.current.style.left = `${(width - size) / 2}px`;
        ref.current.style.top = `${(height - size) / 2}px`;
      });
    };
    window.addEventListener("resize", resize);
    resize();
    return () => window.removeEventListener("resize", resize);
  }, []);

  // 动态流体动画 + 区块移动
  useEffect(() => {
    let frame = 0;
    // 每个区块的运动参数
    const params = Array.from({ length: N }, (_, i) => ({
      phase: Math.random() * Math.PI * 2,
      speed: randomBetween(0.5, 1.2),
      radius: randomBetween(0.25, 0.45),
      colorIndex: i % COLORS.length,
    }));

    const animate = () => {
      // 动态调整 baseFrequency
      if (turbulenceRef.current) {
        const freq = 0.003 + Math.sin(frame / 60) * 0.0015;
        turbulenceRef.current.setAttribute("baseFrequency", freq.toString());
      }
      // 区块运动
      canvasRefs.forEach((ref, i) => {
        const canvas = ref.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const size = canvas.width;
        ctx.clearRect(0, 0, size, size);

        // 动态渐变中心
        const t = frame / (80 + i * 10);
        const cx = size / 2 + Math.sin(t + params[i].phase) * size * 0.25;
        const cy = size / 2 + Math.cos(t + params[i].phase) * size * 0.25;
        const grad = ctx.createRadialGradient(
          cx, cy, size * 0.1,
          size / 2, size / 2, size * params[i].radius
        );
        grad.addColorStop(0, COLORS[params[i].colorIndex]);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size * params[i].radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.filter = "blur(24px)";
        ctx.fill();
        ctx.filter = "none";
      });
      frame++;
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <>
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="fluid-filter" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            ref={turbulenceRef}
            type="fractalNoise"
            baseFrequency="0.003"
            numOctaves="2"
            seed="42"
            result="turb"
          />
          <feDisplacementMap
            in2="turb"
            in="SourceGraphic"
            scale="100"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>
      <div
        ref={containerRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          overflow: "hidden",
        }}
      >
        {canvasRefs.map((ref, i) => (
          <canvas
            key={i}
            ref={ref}
            style={{
              filter: "url(#fluid-filter)",
              mixBlendMode: "lighten",
              pointerEvents: "none",
              opacity: 0.7,
              transition: "left 0.2s, top 0.2s",
            }}
          />
        ))}
      </div>
    </>
  );
}