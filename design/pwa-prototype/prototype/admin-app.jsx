// admin-app.jsx — Admin desktop/tablet dashboard
// Tabs: schedule, mechanics, customers, whatsapp, analytics, sync

const { useState: useStateA } = React;

function AdminApp({ initialTab = 'schedule' }) {
  const [tab, setTab] = useStateA(initialTab);
  React.useEffect(() => { setTab(initialTab); }, [initialTab]);

  return (
    <div style={{
      width: '100%', height: '100%', background: JK.ink, color: JK.bone,
      fontFamily: JK.body, display: 'flex', overflow: 'hidden',
    }}>
      <AdminSidebar tab={tab} setTab={setTab} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AdminHeader tab={tab} />
        <div style={{ flex: 1, overflow: 'hidden', background: JK.ink2 }}>
          {tab === 'schedule'   && <ScheduleTab />}
          {tab === 'mechanics'  && <MechanicsTab />}
          {tab === 'customers'  && <CustomersTab />}
          {tab === 'whatsapp'   && <WhatsAppTab />}
          {tab === 'analytics'  && <AnalyticsTab />}
          {tab === 'sync'       && <SyncTab />}
        </div>
      </div>
    </div>
  );
}

function AdminSidebar({ tab, setTab }) {
  const items = [
    { id: 'schedule',  label: 'Schedule',  icon: '▦' },
    { id: 'mechanics', label: 'Mechanics', icon: '◉' },
    { id: 'customers', label: 'Customers', icon: '◎' },
    { id: 'whatsapp',  label: 'WhatsApp',  icon: '✉', count: 3 },
    { id: 'analytics', label: 'Analytics', icon: '⌬' },
    { id: 'sync',      label: 'QB Sync',   icon: '⟲' },
  ];
  return (
    <div style={{
      width: 220, background: JK.ink, color: JK.bone,
      borderRight: `1px solid ${JK.ink4}`, display: 'flex', flexDirection: 'column',
      flexShrink: 0,
    }}>
      <div style={{ padding: '22px 18px', borderBottom: `1px solid ${JK.ink4}` }}>
        <JKMark size={18}/>
        <div style={{ marginTop: 8, fontFamily: JK.mono, fontSize: 9, letterSpacing: '0.1em', color: JK.steel2 }}>
          ADMIN CONSOLE · v2.4
        </div>
      </div>

      <div style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map(it => {
          const sel = tab === it.id;
          return (
            <button key={it.id} onClick={() => setTab(it.id)} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              background: sel ? JK.orange : 'transparent',
              color: sel ? '#fff' : JK.steel3,
              border: 0, cursor: 'pointer', textAlign: 'left',
              fontFamily: JK.display, fontWeight: 600, fontSize: 13, letterSpacing: '0.02em',
              position: 'relative',
            }}>
              <span style={{ fontFamily: JK.mono, fontSize: 14 }}>{it.icon}</span>
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.count && <Pill color={sel ? '#fff' : JK.orange} bg="transparent" style={{ padding: '2px 6px', fontSize: 9 }}>{it.count}</Pill>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: 14, borderTop: `1px solid ${JK.ink4}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: JK.bone, color: JK.ink,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: JK.display, fontWeight: 700, fontSize: 12 }}>JE</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600 }}>Jeko E.</div>
          <div style={{ fontFamily: JK.mono, fontSize: 9, color: JK.steel2 }}>OWNER</div>
        </div>
      </div>
    </div>
  );
}

function AdminHeader({ tab }) {
  const titles = {
    schedule: 'Schedule', mechanics: 'Mechanics', customers: 'Customers',
    whatsapp: 'WhatsApp Log', analytics: 'Analytics', sync: 'QuickBooks Sync',
  };
  return (
    <div style={{
      padding: '18px 28px', background: JK.ink,
      borderBottom: `1px solid ${JK.ink4}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div>
        <MonoStrip>WED · 14 NOV 2025 · BAY STATUS <Dot color={JK.green} pulse size={6}/> LIVE</MonoStrip>
        <div style={{ fontFamily: JK.display, fontSize: 28, fontWeight: 700, marginTop: 2, letterSpacing: '-0.02em' }}>
          {titles[tab]}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
          background: JK.ink2, border: `1px solid ${JK.ink4}`,
          fontFamily: JK.mono, fontSize: 11, color: JK.steel3 }}>
          <span>⌕</span>
          <span>SEARCH BOOKINGS, CARS, PEOPLE…</span>
          <span style={{ marginLeft: 24, padding: '2px 6px', background: JK.ink3, color: JK.steel2, fontSize: 9 }}>⌘K</span>
        </div>
        <JKButton variant="primary" size="sm">+ NEW BOOKING</JKButton>
      </div>
    </div>
  );
}

// ── SCHEDULE TAB ─────────────────────────────────────────────────────
function ScheduleTab() {
  const [dayIdx, setDayIdx] = useStateA(0);
  const days = [
    { label: 'TODAY · WED 14',   slots: 4, total: 4 },
    { label: 'THU 15',           slots: 3, total: 4 },
    { label: 'FRI 16',           slots: 2, total: 4 },
    { label: 'SAT 17',           slots: 4, total: 4 },
    { label: 'MON 19',           slots: 1, total: 4 },
  ];
  const [selectedBooking, setSelectedBooking] = useStateA(FIXTURES.bookingsToday[3]);

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 18 }} className="jk-scrollbar">
      <div>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
          <KPICard label="TODAY · BAYS" v="4 / 4" sub="100% utilisation" accent={JK.orange} />
          <KPICard label="UNASSIGNED"   v="1"     sub="JK-1211 needs mech" accent={JK.yellow} warn />
          <KPICard label="IN PROGRESS"  v="1"     sub="DO · Bay 01" />
          <KPICard label="REVENUE TODAY" v="£965" sub="+£420 vs Tue" />
        </div>

        {/* Day strip */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {days.map((d, i) => {
            const sel = dayIdx === i;
            return (
              <button key={i} onClick={() => setDayIdx(i)} style={{
                padding: '12px 16px', flex: 1,
                background: sel ? JK.bone : JK.ink3,
                color: sel ? JK.ink : JK.bone,
                border: `1px solid ${sel ? JK.bone : JK.ink4}`,
                cursor: 'pointer', textAlign: 'left',
              }}>
                <div style={{ fontFamily: JK.mono, fontSize: 9, opacity: 0.6, letterSpacing: '0.1em' }}>{d.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                  <span style={{ fontFamily: JK.display, fontSize: 18, fontWeight: 700 }}>{d.slots}</span>
                  <span style={{ fontFamily: JK.mono, fontSize: 10, opacity: 0.6 }}>/ {d.total}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Timeline */}
        <div style={{ background: JK.ink3, border: `1px solid ${JK.ink4}` }}>
          <div style={{ padding: '12px 16px', borderBottom: `1px solid ${JK.ink4}`, display: 'flex', justifyContent: 'space-between' }}>
            <MonoStrip>BAY TIMELINE · WED 14 NOV</MonoStrip>
            <MonoStrip>08:00 — 18:00</MonoStrip>
          </div>
          <Timeline bookings={FIXTURES.bookingsToday} selected={selectedBooking} setSelected={setSelectedBooking}/>
        </div>

        {/* Booking list */}
        <div style={{ marginTop: 18 }}>
          <SectionLabel style={{ color: JK.steel3 }}>BOOKINGS · {FIXTURES.bookingsToday.length}</SectionLabel>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column' }}>
            {FIXTURES.bookingsToday.map(b => (
              <BookingRow key={b.ref} b={b} sel={selectedBooking?.ref === b.ref} onClick={() => setSelectedBooking(b)} />
            ))}
          </div>
        </div>
      </div>

      <BookingDetail booking={selectedBooking} />
    </div>
  );
}

function KPICard({ label, v, sub, accent, warn }) {
  return (
    <div style={{
      background: JK.ink3, border: `1px solid ${warn ? JK.yellow : JK.ink4}`,
      padding: 16, position: 'relative', overflow: 'hidden',
    }}>
      {accent && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: accent }}/>}
      <MonoStrip>{label}</MonoStrip>
      <div style={{ fontFamily: JK.display, fontSize: 28, fontWeight: 700, marginTop: 4, letterSpacing: '-0.02em' }}>{v}</div>
      <div style={{ fontFamily: JK.mono, fontSize: 10, color: warn ? JK.yellow : JK.steel3, marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function Timeline({ bookings, selected, setSelected }) {
  const startHr = 8; const endHr = 18; const totalMin = (endHr - startHr) * 60;
  const bays = ['BAY 01', 'BAY 02', 'BAY 03', 'BAY 04'];
  const layout = bookings.map((b, i) => ({ ...b, bay: i }));

  return (
    <div style={{ position: 'relative' }}>
      {/* Hour ticks */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${JK.ink4}`, paddingLeft: 80 }}>
        {Array.from({ length: 11 }).map((_, h) => (
          <div key={h} style={{
            flex: 1, padding: '6px 0',
            fontFamily: JK.mono, fontSize: 9, color: JK.steel2, letterSpacing: '0.1em',
            borderLeft: h === 0 ? 0 : `1px dashed ${JK.ink4}`,
          }}>{(startHr + h).toString().padStart(2, '0')}:00</div>
        ))}
      </div>

      {bays.map((bay, i) => {
        const b = layout.find(x => x.bay === i);
        return (
          <div key={bay} style={{ display: 'flex', borderBottom: i === 3 ? 0 : `1px solid ${JK.ink4}`, height: 56 }}>
            <div style={{
              width: 80, padding: '12px 14px', borderRight: `1px solid ${JK.ink4}`,
              fontFamily: JK.mono, fontSize: 10, fontWeight: 700, color: JK.steel3, letterSpacing: '0.1em',
              display: 'flex', alignItems: 'center',
            }}>{bay}</div>
            <div style={{ flex: 1, position: 'relative',
              background: `repeating-linear-gradient(90deg, transparent 0 9.99%, ${JK.ink4} 9.99% 10%)` }}>
              {b && <BookingBlock b={b} startHr={startHr} totalMin={totalMin} sel={selected?.ref === b.ref} onClick={() => setSelected(b)}/>}
            </div>
          </div>
        );
      })}

      {/* Now line */}
      <div style={{
        position: 'absolute', top: 28, bottom: 0, left: `calc(80px + ${((9 + 45/60) - startHr) / 10 * 100}%)`,
        width: 2, background: JK.orange, pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: -6, left: -4, width: 10, height: 10, background: JK.orange, borderRadius: '50%',
        }}/>
        <div style={{
          position: 'absolute', top: -22, left: 6, padding: '2px 6px', background: JK.orange, color: '#fff',
          fontFamily: JK.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
        }}>NOW · 09:45</div>
      </div>
    </div>
  );
}

function BookingBlock({ b, startHr, totalMin, sel, onClick }) {
  const [h, m] = b.time.split(':').map(Number);
  const startMin = (h - startHr) * 60 + m;
  const left = (startMin / totalMin) * 100;
  const width = (b.dur / totalMin) * 100;
  const colors = {
    in_progress: { bg: JK.orange, fg: '#fff' },
    pending:     { bg: JK.ink, fg: JK.bone, border: JK.steel },
    unassigned:  { bg: JK.yellow, fg: JK.ink },
    done:        { bg: JK.steel, fg: JK.bone },
  }[b.status];
  return (
    <button onClick={onClick} style={{
      position: 'absolute', left: `${left}%`, width: `${width}%`,
      top: 6, bottom: 6,
      background: colors.bg, color: colors.fg,
      border: `1.5px solid ${sel ? JK.bone : (colors.border || colors.bg)}`,
      padding: '4px 8px', textAlign: 'left', cursor: 'pointer',
      fontFamily: JK.mono, fontSize: 10, fontWeight: 600,
      overflow: 'hidden', boxShadow: sel ? `0 0 0 2px ${JK.orange}` : 'none',
    }}>
      <div style={{ fontWeight: 700 }}>{b.time} · {b.ref}</div>
      <div style={{ opacity: 0.85, fontSize: 9, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {b.service} · {b.car}
      </div>
    </button>
  );
}

function BookingRow({ b, sel, onClick }) {
  const colors = {
    in_progress: { c: JK.orange, l: 'IN PROGRESS' },
    pending:     { c: JK.steel3, l: 'PENDING' },
    unassigned:  { c: JK.yellow, l: 'UNASSIGNED' },
  }[b.status];
  const mech = FIXTURES.mechanics.find(m => m.id === b.mechanic);
  return (
    <button onClick={onClick} style={{
      display: 'grid', gridTemplateColumns: '60px 90px 1fr 100px 80px 100px',
      alignItems: 'center', gap: 16, padding: '14px 16px',
      background: sel ? JK.ink3 : 'transparent',
      border: `1px solid ${sel ? JK.orange : JK.ink4}`,
      borderTop: 0, color: JK.bone, textAlign: 'left', cursor: 'pointer',
    }}>
      <span style={{ fontFamily: JK.mono, fontSize: 14, fontWeight: 700 }}>{b.time}</span>
      <Pill color={colors.c}>{colors.l}</Pill>
      <span>
        <div style={{ fontFamily: JK.display, fontSize: 14, fontWeight: 600 }}>{b.service}</div>
        <div style={{ fontFamily: JK.mono, fontSize: 10, color: JK.steel3, marginTop: 2 }}>{b.customer}</div>
      </span>
      <span style={{ fontFamily: JK.mono, fontSize: 11, color: JK.steel3 }}>{b.car}</span>
      <span style={{ fontFamily: JK.mono, fontSize: 11, color: JK.steel3 }}>{b.ref}</span>
      <span>{mech ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: mech.color, color: JK.ink,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: JK.mono, fontSize: 9, fontWeight: 700 }}>{mech.init}</span>
          <span style={{ fontFamily: JK.mono, fontSize: 10 }}>{mech.name.split(' ')[0]}</span>
        </span>
      ) : <Pill color={JK.yellow}>ASSIGN ↓</Pill>}</span>
    </button>
  );
}

function BookingDetail({ booking }) {
  if (!booking) return null;
  const mech = FIXTURES.mechanics.find(m => m.id === booking.mechanic);
  return (
    <div style={{ background: JK.ink3, border: `1px solid ${JK.ink4}`, padding: 20, height: 'fit-content', position: 'sticky', top: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <MonoStrip>BOOKING · {booking.ref}</MonoStrip>
        <button style={{ ...ghostBtn, color: JK.bone }}>✕</button>
      </div>
      <div style={{ fontFamily: JK.display, fontSize: 22, fontWeight: 700, marginTop: 8, letterSpacing: '-0.02em' }}>
        {booking.service}
      </div>
      <div style={{ fontFamily: JK.mono, fontSize: 11, color: JK.steel3, marginTop: 4 }}>
        {booking.time} · {booking.dur} MIN · BAY 0{FIXTURES.bookingsToday.indexOf(booking) + 1}
      </div>

      <div style={{ marginTop: 16, padding: 14, background: JK.ink2, border: `1px dashed ${JK.ink4}` }}>
        <KV k="CUSTOMER" v={booking.customer.toUpperCase()} />
        <KV k="VEHICLE"  v={booking.car} />
        <KV k="QB ID"    v="QBO-99412" />
        <KV k="PHONE"    v="+44 ••• 421" />
      </div>

      <SectionLabel style={{ color: JK.steel3, marginTop: 18 }}>ASSIGN MECHANIC</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
        {FIXTURES.mechanics.map(m => {
          const sel = mech?.id === m.id;
          const full = m.load >= m.max;
          return (
            <button key={m.id} disabled={full && !sel} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              background: sel ? JK.orange : JK.ink2,
              color: sel ? '#fff' : JK.bone,
              border: `1.5px solid ${sel ? JK.orange : JK.ink4}`,
              cursor: full && !sel ? 'not-allowed' : 'pointer', textAlign: 'left',
              opacity: full && !sel ? 0.4 : 1,
            }}>
              <span style={{ width: 28, height: 28, borderRadius: '50%', background: m.color, color: JK.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: JK.mono, fontSize: 10, fontWeight: 700 }}>{m.init}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div style={{ fontFamily: JK.mono, fontSize: 9, color: sel ? 'rgba(255,255,255,0.7)' : JK.steel3 }}>
                  {m.spec}
                </div>
              </span>
              <span style={{ fontFamily: JK.mono, fontSize: 10, fontWeight: 700,
                color: sel ? '#fff' : full ? JK.red : JK.lime }}>
                {m.load}/{m.max}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
        <JKButton variant="primary" size="sm" full>UPDATE STATUS</JKButton>
        <JKButton variant="ghost" size="sm" style={{ borderColor: JK.ink4, color: JK.bone }}>WHATSAPP →</JKButton>
      </div>
    </div>
  );
}

// ── MECHANICS TAB ─────────────────────────────────────────────────────
function MechanicsTab() {
  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }} className="jk-scrollbar">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
        {FIXTURES.mechanics.map(m => (
          <div key={m.id} style={{ background: JK.ink3, border: `1px solid ${JK.ink4}`, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: m.color, color: JK.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: JK.display, fontWeight: 700, fontSize: 18,
              }}>{m.init}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: JK.display, fontWeight: 700, fontSize: 18 }}>{m.name}</div>
                <div style={{ fontFamily: JK.mono, fontSize: 11, color: JK.steel3 }}>{m.spec}</div>
              </div>
              <Pill color={m.load >= m.max ? JK.red : m.load >= m.max - 1 ? JK.yellow : JK.green}>
                {m.load >= m.max ? 'FULL' : 'OPEN'}
              </Pill>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: JK.display, fontSize: 26, fontWeight: 700 }}>{m.load}</span>
              <span style={{ fontFamily: JK.mono, fontSize: 11, color: JK.steel3 }}>/ {m.max} JOBS TODAY</span>
            </div>
            <div style={{ marginTop: 10, height: 6, background: JK.ink2 }}>
              <div style={{ width: `${m.load / m.max * 100}%`, height: '100%', background: m.color }}/>
            </div>
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px dashed ${JK.ink4}`,
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Stat label="THIS WEEK" value={m.load * 4 + 2} dark />
              <Stat label="AVG £/JOB" value={`£${180 + m.load * 12}`} dark />
              <Stat label="RATING" value="4.8★" dark />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── CUSTOMERS TAB ─────────────────────────────────────────────────────
function CustomersTab() {
  const customers = [
    { name: 'Marcus Bell',     reg: 'KX17 ZRT', cars: 2, last: '14 NOV', spend: 1282, qb: '✓' },
    { name: 'Sara Johansson',  reg: 'YE21 ABK', cars: 1, last: '14 NOV', spend: 458,  qb: '✓' },
    { name: 'Tom Wallace',     reg: 'LO19 MNV', cars: 1, last: '14 NOV', spend: 920,  qb: '✓' },
    { name: 'Priya Kapoor',    reg: 'RV20 TFG', cars: 1, last: '02 NOV', spend: 340,  qb: '✓' },
    { name: 'Eli Schwartz',    reg: 'OY18 PSE', cars: 3, last: '28 OCT', spend: 2104, qb: '✓' },
    { name: 'Aisha Mensah',    reg: 'GT22 XYK', cars: 1, last: '21 OCT', spend: 165,  qb: '⚠' },
  ];
  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }} className="jk-scrollbar">
      <div style={{ background: JK.ink3, border: `1px solid ${JK.ink4}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '60px 1.4fr 1fr 80px 100px 100px 80px',
          padding: '12px 18px', background: JK.ink2, borderBottom: `1px solid ${JK.ink4}`,
          fontFamily: JK.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: JK.steel3 }}>
          <span>QB</span><span>NAME</span><span>LAST REG</span><span>CARS</span><span>LAST IN</span><span>LIFETIME</span><span></span>
        </div>
        {customers.map((c, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '60px 1.4fr 1fr 80px 100px 100px 80px',
            padding: '14px 18px', alignItems: 'center',
            borderBottom: i === customers.length - 1 ? 0 : `1px solid ${JK.ink4}`,
          }}>
            <span style={{ fontFamily: JK.mono, fontSize: 14, color: c.qb === '✓' ? JK.green : JK.yellow }}>{c.qb}</span>
            <span>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={{ fontFamily: JK.mono, fontSize: 10, color: JK.steel3 }}>QBO-{99000 + i * 47}</div>
            </span>
            <span style={{ fontFamily: JK.mono, fontSize: 12, fontWeight: 600 }}>{c.reg}</span>
            <span style={{ fontFamily: JK.mono, fontSize: 12 }}>{c.cars}</span>
            <span style={{ fontFamily: JK.mono, fontSize: 11, color: JK.steel3 }}>{c.last}</span>
            <span style={{ fontFamily: JK.display, fontSize: 14, fontWeight: 700 }}>£{c.spend}</span>
            <button style={{ ...ghostBtn, color: JK.orange }}>OPEN →</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WHATSAPP TAB ─────────────────────────────────────────────────────
function WhatsAppTab() {
  const msgs = [
    { time: '09:42', dir: 'OUT', to: '+44 7700 900 421', body: '✅ Booking JK-1212 received. Full Service · 16 Nov 14:00 · BD68 OPL · est £285', status: 'DELIVERED' },
    { time: '09:30', dir: 'IN',  to: '+44 7700 900 332', body: 'Hi can you fit me in tomorrow for tyres? front 2 only', status: 'READ' },
    { time: '09:14', dir: 'OUT', to: '+44 7700 900 412', body: '🔧 Mechanic D. Owusu assigned to JK-1208. ETA 90min.', status: 'DELIVERED' },
    { time: '08:50', dir: 'OUT', to: '+44 7700 900 511', body: '⚠️ Job JK-1199 ready for collection. Total £625.', status: 'DELIVERED' },
    { time: '08:32', dir: 'OUT', to: '+44 7700 900 421', body: '✅ Booking JK-1208 received. Interim · 14 Nov 08:30 · KX17 ZRT', status: 'READ' },
  ];
  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18 }} className="jk-scrollbar">
      <div>
        <div style={{ background: JK.ink3, border: `1px solid ${JK.ink4}` }}>
          {msgs.map((m, i) => (
            <div key={i} style={{
              padding: '14px 18px', borderBottom: i === msgs.length - 1 ? 0 : `1px solid ${JK.ink4}`,
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              <div style={{ width: 34, fontFamily: JK.mono, fontSize: 10, fontWeight: 700,
                color: m.dir === 'OUT' ? JK.green : JK.yellow }}>
                {m.dir === 'OUT' ? '→' : '←'} {m.dir}
              </div>
              <div style={{ width: 60, fontFamily: JK.mono, fontSize: 11, color: JK.steel3 }}>{m.time}</div>
              <div style={{ width: 130, fontFamily: JK.mono, fontSize: 11 }}>{m.to}</div>
              <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>{m.body}</div>
              <Pill color={m.status === 'READ' ? JK.lime : JK.steel3}>{m.status}</Pill>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: JK.ink3, border: `1px solid ${JK.ink4}`, padding: 18, height: 'fit-content' }}>
        <MonoStrip>WHATSAPP BUSINESS</MonoStrip>
        <div style={{ fontFamily: JK.display, fontSize: 18, fontWeight: 700, marginTop: 6 }}>+44 20 8123 4040</div>
        <div style={{ marginTop: 16 }}>
          <KV k="STATUS" v={<><Dot color={JK.green} pulse size={6} /> CONNECTED</>}/>
          <KV k="SENT 24H" v="42" />
          <KV k="DELIVERED" v="42" />
          <KV k="FAILED" v="0" />
          <KV k="TEMPLATE" v="confirm_v3" />
        </div>
        <JKButton variant="ghost" size="sm" full style={{ marginTop: 16, borderColor: JK.ink4, color: JK.bone }}>
          MANAGE TEMPLATES →
        </JKButton>
      </div>
    </div>
  );
}

// ── ANALYTICS TAB ─────────────────────────────────────────────────────
function AnalyticsTab() {
  const weekly = [12, 18, 14, 22, 19, 26, 24];
  const max = Math.max(...weekly);
  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }} className="jk-scrollbar">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
        <KPICard label="MTD REVENUE"  v="£18.4k" sub="+12% vs last month" accent={JK.orange} />
        <KPICard label="JOBS DONE"    v="64"     sub="avg £287 / job" accent={JK.lime} />
        <KPICard label="UTILISATION"  v="89%"    sub="bays occupied" />
        <KPICard label="REPEAT RATE"  v="71%"    sub="customers returning" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 18 }}>
        <div style={{ background: JK.ink3, border: `1px solid ${JK.ink4}`, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <SectionLabel style={{ color: JK.steel3 }}>JOBS · LAST 7 DAYS</SectionLabel>
            <MonoStrip>PEAK · SAT · 26</MonoStrip>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 200, marginTop: 18, paddingBottom: 22, borderBottom: `1px solid ${JK.ink4}` }}>
            {weekly.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: JK.mono, fontSize: 10, color: JK.steel3 }}>{v}</span>
                <div style={{ width: '100%', height: `${v / max * 160}px`, background: i === weekly.length - 1 ? JK.orange : JK.steel,
                  border: i === weekly.length - 1 ? 0 : `1px solid ${JK.steel2}` }}/>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, fontFamily: JK.mono, fontSize: 9, color: JK.steel2, letterSpacing: '0.1em' }}>
            {['MON','TUE','WED','THU','FRI','SAT','SUN'].map(d => <div key={d} style={{ flex: 1, textAlign: 'center' }}>{d}</div>)}
          </div>
        </div>

        <div style={{ background: JK.ink3, border: `1px solid ${JK.ink4}`, padding: 20 }}>
          <SectionLabel style={{ color: JK.steel3 }}>SERVICE MIX · MTD</SectionLabel>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { l: 'Full Service', v: 32, c: JK.orange },
              { l: 'MOT + Interim', v: 24, c: JK.yellow },
              { l: 'Brakes',        v: 18, c: JK.lime },
              { l: 'Diagnostics',   v: 14, c: JK.steel3 },
              { l: 'Tyres',         v: 12, c: JK.steel },
            ].map(r => (
              <div key={r.l}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: JK.mono, fontSize: 10 }}>
                  <span>{r.l.toUpperCase()}</span>
                  <span style={{ fontWeight: 700 }}>{r.v}%</span>
                </div>
                <div style={{ height: 4, background: JK.ink2, marginTop: 4 }}>
                  <div style={{ width: `${r.v * 2.5}%`, height: '100%', background: r.c }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SYNC TAB ────────────────────────────────────────────────────────
function SyncTab() {
  const events = [
    { t: '09:45:12', src: 'QB→PWA', desc: 'Customer QBO-99412 updated · KX17 ZRT mileage 78420', ok: true },
    { t: '09:43:08', src: 'PWA→QB', desc: 'Invoice draft #INV-1208 created · £285', ok: true },
    { t: '09:30:55', src: 'QB→PWA', desc: 'Vehicle BD68 OPL · 4 service entries imported', ok: true },
    { t: '08:12:31', src: 'PWA→QB', desc: 'New customer Aisha Mensah created (QBO-99488)', ok: true },
    { t: '07:50:02', src: 'QB→PWA', desc: 'Bulk pull · 142 customers, 213 vehicles', ok: true },
    { t: '02:00:00', src: 'CRON',   desc: 'Nightly reconciliation · 0 conflicts', ok: true },
  ];
  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto', display: 'grid', gridTemplateColumns: '320px 1fr', gap: 18 }} className="jk-scrollbar">
      <div style={{ background: JK.ink3, border: `1px solid ${JK.ink4}`, padding: 20, height: 'fit-content' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Dot color={JK.green} pulse size={10}/>
          <div style={{ fontFamily: JK.display, fontSize: 18, fontWeight: 700 }}>QUICKBOOKS · LIVE</div>
        </div>
        <div style={{ marginTop: 16 }}>
          <KV k="REALM ID"  v="9341 0024 1148"/>
          <KV k="ENV"       v="PRODUCTION"/>
          <KV k="LAST SYNC" v="9 SEC AGO"/>
          <KV k="QUEUE"     v="0 PENDING"/>
        </div>
        <JKButton variant="primary" size="sm" full style={{ marginTop: 16 }}>RECONNECT TOKEN →</JKButton>
        <div style={{ marginTop: 14, padding: 12, background: JK.ink2, fontFamily: JK.mono, fontSize: 10, color: JK.steel3, lineHeight: 1.5 }}>
          ⓘ Token auto-refreshes every 100 days. Next renewal in 47 days.
        </div>
      </div>

      <div style={{ background: JK.ink3, border: `1px solid ${JK.ink4}` }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${JK.ink4}`, display: 'flex', justifyContent: 'space-between' }}>
          <SectionLabel style={{ color: JK.steel3 }}>EVENT LOG</SectionLabel>
          <MonoStrip>↻ AUTO-REFRESH 5S</MonoStrip>
        </div>
        {events.map((e, i) => (
          <div key={i} style={{
            padding: '12px 18px', display: 'grid', gridTemplateColumns: '90px 100px 1fr 60px',
            gap: 14, alignItems: 'center', borderBottom: i === events.length - 1 ? 0 : `1px solid ${JK.ink4}`,
            fontFamily: JK.mono, fontSize: 11,
          }}>
            <span style={{ color: JK.steel3 }}>{e.t}</span>
            <Pill color={e.src.startsWith('QB') ? JK.lime : e.src.startsWith('PWA') ? JK.orange : JK.steel3}>{e.src}</Pill>
            <span style={{ color: JK.bone, fontFamily: JK.body, fontSize: 13 }}>{e.desc}</span>
            <span style={{ color: e.ok ? JK.green : JK.red, fontWeight: 700 }}>{e.ok ? '✓ OK' : '✗ ERR'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AdminApp });
