// Photo backgrounds — keep the textured look (the photo is still a photo, not white).

function PhotoBG({ variant = 'wall', children }) {
  const variants = {
    wall: {
      background: `
        radial-gradient(ellipse 180px 140px at 58% 52%, #6a4a3a 0%, #4a3326 35%, #2e1e13 70%),
        radial-gradient(ellipse 400px 600px at 30% 30%, #b89878 0%, #8a6a50 50%, #5a4030 100%)`,
    },
    plate: {
      background: `
        radial-gradient(ellipse 200px 180px at 45% 55%, #2a1a12 0%, #3a2418 30%, #6b4a30 70%, #8a6a4a 100%),
        linear-gradient(135deg, #d9cbb4 0%, #bca988 100%)`,
    },
    moss: {
      background: `
        radial-gradient(ellipse 180px 160px at 50% 50%, #4a5a2a 0%, #2a3a18 40%, #6a7a4a 80%),
        linear-gradient(180deg, #2a3320 0%, #4a5a3a 100%)`,
    },
    cloud: {
      background: `
        radial-gradient(ellipse 220px 160px at 50% 48%, #f0ede5 0%, #cdc8bc 50%, #9aa0aa 100%),
        linear-gradient(180deg, #6a88a8 0%, #aec4d8 100%)`,
    },
  };
  return (
    <div style={{ position: 'absolute', inset: 0, ...variants[variant], overflow: 'hidden' }}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25, mixBlendMode: 'overlay' }}>
        <filter id="ng">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" />
          <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.8 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ng)" />
      </svg>
      {children}
    </div>
  );
}

// Tiny logo mark — used in nav bars
function Logo({ size = 22 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#002FA7" strokeWidth="1.6"/>
        <ellipse cx="12" cy="12" rx="4" ry="10" stroke="#002FA7" strokeWidth="1" opacity="0.6"/>
        <line x1="2" y1="12" x2="22" y2="12" stroke="#002FA7" strokeWidth="1" opacity="0.6"/>
        <circle cx="12" cy="12" r="2" fill="#002FA7"/>
      </svg>
      <span style={{ fontFamily: 'var(--sans)', fontWeight: 600, letterSpacing: '-0.02em', fontSize: 15, color: '#0A0A0A' }}>
        Pareido<span style={{ color: '#002FA7' }}>Map</span>
      </span>
    </div>
  );
}

// Top app bar (shadcn-y)
function AppBar({ title, left, right, subtitle }) {
  return (
    <div style={{
      paddingTop: 50, paddingLeft: 18, paddingRight: 18, paddingBottom: 14,
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 38 }}>
        {left || <div style={{ width: 38 }} />}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em' }}>{title}</div>
          {subtitle && <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--muted-fg)', marginTop: 2, letterSpacing: '0.06em' }}>{subtitle}</div>}
        </div>
        {right || <div style={{ width: 38 }} />}
      </div>
    </div>
  );
}

function BackBtn({ onClick }) {
  return (
    <button className="btn-icon" onClick={onClick}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M13 7H1M5 3L1 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function CloseBtn({ onClick }) {
  return (
    <button className="btn-icon" onClick={onClick}>
      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
        <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

Object.assign(window, { PhotoBG, Logo, AppBar, BackBtn, CloseBtn });
