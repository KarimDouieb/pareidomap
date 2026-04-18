// Screen 8: Gallery — past finds in a grid.

const GALLERY = [
  { region: 'italy',      photo: 'wall',  date: '2 days ago', title: 'Stain in the kitchen' },
  { region: 'uk',         photo: 'plate', date: 'last week',  title: 'Bite of toast' },
  { region: 'japan',      photo: 'cloud', date: 'last week',  title: 'Cirrus cloud, dusk' },
  { region: 'madagascar', photo: 'moss',  date: 'mar 12',     title: 'Moss on a rock' },
  { region: 'france',     photo: 'wall',  date: 'mar 03',     title: 'Damp on plaster' },
  { region: 'greenland',  photo: 'plate', date: 'feb 22',     title: 'Spilled flour' },
  { region: 'italy',      photo: 'cloud', date: 'feb 14',     title: 'Italy again??' },
  { region: 'uk',         photo: 'moss',  date: 'jan 30',     title: 'Lichen patch' },
];

function ScreenGallery({ onNew, onOpen, onBack, tab = 'gallery', onTab }) {
  const [layout, setLayout] = React.useState('grid'); // grid | list
  const [filter, setFilter] = React.useState('all');

  const filtered = filter === 'all' ? GALLERY : GALLERY.filter(g => g.region === filter);
  const uniqueRegions = [...new Set(GALLERY.map(g => g.region))];

  return (
    <div className="screen">
      <AppBar title="Field journal" subtitle={`${GALLERY.length} finds · ${uniqueRegions.length} countries`}
        left={onBack ? <BackBtn onClick={onBack}/> : <Logo size={20}/>}
        right={
          <div className="seg" style={{ padding: 2 }}>
            <button className={layout === 'grid' ? 'active' : ''} onClick={() => setLayout('grid')} style={{ padding: '4px 8px' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="8" y="1" width="5" height="5" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="1" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="8" y="8" width="5" height="5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>
            <button className={layout === 'list' ? 'active' : ''} onClick={() => setLayout('list')} style={{ padding: '4px 8px' }}>
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <line x1="2" y1="3" x2="12" y2="3" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="2" y1="7" x2="12" y2="7" stroke="currentColor" strokeWidth="1.2"/>
                <line x1="2" y1="11" x2="12" y2="11" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>
          </div>
        }
      />

      {/* filter chips */}
      <div style={{
        display: 'flex', gap: 6, padding: '12px 18px 6px', overflowX: 'auto',
        borderBottom: '1px solid var(--border)',
      }}>
        {[{k:'all',l:'All'}, ...uniqueRegions.map(r => ({k:r, l: REGIONS[r].name.charAt(0) + REGIONS[r].name.slice(1).toLowerCase()}))].map(c => (
          <button key={c.k} onClick={() => setFilter(c.k)} style={{
            padding: '5px 11px', borderRadius: 999,
            border: '1px solid ' + (filter === c.k ? 'var(--accent)' : 'var(--border)'),
            background: filter === c.k ? 'var(--accent)' : 'transparent',
            color: filter === c.k ? '#fff' : 'var(--fg)',
            fontSize: 11.5, fontWeight: 500, cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>{c.l}</button>
        ))}
      </div>

      {/* grid / list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px 80px' }}>
        {layout === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {filtered.map((g, i) => (
              <button key={i} onClick={() => onOpen && onOpen(g)} className="thumb" style={{ border: '1px solid var(--border)', cursor: 'pointer', padding: 0, position: 'relative' }}>
                <PhotoBG variant={g.photo}/>
                <div style={{ position: 'absolute', inset: 0 }}>
                  <MapOverlay region={g.region} borderColor="#fff" subBorderColor="rgba(255,255,255,0.8)" showCities={false} showSeas={false} showBordering={false}/>
                </div>
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0,
                  padding: '14px 8px 6px',
                  background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.65))',
                  textAlign: 'left',
                }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 8, letterSpacing: '0.16em', color: '#fff', opacity: 0.8, textTransform: 'uppercase' }}>
                    {g.date}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginTop: 1, lineHeight: 1.2 }}>
                    {REGIONS[g.region].name.charAt(0) + REGIONS[g.region].name.slice(1).toLowerCase()}
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="card" style={{ padding: 0 }}>
            {filtered.map((g, i, a) => (
              <button key={i} onClick={() => onOpen && onOpen(g)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: 10, width: '100%', textAlign: 'left',
                background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: i < a.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ width: 56, height: 56, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0, border: '1px solid var(--border)' }}>
                  <PhotoBG variant={g.photo}/>
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <MapOverlay region={g.region} borderColor="#fff" subBorderColor="rgba(255,255,255,0.8)" showCities={false} showSeas={false} showBordering={false}/>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>
                    {REGIONS[g.region].name.charAt(0) + REGIONS[g.region].name.slice(1).toLowerCase()}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted-fg)' }}>{g.title}</div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9.5, color: 'var(--muted-fg)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {g.date}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating new-find FAB */}
      <button onClick={onNew} style={{
        position: 'absolute', bottom: 78, right: 18, zIndex: 10,
        width: 52, height: 52, borderRadius: 999,
        background: 'var(--accent)', color: '#fff',
        border: 'none', cursor: 'pointer',
        boxShadow: '0 8px 22px rgba(0,47,167,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* tab bar */}
      <TabBar tab={tab} onTab={onTab}/>
    </div>
  );
}

function TabBar({ tab = 'gallery', onTab }) {
  const tabs = [
    { k: 'home',    l: 'Home',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { k: 'gallery', l: 'Journal', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.6"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.6"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.6"/><rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.6"/></svg> },
    { k: 'snap',    l: 'Snap',    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.6"/><path d="M3 8h4l2-3h6l2 3h4v11H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg> },
    { k: 'me',      l: 'Profile', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> },
  ];
  return (
    <div className="tabbar">
      {tabs.map(t => (
        <button key={t.k} className={tab === t.k ? 'active' : ''} onClick={() => onTab && onTab(t.k)}>
          {t.icon}
          <span>{t.l}</span>
        </button>
      ))}
    </div>
  );
}

Object.assign(window, { ScreenGallery, TabBar, GALLERY });
