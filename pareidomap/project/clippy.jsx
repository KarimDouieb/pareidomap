// Updated mascot — minimal hand-drawn globe with Klein blue accents.

function ClippyGlobe({ size = 160, mood = 'searching' }) {
  return (
    <div style={{
      width: size, height: size,
      position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes mascot-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes mascot-glass {
          0%   { transform: translate(0,0) rotate(-6deg); }
          25%  { transform: translate(-7px,-3px) rotate(-12deg); }
          50%  { transform: translate(5px,2px) rotate(2deg); }
          75%  { transform: translate(-2px,4px) rotate(-8deg); }
          100% { transform: translate(0,0) rotate(-6deg); }
        }
        @keyframes mascot-blink {
          0%,92%,100% { transform: scaleY(1); }
          95% { transform: scaleY(0.1); }
        }
        .mascot-body { animation: mascot-bounce 2.4s ease-in-out infinite; }
        .mascot-glass { animation: mascot-glass 5s ease-in-out infinite; transform-origin: 50px 50px; }
        .mascot-eye { animation: mascot-blink 4s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
      `}</style>

      <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
        <defs>
          <filter id="mascot-wob">
            <feTurbulence baseFrequency="0.02" numOctaves="2" seed="2" />
            <feDisplacementMap in="SourceGraphic" scale="1.2" />
          </filter>
        </defs>

        {/* shadow */}
        <ellipse cx="100" cy="178" rx="36" ry="3.5" fill="#0A0A0A" opacity="0.12" />

        <g className="mascot-body" filter="url(#mascot-wob)">
          {/* globe */}
          <circle cx="100" cy="100" r="56" fill="#fff" stroke="#0A0A0A" strokeWidth="1.4" />

          {/* meridians (Klein blue) */}
          <ellipse cx="100" cy="100" rx="56" ry="22" stroke="#002FA7" strokeWidth="0.9" fill="none" opacity="0.5" />
          <ellipse cx="100" cy="100" rx="22" ry="56" stroke="#002FA7" strokeWidth="0.9" fill="none" opacity="0.5" />
          <ellipse cx="100" cy="100" rx="42" ry="56" stroke="#002FA7" strokeWidth="0.7" fill="none" opacity="0.35" />

          {/* equator */}
          <line x1="44" y1="100" x2="156" y2="100" stroke="#002FA7" strokeWidth="0.9" opacity="0.6" />

          {/* tiny continent silhouettes in Klein blue */}
          <path d="M70 80 Q 76 72 84 76 Q 92 70 96 82 Q 92 92 84 90 Q 76 92 70 80 Z" fill="#002FA7" opacity="0.85" />
          <path d="M118 96 Q 126 92 132 100 Q 138 108 132 116 Q 124 120 118 112 Z" fill="#002FA7" opacity="0.85" />
          <path d="M82 124 Q 88 118 96 122 Q 102 128 98 134 Q 90 138 82 132 Z" fill="#002FA7" opacity="0.85" />

          {/* eyes */}
          <circle className="mascot-eye" cx="84" cy="94" r="3" fill="#0A0A0A" />
          <circle className="mascot-eye" cx="116" cy="94" r="3" fill="#0A0A0A" />

          {/* mouth */}
          {mood === 'searching' && <path d="M92 110 Q 100 114 108 110" stroke="#0A0A0A" strokeWidth="1.3" strokeLinecap="round" fill="none" />}
          {mood === 'thinking' && <path d="M92 112 L 108 112" stroke="#0A0A0A" strokeWidth="1.3" strokeLinecap="round" />}
          {mood === 'found'    && <path d="M90 108 Q 100 118 110 108" stroke="#0A0A0A" strokeWidth="1.5" strokeLinecap="round" fill="none" />}
        </g>

        {/* magnifying glass */}
        <g className="mascot-glass">
          <circle cx="142" cy="62" r="17" fill="#fff" fillOpacity="0.4" stroke="#0A0A0A" strokeWidth="1.4" />
          <line x1="154" y1="74" x2="170" y2="90" stroke="#0A0A0A" strokeWidth="3" strokeLinecap="round" />
          <line x1="154" y1="74" x2="170" y2="90" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </svg>
    </div>
  );
}

Object.assign(window, { ClippyGlobe });
