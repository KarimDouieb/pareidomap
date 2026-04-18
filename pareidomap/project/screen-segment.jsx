// Screen 3: Segment — SAM-style with shadcn chrome.

function ScreenSegment({ onBack, onConfirm, variant = 'wall' }) {
  const [pts, setPts] = React.useState([{ x: 52, y: 48, kind: 'add' }]);
  const add = (kind) => {
    const x = 36 + Math.random() * 36;
    const y = 36 + Math.random() * 36;
    setPts(p => [...p, { x, y, kind }]);
  };

  const maskPath = 'M 30 38 Q 22 28 34 20 Q 46 12 58 16 Q 70 12 78 22 Q 88 20 92 32 Q 96 44 92 54 Q 96 66 88 74 Q 78 82 66 80 Q 54 84 44 78 Q 32 74 28 62 Q 20 52 30 38 Z';

  return (
    <div className="screen">
      <AppBar title="Trace the shape" subtitle="STEP 03 · SEGMENT"
        left={<BackBtn onClick={onBack} />}
        right={<button className="btn-icon" onClick={() => setPts([])}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 4h10M5 4V2.5h4V4M3.5 4l.5 8h6l.5-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>}
      />

      {/* photo + mask */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <PhotoBG variant={variant} />

        <svg viewBox="0 0 120 120" preserveAspectRatio="xMidYMid slice"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <mask id="seg-mask">
              <rect width="120" height="120" fill="white"/>
              <path d={maskPath} fill="black"/>
            </mask>
          </defs>
          <rect width="120" height="120" fill="rgba(0,0,0,0.45)" mask="url(#seg-mask)"/>
          <path d={maskPath} fill="#002FA7" fillOpacity="0.22"/>
          <path d={maskPath} fill="none" stroke="#002FA7" strokeWidth="0.7"
            style={{ filter: 'drop-shadow(0 0 2px rgba(0,47,167,0.7))' }} />
          <path d={maskPath} fill="none" stroke="#fff" strokeWidth="0.35"/>

          {pts.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r="2.6"
                fill={p.kind === 'add' ? '#002FA7' : '#fff'}
                stroke="#fff" strokeWidth="0.6"/>
              <text x={p.x} y={p.y + 1.2} textAnchor="middle"
                fontSize="3.4" fontWeight="700"
                fill={p.kind === 'add' ? '#fff' : '#002FA7'}>
                {p.kind === 'add' ? '+' : '−'}
              </text>
            </g>
          ))}
        </svg>

        {/* hint card overlaid */}
        <div style={{
          position: 'absolute', top: 12, left: 14, right: 14,
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(8px)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r)', padding: '8px 12px',
          fontSize: 12, lineHeight: 1.4,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--accent)' }}/>
          <span>Tap to add · long-press to subtract</span>
        </div>
      </div>

      {/* control bar */}
      <div style={{ padding: '14px 18px 24px', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => add('sub')}>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>−</span> Subtract
          </button>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={() => add('add')}>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>+</span> Add
          </button>
        </div>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={onConfirm}>
          Match this shape
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M1 5h12M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenSegment });
