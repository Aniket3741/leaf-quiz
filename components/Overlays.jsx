'use client';
import { useEffect, useRef, useState } from 'react';

const Ov = ({ children }) => (
  <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-3 sm:p-6">
    <div className="max-h-[92%] w-full max-w-xl animate-[fadeIn_.3s] overflow-auto rounded-2xl border border-white/20 bg-emerald-950/95 p-4 text-sm text-emerald-50 shadow-2xl sm:p-6 sm:text-base">{children}</div>
  </div>
);
const Btn = ({ className = '', ...p }) => (
  <button className={`cursor-pointer rounded-xl bg-amber-300 px-5 py-3 font-bold text-emerald-950 transition hover:-translate-y-0.5 active:scale-95 ${className}`} {...p} />
);
const H = ({ children }) => <h2 className="mb-2 text-xl font-bold text-amber-300 sm:text-2xl">{children}</h2>;

export function Menu({ onStart }) {
  return (
    <Ov>
      <h1 className="text-3xl font-extrabold text-amber-300 sm:text-4xl">🌿 Leaf Quest</h1>
      <p className="mb-3 text-emerald-300">The Photosynthesis Trail · Grades 6–8 Science</p>
      <p className="mb-3">The Great Garden has lost its sunlight magic! Walk the trail, learn at each Learning Crystal, dodge or stomp the Blight Bugs, and answer the Gate Questions to restore the garden.</p>
      <ul className="mb-4 list-disc space-y-1 pl-5">
        <li><b>Move:</b> WASD / Arrows or joystick</li>
        <li><b>Look:</b> drag mouse or screen</li>
        <li><b>Jump:</b> Space (stomp bugs from above!)</li>
        <li><b>Learn:</b> press E (or Use) near a crystal</li>
        <li>A <b>wrong answer</b> sends you back to the start and re-locks all gates.</li>
      </ul>
      <Btn onClick={onStart}>▶ Start Adventure</Btn>
    </Ov>
  );
}

export function Learn({ lesson, onDone }) {
  return (
    <Ov>
      <H>{lesson.t}</H>
      <div className="my-3 flex flex-wrap justify-center gap-2 text-2xl sm:text-3xl">{lesson.d}</div>
      <p className="mb-4 leading-relaxed">{lesson.x}</p>
      <Btn onClick={onDone}>Got it! Continue</Btn>
    </Ov>
  );
}

export function Question({ idx, q, res, onPick, onReturn }) {
  return (
    <Ov>
      <H>🚪 Gate {idx + 1} Question</H>
      <p className="mb-3 leading-relaxed">{q.q}</p>
      <div className="space-y-2">
        {q.o.map((t, k) => {
          let st = 'bg-white/10 border-white/20 hover:bg-white/20';
          if (res && k === q.c) st = 'bg-emerald-400 text-emerald-950 border-emerald-300';
          else if (res && res.k === k) st = 'bg-red-500 text-white border-red-300';
          return (
            <button key={k} disabled={!!res} onClick={() => onPick(k)} className={`block w-full cursor-pointer rounded-xl border px-4 py-3 text-left transition disabled:cursor-default ${st}`}>
  {'ABCD'[k]}. {t}
</button>
          );
        })}
      </div>
      {res && (
        <p className="mt-3 leading-relaxed">
          {res.ok ? '✅ Correct! ' : '❌ Not quite. '}{q.e}{!res.ok && ' The magic fades and you return to the start.'}
        </p>
      )}
      {res && !res.ok && <Btn className="mt-3" onClick={onReturn}>↩ Return to Start</Btn>}
    </Ov>
  );
}
export function Confetti() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, x = c.getContext('2d'), dpr = Math.min(devicePixelRatio, 2);
    const fit = () => { c.width = innerWidth * dpr; c.height = innerHeight * dpr; };
    fit(); addEventListener('resize', fit);
    const colors = ['#ffd54a', '#3ddc84', '#42a5f5', '#ff6fa5', '#ffffff', '#ff8a3d'], ps = [];
    const burst = (side) => {
      for (let i = 0; i < 70; i++) {
        const a = (side ? -Math.PI * 0.35 : -Math.PI * 0.65) + (Math.random() - 0.5) * 0.9, sp = (8 + Math.random() * 12) * dpr;
        ps.push({ x: side ? 0 : c.width, y: c.height * 0.85, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, w: (6 + Math.random() * 6) * dpr, h: (4 + Math.random() * 5) * dpr,
          r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: colors[(Math.random() * colors.length) | 0] });
      }
    };
    let n = 0, raf; const iv = setInterval(() => { burst(0); burst(1); if (++n >= 5) clearInterval(iv); }, 600);
    burst(0); burst(1);
    const loop = () => {
      raf = requestAnimationFrame(loop); x.clearRect(0, 0, c.width, c.height);
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i]; p.vy += 0.35 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        if (p.y > c.height + 40) { ps.splice(i, 1); continue; }
        x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); x.restore();
      }
    };
    loop();
    return () => { clearInterval(iv); cancelAnimationFrame(raf); removeEventListener('resize', fit); };
  }, []);
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-40 h-full w-full" />;
}
export function Win({ coins, onAgain }) {
  return (
    <Ov>
      <h1 className="text-3xl font-extrabold text-amber-300">🎉 Garden Restored!</h1>
      <p className="my-3">You mastered photosynthesis and brought sunlight back to the Great Garden.</p>
      <p className="mb-4">Coins collected: {coins}</p>
      <Btn onClick={onAgain}>Play Again</Btn>
    </Ov>
  );
}

