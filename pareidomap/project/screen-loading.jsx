// Screen 4: Loading — minimal, mascot + status.

function ScreenLoading() {
  const lines = [
    'Flipping through the atlas…',
    'Asking the cartographers…',
    'Rotating candidate shapes…',
    'Measuring coastlines (Mandelbrot sighs)…',
    'Consulting a 1783 nautical chart…',
    "Checking if it's maybe just Italy again…",
  ];
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % lines.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="screen">
      <AppBar title="Searching" subtitle="STEP 04 · MATCHING" />

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', gap: 28,
      }}>
        <div style={{ position: 'relative', width: 240, height: 240 }}>
          <svg viewBox="0 0 240 240" style={{ position: 'absolute', inset: 0 }}>
            <circle cx="120" cy="120" r="110" fill="none"
              stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4"/>
            <circle cx="120" cy="120" r="86" fill="none"
              stroke="var(--border)" strokeWidth="1" strokeDasharray="1 3"/>
            <g className="spin-slow" style={{ transformOrigin: '120px 120px' }}>
              {['IT','FR','UK','JP','MG','GL','ES','CN'].map((code, i) => {
                const a = (i / 8) * Math.PI * 2;
                const x = 120 + Math.cos(a) * 110;
                const y = 120 + Math.sin(a) * 110;
                const featured = code === 'IT';
                return (
                  <g key={code} transform={`translate(${x} ${y})`}>
                    <circle r="11" fill={featured ? '#002FA7' : '#fff'} stroke={featured ? '#002FA7' : 'var(--border)'} strokeWidth="1"/>
                    <text textAnchor="middle" y="2.8" fontSize="8.5"
                      fontFamily="var(--mono)" fontWeight="500"
                      fill={featured ? '#fff' : '#0A0A0A'}>{code}</text>
                  </g>
                );
              })}
            </g>
          </svg>

          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ClippyGlobe size={140} mood="searching"/>
          </div>
        </div>

        <div style={{ textAlign: 'center', minHeight: 60 }}>
          <div className="label" style={{ marginBottom: 8 }}>Shape · received</div>
          <div key={idx} style={{
            fontFamily: 'var(--serif)', fontStyle: 'italic',
            fontSize: 20, lineHeight: 1.25, color: 'var(--fg)',
            maxWidth: 280,
          }}>
            {lines[idx]}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: 999, background: 'var(--accent)',
              animation: `dotpulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}/>
          ))}
        </div>
      </div>

      <div style={{ padding: '14px 18px 22px', textAlign: 'center' }}>
        <span className="kbd">194 candidates · ±12° rotations</span>
      </div>
    </div>
  );
}

Object.assign(window, { ScreenLoading });
