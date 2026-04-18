// Screen 6: Style — preview + clean shadcn-style controls.

function ScreenStyle({ region = 'italy', onBack, onShare, photo = 'wall' }) {
  const [opts, setOpts] = React.useState({
    borderColor: '#FFFFFF',
    subBorderColor: 'rgba(255,255,255,0.8)',
    showBorder: true,
    showCities: true,
    showSeas: true,
    showBordering: true,
    fontFace: 'sans',
  });

  const palettes = [
    { main: '#FFFFFF', sub: 'rgba(255,255,255,0.8)' },
    { main: '#0A0A0A', sub: 'rgba(10,10,10,0.6)' },
    { main: '#002FA7', sub: 'rgba(0,47,167,0.6)' },
    { main: '#E8C26A', sub: 'rgba(232,194,106,0.7)' },
    { main: '#DC2626', sub: 'rgba(220,38,38,0.6)' },
    { main: '#16A34A', sub: 'rgba(22,163,74,0.6)' },
  ];
  const fonts = [
    { key: 'sans',  name: 'Sans' },
    { key: 'serif', name: 'Serif' },
    { key: 'mono',  name: 'Mono' },
    { key: 'hand',  name: 'Hand' },
  ];

  const set = (k, v) => setOpts(o => ({ ...o, [k]: v }));

  return (
    <div className="screen">
      <AppBar title="Style" subtitle="STEP 06 · CUSTOMISE"
        left={<BackBtn onClick={onBack}/>}
        right={<button className="btn btn-primary" style={{ height: 32, padding: '0 12px', fontSize: 12 }} onClick={onShare}>Share</button>}
      />

      {/* preview */}
      <div style={{
        margin: '12px 18px',
        aspectRatio: '4/5',
        borderRadius: 'var(--r-lg)', overflow: 'hidden', position: 'relative',
        border: '1px solid var(--border)',
      }}>
        <PhotoBG variant={photo}/>
        <div style={{ position: 'absolute', inset: 0 }}>
          <MapOverlay region={region} {...opts}/>
        </div>
        <div style={{
          position: 'absolute', top: 10, left: 10,
          fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em',
          color: opts.borderColor, textTransform: 'uppercase',
          background: 'rgba(0,0,0,0.32)', padding: '4px 7px', borderRadius: 4,
        }}>
          {REGIONS[region].name}
        </div>
      </div>

      {/* control sheet */}
      <div style={{ padding: '0 18px 22px', flex: 1, overflowY: 'auto' }}>
        <Section label="Border color">
          <div style={{ display: 'flex', gap: 10 }}>
            {palettes.map((p, i) => (
              <button key={i} onClick={() => set('borderColor', p.main)}
                className={'swatch' + (opts.borderColor === p.main ? ' active' : '')}
                style={{ background: p.main }}/>
            ))}
          </div>
        </Section>

        <Section label="Sub-border color">
          <div style={{ display: 'flex', gap: 10 }}>
            {palettes.map((p, i) => (
              <button key={i} onClick={() => set('subBorderColor', p.sub)}
                className={'swatch' + (opts.subBorderColor === p.sub ? ' active' : '')}
                style={{ background: p.sub }}/>
            ))}
          </div>
        </Section>

        <Section label="Label font">
          <div className="seg">
            {fonts.map(f => (
              <button key={f.key}
                className={opts.fontFace === f.key ? 'active' : ''}
                onClick={() => set('fontFace', f.key)}
                style={{
                  fontFamily: f.key === 'mono' ? 'var(--mono)' :
                              f.key === 'serif' ? 'var(--serif)' :
                              f.key === 'hand' ? 'var(--hand)' : 'var(--sans)',
                  fontStyle: f.key === 'serif' ? 'italic' : 'normal',
                  fontSize: f.key === 'hand' ? 16 : 12,
                }}>
                {f.name}
              </button>
            ))}
          </div>
        </Section>

        <div style={{ marginTop: 8 }}>
          <Toggle label="Show borders"           hint="Country outlines"      on={opts.showBorder}     onChange={v => set('showBorder', v)}/>
          <Toggle label="Capital & cities"       hint="Dots and labels"       on={opts.showCities}     onChange={v => set('showCities', v)}/>
          <Toggle label="Sea & ocean labels"     hint="Italic surrounding water" on={opts.showSeas}    onChange={v => set('showSeas', v)}/>
          <Toggle label="Bordering countries"    hint="Dashed neighbors"      on={opts.showBordering}  onChange={v => set('showBordering', v)}/>
        </div>
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <div style={{ padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <div className="label" style={{ marginBottom: 10 }}>{label}</div>
      {children}
    </div>
  );
}
function Toggle({ label, hint, on, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 12, color: 'var(--muted-fg)', marginTop: 2 }}>{hint}</div>
      </div>
      <button className={'switch' + (on ? ' on' : '')} onClick={() => onChange(!on)}/>
    </div>
  );
}

Object.assign(window, { ScreenStyle });