const SoundIcon = ({ muted }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 5 6 9H3v6h3l5 4V5z" fill="currentColor" />
    {muted ? (
      <>
        <line x1="16" y1="9" x2="22" y2="15" />
        <line x1="22" y1="9" x2="16" y2="15" />
      </>
    ) : (
      <>
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </>
    )}
  </svg>
);

const HeartIcon = ({ on }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true">
    <path d="M12 21s-7.5-4.6-9.7-9.3A5.4 5.4 0 0 1 12 6.2a5.4 5.4 0 0 1 9.7 5.5C19.5 16.4 12 21 12 21z" fill={on ? '#ef4444' : 'rgba(255,255,255,.25)'} />
  </svg>
);
const CoinIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true">
    <circle cx="12" cy="12" r="9.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
    <circle cx="12" cy="12" r="5.5" fill="none" stroke="#b45309" strokeWidth="1.5" />
  </svg>
);
const GateIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 21V9a8 8 0 0 1 16 0v12" />
    <path d="M12 3v18M4 12h16" />
  </svg>
);

export function Hud({ ui, muted, onMute }) {
  const pill = 'rounded-full border border-white/20 bg-emerald-950/90 px-3 py-1.5 text-xs text-white sm:text-sm';
  return (
    <>
      <div className="pointer-events-none fixed left-2 right-14 top-[max(0.5rem,env(safe-area-inset-top))] z-10 flex flex-wrap gap-2">
        <div className={`${pill} flex items-center gap-1`}>{[0, 1, 2].map((i) => <HeartIcon key={i} on={i < ui.hp} />)}</div>
<div className={`${pill} flex items-center gap-1.5`}><CoinIcon /> {ui.coins}</div>
<div className={`${pill} flex items-center gap-1.5`}><GateIcon /> Gate {Math.min(ui.gi + 1, 4)} / 4</div>
      </div>
    <button onClick={onMute} aria-label={muted ? 'Unmute' : 'Mute'} className="fixed right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-emerald-950/90 text-white transition hover:bg-emerald-800 active:scale-90 sm:h-11 sm:w-11">
  <SoundIcon muted={muted} />
</button>
      <div className="pointer-events-none fixed bottom-[max(0.9rem,env(safe-area-inset-bottom))] left-1/2 z-10 max-w-[90%] -translate-x-1/2 rounded-xl border border-white/20 bg-emerald-950/90 px-4 py-2 text-center text-xs text-white sm:text-sm">{ui.hint}</div>
    </>
  );
}

export function Touch({ onJoy, onJump, onUse }) {
  const box = useRef(null), id = useRef(null);
  const [k, setK] = useState({ x: 0, y: 0 });
  const move = (e) => {
    const r = box.current.getBoundingClientRect();
    let x = (e.clientX - r.left - r.width / 2) / (r.width / 2.4), y = (e.clientY - r.top - r.height / 2) / (r.height / 2.4);
    const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
    setK({ x, y }); onJoy(x, -y);
  };
  const b = 'h-16 w-16 rounded-full bg-amber-300/90 text-sm font-bold text-emerald-950 active:scale-90 sm:h-20 sm:w-20';
  return (
    <div className="hidden [@media(pointer:coarse)]:block">
      <div ref={box} className="fixed bottom-[max(3.5rem,env(safe-area-inset-bottom))] left-5 z-10 h-28 w-28 rounded-full border-2 border-white/20 bg-white/10"
        onPointerDown={(e) => { id.current = e.pointerId; box.current.setPointerCapture(e.pointerId); move(e); }}
        onPointerMove={(e) => e.pointerId === id.current && move(e)}
        onPointerUp={() => { id.current = null; setK({ x: 0, y: 0 }); onJoy(0, 0); }}>
        <div className="absolute h-10 w-10 rounded-full bg-amber-300" style={{ left: `calc(50% - 20px + ${k.x * 36}px)`, top: `calc(50% - 20px + ${k.y * 36}px)` }} />
      </div>
    <div className="fixed bottom-[max(3.5rem,env(safe-area-inset-bottom))] right-5 z-10 flex flex-col items-center gap-4">
  <button className={b} onPointerDown={onUse}>Use</button>
  <button className={b} onPointerDown={onJump}>Jump</button>
</div>
    </div>
  );
}
