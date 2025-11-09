import { useEffect, useRef } from 'react';

const AnimatedGlobe = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    let size = 500;
    let centerX = 250;
    let centerY = 250;
    let radius = 180;
    let rotation = 0;

    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;

      size = Math.min(container.clientWidth, container.clientHeight, 500);
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      centerX = size / 2;
      centerY = size / 2;
      radius = size * 0.36;
    };

    updateCanvasSize();

    const nodes = [
      { lat: 51.5074, lon: -0.1278, label: 'London' },
      { lat: 40.7128, lon: -74.0060, label: 'New York' },
      { lat: 35.6762, lon: 139.6503, label: 'Tokyo' },
      { lat: -33.8688, lon: 151.2093, label: 'Sydney' },
      { lat: 1.3521, lon: 103.8198, label: 'Singapore' },
      { lat: -23.5505, lon: -46.6333, label: 'São Paulo' },
    ];

    const connections = [
      [0, 1], [1, 2], [2, 4], [4, 3], [3, 5], [5, 0], [0, 4], [1, 4]
    ];

    const latLonToXYZ = (lat: number, lon: number, r: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);

      const x = -(r * Math.sin(phi) * Math.cos(theta));
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      return { x, y, z };
    };

    const project = (x: number, y: number, z: number, rotation: number) => {
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);

      const rotatedX = x * cosR - z * sinR;
      const rotatedZ = x * sinR + z * cosR;

      const scale = 300 / (300 + rotatedZ);
      const projectedX = rotatedX * scale + centerX;
      const projectedY = y * scale + centerY;

      return { x: projectedX, y: projectedY, scale, z: rotatedZ };
    };

    const drawGlobe = () => {
      ctx.clearRect(0, 0, size, size);

      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 100, 0, Math.PI * 2);
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius + 100);
      gradient.addColorStop(0, 'rgba(23, 255, 154, 0.1)');
      gradient.addColorStop(1, 'rgba(23, 255, 154, 0)');
      ctx.fillStyle = gradient;
      ctx.fill();
      ctx.restore();

      for (let lat = -80; lat <= 80; lat += 20) {
        ctx.beginPath();
        for (let lon = -180; lon <= 180; lon += 2) {
          const pos = latLonToXYZ(lat, lon, radius);
          const proj = project(pos.x, pos.y, pos.z, rotation);

          if (proj.z < 0) {
            if (lon === -180) {
              ctx.moveTo(proj.x, proj.y);
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          }
        }
        ctx.strokeStyle = 'rgba(23, 255, 154, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      for (let lon = -180; lon <= 180; lon += 30) {
        ctx.beginPath();
        for (let lat = -90; lat <= 90; lat += 2) {
          const pos = latLonToXYZ(lat, lon, radius);
          const proj = project(pos.x, pos.y, pos.z, rotation);

          if (proj.z < 0) {
            if (lat === -90) {
              ctx.moveTo(proj.x, proj.y);
            } else {
              ctx.lineTo(proj.x, proj.y);
            }
          }
        }
        ctx.strokeStyle = 'rgba(23, 255, 154, 0.15)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      const projectedNodes = nodes.map(node => {
        const pos = latLonToXYZ(node.lat, node.lon, radius);
        return { ...project(pos.x, pos.y, pos.z, rotation), label: node.label };
      });

      connections.forEach(([i, j]) => {
        const start = projectedNodes[i];
        const end = projectedNodes[j];

        if (start.z < 0 || end.z < 0) {
          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.lineTo(end.x, end.y);

          const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
          gradient.addColorStop(0, 'rgba(23, 255, 154, 0.3)');
          gradient.addColorStop(0.5, 'rgba(23, 255, 154, 0.7)');
          gradient.addColorStop(1, 'rgba(23, 255, 154, 0.3)');
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.stroke();

          const progress = (Date.now() % 2000) / 2000;
          const pulseX = start.x + (end.x - start.x) * progress;
          const pulseY = start.y + (end.y - start.y) * progress;

          ctx.beginPath();
          ctx.arc(pulseX, pulseY, 5, 0, Math.PI * 2);
          const pulseGradient = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, 5);
          pulseGradient.addColorStop(0, 'rgba(23, 255, 154, 1)');
          pulseGradient.addColorStop(1, 'rgba(23, 255, 154, 0)');
          ctx.fillStyle = pulseGradient;
          ctx.fill();
        }
      });

      projectedNodes.forEach(node => {
        if (node.z < 0) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(23, 255, 154, 1)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, 12, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(23, 255, 154, 0.5)';
          ctx.lineWidth = 2;
          ctx.stroke();

          const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 18 * pulse, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(23, 255, 154, ${0.4 * pulse})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    };

    const animate = () => {
      rotation += 0.002;
      drawGlobe();
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto"
      />

      {/* Floating Context Labels */}
      <div className="hidden md:block absolute top-4 left-2 sm:top-8 sm:left-4 lg:top-12 lg:left-8 animate-float">
        <div className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-[#17ff9a]/30 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2.5 shadow-2xl">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#17ff9a] animate-pulse" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">Encrypted Messaging</p>
              <p className="text-[10px] sm:text-xs text-gray-400">E2E Zero-Knowledge</p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block absolute top-4 right-2 sm:top-12 sm:right-4 lg:top-32 lg:right-4 animate-float" style={{ animationDelay: '0.5s' }}>
        <div className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-[#17ff9a]/30 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2.5 shadow-2xl">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#17ff9a] animate-pulse" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">Privacy dApps</p>
              <p className="text-[10px] sm:text-xs text-gray-400">FHE Smart Contracts</p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block absolute bottom-4 left-2 sm:bottom-12 sm:left-4 lg:bottom-20 lg:left-12 animate-float" style={{ animationDelay: '1s' }}>
        <div className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-[#17ff9a]/30 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2.5 shadow-2xl">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#17ff9a] animate-pulse" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">x402 Protocol</p>
              <p className="text-[10px] sm:text-xs text-gray-400">Anonymous Payments</p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block absolute bottom-4 right-2 sm:bottom-8 sm:right-4 lg:bottom-8 lg:right-8 animate-float" style={{ animationDelay: '1.5s' }}>
        <div className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-[#17ff9a]/30 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 lg:px-4 lg:py-2.5 shadow-2xl">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#17ff9a] animate-pulse" />
            <div>
              <p className="text-xs sm:text-sm font-semibold text-white">zkSTARK Proofs</p>
              <p className="text-[10px] sm:text-xs text-gray-400">Verified Privacy</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedGlobe;
