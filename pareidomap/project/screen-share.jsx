// Screen 7: Share — destination list, shadcn-y.

function ScreenShare({ region = 'italy', onBack, onDone, photo = 'wall' }) {
  const [sel, setSel] = React.useState(new Set(['ig']));
  const toggle = (k) => {
    const n = new Set(sel);
    n.has(k) ? n.delete(k) : n.add(k);
    setSel(n);
  };
  const targets = [
    { k: 'ig', name: 'Instagram', sub: 'Story · 9:16',  initials: 'IG', bg: 'linear-gradient(135deg,#f09433,#dc2743 50%,#bc1888)' },
    { k: 'tw', name: 'X',         sub: 'Post · 1:1',    initials: 'X',  bg: '#0A0A0A' },
    { k: 'tk', name: 'TikTok',    sub: 'Video · 9:16',  initials: 'TT', bg: '#111' },
    { k: 'wa', name: 'WhatsApp',  sub: 'Direct message',initials: 'WA', bg: '#25D366' },
    { k: 'ln', name: 'Copy link', sub: 'pareidomap.app/i/7f3a', initials: '⟶', bg: '#737373' },
    { k: 'sv', name: 'Save image',sub: 'PNG · 2400×3000',initials: '↓',  bg: '#002FA7' },
  ];

  return (
    <div className="screen">
      <AppBar title="Share" subtitle="STEP 07 · DISTRIBUTE"
        left={<BackBtn onClick={onBack}/>}
        right={<CloseBtn onClick={onDone}/>}
      />

      {/* preview, slightly tilted */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0 4px' }}>
        <div style={{
          width: 168, aspectRatio: '4/5',
          borderRadius: 'var(--r-lg)', overflow: 'hidden', position: 'relative',
          border: '1px solid var(--border)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.18)',
          transform: 'rotate(-2deg)',
        }}>
          <PhotoBG variant={photo}/>
          <MapOverlay region={region} borderColor="#fff" subBorderColor="rgba(255,255,255,0.8)"/>
          <div style={{
            position: 'absolute', top: 8, left: 8,
            fontFamily: 'var(--mono)', fontSize: 7, letterSpacing: '0.18em',
            color: '#fff', textTransform: 'uppercase',
            background: 'rgba(0,0,0,0.4)', padding: '3px 6px', borderRadius: 3,
          }}>PAREIDOMAP</div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '12px 24px 16px' }}>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>
          Another for the <span className="hand-underline">collection</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted-fg)', marginTop: 4 }}>
          Pick where to send your {REGIONS[region].name.toLowerCase()}.
        </div>
      </div>

      <div style={{ padding: '0 18px', flex: 1, overflowY: 'auto' }}>
        <div className="card" style={{ padding: 4 }}>
          {targets.map((t, i) => {
            const on = sel.has(t.k);
            return (
              <button key={t.k} onClick={() => toggle(t.k)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', width: '100%',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: i < targets.length - 1 ? '1px solid var(--border)' : 'none',
                textAlign: 'left',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, background: t.bg, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 500,
                }}>{t.initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-fg)' }}>{t.sub}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: 5,
                  border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border-2)'),
                  background: on ? 'var(--accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {on && <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1 5l3 3 5-7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '14px 18px 22px' }}>
        <button className="btn btn-primary" onClick={onDone} style={{ width: '100%' }}>
          Send to {sel.size} {sel.size === 1 ? 'destination' : 'destinations'}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenShare });
