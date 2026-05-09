// shared.jsx — Jekotech Garage PWA design tokens + reusable bits
// Industrial workshop aesthetic: graphite, signal orange, hairlines, mono details

const JK = {
  // Surfaces
  ink:        '#0B0D0E',     // graphite (deepest)
  ink2:       '#15181A',     // raised graphite
  ink3:       '#1E2225',     // panel
  ink4:       '#2A2F33',     // border on dark
  steel:      '#3D4348',
  steel2:     '#5C6369',
  steel3:     '#8B9197',
  bone:       '#F2EFEA',     // off-white
  bone2:      '#E5E1D8',
  bone3:      '#D4CFC2',
  paper:      '#FBFAF6',

  // Signal
  orange:     '#FF5A1F',     // primary action
  orangeDeep: '#D9430C',
  yellow:     '#F5C518',     // availability / warn
  lime:       '#C8FF3A',     // status accent
  red:        '#E8412B',     // error / urgent
  green:      '#2F9E5A',     // success

  // Type
  display:    '"Space Grotesk", "Helvetica Neue", Arial, sans-serif',
  body:       '"Inter", "Helvetica Neue", Arial, sans-serif',
  mono:       '"JetBrains Mono", "SF Mono", Menlo, monospace',
};

// ───────────────────────────────────────────────────────────
// Mono metadata strip — tickety industrial label
// ───────────────────────────────────────────────────────────
function MonoStrip({ children, style }) {
  return (
    <div style={{
      fontFamily: JK.mono, fontSize: 10, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)',
      display: 'flex', alignItems: 'center', gap: 8,
      ...style,
    }}>{children}</div>
  );
}

// Mono key:value pair
function KV({ k, v, dark = true, style }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      borderBottom: `1px dashed ${dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'}`,
      padding: '8px 0', ...style }}>
      <span style={{ fontFamily: JK.mono, fontSize: 10, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>{k}</span>
      <span style={{ fontFamily: JK.mono, fontSize: 12, fontWeight: 500,
        color: dark ? '#F2EFEA' : '#0B0D0E', textAlign: 'right' }}>{v}</span>
    </div>
  );
}

// Pill / tag
function Pill({ children, color = JK.orange, bg, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: JK.mono, fontSize: 10, fontWeight: 600,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      color, background: bg || `${color}1f`,
      padding: '4px 8px', borderRadius: 3,
      border: `1px solid ${color}40`,
      ...style,
    }}>{children}</span>
  );
}

// Status dot
function Dot({ color = JK.green, size = 8, pulse = false }) {
  return (
    <span style={{
      display: 'inline-block', width: size, height: size, borderRadius: '50%',
      background: color, boxShadow: pulse ? `0 0 0 0 ${color}` : 'none',
      animation: pulse ? 'jkpulse 1.6s infinite' : 'none',
    }}/>
  );
}

// Big chunky industrial button
function JKButton({ children, onClick, variant = 'primary', size = 'md', icon, disabled, style, full }) {
  const sizes = {
    sm: { h: 36, px: 14, fs: 13 },
    md: { h: 48, px: 18, fs: 14 },
    lg: { h: 56, px: 22, fs: 15 },
  }[size];
  const variants = {
    primary: { bg: JK.orange, color: '#fff', border: JK.orange, hover: JK.orangeDeep },
    dark:    { bg: JK.ink, color: JK.bone, border: JK.ink, hover: JK.ink2 },
    ghost:   { bg: 'transparent', color: JK.ink, border: JK.ink4, hover: JK.bone2 },
    bone:    { bg: JK.bone, color: JK.ink, border: JK.ink4, hover: JK.bone2 },
  }[variant];
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        height: sizes.h, padding: `0 ${sizes.px}px`,
        background: hover && !disabled ? variants.hover : variants.bg,
        color: variants.color, border: `1.5px solid ${variants.border}`,
        borderRadius: 0, fontFamily: JK.display, fontWeight: 600,
        fontSize: sizes.fs, letterSpacing: '0.02em',
        textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        width: full ? '100%' : 'auto',
        transition: 'background 0.12s, transform 0.06s',
        position: 'relative',
        ...style,
      }}>
      {children}
      {icon}
    </button>
  );
}

