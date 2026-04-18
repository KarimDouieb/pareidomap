// Screen 5: Result — swipeable candidates with shadcn card UI.

function ScreenResult({ onBack, onStyle, photo = 'wall' }) {
  const candidates = [
    { region: 'italy',      score: 94 },
    { region: 'madagascar', score: 71 },
    { region: 'uk',         score: 58 },
  ];
  const [idx, setIdx] = React.useState(0);
  const c = candidates[idx];
  const R = REGIONS[c.region];

  return (
    <div className="screen">
      <AppBar title="Best match" subtitle={`${idx + 1} of ${candidates.length} candidates`}
        left={<BackBtn onClick={onBack}/>}
        right={<button className="btn-icon">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="3" cy="7" r="1.2" fill="currentColor"/>
            <circle cx="7" cy="7" r="1.2" fill="currentColor"/>
            <circle cx="11" cy="7" r="1.2" fill="currentColor"/>
          </svg>
        </button>}
      />

      {/* photo + map overlay */}
      <div style={{
        margin: '14px 18px 0',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: '4/5',
        border: '1px solid var(--border)',
      }}>
        <PhotoBG variant={photo}/>
        <div style={{ position: 'absolute', inset: 0 }}>
          <MapOverlay
            key={c.region}
            region={c.region}
            borderColor="#fff"
            subBorderColor="rgba(255,255,255,0.85)"
            showBordering={false}
          />
        </div>
        {/* corner stamp */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em',
          color: '#fff', textTransform: 'uppercase',
          background: 'rgba(0,0,0,0.4)', padding: '4px 7px', borderRadius: 4,
        }}>
          PAREIDOMAP
        </div>
      </div>

      {/* candidate card */}
      <div style={{ padding: '14px 18px 0' }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>identified as</div>
              <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1 }}>
                {R.name.charAt(0) + R.name.slice(1).toLowerCase()}
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 4 }}>
                {R.subtitle}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label">score</div>
              <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--accent)', lineHeight: 1, marginTop: 2 }}>
                {c.score}<span style={{ fontSize: 12, color: 'var(--muted-fg)', fontWeight: 400 }}>%</span>
              </div>
            </div>
          </div>

          {/* swipe controls */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            paddingTop: 10, borderTop: '1px solid var(--border)',
          }}>
            <button className="btn-icon" onClick={() => setIdx((idx - 1 + candidates.length) % candidates.length)} style={{ width: 32, height: 32 }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M9 1L3 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 5 }}>
              {candidates.map((_, i) => (
                <button key={i} onClick={() => setIdx(i)} style={{
                  background: i === idx ? 'var(--accent)' : 'var(--border-2)',
                  border: 'none',
                  width: i === idx ? 18 : 6, height: 6, borderRadius: 999,
                  cursor: 'pointer', padding: 0, transition: 'all .2s ease',
                }}/>
              ))}
            </div>
            <button className="btn-icon" onClick={() => setIdx((idx + 1) % candidates.length)} style={{ width: 32, height: 32 }}>
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M5 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: '12px 18px 22px', display: 'flex', gap: 8 }}>
        <button className="btn btn-outline" style={{ flex: 1 }}>Retake</button>
        <button className="btn btn-primary" style={{ flex: 1.6 }} onClick={() => onStyle(c.region)}>
          Style this
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M1 5h12M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenResult });
