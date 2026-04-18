// Screen 1: Onboarding — minimal shadcn, hand-drawn accents.

function ScreenOnboarding({ onStart }) {
  return (
    <div className="screen" style={{ padding: '0' }}>
      {/* top brand */}
      <div style={{ paddingTop: 50, paddingLeft: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 18 }}>
        <Logo />
        <span className="kbd">v0.1 · beta</span>
      </div>

      {/* hero illustration */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36, padding: '0 24px' }}>
        <div style={{
          width: '100%', aspectRatio: '4/3',
          borderRadius: 'var(--r-lg)',
          border: '1px solid var(--border)',
          background: 'var(--bg-2)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* photo-y blob */}
          <svg width="100%" height="100%" viewBox="0 0 240 180" preserveAspectRatio="xMidYMid slice">
            {/* faux stain */}
            <ellipse cx="118" cy="92" rx="58" ry="48" fill="#6b4a30" opacity="0.18"/>
            <path d="M70 90 Q 78 60 108 56 Q 138 52 154 70 Q 168 84 158 100 Q 168 120 154 134 Q 134 144 118 132 Q 92 134 80 122 Q 60 110 70 90 Z"
              fill="#0A0A0A" opacity="0.85" />
            {/* italy overlay */}
            <g transform="translate(118 70) scale(0.4)">
              <path d={REGIONS.italy.path} fill="none" stroke="#002FA7" strokeWidth="3" strokeLinejoin="round"/>
            </g>
            {/* hand-drawn arrow */}
            <path d="M180 38 Q 168 50 152 60" stroke="#002FA7" strokeWidth="1.6" fill="none" strokeLinecap="round"/>
            <path d="M156 56 L 152 60 L 158 64" stroke="#002FA7" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            <text x="184" y="34" fontFamily="var(--hand)" fontSize="18" fill="#002FA7" fontWeight="600">it's italy!</text>
          </svg>
        </div>
      </div>

      {/* title */}
      <div style={{ textAlign: 'center', padding: '32px 28px 0' }}>
        <h1 style={{
          fontSize: 28, lineHeight: 1.1, margin: 0,
          fontWeight: 600, letterSpacing: '-0.02em',
        }}>
          See <span className="hand-circle">countries</span>
          <br />in everything.
        </h1>
        <p style={{
          fontSize: 14, lineHeight: 1.55, color: 'var(--muted-fg)',
          margin: '18px auto 0', maxWidth: 280, textWrap: 'pretty',
        }}>
          A stain on the wall. A crumb on a plate. A cloud at dusk.
          Snap it — we'll find the country it's pretending to be.
        </p>
      </div>

      {/* steps */}
      <div style={{ padding: '24px 24px 0' }}>
        <div className="card" style={{ padding: 4 }}>
          {[
            { n: 1, t: 'Snap',  d: 'A photo of any pattern' },
            { n: 2, t: 'Trace', d: 'Tap to outline the shape' },
            { n: 3, t: 'Match', d: 'We find the closest country' },
          ].map((s, i, a) => (
            <div key={s.n} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
              borderBottom: i < a.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{
                width: 26, height: 26, borderRadius: 999,
                background: 'var(--accent-soft)', color: 'var(--accent)',
                fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{s.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{s.t}</div>
                <div style={{ fontSize: 12, color: 'var(--muted-fg)' }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 24px 30px' }}>
        <button className="btn btn-primary" onClick={onStart} style={{ width: '100%' }}>
          Start hunting
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <path d="M1 5h12M9 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button className="btn btn-ghost" style={{ marginTop: 6, color: 'var(--muted-fg)' }}>
          Sign in
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenOnboarding });
