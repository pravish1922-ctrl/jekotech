// booking-flow.jsx — 8-step booking flow for customer PWA
// Steps: 0 service · 1 date/time · 2 reg → QB lookup · 3 history · 4 notes · 5 photos · 6 confirm · 7 done

const { useState: useState_b, useEffect: useEffect_b, useMemo: useMemo_b } = React;

function BookingFlow({ step, setStep, draft, update, onClose }) {
  const TOTAL = 7; // 0..6 inputs, 7 = done
  const stepLabels = ['SERVICE', 'WHEN', 'VEHICLE', 'HISTORY', 'NOTES', 'PHOTOS', 'CONFIRM'];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: JK.bone }}>
      {/* HEADER */}
      <div style={{ background: JK.ink, color: JK.bone, padding: '20px 22px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : onClose()} style={{ ...ghostBtn, color: JK.bone }}>
            {step === 0 ? '✕ CLOSE' : '← BACK'}
          </button>
          <MonoStrip>STEP {Math.min(step + 1, TOTAL)} / {TOTAL}</MonoStrip>
        </div>
        <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
          {Array.from({ length: TOTAL }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3,
              background: i <= step ? JK.orange : JK.ink4,
              transition: 'background 0.2s',
            }}/>
          ))}
        </div>
        <div style={{ marginTop: 10, fontFamily: JK.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {step === 7 ? 'Booked.' : stepLabels[step]?.charAt(0) + stepLabels[step]?.slice(1).toLowerCase()}
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="jk-scrollbar">
        {step === 0 && <StepService draft={draft} update={update} />}
        {step === 1 && <StepDateTime draft={draft} update={update} />}
        {step === 2 && <StepReg draft={draft} update={update} />}
        {step === 3 && <StepHistory draft={draft} />}
        {step === 4 && <StepNotes draft={draft} update={update} />}
        {step === 5 && <StepPhotos draft={draft} update={update} />}
        {step === 6 && <StepConfirm draft={draft} />}
        {step === 7 && <StepDone draft={draft} onClose={onClose} />}
      </div>

      {/* FOOTER */}
      {step < 7 && (
        <div style={{ padding: 18, borderTop: `1px solid ${JK.bone3}`, background: JK.bone, display: 'flex', gap: 10 }}>
          {step === 6 ? (
            <JKButton variant="primary" full size="lg" onClick={() => { update({ ref: 'JK-1212' }); setStep(7); }}>
              CONFIRM BOOKING ✓
            </JKButton>
          ) : (
            <JKButton variant="dark" full size="lg" onClick={() => setStep(step + 1)} disabled={!canAdvance(step, draft)}>
              CONTINUE →
            </JKButton>
          )}
        </div>
      )}
    </div>
  );
}

function canAdvance(step, d) {
  if (step === 0) return !!d.service;
  if (step === 1) return !!d.date && !!d.time;
  if (step === 2) return !!d.car;
  return true;
}

// ── STEP 0: Service picker ─────────────────────────────────────────────
function StepService({ draft, update }) {
  return (
    <div style={{ padding: 20 }}>
      <p style={{ fontSize: 13, color: JK.steel, marginBottom: 14 }}>Pick the work. We'll quote on confirmation.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {FIXTURES.services.map(s => {
          const sel = draft.service?.id === s.id;
          return (
            <button key={s.id} onClick={() => update({ service: s })} style={{
              textAlign: 'left', padding: 16, cursor: 'pointer',
              background: sel ? JK.ink : '#fff',
              color: sel ? JK.bone : JK.ink,
              border: `1.5px solid ${sel ? JK.ink : JK.bone3}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ fontFamily: JK.display, fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em' }}>{s.name}</div>
                  <div style={{ fontFamily: JK.mono, fontSize: 10, color: sel ? JK.steel3 : JK.steel2 }}>· {s.dur}</div>
                </div>
                <div style={{ fontSize: 12, marginTop: 4, color: sel ? JK.steel3 : JK.steel, lineHeight: 1.4 }}>{s.desc}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: JK.mono, fontSize: 9, color: sel ? JK.steel3 : JK.steel2 }}>FROM</div>
                <div style={{ fontFamily: JK.display, fontWeight: 700, fontSize: 22, letterSpacing: '-0.01em',
                  color: sel ? JK.orange : JK.ink }}>£{s.price}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── STEP 1: Date + time (Airtable availability) ────────────────────────
function StepDateTime({ draft, update }) {
  // Generate next 14 days
  const days = useMemo_b(() => {
    const arr = [];
    const start = new Date(2025, 10, 14); // Nov 14 baseline
    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const slots = [4, 3, 2, 4, 1, 0, 4, 3, 2, 4, 4, 0, 3, 2][i];
      arr.push({ d, slots, max: 4 });
    }
    return arr;
  }, []);

  const slotTimes = ['08:30', '10:30', '13:00', '15:30'];

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <p style={{ fontSize: 13, color: JK.steel }}>Live from Airtable. 4 bays max per day.</p>
        <div style={{ display: 'flex', gap: 10, fontFamily: JK.mono, fontSize: 9, letterSpacing: '0.05em', color: JK.steel2 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Dot color={JK.green} size={6}/> OPEN</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Dot color={JK.yellow} size={6}/> LOW</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Dot color={JK.red} size={6}/> FULL</span>
        </div>
      </div>

      {/* Day strip */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', marginTop: 14, paddingBottom: 6 }} className="jk-scrollbar">
        {days.map((day, i) => {
          const key = day.d.toISOString().slice(0, 10);
          const sel = draft.date === key;
          const full = day.slots === 0;
          const dot = full ? JK.red : day.slots < 2 ? JK.yellow : JK.green;
          return (
            <button key={i} disabled={full} onClick={() => update({ date: key, time: null })} style={{
              minWidth: 60, padding: '10px 6px',
              background: sel ? JK.ink : '#fff',
              color: sel ? JK.bone : full ? JK.steel2 : JK.ink,
              border: `1.5px solid ${sel ? JK.ink : JK.bone3}`,
              cursor: full ? 'not-allowed' : 'pointer', opacity: full ? 0.5 : 1,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              flexShrink: 0,
            }}>
              <div style={{ fontFamily: JK.mono, fontSize: 9, letterSpacing: '0.1em', opacity: 0.7 }}>
                {day.d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}
              </div>
              <div style={{ fontFamily: JK.display, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {day.d.getDate()}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: JK.mono, fontSize: 9 }}>
                <Dot color={dot} size={5}/>
                <span>{day.slots}/{day.max}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {draft.date && (
        <div style={{ marginTop: 22 }}>
          <SectionLabel>AVAILABLE TIMES · {draft.date}</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
            {slotTimes.map((t, i) => {
              const taken = i === 1; // mock one taken slot
              const sel = draft.time === t;
              return (
                <button key={t} disabled={taken} onClick={() => update({ time: t })} style={{
                  padding: '14px 12px', textAlign: 'left',
                  background: sel ? JK.orange : taken ? JK.bone2 : '#fff',
                  color: sel ? '#fff' : taken ? JK.steel2 : JK.ink,
                  border: `1.5px solid ${sel ? JK.orange : taken ? JK.bone2 : JK.bone3}`,
                  cursor: taken ? 'not-allowed' : 'pointer',
                  textDecoration: taken ? 'line-through' : 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontFamily: JK.mono, fontSize: 18, fontWeight: 700, letterSpacing: '0.02em' }}>{t}</span>
                  <span style={{ fontFamily: JK.mono, fontSize: 9, opacity: 0.7 }}>
                    {taken ? 'TAKEN' : `BAY 0${i + 1}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── STEP 2: Registration → QuickBooks lookup ───────────────────────────
function StepReg({ draft, update }) {
  const [reg, setReg] = useState_b(draft.reg || '');
  const [state, setState] = useState_b('idle'); // idle | scanning | found | manual

  useEffect_b(() => {
    if (draft.car) setState('found');
  }, []);

  const lookup = () => {
    setState('scanning');
    setTimeout(() => {
      const found = FIXTURES.user.cars.find(c => c.reg.replace(/\s/g, '').toUpperCase() === reg.replace(/\s/g, '').toUpperCase());
      if (found) {
        update({ reg, car: found, history: FIXTURES.user.history });
        setState('found');
      } else {
        update({ reg, car: null });
        setState('manual');
      }
    }, 1400);
  };

  return (
    <div style={{ padding: 20 }}>
      <p style={{ fontSize: 13, color: JK.steel, marginBottom: 14 }}>
        We'll pull your car details from QuickBooks records.
      </p>

      {/* UK plate input */}
      <div style={{ display: 'flex', alignItems: 'stretch', border: `2px solid ${JK.ink}`, background: JK.yellow }}>
        <div style={{
          width: 28, background: JK.ink, color: JK.yellow, fontFamily: JK.mono,
          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
        }}>
          <span>UK</span>
          <span style={{ fontSize: 11 }}>★</span>
        </div>
        <input
          value={reg}
          onChange={e => setReg(e.target.value.toUpperCase())}
          placeholder="AB12 CDE"
          style={{
            flex: 1, border: 0, outline: 0, background: 'transparent',
            fontFamily: JK.display, fontSize: 32, fontWeight: 700,
            color: JK.ink, padding: '14px 16px', letterSpacing: '0.06em',
            textAlign: 'center', textTransform: 'uppercase',
          }}
        />
      </div>

      {/* lookup button */}
      <div style={{ marginTop: 14 }}>
        {state === 'idle' && (
          <JKButton variant="dark" full size="md" onClick={lookup} disabled={reg.replace(/\s/g, '').length < 5}>
            LOOK UP IN QUICKBOOKS →
          </JKButton>
        )}
        {state === 'scanning' && <ScanningCard reg={reg} />}
        {state === 'found' && <FoundCard car={draft.car} onChange={() => { setState('idle'); update({ car: null, reg: '' }); setReg(''); }}/>}
        {state === 'manual' && <ManualEntry reg={reg} onSave={(car) => { update({ car }); setState('found'); }} />}
      </div>
    </div>
  );
}

function ScanningCard({ reg }) {
  return (
    <div style={{
      background: JK.ink, color: JK.bone, padding: 18,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, transparent, ${JK.orange}40, transparent)`,
        animation: 'jkscan 1.4s linear infinite',
      }}/>
      <MonoStrip>QUICKBOOKS · QBO API</MonoStrip>
      <div style={{ marginTop: 8, fontFamily: JK.mono, fontSize: 12, color: JK.lime }}>
        ⟫ matching <span style={{ color: JK.bone }}>{reg.toUpperCase()}</span>...
        <span style={{ animation: 'jkblink 1s infinite' }}>▊</span>
      </div>
      <div style={{ marginTop: 12, fontFamily: JK.mono, fontSize: 10, color: JK.steel3 }}>
        ✓ Identifying VIN · ✓ Loading service log · Syncing
      </div>
    </div>
  );
}

function FoundCard({ car, onChange }) {
  if (!car) return null;
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${JK.green}`, padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pill color={JK.green}>✓ FOUND IN QB</Pill>
        <button onClick={onChange} style={{ ...ghostBtn, color: JK.ink, textDecoration: 'underline' }}>CHANGE</button>
      </div>
      <div style={{ fontFamily: JK.display, fontWeight: 700, fontSize: 22, marginTop: 12, letterSpacing: '-0.01em' }}>
        {car.year} {car.make} {car.model}
      </div>
      <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
        background: JK.bone, border: `1px solid ${JK.bone3}` }}>
        <KV k="REG"     v={car.reg}     dark={false} style={{ padding: '10px 12px', borderBottom: `1px solid ${JK.bone3}`, borderRight: `1px solid ${JK.bone3}` }}/>
        <KV k="MILEAGE" v={`${car.mileage.toLocaleString()} mi`} dark={false} style={{ padding: '10px 12px', borderBottom: `1px solid ${JK.bone3}` }}/>
        <KV k="COLOUR"  v={car.color}   dark={false} style={{ padding: '10px 12px', borderRight: `1px solid ${JK.bone3}`, borderBottom: 'none' }}/>
        <KV k="VIN"     v="WVW...3K2"   dark={false} style={{ padding: '10px 12px', borderBottom: 'none' }}/>
      </div>
    </div>
  );
}

function ManualEntry({ reg, onSave }) {
  const [make, setMake] = useState_b('');
  const [model, setModel] = useState_b('');
  const [year, setYear] = useState_b('');
  return (
    <div style={{ background: '#fff', border: `1.5px solid ${JK.yellow}`, padding: 16 }}>
      <Pill color={JK.yellow}>NEW VEHICLE · ADD MANUALLY</Pill>
      <p style={{ fontSize: 12, color: JK.steel, marginTop: 10 }}>
        No record found for <strong style={{ fontFamily: JK.mono, color: JK.ink }}>{reg.toUpperCase()}</strong>. Add the basics — we'll create a QB customer for you.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        <JKInput label="MAKE" value={make} onChange={setMake} placeholder="e.g. BMW" />
        <JKInput label="MODEL" value={model} onChange={setModel} placeholder="e.g. 320d" />
        <JKInput label="YEAR" value={year} onChange={setYear} placeholder="2020" mono />
        <JKButton variant="dark" full onClick={() => onSave({ reg, make, model, year, mileage: 0, color: '—' })} disabled={!make || !model || !year}>
          SAVE VEHICLE →
        </JKButton>
      </div>
    </div>
  );
}

// ── STEP 3: History ────────────────────────────────────────────────────
function StepHistory({ draft }) {
  if (!draft.car) return null;
  return (
    <div style={{ padding: 20 }}>
      <p style={{ fontSize: 13, color: JK.steel, marginBottom: 14 }}>
        Last 4 jobs on <strong style={{ fontFamily: JK.mono, color: JK.ink }}>{draft.car.reg}</strong>. Helps us prep parts.
      </p>

      {/* Mileage gauge */}
      <div style={{ background: JK.ink, color: JK.bone, padding: 16, marginBottom: 14 }}>
        <MonoStrip>CURRENT MILEAGE</MonoStrip>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
          <span style={{ fontFamily: JK.display, fontWeight: 700, fontSize: 36, letterSpacing: '-0.02em' }}>
            {draft.car.mileage.toLocaleString()}
          </span>
          <span style={{ fontFamily: JK.mono, fontSize: 12, color: JK.steel3 }}>mi</span>
        </div>
        <div style={{ marginTop: 10, height: 4, background: JK.ink4, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '78%', background: JK.orange }}/>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: JK.mono, fontSize: 9, color: JK.steel3 }}>
          <span>NEXT MOT · 22 NOV</span>
          <span style={{ color: JK.yellow }}>⚠ DUE IN 8 DAYS</span>
        </div>
      </div>

      <div style={{ background: '#fff', border: `1px solid ${JK.bone3}` }}>
        {(draft.history || []).map((h, i, arr) => (
          <div key={h.ref} style={{
            padding: 14, borderBottom: i === arr.length - 1 ? 0 : `1px solid ${JK.bone2}`,
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <div style={{
              width: 8, height: 8, marginTop: 6, borderRadius: '50%',
              background: i === 0 ? JK.orange : JK.bone3, flexShrink: 0,
            }}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: JK.display, fontWeight: 600, fontSize: 14 }}>{h.service}</span>
                <span style={{ fontFamily: JK.mono, fontSize: 11, fontWeight: 700 }}>£{h.cost}</span>
              </div>
              <div style={{ fontFamily: JK.mono, fontSize: 10, color: JK.steel, marginTop: 2 }}>
                {h.date} · {h.mileage.toLocaleString()}MI · {h.mechanic.toUpperCase()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── STEP 4: Notes ──────────────────────────────────────────────────────
function StepNotes({ draft, update }) {
  const presets = ['Strange noise on braking', 'Engine warning light', 'Pulls to one side', 'Vibration at speed', 'Smell of fuel', 'Check tyres'];
  return (
    <div style={{ padding: 20 }}>
      <p style={{ fontSize: 13, color: JK.steel, marginBottom: 14 }}>Anything specific the workshop should know?</p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        {presets.map(p => {
          const on = (draft.notes || '').includes(p);
          return (
            <button key={p} onClick={() => update({ notes: on ? draft.notes.replace(p, '').trim() : `${draft.notes || ''} ${p}`.trim() })} style={{
              padding: '7px 12px', fontFamily: JK.mono, fontSize: 11, fontWeight: 600,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              background: on ? JK.ink : '#fff', color: on ? JK.bone : JK.ink,
              border: `1.5px solid ${on ? JK.ink : JK.bone3}`, cursor: 'pointer',
            }}>{on ? '✓ ' : '+ '}{p}</button>
          );
        })}
      </div>

      <textarea
        value={draft.notes || ''} onChange={e => update({ notes: e.target.value })}
        placeholder="Describe the symptom, when it started, what you've tried…"
        style={{
          width: '100%', minHeight: 140, padding: 14,
          background: '#fff', border: `1.5px solid ${JK.ink}`,
          fontFamily: JK.body, fontSize: 14, color: JK.ink,
          outline: 0, resize: 'vertical', boxSizing: 'border-box',
        }}
      />
      <div style={{ marginTop: 6, fontFamily: JK.mono, fontSize: 10, color: JK.steel2, textAlign: 'right' }}>
        {(draft.notes || '').length} / 500
      </div>
    </div>
  );
}

// ── STEP 5: Photos ─────────────────────────────────────────────────────
function StepPhotos({ draft, update }) {
  const photos = draft.photos || [];
  const addPhoto = () => update({ photos: [...photos, { id: Date.now(), label: `IMG_${1041 + photos.length}` }] });
  return (
    <div style={{ padding: 20 }}>
      <p style={{ fontSize: 13, color: JK.steel, marginBottom: 14 }}>Optional. Upload photos of damage or warning lights.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {photos.map(p => (
          <div key={p.id} style={{ position: 'relative', aspectRatio: '1', background: JK.bone2, border: `1px solid ${JK.bone3}` }}>
            <ImgPlaceholder w="100%" h="100%" label={p.label} />
            <button onClick={() => update({ photos: photos.filter(x => x.id !== p.id) })} style={{
              position: 'absolute', top: 6, right: 6, width: 24, height: 24,
              background: JK.ink, color: JK.bone, border: 0, fontFamily: JK.mono, fontSize: 11, cursor: 'pointer',
            }}>✕</button>
          </div>
        ))}
        <button onClick={addPhoto} style={{
          aspectRatio: '1', background: '#fff',
          border: `1.5px dashed ${JK.ink}`, cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span style={{ fontFamily: JK.display, fontSize: 32, fontWeight: 300, color: JK.ink, lineHeight: 1 }}>+</span>
          <span style={{ fontFamily: JK.mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: JK.steel }}>
            ADD PHOTO
          </span>
        </button>
      </div>

      <div style={{ marginTop: 14, padding: 12, background: JK.ink, color: JK.steel3, fontFamily: JK.mono, fontSize: 10, lineHeight: 1.5 }}>
        ⓘ Photos are private. Visible only to assigned mechanic + admin.
      </div>
    </div>
  );
}

// ── STEP 6: Confirmation summary + WhatsApp preview ────────────────────
function StepConfirm({ draft }) {
  return (
    <div style={{ padding: 20 }}>
      {/* Receipt */}
      <div style={{
        background: '#fff', border: `1.5px solid ${JK.ink}`, padding: 18,
        boxShadow: `4px 4px 0 ${JK.ink}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <MonoStrip style={{ color: 'rgba(11,13,14,0.55)' }}>BOOKING SUMMARY</MonoStrip>
          <MonoStrip style={{ color: 'rgba(11,13,14,0.55)' }}>DRAFT</MonoStrip>
        </div>
        <div style={{ fontFamily: JK.display, fontSize: 26, fontWeight: 700, marginTop: 8, letterSpacing: '-0.02em' }}>
          {draft.service?.name}
        </div>
        <div style={{ fontFamily: JK.mono, fontSize: 11, color: JK.steel, marginTop: 2 }}>
          {draft.date} · {draft.time} · est. {draft.service?.dur}
        </div>

        <div style={{ marginTop: 14 }}>
          <KV k="VEHICLE"  v={draft.car ? `${draft.car.make} ${draft.car.model}` : '—'} dark={false} />
          <KV k="REG"      v={draft.car?.reg || '—'} dark={false} />
          <KV k="MILEAGE"  v={draft.car ? `${draft.car.mileage.toLocaleString()} mi` : '—'} dark={false} />
          <KV k="MECHANIC" v="ASSIGNED ON ARRIVAL" dark={false} />
          <KV k="BAY"      v="ASSIGNED ON ARRIVAL" dark={false} />
        </div>

        {draft.notes && (
          <div style={{ marginTop: 14, padding: 12, background: JK.bone, border: `1px dashed ${JK.bone3}` }}>
            <div style={{ fontFamily: JK.mono, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', color: JK.steel, marginBottom: 4 }}>NOTES</div>
            <div style={{ fontSize: 12, color: JK.ink, lineHeight: 1.4 }}>{draft.notes}</div>
          </div>
        )}

        <div style={{ marginTop: 14, paddingTop: 14, borderTop: `2px dashed ${JK.bone3}`, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontFamily: JK.mono, fontSize: 10, color: JK.steel }}>EST. TOTAL</span>
          <span style={{ fontFamily: JK.display, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>£{draft.service?.price || 0}</span>
        </div>
      </div>

      {/* WhatsApp preview */}
      <div style={{ marginTop: 18 }}>
        <SectionLabel>WHATSAPP CONFIRMATION (PREVIEW)</SectionLabel>
        <div style={{ marginTop: 10, padding: 14, background: '#0e3b2e', color: '#fff', borderRadius: 0, fontFamily: JK.mono, fontSize: 11, lineHeight: 1.6 }}>
          <div style={{ color: '#7fdc9c', fontWeight: 700 }}>JEKOTECH GARAGE</div>
          <div style={{ marginTop: 6 }}>
            ✅ Booking received<br/>
            REF · JK-1212<br/>
            {draft.service?.name} · {draft.date} {draft.time}<br/>
            VEH · {draft.car?.reg || '—'}<br/>
            EST · £{draft.service?.price}
          </div>
          <div style={{ marginTop: 6, color: '#a8c9b8' }}>
            We'll confirm + assign mechanic shortly. Reply STOP to opt out.
          </div>
        </div>
        <div style={{ marginTop: 8, fontFamily: JK.mono, fontSize: 9, color: JK.steel2 }}>
          → SENT TO +44 7700 900 421 · ALSO TO ADMIN BOT
        </div>
      </div>
    </div>
  );
}

// ── STEP 7: Done ───────────────────────────────────────────────────────
function StepDone({ draft, onClose }) {
  return (
    <div style={{ padding: '40px 24px', textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 80, height: 80, background: JK.orange, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: JK.display, fontWeight: 700, fontSize: 40,
      }}>✓</div>
      <MonoStrip style={{ color: JK.steel, marginTop: 18, justifyContent: 'center' }}>BOOKING REF</MonoStrip>
      <div style={{ fontFamily: JK.display, fontSize: 36, fontWeight: 700, color: JK.ink, marginTop: 4, letterSpacing: '-0.02em' }}>
        {draft.ref || 'JK-1212'}
      </div>
      <p style={{ marginTop: 12, color: JK.steel, fontSize: 14, maxWidth: 280, lineHeight: 1.5 }}>
        Confirmation sent to your phone. We'll WhatsApp once a mechanic is assigned.
      </p>

      <div style={{ marginTop: 24, width: '100%', maxWidth: 280 }}>
        <JKButton variant="dark" full size="lg" onClick={onClose}>BACK TO DASHBOARD →</JKButton>
        <button style={{ marginTop: 12, ...ghostBtn, color: JK.ink, fontSize: 11, width: '100%' }}>
          ADD TO CALENDAR
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { BookingFlow });