// Industrial input
function JKInput({ label, value, onChange, placeholder, type = 'text', mono = false, error, hint, suffix, autoFocus, style }) {
  return (
    <label style={{ display: 'block', ...style }}>
      {label && <div style={{
        fontFamily: JK.mono, fontSize: 10, fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'rgba(11,13,14,0.6)', marginBottom: 6,
      }}>{label}</div>}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#fff',
        border: `1.5px solid ${error ? JK.red : JK.ink}`,
        borderRadius: 0, padding: '0 14px', height: 50,
      }}>
        <input
          autoFocus={autoFocus}
          type={type} value={value || ''}
          onChange={e => onChange && onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 0, outline: 0, background: 'transparent',
            fontFamily: mono ? JK.mono : JK.body,
            fontSize: mono ? 16 : 15, fontWeight: mono ? 600 : 500,
            letterSpacing: mono ? '0.05em' : 'normal',
            color: JK.ink, height: '100%',
            textTransform: mono ? 'uppercase' : 'none',
          }}
        />
        {suffix && <span style={{ fontFamily: JK.mono, fontSize: 11, color: JK.steel2 }}>{suffix}</span>}
      </div>
      {hint && !error && <div style={{ fontFamily: JK.mono, fontSize: 10, color: JK.steel2, marginTop: 6 }}>{hint}</div>}
      {error && <div style={{ fontFamily: JK.mono, fontSize: 10, color: JK.red, marginTop: 6 }}>{error}</div>}
    </label>
  );
}

// Wordmark — the Jekotech-style stamp (original — chunky monospaced 'JK·GARAGE' lockup)
function JKMark({ size = 24, color = JK.bone, style }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...style }}>
      <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
        <rect x="1" y="1" width="30" height="30" fill="none" stroke={color} strokeWidth="2"/>
        <path d="M9 8 L9 22 Q9 25 13 25 L13 22 Q11 22 11 21 L11 8 Z" fill={color}/>
        <path d="M16 8 L16 25 L18 25 L18 17 L24 25 L26.5 25 L20.5 17 L26 8 L23.5 8 L18 16 L18 8 Z" fill={color}/>
      </svg>
      <div style={{
        fontFamily: JK.display, fontWeight: 700, fontSize: size * 0.55,
        letterSpacing: '0.18em', color, textTransform: 'uppercase', lineHeight: 1,
      }}>
        Jekotech<span style={{ opacity: 0.5, margin: '0 4px' }}>·</span>
        <span style={{ color: JK.orange }}>Garage</span>
      </div>
    </div>
  );
}

