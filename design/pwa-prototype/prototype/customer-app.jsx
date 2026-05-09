// customer-app.jsx — Mobile customer PWA: auth + 8-step booking + dashboard
// Renders inside an iOS frame. Uses shared.jsx tokens.

const { useState, useEffect, useMemo } = React;

// ──────────────────────────────────────────────────────────────────────
// Top-level customer app — owns route + booking draft state
// ──────────────────────────────────────────────────────────────────────
function CustomerApp({ initialScreen = 'home', userMode = 'existing', step = 0 }) {
  const [screen, setScreen] = useState(initialScreen);
  const [authStep, setAuthStep] = useState(userMode === 'new' ? 'signup' : 'login');
  const [bookingStep, setBookingStep] = useState(step);
  const [draft, setDraft] = useState({
    service: null, date: null, time: null,
    reg: '', car: null, history: [],
    notes: '', photos: [], ref: null,
  });

  useEffect(() => { setScreen(initialScreen); }, [initialScreen]);
  useEffect(() => { setAuthStep(userMode === 'new' ? 'signup' : 'login'); }, [userMode]);
  useEffect(() => { setBookingStep(step); }, [step]);

  const updateDraft = (patch) => setDraft(d => ({ ...d, ...patch }));

  return (
    <div style={{
      width: '100%', height: '100%', background: JK.bone,
      fontFamily: JK.body, color: JK.ink,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {screen === 'auth'    && <AuthScreens step={authStep} setStep={setAuthStep} onDone={() => setScreen('home')} />}
      {screen === 'home'    && <HomeScreen onBook={() => { setBookingStep(0); setScreen('book'); }} onHistory={() => setScreen('history')} onAccount={() => setScreen('account')} />}
      {screen === 'book'    && <BookingFlow step={bookingStep} setStep={setBookingStep} draft={draft} update={updateDraft} onClose={() => setScreen('home')} />}
      {screen === 'history' && <HistoryScreen onBack={() => setScreen('home')} />}
      {screen === 'account' && <AccountScreen onBack={() => setScreen('home')} />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// AUTH — login / signup / OTP / password rules
// ──────────────────────────────────────────────────────────────────────
function AuthScreens({ step, setStep, onDone }) {
  const [email, setEmail] = useState('marcus.bell@gmail.com');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  if (step === 'login') return <LoginView {...{email, setEmail, password, setPassword, setStep, onDone}} />;
  if (step === 'signup') return <SignupView {...{name, setName, email, setEmail, phone, setPhone, password, setPassword, setStep}} />;
  if (step === 'otp')   return <OtpView {...{otp, setOtp, phone, setStep, onDone}} />;
  return null;
}

function LoginView({ email, setEmail, password, setPassword, setStep, onDone }) {
  const [showPw, setShowPw] = useState(false);
  return (
    <div style={{ flex: 1, background: JK.ink, color: JK.bone, padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
      <JKMark size={22} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24, marginTop: -40 }}>
        <div>
          <MonoStrip>BAY 01 / SECURE LOGIN</MonoStrip>
          <h1 style={{ fontFamily: JK.display, fontSize: 38, fontWeight: 700, lineHeight: 1, margin: '12px 0 0', letterSpacing: '-0.02em' }}>
            Pull&nbsp;in.<br/>
            <span style={{ color: JK.orange }}>Sign&nbsp;in.</span>
          </h1>
          <p style={{ color: JK.steel3, fontSize: 14, marginTop: 12, lineHeight: 1.5 }}>
            Manage bookings, track service history, and chat to the workshop.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DarkInput label="EMAIL" value={email} onChange={setEmail} placeholder="you@example.com" />
          <DarkInput label="PASSWORD" value={password} onChange={setPassword}
            type={showPw ? 'text' : 'password'} placeholder="••••••••"
            suffix={<button onClick={() => setShowPw(s => !s)} style={ghostBtn}>{showPw ? 'HIDE' : 'SHOW'}</button>}
          />
          <button style={{ ...ghostBtn, alignSelf: 'flex-end', fontSize: 11 }}>FORGOT?</button>
        </div>

        <JKButton variant="primary" full size="lg" onClick={onDone}>
          ENTER WORKSHOP →
        </JKButton>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: JK.steel2, fontFamily: JK.mono, fontSize: 10 }}>
          <div style={{ flex: 1, height: 1, background: JK.ink4 }}/>
          OR
          <div style={{ flex: 1, height: 1, background: JK.ink4 }}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SocialBtn label="Continue with Apple" icon="" />
          <SocialBtn label="Continue with Google" icon="G" />
        </div>
      </div>

      <div style={{ textAlign: 'center', fontFamily: JK.mono, fontSize: 11, color: JK.steel3 }}>
        New here?{' '}
        <button onClick={() => setStep('signup')} style={{ ...ghostBtn, color: JK.orange, fontSize: 11, textDecoration: 'underline' }}>
          OPEN AN ACCOUNT
        </button>
      </div>
    </div>
  );
}

function SignupView({ name, setName, email, setEmail, phone, setPhone, password, setPassword, setStep }) {
  const rules = useMemo(() => ([
    { ok: password.length >= 8,                   label: '8+ characters' },
    { ok: /[A-Z]/.test(password),                 label: 'one uppercase' },
    { ok: /[0-9]/.test(password),                 label: 'one number' },
    { ok: /[^A-Za-z0-9]/.test(password),          label: 'one symbol' },
  ]), [password]);
  const allOk = rules.every(r => r.ok) && name && email && phone;

  return (
    <div style={{ flex: 1, background: JK.bone, color: JK.ink, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => setStep('login')} style={{ ...ghostBtn, color: JK.ink }}>← BACK</button>
        <MonoStrip style={{ color: 'rgba(11,13,14,0.5)' }}>STEP 1 / 2 · DETAILS</MonoStrip>
      </div>
      <div style={{ flex: 1, padding: '12px 24px', overflowY: 'auto' }} className="jk-scrollbar">
        <h1 style={{ fontFamily: JK.display, fontSize: 32, fontWeight: 700, margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
          Open an account.
        </h1>
        <p style={{ fontSize: 13, color: JK.steel, marginBottom: 22 }}>
          We'll match your reg to QuickBooks records on first booking.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <JKInput label="FULL NAME" value={name} onChange={setName} placeholder="e.g. Marcus Bell" />
          <JKInput label="EMAIL" value={email} onChange={setEmail} placeholder="you@example.com" />
          <JKInput label="MOBILE NUMBER" value={phone} onChange={setPhone} placeholder="+44 ..." mono />
          <JKInput label="PASSWORD" value={password} onChange={setPassword} type="password" placeholder="••••••••" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
            {rules.map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: JK.mono, fontSize: 10, letterSpacing: '0.05em',
                color: r.ok ? JK.green : JK.steel2,
              }}>
                <span style={{
                  width: 14, height: 14, border: `1.5px solid ${r.ok ? JK.green : JK.bone3}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                  background: r.ok ? JK.green : 'transparent', color: r.ok ? '#fff' : 'transparent',
                }}>✓</span>
                {r.label.toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: 24, borderTop: `1px solid ${JK.bone2}` }}>
        <JKButton variant="primary" full size="lg" disabled={!allOk} onClick={() => setStep('otp')}>
          VERIFY MOBILE →
        </JKButton>
      </div>
    </div>
  );
}

function OtpView({ otp, setOtp, phone, setStep, onDone }) {
  const [seconds, setSeconds] = useState(45);
  useEffect(() => {
    const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);
  const filled = otp.every(d => d !== '');
  const set = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp]; next[i] = v; setOtp(next);
  };
  return (
    <div style={{ flex: 1, background: JK.ink, color: JK.bone, padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
      <button onClick={() => setStep('signup')} style={{ ...ghostBtn, color: JK.bone, alignSelf: 'flex-start' }}>← BACK</button>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
        <div>
          <MonoStrip>STEP 2 / 2 · OTP</MonoStrip>
          <h1 style={{ fontFamily: JK.display, fontSize: 32, fontWeight: 700, margin: '12px 0 8px', letterSpacing: '-0.02em' }}>
            Enter the 6-digit code.
          </h1>
          <p style={{ fontSize: 13, color: JK.steel3 }}>
            Sent by SMS to <span style={{ fontFamily: JK.mono, color: JK.bone }}>+44 ••• ••• 421</span>
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {otp.map((v, i) => (
            <input key={i}
              value={v}
              onChange={e => set(i, e.target.value.slice(-1))}
              maxLength={1}
              inputMode="numeric"
              style={{
                height: 56, textAlign: 'center',
                fontFamily: JK.mono, fontSize: 22, fontWeight: 700,
                color: JK.bone, background: JK.ink2,
                border: `1.5px solid ${v ? JK.orange : JK.ink4}`,
                borderRadius: 0, outline: 'none',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: JK.mono, fontSize: 11, color: JK.steel3 }}>
          <span>RESEND IN <span style={{ color: JK.orange }}>00:{seconds.toString().padStart(2, '0')}</span></span>
          <button style={{ ...ghostBtn, color: JK.orange, fontSize: 11 }}>RESEND CODE</button>
        </div>

        <JKButton variant="primary" full size="lg" disabled={!filled} onClick={onDone}>
          VERIFY & CONTINUE →
        </JKButton>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// HOME — workshop dashboard
// ──────────────────────────────────────────────────────────────────────
function HomeScreen({ onBook, onHistory, onAccount }) {
  const u = FIXTURES.user;
  const next = { date: '14 NOV', time: '10:30', service: 'Interim Service', mechanic: 'Daniel O.', ref: 'JK-1209' };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: JK.bone }}>
      {/* dark header */}
      <div style={{ background: JK.ink, color: JK.bone, padding: '28px 22px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <JKMark size={20}/>
          <button onClick={onAccount} style={{
            width: 36, height: 36, borderRadius: '50%', background: JK.orange,
            border: 0, color: '#fff', fontFamily: JK.display, fontWeight: 700, fontSize: 13,
          }}>MB</button>
        </div>
        <div style={{ marginTop: 22 }}>
          <MonoStrip>WELCOME BACK</MonoStrip>
          <h1 style={{ fontFamily: JK.display, fontSize: 28, fontWeight: 700, margin: '6px 0 0', letterSpacing: '-0.02em' }}>
            Marcus.
          </h1>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 100px' }} className="jk-scrollbar">
        {/* next booking ticket */}
        <div style={{
          marginTop: -28, background: JK.paper, border: `1.5px solid ${JK.ink}`,
          padding: 18, position: 'relative',
          boxShadow: `6px 6px 0 ${JK.ink}`,
        }}>
          <MonoStrip style={{ color: 'rgba(11,13,14,0.55)' }}>
            NEXT BOOKING <span style={{ flex: 1, height: 1, background: JK.bone3 }}/> <span>{next.ref}</span>
          </MonoStrip>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
            <div>
              <div style={{ fontFamily: JK.display, fontWeight: 700, fontSize: 28, lineHeight: 1, letterSpacing: '-0.02em' }}>{next.date}</div>
              <div style={{ fontFamily: JK.mono, fontSize: 12, color: JK.steel, marginTop: 4 }}>{next.time} · {next.service}</div>
            </div>
            <Pill color={JK.orange}>CONFIRMED</Pill>
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px dashed ${JK.bone3}`, display: 'flex', justifyContent: 'space-between', fontFamily: JK.mono, fontSize: 11 }}>
            <span style={{ color: JK.steel }}>BAY · 02</span>
            <span style={{ color: JK.ink, fontWeight: 600 }}>MECHANIC: {next.mechanic.toUpperCase()}</span>
          </div>
        </div>

        {/* big book button */}
        <button onClick={onBook} style={{
          marginTop: 16, width: '100%', background: JK.orange, color: '#fff',
          border: 0, padding: '20px 18px', textAlign: 'left',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}>
          <div>
            <MonoStrip style={{ color: 'rgba(255,255,255,0.7)' }}>BOOK NEW</MonoStrip>
            <div style={{ fontFamily: JK.display, fontSize: 22, fontWeight: 700, marginTop: 4, letterSpacing: '-0.01em' }}>
              Book the workshop →
            </div>
          </div>
          <span style={{ fontFamily: JK.display, fontSize: 32, fontWeight: 700 }}>+</span>
        </button>

        {/* my cars */}
        <div style={{ marginTop: 24 }}>
          <SectionLabel>YOUR FLEET · {u.cars.length}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
            {u.cars.map(c => <CarCard key={c.reg} car={c} />)}
          </div>
        </div>

        {/* recent activity */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <SectionLabel>RECENT VISITS</SectionLabel>
            <button onClick={onHistory} style={{ ...ghostBtn, color: JK.orange, fontSize: 10 }}>SEE ALL →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 10, border: `1px solid ${JK.bone3}`, background: '#fff' }}>
            {u.history.slice(0, 3).map((h, i) => <HistoryRow key={h.ref} h={h} last={i === 2} />)}
          </div>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
}

function CarCard({ car }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: 14, background: '#fff', border: `1px solid ${JK.bone3}`,
    }}>
      <div style={{
        width: 56, height: 56, background: JK.ink,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{ fontFamily: JK.mono, fontSize: 8, color: JK.yellow, letterSpacing: '0.1em' }}>UK</div>
        <div style={{ fontFamily: JK.mono, fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
          {car.reg.split(' ')[0]}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: JK.display, fontWeight: 600, fontSize: 16, letterSpacing: '-0.01em' }}>
            {car.make} {car.model}
          </div>
          <div style={{ fontFamily: JK.mono, fontSize: 10, color: JK.steel2 }}>{car.year}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4, fontFamily: JK.mono, fontSize: 10, color: JK.steel, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          <span>{car.mileage.toLocaleString()} mi</span>
          <span>·</span>
          <span>{car.color}</span>
        </div>
      </div>
    </div>
  );
}

function HistoryRow({ h, last }) {
  return (
    <div style={{
      padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: last ? 0 : `1px solid ${JK.bone2}`,
    }}>
      <div>
        <div style={{ fontFamily: JK.display, fontWeight: 600, fontSize: 14 }}>{h.service}</div>
        <div style={{ fontFamily: JK.mono, fontSize: 10, color: JK.steel, marginTop: 2 }}>
          {h.date} · {h.ref}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: JK.mono, fontSize: 14, fontWeight: 700 }}>£{h.cost}</div>
        <div style={{ fontFamily: JK.mono, fontSize: 9, color: JK.steel2, marginTop: 2 }}>{h.mechanic}</div>
      </div>
    </div>
  );
}

function HistoryScreen({ onBack }) {
  const h = FIXTURES.user.history;
  const total = h.reduce((s, x) => s + x.cost, 0);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: JK.bone }}>
      <div style={{ background: JK.ink, color: JK.bone, padding: '24px 22px 24px' }}>
        <button onClick={onBack} style={{ ...ghostBtn, color: JK.bone }}>← HOME</button>
        <h1 style={{ fontFamily: JK.display, fontSize: 28, fontWeight: 700, margin: '14px 0 0', letterSpacing: '-0.02em' }}>
          Service log
        </h1>
        <div style={{ display: 'flex', gap: 18, marginTop: 14 }}>
          <Stat label="VISITS" value={h.length} dark />
          <Stat label="LIFETIME SPEND" value={`£${total}`} dark />
          <Stat label="LAST IN" value="14 NOV" dark />
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 22px 100px' }} className="jk-scrollbar">
        {h.map((entry, i) => (
          <div key={entry.ref} style={{
            background: '#fff', border: `1px solid ${JK.bone3}`,
            padding: 16, marginBottom: 10, position: 'relative',
          }}>
            <MonoStrip style={{ color: 'rgba(11,13,14,0.55)' }}>
              {entry.date} <span style={{ flex: 1, height: 1, background: JK.bone3 }}/> {entry.ref}
            </MonoStrip>
            <div style={{ fontFamily: JK.display, fontWeight: 700, fontSize: 18, marginTop: 8 }}>{entry.service}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: JK.mono, fontSize: 11 }}>
              <span style={{ color: JK.steel }}>BY {entry.mechanic.toUpperCase()}</span>
              <span style={{ color: JK.steel }}>{entry.mileage.toLocaleString()} MI</span>
              <span style={{ color: JK.ink, fontWeight: 700 }}>£{entry.cost}</span>
            </div>
          </div>
        ))}
      </div>
      <BottomNav active="history" />
    </div>
  );
}

