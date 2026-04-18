// Hand-drawn style map overlay — Klein blue, slightly wobbly strokes, hand labels.

function MapOverlay({
  region,
  borderColor = '#002FA7',
  subBorderColor = '#737373',
  showBorder = true,
  showCities = true,
  showSeas = true,
  showBordering = true,
  fontFace = 'sans',
  fillTint = false,
}) {
  const R = REGIONS[region];
  if (!R) return null;

  const font = {
    sans: 'var(--sans)',
    serif: 'var(--serif)',
    mono: 'var(--mono)',
    hand: 'var(--hand)',
  }[fontFace] || 'var(--sans)';

  return (
    <svg
      viewBox={R.viewBox}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        pointerEvents: 'none',
        overflow: 'visible',
      }}
    >
      <defs>
        <filter id={`wob-${region}`}>
          <feTurbulence baseFrequency="0.015" numOctaves="2" seed="3" />
          <feDisplacementMap in="SourceGraphic" scale="1.4" />
        </filter>
      </defs>

      {/* bordering countries (dashed, behind) */}
      {showBordering && R.bordering && R.bordering.map((b, i) => (
        <g key={i} opacity="0.7">
          <path d={b.path} fill="none" stroke={subBorderColor}
            strokeWidth="0.6" strokeDasharray="1.5 2" strokeLinejoin="round" />
          <text x={textCenter(b.path).x} y={textCenter(b.path).y}
            fontSize="5" fill={subBorderColor}
            fontFamily="var(--mono)" textAnchor="middle"
            letterSpacing="0.5">
            {b.label}
          </text>
        </g>
      ))}

      {/* islands */}
      {R.extras && R.extras.map((ex, i) => (
        showBorder && (
          <g key={i} filter={`url(#wob-${region})`}>
            {fillTint && <path d={ex.path} fill={borderColor} fillOpacity="0.06" />}
            <path d={ex.path} fill="none" stroke={borderColor}
              strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        )
      ))}

      {/* main border — wobbly hand-drawn look */}
      {showBorder && (
        <g filter={`url(#wob-${region})`}>
          {fillTint && <path d={R.path} fill={borderColor} fillOpacity="0.06" />}
          {/* shadow stroke */}
          <path d={R.path} fill="none" stroke={borderColor}
            strokeWidth="2.6" strokeOpacity="0.12" strokeLinejoin="round" />
          {/* main */}
          <path d={R.path} fill="none" stroke={borderColor}
            strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
        </g>
      )}

      {/* cities */}
      {showCities && R.cities.map((c, i) => (
        <g key={i}>
          {c.capital ? (
            <>
              <circle cx={c.x} cy={c.y} r={3.2} fill="none" stroke={borderColor} strokeWidth="0.7" />
              <circle cx={c.x} cy={c.y} r={1.4} fill={borderColor} />
            </>
          ) : (
            <circle cx={c.x} cy={c.y} r={1.1} fill={borderColor} />
          )}
          <text
            x={c.x + 5} y={c.y + 1.6}
            fontSize="5"
            fill={borderColor}
            fontFamily="var(--mono)"
            letterSpacing="0.4"
            fontWeight={c.capital ? 700 : 400}
          >
            {c.name}
          </text>
        </g>
      ))}

      {/* sea labels — italic serif by default, hand if requested */}
      {showSeas && R.seas.map((s, i) => (
        <text
          key={i}
          x={s.x} y={s.y}
          fontSize={fontFace === 'hand' ? 10 : 6}
          fill={subBorderColor}
          fontFamily={font}
          fontStyle={fontFace === 'serif' ? 'italic' : 'normal'}
          textAnchor="middle"
          letterSpacing={fontFace === 'hand' ? 0 : 1.2}
          transform={`rotate(${s.rot || 0} ${s.x} ${s.y})`}
          opacity="0.8"
        >
          {fontFace === 'hand' ? s.name : s.name.toUpperCase().split('').join(' ')}
        </text>
      ))}
    </svg>
  );
}

function textCenter(d) {
  const coords = d.match(/-?\d+(\.\d+)?/g) || [];
  const xs = [], ys = [];
  for (let i = 0; i < coords.length; i += 2) {
    xs.push(parseFloat(coords[i]));
    ys.push(parseFloat(coords[i + 1]));
  }
  return {
    x: xs.reduce((a, b) => a + b, 0) / xs.length,
    y: ys.reduce((a, b) => a + b, 0) / ys.length,
  };
}

Object.assign(window, { MapOverlay });
