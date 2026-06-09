export default function AnimatedBackground() {
  return (
    <div
      className="animated-bg-dots"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'absolute', inset: 0 }}
      >
        <defs>
          <pattern
            id="dot-pattern"
            x="0"
            y="0"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1.5" cy="1.5" r="1.5" fill="#D4D4D4" />
          </pattern>

          {/* animated shift */}
          <pattern
            id="dot-pattern-animated"
            x="0"
            y="0"
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <animateTransform
              attributeName="patternTransform"
              type="translate"
              from="0 0"
              to="28 28"
              dur="6s"
              repeatCount="indefinite"
            />
            <circle cx="1.5" cy="1.5" r="1.5" fill="#D4D4D4" />
          </pattern>
        </defs>

        {/* base static layer */}
        <rect width="100%" height="100%" fill="url(#dot-pattern)" opacity="0.55" />

        {/* animated layer, slightly offset and lower opacity to create depth */}
        <rect width="100%" height="100%" fill="url(#dot-pattern-animated)" opacity="0.2" />
      </svg>

      {/* radial fade to keep center and edges clean */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,255,255,0.55) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}