function AccountScreen({ onBack }) {
  const u = FIXTURES.user;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: JK.bone }}>
      <div style={{ background: JK.ink, color: JK.bone, padding: '24px 22px 24px' }}>
        <button onClick={onBack} style={{ ...ghostBtn, color: JK.bone }}>← HOME</button>
        <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: JK.orange,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: JK.display, fontWeight: 700, fontSize: 20, color: '#fff',
          }}>MB</div>
          <div>
            <div style={{ fontFamily: JK.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>{u.name}</div>
            <div style={{ fontFamily: JK.mono, fontSize: 11, color: JK.steel3 }}>{u.email}</div>
          </div>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 100px' }} className="jk-scrollbar">
        <SectionLabel>ACCOUNT</SectionLabel>
        <div style={{ background: '#fff', border: `1px solid ${JK.bone3}`, marginTop: 10 }}>
          <KV k="EMAIL"  v={u.email} dark={false} style={{ padding: '14px 16px' }}/>
          <KV k="MOBILE" v={u.phone} dark={false} style={{ padding: '14px 16px' }}/>
          <KV k="QB ID"  v="QBO-99412" dark={false} style={{ padding: '14px 16px', borderBottom: 'none' }}/>
        </div>
        <SectionLabel style={{ marginTop: 24 }}>NOTIFICATIONS</SectionLabel>
        <div style={{ background: '#fff', border: `1px solid ${JK.bone3}`, marginTop: 10 }}>
          <ToggleRow label="WhatsApp confirmations" defaultOn />
          <ToggleRow label="Service reminders" defaultOn />
          <ToggleRow label="Marketing offers" defaultOn={false} last />
        </div>
        <button style={{ marginTop: 28, fontFamily: JK.mono, fontSize: 11, letterSpacing: '0.1em', color: JK.red, border: 0, background: 'transparent', textDecoration: 'underline' }}>
          SIGN OUT
        </button>
      </div>
      <BottomNav active="account" />
    </div>
  );
}

function ToggleRow({ label, defaultOn, last }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{
      padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: last ? 0 : `1px solid ${JK.bone2}`,
    }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <button onClick={() => setOn(o => !o)} style={{
        width: 40, height: 22, padding: 2, border: 0, borderRadius: 0,
        background: on ? JK.orange : JK.bone3, cursor: 'pointer',
        position: 'relative',
      }}>
        <span style={{
          display: 'block', width: 18, height: 18, background: '#fff',
          transform: on ? 'translateX(18px)' : 'translateX(0)',
          transition: 'transform 0.18s',
        }}/>
      </button>
    </div>
  );
}

function Stat({ label, value, dark }) {
  return (
    <div>
      <div style={{ fontFamily: JK.mono, fontSize: 9, letterSpacing: '0.1em',
        color: dark ? 'rgba(242,239,234,0.5)' : 'rgba(11,13,14,0.5)' }}>
        {label}
      </div>
      <div style={{ fontFamily: JK.display, fontWeight: 700, fontSize: 18,
        marginTop: 2, color: dark ? JK.bone : JK.ink, letterSpacing: '-0.01em' }}>
        {value}
      </div>
    </div>
  );
}

function SectionLabel({ children, style }) {
  return (
    <div style={{
      fontFamily: JK.mono, fontSize: 10, fontWeight: 600,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      color: 'rgba(11,13,14,0.5)', ...style,
    }}>{children}</div>
  );
}

function BottomNav({ active }) {
  const items = [
    { id: 'home',    label: 'HOME' },
    { id: 'book',    label: 'BOOK' },
    { id: 'history', label: 'LOG' },
    { id: 'account', label: 'ME' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: JK.ink, padding: '12px 0 28px',
      display: 'flex', justifyContent: 'space-around',
      borderTop: `1px solid ${JK.ink4}`,
    }}>
      {items.map(it => (
        <div key={it.id} style={{
          fontFamily: JK.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
          color: active === it.id ? JK.orange : JK.steel2,
          padding: '4px 12px',
          borderTop: `2px solid ${active === it.id ? JK.orange : 'transparent'}`,
          marginTop: -12, paddingTop: 14,
        }}>{it.label}</div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────
const ghostBtn = {
  background: 'transparent', border: 0, padding: 0,
  fontFamily: JK.mono, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em',
  color: 'rgba(242,239,234,0.6)', cursor: 'pointer',
};

function DarkInput({ label, value, onChange, placeholder, type = 'text', suffix }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{
        fontFamily: JK.mono, fontSize: 10, fontWeight: 600,
        letterSpacing: '0.1em', color: 'rgba(242,239,234,0.55)', marginBottom: 6,
      }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center',
        background: JK.ink2, border: `1.5px solid ${JK.ink4}`,
        height: 50, padding: '0 14px',
      }}>
        <input
          type={type} value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 0, outline: 0, background: 'transparent',
            color: JK.bone, fontFamily: JK.body, fontSize: 15, fontWeight: 500, height: '100%',
          }}
        />
        {suffix}
      </div>
    </label>
  );
}

function SocialBtn({ label, icon }) {
  return (
    <button style={{
      height: 50, background: 'transparent', color: JK.bone,
      border: `1.5px solid ${JK.ink4}`, fontFamily: JK.display, fontWeight: 600,
      fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    }}>
      <span style={{ fontFamily: JK.mono, fontWeight: 700 }}>{icon || '◍'}</span>
      {label}
    </button>
  );
}

Object.assign(window, { CustomerApp, ghostBtn, SectionLabel, Stat, DarkInput });
