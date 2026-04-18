// Screen 2: Camera. White chrome but viewfinder is dark/photo.

function ScreenCamera({ onCapture, onBack, photo = 'wall' }) {
  return (
    <div className="screen" style={{ background: 'var(--bg)' }}>
      <AppBar title="Frame your pattern" subtitle="STEP 02 · CAPTURE"
        left={<BackBtn onClick={onBack} />}
        right={<button className="btn-icon"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 4h12M3 4v8a1 1 0 001 1h6a1 1 0 001-1V4M5 4V2h4v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></button>}
      />

      {/* viewfinder */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <PhotoBG variant={photo} />

        {/* focus ring */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
            <circle cx="120" cy="120" r="110" stroke="#fff" strokeWidth="1.4"
              strokeDasharray="4 8" className="dash-ring"
              strokeOpacity="0.85" />
            {/* corners */}
            {[[12,12,1,1],[228,12,-1,1],[12,228,1,-1],[228,228,-1,-1]].map(([x,y,sx,sy],i)=>(
              <g key={i} stroke="#fff" strokeWidth="1.4" strokeLinecap="round">
                <line x1={x} y1={y} x2={x+14*sx} y2={y}/>
                <line x1={x} y1={y} x2={x} y2={y+14*sy}/>
              </g>
            ))}
            <line x1="120" y1="113" x2="120" y2="127" stroke="#fff" strokeWidth="1"/>
            <line x1="113" y1="120" x2="127" y2="120" stroke="#fff" strokeWidth="1"/>
          </svg>
        </div>

        {/* hand-drawn hint */}
        <div style={{
          position: 'absolute', top: 16, right: 18,
          textAlign: 'right',
        }}>
          <div className="hand-script" style={{ color: '#fff', fontSize: 26, transform: 'rotate(-4deg)' }}>
            line it up!
          </div>
          <svg width="60" height="40" viewBox="0 0 60 40" style={{ marginRight: 6 }}>
            <path d="M50 4 Q 30 18 18 36" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
            <path d="M22 32 L 18 36 L 24 38" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* shutter bar */}
      <div style={{
        background: 'var(--bg)', padding: '18px 24px 26px',
        borderTop: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* gallery thumb */}
          <button className="btn-icon" style={{ width: 44, height: 44, padding: 0, overflow: 'hidden' }}>
            <div style={{
              width: '100%', height: '100%',
              background: 'linear-gradient(135deg, #a48b6a, #6b5640)',
            }}/>
          </button>

          {/* shutter */}
          <button onClick={onCapture} style={{
            width: 70, height: 70, borderRadius: 999,
            background: 'transparent',
            border: '2px solid var(--fg)',
            padding: 5, cursor: 'pointer',
          }}>
            <div style={{ width: '100%', height: '100%', borderRadius: 999, background: 'var(--accent)' }}/>
          </button>

          {/* mode */}
          <div className="seg" style={{ flexDirection: 'column', padding: 2, gap: 0 }}>
            <button className="active" style={{ padding: '4px 10px', fontSize: 10 }}>PHOTO</button>
            <button style={{ padding: '4px 10px', fontSize: 10 }}>LIBRARY</button>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenCamera });
