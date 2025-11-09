const Background3DGrid = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.4 }}
      >
        <defs>
          <pattern
            id="grid-pattern"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 60 0 L 0 0 0 60"
              fill="none"
              stroke="rgba(42, 42, 42, 0.8)"
              strokeWidth="1"
            />
          </pattern>

          <linearGradient id="grid-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(42, 42, 42, 0)" />
            <stop offset="20%" stopColor="rgba(42, 42, 42, 0.4)" />
            <stop offset="50%" stopColor="rgba(23, 255, 154, 0.15)" />
            <stop offset="80%" stopColor="rgba(42, 42, 42, 0.4)" />
            <stop offset="100%" stopColor="rgba(42, 42, 42, 0)" />
          </linearGradient>

          <radialGradient id="grid-radial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(23, 255, 154, 0.08)" />
            <stop offset="50%" stopColor="rgba(23, 255, 154, 0.03)" />
            <stop offset="100%" stopColor="rgba(23, 255, 154, 0)" />
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        <rect width="100%" height="100%" fill="url(#grid-gradient)" />
        <rect width="100%" height="100%" fill="url(#grid-radial)" />
      </svg>

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#17ff9a]/5 to-transparent" />

      <div className="absolute top-1/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#17ff9a]/30 to-transparent" />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#17ff9a]/40 to-transparent" />
      <div className="absolute top-3/4 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#17ff9a]/30 to-transparent" />

      <div className="absolute left-1/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#17ff9a]/20 to-transparent" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#17ff9a]/30 to-transparent" />
      <div className="absolute left-3/4 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#17ff9a]/20 to-transparent" />
    </div>
  );
};

export default Background3DGrid;