// Subtle striped placeholder for imagery
function ImgPlaceholder({ w = '100%', h = 200, label = 'IMAGE', dark = false, style }) {
  const fg = dark ? 'rgba(242,239,234,0.4)' : 'rgba(11,13,14,0.4)';
  const bg = dark ? JK.ink2 : JK.bone2;
  return (
    <div style={{
      width: w, height: h,
      background: `repeating-linear-gradient(135deg, ${bg} 0 8px, transparent 8px 16px), ${dark ? JK.ink3 : JK.bone}`,
      border: `1px dashed ${fg}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: JK.mono, fontSize: 11, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: fg, ...style,
    }}>{label}</div>
  );
}

// Mock fixture data ----------------------------------------------------------
const FIXTURES = {
  user: {
    name: 'Marcus Bell',
    email: 'marcus.bell@gmail.com',
    phone: '+44 7700 900 421',
    cars: [
      { reg: 'KX17 ZRT', make: 'Volkswagen', model: 'Golf GTI', year: 2017, mileage: 78420, color: 'Tornado Red' },
      { reg: 'BD68 OPL', make: 'Ford', model: 'Transit Custom', year: 2018, mileage: 124300, color: 'Frozen White' },
    ],
    history: [
      { date: '2025-11-14', service: 'Full Service',     mechanic: 'D. Owusu',  cost: 285, mileage: 76140, ref: 'JK-1142' },
      { date: '2025-06-02', service: 'Brake Pads (F)',   mechanic: 'A. Reyes',  cost: 165, mileage: 71820, ref: 'JK-0987' },
      { date: '2024-11-22', service: 'MOT + Interim',    mechanic: 'D. Owusu',  cost: 220, mileage: 64205, ref: 'JK-0812' },
      { date: '2024-04-10', service: 'Tyres (4× Mich.)', mechanic: 'K. Patel',  cost: 612, mileage: 58330, ref: 'JK-0644' },
    ],
  },
  services: [
    { id: 'full',     name: 'Full Service',     price: 285, dur: '3-4h', desc: '64-point inspection, oil + filter, fluids, brakes' },
    { id: 'interim',  name: 'Interim Service',  price: 165, dur: '1-2h', desc: 'Oil + filter change, basic safety checks' },
    { id: 'diag',     name: 'Diagnostics',      price: 75,  dur: '1h',   desc: 'OBD scan, fault reading, written report' },
    { id: 'brakes',   name: 'Brakes',           price: 180, dur: '2h',   desc: 'Pads, discs, fluid — front or rear' },
    { id: 'tyres',    name: 'Tyres',            price: 95,  dur: '45m',  desc: 'Per tyre — fitting, balancing, valve' },
    { id: 'aircon',   name: 'Air-con Recharge', price: 89,  dur: '1h',   desc: 'Regas, leak check, filter clean' },
  ],
  mechanics: [
    { id: 'do', name: 'Daniel Owusu',  init: 'DO', spec: 'Diagnostics · Engine',  load: 3, max: 4, color: '#FF5A1F' },
    { id: 'ar', name: 'Ana Reyes',     init: 'AR', spec: 'Brakes · Suspension',   load: 2, max: 4, color: '#F5C518' },
    { id: 'kp', name: 'Kiran Patel',   init: 'KP', spec: 'Tyres · Wheel align.',  load: 4, max: 4, color: '#C8FF3A' },
    { id: 'jt', name: 'Jamie Thorne',  init: 'JT', spec: 'Bodywork · Welding',    load: 1, max: 3, color: '#2F9E5A' },
  ],
  // Today + next 13 days
  bookingsToday: [
    { time: '08:30', dur: 90,  service: 'Interim Service', car: 'KX17 ZRT', customer: 'Marcus Bell',   mechanic: 'do', status: 'in_progress', ref: 'JK-1208' },
    { time: '10:00', dur: 60,  service: 'Diagnostics',     car: 'YE21 ABK', customer: 'Sara Johansson', mechanic: 'do', status: 'pending',    ref: 'JK-1209' },
    { time: '11:30', dur: 120, service: 'Brakes',          car: 'LO19 MNV', customer: 'Tom Wallace',    mechanic: 'ar', status: 'pending',    ref: 'JK-1210' },
    { time: '14:00', dur: 240, service: 'Full Service',    car: 'BD68 OPL', customer: 'Marcus Bell',   mechanic: null, status: 'unassigned', ref: 'JK-1211' },
  ],
};

// Inject keyframes + body font once
if (typeof document !== 'undefined' && !document.getElementById('jk-styles')) {
  const s = document.createElement('style');
  s.id = 'jk-styles';
  s.textContent = `
    @keyframes jkpulse { 0%{box-shadow:0 0 0 0 currentColor} 70%{box-shadow:0 0 0 8px transparent} 100%{box-shadow:0 0 0 0 transparent} }
    @keyframes jkblink { 50% { opacity: 0.3 } }
    @keyframes jkscan  { 0% { transform: translateY(-100%) } 100% { transform: translateY(100%) } }
    @keyframes jkmarq  { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
    .jk-scrollbar::-webkit-scrollbar { width: 6px; height: 6px }
    .jk-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.2); border-radius: 3px }
    .jk-scrollbar::-webkit-scrollbar-track { background: transparent }
  `;
  document.head.appendChild(s);
}

Object.assign(window, { JK, MonoStrip, KV, Pill, Dot, JKButton, JKInput, JKMark, ImgPlaceholder, FIXTURES });
