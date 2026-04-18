// A small library of stylized country/region SVG paths for overlay on photos.
// These are hand-authored simplified shapes — accuracy is secondary to
// readability at small scale. Coordinates inside a 200x240 viewBox.
//
// Each entry: { name, path, viewBox, bordering, cities: [{x,y,name}], seas: [{x,y,name}] }

const REGIONS = {
  italy: {
    name: 'ITALY',
    subtitle: 'Italia — Southern Europe',
    viewBox: '0 0 200 240',
    path: 'M80 30 L98 24 L108 30 L118 38 L130 32 L138 40 L132 54 L120 62 L112 74 L108 88 L112 100 L118 112 L124 126 L130 142 L134 156 L142 164 L156 168 L168 178 L164 192 L152 196 L142 192 L136 182 L128 176 L118 172 L108 168 L100 158 L94 146 L92 132 L88 118 L80 108 L72 98 L66 88 L62 78 L58 68 L62 58 L68 48 L76 38 Z',
    extras: [
      // Sicily
      { type: 'island', path: 'M110 204 L 126 200 L 142 204 L 148 212 L 140 218 L 122 216 L 108 210 Z' },
      // Sardinia
      { type: 'island', path: 'M42 132 L 56 128 L 62 140 L 58 156 L 46 160 L 38 148 Z' },
    ],
    bordering: [
      { label: 'FR', path: 'M20 20 L62 36 L58 68 L20 60 Z' },
      { label: 'CH', path: 'M62 36 L108 20 L118 38 L68 48 Z' },
      { label: 'AT', path: 'M108 20 L170 18 L140 40 L118 38 Z' },
      { label: 'SI', path: 'M140 40 L180 30 L168 56 L132 54 Z' },
      { label: 'HR', path: 'M168 56 L188 70 L180 92 L156 82 Z' },
    ],
    cities: [
      { x: 92, y: 52, name: 'MILAN', dot: true },
      { x: 104, y: 84, name: 'FIRENZE', dot: true },
      { x: 118, y: 108, name: 'ROMA', capital: true },
      { x: 140, y: 156, name: 'NAPOLI', dot: true },
      { x: 128, y: 206, name: 'PALERMO', dot: true },
    ],
    seas: [
      { x: 24, y: 110, name: 'Mar Ligure', rot: -72 },
      { x: 74, y: 180, name: 'Mar Tirreno', rot: 18 },
      { x: 178, y: 130, name: 'Mar Adriatico', rot: 72 },
      { x: 150, y: 228, name: 'Mar Ionio', rot: 0 },
    ],
  },

  uk: {
    name: 'UNITED KINGDOM',
    subtitle: 'Great Britain & N. Ireland',
    viewBox: '0 0 200 240',
    path: 'M96 30 L112 28 L118 42 L124 54 L118 66 L130 74 L140 82 L146 96 L142 108 L150 118 L148 130 L156 140 L150 154 L158 166 L150 178 L138 176 L128 188 L116 192 L104 186 L96 178 L88 172 L82 160 L88 152 L82 142 L74 130 L80 122 L72 112 L76 100 L84 90 L78 78 L84 64 L78 52 L86 40 Z',
    extras: [
      { type: 'island', path: 'M30 130 L46 122 L58 132 L62 148 L54 164 L40 168 L28 158 L22 144 Z', label: 'IRE' },
      { type: 'island', path: 'M108 12 L124 16 L122 26 L110 24 Z' },
    ],
    bordering: [],
    cities: [
      { x: 118, y: 170, name: 'LONDON', capital: true },
      { x: 100, y: 118, name: 'MANCHESTER', dot: true },
      { x: 96, y: 80, name: 'EDINBURGH', dot: true },
      { x: 80, y: 164, name: 'CARDIFF', dot: true },
      { x: 52, y: 150, name: 'DUBLIN', dot: true },
    ],
    seas: [
      { x: 28, y: 80, name: 'Atlantic Ocean', rot: -78 },
      { x: 172, y: 88, name: 'North Sea', rot: 78 },
      { x: 20, y: 196, name: 'Celtic Sea', rot: -30 },
      { x: 68, y: 112, name: 'Irish Sea', rot: 0 },
      { x: 178, y: 200, name: 'English Channel', rot: 0 },
    ],
  },

  france: {
    name: 'FRANCE',
    subtitle: 'République française',
    viewBox: '0 0 200 240',
    path: 'M40 70 L62 54 L78 48 L96 42 L112 44 L126 40 L138 50 L150 58 L158 72 L162 88 L170 96 L168 112 L160 122 L162 138 L156 150 L150 160 L152 172 L144 182 L132 188 L120 186 L112 194 L98 192 L84 184 L70 176 L60 162 L50 152 L42 140 L34 122 L30 106 L32 90 Z',
    extras: [
      // Corsica
      { type: 'island', path: 'M160 176 L170 174 L174 186 L168 198 L160 196 L156 186 Z' },
    ],
    bordering: [
      { label: 'BE', path: 'M100 10 L160 14 L150 40 L110 38 Z' },
      { label: 'DE', path: 'M160 14 L190 32 L172 58 L152 44 Z' },
      { label: 'ES', path: 'M20 180 L80 184 L60 220 L10 214 Z' },
    ],
    cities: [
      { x: 112, y: 80, name: 'PARIS', capital: true },
      { x: 66, y: 142, name: 'BORDEAUX', dot: true },
      { x: 146, y: 156, name: 'LYON', dot: true },
      { x: 134, y: 186, name: 'MARSEILLE', dot: true },
      { x: 52, y: 100, name: 'NANTES', dot: true },
    ],
    seas: [
      { x: 22, y: 96, name: 'Bay of Biscay', rot: -68 },
      { x: 178, y: 160, name: 'Mediterranean Sea', rot: 62 },
      { x: 90, y: 20, name: 'English Channel', rot: 0 },
    ],
  },

  greenland: {
    name: 'GREENLAND',
    subtitle: 'Kalaallit Nunaat',
    viewBox: '0 0 200 240',
    path: 'M68 30 L108 22 L142 36 L158 58 L168 82 L170 108 L164 132 L150 152 L138 170 L130 188 L118 200 L102 208 L84 202 L70 190 L58 174 L48 156 L42 136 L38 112 L40 90 L48 66 L58 46 Z',
    extras: [],
    bordering: [],
    cities: [
      { x: 80, y: 186, name: 'NUUK', capital: true },
    ],
    seas: [
      { x: 18, y: 100, name: 'Davis Strait', rot: -80 },
      { x: 182, y: 100, name: 'Greenland Sea', rot: 80 },
      { x: 100, y: 224, name: 'Labrador Sea', rot: 0 },
    ],
  },

  japan: {
    name: 'JAPAN',
    subtitle: '日本 — East Asia',
    viewBox: '0 0 200 240',
    path: 'M142 32 L158 44 L152 58 L140 62 L128 70 L132 82 L124 90 L116 102 L108 114 L96 122 L86 130 L80 142 L84 154 L74 162 L62 166 L52 160 L48 148 L56 140 L68 130 L78 118 L88 108 L96 96 L102 84 L110 74 L116 62 L124 52 L132 42 Z',
    extras: [
      { type: 'island', path: 'M34 186 L 52 180 L 58 192 L 46 202 L 32 198 Z' },
      { type: 'island', path: 'M16 218 L 30 214 L 26 226 L 14 228 Z' },
    ],
    bordering: [],
    cities: [
      { x: 100, y: 96, name: 'TOKYO', capital: true },
      { x: 72, y: 146, name: 'OSAKA', dot: true },
      { x: 130, y: 52, name: 'SENDAI', dot: true },
    ],
    seas: [
      { x: 28, y: 60, name: 'Sea of Japan', rot: -72 },
      { x: 180, y: 140, name: 'Pacific Ocean', rot: 78 },
    ],
  },

  madagascar: {
    name: 'MADAGASCAR',
    subtitle: 'Madagasikara',
    viewBox: '0 0 200 240',
    path: 'M88 28 L104 32 L114 46 L118 62 L114 78 L118 96 L114 114 L118 132 L114 150 L108 168 L104 186 L96 200 L86 210 L74 206 L70 192 L76 176 L80 158 L76 142 L80 124 L76 106 L78 88 L74 72 L78 56 L82 40 Z',
    extras: [],
    bordering: [],
    cities: [
      { x: 96, y: 124, name: 'ANTANANARIVO', capital: true },
      { x: 108, y: 74, name: 'MAHAJANGA', dot: true },
    ],
    seas: [
      { x: 26, y: 120, name: 'Mozambique Channel', rot: -78 },
      { x: 178, y: 130, name: 'Indian Ocean', rot: 80 },
    ],
  },
};

Object.assign(window, { REGIONS });
