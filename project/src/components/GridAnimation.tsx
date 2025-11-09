import { useEffect, useRef } from 'react';

const GridAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    let time = 0;

    const drawGridLines = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      const rotationY = Math.sin(time * 0.3) * 0.4;
      const rotationX = Math.cos(time * 0.2) * 0.3;

      const lines: Array<{
        x1: number;
        y1: number;
        z1: number;
        x2: number;
        y2: number;
        z2: number;
      }> = [];

      const boxWidth = 280;
      const boxHeight = 180;
      const boxDepth = 140;
      const gridSpacing = 70;

      for (let x = -boxWidth; x <= boxWidth; x += gridSpacing) {
        lines.push(
          { x1: x, y1: -boxHeight, z1: -boxDepth, x2: x, y2: boxHeight, z2: -boxDepth },
          { x1: x, y1: -boxHeight, z1: boxDepth, x2: x, y2: boxHeight, z2: boxDepth },
          { x1: x, y1: -boxHeight, z1: -boxDepth, x2: x, y2: -boxHeight, z2: boxDepth },
          { x1: x, y1: boxHeight, z1: -boxDepth, x2: x, y2: boxHeight, z2: boxDepth }
        );
      }

      for (let y = -boxHeight; y <= boxHeight; y += gridSpacing) {
        lines.push(
          { x1: -boxWidth, y1: y, z1: -boxDepth, x2: boxWidth, y2: y, z2: -boxDepth },
          { x1: -boxWidth, y1: y, z1: boxDepth, x2: boxWidth, y2: y, z2: boxDepth },
          { x1: -boxWidth, y1: y, z1: -boxDepth, x2: -boxWidth, y2: y, z2: boxDepth },
          { x1: boxWidth, y1: y, z1: -boxDepth, x2: boxWidth, y2: y, z2: boxDepth }
        );
      }

      for (let z = -boxDepth; z <= boxDepth; z += gridSpacing) {
        lines.push(
          { x1: -boxWidth, y1: -boxHeight, z1: z, x2: boxWidth, y2: -boxHeight, z2: z },
          { x1: -boxWidth, y1: boxHeight, z1: z, x2: boxWidth, y2: boxHeight, z2: z },
          { x1: -boxWidth, y1: -boxHeight, z1: z, x2: -boxWidth, y2: boxHeight, z2: z },
          { x1: boxWidth, y1: -boxHeight, z1: z, x2: boxWidth, y2: boxHeight, z2: z }
        );
      }

      const rotatedLines = lines.map((line) => {
        const rotate = (x: number, y: number, z: number) => {
          const cosY = Math.cos(rotationY);
          const sinY = Math.sin(rotationY);
          const tempX = x * cosY - z * sinY;
          const tempZ = x * sinY + z * cosY;

          const cosX = Math.cos(rotationX);
          const sinX = Math.sin(rotationX);
          const finalY = y * cosX - tempZ * sinX;
          const finalZ = y * sinX + tempZ * cosX;

          return { x: tempX, y: finalY, z: finalZ };
        };

        const p1 = rotate(line.x1, line.y1, line.z1);
        const p2 = rotate(line.x2, line.y2, line.z2);

        return { ...line, p1, p2 };
      });

      rotatedLines.forEach((line) => {
        const scale1 = 500 / (500 + line.p1.z);
        const scale2 = 500 / (500 + line.p2.z);

        const x1 = centerX + line.p1.x * scale1;
        const y1 = centerY + line.p1.y * scale1;
        const x2 = centerX + line.p2.x * scale2;
        const y2 = centerY + line.p2.y * scale2;

        const avgZ = (line.p1.z + line.p2.z) / 2;
        const depth = (avgZ + boxDepth) / (boxDepth * 2);
        const alpha = 0.15 + depth * 0.25;
        const wave = Math.sin(time * 2 + avgZ * 0.01) * 0.15 + 0.85;

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, `rgba(16, 185, 129, ${alpha * wave})`);
        gradient.addColorStop(0.5, `rgba(23, 255, 154, ${alpha * wave * 1.2})`);
        gradient.addColorStop(1, `rgba(16, 185, 129, ${alpha * wave})`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      });

      time += 0.008;
    };

    let animationId: number;
    const animate = () => {
      drawGridLines();
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-40"
      style={{ mixBlendMode: 'screen' }}
    />
  );
};

export default GridAnimation;
